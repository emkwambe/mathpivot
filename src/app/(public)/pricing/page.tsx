import Link from "next/link";

const PLANS = [
  {
    name: "Starter",
    price: "49",
    period: "per session",
    description: "Perfect for trying out MathPivot",
    features: [
      "1-on-1 tutoring sessions",
      "Skill mastery tracking",
      "Session notes for parents",
      "Email support",
    ],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Growth",
    price: "199",
    period: "per month",
    description: "Most popular for regular tutoring",
    features: [
      "Everything in Starter",
      "4 sessions per month",
      "AI Coach access (24/7)",
      "Weekly progress reports",
      "Homework assignments",
      "Priority scheduling",
      "In-app messaging",
    ],
    cta: "Start Free Trial",
    featured: true,
  },
  {
    name: "Accelerator",
    price: "399",
    period: "per month",
    description: "For serious math advancement",
    features: [
      "Everything in Growth",
      "8 sessions per month",
      "Competition prep (AMC, MATHCOUNTS)",
      "Career pathway planning",
      "Certification programs",
      "Group study sessions",
      "Desmos calculator tools",
      "Dedicated tutor matching",
    ],
    cta: "Get Started",
    featured: false,
  },
];

const CENTER_PLAN = {
  name: "For Coaching Centers",
  description: "Full platform access for your organization",
  features: [
    "Unlimited tutors and students",
    "Lead pipeline & CRM",
    "Coach payroll management",
    "Invoice generation",
    "Room & schedule management",
    "CSV import/export",
    "Multi-location support",
    "COPPA/FERPA compliance",
    "Dedicated onboarding",
  ],
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
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

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg text-slate-600 mt-3">
          No hidden fees. Cancel anytime. Free diagnostic assessment included.
        </p>
      </section>

      {/* Plans */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 ${plan.featured ? "bg-blue-600 text-white ring-4 ring-blue-600/20 scale-105" : "bg-white border border-slate-200"}`}
            >
              {plan.featured && (
                <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <h3
                className={`text-xl font-bold mt-3 ${plan.featured ? "text-white" : "text-slate-900"}`}
              >
                {plan.name}
              </h3>
              <p
                className={`text-sm mt-1 ${plan.featured ? "text-blue-100" : "text-slate-500"}`}
              >
                {plan.description}
              </p>
              <div className="mt-4 mb-6">
                <span
                  className={`text-4xl font-bold ${plan.featured ? "text-white" : "text-slate-900"}`}
                >
                  ${plan.price}
                </span>
                <span
                  className={`text-sm ml-1 ${plan.featured ? "text-blue-200" : "text-slate-500"}`}
                >
                  {plan.period}
                </span>
              </div>
              <ul className="space-y-2.5 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <svg
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.featured ? "text-blue-200" : "text-green-500"}`}
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
                    <span
                      className={
                        plan.featured ? "text-blue-50" : "text-slate-600"
                      }
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/get-started"
                className={`block text-center font-semibold py-3 rounded-xl transition-colors ${plan.featured ? "bg-white text-blue-600 hover:bg-blue-50" : "bg-blue-600 text-white hover:bg-blue-700"}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Enterprise */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 md:flex items-center gap-8">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-900">
                {CENTER_PLAN.name}
              </h3>
              <p className="text-slate-600 mt-2 mb-4">
                {CENTER_PLAN.description}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CENTER_PLAN.features.map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 text-sm text-slate-600"
                  >
                    <svg
                      className="w-4 h-4 text-green-500 flex-shrink-0"
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
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 md:mt-0 text-center">
              <p className="text-3xl font-bold text-slate-900">Custom</p>
              <p className="text-sm text-slate-500 mb-4">pricing</p>
              <Link
                href="/get-started"
                className="bg-slate-900 text-white font-semibold px-8 py-3 rounded-xl hover:bg-slate-800 transition-colors inline-block"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-400">
          &copy; {new Date().getFullYear()} MathPivot. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
