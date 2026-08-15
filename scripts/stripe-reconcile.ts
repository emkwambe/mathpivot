/**
 * Stripe <-> program_subscriptions reconciliation audit.
 *
 * READ ONLY. This script performs no writes of any kind:
 *   - Supabase access is limited to .select()
 *   - Stripe access is limited to .list()
 *   - The only thing written anywhere is the local Markdown report
 *
 * Covers:
 *   C1.1 ORPHANED     — live in Stripe, no program_subscriptions row. These are
 *                       parents who paid and were never provisioned.
 *   C1.2 STATUS DRIFT — row exists but its status disagrees with Stripe.
 *                       Stripe past_due/unpaid showing as active locally means
 *                       a failed payer still looks like a paying customer.
 *   C1.3 NULL PERIODS — rows missing current_period_start / current_period_end,
 *                       shown next to the correct values read from Stripe.
 *   plus STALE        — row exists, subscription gone from Stripe entirely.
 *
 * Run with:  npm run reconcile
 */

import { config as loadEnv } from "dotenv";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type Stripe from "stripe";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");

// Env must be loaded before the Stripe client module is imported: that module
// throws at import time on a missing or malformed STRIPE_SECRET_KEY. Hence the
// dynamic imports further down rather than static ones at the top.
const ENV_PATH = resolve(REPO_ROOT, ".env.local");
if (!existsSync(ENV_PATH)) {
  console.error(`Missing env file: ${ENV_PATH}`);
  process.exit(1);
}
loadEnv({ path: ENV_PATH });

const REPORT_PATH = resolve(
  REPO_ROOT,
  "sprints",
  "sprint 6-hardening",
  "RECONCILE-REPORT.md",
);

/** Hard stop so a pagination bug cannot spin forever. 100 pages = 10k subs. */
const MAX_STRIPE_PAGES = 100;
const SUPABASE_PAGE_SIZE = 1000;

interface ProgramSubscriptionRow {
  id: string;
  parent_email: string | null;
  parent_name: string | null;
  parent_user_id: string | null;
  student_name: string | null;
  student_grade: number | null;
  program_tier: string | null;
  price_monthly_cents: number | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string;
  stripe_price_id: string | null;
  status: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  canceled_at: string | null;
  created_at: string | null;
}

interface OrphanedFinding {
  subscriptionId: string;
  email: string | null;
  customerId: string | null;
  tier: string;
  tierSource: string;
  status: string;
  created: string;
  amount: string;
}

interface DriftFinding {
  subscriptionId: string;
  email: string | null;
  localStatus: string;
  stripeStatus: string;
  severity: "REVENUE" | "INFO";
}

interface NullPeriodFinding {
  subscriptionId: string;
  email: string | null;
  localStart: string | null;
  localEnd: string | null;
  stripeStart: string | null;
  stripeEnd: string | null;
  resolvable: boolean;
}

interface StaleFinding {
  subscriptionId: string;
  email: string | null;
  localStatus: string;
  createdAt: string | null;
}

/**
 * Same item-first-then-root extraction used by the subscription webhook (S4).
 * Verified against this account: current_period_* exists only on
 * items.data[0] under both 2025-12-15.clover and 2026-05-27.dahlia. The root
 * fallback covers older API versions still configured on some endpoints.
 */
function periodFrom(sub: Stripe.Subscription): {
  start: string | null;
  end: string | null;
} {
  const item = sub.items?.data?.[0] as
    | { current_period_start?: number; current_period_end?: number }
    | undefined;
  const legacy = sub as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };

  return {
    start: toIsoNullable(
      item?.current_period_start ?? legacy.current_period_start,
    ),
    end: toIsoNullable(item?.current_period_end ?? legacy.current_period_end),
  };
}

function toIsoNullable(epochSeconds: number | null | undefined): string | null {
  if (!epochSeconds) return null;
  return new Date(epochSeconds * 1000).toISOString();
}

/** j***@example.com — console output only. The Markdown report keeps full values. */
function maskEmail(email: string | null | undefined): string {
  if (!email) return "(no email)";
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  return `${email[0]}***${email.slice(at)}`;
}

function fmtMoney(cents: number | null | undefined, currency = "usd"): string {
  if (cents == null) return "(unknown)";
  return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "NULL";
  return iso.slice(0, 10);
}

function pad(value: string, width: number): string {
  return value.length > width
    ? `${value.slice(0, width - 1)}…`
    : value.padEnd(width);
}

function printTable(headers: string[], widths: number[], rows: string[][]) {
  const line = widths.map((w) => "-".repeat(w)).join("-+-");
  console.log(headers.map((h, i) => pad(h, widths[i])).join(" | "));
  console.log(line);
  for (const r of rows) {
    console.log(r.map((c, i) => pad(c, widths[i])).join(" | "));
  }
}

async function main() {
  const { stripe } = await import("../src/lib/stripe/index");
  const { supabaseAdmin } = await import("../src/lib/supabase/admin");
  const { VALID_TIERS, priceIdForTier, isValidTier } =
    await import("../src/lib/stripe/programs");

  const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
  const mode =
    secretKey.startsWith("sk_live_") || secretKey.startsWith("rk_live_")
      ? "LIVE"
      : "TEST";

  console.log("");
  console.log("Stripe reconciliation audit (READ ONLY)");
  console.log(`Stripe mode : ${mode}`);
  console.log(
    `Supabase    : ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(unset)"}`,
  );
  console.log("");

  // Tier mapping comes from programs.ts rather than hardcoded price IDs, so it
  // tracks whatever STRIPE_PRICE_ID_* the environment is pointing at.
  const priceToTier = new Map<string, string>();
  const missingPriceEnv: string[] = [];
  for (const tier of VALID_TIERS) {
    const priceId = priceIdForTier(tier);
    if (priceId) priceToTier.set(priceId, tier);
    else missingPriceEnv.push(tier);
  }

  // ---- 1. All subscriptions from Stripe, every status, paginated ----------
  const stripeSubs: Stripe.Subscription[] = [];
  let startingAfter: string | undefined;
  let pages = 0;
  let truncated = false;

  for (;;) {
    if (pages >= MAX_STRIPE_PAGES) {
      truncated = true;
      break;
    }
    const res: Stripe.ApiList<Stripe.Subscription> =
      await stripe.subscriptions.list({
        status: "all",
        limit: 100,
        expand: ["data.customer"],
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
    pages += 1;
    stripeSubs.push(...res.data);
    if (!res.has_more || res.data.length === 0) break;
    startingAfter = res.data[res.data.length - 1]!.id;
  }

  console.log(
    `Stripe   : ${stripeSubs.length} subscription(s) across ${pages} page(s)${truncated ? " [TRUNCATED at page cap]" : ""}`,
  );

  // ---- 2. All program_subscriptions rows, paginated ----------------------
  const rows: ProgramSubscriptionRow[] = [];
  for (let from = 0; ; from += SUPABASE_PAGE_SIZE) {
    const { data, error } = await supabaseAdmin
      .from("program_subscriptions")
      .select("*")
      .order("created_at", { ascending: true })
      .range(from, from + SUPABASE_PAGE_SIZE - 1);

    if (error) {
      console.error(`Supabase read failed: ${error.message}`);
      process.exit(1);
    }
    const page = (data ?? []) as ProgramSubscriptionRow[];
    rows.push(...page);
    if (page.length < SUPABASE_PAGE_SIZE) break;
  }

  console.log(`Supabase : ${rows.length} program_subscriptions row(s)`);
  console.log("");

  const rowsBySubId = new Map<string, ProgramSubscriptionRow>();
  for (const r of rows) {
    if (r.stripe_subscription_id) rowsBySubId.set(r.stripe_subscription_id, r);
  }
  const stripeById = new Map<string, Stripe.Subscription>();
  for (const s of stripeSubs) stripeById.set(s.id, s);

  // ---- 3. Categorise ------------------------------------------------------
  const orphaned: OrphanedFinding[] = [];
  const orphanedNonLive: OrphanedFinding[] = [];
  const drift: DriftFinding[] = [];
  const nullPeriods: NullPeriodFinding[] = [];
  const stale: StaleFinding[] = [];
  const foreign: { subscriptionId: string; priceId: string; status: string }[] =
    [];

  // Statuses that mean the parent is (or should be) receiving coaching.
  const LIVE_STATUSES = new Set(["active", "trialing", "past_due", "unpaid"]);

  for (const sub of stripeSubs) {
    const item = sub.items?.data?.[0];
    const priceId = item?.price?.id ?? "";
    const metaTier = (sub.metadata?.program_tier ?? "") as string;

    let tier: string | null = priceToTier.get(priceId) ?? null;
    let tierSource = tier ? "price ID" : "";
    if (!tier && isValidTier(metaTier)) {
      tier = metaTier;
      tierSource = "metadata.program_tier";
    }

    // Not a MathPivot coaching subscription — this Stripe account also carries
    // products from other projects. Counted, but never reported as an
    // unprovisioned parent.
    if (!tier) {
      foreign.push({
        subscriptionId: sub.id,
        priceId: priceId || "(none)",
        status: sub.status,
      });
      continue;
    }

    const customer = sub.customer;
    const email =
      typeof customer === "object" && customer && !("deleted" in customer)
        ? ((customer as Stripe.Customer).email ?? null)
        : null;
    const customerId =
      typeof customer === "string" ? customer : (customer?.id ?? null);

    const row = rowsBySubId.get(sub.id);

    if (!row) {
      const finding: OrphanedFinding = {
        subscriptionId: sub.id,
        email,
        customerId,
        tier,
        tierSource,
        status: sub.status,
        created: toIsoNullable(sub.created) ?? "(unknown)",
        amount: fmtMoney(item?.price?.unit_amount, sub.currency),
      };
      if (LIVE_STATUSES.has(sub.status)) orphaned.push(finding);
      else orphanedNonLive.push(finding);
      continue;
    }

    if ((row.status ?? "") !== sub.status) {
      const stripeIsFailing =
        sub.status === "past_due" ||
        sub.status === "unpaid" ||
        sub.status === "canceled";
      const localLooksFine =
        row.status === "active" || row.status === "trialing";
      drift.push({
        subscriptionId: sub.id,
        email: email ?? row.parent_email,
        localStatus: row.status ?? "(null)",
        stripeStatus: sub.status,
        severity: stripeIsFailing && localLooksFine ? "REVENUE" : "INFO",
      });
    }

    if (!row.current_period_start || !row.current_period_end) {
      const period = periodFrom(sub);
      nullPeriods.push({
        subscriptionId: sub.id,
        email: email ?? row.parent_email,
        localStart: row.current_period_start,
        localEnd: row.current_period_end,
        stripeStart: period.start,
        stripeEnd: period.end,
        resolvable: !!(period.start && period.end),
      });
    }
  }

  for (const row of rows) {
    if (!stripeById.has(row.stripe_subscription_id)) {
      stale.push({
        subscriptionId: row.stripe_subscription_id,
        email: row.parent_email,
        localStatus: row.status ?? "(null)",
        createdAt: row.created_at,
      });
    }
  }

  // ---- 4. Console summary -------------------------------------------------
  console.log("SUMMARY");
  printTable(
    ["Category", "Count", "Meaning"],
    [22, 6, 46],
    [
      [
        "ORPHANED (live)",
        String(orphaned.length),
        "C1.1 paid, never provisioned",
      ],
      [
        "ORPHANED (ended)",
        String(orphanedNonLive.length),
        "no row; sub already canceled/expired",
      ],
      ["STATUS DRIFT", String(drift.length), "C1.2 local status != Stripe"],
      [
        "NULL PERIODS",
        String(nullPeriods.length),
        "C1.3 missing period columns",
      ],
      ["STALE", String(stale.length), "row exists, sub gone from Stripe"],
      [
        "FOREIGN (ignored)",
        String(foreign.length),
        "non-MathPivot price, not counted above",
      ],
    ],
  );
  console.log("");

  if (orphaned.length) {
    console.log("ORPHANED — live in Stripe, no local row (C1.1)");
    printTable(
      ["Subscription", "Email", "Tier", "Status", "Created", "Amount"],
      [30, 26, 13, 10, 12, 12],
      orphaned.map((o) => [
        o.subscriptionId,
        maskEmail(o.email),
        o.tier,
        o.status,
        fmtDate(o.created),
        o.amount,
      ]),
    );
    console.log("");
  }

  if (drift.length) {
    console.log("STATUS DRIFT (C1.2)");
    printTable(
      ["Subscription", "Email", "Local", "Stripe", "Severity"],
      [30, 26, 14, 14, 9],
      drift.map((d) => [
        d.subscriptionId,
        maskEmail(d.email),
        d.localStatus,
        d.stripeStatus,
        d.severity,
      ]),
    );
    console.log("");
  }

  if (nullPeriods.length) {
    console.log("NULL PERIODS (C1.3)");
    printTable(
      ["Subscription", "Email", "Stripe start", "Stripe end", "Fixable"],
      [30, 26, 12, 12, 8],
      nullPeriods.map((n) => [
        n.subscriptionId,
        maskEmail(n.email),
        fmtDate(n.stripeStart),
        fmtDate(n.stripeEnd),
        n.resolvable ? "yes" : "NO",
      ]),
    );
    console.log("");
  }

  if (stale.length) {
    console.log("STALE — local row, no Stripe subscription");
    printTable(
      ["Subscription", "Email", "Local status", "Row created"],
      [30, 26, 14, 12],
      stale.map((s) => [
        s.subscriptionId,
        maskEmail(s.email),
        s.localStatus,
        fmtDate(s.createdAt),
      ]),
    );
    console.log("");
  }

  // ---- 5. Markdown report -------------------------------------------------
  const md = buildMarkdown({
    mode,
    generatedAt: new Date().toISOString(),
    stripeCount: stripeSubs.length,
    rowCount: rows.length,
    truncated,
    missingPriceEnv,
    priceToTier,
    orphaned,
    orphanedNonLive,
    drift,
    nullPeriods,
    stale,
    foreign,
  });

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, md, { encoding: "utf8" });
  console.log(`Report written to: ${REPORT_PATH}`);
  console.log("No data was modified. This was a read-only audit.");
}

function buildMarkdown(ctx: {
  mode: string;
  generatedAt: string;
  stripeCount: number;
  rowCount: number;
  truncated: boolean;
  missingPriceEnv: string[];
  priceToTier: Map<string, string>;
  orphaned: OrphanedFinding[];
  orphanedNonLive: OrphanedFinding[];
  drift: DriftFinding[];
  nullPeriods: NullPeriodFinding[];
  stale: StaleFinding[];
  foreign: { subscriptionId: string; priceId: string; status: string }[];
}): string {
  const L: string[] = [];

  L.push("# Stripe Reconciliation Report");
  L.push("");
  L.push(`Generated: ${ctx.generatedAt}`);
  L.push(`Stripe mode: **${ctx.mode}**`);
  L.push("");
  L.push(
    "Read-only audit. No Supabase writes, no Stripe mutations were performed.",
  );
  L.push("");
  L.push("> Emails below are unmasked. Treat this file as confidential.");
  L.push("");

  if (ctx.mode === "TEST") {
    L.push(
      "> **Caveat:** this ran against a TEST-mode Stripe key. If production sells in live mode, these findings do not describe production data.",
    );
    L.push("");
  }
  if (ctx.truncated) {
    L.push(
      "> **Caveat:** Stripe pagination hit the page cap; the subscription list is incomplete.",
    );
    L.push("");
  }
  if (ctx.missingPriceEnv.length) {
    L.push(
      `> **Caveat:** no price ID configured for: ${ctx.missingPriceEnv.join(", ")}. Subscriptions on those tiers can only be matched by metadata.`,
    );
    L.push("");
  }

  L.push("## Summary");
  L.push("");
  L.push("| Category | Count | Meaning |");
  L.push("| --- | ---: | --- |");
  L.push(
    `| ORPHANED (live) | ${ctx.orphaned.length} | C1.1 — paid, never provisioned |`,
  );
  L.push(
    `| ORPHANED (ended) | ${ctx.orphanedNonLive.length} | no row; subscription already canceled/expired |`,
  );
  L.push(
    `| STATUS DRIFT | ${ctx.drift.length} | C1.2 — local status disagrees with Stripe |`,
  );
  L.push(
    `| NULL PERIODS | ${ctx.nullPeriods.length} | C1.3 — missing period columns |`,
  );
  L.push(
    `| STALE | ${ctx.stale.length} | row exists, subscription gone from Stripe |`,
  );
  L.push(
    `| FOREIGN (ignored) | ${ctx.foreign.length} | non-MathPivot price, excluded from all categories |`,
  );
  L.push("");
  L.push(
    `Scanned ${ctx.stripeCount} Stripe subscription(s) against ${ctx.rowCount} \`program_subscriptions\` row(s).`,
  );
  L.push("");

  L.push("Tier mapping in effect (from `STRIPE_PRICE_ID_*`):");
  L.push("");
  L.push("| Price ID | Tier |");
  L.push("| --- | --- |");
  for (const [priceId, tier] of ctx.priceToTier) {
    L.push(`| \`${priceId}\` | ${tier} |`);
  }
  L.push("");

  L.push("## C1.1 — ORPHANED (live in Stripe, no local row)");
  L.push("");
  L.push(
    "These customers are being billed by Stripe but have no `program_subscriptions` row: no parent account, no coach matching, no welcome email.",
  );
  L.push("");
  if (!ctx.orphaned.length) {
    L.push("_None._");
  } else {
    L.push(
      "| Subscription | Email | Customer | Tier | Tier source | Status | Created | Amount |",
    );
    L.push("| --- | --- | --- | --- | --- | --- | --- | ---: |");
    for (const o of ctx.orphaned) {
      L.push(
        `| \`${o.subscriptionId}\` | ${o.email ?? "(no email)"} | \`${o.customerId ?? "-"}\` | ${o.tier} | ${o.tierSource} | ${o.status} | ${fmtDate(o.created)} | ${o.amount} |`,
      );
    }
  }
  L.push("");

  if (ctx.orphanedNonLive.length) {
    L.push("### Orphaned but no longer live");
    L.push("");
    L.push(
      "No local row, but the subscription has already ended. Informational — no active parent is affected.",
    );
    L.push("");
    L.push("| Subscription | Email | Tier | Status | Created | Amount |");
    L.push("| --- | --- | --- | --- | --- | ---: |");
    for (const o of ctx.orphanedNonLive) {
      L.push(
        `| \`${o.subscriptionId}\` | ${o.email ?? "(no email)"} | ${o.tier} | ${o.status} | ${fmtDate(o.created)} | ${o.amount} |`,
      );
    }
    L.push("");
  }

  L.push("## C1.2 — STATUS DRIFT");
  L.push("");
  L.push(
    "`REVENUE` marks a row where Stripe shows the subscription failing or canceled while the local row still reads active or trialing — a parent who has stopped paying but still looks like a customer.",
  );
  L.push("");
  if (!ctx.drift.length) {
    L.push("_None._");
  } else {
    L.push(
      "| Subscription | Email | Local status | Stripe status | Severity |",
    );
    L.push("| --- | --- | --- | --- | --- |");
    for (const d of ctx.drift) {
      L.push(
        `| \`${d.subscriptionId}\` | ${d.email ?? "(no email)"} | ${d.localStatus} | ${d.stripeStatus} | ${d.severity} |`,
      );
    }
  }
  L.push("");

  L.push("## C1.3 — NULL PERIODS");
  L.push("");
  L.push(
    "Rows missing `current_period_start` and/or `current_period_end`, with the correct values read from Stripe. `Fixable = NO` means Stripe did not supply a period either, so the value cannot be backfilled from this source.",
  );
  L.push("");
  if (!ctx.nullPeriods.length) {
    L.push("_None._");
  } else {
    L.push(
      "| Subscription | Email | Local start | Local end | Stripe start | Stripe end | Fixable |",
    );
    L.push("| --- | --- | --- | --- | --- | --- | --- |");
    for (const n of ctx.nullPeriods) {
      L.push(
        `| \`${n.subscriptionId}\` | ${n.email ?? "(no email)"} | ${n.localStart ?? "NULL"} | ${n.localEnd ?? "NULL"} | ${n.stripeStart ?? "NULL"} | ${n.stripeEnd ?? "NULL"} | ${n.resolvable ? "yes" : "NO"} |`,
      );
    }
  }
  L.push("");

  L.push("## STALE (local row, no Stripe subscription)");
  L.push("");
  if (!ctx.stale.length) {
    L.push("_None._");
  } else {
    L.push("| Subscription | Email | Local status | Row created |");
    L.push("| --- | --- | --- | --- |");
    for (const s of ctx.stale) {
      L.push(
        `| \`${s.subscriptionId}\` | ${s.email ?? "(no email)"} | ${s.localStatus} | ${fmtDate(s.createdAt)} |`,
      );
    }
  }
  L.push("");

  if (ctx.foreign.length) {
    L.push("## FOREIGN subscriptions (excluded)");
    L.push("");
    L.push(
      "Subscriptions in this Stripe account whose price ID is not one of the configured MathPivot tiers and whose metadata carries no `program_tier`. They belong to other products on the same account and are excluded from every category above.",
    );
    L.push("");
    L.push("| Subscription | Price ID | Status |");
    L.push("| --- | --- | --- |");
    for (const f of ctx.foreign) {
      L.push(`| \`${f.subscriptionId}\` | \`${f.priceId}\` | ${f.status} |`);
    }
    L.push("");
  }

  return L.join("\n") + "\n";
}

main().catch((err) => {
  console.error("Reconciliation failed:", err);
  process.exit(1);
});
