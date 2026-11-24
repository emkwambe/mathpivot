import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | MathPivot",
  description:
    "How MathPivot, a service of Mpingo Systems, LLC, handles family and student information.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="font-semibold text-slate-900">
            MathPivot
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mt-2">
          Last updated: November 24, 2026
        </p>

        <div className="mt-8 space-y-6 text-slate-700 leading-relaxed">
          <p>
            MathPivot is a service of Mpingo Systems, LLC. This page summarizes
            how we handle information while our full privacy policy is being
            finalized.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              Information we collect
            </h2>
            <p className="mt-2">
              Account details you provide (such as name and email address),
              student diagnostic results and learning progress, and records of
              coaching sessions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Payments</h2>
            <p className="mt-2">
              Payments are processed by Stripe. MathPivot does not store your
              full card number.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Questions</h2>
            <p className="mt-2">
              Contact us at{" "}
              <a
                href="mailto:support@mathpivot.com"
                className="text-blue-700 underline"
              >
                support@mathpivot.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
