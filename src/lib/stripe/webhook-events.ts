import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Idempotency guard shared by both Stripe webhook endpoints.
 *
 * The original guard claimed an event by INSERTing its id and treated any
 * 23505 unique_violation as "already handled, ack with 200". That made a
 * handler failure permanent: the handler threw, the route returned 500,
 * Stripe retried, the retry hit 23505 and got a 200 back without the handler
 * ever running again. Stripe recorded the delivery as successful and the
 * enrollment was silently dropped — for a paid subscription, a charged parent
 * with no account.
 *
 * The claim row is therefore no longer the completion marker. `processed_at`
 * is. A row exists from the first delivery onward, but only a stamped
 * `processed_at` means the work is done; a row with `error_message` set and
 * `processed_at` still NULL is a failed attempt that a retry may re-run.
 */
export type WebhookClaim =
  /** This delivery owns the event — run the handler. */
  | { status: "claimed" }
  /** Already completed by an earlier delivery — ack, do not re-run. */
  | { status: "duplicate" }
  /** Another delivery is mid-flight — ack, let that one finish. */
  | { status: "in_flight" }
  /** The claim itself failed; caller should 500 so Stripe retries. */
  | { status: "error"; message: string };

export async function claimWebhookEvent(
  eventId: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<WebhookClaim> {
  const { error: insertErr } = await supabaseAdmin
    .from("stripe_webhook_events")
    .insert({
      stripe_event_id: eventId,
      event_type: eventType,
      payload_json: payload,
    });

  if (!insertErr) return { status: "claimed" };

  // 23505 = unique_violation. Some earlier delivery of this same event id
  // already inserted the row. Whether we may re-run depends on how that
  // attempt ended, not on the row's mere existence.
  if (insertErr.code !== "23505") {
    return { status: "error", message: insertErr.message };
  }

  const { data: existing, error: readErr } = await supabaseAdmin
    .from("stripe_webhook_events")
    .select("processed_at, error_message")
    .eq("stripe_event_id", eventId)
    .maybeSingle();

  if (readErr) return { status: "error", message: readErr.message };

  // Row vanished between the insert and the read (manual cleanup, most
  // likely). Nothing has been processed, so let this delivery proceed.
  if (!existing) return { status: "claimed" };

  if (existing.processed_at) return { status: "duplicate" };

  // processed_at NULL and error_message NULL means a delivery is still
  // running. Re-entering would double-process, so stand down. If that
  // attempt fails it will stamp error_message and a later Stripe retry
  // picks the work up below.
  if (!existing.error_message) return { status: "in_flight" };

  // A prior attempt finished and failed. Take the retry slot atomically —
  // the predicate is evaluated inside the UPDATE, so concurrent retries
  // cannot both win it.
  const { data: retried, error: retryErr } = await supabaseAdmin
    .from("stripe_webhook_events")
    .update({ error_message: null })
    .eq("stripe_event_id", eventId)
    .is("processed_at", null)
    .not("error_message", "is", null)
    .select("id");

  if (retryErr) return { status: "error", message: retryErr.message };

  return retried && retried.length > 0
    ? { status: "claimed" }
    : { status: "in_flight" };
}

/** Stamp the event complete so later deliveries dedupe against it. */
export async function markWebhookEventProcessed(
  eventId: string,
  label: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("stripe_webhook_events")
    .update({ processed_at: new Date().toISOString(), error_message: null })
    .eq("stripe_event_id", eventId);

  if (error) {
    console.error(`${label} could not stamp processed_at:`, error.message);
  }
}

/**
 * Record why the handler died. Leaves processed_at NULL, which is what makes
 * the next Stripe retry eligible to re-run the handler.
 */
export async function markWebhookEventFailed(
  eventId: string,
  err: unknown,
  label: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("stripe_webhook_events")
    .update({
      error_message: err instanceof Error ? err.message : "Unknown error",
    })
    .eq("stripe_event_id", eventId);

  if (error) {
    console.error(`${label} could not record error_message:`, error.message);
  }
}
