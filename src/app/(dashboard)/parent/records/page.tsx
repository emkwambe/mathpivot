import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import ExportRecords from "./ExportRecords";

export default async function RecordsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: enrollments } = await supabase
    .from("program_enrollments")
    .select("id, student_id, status")
    .eq("parent_id", user.id)
    .in("status", ["active", "paused", "completed"]);

  const studentIds = [...new Set((enrollments || []).map((e) => e.student_id))];

  const { data: students } =
    studentIds.length > 0
      ? await supabase
          .from("users_profile")
          .select("id, full_name")
          .in("id", studentIds)
      : { data: [] };

  const { data: profiles } =
    studentIds.length > 0
      ? await supabase
          .from("student_academic_profiles")
          .select("student_id, is_homeschool")
          .in("student_id", studentIds)
      : { data: [] };

  const homeschoolSet = new Set(
    (profiles || []).filter((p) => p.is_homeschool).map((p) => p.student_id),
  );

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Export Records</h1>
        <p className="text-slate-600 text-sm mt-1">
          Download attendance logs, mastery portfolios, progress reports, and
          transcripts for compliance and record keeping.
        </p>
      </div>

      {!students || students.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">
              No enrolled students found. Records will be available once your
              child is enrolled in a program.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {(students || []).map((student) => (
            <Card key={student.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {student.full_name}
                  {homeschoolSet.has(student.id) && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-normal">
                      Homeschool
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ExportRecords
                  studentId={student.id}
                  studentName={student.full_name}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
