import Link from "next/link";
import type { Metadata } from "next";
import { listPublicCoaches } from "@/app/actions/public-coaches";
import { BOOKING_URL } from "@/lib/booking";
import { GraduationCap, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "Meet the Coaches — MathPivot",
  description:
    "MathPivot Math Coaches are certified educators who lead small-cohort coaching sessions grounded in the MathPivot Method — mastery-centered, aligned to each student's school curriculum, and designed to build long-term mathematical capability.",
};

// v0 revalidation cadence: coach roster changes infrequently, so cache
// this page for one hour to keep it fast on the marketing side.
export const revalidate = 3600;

export default async function PublicCoachesPage() {
  const coaches = await listPublicCoaches();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-slate-900 text-lg">MathPivot</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2"
            >
              Programs
            </Link>
            <Link
              href="/about"
              className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2"
            >
              About
            </Link>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800"
            >
              Talk to a coach
            </a>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 pt-16 pb-8 text-center">
        <p className="text-blue-700 font-semibold text-sm uppercase tracking-wide mb-3">
          The MathPivot coaching team
        </p>
        <h1 className="text-4xl font-bold text-slate-900">
          Meet the coaches teaching your student.
        </h1>
        <p className="text-lg text-slate-600 mt-4 max-w-3xl mx-auto leading-relaxed">
          Every MathPivot coach has completed the Certified Coach training and
          demonstrated their ability to plan and facilitate a mastery-centered
          coaching session. Coaches are not tutors by the hour — they are
          educators developing your student&apos;s mathematical capability over
          time.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-12">
        {coaches.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
            <p className="text-slate-700">
              The coaching team page will populate as coaches complete
              certification and become active.
            </p>
            <p className="text-sm text-slate-500 mt-3">
              In the meantime,{" "}
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 hover:underline font-medium"
              >
                book a 15-minute call
              </a>{" "}
              and we&apos;ll match your student personally.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {coaches.map((c) => (
              <CoachCard key={c.id} coach={c} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-slate-50 border-y border-slate-100 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Not sure which coach is right for your student?
          </h2>
          <p className="text-slate-600 mt-3">
            Coaches are matched during onboarding based on your student&apos;s
            current course, availability, and learning goals — you don&apos;t
            need to pick one yourself.
          </p>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-800"
          >
            Book a 15-min consultation
          </a>
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
          <div className="flex items-center gap-6 text-xs">
            <Link href="/pricing" className="hover:text-slate-200">
              Programs
            </Link>
            <Link href="/coaches" className="hover:text-slate-200">
              Coaches
            </Link>
            <Link href="/about" className="hover:text-slate-200">
              About
            </Link>
            <Link href="/careers" className="hover:text-slate-200">
              Careers
            </Link>
            <Link href="/coach-apply" className="hover:text-slate-200">
              Coach with us
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CoachCard({
  coach,
}: {
  coach: import("@/app/actions/public-coaches").PublicCoach;
}) {
  const initials = coach.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
  const bio = coach.bio
    ? coach.bio.length > 260
      ? `${coach.bio.slice(0, 240).trim()}…`
      : coach.bio
    : null;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {coach.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coach.avatar_url}
            alt={coach.name}
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
            {initials || "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 truncate">{coach.name}</h3>
          <div className="flex items-center gap-1 text-xs mt-0.5">
            {coach.tier === "master" ? (
              <>
                <Award className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-purple-700 font-semibold">
                  Master Coach
                </span>
              </>
            ) : (
              <>
                <GraduationCap className="w-3.5 h-3.5 text-blue-700" />
                <span className="text-blue-700 font-semibold">
                  Certified Coach
                </span>
              </>
            )}
          </div>
          {coach.location && (
            <p className="text-xs text-slate-500 mt-0.5">{coach.location}</p>
          )}
        </div>
      </div>

      {coach.specialties.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1">
          {coach.specialties.slice(0, 5).map((s) => (
            <span
              key={s}
              className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
            >
              {s}
            </span>
          ))}
          {coach.specialties.length > 5 && (
            <span className="text-[11px] text-slate-400 px-1 py-0.5">
              +{coach.specialties.length - 5}
            </span>
          )}
        </div>
      )}

      {bio && (
        <p className="text-sm text-slate-600 mt-4 leading-relaxed">{bio}</p>
      )}

      {coach.years_teaching != null && coach.years_teaching > 0 && (
        <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
          {coach.years_teaching}+ years teaching mathematics.
        </p>
      )}
    </div>
  );
}
