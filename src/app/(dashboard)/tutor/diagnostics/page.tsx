import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@/components/ui";

export default async function CoachDiagnosticsPage() {
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

  const [{ data: students }, { data: diagnostics }] = await Promise.all([
    studentIds.length > 0
      ? supabase
          .from("users_profile")
          .select("id, full_name")
          .in("id", studentIds)
      : { data: [] as { id: string; full_name: string }[] },
    studentIds.length > 0
      ? supabase
          .from("diagnostic_assessments")
          .select(
            "id, student_id, overall_score, recommended_program, completed_at, duration_minutes",
          )
          .in("student_id", studentIds)
          .order("completed_at", { ascending: false })
      : { data: [] },
  ]);

  const studentMap = new Map((students || []).map((s) => [s.id, s.full_name]));

  const diagnosticsByStudent = new Map<string, typeof diagnostics>();
  for (const d of diagnostics || []) {
    const existing = diagnosticsByStudent.get(d.student_id) || [];
    existing.push(d);
    diagnosticsByStudent.set(d.student_id, existing);
  }

  const totalDiagnostics = (diagnostics || []).length;
  const studentsAssessed = diagnosticsByStudent.size;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Diagnostics</h1>
          <p className="text-slate-600 text-sm mt-1">
            Administer placement assessments and view student results.
          </p>
        </div>
        <Link
          href="/diagnostic"
          target="_blank"
          className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors"
        >
          Public Diagnostic Link
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {totalDiagnostics}
          </p>
          <p className="text-xs text-slate-500">Total Assessments</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{studentsAssessed}</p>
          <p className="text-xs text-slate-500">Students Assessed</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {studentIds.length}
          </p>
          <p className="text-xs text-slate-500">Total Students</p>
        </div>
      </div>

      {studentIds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">
              No students enrolled yet. Diagnostics will be available once
              students are assigned to you.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {studentIds.map((studentId) => {
                  const name = studentMap.get(studentId) || "Student";
                  const studentDiagnostics =
                    diagnosticsByStudent.get(studentId) || [];
                  const latest = studentDiagnostics[0];

                  return (
                    <div
                      key={studentId}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 text-sm">
                            {name}
                          </h3>
                          {latest ? (
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-500">
                                Score: {latest.overall_score}%
                              </span>
                              <Badge className="bg-blue-50 text-blue-700 text-xs">
                                {latest.recommended_program}
                              </Badge>
                              <span className="text-xs text-slate-400">
                                {new Date(
                                  latest.completed_at,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">
                              No assessment yet
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {latest && (
                          <span className="text-xs text-slate-400">
                            {studentDiagnostics.length} assessment
                            {studentDiagnostics.length !== 1 ? "s" : ""}
                          </span>
                        )}
                        <Link
                          href={`/tutor/diagnostics/${studentId}`}
                          className="px-3 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-lg hover:bg-blue-800 transition-colors"
                        >
                          {latest ? "Re-assess" : "Assess"}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
