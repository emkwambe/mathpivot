-- Migration 00050: Stripe webhook event dedupe support
--
-- The insert-as-claim idempotency guard in both Stripe webhook routes
-- (/api/stripe/webhook and /api/stripe/subscription-webhook) relies on a UNIQUE
-- constraint on stripe_webhook_events.stripe_event_id. The insert itself is the
-- lock — a SELECT-then-INSERT would race between concurrent deliveries — and a
-- 23505 unique_violation means a prior delivery already claimed the event, so
-- the handler must not run again.
--
-- NOTE: that constraint ALREADY EXISTS in this database. Migration 00001
-- declared the column as `stripe_event_id TEXT NOT NULL UNIQUE` (line 382),
-- which Postgres implements as the constraint
-- stripe_webhook_events_stripe_event_id_key. Adding a second unique constraint
-- under a different name would build a redundant index that costs a write on
-- every webhook delivery and buys nothing. This migration therefore ASSERTS the
-- constraint and only creates it if some environment is genuinely missing it.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'stripe_webhook_events'
      AND c.contype = 'u'
      AND (
        SELECT array_agg(a.attname::text ORDER BY a.attname::text)
        FROM unnest(c.conkey) AS k
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k
      ) = ARRAY['stripe_event_id']::text[]
  ) THEN
    ALTER TABLE public.stripe_webhook_events
      ADD CONSTRAINT stripe_webhook_events_event_id_key
      UNIQUE (stripe_event_id);
    RAISE NOTICE 'Added UNIQUE constraint on stripe_webhook_events.stripe_event_id';
  ELSE
    RAISE NOTICE 'UNIQUE constraint on stripe_webhook_events.stripe_event_id already present (from migration 00001) - no change';
  END IF;
END $$;

-- Recovery signal for the claim-before-process trade-off: an event is claimed
-- before its handler runs, so a handler that dies mid-way leaves the row with
-- processed_at IS NULL and a non-null error_message. Those rows need a manual
-- replay. This index supports that sweep.
CREATE INDEX IF NOT EXISTS stripe_webhook_events_processed_idx
  ON public.stripe_webhook_events (processed_at);
