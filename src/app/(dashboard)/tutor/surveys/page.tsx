import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, Badge } from "@/components/ui";
import { getSurveyTemplates } from "@/app/actions/surveys";

export default async function CoachSurveysPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: enrollments } = await supabase
    .from("program_enrollments")
    .select("id, student_id, program_id, status")
    .eq("coach_id", user.id)
    .in("status", ["active", "paused"])
    .order("enrolled_at", { ascending: false });

  const studentIds = [...new Set((enrollments || []).map((e) => e.student_id))];

  const [
    { data: students },
    { data: programs },
    templates,
    { data: recentResponses },
  ] = await Promise.all([
    studentIds.length > 0
      ? supabase
          .from("users_profile")
          .select("id, full_name")
          .in("id", studentIds)
      : { data: [] as { id: string; full_name: string }[] },
    supabase.from("coaching_programs").select("id, name, track_level"),
    getSurveyTemplates(),
    supabase
      .from("survey_responses")
      .select("enrollment_id, template_id, completed_at")
      .eq("respondent_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(100),
  ]);

  const studentMap = new Map((students || []).map((s) => [s.id, s.full_name]));
  const programMap = new Map(
    (programs || []).map((p) => [p.id, { name: p.name, track: p.track_level }]),
  );

  const responsesByEnrollment = new Map<
    string,
    { templateId: string; completedAt: string }[]
  >();
  for (const r of recentResponses || []) {
    const existing = responsesByEnrollment.get(r.enrollment_id) || [];
    existing.push({ templateId: r.template_id, completedAt: r.completed_at });
    responsesByEnrollment.set(r.enrollment_id, existing);
  }

  const trackColors: Record<string, string> = {
    foundation: "bg-blue-100 text-blue-800",
    acceleration: "bg-amber-100 text-amber-800",
    elite: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Surveys</h1>
        <p className="text-slate-600 text-sm mt-1">
          Session check-ins, school pulse, parent confidence, and career
          interest assessments for your students.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Available Survey Templates
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {templates.map((t) => (
            <div key={t.id} className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-sm font-medium text-slate-900">{t.title}</p>
              <p className="text-xs text-slate-500 mt-1">
                {t.questions.length} Q
                {t.frequency_days ? ` · ${t.frequency_days}d` : ""}
              </p>
            </div>
          ))}
        </div>
      </div>

      {!enrollments || enrollments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">
              No students enrolled yet. Surveys will be available once students
              are assigned to you.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {enrollments.map((enrollment) => {
            const program = programMap.get(enrollment.program_id);
            const responses = responsesByEnrollment.get(enrollment.id) || [];
            const lastResponseDate =
              responses.length > 0
                ? new Date(responses[0].completedAt).toLocaleDateString()
                : null;

            return (
              <Link
                key={enrollment.id}
                href={`/tutor/portfolio/${enrollment.id}/surveys`}
                className="block"
              >
                <Card className="hover:border-blue-300 transition-colors">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-sm font-bold text-slate-600">
                          {(studentMap.get(enrollment.student_id) || "S")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 text-sm">
                            {studentMap.get(enrollment.student_id) || "Student"}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            {program && (
                              <Badge
                                className={`text-xs ${trackColors[program.track] || "bg-slate-100"}`}
                              >
                                {program.name}
                              </Badge>
                            )}
                            {lastResponseDate && (
                              <span className="text-xs text-slate-400">
                                Last survey: {lastResponseDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          {responses.length} response
                          {responses.length !== 1 ? "s" : ""}
                        </span>
                        <svg
                          className="w-4 h-4 text-slate-400"
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
