"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { captureLeadAction } from "@/app/actions/leads";
import DiagnosticRunner from "@/components/DiagnosticRunner";
import type { PlacementResult } from "@/app/actions/diagnostics";
import { sendDiagnosticResultsEmail } from "@/app/actions/diagnostics";
import { ArrowRight, GraduationCap } from "lucide-react";
import { useActionState } from "react";

export default function PublicDiagnosticPage() {
  const [phase, setPhase] = useState<"capture" | "assess" | "done">("capture");
  const [studentInfo, setStudentInfo] = useState({ name: "", grade: 7 });
  const [parentInfo, setParentInfo] = useState({ name: "", email: "" });
  const [tempStudentId, setTempStudentId] = useState("");
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [leadState, leadAction, leadPending] = useActionState(
    captureLeadAction,
    {},
  );

  function handleLeadSubmit(formData: FormData) {
    const grade = parseInt(formData.get("studentGrade") as string) || 7;
    const name = (formData.get("studentName") as string) || "Student";
    const pName = (formData.get("parentName") as string) || "";
    const pEmail = (formData.get("parentEmail") as string) || "";
    setStudentInfo({ name, grade });
    setParentInfo({ name: pName, email: pEmail });
    setTempStudentId(`diagnostic-${Date.now()}`);
    leadAction(formData);
    setPhase("assess");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-slate-800 text-lg">MathPivot</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/summer"
              className="text-sm text-orange-500 font-semibold hover:text-orange-600"
            >
              Summer Programs
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Programs
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {phase === "capture" && (
          <div>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                <GraduationCap className="w-3.5 h-3.5" />
                Free Assessment
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">
                Where does your child stand in math?
              </h1>
              <p className="mt-4 text-slate-600 max-w-xl mx-auto">
                Our 15-minute diagnostic covers 6 core math domains and tells
                you exactly where your child is strong and where they need
                support. No cost, no commitment.
              </p>
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

                <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Grade *
                    </label>
                    <select
                      name="studentGrade"
                      required
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-700"
                    >
                      {[5, 6, 7, 8, 9, 10, 11].map((g) => (
                        <option key={g} value={g}>
                          Grade {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={leadPending}
                  className="w-full bg-blue-700 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {leadPending ? "Loading..." : "Begin Assessment"}
                  {!leadPending && <ArrowRight className="w-5 h-5" />}
                </button>

                <p className="text-[11px] text-slate-400 text-center">
                  No payment required. Results emailed within minutes.
                </p>
              </form>
            </div>
          </div>
        )}

        {phase === "assess" && (
          <DiagnosticRunner
            studentId={tempStudentId}
            gradeHint={studentInfo.grade}
            onComplete={(r) => {
              setResult(r);
              setPhase("done");
              if (parentInfo.email) {
                sendDiagnosticResultsEmail(
                  parentInfo.email,
                  parentInfo.name,
                  studentInfo.name,
                  r,
                );
              }
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
                <p className="text-sm text-slate-600 mt-1">
                  {result.programDescription}
                </p>
              </div>

              <div className="space-y-2 mb-6">
                {result.domainScores.map((d) => (
                  <div
                    key={d.domain}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-600">
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
                  href="/summer"
                  className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 transition-colors text-center"
                >
                  Explore Summer Clinics
                </Link>
                <Link
                  href="/pricing"
                  className="w-full bg-white text-slate-700 font-semibold py-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-center"
                >
                  View Year-Round Programs
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
