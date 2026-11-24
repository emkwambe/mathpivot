import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | MathPivot",
  description: "Terms for using MathPivot, a service of Mpingo Systems, LLC.",
};

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
        <p className="text-sm text-slate-500 mt-2">
          Last updated: November 24, 2026
        </p>

        <div className="mt-8 space-y-6 text-slate-700 leading-relaxed">
          <p>
            MathPivot is a service of Mpingo Systems, LLC. This page summarizes
            the terms that apply to our coaching programs while our full terms
            of service are being finalized.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              Subscriptions
            </h2>
            <p className="mt-2">
              Coaching programs are billed through Stripe at the price shown on
              our{" "}
              <Link href="/pricing" className="text-blue-700 underline">
                pricing page
              </Link>{" "}
              when you enroll. Payments appear as MPINGO*MATHPIVOT on your
              statement.
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
