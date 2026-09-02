import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Become a MathPivot Coach",
  description:
    "Join MathPivot as a math coach. Named coach relationships, structured curriculum, 60% revenue share, and the tools to run your coaching practice professionally.",
};

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-slate-900">MathPivot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Sign in
            </Link>
            <Link
              href="#apply"
              className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </header>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-3">
            Careers at MathPivot
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
            Coach math like it&apos;s a sport.
            <br />
            <span className="text-blue-600">Get paid like a professional.</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
            MathPivot coaches aren&apos;t hourly tutors. You&apos;re a named
            coach with a portfolio of students, a structured curriculum, and the
            tools to build long-term relationships that produce real outcomes.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">
            Why coaches choose MathPivot
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "60% Revenue Share",
                desc: "Earn $26-30 per session. No gig economy rates — you're paid what you're worth. Transparent monthly payouts.",
                accent: "text-green-600",
                bg: "bg-green-50",
              },
              {
                title: "Named Coach Model",
                desc: "Your students stay with you for years, not hours. You build a real practice, not a queue of strangers.",
                accent: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                title: "Full Operating System",
                desc: "Session prep briefs, mastery tracking, onboarding protocols, parent digests, and performance dashboards — all built in.",
                accent: "text-purple-600",
                bg: "bg-purple-50",
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`${item.bg} rounded-xl p-6 border border-slate-100`}
              >
                <h3 className={`text-lg font-bold ${item.accent} mb-2`}>
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-4">
            What a MathPivot coach does
          </h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            This is structured coaching, not homework help. Every session has
            purpose, every student has a plan, and every week produces
            measurable progress.
          </p>

          <div className="space-y-4">
            {[
              {
                title: "Own a student portfolio",
                desc: "3-8 students across Foundation, Acceleration, and Advanced programs. You know every student's strengths, gaps, and goals.",
              },
              {
                title: "Run structured 60-minute sessions",
                desc: "Pre-populated prep briefs, session templates, and mastery tracking. Warm-up, review, core instruction, practice, wrap-up.",
              },
              {
                title: "Complete onboarding protocols",
                desc: "Six-step onboarding for every new student: rapport, diagnostic, parent alignment, learning plan, communication setup, first mastery update.",
              },
              {
                title: "Track mastery at the concept level",
                desc: "Update student mastery after every session. Parents see real-time progress. Your dashboard shows which concepts are stalled.",
              },
              {
                title: "Prepare students for competition",
                desc: "Mathathlon internal competitions and external prep (AMC 8, MATHCOUNTS, AMC 10/12). You're building competitors, not just passing grades.",
              },
              {
                title: "Connect math to careers",
                desc: "Every student sees how their strongest math domains connect to real careers — data scientist, aerospace engineer, architect. You make it tangible.",
              },
            ].map((item, i) => (
              <div
                key={item.title}
                className="flex gap-4 p-4 rounded-xl border border-slate-200 bg-white"
              >
                <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            Coaching economics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                label: "Foundation Coach",
                sessions: "8 sessions/mo per student",
                rate: "~$26/session",
                example: "5 students = $1,040/mo",
              },
              {
                label: "Acceleration Coach",
                sessions: "12 sessions/mo per student",
                rate: "~$27/session",
                example: "4 students = $1,296/mo",
              },
              {
                label: "Elite Coach",
                sessions: "16 sessions/mo per student",
                rate: "~$30/session",
                example: "3 students = $1,440/mo",
              },
            ].map((tier) => (
              <div
                key={tier.label}
                className="bg-slate-800 rounded-xl p-5 border border-slate-700"
              >
                <h3 className="font-bold text-white mb-3">{tier.label}</h3>
                <p className="text-sm text-slate-400">{tier.sessions}</p>
                <p className="text-xl font-bold text-green-400 mt-2">
                  {tier.rate}
                </p>
                <p className="text-xs text-slate-500 mt-2">{tier.example}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-500 mt-6">
            Coaches with mixed portfolios across all three tracks can earn
            $2,000-4,000+/month part-time.
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-4">
            What we look for
          </h2>
          <p className="text-slate-600 text-center mb-10">
            We don&apos;t hire tutors. We recruit coaches.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "Strong math background (STEM degree preferred, not required)",
              "Experience working with middle or high school students",
              "Comfort with structured curriculum and mastery-based assessment",
              "Reliability — students depend on you showing up every session",
              "Growth mindset — you believe every student can improve",
              "Competition-ready knowledge (AMC, MATHCOUNTS) is a plus",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
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
                <span className="text-sm text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="apply" className="py-16 px-4 bg-blue-50">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
            Apply to coach
          </h2>
          <p className="text-slate-600 text-center mb-8 text-sm">
            Tell us about yourself. We review applications within 48 hours.
          </p>

          <form
            action="/api/coach-application"
            method="POST"
            className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
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
                  name="email"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Highest Education *
              </label>
              <select
                name="education"
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select</option>
                <option value="high_school">High School</option>
                <option value="some_college">Some College</option>
                <option value="bachelors">Bachelor&apos;s Degree</option>
                <option value="masters">Master&apos;s Degree</option>
                <option value="phd">PhD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Math-related experience *
              </label>
              <textarea
                name="experience"
                required
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your experience teaching, tutoring, or coaching math. Include any competition experience (AMC, MATHCOUNTS, etc.)."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Which tracks interest you? *
              </label>
              <div className="flex gap-4">
                {["Foundation", "Acceleration", "Advanced"].map((track) => (
                  <label
                    key={track}
                    className="flex items-center gap-1.5 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="tracks"
                      value={track.toLowerCase()}
                      className="rounded text-blue-600"
                    />
                    {track}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Available hours per week *
              </label>
              <select
                name="availability"
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select</option>
                <option value="5-10">5-10 hours</option>
                <option value="10-20">10-20 hours</option>
                <option value="20-30">20-30 hours</option>
                <option value="30+">30+ hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Why MathPivot?
              </label>
              <textarea
                name="motivation"
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What draws you to structured coaching vs. traditional tutoring?"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Submit Application
            </button>

            <p className="text-[11px] text-slate-400 text-center">
              Applications are reviewed within 48 hours. Background check
              required before onboarding.
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
              Pricing
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
