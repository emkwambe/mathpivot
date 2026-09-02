import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui";
import OnboardingChecklist from "./OnboardingChecklist";

const ONBOARDING_STEPS = [
  {
    key: "rapport_building",
    title: "Rapport Building",
    description:
      "Introductory conversation with the student. Learn their interests, comfort level, and math confidence.",
  },
  {
    key: "diagnostic_assessment",
    title: "Diagnostic Assessment",
    description:
      "Run baseline assessment to identify strengths and gaps. Record initial mastery levels for key concepts.",
  },
  {
    key: "parent_goal_alignment",
    title: "Parent Goal Alignment",
    description:
      "Review parent-submitted goals and discuss expectations. Confirm session cadence and communication preferences.",
  },
  {
    key: "learning_plan_created",
    title: "Learning Plan Created",
    description:
      "Build a personalized learning plan based on diagnostic results and parent goals. Map first 4-6 weeks of concepts.",
  },
  {
    key: "communication_rhythm_set",
    title: "Communication Rhythm Set",
    description:
      "Agree on update frequency with the family. Set up weekly progress report expectations.",
  },
  {
    key: "first_mastery_update",
    title: "First Mastery Update",
    description:
      "Complete the first formal mastery update after the diagnostic session. At least 3 concepts should be assessed.",
  },
];

export default async function OnboardingPage({
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
    .select(
      "id, student_id, program_id, status, onboarding_status, enrolled_at",
    )
    .eq("id", enrollmentId)
    .eq("coach_id", user.id)
    .single();

  if (!enrollment) redirect("/tutor/portfolio");

  const [
    { data: studentProfile },
    { data: program },
    { data: completedSteps },
    { data: academicProfile },
  ] = await Promise.all([
    supabase
      .from("users_profile")
      .select("full_name")
      .eq("id", enrollment.student_id)
      .single(),
    supabase
      .from("coaching_programs")
      .select("name, track_level")
      .eq("id", enrollment.program_id)
      .single(),
    supabase
      .from("onboarding_steps")
      .select("step_key, completed_at, notes")
      .eq("enrollment_id", enrollmentId),
    supabase
      .from("student_academic_profiles")
      .select("*")
      .eq("student_id", enrollment.student_id)
      .single(),
  ]);

  const completedMap = new Map(
    (completedSteps || []).map((s) => [s.step_key, s]),
  );

  const steps = ONBOARDING_STEPS.map((step) => {
    const completed = completedMap.get(step.key);
    return {
      ...step,
      completedAt: completed?.completed_at || null,
      notes: completed?.notes || null,
    };
  });

  const completedCount = steps.filter((s) => s.completedAt).length;
  const isComplete = completedCount === steps.length;

  const trackColors: Record<string, string> = {
    foundation: "bg-blue-100 text-blue-800",
    acceleration: "bg-amber-100 text-amber-800",
    elite: "bg-purple-100 text-purple-800",
    advanced: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
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

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-slate-900">
            Onboarding: {studentProfile?.full_name || "Student"}
          </h1>
          {program && (
            <Badge
              className={trackColors[program.track_level] || "bg-slate-100"}
            >
              {program.name}
            </Badge>
          )}
        </div>
        <p className="text-slate-600 text-sm">
          Complete all 6 steps before starting regular sessions.
        </p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isComplete ? "bg-green-500" : "bg-blue-500"
            }`}
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-slate-700">
          {completedCount}/{steps.length}
        </span>
        {isComplete && (
          <Badge className="bg-green-100 text-green-800">Complete</Badge>
        )}
      </div>

      {academicProfile && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Student Context
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {academicProfile.grade_level && (
              <div>
                <span className="text-slate-400">Grade</span>
                <p className="font-medium text-slate-900">
                  {academicProfile.grade_level}
                </p>
              </div>
            )}
            {academicProfile.current_math_course && (
              <div>
                <span className="text-slate-400">Course</span>
                <p className="font-medium text-slate-900">
                  {academicProfile.current_math_course}
                </p>
              </div>
            )}
            {academicProfile.current_math_grade && (
              <div>
                <span className="text-slate-400">Current Grade</span>
                <p className="font-medium text-slate-900">
                  {academicProfile.current_math_grade}
                </p>
              </div>
            )}
            {academicProfile.school_name && (
              <div>
                <span className="text-slate-400">School</span>
                <p className="font-medium text-slate-900">
                  {academicProfile.school_name}
                </p>
              </div>
            )}
            {academicProfile.learning_goal_parent && (
              <div className="col-span-2 sm:col-span-3">
                <span className="text-slate-400">Parent&apos;s Goal</span>
                <p className="font-medium text-slate-900">
                  {academicProfile.learning_goal_parent}
                </p>
              </div>
            )}
            {academicProfile.accommodations && (
              <div className="col-span-2 sm:col-span-3">
                <span className="text-slate-400">Accommodations</span>
                <p className="font-medium text-slate-900">
                  {academicProfile.accommodations}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <OnboardingChecklist steps={steps} enrollmentId={enrollmentId} />

      {isComplete && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-green-800 font-medium">
            Onboarding complete! You can now start regular coaching sessions.
          </p>
          <Link
            href={`/tutor/portfolio/${enrollmentId}/mastery`}
            className="inline-block mt-3 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Mastery Tracking
          </Link>
        </div>
      )}
    </div>
  );
}
