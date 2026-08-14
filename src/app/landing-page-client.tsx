"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Award,
  Users,
  BarChart3,
  Brain,
  Menu,
  X,
  Trophy,
  Target,
  TrendingUp,
  Shield,
  ChevronDown,
  Home,
  GraduationCap,
  Scale,
} from "lucide-react";

const PERSONA_LINKS = [
  {
    href: "/for/proactive",
    label: "Proactive Suburban Family",
    desc: "Grade-level mastery + stretch to accelerated tracks",
    icon: TrendingUp,
    color: "text-blue-600",
  },
  {
    href: "/for/travel-ball",
    label: "Travel Ball Family",
    desc: "Flexible scheduling around tournaments & practices",
    icon: Users,
    color: "text-orange-600",
  },
  {
    href: "/for/homeschool",
    label: "Homeschool Family",
    desc: "Certified math coach + attendance & transcript logs",
    icon: Home,
    color: "text-emerald-600",
  },
  {
    href: "/for/falling-behind",
    label: "Falling Behind",
    desc: "Rebuild confidence + close specific mastery gaps",
    icon: Shield,
    color: "text-rose-600",
  },
  {
    href: "/for/competition",
    label: "Competition Math",
    desc: "AMC 8/10, MATHCOUNTS, olympiad prep with elite coaches",
    icon: Trophy,
    color: "text-purple-600",
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFamiliesOpen, setMobileFamiliesOpen] = useState(false);
  const [familiesOpen, setFamiliesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const familiesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        familiesRef.current &&
        !familiesRef.current.contains(e.target as Node)
      ) {
        setFamiliesOpen(false);
      }
    };
    if (familiesOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [familiesOpen]);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-sm shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-bold text-lg text-slate-900">
                MathPivot
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6 lg:gap-7">
              <a
                href="#how-it-works"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                How It Works
              </a>
              <a
                href="#programs"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Programs
              </a>

              <div
                ref={familiesRef}
                className="relative"
                onMouseEnter={() => setFamiliesOpen(true)}
                onMouseLeave={() => setFamiliesOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setFamiliesOpen((v) => !v)}
                  className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
                  aria-expanded={familiesOpen}
                  aria-haspopup="true"
                >
                  For Families
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${familiesOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {familiesOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[420px]">
                    <div className="bg-white rounded-xl shadow-xl ring-1 ring-slate-200 p-2">
                      <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Choose the fit for your family
                      </div>
                      {PERSONA_LINKS.map((p) => {
                        const Icon = p.icon;
                        return (
                          <Link
                            key={p.href}
                            href={p.href}
                            onClick={() => setFamiliesOpen(false)}
                            className="flex items-start gap-3 rounded-lg p-3 hover:bg-slate-50 transition-colors"
                          >
                            <div
                              className={`shrink-0 mt-0.5 ${p.color}`}
                              aria-hidden="true"
                            >
                              <Icon size={18} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900">
                                {p.label}
                              </div>
                              <div className="text-xs text-slate-500 leading-snug">
                                {p.desc}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <Link
                          href="/for"
                          onClick={() => setFamiliesOpen(false)}
                          className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
                        >
                          See all fits
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/for/schools"
                className="text-sm text-slate-600 hover:text-slate-900"
                title="School & district partnerships — enrichment, intervention, teacher PD"
              >
                For Schools
              </Link>
              <Link
                href="/compare"
                className="text-sm text-slate-600 hover:text-slate-900"
                title="MathPivot vs Kumon, Mathnasium, AoPS, RSM, and private tutoring"
              >
                Compare
              </Link>
              <Link
                href="/diagnostic"
                className="text-sm font-semibold text-orange-500 hover:text-orange-600"
                title="Free 15-minute diagnostic by grade"
              >
                Free Diagnostic
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 hover:text-slate-900 px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/pricing"
                className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-slate-600 py-2"
            >
              How It Works
            </a>
            <a
              href="#programs"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-slate-600 py-2"
            >
              Programs
            </a>
            <a
              href="#results"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-slate-600 py-2"
            >
              Results
            </a>

            <button
              type="button"
              onClick={() => setMobileFamiliesOpen((v) => !v)}
              className="w-full flex items-center justify-between text-sm text-slate-600 py-2"
              aria-expanded={mobileFamiliesOpen}
            >
              For Families
              <ChevronDown
                size={16}
                className={`transition-transform ${mobileFamiliesOpen ? "rotate-180" : ""}`}
              />
            </button>
            {mobileFamiliesOpen && (
              <div className="pl-3 border-l-2 border-slate-100 ml-1 space-y-1 pb-2">
                {PERSONA_LINKS.map((p) => {
                  const Icon = p.icon;
                  return (
                    <Link
                      key={p.href}
                      href={p.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-start gap-2 py-2"
                    >
                      <Icon
                        size={16}
                        className={`shrink-0 mt-0.5 ${p.color}`}
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {p.label}
                        </div>
                        <div className="text-xs text-slate-500 leading-snug">
                          {p.desc}
                        </div>
                      </div>
                    </Link>
                  );
                })}
                <Link
                  href="/for"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-medium text-blue-700 py-2"
                >
                  See all fits →
                </Link>
              </div>
            )}

            <Link
              href="/for/schools"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-start gap-2 text-sm text-slate-600 py-2"
            >
              <GraduationCap
                size={16}
                className="shrink-0 mt-0.5 text-indigo-600"
              />
              <div>
                <div className="font-medium text-slate-900">For Schools</div>
                <div className="text-xs text-slate-500">
                  District & school partnerships
                </div>
              </div>
            </Link>
            <Link
              href="/compare"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-start gap-2 text-sm text-slate-600 py-2"
            >
              <Scale size={16} className="shrink-0 mt-0.5 text-slate-500" />
              <div>
                <div className="font-medium text-slate-900">Compare</div>
                <div className="text-xs text-slate-500">
                  vs Kumon, Mathnasium, AoPS, RSM
                </div>
              </div>
            </Link>
            <Link
              href="/diagnostic"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-orange-500 py-2"
            >
              Free Diagnostic
            </Link>

            <div className="flex gap-2 pt-3 border-t border-slate-100 mt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-slate-700 px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-white bg-blue-600 px-4 py-2 rounded-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-100/30 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Trophy size={14} />
            The Academic Performance System
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight tracking-tight">
            Sports builds character.
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MathPivot builds careers.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            We bring the discipline of athletic training to academic and career
            success — with a named coach, structured programs, and measurable
            mastery. Not hourly sessions. A development pathway.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-medium px-8 py-3.5 rounded-xl hover:bg-blue-700 transition-colors text-base shadow-lg shadow-blue-600/25"
            >
              Enroll Your Child
              <ArrowRight size={18} />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-slate-700 font-medium px-8 py-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors text-base"
            >
              See How It Works
            </a>
          </div>

          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { value: "179", label: "Curriculum Concepts" },
              { value: "3", label: "Program Tracks" },
              { value: "15:1", label: "Max Coach Ratio" },
              { value: "60%", label: "Coach Revenue Share" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">The tutoring trap</h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Families spend $6.8 billion on tutoring every year. Most of it buys
            hours, not outcomes. Here&apos;s what changes.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                problem: "Rotating tutors",
                solution: "Named coach who stays for years",
                icon: Users,
              },
              {
                problem: "Homework help",
                solution: "Structured mastery curriculum",
                icon: Target,
              },
              {
                problem: "No accountability",
                solution: "Weekly progress reports to parents",
                icon: BarChart3,
              },
            ].map((item) => (
              <div
                key={item.problem}
                className="bg-slate-800/50 rounded-xl p-6 text-left border border-slate-700/50"
              >
                <item.icon className="w-8 h-8 text-blue-400 mb-4" />
                <p className="text-sm text-red-400 line-through mb-1">
                  {item.problem}
                </p>
                <p className="text-base font-semibold text-white">
                  {item.solution}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              The athletic model, applied to academics
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Every elite athlete has a coach, a training plan, and a
              competition calendar. Your child deserves the same for their
              academic future.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Choose a Program",
                desc: "Foundation, Acceleration, or Elite — based on your child's level and goals.",
                color: "bg-blue-600",
              },
              {
                step: "02",
                title: "Get a Named Coach",
                desc: "Not a rotating tutor. A coach who knows your child's strengths, gaps, and aspirations.",
                color: "bg-emerald-600",
              },
              {
                step: "03",
                title: "Master the Curriculum",
                desc: "179 atomic concepts with measurable mastery levels. You see exactly what they know.",
                color: "bg-amber-600",
              },
              {
                step: "04",
                title: "Compete & Grow",
                desc: "Mathathlon competitions and career exposure build confidence and direction.",
                color: "bg-purple-600",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div
                  className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center text-white font-bold text-sm mb-4`}
                >
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
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

      {/* Programs */}
      <section id="programs" className="py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Structured programs, not hourly sessions
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Every program includes a named coach, mastery tracking, and
              competition access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Foundation",
                price: "$349",
                sessions: "2x per week (8 sessions/month)",
                grades: "Grades 5-8",
                color: "border-blue-200 bg-blue-50",
                accent: "text-blue-600",
                badge: "bg-blue-100 text-blue-800",
                features: [
                  "Named coach for the duration",
                  "60-minute coaching sessions",
                  "Mastery tracking dashboard",
                  "Career exposure modules",
                  "Weekly progress reports",
                ],
              },
              {
                name: "Acceleration",
                price: "$549",
                sessions: "3x per week (12 sessions/month)",
                grades: "Grades 6-10",
                color: "border-amber-200 bg-amber-50",
                accent: "text-amber-600",
                badge: "bg-amber-100 text-amber-800",
                popular: true,
                features: [
                  "Everything in Foundation",
                  "Mathathlon competition prep",
                  "AMC 8 / MATHCOUNTS readiness",
                  "Applied math projects",
                  "Career mentorship sessions",
                ],
              },
              {
                name: "Elite",
                price: "$799",
                sessions: "4x per week (16 sessions/month)",
                grades: "Grades 7-12",
                color: "border-purple-200 bg-purple-50",
                accent: "text-purple-600",
                badge: "bg-purple-100 text-purple-800",
                features: [
                  "Everything in Acceleration",
                  "1-on-1 intensive coaching",
                  "AMC 10/12 and AIME prep",
                  "College readiness portfolio",
                  "Competition team placement",
                ],
              },
            ].map((program) => (
              <div
                key={program.name}
                className={`relative rounded-2xl border-2 ${program.color} p-8 flex flex-col`}
              >
                {program.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <span
                  className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${program.badge}`}
                >
                  {program.name}
                </span>
                <div className="mt-4">
                  <span className={`text-4xl font-bold ${program.accent}`}>
                    {program.price}
                  </span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {program.sessions} &middot; {program.grades} &middot; 3-month
                  minimum
                </p>

                <ul className="mt-6 space-y-3 flex-1">
                  {program.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check
                        size={16}
                        className={`mt-0.5 flex-shrink-0 ${program.accent}`}
                      />
                      <span className="text-slate-700">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/enroll/${program.name.toLowerCase()}`}
                  className={`mt-8 block text-center py-3 rounded-xl text-white font-medium transition-colors ${
                    program.name === "Foundation"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : program.name === "Acceleration"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  Enroll Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results / Social Proof */}
      <section id="results" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              What parents are really paying for
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Not hours. Not homework help. A structured pathway to mastery and
              professional readiness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
              <h3 className="text-xl font-bold mb-6">
                The MathPivot Difference
              </h3>
              <div className="space-y-4">
                {[
                  "Every session produces a measurable mastery outcome",
                  "Parents get weekly progress reports — no guessing",
                  "Students compete in Mathathlon — curriculum-based, not trick math",
                  "Coaches can't end a session without logging what was taught",
                  "Practice streaks track between-session accountability",
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <Check
                      size={18}
                      className="mt-0.5 flex-shrink-0 text-blue-300"
                    />
                    <span className="text-sm text-blue-50">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: Target,
                  title: "Mastery, not hours",
                  desc: "179 atomic concepts per course, each tracked from 'Not Started' to 'Mastered'. You see exactly what your child knows.",
                },
                {
                  icon: Trophy,
                  title: "Mathathlon competitions",
                  desc: "Curriculum-based competitions that test real competence, not trick math. The best performers surface for AMC and MATHCOUNTS.",
                },
                {
                  icon: TrendingUp,
                  title: "Career exposure",
                  desc: "Students don't just learn math — they see where it leads. Engineering, data science, finance, healthcare.",
                },
                {
                  icon: Shield,
                  title: "Accountability at every level",
                  desc: "Coaches must update mastery per session. Students log practice. Parents get weekly digests. No one hides.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon size={20} className="text-slate-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Free Diagnostic — replaces the summer clinic promo */}
      <section className="py-20 px-4 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-500/30 text-blue-200 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              <GraduationCap className="w-3.5 h-3.5" />
              Free · 15 minutes · By grade
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Start with a free diagnostic
            </h2>
            <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
              Pick the grade your student is entering. We assess mastery of the
              prior-grade content and recommend a coaching program — Foundation,
              Acceleration, or Elite — matched to the results.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                grade: 6,
                entering: 7,
                scope: "Grade 6 · Ratios & integers",
              },
              {
                grade: 7,
                entering: 8,
                scope: "Grade 7 · Proportions & rationals",
              },
              {
                grade: 8,
                entering: 9,
                scope: "Grade 8 · Linear functions",
              },
              { grade: 9, entering: 10, scope: "Grade 9 · Algebra 1" },
              { grade: 10, entering: 11, scope: "Grade 10 · Geometry" },
              {
                grade: 11,
                entering: 12,
                scope: "Grade 11 · Algebra 2 / Pre-Calc",
              },
            ].map((g) => (
              <Link
                key={g.grade}
                href={`/diagnostic/grade/${g.grade}`}
                className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-400/40 transition-all p-4 text-center group"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-blue-300">
                  Entering
                </p>
                <p className="text-2xl font-bold mt-1">Grade {g.entering}</p>
                <p className="text-xs text-slate-400 mt-2 leading-snug">
                  {g.scope}
                </p>
                <p className="mt-3 text-[11px] font-semibold text-blue-300 group-hover:text-blue-200">
                  Start →
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/diagnostic"
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-medium px-8 py-3.5 rounded-xl hover:bg-blue-700 transition-colors text-base"
            >
              Not sure? Open the grade picker
              <ArrowRight size={18} />
            </Link>
            <p className="mt-4 text-xs text-slate-500">
              No cost, no commitment. Results emailed within minutes.
            </p>
          </div>
        </div>
      </section>

      {/* For Coaches */}
      <section id="coaches" className="py-20 px-4 bg-emerald-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                For Math Coaches
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-4">
                You could earn up to $5,000/month coaching math
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Not hourly scrambling. A stable portfolio of students who stay
                with you for years. Professional tools, structured curriculum,
                and the recognition you deserve.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  "Named math coach — students know you by name",
                  "Stable monthly income from your student portfolio",
                  "All tools provided — prep briefs, mastery tracking, parent reports",
                  "Professional development and certification pathway",
                ].map((point) => (
                  <div key={point} className="flex items-center gap-3">
                    <Check size={16} className="text-emerald-600" />
                    <span className="text-sm text-slate-700">{point}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/careers"
                className="mt-8 inline-flex items-center gap-2 bg-emerald-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Learn More &amp; Apply
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-emerald-200 p-8">
              <h3 className="font-semibold text-slate-900 mb-2">
                Why coaches choose MathPivot
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Everything you need to run a professional coaching practice.
              </p>
              <div className="space-y-4">
                {[
                  {
                    title: "Your students, your portfolio",
                    desc: "3-15 students who stay with you long-term. No random assignments.",
                  },
                  {
                    title: "Structured 60-minute sessions",
                    desc: "Pre-built prep briefs, session templates, and mastery tracking.",
                  },
                  {
                    title: "Competitive compensation",
                    desc: "Earn based on your portfolio size and program mix. Details on the careers page.",
                  },
                  {
                    title: "Career growth",
                    desc: "Certifications, performance dashboards, and a path to lead coach roles.",
                  },
                ].map((item) => (
                  <div key={item.title} className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-900">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Your child&apos;s future is worth the same investment as travel ball
          </h2>
          <p className="mt-4 text-lg text-blue-100 max-w-xl mx-auto">
            Families already sacrifice for structured development when they
            believe the pathway is real. MathPivot is that pathway — for
            academics.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors text-base"
            >
              Enroll Your Child
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/careers"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 text-white font-medium px-8 py-3.5 rounded-xl border border-white/20 hover:bg-white/20 transition-colors text-base"
            >
              Apply as a Coach
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-slate-900 text-slate-400">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-bold text-white">MathPivot</span>
            </div>
            <p className="text-sm">
              Selling mastery, not hours. The academic equivalent of elite
              training.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/about" className="hover:text-white">
                About
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
        </div>
      </footer>
    </div>
  );
}
