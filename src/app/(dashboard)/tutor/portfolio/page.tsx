import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function CoachPortfolioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: enrollments } = await supabase
    .from("program_enrollments")
    .select(
      "id, student_id, program_id, status, enrolled_at, current_course_id",
    )
    .eq("coach_id", user.id)
    .in("status", ["active", "paused"])
    .order("enrolled_at", { ascending: false });

  const studentIds = [...new Set((enrollments || []).map((e) => e.student_id))];
  const programIds = [...new Set((enrollments || []).map((e) => e.program_id))];

  const [{ data: students }, { data: programs }] = await Promise.all([
    studentIds.length > 0
      ? supabase
          .from("users_profile")
          .select("id, full_name")
          .in("id", studentIds)
      : { data: [] as { id: string; full_name: string }[] },
    programIds.length > 0
      ? supabase
          .from("coaching_programs")
          .select("id, name, track_level, sessions_per_month")
          .in("id", programIds)
      : {
          data: [] as {
            id: string;
            name: string;
            track_level: string;
            sessions_per_month: number;
          }[],
        },
  ]);

  const studentMap = new Map((students || []).map((s) => [s.id, s.full_name]));
  const programMap = new Map((programs || []).map((p) => [p.id, p]));

  const masteryByStudent = new Map<
    string,
    { total: number; mastered: number }
  >();
  if (studentIds.length > 0) {
    const { data: mastery } = await supabase
      .from("student_concept_mastery")
      .select("student_id, mastery_level")
      .in("student_id", studentIds);

    (mastery || []).forEach((m) => {
      const current = masteryByStudent.get(m.student_id) || {
        total: 0,
        mastered: 0,
      };
      current.total++;
      if (m.mastery_level === "mastered" || m.mastery_level === "proficient") {
        current.mastered++;
      }
      masteryByStudent.set(m.student_id, current);
    });
  }

  const trackColors: Record<string, string> = {
    foundation: "bg-blue-100 text-blue-800",
    acceleration: "bg-amber-100 text-amber-800",
    elite: "bg-purple-100 text-purple-800",
  };

  const activeCount = (enrollments || []).filter(
    (e) => e.status === "active",
  ).length;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Portfolio</h1>
          <p className="text-slate-600">
            {activeCount} active student{activeCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {!enrollments || enrollments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">
              No students enrolled yet. Students will appear here once parents
              enroll them in a program and select you as their coach.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {enrollments.map((enrollment) => {
            const program = programMap.get(enrollment.program_id);
            const mastery = masteryByStudent.get(enrollment.student_id);
            const masteryPct =
              mastery && mastery.total > 0
                ? Math.round((mastery.mastered / mastery.total) * 100)
                : 0;

            return (
              <Card key={enrollment.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">
                          {studentMap.get(enrollment.student_id) || "Student"}
                        </h3>
                        <Badge
                          variant={
                            enrollment.status === "active"
                              ? "success"
                              : "warning"
                          }
                        >
                          {enrollment.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        {program && (
                          <Badge
                            className={
                              trackColors[program.track_level] || "bg-slate-100"
                            }
                          >
                            {program.name}
                          </Badge>
                        )}
                        <span>
                          Since {formatDate(enrollment.enrolled_at, "MMM yyyy")}
                        </span>
                        {program && (
                          <span>{program.sessions_per_month} sessions/mo</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {mastery && mastery.total > 0 ? (
                        <div>
                          <p className="text-lg font-bold text-slate-900">
                            {masteryPct}%
                          </p>
                          <p className="text-xs text-slate-400">
                            {mastery.mastered}/{mastery.total} mastered
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">
                          No mastery data
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
