import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About MathPivot",
  description:
    "MathPivot applies the discipline of athletic training to math education. Named coaches, mastery tracking, competitions, and career exposure for students who want more than homework help.",
};

export default function AboutPage() {
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
              href="/careers"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Become a Coach
            </Link>
            <Link
              href="/get-started"
              className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
            Sports builds character.
            <br />
            <span className="text-blue-600">MathPivot builds careers.</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            We apply the same discipline, structure, and accountability that
            makes athletic programs produce champions — to math education.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            The problem we saw
          </h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Families spend $6.8 billion on math tutoring every year. Most of
              it buys hours with rotating strangers who provide homework help
              and test prep. No long-term plan. No mastery tracking. No one who
              actually knows the student.
            </p>
            <p className="text-slate-600 leading-relaxed mt-4">
              Meanwhile, youth sports figured this out decades ago. A travel
              ball player has a named coach, a structured season, skills
              assessments, competitions, and a development pathway. Nobody would
              sign their kid up for &ldquo;random batting practice with whoever
              is available this week.&rdquo;
            </p>
            <p className="text-slate-600 leading-relaxed mt-4">
              MathPivot brings that same model to academics. Your child gets a
              named coach who stays with them for years, a curriculum mapped at
              the concept level, competitions that build confidence, and career
              exposure that makes the math tangible.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">
            What makes us different
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Named Coach Relationships",
                desc: "No rotating tutors. Your child's coach knows their learning style, their confidence gaps, their goals. Coaches stay with students for the duration of the program.",
              },
              {
                title: "Concept-Level Mastery Tracking",
                desc: "We track mastery at the individual concept level — not just test scores. Parents see exactly what their child has mastered, what's developing, and what needs work.",
              },
              {
                title: "Mathathlon Competitions",
                desc: "Internal competitions modeled after AMC and MATHCOUNTS. Students compete, build confidence, and develop the problem-solving speed that separates good from great.",
              },
              {
                title: "Career Spotlight",
                desc: "Every student sees which careers connect to their strongest math domains. Data scientist, aerospace engineer, architect — we make the connection between today's math and tomorrow's career.",
              },
              {
                title: "Structured Programs, Not Sessions",
                desc: "Three tracks — Foundation (2x/week), Acceleration (3x/week), Elite (4x/week). Each with a structured curriculum, onboarding protocol, and measurable outcomes.",
              },
              {
                title: "Homeschool Compliance",
                desc: "Attendance logs, mastery portfolios, progress reports, and academic transcripts. Exportable documents that meet state compliance requirements.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="border border-slate-200 rounded-xl p-5"
              >
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Our mission</h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Every student deserves a coach who knows their name, a plan that
            meets them where they are, and a path that shows them where math can
            take them. MathPivot exists to make that the standard, not the
            exception.
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">
            By the numbers
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { value: "179+", label: "Curriculum concepts mapped" },
              { value: "60 min", label: "Structured session format" },
              { value: "12", label: "Career pathways connected" },
              { value: "6-step", label: "Onboarding protocol" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-blue-600">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-blue-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-slate-600 mb-8">
            Whether you&apos;re a family looking for real math coaching or a
            coach ready to build a practice — we&apos;d love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/get-started"
              className="inline-flex items-center justify-center bg-blue-600 text-white font-medium px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Enroll Your Child
            </Link>
            <Link
              href="/careers"
              className="inline-flex items-center justify-center bg-white text-slate-700 font-medium px-8 py-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
            >
              Become a Coach
            </Link>
          </div>
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
            <Link href="/careers" className="hover:text-white">
              Careers
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
