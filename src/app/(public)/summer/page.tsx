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
    weight: "24–28% of Grade 7 EOG",
    pitch: "Launch your 7th grade math score forward.",
    creditExample: "$249 credited toward Foundation coaching",
  },
  {
    name: "Advantage Math 8",
    slug: "advantage-8",
    price: "$399",
    days: "9 days",
    audience: "Rising 8th Graders",
    focus: "Functions & Relations",
    weight: "28–32% of Grade 8 EOG",
    pitch: "Get the edge on 8th grade functions.",
    creditExample: "$399 credited toward Acceleration coaching",
  },
  {
    name: "Ignite Math 1",
    slug: "ignite-math1",
    price: "$349",
    days: "10 days",
    audience: "Rising 9th Graders",
    focus: "Number/Algebra + Functions",
    weight: "68–76% of Math 1 EOC combined",
    pitch: "Fire up your Algebra 1 EOC performance.",
    creditExample: "$349 clinic → credited toward $349/mo Foundation",
    featured: true,
  },
  {
    name: "Ascent Pre-Calc",
    slug: "ascent-precalc",
    price: "$449",
    days: "11 days",
    audience: "Rising 11th Graders",
    focus: "Advanced Functions, Trig, Pre-Calculus",
    weight: "Built for readiness before the next math level",
    pitch: "Rise above into advanced math.",
    creditExample: "$449 credited toward Elite coaching",
  },
];

export default function SummerProgramsPage() {
  const [state, formAction, isPending] = useActionState(captureLeadAction, {});

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <section className="relative overflow-hidden px-6 py-16 md:px-10 lg:px-20 bg-gradient-to-br from-blue-50 via-white to-orange-50/30">
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 text-sm"
              >
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">M</span>
                </div>
                MathPivot
              </Link>
            </div>

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-300 bg-orange-50 px-4 py-2 text-sm text-orange-800 font-medium">
              <Sparkles className="h-4 w-4 text-orange-500" /> Summer 2026 Math
              Clinics
            </div>

            <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-slate-900">
              Focused summer math prep that turns weak spots into{" "}
              <span className="text-blue-600">momentum.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              MathPivot summer clinics target the highest-impact math areas
              students face on EOG, EOC, and advanced-course readiness pathways.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-orange-50 border border-orange-200 px-4 py-2.5">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-orange-800">
                <strong>Spots closing soon.</strong> Small groups of 6-8
                students only.
              </span>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                <TrendingUp className="mb-3 h-5 w-5 text-blue-600" />
                <p className="text-sm font-semibold text-slate-900">
                  High-impact topics
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Built around the most heavily tested EOG/EOC domains.
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                <Clock className="mb-3 h-5 w-5 text-blue-600" />
                <p className="text-sm font-semibold text-slate-900">
                  8–11 day clinics
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Short, focused, easier to commit to than a full program.
                </p>
              </div>
              <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-4">
                <ShieldCheck className="mb-3 h-5 w-5 text-orange-500" />
                <p className="text-sm font-semibold text-slate-900">
                  100% fee credit
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Clinic fee credits toward year-round coaching within 14 days.
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-3xl border border-blue-200 bg-white shadow-xl shadow-blue-600/5">
              <div className="p-6 md:p-8">
                {state.success ? (
                  <div className="py-12 text-center">
                    <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
                    <h2 className="mt-5 text-3xl font-bold text-slate-900">
                      You&apos;re on the list!
                    </h2>
                    <p className="mt-3 text-slate-600">
                      We&apos;ll follow up within 48 hours with schedule
                      details, placement guidance, and next steps.
                    </p>
                    <Link
                      href="/"
                      className="mt-6 inline-block text-blue-600 hover:text-blue-800 font-medium text-sm"
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
                      <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                        Join the waitlist
                      </p>
                      <h2 className="mt-2 text-3xl font-bold text-slate-900">
                        Save your child&apos;s spot
                      </h2>
                      <p className="mt-2 text-slate-500 text-sm">
                        We&apos;ll follow up within 48 hours with schedule
                        details and placement guidance.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        name="parentName"
                        required
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                        placeholder="Parent name *"
                      />
                      <input
                        name="parentEmail"
                        type="email"
                        required
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                        placeholder="Email address *"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        name="parentPhone"
                        type="tel"
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                        placeholder="Phone number"
                      />
                      <select
                        name="studentGrade"
                        required
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                      placeholder="Student name"
                    />

                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        Which clinic? *
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {programs.map((p) => (
                          <label
                            key={p.slug}
                            className="flex items-center gap-2 text-sm border border-slate-200 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-blue-50 hover:border-blue-300 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-400 transition-all"
                          >
                            <input
                              type="checkbox"
                              name="subjectsInterested"
                              value={p.name}
                              className="rounded text-blue-600"
                            />
                            <span>
                              <span className="font-medium block text-slate-900">
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                      placeholder="What should we know about your student's math goals?"
                    />

                    <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-800">
                      <strong>100% credit promise:</strong> Enroll in coaching
                      within 14 days after the clinic and your clinic fee is
                      fully credited.
                    </div>

                    {state.error && (
                      <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                        <p className="text-sm text-red-700">{state.error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full rounded-xl bg-blue-600 py-4 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
                    >
                      {isPending ? "Joining..." : "Join the Summer Waitlist"}
                      {!isPending && <ArrowRight className="h-5 w-5" />}
                    </button>

                    <p className="text-[11px] text-slate-400 text-center">
                      No payment required. Spots held first-come, first-served.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 lg:px-20 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                Choose a clinic
              </p>
              <h2 className="mt-2 text-3xl font-bold md:text-4xl text-slate-900">
                Four focused paths. One clear goal.
              </h2>
            </div>
            <p className="max-w-xl text-slate-500">
              Each clinic is priced below a full month of coaching, then
              credited back if your family continues into MathPivot coaching.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {programs.map((program) => (
              <div
                key={program.name}
                className={`relative rounded-2xl border-2 p-6 ${
                  program.featured
                    ? "border-orange-300 bg-orange-50/30 ring-1 ring-orange-200"
                    : "border-slate-200 bg-white"
                }`}
              >
                {program.featured && (
                  <div className="absolute right-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                    Popular
                  </div>
                )}

                <GraduationCap className="mb-4 h-7 w-7 text-blue-600" />
                <h3 className="text-xl font-bold text-slate-900">
                  {program.name}
                </h3>
                <p className="mt-0.5 text-xs text-blue-600 font-medium">
                  {program.audience}
                </p>
                <p className="mt-2 text-sm text-slate-500">{program.pitch}</p>

                <div className="mt-5 flex items-end gap-2">
                  <span className="text-3xl font-bold text-slate-900">
                    {program.price}
                  </span>
                  <span className="pb-0.5 text-slate-400 text-sm">
                    / {program.days}
                  </span>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <p className="text-slate-600">
                    <strong className="text-slate-900">Focus:</strong>{" "}
                    {program.focus}
                  </p>
                  <p className="text-slate-600">
                    <strong className="text-slate-900">Test impact:</strong>{" "}
                    {program.weight}
                  </p>
                  <p className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-blue-700 text-xs">
                    {program.creditExample}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 lg:px-20 bg-slate-50">
        <div className="mx-auto max-w-5xl rounded-2xl border border-blue-200 bg-white p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-orange-500">
                Parent-friendly pricing
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                The clinic is a low-risk starting point.
              </h2>
            </div>
            <div className="space-y-4 text-slate-600">
              <p>
                Summer clinics are priced 30–55% below a typical month of
                coaching.
              </p>
              <p>
                Then MathPivot makes the decision easier:{" "}
                <strong className="text-slate-900">
                  100% of the clinic fee is credited toward coaching enrollment
                  within 14 days.
                </strong>
              </p>
              <p className="rounded-xl bg-orange-50 border border-orange-200 p-4 text-orange-800">
                Example: $249 Propel Math 7 → credited toward $349/mo Foundation
                = net $100 for your first month.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-10 px-6">
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
