import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import PrintButton from "@/components/coach/PrintButton";

// A print-optimized MathPivot session plan template. Coaches use this
// as the Module 2 "Prepare and annotate a sample 60-minute session
// plan" completion evidence, and as a working document for real
// sessions before/after the coaching platform captures the same fields.
//
// The page is filled in by hand (browser fields keep state per-session
// only — no persistence) and printed via window.print() → Save as PDF
// through the browser's native print dialog.

const SEGMENTS = [
  {
    label: "Readiness warm-up",
    minutes: 10,
    purpose:
      "Activate prerequisite knowledge and identify immediate misconceptions.",
  },
  {
    label: "Review and retrieval",
    minutes: 10,
    purpose:
      "Revisit recent concepts and check whether learning has been retained.",
  },
  {
    label: "Core concept development",
    minutes: 15,
    purpose: "Introduce, clarify, or extend the session's primary concept.",
  },
  {
    label: "Guided and collaborative practice",
    minutes: 20,
    purpose:
      "Develop reasoning through individual, paired, and group problem solving.",
  },
  {
    label: "Reflection and next step",
    minutes: 5,
    purpose: "Confirm learning, record evidence, and explain what comes next.",
  },
];

export default async function SessionPlanTemplatePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (
    user.role !== "tutor" &&
    user.role !== "admin" &&
    user.role !== "super_admin"
  ) {
    redirect("/");
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="print:hidden flex items-center justify-between mb-6">
        <Link
          href="/tutor/training/mp-session-structure"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to module
        </Link>
        <PrintButton />
      </div>

      <article className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 print:border-0 print:p-0 print:rounded-none">
        <header className="mb-6 pb-4 border-b border-slate-200">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
            MathPivot session plan
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            60-Minute Coaching Session
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            A planning framework, not a rigid script. Adjust timing to serve the
            purpose of each segment.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <FillField label="Date" />
            <FillField label="Cohort / student(s)" />
            <FillField label="Program tier" />
            <FillField label="Course / current unit" />
          </div>
        </header>

        <section className="mb-6">
          <h2 className="text-sm font-bold text-slate-900 mb-2">
            Learning target
          </h2>
          <FillField
            multiline
            placeholder="One sentence. What will students be able to do by the end of the session?"
          />
        </section>

        <section className="mb-6">
          <h2 className="text-sm font-bold text-slate-900 mb-2">
            Prerequisite check
          </h2>
          <FillField
            multiline
            placeholder="Which prerequisite skill or concept must be secure? How will you check?"
          />
        </section>

        {SEGMENTS.map((s) => (
          <section
            key={s.label}
            className="mb-6 pt-4 border-t border-slate-100"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-bold text-slate-900">{s.label}</h2>
              <span className="text-xs text-slate-500 tabular-nums">
                {s.minutes} min
              </span>
            </div>
            <p className="text-xs text-slate-600 italic mb-3">{s.purpose}</p>
            <FillField
              multiline
              rows={4}
              placeholder="Plan: prompts, examples, tasks, materials. What will you say or ask?"
            />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <FillField label="Evidence to collect" />
              <FillField label="Differentiation notes" />
            </div>
          </section>
        ))}

        <section className="mb-6 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 mb-2">
            After the session
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FillField label="Mastery updates to log" multiline rows={2} />
            <FillField label="Follow-up for next session" multiline rows={2} />
            <FillField label="Parent update needed?" />
            <FillField label="Escalations (if any)" />
          </div>
        </section>

        <footer className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>MathPivot — Certified Coach session plan (v1)</span>
          <span>© MathPivot</span>
        </footer>
      </article>

      <div className="print:hidden mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-800">
        <p className="font-semibold mb-1">Using this template</p>
        <ul className="list-disc pl-5 space-y-1 text-slate-700">
          <li>
            Fill in the fields directly in your browser, then click{" "}
            <span className="font-medium">Print</span> and choose{" "}
            <span className="font-medium">Save as PDF</span> to keep a copy.
          </li>
          <li>
            For a blank printable copy, print without filling anything in.
          </li>
          <li>
            The template is the shape of every MathPivot session — not a script.
            Adjust to serve the students actually present.
          </li>
        </ul>
      </div>
    </div>
  );
}

function FillField({
  label,
  placeholder,
  multiline,
  rows,
}: {
  label?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <div>
      {label && (
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          rows={rows ?? 3}
          placeholder={placeholder}
          className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-700 focus:border-transparent print:border-slate-300 print:bg-white"
        />
      ) : (
        <input
          type="text"
          placeholder={placeholder}
          className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-700 focus:border-transparent print:border-slate-300 print:bg-white"
        />
      )}
    </div>
  );
}
