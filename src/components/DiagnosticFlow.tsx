"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { captureLeadAction } from "@/app/actions/leads";
import DiagnosticRunner from "@/components/DiagnosticRunner";
import type { PlacementResult } from "@/app/actions/diagnostics";
import { ArrowRight, GraduationCap } from "lucide-react";

interface DiagnosticFlowProps {
  fixedGrade?: number;
  gradeLabel?: string;
  headline?: string;
  subheadline?: string;
}

export default function DiagnosticFlow({
  fixedGrade,
  gradeLabel,
  headline,
  subheadline,
}: DiagnosticFlowProps) {
  const [phase, setPhase] = useState<"capture" | "assess" | "done">("capture");
  const [studentInfo, setStudentInfo] = useState({
    name: "",
    grade: fixedGrade ?? 7,
  });
  const [parentInfo, setParentInfo] = useState({ name: "", email: "" });
  const [tempStudentId, setTempStudentId] = useState("");
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [, leadAction, leadPending] = useActionState(captureLeadAction, {});

  function handleLeadSubmit(formData: FormData) {
    const grade =
      fixedGrade ?? (parseInt(formData.get("studentGrade") as string) || 7);
    const name = (formData.get("studentName") as string) || "Student";
    const pName = (formData.get("parentName") as string) || "";
    const pEmail = (formData.get("parentEmail") as string) || "";
    setStudentInfo({ name, grade });
    setParentInfo({ name: pName, email: pEmail });
    setTempStudentId(`diagnostic-${Date.now()}`);
    leadAction(formData);
    setPhase("assess");
  }

  const resolvedHeadline =
    headline ??
    (fixedGrade
      ? `Entering Grade ${fixedGrade + 1} Diagnostic`
      : "Where does your child stand in math?");
  const resolvedSub =
    subheadline ??
    (fixedGrade
      ? `A ~15-minute assessment of grade ${fixedGrade} content — the mastery expected before entering grade ${fixedGrade + 1}. Free — we email the full report and a coaching program recommendation.`
      : "Our 15-minute diagnostic tells you exactly where your child is strong and where they need support. No cost, no commitment.");

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {phase === "capture" && (
        <div>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              <GraduationCap className="w-3.5 h-3.5" />
              {gradeLabel ?? "Free Assessment"}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">
              {resolvedHeadline}
            </h1>
            <p className="mt-4 text-slate-600 max-w-xl mx-auto">
              {resolvedSub}
            </p>

            <div className="mt-6 max-w-xl mx-auto">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                What the diagnostic covers
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {[
                  "Number Sense",
                  "Ratios & Proportions",
                  "Expressions & Equations",
                  "Functions",
                  "Geometry",
                  "Statistics & Probability",
                ].map((d) => (
                  <div
                    key={d}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-center"
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 p-7">
            <h2 className="text-lg font-bold text-slate-800 mb-1">
              Start the diagnostic
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              We&apos;ll email you the full results report.
            </p>

            <form action={handleLeadSubmit} className="space-y-4">
              <input type="hidden" name="source" value="free_diagnostic" />
              {fixedGrade && (
                <input
                  type="hidden"
                  name="studentGrade"
                  value={String(fixedGrade)}
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Parent Name *
                  </label>
                  <input
                    name="parentName"
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email *
                  </label>
                  <input
                    name="parentEmail"
                    type="email"
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10"
                  />
                </div>
              </div>

              <div className={fixedGrade ? "" : "grid grid-cols-2 gap-3"}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Student Name *
                  </label>
                  <input
                    name="studentName"
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10"
                  />
                </div>
                {!fixedGrade && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Grade *
                    </label>
                    <select
                      name="studentGrade"
                      required
                      defaultValue="7"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-700"
                    >
                      {[6, 7, 8, 9, 10, 11].map((g) => (
                        <option key={g} value={g}>
                          Grade {g}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={leadPending}
                className="w-full bg-blue-700 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {leadPending ? "Loading..." : "Begin Assessment"}
                {!leadPending && <ArrowRight className="w-5 h-5" />}
              </button>

              <div className="pt-2 space-y-2">
                <p className="text-[11px] text-slate-400 text-center">
                  No payment required. Results emailed within minutes.
                </p>
                <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                  <svg
                    className="w-3 h-3 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  Your child&apos;s data is protected. COPPA-compliant. Never
                  shared with third parties.
                </p>
              </div>
            </form>

            <div className="mt-5 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Prefer to talk first?{" "}
                <Link
                  href="/get-started"
                  className="text-blue-700 font-medium hover:text-blue-800"
                >
                  Schedule a consultation →
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {phase === "assess" && (
        <DiagnosticRunner
          studentId={tempStudentId}
          gradeHint={studentInfo.grade}
          parentEmail={parentInfo.email}
          parentName={parentInfo.name}
          studentName={studentInfo.name}
          onComplete={(r) => {
            setResult(r);
            setPhase("done");
          }}
        />
      )}

      {phase === "done" && result && (
        <div className="text-center py-8">
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {studentInfo.name}&apos;s Results
            </h2>
            <p className="text-slate-500 mb-6">
              Overall score: <strong>{result.overallScore}%</strong>
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-1">
                Recommended Program
              </p>
              <h3 className="text-lg font-bold text-slate-800">
                {result.recommendedProgram}
              </h3>
              {result.programPriceMonthly && result.programCadence && (
                <p className="text-sm text-slate-500 mt-1">
                  <span className="font-semibold text-slate-700">
                    ${result.programPriceMonthly}/mo
                  </span>{" "}
                  · {result.programCadence}
                </p>
              )}
              <p className="text-sm text-slate-600 mt-2">
                {result.programDescription}
              </p>
            </div>

            <div className="space-y-2 mb-6">
              {result.domainScores.map((d) => (
                <div
                  key={d.domain}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-600 capitalize">
                    {d.domain.replace(/_/g, " ")}
                  </span>
                  <span
                    className={`font-semibold ${d.percentage >= 60 ? "text-emerald-600" : "text-amber-600"}`}
                  >
                    {d.percentage}%
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href={`/enroll/${result.programTier}`}
                className="w-full bg-blue-700 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 transition-colors text-center"
              >
                Enroll in {result.recommendedProgram}
              </Link>
              <Link
                href="/get-started"
                className="w-full bg-white text-slate-700 font-semibold py-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-center"
              >
                Talk to a MathPivot coach
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
