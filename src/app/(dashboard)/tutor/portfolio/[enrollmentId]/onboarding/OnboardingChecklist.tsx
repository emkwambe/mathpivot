"use client";

import { useState, useTransition } from "react";
import { completeOnboardingStep } from "@/app/actions/student-intake";

interface Step {
  key: string;
  title: string;
  description: string;
  completedAt: string | null;
  notes: string | null;
}

export default function OnboardingChecklist({
  steps,
  enrollmentId,
}: {
  steps: Step[];
  enrollmentId: string;
}) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(
    new Set(steps.filter((s) => s.completedAt).map((s) => s.key)),
  );

  function handleComplete(stepKey: string) {
    startTransition(async () => {
      const result = await completeOnboardingStep(
        enrollmentId,
        stepKey,
        noteInputs[stepKey] || undefined,
      );
      if (result.success) {
        setCompletedKeys((prev) => new Set([...prev, stepKey]));
        setExpandedStep(null);
      }
    });
  }

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const isCompleted = completedKeys.has(step.key);
        const isExpanded = expandedStep === step.key;
        const canExpand = !isCompleted;

        return (
          <div
            key={step.key}
            className={`border rounded-xl overflow-hidden transition-colors ${
              isCompleted
                ? "border-green-200 bg-green-50/50"
                : "border-slate-200 bg-white"
            }`}
          >
            <button
              onClick={() => {
                if (canExpand) {
                  setExpandedStep(isExpanded ? null : step.key);
                }
              }}
              className="w-full flex items-center gap-3 p-4 text-left"
              disabled={!canExpand}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold text-sm ${isCompleted ? "text-green-800" : "text-slate-900"}`}
                >
                  {step.title}
                </p>
                {isCompleted && step.notes && (
                  <p className="text-xs text-green-600 mt-0.5 truncate">
                    Note: {step.notes}
                  </p>
                )}
              </div>

              {!isCompleted && (
                <svg
                  className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </button>

            {isExpanded && !isCompleted && (
              <div className="px-4 pb-4 pt-0">
                <div className="ml-11">
                  <p className="text-sm text-slate-600 mb-3">
                    {step.description}
                  </p>

                  <textarea
                    placeholder="Add notes (optional) — e.g., key observations, student preferences..."
                    value={noteInputs[step.key] || ""}
                    onChange={(e) =>
                      setNoteInputs((prev) => ({
                        ...prev,
                        [step.key]: e.target.value,
                      }))
                    }
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />

                  <button
                    onClick={() => handleComplete(step.key)}
                    disabled={isPending}
                    className="mt-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {isPending ? "Saving..." : "Mark Complete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
