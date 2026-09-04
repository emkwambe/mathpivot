import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PROGRAMS, VALID_TIERS, type ProgramTier } from "@/lib/stripe/programs";
import { BOOKING_URL } from "@/lib/booking";
import { Check, ShieldCheck, Users, Calendar } from "lucide-react";
import EnrollForm from "./EnrollForm";

export function generateStaticParams() {
  return VALID_TIERS.map((tier) => ({ tier }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tier: string }>;
}): Promise<Metadata> {
  const { tier } = await params;
  if (!VALID_TIERS.includes(tier as ProgramTier)) {
    return { title: "Enroll — MathPivot" };
  }
  const program = PROGRAMS[tier as ProgramTier];
  return {
    title: `Enroll in ${program.displayName} — $${program.priceMonthly}/mo | MathPivot`,
    description: `${program.tagline} ${program.cadence}. Cancel anytime.`,
  };
}

const COLOR_STYLES = {
  blue: {
    accent: "text-blue-700",
    ring: "ring-blue-100",
    pill: "bg-blue-50 text-blue-700 border-blue-200",
  },
  amber: {
    accent: "text-amber-600",
    ring: "ring-amber-100",
    pill: "bg-amber-50 text-amber-700 border-amber-200",
  },
  purple: {
    accent: "text-purple-700",
    ring: "ring-purple-100",
    pill: "bg-purple-50 text-purple-700 border-purple-200",
  },
} as const;

export default async function EnrollTierPage({
  params,
  searchParams,
}: {
  params: Promise<{ tier: string }>;
  searchParams: Promise<{ canceled?: string }>;
}) {
  const { tier } = await params;
  const { canceled } = await searchParams;
  if (!VALID_TIERS.includes(tier as ProgramTier)) return notFound();
  const program = PROGRAMS[tier as ProgramTier];
  const styles = COLOR_STYLES[program.color];

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
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/pricing"
              className="text-slate-600 hover:text-slate-900"
            >
              Compare programs
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

      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        {canceled === "1" && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm p-4">
            No charge was made — you left the checkout. You can pick up where
            you left off whenever you&apos;re ready.
          </div>
        )}

        <div className="text-center mb-8">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full border ${styles.pill}`}
          >
            Enrolling in {program.name}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-4">
            {program.displayName}
          </h1>
          <p className="text-slate-600 mt-2 max-w-lg mx-auto">
            {program.tagline}
          </p>
        </div>

        <div
          className={`bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 ${styles.ring} p-6 sm:p-8`}
        >
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">
              {program.capability}
            </span>{" "}
            · {program.cadence}
          </p>

          <div className="mt-5 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
              What&apos;s included
            </p>
            <ul className="space-y-2.5">
              {program.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check
                    className={`w-4 h-4 mt-0.5 shrink-0 ${styles.accent}`}
                  />
                  <span className="text-slate-700">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 grid sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-slate-700">Cancel anytime</p>
                <p className="text-slate-500">
                  Manage from your parent dashboard.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-slate-700">Small cohort</p>
                <p className="text-slate-500">
                  Typically 5 students · Never more than 6.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-slate-700">Secure checkout</p>
                <p className="text-slate-500">
                  Payment handled by Stripe. Card never touches our servers.
                </p>
              </div>
            </div>
          </div>

          <EnrollForm tier={tier as ProgramTier} />
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          Not sure this is the right fit?{" "}
          <Link href="/pricing" className="text-blue-700 hover:underline">
            Compare all three programs
          </Link>{" "}
          or{" "}
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:underline"
          >
            talk to a coach first
          </a>
          .
        </div>

        <div className="mt-6 max-w-lg mx-auto">
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            After checkout, we&apos;ll email you a link to set up your parent
            account. Your dedicated coach and first coaching meeting are
            scheduled within 1 business day.
          </p>
        </div>
      </div>
    </div>
  );
}
