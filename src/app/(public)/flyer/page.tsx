"use client";

import Link from "next/link";

export default function FlyerPage() {
  return (
    <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white">
      {/* Print Controls */}
      <div className="fixed top-4 right-4 print:hidden flex gap-3 z-50">
        <Link
          href="/flyer/summer"
          className="px-5 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors shadow-lg text-sm"
        >
          Summer Handout
        </Link>
        <Link
          href="/flyer/tearoff"
          className="px-5 py-3 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-lg text-sm"
        >
          Tear-Off Flyer
        </Link>
        <button
          onClick={() => window.print()}
          className="px-5 py-3 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors shadow-lg text-sm"
        >
          Print This Page
        </button>
      </div>

      {/* Main Diagnostic Flyer — 8.5x11 */}
      <div className="w-[8.5in] min-h-[11in] bg-white shadow-2xl print:shadow-none mx-auto p-0 relative overflow-hidden">
        {/* Top accent bar */}
        <div className="h-2 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700" />

        <div className="p-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-blue-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">M</span>
              </div>
              <div>
                <span className="font-bold text-slate-900 text-2xl block">
                  MathPivot
                </span>
                <span className="text-xs text-slate-500 tracking-wide">
                  Mathematics Coaching Academy
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-orange-500 font-bold uppercase tracking-widest">
                Summer 2026
              </p>
              <p className="text-xs text-slate-500">
                Wave 1: July 6 · Wave 2: July 20
              </p>
            </div>
          </div>

          {/* Headline */}
          <div className="mb-10">
            <h1 className="text-5xl font-bold text-slate-900 leading-[1.1]">
              Build Confidence.
              <br />
              Master Mathematics.
              <br />
              <span className="text-blue-700">Expand Opportunities.</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-lg mt-5 leading-relaxed">
              MathPivot develops mathematical thinkers through personalized
              roadmaps, dedicated coaches, and micro-cohort learning
              environments limited to 5–6 students.
            </p>
          </div>

          {/* Free Diagnostic CTA */}
          <div className="bg-blue-700 text-white rounded-2xl p-7 mb-10 flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">
                Free Diagnostic Assessment
              </p>
              <p className="text-2xl font-bold">
                Is your child ready for the next grade level?
              </p>
              <p className="text-blue-200 mt-1 text-sm">
                15 minutes. 5 math domains. Instant results emailed to you.
              </p>
            </div>
            <div className="text-right flex-shrink-0 ml-6">
              <p className="text-sm text-blue-200">Take it now at</p>
              <p className="text-xl font-bold">mathpivot.com/diagnostic</p>
            </div>
          </div>

          {/* Programs Overview */}
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              Year-Round Coaching Programs
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="border border-slate-200 rounded-xl p-5">
                <p className="font-bold text-slate-900">Foundation</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  $349
                  <span className="text-sm text-slate-400 font-normal">
                    /mo
                  </span>
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  2 coaching meetings/week
                </p>
                <p className="text-xs text-slate-500">Grades 5–10</p>
                <p className="text-xs text-slate-600 mt-2">
                  Build confidence and close foundational learning gaps.
                </p>
              </div>
              <div className="border-2 border-blue-700 rounded-xl p-5 relative">
                <span className="absolute -top-2.5 left-4 bg-blue-700 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  POPULAR
                </span>
                <p className="font-bold text-slate-900">Acceleration</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  $549
                  <span className="text-sm text-slate-400 font-normal">
                    /mo
                  </span>
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  3 coaching meetings/week
                </p>
                <p className="text-xs text-slate-500">Grades 6–12</p>
                <p className="text-xs text-slate-600 mt-2">
                  Move ahead of school expectations with advanced
                  problem-solving.
                </p>
              </div>
              <div className="border border-slate-200 rounded-xl p-5">
                <p className="font-bold text-slate-900">Advanced</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  $799
                  <span className="text-sm text-slate-400 font-normal">
                    /mo
                  </span>
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  2–3 meetings + opportunities
                </p>
                <p className="text-xs text-slate-500">Grades 6–12</p>
                <p className="text-xs text-slate-600 mt-2">
                  Exceptional talent development and STEM readiness.
                </p>
              </div>
            </div>
          </div>

          {/* Summer Clinics */}
          <div className="bg-slate-50 rounded-2xl p-6 mb-10 border border-slate-100">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3">
              Summer 2026 Math Clinics
            </p>
            <div className="grid grid-cols-4 gap-3">
              {[
                {
                  name: "Propel Math 7",
                  price: "$249",
                  days: "8 days",
                  audience: "Rising 7th",
                },
                {
                  name: "Advantage Math 8",
                  price: "$349",
                  days: "9 days",
                  audience: "Rising 8th",
                },
                {
                  name: "Ignite Math 1",
                  price: "$449",
                  days: "10 days",
                  audience: "Rising 9th",
                  featured: true,
                },
                {
                  name: "Ascent Pre-Calc",
                  price: "$549",
                  days: "11 days",
                  audience: "Rising 11th",
                },
              ].map((c) => (
                <div
                  key={c.name}
                  className={`rounded-lg p-3 text-center ${c.featured ? "bg-blue-700 text-white" : "bg-white border border-slate-200"}`}
                >
                  <p
                    className={`text-xs font-bold ${c.featured ? "text-blue-200" : "text-slate-500"}`}
                  >
                    {c.audience}
                  </p>
                  <p
                    className={`font-bold text-sm mt-1 ${c.featured ? "text-white" : "text-slate-900"}`}
                  >
                    {c.name}
                  </p>
                  <p
                    className={`text-lg font-bold mt-1 ${c.featured ? "text-white" : "text-blue-700"}`}
                  >
                    {c.price}
                  </p>
                  <p
                    className={`text-[10px] ${c.featured ? "text-blue-200" : "text-slate-400"}`}
                  >
                    {c.days}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 text-center mt-3">
              Clinic graduates receive an enrollment credit toward year-round
              coaching.
            </p>
          </div>

          {/* What Makes Us Different */}
          <div className="grid grid-cols-4 gap-4 mb-10">
            {[
              { label: "Dedicated Coach", desc: "Same coach throughout" },
              { label: "5–6 Students", desc: "Micro-cohort learning" },
              { label: "Mastery Tracking", desc: "Concept-level progress" },
              { label: "Diagnostic-Driven", desc: "Personalized roadmap" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <div className="w-3 h-3 bg-blue-700 rounded-full" />
                </div>
                <p className="text-xs font-bold text-slate-900">{item.label}</p>
                <p className="text-[10px] text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">mathpivot.com</p>
              <p className="text-xs text-slate-500">
                Mathematics Coaching Academy
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">
                Free Diagnostic:{" "}
                <strong className="text-blue-700">
                  mathpivot.com/diagnostic
                </strong>
              </p>
              <p className="text-xs text-slate-500">
                Summer Waitlist:{" "}
                <strong className="text-orange-500">
                  mathpivot.com/summer
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
