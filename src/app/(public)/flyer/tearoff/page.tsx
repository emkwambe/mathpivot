"use client";

export default function TearOffFlyer() {
  const tearOffUrl = "mathpivot.com/diagnostic";
  const tabs = Array.from({ length: 8 });

  return (
    <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white">
      <div className="fixed top-4 right-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-5 py-3 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-lg text-sm"
        >
          Print Tear-Off Flyer
        </button>
      </div>

      <div className="w-[8.5in] min-h-[11in] bg-white shadow-2xl print:shadow-none mx-auto relative overflow-hidden flex flex-col">
        {/* Blue accent bar */}
        <div className="h-2 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700" />

        {/* Main content area */}
        <div className="p-10 flex-1">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
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

          {/* Main Headline */}
          <h1 className="text-5xl font-bold text-slate-900 leading-[1.1] mb-4">
            Is your child
            <br />
            ready for the
            <br />
            <span className="text-blue-700">next math level?</span>
          </h1>

          <p className="text-lg text-slate-600 max-w-md mb-8 leading-relaxed">
            Take our free 15-minute diagnostic and find out exactly where your
            child stands across 5 core math domains.
          </p>

          {/* What You Get */}
          <div className="space-y-3 mb-8">
            {[
              "Instant score report emailed to you",
              "Strengths and focus areas identified",
              "Personalized program recommendation",
              "No cost — no commitment",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3.5 h-3.5 text-blue-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>

          {/* CTA Box */}
          <div className="bg-blue-700 text-white rounded-2xl p-7 mb-8">
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">
              Free Math Diagnostic
            </p>
            <p className="text-3xl font-bold">mathpivot.com/diagnostic</p>
            <p className="text-blue-200 text-sm mt-2">
              Or scan a tab below to get started
            </p>
          </div>

          {/* Programs Summary */}
          <div className="flex items-center justify-between text-sm text-slate-600 mb-6">
            <div>
              <p className="font-bold text-slate-900">Summer Clinics</p>
              <p className="text-xs">$249–$549 · July 2026</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="font-bold text-slate-900">Year-Round Coaching</p>
              <p className="text-xs">$349–$799/mo · Grades 5–12</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="font-bold text-slate-900">5–6 Students</p>
              <p className="text-xs">Per micro-cohort</p>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center">
            MathPivot — Build Confidence. Master Mathematics. Expand
            Opportunities.
          </p>
        </div>

        {/* Tear-off tabs */}
        <div className="border-t-2 border-dashed border-slate-300 mt-auto">
          <div className="flex">
            {tabs.map((_, i) => (
              <div
                key={i}
                className={`flex-1 py-3 px-1 text-center ${i < tabs.length - 1 ? "border-r border-dashed border-slate-300" : ""}`}
                style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
              >
                <p className="text-[9px] font-bold text-blue-700 mb-1">
                  MathPivot
                </p>
                <p className="text-[8px] text-slate-600">Free Math</p>
                <p className="text-[8px] text-slate-600">Diagnostic</p>
                <p className="text-[8px] font-bold text-slate-900 mt-1">
                  {tearOffUrl}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
