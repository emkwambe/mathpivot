"use client";

export default function FlyerPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8 print:p-0 print:bg-white">
      <div className="w-[8.5in] min-h-[11in] bg-white shadow-2xl print:shadow-none p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-50 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="font-bold text-slate-900 text-2xl">MathPivot</span>
          </div>

          <div className="mb-10">
            <p className="text-orange-500 font-bold text-sm uppercase tracking-widest mb-2">
              Free Math Assessment
            </p>
            <h1 className="text-5xl font-bold text-slate-900 leading-tight">
              Where does your
              <br />
              child stand in
              <br />
              <span className="text-blue-700">math?</span>
            </h1>
          </div>

          <p className="text-lg text-slate-600 max-w-lg mb-10 leading-relaxed">
            Our 15-minute diagnostic covers 6 core math domains and tells you
            exactly where your child is strong — and where they need support.
            <strong className="text-slate-800"> No cost. No commitment.</strong>
          </p>

          <div className="grid grid-cols-3 gap-6 mb-10">
            {[
              { stat: "6", label: "Math domains\nassessed" },
              { stat: "15", label: "Minutes to\ncomplete" },
              { stat: "100%", label: "Free. No strings\nattached." },
            ].map((item) => (
              <div key={item.stat} className="text-center">
                <p className="text-4xl font-bold text-blue-700">{item.stat}</p>
                <p className="text-sm text-slate-500 mt-1 whitespace-pre-line">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-[#F8FAFC] rounded-2xl p-8 mb-10 border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              What you get:
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                "Domain-by-domain score report",
                "Program placement recommendation",
                "Strengths & focus areas identified",
                "Personalized coaching plan",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
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
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="bg-blue-700 text-white rounded-2xl px-8 py-6 inline-block">
              <p className="text-sm font-medium text-blue-200 mb-1">
                Take the free assessment at
              </p>
              <p className="text-3xl font-bold">mathpivot.com/diagnostic</p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                MathPivot — The Travel Ball of Math
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Named coaches · Mastery tracking · Competition prep · Career
                exposure
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">
                Summer Clinics: $249-$449
              </p>
              <p className="text-sm text-slate-600">Year-Round: $349-$799/mo</p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed top-4 right-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors shadow-lg"
        >
          Print Flyer
        </button>
      </div>
    </div>
  );
}
