import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Badge } from "@/components/ui";

async function enrollAction(formData: FormData) {
  "use server";

  const { getCurrentUser } = await import("@/lib/auth");
  const { createClient } = await import("@/lib/supabase/server");

  const user = await getCurrentUser();
  if (!user || user.role !== "parent") return;

  const supabase = await createClient();
  const programId = formData.get("programId") as string;
  const studentId = formData.get("studentId") as string;
  const coachId = formData.get("coachId") as string;

  if (!programId || !studentId || !coachId) return;

  const { data: program } = await supabase
    .from("coaching_programs")
    .select("max_students_per_coach")
    .eq("id", programId)
    .single();

  if (!program) return;

  const { count: currentStudents } = await supabase
    .from("program_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("coach_id", coachId)
    .eq("status", "active");

  if (currentStudents && currentStudents >= program.max_students_per_coach) {
    return;
  }

  const { error } = await supabase.from("program_enrollments").insert({
    student_id: studentId,
    coach_id: coachId,
    program_id: programId,
    parent_id: user.id,
    status: "active",
  });

  if (error) {
    console.error("Enrollment error:", error);
    return;
  }

  revalidatePath("/parent/programs");
  redirect("/parent/programs");
}

export default async function EnrollPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: program } = await supabase
    .from("coaching_programs")
    .select("*")
    .eq("id", programId)
    .single();

  if (!program) redirect("/parent/programs");

  const { data: familyMember } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .single();

  const familyId = familyMember?.family_id;

  const { data: studentsRaw } = familyId
    ? await supabase
        .from("students_profile")
        .select("user_id")
        .eq("family_id", familyId)
    : { data: [] };

  const studentIds = (studentsRaw || []).map((s) => s.user_id);
  const { data: studentProfiles } =
    studentIds.length > 0
      ? await supabase
          .from("users_profile")
          .select("id, full_name")
          .in("id", studentIds)
      : { data: [] };

  const students = studentProfiles || [];

  const { data: coaches } = await supabase
    .from("tutors_profile")
    .select("user_id")
    .eq("is_active", true);

  const coachIds = (coaches || []).map((c) => c.user_id);
  const { data: coachProfiles } =
    coachIds.length > 0
      ? await supabase
          .from("users_profile")
          .select("id, full_name")
          .in("id", coachIds)
      : { data: [] };

  const coachesWithCapacity = await Promise.all(
    (coachProfiles || []).map(async (coach) => {
      const { count } = await supabase
        .from("program_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("coach_id", coach.id)
        .eq("status", "active");

      return {
        ...coach,
        current_students: count || 0,
        max_students: program.max_students_per_coach,
        has_capacity: (count || 0) < program.max_students_per_coach,
      };
    }),
  );

  const { data: existingEnrollments } = await supabase
    .from("program_enrollments")
    .select("student_id")
    .eq("program_id", programId)
    .eq("parent_id", user.id)
    .eq("status", "active");

  const enrolledStudentIds = new Set(
    (existingEnrollments || []).map((e) => e.student_id),
  );

  const price = (program.monthly_price_cents / 100).toFixed(0);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <Link
        href="/parent/programs"
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
        Back to Programs
      </Link>

      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <Badge className="mb-2">
          {program.track_level.charAt(0).toUpperCase() +
            program.track_level.slice(1)}
        </Badge>
        <h1 className="text-2xl font-bold text-slate-900">{program.name}</h1>
        <p className="text-slate-600 mt-1">{program.description}</p>
        <div className="flex items-baseline gap-1 mt-4">
          <span className="text-3xl font-bold text-slate-900">${price}</span>
          <span className="text-slate-500">/month</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {program.sessions_per_month} sessions/month &middot;{" "}
          {program.min_enrollment_months}-month minimum
        </p>
      </div>

      {students.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-600 mb-3">No students in your family yet.</p>
          <Link
            href="/parent"
            className="text-blue-600 hover:underline font-medium"
          >
            Add a student first
          </Link>
        </div>
      ) : (
        <form action={enrollAction}>
          <input type="hidden" name="programId" value={programId} />

          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-4">
            <h2 className="font-semibold text-slate-900 mb-4">
              Select Student
            </h2>
            <div className="space-y-2">
              {students.map((student) => {
                const isEnrolled = enrolledStudentIds.has(student.id);
                return (
                  <label
                    key={student.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isEnrolled
                        ? "border-green-200 bg-green-50 cursor-not-allowed"
                        : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="studentId"
                      value={student.id}
                      disabled={isEnrolled}
                      required
                      className="text-blue-600"
                    />
                    <span className="font-medium text-slate-900">
                      {student.full_name}
                    </span>
                    {isEnrolled && (
                      <Badge className="bg-green-100 text-green-800 ml-auto">
                        Already Enrolled
                      </Badge>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
            <h2 className="font-semibold text-slate-900 mb-4">Select Coach</h2>
            {coachesWithCapacity.length === 0 ? (
              <p className="text-slate-500">
                No coaches available at this time.
              </p>
            ) : (
              <div className="space-y-2">
                {coachesWithCapacity.map((coach) => (
                  <label
                    key={coach.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      coach.has_capacity
                        ? "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                        : "border-slate-100 bg-slate-50 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="coachId"
                        value={coach.id}
                        disabled={!coach.has_capacity}
                        required
                        className="text-blue-600"
                      />
                      <span className="font-medium text-slate-900">
                        {coach.full_name}
                      </span>
                    </div>
                    <span
                      className={`text-xs ${coach.has_capacity ? "text-slate-400" : "text-red-500"}`}
                    >
                      {coach.current_students}/{coach.max_students} students
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Enroll — ${price}/month
          </button>

          <p className="text-xs text-slate-400 text-center mt-3">
            By enrolling, you agree to a {program.min_enrollment_months}-month
            minimum commitment at ${price}/month.
          </p>
        </form>
      )}
    </div>
  );
}
