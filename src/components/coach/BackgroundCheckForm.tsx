"use client";

import { useState, useTransition } from "react";
import { attestBackgroundCheck } from "@/app/actions/coach-onboarding";

export default function BackgroundCheckForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState("");
  const [completedOn, setCompletedOn] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await attestBackgroundCheck({ provider, completedOn });
      if (!res.success) setError(res.error ?? "Could not save.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Provider
          </label>
          <input
            required
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="Checkr, Sterling, GoodHire, etc."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-700"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Completion date
          </label>
          <input
            required
            type="date"
            value={completedOn}
            onChange={(e) => setCompletedOn(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-700"
          />
        </div>
      </div>
      <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-700"
        />
        <span>
          I confirm that the information above is accurate and that the
          background check was completed within the last twelve months. I
          understand MathPivot will verify separately.
        </span>
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending || !confirmed || !provider || !completedOn}
        className="inline-flex items-center gap-2 bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Attest and save"}
      </button>
    </form>
  );
}
