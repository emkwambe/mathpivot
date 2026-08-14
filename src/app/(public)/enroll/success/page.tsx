import Link from "next/link";
import type { Metadata } from "next";
import { stripe } from "@/lib/stripe";
import { PROGRAMS, isValidTier, type ProgramTier } from "@/lib/stripe/programs";
import { CheckCircle2, Mail, Calendar, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Enrollment confirmed — MathPivot",
  description:
    "Your MathPivot coaching enrollment is confirmed. Watch for a welcome email with your account setup link.",
};

// The server component reads session_id and looks up the tier for a
// personalized confirmation. It never charges — the webhook already handled
// account provisioning by the time this page loads.
export default async function EnrollSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let tier: ProgramTier | null = null;
  let parentEmail = "";
  if (session_id && stripe) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      const t = session.metadata?.program_tier;
      if (t && isValidTier(t)) tier = t as ProgramTier;
      parentEmail =
        session.customer_details?.email ?? session.customer_email ?? "";
    } catch {
      // Fall back to the generic success page.
    }
  }

  const program = tier ? PROGRAMS[tier] : null;

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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
          <CheckCircle2 className="w-9 h-9 text-emerald-600" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
          You&apos;re enrolled.
        </h1>
        <p className="text-slate-600 mt-3 max-w-lg mx-auto">
          {program ? (
            <>
              Welcome to <strong>{program.displayName}</strong> — $
              {program.priceMonthly}/mo, {program.cadence}. Your monthly billing
              has started and you can cancel anytime from your dashboard.
            </>
          ) : (
            <>
              Your MathPivot coaching enrollment is confirmed. Your monthly
              billing has started and you can cancel anytime from your
              dashboard.
            </>
          )}
        </p>

        <div className="mt-10 bg-white rounded-2xl ring-1 ring-slate-200 p-6 sm:p-8 text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-4 text-center">
            What happens next
          </p>

          <ol className="space-y-5">
            <li className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <p className="font-semibold text-slate-800 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  Check your email
                </p>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  {parentEmail ? (
                    <>
                      We just sent a welcome email to{" "}
                      <strong>{parentEmail}</strong> with a one-click link to
                      set up your parent account.
                    </>
                  ) : (
                    <>
                      We just sent a welcome email with a one-click link to set
                      up your parent account.
                    </>
                  )}
                </p>
              </div>
            </li>

            <li className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <p className="font-semibold text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  Coach matching
                </p>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Our team reviews your student&apos;s intake and matches a
                  dedicated math coach within 1 business day.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <p className="font-semibold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  First coaching meeting
                </p>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  You&apos;ll receive a scheduling link to book the first
                  session and join a micro-cohort of 5-6 students.
                </p>
              </div>
            </li>
          </ol>
        </div>

        <div className="mt-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-800 transition-colors"
          >
            Go to Sign In
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Questions? Reply to your welcome email or contact{" "}
          <a
            href="mailto:mathpivot@mpingo.ai"
            className="text-blue-700 hover:underline"
          >
            mathpivot@mpingo.ai
          </a>
          .
        </p>
      </div>
    </div>
  );
}
