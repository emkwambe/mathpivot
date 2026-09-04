import Link from "next/link";
import type { Metadata } from "next";
import {
  GraduationCap,
  ArrowRight,
  Clock,
  Shield,
  Sparkles,
} from "lucide-react";
import { BOOKING_URL } from "@/lib/booking";

export const metadata: Metadata = {
  title: "Free Math Diagnostic by Grade — MathPivot",
  description:
    "Free 15-minute math diagnostic for grades 6-11. Get a domain-by-domain report and a coaching program recommendation. No commitment.",
};

const GRADES = [
  {
    grade: 6,
    enteringGrade: 7,
    label: "Entering Grade 7",
    contentLabel: "Grade 6 content",
    scope: "Ratios, integers, expressions",
    color: "border-blue-200 hover:border-blue-400 hover:bg-blue-50",
  },
  {
    grade: 7,
    enteringGrade: 8,
    label: "Entering Grade 8",
    contentLabel: "Grade 7 content",
    scope: "Proportions, rationals, geometry",
    color: "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50",
  },
  {
    grade: 8,
    enteringGrade: 9,
    label: "Entering Grade 9",
    contentLabel: "Grade 8 content",
    scope: "Linear functions, systems, exponents",
    color: "border-amber-200 hover:border-amber-400 hover:bg-amber-50",
  },
  {
    grade: 9,
    enteringGrade: 10,
    label: "Entering Grade 10",
    contentLabel: "Grade 9 content · Algebra 1",
    scope: "Quadratics, systems, polynomials",
    color: "border-purple-200 hover:border-purple-400 hover:bg-purple-50",
  },
  {
    grade: 10,
    enteringGrade: 11,
    label: "Entering Grade 11",
    contentLabel: "Grade 10 content · Geometry",
    scope: "Proofs, trig, circles, coordinate geometry",
    color: "border-rose-200 hover:border-rose-400 hover:bg-rose-50",
  },
  {
    grade: 11,
    enteringGrade: 12,
    label: "Entering Grade 12",
    contentLabel: "Grade 11 content · Algebra 2 / Pre-Calc",
    scope: "Logs, trig, polynomial & rational functions",
    color: "border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50",
  },
];

export default function DiagnosticPickerPage() {
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
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/pricing"
              className="text-slate-600 hover:text-slate-900"
            >
              Programs
            </Link>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-900"
            >
              Talk to a coach
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <GraduationCap className="w-3.5 h-3.5" />
            Free · 15 minutes · No commitment
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-slate-800 leading-tight">
            Which grade is your student entering?
          </h1>
          <p className="mt-4 text-slate-600 max-w-xl mx-auto text-base sm:text-lg">
            Pick the grade your student is entering. We&apos;ll assess mastery
            of the prior-grade content and email a coaching program
            recommendation. Also a good mid-year check for students currently in
            the tested grade.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {GRADES.map((g) => (
            <Link
              key={g.grade}
              href={`/diagnostic/grade/${g.grade}`}
              className={`group bg-white rounded-2xl border-2 ${g.color} p-6 transition-all hover:shadow-md`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    {g.contentLabel}
                  </p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {g.label}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-sm text-slate-600 leading-snug">{g.scope}</p>
              <p className="mt-4 text-xs font-semibold text-blue-700">
                Start assessment →
              </p>
            </Link>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <Clock className="w-5 h-5 text-blue-600 mb-2" />
            <p className="text-sm font-semibold text-slate-800">
              About 15 minutes
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Domain-scored, adaptive per grade.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <Sparkles className="w-5 h-5 text-emerald-600 mb-2" />
            <p className="text-sm font-semibold text-slate-800">
              Coaching recommendation
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Foundation, Acceleration, or Advanced — matched to the results.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <Shield className="w-5 h-5 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-800">
              COPPA-compliant
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Student data protected. Never shared.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500">
            Not sure which grade to pick?{" "}
            <Link
              href="/get-started"
              className="text-blue-700 font-medium hover:underline"
            >
              Schedule a free consultation →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
