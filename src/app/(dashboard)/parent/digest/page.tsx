import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

export default async function ParentDigestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: enrollments } = await supabase
    .from("program_enrollments")
    .select("id, student_id, program_id, coach_id, status")
    .eq("parent_id", user.id)
    .in("status", ["active", "paused"]);

  const studentIds = [...new Set((enrollments || []).map((e) => e.student_id))];
  const coachIds = [
    ...new Set((enrollments || []).map((e) => e.coach_id).filter(Boolean)),
  ];

  const [
    { data: students },
    { data: coaches },
    { data: mastery },
    { data: recentSessions },
    { data: programs },
  ] = await Promise.all([
    studentIds.length > 0
      ? supabase
          .from("users_profile")
          .select("id, full_name")
          .in("id", studentIds)
      : { data: [] as { id: string; full_name: string }[] },
    coachIds.length > 0
      ? supabase
          .from("users_profile")
          .select("id, full_name")
          .in("id", coachIds)
      : { data: [] as { id: string; full_name: string }[] },
    studentIds.length > 0
      ? supabase
          .from("student_concept_mastery")
          .select("student_id, mastery_level")
          .in("student_id", studentIds)
      : { data: [] },
    studentIds.length > 0
      ? supabase
          .from("sessions")
          .select("id, completed_at, booking:bookings!inner(student_user_id)")
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(20)
      : { data: [] },
    supabase.from("coaching_programs").select("id, name, track_level"),
  ]);

  const studentMap = new Map((students || []).map((s) => [s.id, s.full_name]));
  const coachMap = new Map((coaches || []).map((c) => [c.id, c.full_name]));
  const programMap = new Map(
    (programs || []).map((p) => [p.id, { name: p.name, track: p.track_level }]),
  );

  const masteryByStudent = new Map<
    string,
    { total: number; proficient: number }
  >();
  for (const m of mastery || []) {
    const current = masteryByStudent.get(m.student_id) || {
      total: 0,
      proficient: 0,
    };
    current.total++;
    if (m.mastery_level === "mastered" || m.mastery_level === "proficient")
      current.proficient++;
    masteryByStudent.set(m.student_id, current);
  }

  const sessionsByStudent = new Map<string, number>();
  for (const s of recentSessions || []) {
    const booking = s.booking as unknown as { student_user_id: string };
    if (studentIds.includes(booking.student_user_id)) {
      sessionsByStudent.set(
        booking.student_user_id,
        (sessionsByStudent.get(booking.student_user_id) || 0) + 1,
      );
    }
  }

  const trackColors: Record<string, string> = {
    foundation: "bg-blue-100 text-blue-800",
    acceleration: "bg-amber-100 text-amber-800",
    elite: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Weekly Digest</h1>
        <p className="text-slate-600 text-sm mt-1">
          A snapshot of your child&apos;s coaching progress. This same summary
          is emailed to you weekly.
        </p>
      </div>

      {studentIds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No enrolled students yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {(enrollments || []).map((enrollment) => {
            const name = studentMap.get(enrollment.student_id) || "Student";
            const coach = enrollment.coach_id
              ? coachMap.get(enrollment.coach_id)
              : null;
            const program = programMap.get(enrollment.program_id);
            const mData = masteryByStudent.get(enrollment.student_id);
            const sessionCount =
              sessionsByStudent.get(enrollment.student_id) || 0;
            const masteryPct =
              mData && mData.total > 0
                ? Math.round((mData.proficient / mData.total) * 100)
                : 0;

            return (
              <div
                key={enrollment.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">{name}</h2>
                      <p className="text-blue-200 text-sm mt-0.5">
                        {coach
                          ? `Math Coach: ${coach}`
                          : "Coach assignment pending"}
                      </p>
                    </div>
                    {program && (
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${trackColors[program.track] || "bg-white/20 text-white"}`}
                      >
                        {program.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">
                        {masteryPct}%
                      </p>
                      <p className="text-xs text-slate-500">Mastery</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">
                        {mData?.proficient || 0}/{mData?.total || 0}
                      </p>
                      <p className="text-xs text-slate-500">
                        Concepts Mastered
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">
                        {sessionCount}
                      </p>
                      <p className="text-xs text-slate-500">Recent Sessions</p>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-3 mb-4">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        masteryPct >= 80
                          ? "bg-emerald-500"
                          : masteryPct >= 50
                            ? "bg-blue-500"
                            : masteryPct >= 25
                              ? "bg-amber-500"
                              : "bg-slate-300"
                      }`}
                      style={{ width: `${masteryPct}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs font-medium text-slate-500 mb-1">
                        This Week&apos;s Focus
                      </p>
                      <p className="text-sm text-slate-700">
                        {masteryPct < 50
                          ? "Building foundational skills and closing gaps"
                          : masteryPct < 80
                            ? "Strengthening developing concepts toward proficiency"
                            : "Advancing mastered concepts and competition readiness"}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs font-medium text-slate-500 mb-1">
                        Coach&apos;s Priority
                      </p>
                      <p className="text-sm text-slate-700">
                        {sessionCount === 0
                          ? "Scheduling first sessions"
                          : sessionCount < 4
                            ? "Building session rhythm and rapport"
                            : "Deepening mastery and preparing for assessments"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-sm text-blue-700">
              This digest is sent to your email every Monday morning. Contact
              your math coach directly for detailed session notes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
