"use client";

import { useActionState } from "react";
import Link from "next/link";
import { captureLeadAction } from "@/app/actions/leads";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

const programs = [
  {
    name: "Propel Math 7",
    slug: "propel-7",
    price: "$249",
    days: "8 days",
    audience: "Rising 7th Graders",
    focus: "Ratios & Proportional Relationships",
    outcome: "Build confidence and readiness for Grade 7 mathematics.",
    creditExample:
      "Receive a $75 enrollment credit if you continue into Foundation Coaching.",
    wave: 1,
    dates: "July 6 – July 15",
  },
  {
    name: "Ignite Math 1",
    slug: "ignite-math1",
    price: "$349",
    days: "10 days",
    audience: "Rising 9th Graders",
    focus: "Number Sense, Algebra, and Functions",
    outcome: "Target the standards that drive Algebra 1 and EOC success.",
    creditExample:
      "Receive a $100 enrollment credit if you continue into Foundation Coaching.",
    featured: true,
    wave: 1,
    dates: "July 6 – July 17",
  },
  {
    name: "Advantage Math 8",
    slug: "advantage-8",
    price: "$399",
    days: "9 days",
    audience: "Rising 8th Graders",
    focus: "Functions & Relations",
    outcome:
      "Strengthen the concepts that drive success in Grade 8 mathematics.",
    creditExample:
      "Receive a $100 enrollment credit if you continue into Acceleration Coaching.",
    wave: 2,
    dates: "July 20 – July 30",
  },
  {
    name: "Ascent Pre-Calc",
    slug: "ascent-precalc",
    price: "$449",
    days: "11 days",
    audience: "Rising 11th Graders",
    focus: "Advanced Functions, Trigonometry, and Pre-Calculus",
    outcome:
      "Prepare for advanced high school mathematics and future STEM coursework.",
    creditExample:
      "Receive a $150 enrollment credit if you continue into Elite Coaching.",
    wave: 2,
    dates: "July 20 – August 1",
  },
];

export default function SummerProgramsPage() {
  const [state, formAction, isPending] = useActionState(captureLeadAction, {});

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-12 pb-20 md:px-10 lg:px-20">
        <div className="absolute inset-0 bg-[#F8FAFC]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-orange-100/30 rounded-full blur-[100px]" />

        <div className="relative mx-auto max-w-7xl">
          {/* Nav */}
          <div className="flex items-center justify-between mb-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-bold text-slate-800 text-lg">
                MathPivot
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/pricing"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Year-Round Programs
              </Link>
              <Link
                href="/login"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Sign In
              </Link>
              <Link
                href="/diagnostic"
                className="text-sm font-semibold bg-blue-700 text-white px-5 py-2.5 rounded-lg hover:bg-blue-800 transition-colors shadow-sm"
              >
                Free Diagnostic
              </Link>
              <a
                href="#waitlist"
                className="text-sm font-semibold bg-orange-500 text-white px-5 py-2.5 rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
              >
                Join Waitlist
              </a>
            </div>
          </div>

          <div className="grid items-start gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left — copy */}
            <div className="pt-4">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-50 border border-orange-200 px-4 py-2 text-sm text-orange-700 font-medium">
                <Sparkles className="h-4 w-4 text-orange-500" />
                Summer 2026 Math Clinics
              </div>

              <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-[3.5rem] leading-[1.1] text-slate-800">
                Focused summer math prep that turns weak spots into{" "}
                <span className="text-blue-700">momentum.</span>
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-600 max-w-xl">
                Diagnostic-driven clinics that identify gaps, build confidence,
                and create an academic action plan — with a dedicated math coach
                and mastery tracking from day one.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5">
                <Clock className="h-4 w-4 text-blue-700 flex-shrink-0" />
                <span className="text-sm text-blue-800">
                  <strong>Wave 1 starts July 6</strong> · Wave 2 starts July 20
                </span>
              </div>

              <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-orange-50 border border-orange-200 px-4 py-2.5">
                <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                <span className="text-sm text-orange-800">
                  <strong>Spots closing soon.</strong> Limited to 5–6 students
                  per cohort.
                </span>
              </div>

              <div className="mt-10 grid gap-5 sm:grid-cols-3">
                <div className="rounded-xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <TrendingUp className="mb-3 h-5 w-5 text-blue-700" />
                  <p className="text-sm font-semibold text-slate-800">
                    Diagnose & strengthen
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Identify gaps and build readiness for the next grade level.
                  </p>
                </div>
                <div className="rounded-xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <Clock className="mb-3 h-5 w-5 text-blue-700" />
                  <p className="text-sm font-semibold text-slate-800">
                    8–11 day clinics
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Focused, structured, and designed for real outcomes.
                  </p>
                </div>
                <div className="rounded-xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <ShieldCheck className="mb-3 h-5 w-5 text-blue-700" />
                  <p className="text-sm font-semibold text-slate-800">
                    Coaching credit included
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Continue into year-round coaching with an enrollment credit.
                  </p>
                </div>
              </div>
            </div>

            {/* Right — waitlist form */}
            <div id="waitlist" className="scroll-mt-8">
              <div className="rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100">
                <div className="p-7 md:p-9">
                  {state.success ? (
                    <div className="py-14 text-center">
                      <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
                      <h2 className="mt-5 text-2xl font-bold text-slate-800">
                        You&apos;re on the list!
                      </h2>
                      <p className="mt-3 text-slate-500">
                        We&apos;ll follow up within 48 hours with schedule
                        details and placement guidance.
                      </p>
                      <Link
                        href="/"
                        className="mt-6 inline-block text-blue-700 hover:text-blue-800 font-medium text-sm"
                      >
                        Back to Home
                      </Link>
                    </div>
                  ) : (
                    <form action={formAction} className="space-y-5">
                      <input
                        type="hidden"
                        name="source"
                        value="summer_clinic_waitlist"
                      />

                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
                          Join the waitlist
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-slate-800">
                          Save your child&apos;s spot
                        </h2>
                        <p className="mt-1.5 text-slate-500 text-sm">
                          48-hour follow-up with schedule and placement
                          guidance.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          name="parentName"
                          required
                          placeholder="Parent name *"
                          className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 transition-all"
                        />
                        <input
                          name="parentEmail"
                          type="email"
                          required
                          placeholder="Email *"
                          className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 transition-all"
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          name="parentPhone"
                          type="tel"
                          placeholder="Phone"
                          className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 transition-all"
                        />
                        <select
                          name="studentGrade"
                          required
                          className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-700 text-slate-700"
                        >
                          <option value="">Student grade *</option>
                          {[5, 6, 7, 8, 9, 10, 11].map((g) => (
                            <option key={g} value={g}>
                              Grade {g}
                            </option>
                          ))}
                        </select>
                      </div>

                      <input
                        name="studentName"
                        placeholder="Student name"
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 transition-all"
                      />

                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">
                          Which clinic? *
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {programs.map((p) => (
                            <label
                              key={p.slug}
                              className="flex items-start gap-2.5 text-sm border border-slate-200 rounded-lg px-3 py-2.5 cursor-pointer hover:border-blue-300 has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50/50 transition-all"
                            >
                              <input
                                type="checkbox"
                                name="subjectsInterested"
                                value={p.name}
                                className="rounded text-blue-700 mt-0.5"
                              />
                              <span>
                                <span className="font-medium text-slate-800 block leading-tight">
                                  {p.name}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {p.audience}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <textarea
                        name="goals"
                        rows={2}
                        placeholder="Anything we should know about your student's math goals?"
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 transition-all"
                      />

                      {state.error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                          <p className="text-sm text-red-700">{state.error}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isPending}
                        className="w-full rounded-lg bg-orange-500 py-3.5 text-base font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        {isPending ? "Joining..." : "Join the Summer Waitlist"}
                        {!isPending && <ArrowRight className="h-5 w-5" />}
                      </button>

                      <p className="text-[11px] text-slate-400 text-center">
                        No payment required. First-come, first-served.
                      </p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinic Cards */}
      <section className="px-6 py-24 md:px-10 lg:px-20 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-700 mb-2">
              Choose a clinic
            </p>
            <h2 className="text-3xl font-bold text-slate-800 md:text-4xl">
              Four focused paths. One clear goal: stronger readiness.
            </h2>
            <p className="mt-4 text-slate-500">
              Each clinic is priced below a full month of coaching, then
              credited back if your family continues into year-round coaching.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {programs.map((program) => (
              <div
                key={program.name}
                className={`relative rounded-2xl p-6 transition-shadow hover:shadow-lg ${
                  program.featured
                    ? "bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)] ring-2 ring-orange-400"
                    : "bg-[#F8FAFC] shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                }`}
              >
                {program.featured && (
                  <div className="absolute -top-3 right-5">
                    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <GraduationCap className="h-7 w-7 text-blue-700" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Wave {program.wave}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  {program.name}
                </h3>
                <p className="mt-0.5 text-xs font-semibold text-blue-700">
                  {program.audience}
                </p>
                <p className="mt-2 text-sm text-slate-500">{program.outcome}</p>

                <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <span className="font-medium">{program.dates}</span>
                  <span className="text-slate-400">· {program.days}</span>
                </div>

                <div className="mt-4 flex items-end gap-1.5">
                  <span className="text-3xl font-bold text-slate-800">
                    {program.price}
                  </span>
                  <span className="pb-0.5 text-slate-400 text-sm">
                    / {program.days}
                  </span>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <p className="text-slate-600">
                    <strong className="text-slate-800">Focus:</strong>{" "}
                    {program.focus}
                  </p>
                  <p className="rounded-lg bg-blue-50 p-3 text-blue-800 text-xs font-medium">
                    {program.creditExample}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clinic → Coaching Pathway */}
      <section className="px-6 py-24 md:px-10 lg:px-20 bg-[#F8FAFC]">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-10 md:p-14">
            <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-blue-700 mb-2">
                  The beginning of the journey
                </p>
                <h2 className="text-3xl font-bold text-slate-800">
                  The clinic diagnoses. Coaching develops.
                </h2>
              </div>
              <div className="space-y-4 text-slate-600">
                <p>
                  Summer clinics identify readiness gaps, build confidence, and
                  create an academic action plan — a complete standalone
                  program.
                </p>
                <p>
                  For families who want to continue,{" "}
                  <strong className="text-slate-800">
                    clinic graduates receive an enrollment credit toward
                    year-round coaching.
                  </strong>
                </p>
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">
                  <p className="text-blue-800 font-medium">
                    Year-round coaching provides long-term mastery,
                    accountability, grade improvement, and ongoing progress
                    monitoring with a dedicated math coach.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 md:px-10 lg:px-20 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-800">
            Ready to prepare your child for the next school year?
          </h2>
          <p className="mt-4 text-slate-500">
            Spots are limited. Join the waitlist today — no payment required.
          </p>
          <a
            href="#waitlist"
            className="mt-8 inline-flex items-center gap-2 bg-orange-500 text-white font-semibold px-8 py-4 rounded-xl hover:bg-orange-600 transition-colors shadow-sm text-lg"
          >
            Join the Summer Waitlist
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </section>

      <footer className="bg-slate-800 text-slate-400 py-10 px-6">
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
