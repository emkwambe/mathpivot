import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { BOOKING_URL } from "@/lib/booking";

export const metadata: Metadata = {
  title: "Checkout canceled — MathPivot",
};

export default function EnrollCancelPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-slate-800 text-lg">MathPivot</span>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-slate-900">
          No charge was made.
        </h1>
        <p className="text-slate-600 mt-3 max-w-lg mx-auto">
          You left the checkout — that&apos;s totally fine. You can pick a
          program whenever you&apos;re ready, or talk to a coach first.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to programs
          </Link>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-slate-200 bg-white text-slate-700 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Talk to a coach
          </a>
        </div>
      </div>
    </div>
  );
}
