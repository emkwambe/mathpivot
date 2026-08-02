import Link from "next/link";
import type { Metadata } from "next";
import { PERSONA_LANDING } from "@/lib/persona-landing-content";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "MathPivot for Every Family — Find Your Path",
  description:
    "MathPivot builds math coaching pathways for homeschool families, competition math students, travel ball families, schools, and more.",
};

const DESCRIPTIONS: Record<string, string> = {
  homeschool:
    "Expert math coaching for the one subject you can't teach past pre-algebra.",
  competition:
    "Elite prep for AMC, MATHCOUNTS, AIME. Small cohorts, dedicated coach.",
  "travel-ball":
    "The travel ball model applied to math — structure, coach, and season.",
  schools:
    "Certified coaches and mastery data for school and district partnerships.",
  "falling-behind":
    "Free diagnostic + summer clinic to rebuild confidence fast.",
  proactive: "Beyond grade level — structured coaching for motivated families.",
};

export default function ForIndexPage() {
  const entries = Object.values(PERSONA_LANDING);
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-slate-800 text-lg">MathPivot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Programs
            </Link>
            <Link
              href="/diagnostic"
              className="text-sm font-semibold bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Free Diagnostic
            </Link>
          </div>
        </div>
      </header>

      <section className="px-4 pt-16 pb-12 text-center max-w-4xl mx-auto">
        <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-3">
          Find Your Path
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
          Every family is different.
          <br />
          <span className="text-blue-700">Every path should be too.</span>
        </h1>
        <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
          MathPivot builds coaching pathways for six distinct family types. Find
          yours below to see how MathPivot fits your situation.
        </p>
      </section>

      <section className="px-4 pb-20 max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {entries.map((entry) => (
            <Link
              key={entry.slug}
              href={`/for/${entry.slug}`}
              className="group block bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-3">
                For {entry.hero.eyebrow.replace("For ", "")}
              </p>
              <h2 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
                {entry.hero.headline}{" "}
                <span className="text-slate-500">
                  {entry.hero.headlineAccent}
                </span>
              </h2>
              <p className="text-sm text-slate-600 mt-3 mb-4 leading-relaxed">
                {DESCRIPTIONS[entry.slug] || entry.metaDescription}
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 group-hover:gap-2.5 transition-all">
                Learn more <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-700 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="text-sm text-slate-500">MathPivot</span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm justify-center">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <Link href="/pricing" className="hover:text-white">
              Programs
            </Link>
            <Link href="/diagnostic" className="hover:text-white">
              Diagnostic
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
