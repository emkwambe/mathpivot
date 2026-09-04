import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Application received — MathPivot",
};

export default function CoachApplyThanksPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-8 text-center">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Thanks — your application is in.
        </h1>
        <p className="text-slate-600 mt-3 text-sm leading-relaxed">
          We review applications personally. If your background looks like a
          fit, we&apos;ll email you to schedule a short conversation, then send
          you the coach onboarding link.
        </p>
        <p className="text-slate-500 mt-3 text-xs">
          Expect a response within about a week.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1 text-blue-700 hover:underline text-sm"
        >
          Return to MathPivot
        </Link>
      </div>
    </div>
  );
}
