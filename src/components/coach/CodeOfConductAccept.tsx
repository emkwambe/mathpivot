"use client";

import { useState, useTransition } from "react";
import { acceptCodeOfConduct } from "@/app/actions/coach-onboarding";
import {
  CODE_OF_CONDUCT_SECTIONS,
  CODE_OF_CONDUCT_TITLE,
  CODE_OF_CONDUCT_VERSION,
} from "@/lib/coach-onboarding/code-of-conduct";

export default function CodeOfConductAccept() {
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onAccept() {
    setError(null);
    startTransition(async () => {
      const res = await acceptCodeOfConduct();
      if (!res.success) setError(res.error ?? "Could not save.");
    });
  }

  return (
    <div className="space-y-3">
      <div
        className={`rounded-lg border border-slate-200 bg-slate-50 p-4 ${
          expanded ? "max-h-none" : "max-h-64 overflow-hidden relative"
        }`}
      >
        <h3 className="text-sm font-bold text-slate-900">
          {CODE_OF_CONDUCT_TITLE}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Version {CODE_OF_CONDUCT_VERSION}
        </p>
        <div className="mt-3 space-y-4">
          {CODE_OF_CONDUCT_SECTIONS.map((section) => (
            <div key={section.heading}>
              <h4 className="text-sm font-semibold text-slate-800">
                {section.heading}
              </h4>
              {section.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="text-sm text-slate-700 leading-relaxed mt-1.5"
                >
                  {p}
                </p>
              ))}
            </div>
          ))}
        </div>
        {!expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-50 to-transparent" />
        )}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-xs text-blue-700 hover:underline"
      >
        {expanded ? "Collapse" : "Read the full Code of Conduct"}
      </button>

      <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-700"
        />
        <span>
          I have read, understood, and agree to abide by the MathPivot Coach
          Code of Conduct.
        </span>
      </label>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="button"
        onClick={onAccept}
        disabled={pending || !confirmed}
        className="inline-flex items-center gap-2 bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50"
      >
        {pending ? "Recording…" : "Accept Code of Conduct"}
      </button>
    </div>
  );
}
