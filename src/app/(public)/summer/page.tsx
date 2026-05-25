"use client";

import { useActionState } from "react";
import Link from "next/link";
import { captureLeadAction } from "@/app/actions/leads";

const CLINICS = [
  {
    slug: "launchpad",
    name: "Launchpad Clinic",
    tagline: "Don't let your child walk into middle school guessing.",
    audience: "Rising 6th Graders",
    duration: "8 days (Mon–Thu × 2 weeks)",
    sessionLength: "90 min/day",
    price: "$249",
    color: "blue",
    mapsTo: "Foundation ($349/mo)",
    eogFocus: [
      "Ratios & Proportional Relationships (24-28% of Grade 7 EOG)",
      "Fraction fluency, decimals, percent problems",
      "Algebraic thinking — patterns, variables, expressions",
    ],
    highlights: [
      "Day 1 diagnostic feeds mastery tracking from session one",
      "Mini-Mathathlon on Day 7 — first taste of competition",
      "Career Spotlight: fractions → Data Scientists, Pharmacists, Architects",
      "Full clinic fee credited toward Foundation enrollment",
    ],
  },
  {
    slug: "algebra-ready",
    name: "Algebra Ready Clinic",
    tagline: "Algebra I is the gatekeeper. Open the gate before school starts.",
    audience: "Rising 9th Graders",
    duration: "10 days (Mon–Fri × 2 weeks)",
    sessionLength: "2 hrs/day",
    price: "$349",
    color: "amber",
    mapsTo: "Foundation or Acceleration",
    eogFocus: [
      "Number & Quantity + Algebra (36-40% of Math 1 EOC)",
      "Functions — notation, graphs, rate of change (32-36% of EOC)",
      "Systems of equations, linear modeling, polynomials",
    ],
    highlights: [
      "AMC 8 practice problems on Day 10",
      "School Pulse: coaches map ahead of your child's textbook",
      "Career Spotlight: algebra → Software Engineers, Game Designers",
      "Full clinic fee credited toward coaching enrollment",
    ],
  },
  {
    slug: "competitors",
    name: "Competitors Clinic",
    tagline: "Your child doesn't need help. They need a challenge.",
    audience: "High-Performing 7th & 8th Graders",
    duration: "9 days (Mon–Thu + Mon, 2 weeks)",
    sessionLength: "2 hrs/day",
    price: "$399",
    color: "purple",
    mapsTo: "Acceleration or Elite",
    eogFocus: [
      "Functions & relations (28-32% of Grade 8 EOG)",
      "Advanced algebra, number theory, combinatorics",
      "Geometry proofs + Pythagorean theorem applications",
    ],
    highlights: [
      "Full Mathathlon simulation on Day 9 — timed rounds, team + individual",
      "AMC 8 and MATHCOUNTS competition strategy",
      "Career Spotlight: competition math → Quant Analysts, ML Engineers",
      "Full clinic fee credited toward Acceleration/Elite enrollment",
    ],
  },
  {
    slug: "stem-bridge",
    name: "STEM Bridge Clinic",
    tagline: "The math foundation that makes SAT tactics unnecessary.",
    audience: "Rising 11th Graders",
    duration: "11 days (Mon–Fri + Mon, 2 weeks + 1 day)",
    sessionLength: "2.5 hrs/day",
    price: "$449",
    color: "emerald",
    mapsTo: "Acceleration or Elite",
    eogFocus: [
      "Advanced functions — polynomial, exponential, logarithmic",
      "Trigonometry fundamentals + unit circle mastery",
      "Pre-calculus concepts + SAT/ACT problem integration",
    ],
    highlights: [
      "College readiness portfolio — mastery map + career alignment document",
      "Full RIASEC career interest assessment + 1-on-1 career pathway discussion",
      "SAT/ACT integration: you already know this math, here's how it appears",
      "Full clinic fee credited toward Elite coaching enrollment",
    ],
  },
];

const colorMap: Record<
  string,
  { bg: string; border: string; badge: string; accent: string }
> = {
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-600 text-white",
    accent: "text-blue-600",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-500 text-white",
    accent: "text-amber-600",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    badge: "bg-purple-600 text-white",
    accent: "text-purple-600",
  },
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "bg-emerald-600 text-white",
    accent: "text-emerald-600",
  },
};

export default function SummerProgramsPage() {
  const [state, formAction, isPending] = useActionState(captureLeadAction, {});

  if (state.success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            You&apos;re on the list!
          </h1>
          <p className="text-slate-600 mt-2">
            We&apos;ll reach out within 48 hours with program details, exact
            dates, and next steps. Spots are limited — early sign-ups get
            priority scheduling.
          </p>
          <Link
            href="/"
            className="inline-block mt-6 text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-slate-900 text-lg">MathPivot</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2"
            >
              Year-Round Programs
            </Link>
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">
        <span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full mb-4">
          Summer 2026
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
          Summer Math Clinics
        </h1>
        <p className="text-lg text-slate-600 mt-4 max-w-2xl mx-auto">
          Intensive 8–11 day clinics that prepare your child for the next school
          year. Named math coach, mastery tracking, competition exposure, and
          career connection — all at a fraction of our year-round program cost.
        </p>
        <p className="text-sm text-slate-500 mt-3">
          Clinic fee is fully credited if you enroll in a coaching program
          within 14 days.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CLINICS.map((clinic) => {
            const colors = colorMap[clinic.color];
            return (
              <div
                key={clinic.slug}
                className={`rounded-2xl border-2 ${colors.border} ${colors.bg} p-6`}
              >
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}
                >
                  {clinic.audience}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-3">
                  {clinic.name}
                </h2>
                <p className="text-sm text-slate-600 mt-1 italic">
                  &ldquo;{clinic.tagline}&rdquo;
                </p>

                <div className="flex items-baseline gap-2 mt-4">
                  <span className={`text-3xl font-bold ${colors.accent}`}>
                    {clinic.price}
                  </span>
                  <span className="text-sm text-slate-500">
                    {clinic.duration} &middot; {clinic.sessionLength}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    EOG/EOC Focus Areas
                  </p>
                  <ul className="space-y-1.5">
                    {clinic.eogFocus.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <svg
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colors.accent}`}
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
                        <span className="text-slate-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    What&apos;s Included
                  </p>
                  <ul className="space-y-1.5">
                    {clinic.highlights.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-xs text-slate-600"
                      >
                        <span className="text-slate-400 mt-0.5">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-xs text-slate-400 mt-3">
                  Feeds into → {clinic.mapsTo}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-900 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Every clinic includes</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8">
            {[
              { stat: "Day 1", label: "Diagnostic Assessment" },
              { stat: "Named", label: "Math Coach" },
              { stat: "Daily", label: "Mastery Updates" },
              { stat: "100%", label: "Fee Credit on Enrollment" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-2xl font-bold text-blue-400">{item.stat}</p>
                <p className="text-sm text-slate-400 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="waitlist" className="py-16 px-4 bg-blue-50">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
            Join the Summer 2026 Waitlist
          </h2>
          <p className="text-slate-600 text-center mb-8 text-sm">
            Spots are limited to 6-8 students per clinic. Early sign-ups get
            priority scheduling and coach selection.
          </p>

          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{state.error}</p>
            </div>
          )}

          <form
            action={formAction}
            className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
          >
            <input type="hidden" name="source" value="summer_clinic_waitlist" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Parent/Guardian Name *
                </label>
                <input
                  type="text"
                  name="parentName"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="parentEmail"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="parentPhone"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Student&apos;s Current Grade *
                </label>
                <select
                  name="studentGrade"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select</option>
                  {[5, 6, 7, 8, 9, 10, 11].map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Student Name
              </label>
              <input
                type="text"
                name="studentName"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Which clinic interests you? *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CLINICS.map((c) => (
                  <label
                    key={c.slug}
                    className="flex items-center gap-2 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-blue-50 hover:border-blue-200 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300"
                  >
                    <input
                      type="checkbox"
                      name="subjectsInterested"
                      value={c.name}
                      className="rounded text-blue-600"
                    />
                    <span>
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-slate-400 block">
                        {c.audience}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Questions or goals?
              </label>
              <textarea
                name="goals"
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Anything you'd like us to know about your child's math experience..."
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Joining..." : "Join the Waitlist"}
            </button>

            <p className="text-[11px] text-slate-400 text-center">
              No payment required. We&apos;ll contact you with dates,
              availability, and next steps.
            </p>
          </form>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
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
            <Link href="/pricing" className="hover:text-white">
              Programs
            </Link>
            <Link href="/careers" className="hover:text-white">
              Careers
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
