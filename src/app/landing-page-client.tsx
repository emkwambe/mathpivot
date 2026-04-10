"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Brain,
  Calendar,
  BarChart3,
  CreditCard,
  PenTool,
  Award,
  Users,
  ChevronDown,
  Menu,
  X,
  Check,
  Quote,
  ArrowRight,
  Sparkles,
  BookOpen,
  GraduationCap,
  Building2,
  UserCheck,
  School,
} from "lucide-react";

/* ─── audience tab data ─── */
const audiences = [
  {
    key: "centers",
    label: "Tutoring Centers",
    icon: Building2,
    headline: "Manage your entire center from one dashboard",
    points: [
      "Multi-room scheduling with tutor and student assignment",
      "Automated billing, invoicing, and payroll tracking",
      "Lead pipeline from inquiry to enrolled student",
      "Real-time admin analytics across all tutors and students",
    ],
    cta: "See Center Features",
    ctaHref: "/get-started",
  },
  {
    key: "testprep",
    label: "Test Prep Companies",
    icon: GraduationCap,
    headline: "Track scores, assign practice, report results",
    points: [
      "Diagnostic assessments tied to SAT, ACT, and AP curricula",
      "Automated score tracking and improvement reports for parents",
      "Practice problem assignment with AI-powered hints",
      "Group and 1-on-1 session scheduling in one system",
    ],
    cta: "Explore Test Prep Tools",
    ctaHref: "/get-started",
  },
  {
    key: "stem",
    label: "STEM Programs",
    icon: Sparkles,
    headline: "Math + CS curriculum in one platform",
    points: [
      "Cover math from Pre-Algebra through AP Calculus and beyond",
      "Computer science tracks: Python, Data Science, discrete math",
      "Certification paths and competition prep (AMC, MATHCOUNTS)",
      "Progress tracking across multi-subject learning journeys",
    ],
    cta: "See STEM Features",
    ctaHref: "/get-started",
  },
  {
    key: "independent",
    label: "Independent Tutors",
    icon: UserCheck,
    headline: "Run your solo practice like a pro",
    points: [
      "Professional booking page parents can use to self-schedule",
      "Stripe-powered billing with automatic invoicing",
      "AI tutor assistant for between-session student practice",
      "Progress reports that keep parents engaged and retained",
    ],
    cta: "Start Solo Plan",
    ctaHref: "/get-started",
  },
  {
    key: "schools",
    label: "Schools & Districts",
    icon: School,
    headline: "Supplement classroom instruction at scale",
    points: [
      "Bulk student import and class-level diagnostic assessments",
      "Assign AI-powered practice aligned to curriculum standards",
      "Teacher and admin dashboards with exportable reports",
      "COPPA-compliant with district SSO integration options",
    ],
    cta: "Contact Sales",
    ctaHref: "/get-started",
  },
];

/* ─── feature rows ─── */
const featureRows = [
  {
    icon: Brain,
    badge: "AI Tutoring",
    headline: "Claude-Powered AI That Actually Teaches Math",
    points: [
      "Step-by-step problem solving with Socratic questioning",
      "LaTeX-rendered equations that look like a real textbook",
      "Adapts to each student's level automatically",
      "Available 24/7 for practice between live sessions",
    ],
  },
  {
    icon: Calendar,
    badge: "Scheduling",
    headline: "Scheduling That Runs Itself",
    points: [
      "Calendar sync with Google, Outlook, and Apple Calendar",
      "Recurring sessions with automatic reminders",
      "Parent self-booking from your branded page",
      "Tutor availability management with conflict detection",
    ],
  },
  {
    icon: BarChart3,
    badge: "Mastery Tracking",
    headline: "Know Exactly Where Every Student Stands",
    points: [
      "Diagnostic assessments that pinpoint skill gaps",
      'Topic-level mastery scores from "not started" to "mastered"',
      "Progress over time with visual charts and trends",
      "Parent-visible reports generated automatically each week",
    ],
  },
  {
    icon: CreditCard,
    badge: "Billing",
    headline: "Get Paid Without the Paperwork",
    points: [
      "Stripe-powered payments with automatic receipts",
      "Credit packages for flexible session pricing",
      "Automatic invoice generation and email delivery",
      "Parent payment portal with full billing history",
    ],
  },
];

/* ─── pricing tiers ─── */
const pricingTiers = [
  {
    name: "Solo Tutor",
    price: "$49",
    unit: "per session",
    features: [
      "1-on-1 scheduling",
      "AI tutor assistant",
      "Progress reports",
      "Stripe billing",
      "Parent portal",
    ],
    featured: false,
  },
  {
    name: "Growth",
    price: "$199",
    unit: "/month",
    label: "Most Popular",
    features: [
      "Everything in Solo",
      "Up to 50 students",
      "Group sessions",
      "Certifications",
      "Priority support",
    ],
    featured: true,
  },
  {
    name: "Center",
    price: "$399",
    unit: "/month",
    features: [
      "Everything in Growth",
      "Unlimited students",
      "Multi-tutor payroll",
      "Room management",
      "Admin analytics",
    ],
    featured: false,
  },
];

/* ─── org features ─── */
const orgFeatures = [
  "Multi-location management",
  "Tutor payroll tracking",
  "Room & resource scheduling",
  "Lead management & intake forms",
  "Custom branding",
  "Bulk student import (CSV)",
  "Drop-in session support",
  "Admin analytics dashboard",
  "API access",
];

/* ─── platform dropdown items ─── */
const platformItems = [
  { label: "AI Tutor", icon: Brain, desc: "Claude-powered math assistant" },
  {
    label: "Scheduling",
    icon: Calendar,
    desc: "Smart booking & calendar sync",
  },
  {
    label: "Progress Tracking",
    icon: BarChart3,
    desc: "Mastery diagnostics & reports",
  },
  { label: "Whiteboard", icon: PenTool, desc: "Desmos + LaTeX collaboration" },
  {
    label: "Certifications",
    icon: Award,
    desc: "Assessments & competition prep",
  },
  { label: "Parent Portal", icon: Users, desc: "Full visibility for parents" },
];

export default function HomePage({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("centers");
  const [redirecting, setRedirecting] = useState(!!isLoggedIn);

  // Check if user is authenticated and redirect to their dashboard
  useEffect(() => {
    if (!isLoggedIn) return;
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/check", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          if (data.redirectTo) {
            window.location.href = data.redirectTo;
            return;
          }
        }
      } catch {
        // Not authenticated, show landing page
      }
      setRedirecting(false);
    }
    checkAuth();
  }, [isLoggedIn]);

  if (redirecting) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-sm">M</span>
        </div>
      </div>
    );
  }

  const activeAudience = audiences.find((a) => a.key === activeTab)!;

  return (
    <div className="min-h-screen bg-white">
      {/* ════════ 1. NAVIGATION ════════ */}
      <header className="border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-slate-900 text-lg">MathPivot</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8 text-sm text-slate-600">
            {/* Platform dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setPlatformOpen(true)}
              onMouseLeave={() => setPlatformOpen(false)}
            >
              <button className="flex items-center gap-1 hover:text-slate-900 transition-colors">
                Platform <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {platformOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-4 w-80 grid gap-1">
                    {platformItems.map((item) => (
                      <a
                        key={item.label}
                        href="#features"
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <item.icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {item.label}
                          </p>
                          <p className="text-xs text-slate-500">{item.desc}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link
              href="/pricing"
              className="hover:text-slate-900 transition-colors"
            >
              Pricing
            </Link>
            <a
              href="#organizations"
              className="hover:text-slate-900 transition-colors"
            >
              For Organizations
            </a>
            <a
              href="#features"
              className="hover:text-slate-900 transition-colors"
            >
              Features
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/get-started"
              className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 text-slate-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 pb-4">
            <nav className="flex flex-col gap-1 py-3 text-sm">
              <a
                href="#features"
                className="py-2 text-slate-600 hover:text-slate-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Platform
              </a>
              <Link
                href="/pricing"
                className="py-2 text-slate-600 hover:text-slate-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <a
                href="#organizations"
                className="py-2 text-slate-600 hover:text-slate-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                For Organizations
              </a>
            </nav>
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <Link
                href="/login"
                className="text-sm text-center text-slate-600 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/get-started"
                className="bg-blue-600 text-white text-sm font-medium text-center py-2.5 rounded-lg"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ════════ 2. HERO ════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — text */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <BookOpen className="w-3.5 h-3.5" />
              Built for Math &amp; CS Tutoring
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">
              The Operating System for{" "}
              <span className="text-blue-600">Tutoring Centers</span>
            </h1>
            <p className="text-lg text-slate-600 mt-6 max-w-lg leading-relaxed">
              Schedule sessions, track mastery, bill parents, and power
              AI-assisted learning — all from one platform built specifically
              for math and computer science education.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link
                href="/get-started"
                className="bg-blue-600 text-white font-semibold px-7 py-3 rounded-xl text-base hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 text-center"
              >
                Start Free Trial
              </Link>
              <Link
                href="/get-started"
                className="border border-slate-300 text-slate-700 font-semibold px-7 py-3 rounded-xl text-base hover:border-slate-400 hover:bg-slate-50 transition-colors text-center"
              >
                Book a Demo
              </Link>
            </div>
            <p className="text-sm text-slate-500 mt-5">
              Trusted by 50+ tutoring centers and 500+ families
            </p>
          </div>

          {/* Right — product mockup */}
          <div className="relative">
            {/* Main dashboard card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 shadow-sm">
              {/* Fake browser bar */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <div className="flex-1 bg-white rounded-md h-6 ml-2 border border-slate-200 flex items-center px-3">
                  <span className="text-xs text-slate-400">
                    app.mathpivot.com/student
                  </span>
                </div>
              </div>
              {/* Mock dashboard content */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Student Progress
                    </p>
                    <p className="text-xs text-slate-500">This semester</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">87%</p>
                    <p className="text-xs text-green-600 font-medium">
                      +12% this month
                    </p>
                  </div>
                </div>
                {/* Mock mastery bars */}
                <div className="space-y-3">
                  {[
                    { topic: "Algebra", pct: 92, color: "bg-blue-600" },
                    { topic: "Geometry", pct: 78, color: "bg-blue-500" },
                    { topic: "Pre-Calculus", pct: 85, color: "bg-blue-600" },
                    { topic: "AP Calculus", pct: 64, color: "bg-amber-500" },
                  ].map((bar) => (
                    <div key={bar.topic}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{bar.topic}</span>
                        <span className="text-slate-500 font-medium">
                          {bar.pct}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${bar.color} rounded-full`}
                          style={{ width: `${bar.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating AI chat card */}
            <div className="absolute -left-4 sm:-left-8 bottom-8 bg-white rounded-xl border border-slate-200 shadow-lg p-4 w-56 sm:w-64">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <Brain className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-medium text-slate-900">
                  AI Tutor
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                &ldquo;Let me help with that quadratic! Try factoring x² + 5x +
                6 by finding two numbers that multiply to 6...&rdquo;
              </p>
            </div>

            {/* Floating session notification */}
            <div className="absolute -right-2 sm:-right-6 top-12 bg-white rounded-lg border border-slate-200 shadow-lg px-3 py-2.5 flex items-center gap-2">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-900">
                  Session Booked
                </p>
                <p className="text-[10px] text-slate-500">
                  Tomorrow at 4:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ 3. SOCIAL PROOF BAR ════════ */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "95%", label: "Grade Improvement" },
              { value: "500+", label: "Families Served" },
              { value: "50+", label: "Expert Tutors" },
              { value: "4.9/5", label: "Parent Satisfaction" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl sm:text-4xl font-bold text-slate-900">
                  {stat.value}
                </p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ 4. WHO IT'S FOR — AUDIENCE TABS ════════ */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Built for Every Type of Math Educator
            </h2>
            <p className="text-slate-600 mt-3 max-w-2xl mx-auto">
              Whether you run a tutoring center or teach solo, MathPivot adapts
              to your workflow.
            </p>
          </div>

          {/* Tab buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {audiences.map((a) => (
              <button
                key={a.key}
                onClick={() => setActiveTab(a.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === a.key
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <a.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{a.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">
                {activeAudience.headline}
              </h3>
              <ul className="space-y-4">
                {activeAudience.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-slate-600">{point}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={activeAudience.ctaHref}
                className="inline-flex items-center gap-2 mt-8 bg-blue-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {activeAudience.cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Visual panel — stylized illustration per segment */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 flex items-center justify-center min-h-[300px]">
              <div className="text-center">
                <activeAudience.icon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-900">
                  {activeAudience.label}
                </p>
                <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                  {activeAudience.headline}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ 5. PLATFORM FEATURES ════════ */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Everything You Need to Run a Tutoring Business
            </h2>
            <p className="text-slate-600 mt-3 max-w-2xl mx-auto">
              From AI-assisted teaching to automated billing, every tool is
              designed for math and CS education.
            </p>
          </div>

          <div className="space-y-24">
            {featureRows.map((row, idx) => (
              <div
                key={row.badge}
                className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
                  idx % 2 === 1 ? "lg:direction-rtl" : ""
                }`}
              >
                {/* Text side */}
                <div className={idx % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                    <row.icon className="w-3.5 h-3.5" />
                    {row.badge}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                    {row.headline}
                  </h3>
                  <ul className="space-y-3">
                    {row.points.map((point, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-slate-600"
                      >
                        <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual placeholder */}
                <div
                  className={`bg-slate-50 rounded-2xl border border-slate-200 p-8 flex items-center justify-center min-h-[280px] ${idx % 2 === 1 ? "lg:order-1" : ""}`}
                >
                  <div className="text-center">
                    <row.icon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-500">
                      {row.badge} Interface
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ 6. WHITEBOARD SHOWCASE ════════ */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            A Whiteboard Built for Math
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-12">
            Real-time collaborative whiteboard with Desmos graphing, LaTeX
            equations, and drawing tools — purpose-built for teaching math and
            computer science.
          </p>

          {/* Whiteboard mockup */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 max-w-4xl mx-auto mb-10">
            <div className="bg-white rounded-xl p-6 min-h-[240px] flex items-center justify-center">
              <div className="text-center">
                <PenTool className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">
                  Interactive whiteboard with Desmos &amp; LaTeX
                </p>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <span className="text-lg font-mono text-slate-700">
                    f(x) = x² + 2x + 1
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature chips */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Desmos Integration",
              "LaTeX Equations",
              "Real-time Collaboration",
              "Session Recording",
            ].map((chip) => (
              <span
                key={chip}
                className="bg-slate-800 text-slate-300 text-sm font-medium px-4 py-2 rounded-full border border-slate-700"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ 7. FOR ORGANIZATIONS ════════ */}
      <section id="organizations" className="bg-blue-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Scale Your Tutoring Center with MathPivot
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-12">
            Replace spreadsheets with a system built for math education.
            Everything your center needs in one platform.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
            {orgFeatures.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 text-left text-white/90"
              >
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/get-started"
              className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors text-center"
            >
              Schedule a Demo
            </Link>
            <Link
              href="/pricing"
              className="border border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-center"
            >
              See Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ════════ 8. TESTIMONIAL ════════ */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Quote className="w-10 h-10 text-blue-200 mx-auto mb-6" />
            <blockquote className="text-xl sm:text-2xl text-slate-900 font-medium leading-relaxed">
              &ldquo;MathPivot replaced three different tools we were juggling —
              scheduling, billing, and progress tracking. Now our tutors spend
              time teaching instead of doing admin work.&rdquo;
            </blockquote>
            <div className="mt-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">JR</span>
              </div>
              <p className="font-semibold text-slate-900">Jessica Rodriguez</p>
              <p className="text-sm text-slate-500">
                Director, Apex Math Academy
              </p>
            </div>
          </div>

          {/* Impact metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mt-12">
            {[
              { metric: "2x", label: "more sessions booked per week" },
              { metric: "45 min", label: "saved on admin per day" },
              { metric: "30%", label: "increase in student retention" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white rounded-xl border border-slate-200 p-5 text-center"
              >
                <p className="text-2xl font-bold text-blue-600">
                  {item.metric}
                </p>
                <p className="text-sm text-slate-600 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ 9. PRICING PREVIEW ════════ */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-600 mt-3">
              No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl p-6 ${
                  tier.featured
                    ? "bg-blue-600 text-white ring-4 ring-blue-600/20 scale-[1.02]"
                    : "bg-white border border-slate-200"
                }`}
              >
                {tier.label && (
                  <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full">
                    {tier.label}
                  </span>
                )}
                <h3
                  className={`text-lg font-semibold mt-3 ${tier.featured ? "text-white" : "text-slate-900"}`}
                >
                  {tier.name}
                </h3>
                <div className="mt-2 mb-5">
                  <span
                    className={`text-3xl font-bold ${tier.featured ? "text-white" : "text-slate-900"}`}
                  >
                    {tier.price}
                  </span>
                  <span
                    className={`text-sm ml-1 ${tier.featured ? "text-blue-100" : "text-slate-500"}`}
                  >
                    {tier.unit}
                  </span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-center gap-2 text-sm ${tier.featured ? "text-blue-50" : "text-slate-600"}`}
                    >
                      <Check
                        className={`w-4 h-4 flex-shrink-0 ${tier.featured ? "text-white" : "text-green-500"}`}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/get-started"
                  className={`block text-center font-medium py-2.5 rounded-lg text-sm transition-colors ${
                    tier.featured
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500 mt-8">
            Need enterprise pricing?{" "}
            <Link
              href="/get-started"
              className="text-blue-600 font-medium hover:underline"
            >
              Contact Sales
            </Link>
          </p>
        </div>
      </section>

      {/* ════════ 10. FINAL CTA ════════ */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Tutoring Business?
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-8">
            Join 500+ families and 50+ tutors already using MathPivot to deliver
            better math education.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/get-started"
              className="bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-xl text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 text-center"
            >
              Start Free Trial
            </Link>
            <Link
              href="/get-started"
              className="border border-slate-600 text-white font-semibold px-8 py-3.5 rounded-xl text-lg hover:bg-slate-800 transition-colors text-center"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ════════ 11. FOOTER ════════ */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">M</span>
                </div>
                <span className="font-bold text-slate-900">MathPivot</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                The operating system for math and CS tutoring businesses.
              </p>
            </div>

            {/* Platform */}
            <div>
              <p className="font-semibold text-slate-900 text-sm mb-3">
                Platform
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>
                  <a href="#features" className="hover:text-slate-700">
                    AI Tutor
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-slate-700">
                    Scheduling
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-slate-700">
                    Progress Tracking
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-slate-700">
                    Whiteboard
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-slate-700">
                    Billing
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-slate-700">
                    Certifications
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="font-semibold text-slate-900 text-sm mb-3">
                Company
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>
                  <Link href="/pricing" className="hover:text-slate-700">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/get-started" className="hover:text-slate-700">
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-slate-700">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <p className="font-semibold text-slate-900 text-sm mb-3">
                Resources
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>
                  <a href="#features" className="hover:text-slate-700">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#organizations" className="hover:text-slate-700">
                    For Organizations
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} MathPivot. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs text-slate-400">
              <a href="#" className="hover:text-slate-600">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-slate-600">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
