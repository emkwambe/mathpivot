"use client";

export default function SummerHandout() {
  return (
    <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white">
      <div className="fixed top-4 right-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-5 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors shadow-lg text-sm"
        >
          Print Summer Handout
        </button>
      </div>

      <div className="w-[8.5in] min-h-[11in] bg-white shadow-2xl print:shadow-none mx-auto relative overflow-hidden">
        {/* Orange accent bar */}
        <div className="h-2 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />

        <div className="p-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xl block">
                  MathPivot
                </span>
                <span className="text-[10px] text-slate-500 tracking-wide">
                  Mathematics Coaching Academy
                </span>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
              <p className="text-orange-600 font-bold text-sm">Summer 2026</p>
              <p className="text-[10px] text-orange-500">
                Spots Limited — Register Now
              </p>
            </div>
          </div>

          {/* Headline */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-slate-900 leading-tight">
              Summer Math Clinics
            </h1>
            <p className="text-lg text-slate-600 mt-3 max-w-xl mx-auto">
              Focused, diagnostic-driven programs that identify gaps, build
              confidence, and prepare your child for the next school year.
            </p>
          </div>

          {/* Two Waves */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Wave 1 */}
            <div className="border-2 border-blue-700 rounded-2xl overflow-hidden">
              <div className="bg-blue-700 text-white px-5 py-3 text-center">
                <p className="font-bold text-sm">WAVE 1 — Starts July 6</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="border border-slate-200 rounded-xl p-4">
                  <p className="font-bold text-slate-900">Propel Math 7</p>
                  <p className="text-xs text-blue-700 font-medium">
                    Rising 7th Graders
                  </p>
                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <p className="text-xs text-slate-500">July 6 – July 15</p>
                      <p className="text-xs text-slate-500">8 days</p>
                    </div>
                    <p className="text-xl font-bold text-blue-700">$249</p>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    Focus: Ratios & Proportional Relationships
                  </p>
                  <p className="text-[10px] text-blue-600 mt-1">
                    $75 enrollment credit toward Foundation Coaching
                  </p>
                </div>

                <div className="border-2 border-orange-400 rounded-xl p-4 relative">
                  <span className="absolute -top-2 right-3 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    FEATURED
                  </span>
                  <p className="font-bold text-slate-900">Ignite Math 1</p>
                  <p className="text-xs text-blue-700 font-medium">
                    Rising 9th Graders
                  </p>
                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <p className="text-xs text-slate-500">July 6 – July 17</p>
                      <p className="text-xs text-slate-500">10 days</p>
                    </div>
                    <p className="text-xl font-bold text-blue-700">$449</p>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    Focus: Number Sense, Algebra, and Functions
                  </p>
                  <p className="text-[10px] text-blue-600 mt-1">
                    $100 enrollment credit toward Foundation Coaching
                  </p>
                </div>
              </div>
            </div>

            {/* Wave 2 */}
            <div className="border-2 border-slate-300 rounded-2xl overflow-hidden">
              <div className="bg-slate-700 text-white px-5 py-3 text-center">
                <p className="font-bold text-sm">WAVE 2 — Starts July 20</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="border border-slate-200 rounded-xl p-4">
                  <p className="font-bold text-slate-900">Advantage Math 8</p>
                  <p className="text-xs text-blue-700 font-medium">
                    Rising 8th Graders
                  </p>
                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <p className="text-xs text-slate-500">
                        July 20 – July 30
                      </p>
                      <p className="text-xs text-slate-500">9 days</p>
                    </div>
                    <p className="text-xl font-bold text-blue-700">$349</p>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    Focus: Functions & Relations
                  </p>
                  <p className="text-[10px] text-blue-600 mt-1">
                    $100 enrollment credit toward Acceleration Coaching
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-4">
                  <p className="font-bold text-slate-900">Ascent Pre-Calc</p>
                  <p className="text-xs text-blue-700 font-medium">
                    Rising 11th Graders
                  </p>
                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <p className="text-xs text-slate-500">
                        July 20 – August 1
                      </p>
                      <p className="text-xs text-slate-500">11 days</p>
                    </div>
                    <p className="text-xl font-bold text-blue-700">$549</p>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    Focus: Advanced Functions, Trig, Pre-Calculus
                  </p>
                  <p className="text-[10px] text-blue-600 mt-1">
                    $150 enrollment credit toward MathPivot Advanced
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-100">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Every Clinic Includes
            </p>
            <div className="grid grid-cols-4 gap-4 text-center">
              {[
                "Dedicated Math Coach",
                "Diagnostic Assessment",
                "Mastery Tracking",
                "Progress Report",
              ].map((item) => (
                <div key={item}>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1.5">
                    <svg
                      className="w-4 h-4 text-blue-700"
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
                  </div>
                  <p className="text-xs font-medium text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cohort Size */}
          <div className="bg-blue-700 text-white rounded-xl p-6 mb-8 text-center">
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">
              Micro-Cohort Learning
            </p>
            <p className="text-2xl font-bold">
              Limited to 5–6 students per cohort
            </p>
            <p className="text-blue-200 text-sm mt-1">
              More personalization. More participation. Better outcomes.
            </p>
          </div>

          {/* How to Register */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              {
                step: "1",
                title: "Take the Diagnostic",
                desc: "mathpivot.com/diagnostic",
                sub: "Free · 15 minutes",
              },
              {
                step: "2",
                title: "Join the Waitlist",
                desc: "mathpivot.com/summer",
                sub: "Pick your clinic",
              },
              {
                step: "3",
                title: "We Follow Up",
                desc: "Within 48 hours",
                sub: "Schedule & placement",
              },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-lg">
                  {s.step}
                </div>
                <p className="text-sm font-bold text-slate-900">{s.title}</p>
                <p className="text-xs text-blue-700 font-medium mt-1">
                  {s.desc}
                </p>
                <p className="text-[10px] text-slate-500">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">MathPivot</p>
              <p className="text-[10px] text-slate-500">
                Build Confidence. Master Mathematics. Expand Opportunities.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-blue-700">mathpivot.com</p>
              <p className="text-[10px] text-slate-500">mathpivot.com/summer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
