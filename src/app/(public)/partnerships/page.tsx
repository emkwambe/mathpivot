"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitPartnershipInquiry } from "@/app/actions/partnerships";
import {
  ArrowRight,
  CheckCircle2,
  School,
  Building2,
  Users,
  Trophy,
  BarChart3,
  Handshake,
} from "lucide-react";

const PARTNER_TYPES = [
  {
    type: "school",
    icon: School,
    label: "School",
    description: "Individual public, private, or charter school",
  },
  {
    type: "district",
    icon: Building2,
    label: "District",
    description: "K-12 school district or network",
  },
  {
    type: "learning_center",
    icon: Users,
    label: "Learning Center",
    description: "For-profit tutoring or enrichment center",
  },
  {
    type: "homeschool_coop",
    icon: Users,
    label: "Homeschool Co-op",
    description: "Cooperative, umbrella group, or homeschool network",
  },
  {
    type: "professional_org",
    icon: Trophy,
    label: "Professional Org",
    description: "MATHCOUNTS, NSBE, Actuarial Foundation, etc.",
  },
  {
    type: "sports_league",
    icon: Trophy,
    label: "Sports League",
    description: "Travel ball, AAU, or youth sports organization",
  },
];

const WHAT_WE_OFFER = [
  {
    title: "Certified math coaches",
    description:
      "All coaches complete MathPivot certification: pedagogy, curriculum, calibration, and monthly quality review.",
  },
  {
    title: "Diagnostic-driven placement",
    description:
      "Every student starts with a 15-minute diagnostic mapped to state standards. Real gap identification, not guesswork.",
  },
  {
    title: "Mastery data for administrators",
    description:
      "Real-time dashboards show cohort mastery progression, attendance, and coach performance metrics.",
  },
  {
    title: "Small-cohort learning (5-6 students)",
    description:
      "Research-optimal group size delivers stronger outcomes than 1:1 tutoring or large-group classes.",
  },
  {
    title: "State-aligned curriculum",
    description:
      "Questions and progressions map to your state's standards. Defensible for Title I and ESSER reporting.",
  },
  {
    title: "Coach development pipeline",
    description:
      "Bring your own instructors — we certify them on the MathPivot method. Institutional capacity, not vendor dependency.",
  },
];

export default function PartnershipsPage() {
  const [state, formAction, isPending] = useActionState(
    submitPartnershipInquiry,
    {},
  );

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
            <a
              href="#inquiry"
              className="text-sm font-semibold bg-indigo-700 text-white px-4 py-2 rounded-lg hover:bg-indigo-800 transition-colors"
            >
              Start a Conversation
            </a>
          </div>
        </div>
      </header>

      <section className="px-4 pt-16 pb-20 bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-indigo-200 text-indigo-700 bg-indigo-50 mb-6">
            <Handshake className="w-3.5 h-3.5" /> Partnership Program
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1]">
            Bring MathPivot to your{" "}
            <span className="text-indigo-700">community.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Schools, districts, homeschool co-ops, learning centers, and youth
            organizations partner with MathPivot to deliver structured math
            coaching with measurable outcomes.
          </p>
          <div className="mt-10">
            <a
              href="#inquiry"
              className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg text-base"
            >
              Start a Conversation <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              The tutoring gap
            </p>
            <h2 className="text-3xl font-bold text-slate-900">
              Structured math support is rare.
              <br />
              Generic tutoring shows no results.
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            <div className="bg-slate-50 rounded-2xl p-6 text-center">
              <p className="text-4xl font-bold text-red-600">73%</p>
              <p className="text-sm text-slate-600 mt-2">
                of 8th graders below proficient in math (NAEP 2024)
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6 text-center">
              <p className="text-4xl font-bold text-amber-600">&lt;2%</p>
              <p className="text-sm text-slate-600 mt-2">
                of students receive high-quality tutoring
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6 text-center">
              <p className="text-4xl font-bold text-slate-700">49%</p>
              <p className="text-sm text-slate-600 mt-2">
                drop in school tutoring since ESSER funding ended
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 bg-indigo-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-700 mb-3">
              What Partners Get
            </p>
            <h2 className="text-3xl font-bold text-slate-900">
              A coaching system, not just tutoring hours.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {WHAT_WE_OFFER.map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Who Partners With MathPivot
            </p>
            <h2 className="text-3xl font-bold text-slate-900">
              We work with organizations that serve students.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PARTNER_TYPES.map((p) => (
              <div
                key={p.type}
                className="border border-slate-200 rounded-2xl p-6"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                  <p.icon className="w-5 h-5 text-slate-700" />
                </div>
                <h3 className="font-bold text-slate-900">{p.label}</h3>
                <p className="text-sm text-slate-500 mt-1">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Partnership Models
            </p>
            <h2 className="text-3xl font-bold text-slate-900">
              Three ways to work together.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Cohort Coaching
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                MathPivot delivers coaching cohorts directly to your students.
                Certified coaches, mastery tracking, and outcome reports.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border-2 border-indigo-300 relative">
              <span className="absolute -top-2.5 left-4 bg-indigo-700 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                POPULAR
              </span>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-indigo-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Diagnostic + Placement
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Use MathPivot's diagnostic to assess every student in your
                program. Detailed placement reports and gap analysis.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                <School className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Platform Licensing
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                License the MathPivot platform, curriculum, and coach
                certification. Your instructors deliver coaching using our
                system.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="inquiry" className="px-4 py-20 bg-white scroll-mt-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-700 mb-3">
              Get Started
            </p>
            <h2 className="text-3xl font-bold text-slate-900">
              Tell us about your organization.
            </h2>
            <p className="mt-3 text-slate-600">
              A MathPivot partnership lead will respond within 2 business days.
            </p>
          </div>

          {state.success ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-800">
                Thank you — we&apos;ll be in touch soon.
              </h3>
              <p className="mt-3 text-slate-600 max-w-md mx-auto">
                We&apos;ve received your inquiry and a partnership lead will
                follow up within 2 business days.
              </p>
              <Link
                href="/"
                className="mt-6 inline-block text-indigo-700 hover:text-indigo-800 font-medium text-sm"
              >
                Back to Home
              </Link>
            </div>
          ) : (
            <form
              action={formAction}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Organization name *
                </label>
                <input
                  name="organizationName"
                  required
                  placeholder="e.g. Lincoln Middle School"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-700 focus:ring-2 focus:ring-indigo-700/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Organization type *
                </label>
                <select
                  name="organizationType"
                  required
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-700 text-slate-700"
                >
                  <option value="">Select type...</option>
                  <option value="school">Individual school</option>
                  <option value="district">School district</option>
                  <option value="learning_center">Learning center</option>
                  <option value="homeschool_coop">Homeschool co-op</option>
                  <option value="professional_org">
                    Professional organization
                  </option>
                  <option value="sports_league">Sports league</option>
                  <option value="community_org">Community organization</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Your name *
                  </label>
                  <input
                    name="contactName"
                    required
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-700 focus:ring-2 focus:ring-indigo-700/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Your title
                  </label>
                  <input
                    name="contactTitle"
                    placeholder="e.g. Principal, Director"
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-700 focus:ring-2 focus:ring-indigo-700/10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email *
                  </label>
                  <input
                    name="contactEmail"
                    type="email"
                    required
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-700 focus:ring-2 focus:ring-indigo-700/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    name="contactPhone"
                    type="tel"
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-700 focus:ring-2 focus:ring-indigo-700/10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Approx. student count
                  </label>
                  <input
                    name="studentCount"
                    type="number"
                    placeholder="e.g. 250"
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-700 focus:ring-2 focus:ring-indigo-700/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Grade range
                  </label>
                  <input
                    name="gradeRange"
                    placeholder="e.g. 6-8, K-12"
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-700 focus:ring-2 focus:ring-indigo-700/10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-[1fr_100px] gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    name="locationCity"
                    placeholder="e.g. Raleigh"
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-700 focus:ring-2 focus:ring-indigo-700/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    State
                  </label>
                  <input
                    name="locationState"
                    placeholder="NC"
                    maxLength={2}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-700 focus:ring-2 focus:ring-indigo-700/10 uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  What are you most interested in?
                </label>
                <select
                  name="interestArea"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-700 text-slate-700"
                >
                  <option value="">Select...</option>
                  <option value="cohort_coaching">
                    Cohort coaching (we deliver to your students)
                  </option>
                  <option value="diagnostic_placement">
                    Diagnostic + placement reports
                  </option>
                  <option value="platform_licensing">
                    Platform licensing (your instructors, our system)
                  </option>
                  <option value="curriculum_partnership">
                    Curriculum partnership (professional orgs)
                  </option>
                  <option value="other">Something else</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Timeline
                </label>
                <select
                  name="timeline"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-700 text-slate-700"
                >
                  <option value="">Select...</option>
                  <option value="immediate">Immediate — this semester</option>
                  <option value="next_semester">Next semester</option>
                  <option value="next_school_year">Next school year</option>
                  <option value="exploring">Just exploring</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Anything else we should know?
                </label>
                <textarea
                  name="message"
                  rows={4}
                  placeholder="Tell us about your students, current math programs, or specific goals."
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-700 focus:ring-2 focus:ring-indigo-700/10"
                />
              </div>
              {state.error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-700">{state.error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-lg bg-indigo-700 py-3.5 text-base font-semibold text-white hover:bg-indigo-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isPending ? "Submitting..." : "Submit Partnership Inquiry"}
                {!isPending && <ArrowRight className="h-5 w-5" />}
              </button>
              <p className="text-[11px] text-slate-400 text-center">
                A MathPivot partnership lead will respond within 2 business
                days.
              </p>
            </form>
          )}
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
            <Link href="/for/schools" className="hover:text-white">
              For Schools
            </Link>
            <Link href="/about" className="hover:text-white">
              About
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
