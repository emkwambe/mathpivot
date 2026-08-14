"use client";

import { useState, useTransition } from "react";
import { startEnrollmentAction } from "@/app/actions/enroll";
import type { ProgramTier } from "@/lib/stripe/programs";
import { ArrowRight, Lock } from "lucide-react";

export default function EnrollForm({ tier }: { tier: ProgramTier }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await startEnrollmentAction(tier, {
        parentEmail: email || undefined,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.url) window.location.href = res.url;
    });
  }

  return (
    <div className="mt-6 space-y-3">
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
        {isPending
          ? "Redirecting to secure checkout..."
          : "Continue to Checkout"}
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
