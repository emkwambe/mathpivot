import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui";

const trackColors = {
  foundation: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-800",
    accent: "text-blue-600",
    button: "bg-blue-600 hover:bg-blue-700",
  },
  acceleration: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-800",
    accent: "text-amber-600",
    button: "bg-amber-600 hover:bg-amber-700",
  },
  elite: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    badge: "bg-purple-100 text-purple-800",
    accent: "text-purple-600",
    button: "bg-purple-600 hover:bg-purple-700",
  },
};

const trackDescriptions: Record<string, string> = {
  foundation:
    "Build strong fundamentals with grade-level mastery. Perfect for students who need structured support and confidence building.",
  acceleration:
    "Push beyond grade level with competition prep and applied projects. For students ready to challenge themselves.",
  elite:
    "Intensive coaching for advanced students pursuing competition excellence and early career exposure.",
};

const trackFeatures: Record<string, string[]> = {
  foundation: [
    "Named coach for the duration",
    "2x per week (60-min sessions)",
    "Mastery tracking dashboard",
    "Career exposure modules",
    "Weekly progress reports",
  ],
  acceleration: [
    "Everything in Foundation",
    "3x per week (60-min sessions)",
    "Mathathlon competition prep",
    "AMC 8 / MATHCOUNTS readiness",
    "Applied math projects",
  ],
  elite: [
    "Everything in Acceleration",
    "4x per week (60-min sessions)",
    "1-on-1 intensive coaching",
    "AMC 10/12 and AIME prep",
    "College readiness portfolio",
  ],
};

export default async function ProgramsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: programs } = await supabase
    .from("coaching_programs")
    .select("*")
    .eq("is_active", true)
    .order("monthly_price_cents", { ascending: true });

  const { data: enrollments } = await supabase
    .from("program_enrollments")
    .select("id, program_id, student_id, status")
    .eq("parent_id", user.id)
    .eq("status", "active");

  const enrolledProgramIds = new Set(
    enrollments?.map((e) => e.program_id) || [],
  );

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Coaching Programs</h1>
        <p className="text-slate-600 mt-1">
          Structured programs with a named coach — not hourly sessions. Your
          child gets a long-term mentor who knows their strengths, gaps, and
          goals.
        </p>
      </div>

      {!programs || programs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <h2 className="text-lg font-semibold text-slate-700 mb-2">
            Programs coming soon
          </h2>
          <p className="text-slate-500">
            We&apos;re setting up our coaching programs. Check back soon or
            contact us to be notified when enrollment opens.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {programs.map((program) => {
            const track = program.track_level as keyof typeof trackColors;
            const colors = trackColors[track] || trackColors.foundation;
            const features = trackFeatures[track] || trackFeatures.foundation;
            const desc =
              trackDescriptions[track] || trackDescriptions.foundation;
            const isEnrolled = enrolledProgramIds.has(program.id);
            const price = (program.monthly_price_cents / 100).toFixed(0);

            return (
              <div
                key={program.id}
                className={`relative rounded-xl border-2 ${colors.border} ${colors.bg} p-6 flex flex-col`}
              >
                {track === "acceleration" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <Badge className={colors.badge}>
                    {track.charAt(0).toUpperCase() + track.slice(1)}
                  </Badge>
                  <h2 className="text-xl font-bold text-slate-900 mt-3">
                    {program.name}
                  </h2>
                  <p className="text-sm text-slate-600 mt-2">{desc}</p>
                </div>

                <div className="mb-6">
                  <span className={`text-3xl font-bold ${colors.accent}`}>
                    ${price}
                  </span>
                  <span className="text-slate-500 text-sm">/month</span>
                  {program.min_enrollment_months > 1 && (
                    <p className="text-xs text-slate-400 mt-1">
                      {program.min_enrollment_months}-month minimum
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    {program.sessions_per_month} sessions/month includes:
                  </p>
                  <ul className="space-y-2">
                    {features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-slate-700"
                      >
                        <svg
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colors.accent}`}
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
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto">
                  {isEnrolled ? (
                    <div className="w-full text-center py-2.5 rounded-lg bg-green-100 text-green-800 font-medium text-sm">
                      Currently Enrolled
                    </div>
                  ) : (
                    <Link
                      href={`/parent/programs/${program.id}/enroll`}
                      className={`block w-full text-center py-2.5 rounded-lg text-white font-medium text-sm transition-colors ${colors.button}`}
                    >
                      Enroll Now
                    </Link>
                  )}
                </div>

                {program.grade_range_start && (
                  <p className="text-xs text-slate-400 text-center mt-3">
                    Grades {program.grade_range_start}–{program.grade_range_end}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-12 bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: "1",
              title: "Choose a Program",
              desc: "Pick the track that matches your child's level and goals.",
            },
            {
              step: "2",
              title: "Get Matched with a Coach",
              desc: "Your child gets a named coach who stays with them long-term.",
            },
            {
              step: "3",
              title: "Learn & Track Mastery",
              desc: "Structured sessions with measurable outcomes every time.",
            },
            {
              step: "4",
              title: "Compete & Grow",
              desc: "Mathathlon competitions and career exposure build confidence.",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mx-auto mb-3">
                {item.step}
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
