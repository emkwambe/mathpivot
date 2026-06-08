import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import StudentIntakeForm from "@/components/StudentIntakeForm";

export default async function ParentIntakePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: enrollments } = await supabase
    .from("program_enrollments")
    .select("id, student_id, status")
    .eq("parent_id", user.id)
    .in("status", ["active", "paused"]);

  const studentIds = [...new Set((enrollments || []).map((e) => e.student_id))];

  const [{ data: students }, { data: profiles }] = await Promise.all([
    studentIds.length > 0
      ? supabase
          .from("users_profile")
          .select("id, full_name")
          .in("id", studentIds)
      : { data: [] as { id: string; full_name: string }[] },
    studentIds.length > 0
      ? supabase
          .from("student_academic_profiles")
          .select("*")
          .in("student_id", studentIds)
      : { data: [] },
  ]);

  const studentMap = new Map((students || []).map((s) => [s.id, s.full_name]));
  const profileMap = new Map((profiles || []).map((p) => [p.student_id, p]));

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Student Profiles</h1>
        <p className="text-slate-600 text-sm mt-1">
          Help your child&apos;s math coach by sharing school info, goals, and
          preferences. The more we know, the better the coaching experience.
        </p>
      </div>

      {studentIds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">
              No enrolled students found. Profiles will appear once your child
              is enrolled in a program.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {studentIds.map((studentId) => {
            const name = studentMap.get(studentId) || "Student";
            const profile = profileMap.get(studentId);
            const completeness = profile?.profile_completeness || 0;

            return (
              <Card key={studentId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      {name}
                    </CardTitle>
                    {completeness > 0 && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          completeness >= 80
                            ? "bg-emerald-100 text-emerald-700"
                            : completeness >= 40
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {completeness}% complete
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <StudentIntakeForm
                    studentId={studentId}
                    studentName={name}
                    existingProfile={
                      profile ? (profile as Record<string, unknown>) : undefined
                    }
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
