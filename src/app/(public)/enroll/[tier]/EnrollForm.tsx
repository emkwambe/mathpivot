"use client";

import { useState, useTransition } from "react";
import { startEnrollmentAction } from "@/app/actions/enroll";
import {
  PROGRAMS,
  type BillingPlan,
  type ProgramTier,
} from "@/lib/stripe/programs";
import { ArrowRight, Lock } from "lucide-react";

export default function EnrollForm({ tier }: { tier: ProgramTier }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<BillingPlan>("monthly");

  const program = PROGRAMS[tier];

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await startEnrollmentAction(tier, {
        parentEmail: email || undefined,
        plan,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.url) window.location.href = res.url;
    });
  }

  const buttonLabel =
    plan === "quarterly"
      ? `Continue — Pay $${program.quarterly.priceUpfront.toFixed(2)} today`
      : `Continue — $${program.priceMonthly}/month`;

  return (
    <div className="mt-6 space-y-4">
      <fieldset>
        <legend className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Choose a plan
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label
            className={`relative rounded-xl border-2 p-4 cursor-pointer transition-colors ${
              plan === "monthly"
                ? "border-blue-700 bg-blue-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <input
              type="radio"
              name="plan"
              value="monthly"
              checked={plan === "monthly"}
              onChange={() => setPlan("monthly")}
              className="sr-only"
            />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-slate-900">Monthly</span>
              <span className="text-xs text-slate-500">Cancel anytime</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">
                ${program.priceMonthly}
              </span>
              <span className="text-xs text-slate-500">/ month</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Billed every month</p>
          </label>

          <label
            className={`relative rounded-xl border-2 p-4 cursor-pointer transition-colors ${
              plan === "quarterly"
                ? "border-blue-700 bg-blue-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <input
              type="radio"
              name="plan"
              value="quarterly"
              checked={plan === "quarterly"}
              onChange={() => setPlan("quarterly")}
              className="sr-only"
            />
            <span className="absolute -top-2 right-3 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
              Save {program.quarterly.savingsPercent}%
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-slate-900">
                3-Month Plan
              </span>
              <span className="text-xs text-slate-500">Paid upfront</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">
                ${program.quarterly.priceUpfront.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500">today</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              ${program.quarterly.priceEffectiveMonthly.toFixed(2)}/mo effective
              · billed every 3 months
            </p>
          </label>
        </div>
      </fieldset>

      <label className="block">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Parent email (optional)
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10"
        />
        <span className="text-xs text-slate-400 mt-1 block">
          Pre-fills your email at checkout. You&apos;ll be able to change it
          there.
        </span>
      </label>

      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="w-full bg-blue-700 text-white font-semibold py-4 rounded-xl hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-base"
      >
        {isPending ? "Redirecting to secure checkout..." : buttonLabel}
        {!isPending && <ArrowRight className="w-5 h-5" />}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <Lock className="w-3 h-3" />
        Secured by Stripe. Cancel anytime from your dashboard.
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3">
          {error}
        </div>
      )}
    </div>
  );
}
