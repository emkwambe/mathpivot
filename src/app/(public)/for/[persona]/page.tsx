import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PERSONA_LANDING, PERSONA_SLUGS } from "@/lib/persona-landing-content";
import { ArrowRight, CheckCircle2, GraduationCap } from "lucide-react";

const COLOR_MAP = {
  blue: {
    accent: "text-blue-700",
    accentBg: "bg-blue-700",
    accentBgHover: "hover:bg-blue-800",
    softBg: "bg-blue-50",
    softBorder: "border-blue-200",
    tag: "text-blue-700 bg-blue-50 border-blue-200",
    highlight: "bg-gradient-to-r from-blue-100 to-blue-50",
    check: "text-blue-700",
    checkBg: "bg-blue-100",
    programBg: "bg-blue-700",
  },
  orange: {
    accent: "text-orange-600",
    accentBg: "bg-orange-500",
    accentBgHover: "hover:bg-orange-600",
    softBg: "bg-orange-50",
    softBorder: "border-orange-200",
    tag: "text-orange-700 bg-orange-50 border-orange-200",
    highlight: "bg-gradient-to-r from-orange-100 to-orange-50",
    check: "text-orange-600",
    checkBg: "bg-orange-100",
    programBg: "bg-orange-500",
  },
  emerald: {
    accent: "text-emerald-700",
    accentBg: "bg-emerald-600",
    accentBgHover: "hover:bg-emerald-700",
    softBg: "bg-emerald-50",
    softBorder: "border-emerald-200",
    tag: "text-emerald-700 bg-emerald-50 border-emerald-200",
    highlight: "bg-gradient-to-r from-emerald-100 to-emerald-50",
    check: "text-emerald-600",
    checkBg: "bg-emerald-100",
    programBg: "bg-emerald-600",
  },
  red: {
    accent: "text-red-700",
    accentBg: "bg-red-600",
    accentBgHover: "hover:bg-red-700",
    softBg: "bg-red-50",
    softBorder: "border-red-200",
    tag: "text-red-700 bg-red-50 border-red-200",
    highlight: "bg-gradient-to-r from-red-100 to-red-50",
    check: "text-red-600",
    checkBg: "bg-red-100",
    programBg: "bg-red-600",
  },
  purple: {
    accent: "text-purple-700",
    accentBg: "bg-purple-700",
    accentBgHover: "hover:bg-purple-800",
    softBg: "bg-purple-50",
    softBorder: "border-purple-200",
    tag: "text-purple-700 bg-purple-50 border-purple-200",
    highlight: "bg-gradient-to-r from-purple-100 to-purple-50",
    check: "text-purple-700",
    checkBg: "bg-purple-100",
    programBg: "bg-purple-700",
  },
  indigo: {
    accent: "text-indigo-700",
    accentBg: "bg-indigo-700",
    accentBgHover: "hover:bg-indigo-800",
    softBg: "bg-indigo-50",
    softBorder: "border-indigo-200",
    tag: "text-indigo-700 bg-indigo-50 border-indigo-200",
    highlight: "bg-gradient-to-r from-indigo-100 to-indigo-50",
    check: "text-indigo-700",
    checkBg: "bg-indigo-100",
    programBg: "bg-indigo-700",
  },
};

export async function generateStaticParams() {
  return PERSONA_SLUGS.map((slug) => ({ persona: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ persona: string }>;
}): Promise<Metadata> {
  const { persona } = await params;
  const content = PERSONA_LANDING[persona];
  if (!content) return { title: "MathPivot" };
  return { title: content.title, description: content.metaDescription };
}

export default async function PersonaLandingPage({
  params,
}: {
  params: Promise<{ persona: string }>;
}) {
  const { persona } = await params;
  const content = PERSONA_LANDING[persona];
  if (!content) notFound();
  const c = COLOR_MAP[content.color];

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
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
              className="text-sm text-slate-600 hover:text-slate-900 hidden sm:block"
            >
              Programs
            </Link>
            <Link
              href="/diagnostic"
              className={`text-sm font-semibold ${c.accentBg} text-white px-4 py-2 rounded-lg ${c.accentBgHover} transition-colors`}
            >
              Free Diagnostic
            </Link>
          </div>
        </div>
      </header>

      <section className={`px-4 pt-16 pb-20 ${c.highlight}`}>
        <div className="max-w-4xl mx-auto text-center">
          <span
            className={`inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${c.tag} mb-6`}
          >
            {content.hero.eyebrow}
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1]">
            {content.hero.headline}
            <br />
            <span className={c.accent}>{content.hero.headlineAccent}</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {content.hero.subheadline}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={content.cta.primaryHref}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 ${c.accentBg} ${c.accentBgHover} text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg text-base`}
            >
              {content.cta.primary}
              <ArrowRight size={18} />
            </Link>
            <Link
              href={content.cta.secondaryHref}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-slate-700 font-medium px-8 py-3.5 rounded-xl border border-slate-200 hover:border-slate-300 text-base"
            >
              {content.cta.secondary}
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-10">
            {content.painPoints.heading}
          </h2>
          <div className="space-y-4">
            {content.painPoints.items.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 bg-slate-50 border border-slate-100 rounded-xl p-5"
              >
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-slate-600">
                    {i + 1}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`px-4 py-20 ${c.softBg}`}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            {content.solution.heading}
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {content.solution.bullets.map((b, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
              >
                <div
                  className={`w-10 h-10 ${c.checkBg} rounded-xl flex items-center justify-center mb-4`}
                >
                  <CheckCircle2 className={`w-5 h-5 ${c.check}`} />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{b.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {b.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p
              className={`text-xs font-bold uppercase tracking-widest ${c.accent} mb-2`}
            >
              Recommended for you
            </p>
            <h2 className="text-3xl font-bold text-slate-900">
              Your MathPivot pathway
            </h2>
          </div>
          <div
            className={`rounded-2xl overflow-hidden border-2 ${c.softBorder} bg-white shadow-lg`}
          >
            <div className={`${c.programBg} text-white px-8 py-6`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm opacity-90">Recommended Program</p>
                  <p className="text-2xl font-bold">
                    {content.recommendedProgram.name}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-3xl font-bold">
                    {content.recommendedProgram.price}
                  </p>
                  <p className="text-sm opacity-90">
                    {content.recommendedProgram.frequency}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <p className="text-slate-700 leading-relaxed">
                {content.recommendedProgram.reason}
              </p>
              <Link
                href={content.recommendedProgram.href}
                className={`mt-6 inline-flex items-center gap-2 ${c.accentBg} ${c.accentBgHover} text-white font-semibold px-6 py-3 rounded-xl`}
              >
                See Program Details
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xl sm:text-2xl leading-relaxed">
            &ldquo;{content.socialProof}&rdquo;
          </p>
        </div>
      </section>

      <section className="px-4 py-20 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900">Ready to start?</h2>
          <p className="mt-4 text-slate-600 max-w-xl mx-auto">
            Every enrollment begins with a free 15-minute diagnostic. It tells
            you exactly where your child stands and which program fits.
          </p>
          <div className="mt-8">
            <Link
              href={content.cta.primaryHref}
              className={`inline-flex items-center justify-center gap-2 ${c.accentBg} ${c.accentBgHover} text-white font-semibold px-8 py-4 rounded-xl shadow-lg text-lg`}
            >
              {content.cta.primary}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-10 px-4 border-t border-slate-800">
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
            <Link href="/summer" className="hover:text-white">
              Summer
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
