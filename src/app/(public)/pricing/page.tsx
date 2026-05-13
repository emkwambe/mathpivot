import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "MathPivot coaching programs: Foundation ($349/mo), Acceleration ($549/mo), Elite ($799/mo). Named coach, mastery tracking, competition prep.",
};

const PROGRAMS = [
  {
    name: "Foundation",
    price: "349",
    sessions: "2x per week",
    sessionsDetail: "8 sessions/month",
    description:
      "Build strong fundamentals with grade-level mastery. Perfect for students who need structured support and confidence building.",
    features: [
      "Named math coach for the duration",
      "2x per week (60-min sessions)",
      "Mastery tracking dashboard",
      "Career exposure modules",
      "Weekly progress reports",
      "Parent communication rhythm",
    ],
    grades: "Grades 5-12",
    color: "blue",
    featured: false,
  },
  {
    name: "Acceleration",
    price: "549",
    sessions: "3x per week",
    sessionsDetail: "12 sessions/month",
    description:
      "Push beyond grade level with competition prep and applied projects. For students ready to challenge themselves.",
    features: [
      "Everything in Foundation",
      "3x per week (60-min sessions)",
      "Mathathlon competition prep",
      "AMC 8 / MATHCOUNTS readiness",
      "Applied math projects",
      "School curriculum anticipation",
    ],
    grades: "Grades 5-12",
    color: "amber",
    featured: true,
  },
  {
    name: "Elite",
    price: "799",
    sessions: "4x per week",
    sessionsDetail: "16 sessions/month",
    description:
      "Intensive coaching for advanced students pursuing competition excellence and early career exposure.",
    features: [
      "Everything in Acceleration",
      "4x per week (60-min sessions)",
      "1-on-1 intensive coaching",
      "AMC 10/12 and AIME prep",
      "College readiness portfolio",
      "Quarterly career deep-dives",
    ],
    grades: "Grades 6-12",
    color: "purple",
    featured: false,
  },
];

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
    accent: "text-blue-600",
    button: "bg-blue-600 hover:bg-blue-700 text-white",
    feature: "text-blue-500",
  },
  amber: {
    bg: "bg-white",
    border: "border-amber-300 ring-2 ring-amber-200",
    badge: "bg-amber-500 text-white",
    accent: "text-amber-600",
    button: "bg-amber-500 hover:bg-amber-600 text-white",
    feature: "text-amber-500",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    badge: "bg-purple-600 text-white",
    accent: "text-purple-600",
    button: "bg-purple-600 hover:bg-purple-700 text-white",
    feature: "text-purple-500",
  },
};

export default function PricingPage() {
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
              href="/get-started"
              className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">
        <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-3">
          Coaching Programs
        </p>
        <h1 className="text-4xl font-bold text-slate-900">
          Invest in mastery, not hours
        </h1>
        <p className="text-lg text-slate-600 mt-3 max-w-2xl mx-auto">
          Every program includes a named math coach, structured curriculum,
          mastery tracking, and career exposure. No rotating strangers. No
          homework help by the hour.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {PROGRAMS.map((plan) => {
            const colors = colorMap[plan.color];
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 ${colors.border} ${colors.bg} p-6 flex flex-col ${plan.featured ? "scale-105" : ""}`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}
                  >
                    {plan.name}
                  </span>
                  <p className="text-sm text-slate-500 mt-3">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-1">
                  <span className={`text-4xl font-bold ${colors.accent}`}>
                    ${plan.price}
                  </span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>
                <p className="text-xs text-slate-400 mb-6">
                  {plan.sessions} &middot; {plan.sessionsDetail} &middot;
                  3-month minimum
                </p>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
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
                      <span className="text-slate-700">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/get-started"
                  className={`block text-center font-semibold py-3 rounded-xl transition-colors ${colors.button}`}
                >
                  Enroll Now
                </Link>

                <p className="text-xs text-slate-400 text-center mt-3">
                  {plan.grades}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            What every program includes
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                title: "Named Math Coach",
                desc: "Same coach for the entire program",
              },
              {
                title: "60-Min Sessions",
                desc: "Structured warm-up to wrap-up",
              },
              {
                title: "Mastery Tracking",
                desc: "Concept-level progress visibility",
              },
              {
                title: "Career Exposure",
                desc: "Math-to-career connection modules",
              },
              {
                title: "Parent Reports",
                desc: "Weekly progress + mastery updates",
              },
              {
                title: "6-Step Onboarding",
                desc: "Diagnostic + personalized plan",
              },
              {
                title: "Competition Prep",
                desc: "Mathathlon + AMC/MATHCOUNTS",
              },
              {
                title: "Homeschool Records",
                desc: "Exportable compliance documents",
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <h3 className="font-semibold text-slate-900 text-sm">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Questions?</h2>
          <p className="text-slate-600 mb-8">
            Every enrollment starts with a free diagnostic assessment so we can
            recommend the right track. No commitment required to learn more.
          </p>
          <Link
            href="/get-started"
            className="inline-flex items-center justify-center bg-blue-600 text-white font-medium px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Request Free Consultation
          </Link>
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
            <Link href="/careers" className="hover:text-white">
              Careers
            </Link>
            <Link href="/login" className="hover:text-white">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
