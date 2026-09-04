import Link from "next/link";
import type { Metadata } from "next";
import { PROGRAMS, VALID_TIERS } from "@/lib/stripe/programs";
import { BOOKING_URL } from "@/lib/booking";

export const metadata: Metadata = {
  title: "Programs — MathPivot",
  description:
    "MathPivot mathematical coaching programs — Foundation ($349/mo), Acceleration ($549/mo), Advanced ($799/mo). Individualized mastery pathway inside intentionally small cohorts of typically 5 students, never more than 6.",
};

const colorMap: Record<
  string,
  {
    bg: string;
    border: string;
    badge: string;
    accent: string;
    button: string;
    feature: string;
  }
> = {
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-600 text-white",
    accent: "text-blue-700",
    button: "bg-blue-700 hover:bg-blue-800 text-white",
    feature: "text-blue-600",
  },
  amber: {
    bg: "bg-white",
    border: "border-amber-300 ring-2 ring-amber-100",
    badge: "bg-amber-600 text-white",
    accent: "text-amber-700",
    button: "bg-amber-600 hover:bg-amber-700 text-white",
    feature: "text-amber-600",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    badge: "bg-purple-700 text-white",
    accent: "text-purple-700",
    button: "bg-purple-700 hover:bg-purple-800 text-white",
    feature: "text-purple-600",
  },
};

const CARD_CTAS: Record<string, { label: string; href: string }> = {
  foundation: { label: "Enroll in Foundation", href: "/enroll/foundation" },
  acceleration: {
    label: "Enroll in Acceleration",
    href: "/enroll/acceleration",
  },
  advanced: { label: "Enroll in Advanced", href: "/enroll/advanced" },
};

const THREE_DIRECTIONS = [
  {
    symbol: "↩",
    title: "Close what is missing.",
    desc: "Repair the prerequisite gaps under today's schoolwork — without labeling students as behind.",
  },
  {
    symbol: "→",
    title: "Ensure current success.",
    desc: "Make your student genuinely capable in the mathematics their course requires — not just able to finish tonight's homework.",
  },
  {
    symbol: "↗",
    title: "Build slightly ahead.",
    desc: "When mastery allows, coaching anticipates upcoming concepts so your student meets new material already prepared.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-slate-900 text-lg">MathPivot</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/about"
              className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2"
            >
              About
            </Link>
            <Link
              href="/careers"
              className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2"
            >
              Careers
            </Link>
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/diagnostic"
              className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800"
            >
              Free Diagnostic
            </Link>
          </div>
        </div>
      </header>

      {/* Section intro */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-8 text-center">
        <p className="text-blue-700 font-semibold text-sm uppercase tracking-wide mb-3">
          Programs
        </p>
        <h1 className="text-4xl font-bold text-slate-900">
          Meet your student where they are. Move them where they&apos;re going.
        </h1>
        <p className="text-lg text-slate-600 mt-4 max-w-3xl mx-auto leading-relaxed">
          MathPivot is{" "}
          <span className="font-semibold">mathematical coaching</span>, not
          tutoring by the hour. We close the prerequisite gaps under
          today&apos;s schoolwork, ensure your student is genuinely capable in
          the mathematics their course requires, and — when mastery allows —
          build slightly ahead so they&apos;re ready for what comes next.
        </p>
        <p className="mt-6 text-sm text-slate-700 font-medium">
          <span className="italic">Individualized, not isolated.</span> Every
          student follows an individual mastery pathway inside an intentionally
          small cohort — typically 5 students, never more than 6.
        </p>
      </section>

      {/* Three directions block */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-5 text-center">
            How the coaching works — in three directions simultaneously
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {THREE_DIRECTIONS.map((d) => (
              <div key={d.title}>
                <p className="text-2xl text-blue-700 mb-2" aria-hidden="true">
                  {d.symbol}
                </p>
                <p className="text-sm font-semibold text-slate-900 mb-1">
                  {d.title}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {d.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Program cards */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {VALID_TIERS.map((tier) => {
            const program = PROGRAMS[tier];
            const colors = colorMap[program.color];
            const cta = CARD_CTAS[tier];
            return (
              <div
                key={program.tier}
                id={program.tier}
                className={`relative rounded-2xl border-2 ${colors.border} ${colors.bg} p-6 sm:p-7 flex flex-col scroll-mt-20`}
              >
                <div className="mb-4">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${colors.badge}`}
                  >
                    {program.name}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 leading-snug">
                  {program.capability}
                </h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {program.tagline}
                </p>

                <div className="mt-5 flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${colors.accent}`}>
                    ${program.priceMonthly}
                  </span>
                  <span className="text-sm text-slate-500">/ month</span>
                </div>
                <p className="mt-1 text-sm text-slate-700 font-medium">
                  {program.cadence}
                </p>
                <p className="mt-2 text-xs text-emerald-700 font-medium">
                  Or ${program.quarterly.priceUpfront.toFixed(2)} upfront every
                  3 months — save {program.quarterly.savingsPercent}% ($
                  {program.quarterly.priceEffectiveMonthly.toFixed(2)}/mo)
                </p>

                <div className="mt-6 pt-5 border-t border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                    Included
                  </p>
                  <ul className="space-y-2 flex-1">
                    {program.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-slate-700"
                      >
                        <svg
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colors.feature}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                      Best for
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {program.bestFor}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                      Primary outcome
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {program.primaryOutcome}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                  <p>Typically 5 students · Never more than 6</p>
                  <p>Month-to-month · Cancel anytime</p>
                </div>

                <Link
                  href={cta.href}
                  className={`mt-6 block text-center font-semibold py-3 rounded-xl transition-colors ${colors.button}`}
                >
                  {cta.label}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* How the programs work together */}
      <section className="py-14 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
              Program architecture
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              How the programs work together.
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="border-l-2 border-blue-200 pl-4">
              <p className="text-sm font-bold text-blue-700 mb-1">
                Foundation restores readiness.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                The student closes the gaps that prevent success in the current
                course.
              </p>
            </div>
            <div className="border-l-2 border-amber-300 pl-4">
              <p className="text-sm font-bold text-amber-700 mb-1">
                Acceleration creates momentum.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                The student strengthens current mastery while preparing
                selectively for upcoming work.
              </p>
            </div>
            <div className="border-l-2 border-purple-200 pl-4">
              <p className="text-sm font-bold text-purple-700 mb-1">
                Advanced expands direction.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                The student develops deeper mathematical ability and connects
                present achievement to future opportunities.
              </p>
            </div>
          </div>

          <p className="mt-10 text-center text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Students are not permanently labeled by their starting program.
            Placement is based on current needs, and students may move between
            programs following a progress review.
          </p>
        </div>
      </section>

      {/* Why small cohorts matter */}
      <section className="bg-slate-50 py-14 border-y border-slate-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
            Cohort model
          </p>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Why small cohorts matter.
          </h2>
          <p className="text-slate-700 leading-relaxed">
            Small enough for individualized feedback, intentionally matched so
            students can also reason, discuss, and solve mathematics with peers.
            Five is the pedagogical design, not the maximum.
          </p>
          <p className="text-slate-700 leading-relaxed mt-3">
            Mathematical development benefits from students explaining
            reasoning, comparing approaches, and learning from mistakes together
            — while still receiving substantial individual attention from a
            dedicated coach.
          </p>
        </div>
      </section>

      {/* Supporting message */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Grade tells us where your student is enrolled. Mastery tells us
            where to begin.
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Two students in the same grade can have very different mathematical
            needs and goals. MathPivot placement considers what a student
            already understands, where they want to go, the demands of that
            mathematics, and the support required to get there.
          </p>
          <p className="text-slate-700 leading-relaxed">
            <span className="font-semibold text-slate-900">
              Today&apos;s mathematics should expand tomorrow&apos;s choices.
            </span>{" "}
            MathPivot stays aligned with your student&apos;s school curriculum —
            but school curriculum is not the ceiling. When mastery allows,
            coaching moves ahead so your student is prepared for the mathematics
            that comes next.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/diagnostic"
              className="inline-flex items-center justify-center bg-blue-700 text-white font-medium px-8 py-3 rounded-xl hover:bg-blue-800 transition-colors"
            >
              Start With a Placement Assessment
            </Link>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center border border-slate-200 text-slate-700 font-medium px-8 py-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Talk to a Coach
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-700 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="text-sm text-slate-500">MathPivot</span>
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <Link href="/about" className="hover:text-white">
              About
            </Link>
            <Link href="/careers" className="hover:text-white">
              Careers
            </Link>
            <Link href="/login" className="hover:text-white">
              Sign In
            </Link>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-6 pt-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          &copy; 2026 Mpingo Systems, LLC. MathPivot is a Mpingo Systems, LLC
          brand. Payments appear as{" "}
          <span className="font-mono">MPINGO*MATHPIVOT</span> on your statement.
        </div>
      </footer>
    </div>
  );
}
