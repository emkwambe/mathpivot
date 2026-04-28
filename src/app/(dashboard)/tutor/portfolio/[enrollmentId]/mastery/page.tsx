import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Badge } from "@/components/ui";
import MasteryTracker from "./MasteryTracker";

async function updateMasteryAction(
  conceptId: string,
  level: string,
  enrollmentId: string,
) {
  "use server";

  const { getCurrentUser } = await import("@/lib/auth");
  const { createClient } = await import("@/lib/supabase/server");

  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") return;

  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from("program_enrollments")
    .select("student_id")
    .eq("id", enrollmentId)
    .eq("coach_id", user.id)
    .single();

  if (!enrollment) return;

  await supabase.from("student_concept_mastery").upsert(
    {
      student_id: enrollment.student_id,
      concept_id: conceptId,
      enrollment_id: enrollmentId,
      mastery_level: level,
      assessed_by: user.id,
      assessed_at: new Date().toISOString(),
    },
    { onConflict: "student_id,concept_id" },
  );

  revalidatePath(`/tutor/portfolio/${enrollmentId}/mastery`);
}

export default async function MasteryPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: enrollment } = await supabase
    .from("program_enrollments")
    .select("id, student_id, program_id, current_course_id, status")
    .eq("id", enrollmentId)
    .eq("coach_id", user.id)
    .single();

  if (!enrollment) redirect("/tutor/portfolio");

  const { data: studentProfile } = await supabase
    .from("users_profile")
    .select("full_name")
    .eq("id", enrollment.student_id)
    .single();

  const { data: program } = await supabase
    .from("coaching_programs")
    .select("name, track_level")
    .eq("id", enrollment.program_id)
    .single();

  let courseId = enrollment.current_course_id;
  if (!courseId) {
    const { data: firstCourse } = await supabase
      .from("courses")
      .select("id")
      .order("title")
      .limit(1)
      .single();
    courseId = firstCourse?.id;
  }

  if (!courseId) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-slate-500">
          No curriculum loaded yet. Ask an admin to seed course data.
        </p>
      </div>
    );
  }

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .eq("is_active", true)
    .order("title");

  const { data: units } = await supabase
    .from("curriculum_units")
    .select("id, title, sort_order")
    .eq("course_id", courseId)
    .order("sort_order");

  const unitIds = (units || []).map((u) => u.id);
  const { data: concepts } =
    unitIds.length > 0
      ? await supabase
          .from("atomic_concepts")
          .select(
            "id, unit_id, lesson_number, title, key_skills, standard_code, sort_order",
          )
          .in("unit_id", unitIds)
          .order("sort_order")
      : { data: [] };

  const { data: existingMastery } = await supabase
    .from("student_concept_mastery")
    .select("concept_id, mastery_level")
    .eq("student_id", enrollment.student_id);

  const masteryMap = new Map(
    (existingMastery || []).map((m) => [m.concept_id, m.mastery_level]),
  );

  const unitsWithConcepts = (units || []).map((unit) => ({
    ...unit,
    concepts: (concepts || [])
      .filter((c) => c.unit_id === unit.id)
      .map((c) => ({
        ...c,
        current_mastery:
          (masteryMap.get(c.id) as
            | "not_started"
            | "introduced"
            | "developing"
            | "proficient"
            | "mastered") || "not_started",
      })),
  }));

  const trackColors: Record<string, string> = {
    foundation: "bg-blue-100 text-blue-800",
    acceleration: "bg-amber-100 text-amber-800",
    elite: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <Link
        href="/tutor/portfolio"
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
        Back to Portfolio
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {studentProfile?.full_name || "Student"}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {program && (
              <Badge
                className={trackColors[program.track_level] || "bg-slate-100"}
              >
                {program.name}
              </Badge>
            )}
            <span className="text-sm text-slate-500">Mastery Tracking</span>
          </div>
        </div>

        {courses && courses.length > 1 && (
          <form>
            <select
              name="courseId"
              defaultValue={courseId}
              onChange={(e) => {
                window.location.href = `?course=${e.target.value}`;
              }}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </form>
        )}
      </div>

      <MasteryTracker
        units={unitsWithConcepts}
        enrollmentId={enrollmentId}
        studentName={studentProfile?.full_name || "Student"}
        updateAction={updateMasteryAction}
      />
    </div>
  );
}
