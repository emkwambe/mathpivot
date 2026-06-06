import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DiagnosticRunner from "@/components/DiagnosticRunner";

export default async function AdministerDiagnosticPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: enrollment } = await supabase
    .from("program_enrollments")
    .select("id, student_id")
    .eq("student_id", studentId)
    .eq("coach_id", user.id)
    .limit(1)
    .single();

  if (!enrollment) redirect("/tutor/diagnostics");

  const { data: studentProfile } = await supabase
    .from("users_profile")
    .select("full_name")
    .eq("id", studentId)
    .single();

  const { data: academicProfile } = await supabase
    .from("student_academic_profiles")
    .select("grade_level")
    .eq("student_id", studentId)
    .single();

  const gradeHint = academicProfile?.grade_level
    ? parseInt(academicProfile.grade_level)
    : undefined;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <Link
        href="/tutor/diagnostics"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Diagnostics
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Diagnostic: {studentProfile?.full_name || "Student"}
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Administer the placement assessment. Results will determine the
          recommended program.
        </p>
      </div>

      <DiagnosticRunner studentId={studentId} gradeHint={gradeHint} />
    </div>
  );
}
