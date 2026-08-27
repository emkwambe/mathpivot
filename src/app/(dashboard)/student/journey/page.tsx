import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function StudentJourneyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users_profile")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: enrollment } = await supabase
    .from("program_enrollments")
    .select("id, program_id, coach_id, enrolled_at, current_course_id")
    .eq("student_id", user.id)
    .eq("status", "active")
    .order("enrolled_at", { ascending: false })
    .limit(1)
    .single();

  let programName = "";
  let trackLevel = "";
  let coachName = "";

  if (enrollment) {
    const [{ data: program }, { data: coach }] = await Promise.all([
      supabase
        .from("coaching_programs")
        .select("name, track_level")
        .eq("id", enrollment.program_id)
        .single(),
      supabase
        .from("users_profile")
        .select("full_name")
        .eq("id", enrollment.coach_id)
        .single(),
    ]);
    programName = program?.name || "";
    trackLevel = program?.track_level || "";
    coachName = coach?.full_name || "";
  }

  const { data: mastery } = await supabase
    .from("student_concept_mastery")
    .select("mastery_level")
    .eq("student_id", user.id);

  const masteryStats = {
    total: mastery?.length || 0,
    mastered:
      mastery?.filter((m) => m.mastery_level === "mastered").length || 0,
    proficient:
      mastery?.filter((m) => m.mastery_level === "proficient").length || 0,
    developing:
      mastery?.filter((m) => m.mastery_level === "developing").length || 0,
    introduced:
      mastery?.filter((m) => m.mastery_level === "introduced").length || 0,
  };
  const masteryPct =
    masteryStats.total > 0
      ? Math.round(
          ((masteryStats.mastered + masteryStats.proficient) /
            masteryStats.total) *
            100,
        )
      : 0;

  const { data: compResults } = await supabase
    .from("competition_results")
    .select("badge_earned, placement")
    .eq("student_id", user.id);

  const competitionStats = {
    total: compResults?.length || 0,
    badges:
      compResults?.filter(
        (r) => r.badge_earned && r.badge_earned !== "participation",
      ).length || 0,
    bestPlacement:
      compResults?.reduce(
        (best, r) => (r.placement && r.placement < best ? r.placement : best),
        Infinity,
      ) || Infinity,
  };

  const trackColors: Record<string, string> = {
    foundation: "from-blue-500 to-blue-600",
    acceleration: "from-amber-500 to-amber-600",
    elite: "from-purple-500 to-purple-600",
    advanced: "from-purple-500 to-purple-600",
  };

  const trackBadgeColors: Record<string, string> = {
    foundation: "bg-blue-100 text-blue-800",
    acceleration: "bg-amber-100 text-amber-800",
    elite: "bg-purple-100 text-purple-800",
    advanced: "bg-purple-100 text-purple-800",
  };

  const firstName = (profile?.full_name || "Student").split(" ")[0];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div
        className={`bg-gradient-to-r ${trackColors[trackLevel] || "from-slate-600 to-slate-700"} rounded-xl p-6 text-white mb-6`}
      >
        <h1 className="text-2xl font-bold">{firstName}&apos;s Journey</h1>
        {enrollment ? (
          <div className="mt-2 flex items-center gap-3">
            <Badge className="bg-white/20 text-white">{programName}</Badge>
            {coachName && (
              <span className="text-sm text-white/80">Coach: {coachName}</span>
            )}
            <span className="text-sm text-white/60">
              Since {formatDate(enrollment.enrolled_at, "MMM yyyy")}
            </span>
          </div>
        ) : (
          <p className="text-white/80 mt-1">
            Not enrolled in a program yet.{" "}
            <Link href="/student" className="underline">
              Ask your parent to enroll you
            </Link>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">
                Mastery Progress
              </p>
              <Link
                href="/student/progress"
                className="text-xs text-blue-600 hover:underline"
              >
                Details
              </Link>
            </div>
            <p className="text-3xl font-bold text-slate-900">{masteryPct}%</p>
            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${masteryPct}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {masteryStats.mastered + masteryStats.proficient}/
              {masteryStats.total} concepts mastered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">Competitions</p>
              <Link
                href="/student/competitions"
                className="text-xs text-blue-600 hover:underline"
              >
                View All
              </Link>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {competitionStats.total}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span>{competitionStats.badges} badges</span>
              {competitionStats.bestPlacement !== Infinity && (
                <span>Best: #{competitionStats.bestPlacement}</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-slate-600 mb-3">
              Skill Breakdown
            </p>
            <div className="space-y-2">
              {[
                {
                  label: "Mastered",
                  count: masteryStats.mastered,
                  color: "bg-emerald-500",
                },
                {
                  label: "Proficient",
                  count: masteryStats.proficient,
                  color: "bg-green-400",
                },
                {
                  label: "Developing",
                  count: masteryStats.developing,
                  color: "bg-amber-400",
                },
                {
                  label: "Introduced",
                  count: masteryStats.introduced,
                  color: "bg-blue-400",
                },
              ].map((level) => (
                <div key={level.label} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${level.color}`} />
                  <span className="text-xs text-slate-600 flex-1">
                    {level.label}
                  </span>
                  <span className="text-xs font-medium text-slate-900">
                    {level.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          Your Path Forward
        </h2>
        <div className="space-y-4">
          {[
            {
              title: "Master Grade-Level Math",
              desc: "Build a strong foundation by mastering every concept in your current course.",
              metric: `${masteryPct}% complete`,
              done: masteryPct >= 80,
              link: "/student/progress",
            },
            {
              title: "Compete in Mathathlon",
              desc: "Test your skills against peers in curriculum-based competitions. No trick math — just excellence.",
              metric: `${competitionStats.total} competitions`,
              done: competitionStats.total >= 1,
              link: "/student/competitions",
            },
            {
              title: "Explore Career Connections",
              desc: "Discover how math connects to engineering, data science, finance, healthcare, and more.",
              metric: "Coming soon",
              done: false,
              link: "/student/career-pathways",
            },
            {
              title: "Advance to Next Track",
              desc:
                trackLevel === "foundation"
                  ? "Hit 80% mastery to unlock the Acceleration track — advanced problem-solving and enrichment."
                  : trackLevel === "acceleration"
                    ? "Excel in advanced mathematics to move into the Advanced track — AP-level and specialized pathways."
                    : "You're in the Advanced track — focus on AP, competition, and specialized pathway work.",
              metric:
                trackLevel === "advanced" || trackLevel === "elite"
                  ? "Top track"
                  : masteryPct >= 80
                    ? "Ready"
                    : `${80 - masteryPct}% to go`,
              done: trackLevel === "advanced" || trackLevel === "elite",
              link: "/student/progress",
            },
          ].map((milestone) => (
            <Link
              key={milestone.title}
              href={milestone.link}
              className="flex items-center gap-4 p-4 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  milestone.done
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {milestone.done ? (
                  <svg
                    className="w-4 h-4"
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
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-900">
                  {milestone.title}
                </h3>
                <p className="text-xs text-slate-500">{milestone.desc}</p>
              </div>
              <span
                className={`text-xs font-medium ${milestone.done ? "text-emerald-600" : "text-slate-400"}`}
              >
                {milestone.metric}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
