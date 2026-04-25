import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole, canAccessStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@/components/ui";
import { StudentProgressVisualization } from "@/components/StudentProgressVisualization";
import { formatDate, snakeToTitle } from "@/lib/utils";

// Eligibility tier display helpers
const tierInfo: Record<
  string,
  { name: string; color: string; guideLevel: string }
> = {
  TIER_1_EXPLORER: {
    name: "Explorer",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    guideLevel: "Guide I",
  },
  TIER_2_DEVELOPER: {
    name: "Developer",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    guideLevel: "Guide II",
  },
  TIER_3_ACCELERATOR: {
    name: "Accelerator",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    guideLevel: "Guide III",
  },
  NOT_ELIGIBLE: {
    name: "Developing",
    color: "bg-slate-100 text-slate-800 border-slate-200",
    guideLevel: "Guide I",
  },
};

function getTierFromScore(score: number): string {
  if (score >= 23) return "TIER_3_ACCELERATOR";
  if (score >= 20) return "TIER_2_DEVELOPER";
  if (score >= 16) return "TIER_1_EXPLORER";
  return "NOT_ELIGIBLE";
}

interface PageProps {
  params: Promise<{ studentId: string }>;
}

export default async function StudentProfilePage({ params }: PageProps) {
  const { studentId } = await params;
  const user = await requireRole(["parent", "student", "admin"]);

  // Check access
  const hasAccess = await canAccessStudent(studentId);
  if (!hasAccess) {
    notFound();
  }

  const supabase = await createClient();

  // Get student profile
  const { data: student } = await supabase
    .from("students_profile")
    .select("*")
    .eq("user_id", studentId)
    .single();

  if (!student) {
    notFound();
  }

  // Fetch student name separately (avoids RLS join issues)
  const { data: studentUserProfile } = await supabase
    .from("users_profile")
    .select("full_name, email, avatar_url")
    .eq("id", studentId)
    .single();

  // Get diagnostics
  const { data: diagnostics } = await supabase
    .from("diagnostics")
    .select(
      `
      id,
      administered_at,
      course_track,
      score,
      max_score,
      notes
    `,
    )
    .eq("student_user_id", studentId)
    .order("administered_at", { ascending: false });

  // Get mastery data
  const { data: masteryData } = await supabase
    .from("student_skill_mastery")
    .select(
      `
      id,
      mastery_level,
      last_practiced_at,
      skills!inner (
        code,
        name,
        category,
        course_track
      )
    `,
    )
    .eq("student_user_id", studentId)
    .order("mastery_level", { ascending: false });

  // Get recent sessions
  const { data: recentSessions } = await supabase
    .from("sessions")
    .select(
      `
      id,
      status,
      completed_at,
      parent_summary,
      bookings (
        student_user_id,
        start_at,
        tutor_user_id
      )
    `,
    )
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(5);

  const studentSessions =
    recentSessions?.filter(
      (s) =>
        (s.bookings as unknown as { student_user_id: string })
          ?.student_user_id === studentId,
    ) || [];

  // Fetch tutor names for sessions separately (avoids RLS join issues)
  const sessionTutorIds = [
    ...new Set(
      studentSessions
        .map(
          (s) =>
            (s.bookings as unknown as { tutor_user_id: string })?.tutor_user_id,
        )
        .filter(Boolean),
    ),
  ];
  const { data: tutorProfiles } =
    sessionTutorIds.length > 0
      ? await supabase
          .from("users_profile")
          .select("id, full_name")
          .in("id", sessionTutorIds)
      : { data: [] };

  const tutorNameMap = new Map(
    (tutorProfiles || []).map((t) => [t.id, t.full_name]),
  );

  // Get eligibility profile
  const { data: eligibility } = await supabase
    .from("student_eligibility_profiles")
    .select("*")
    .eq("student_id", studentId)
    .single();

  // Get pathway recommendations
  const { data: pathwayRecs } = await supabase
    .from("student_pathway_recommendations")
    .select(
      `
      id,
      recommended_guide_level,
      confidence_score,
      reason_codes,
      estimated_completion_months,
      career_pathways!inner(
        name,
        code,
        color,
        description
      )
    `,
    )
    .eq("student_id", studentId)
    .order("confidence_score", { ascending: false })
    .limit(3);

  const profile = studentUserProfile || {
    full_name: "Student",
    email: "",
    avatar_url: null,
  };

  // Calculate tier from eligibility score
  const studentTier = eligibility
    ? getTierFromScore(eligibility.total_score)
    : null;
  const currentTierInfo = studentTier ? tierInfo[studentTier] : null;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/parent"
        className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
      >
        <svg
          className="w-4 h-4 mr-1"
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
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white text-2xl font-bold">
              {profile.full_name.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {profile.full_name}
            </h1>
            <p className="text-slate-600">
              Grade {student.grade} • {snakeToTitle(student.course_track)}
            </p>
          </div>
        </div>
        <Link
          href="/parent/book"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          Book Session
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Goals & Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Goals & Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-1">
                  Learning Goals
                </h4>
                <p className="text-sm text-slate-600">
                  {student.goals || "No goals set yet."}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-1">
                  Coach Notes
                </h4>
                <p className="text-sm text-slate-600">
                  {student.notes || "No notes yet."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diagnostics */}
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            {diagnostics && diagnostics.length > 0 ? (
              <div className="space-y-3">
                {diagnostics.map((diag) => (
                  <div key={diag.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-slate-900">
                        {snakeToTitle(diag.course_track)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatDate(diag.administered_at)}
                      </p>
                    </div>
                    {diag.score !== null && diag.max_score !== null && (
                      <p className="text-sm text-slate-600">
                        Score: {diag.score}/{diag.max_score} (
                        {Math.round((diag.score / diag.max_score) * 100)}%)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">
                No diagnostic assessments yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Eligibility & Pathways */}
      {eligibility && (
        <Card
          className={`border-2 ${currentTierInfo?.color.split(" ")[2] || "border-slate-200"}`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
              Eligibility Tier & Pathway
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Tier */}
              <div>
                <p className="text-sm text-slate-600 mb-2">Current Tier</p>
                <div className="flex items-center gap-3">
                  <Badge
                    className={`text-lg px-4 py-2 ${currentTierInfo?.color || "bg-slate-100"}`}
                  >
                    {currentTierInfo?.name || "Not Assessed"}
                  </Badge>
                  <div className="text-sm text-slate-600">
                    <p>
                      Score:{" "}
                      <span className="font-medium">
                        {eligibility.total_score}/25
                      </span>
                    </p>
                    <p>
                      Recommended:{" "}
                      <span className="font-medium">
                        {currentTierInfo?.guideLevel}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Assessment Breakdown */}
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {[
                    {
                      label: "Academic",
                      value: eligibility.academic_performance,
                    },
                    { label: "Passion", value: eligibility.math_passion },
                    {
                      label: "Achievement",
                      value: eligibility.achievement_level,
                    },
                    { label: "Direction", value: eligibility.career_direction },
                    {
                      label: "Qualities",
                      value: eligibility.personal_qualities,
                    },
                  ].map((factor) => (
                    <div key={factor.label} className="text-center">
                      <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center">
                        <span className="font-bold text-slate-700">
                          {factor.value || "-"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {factor.label}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-slate-500 mt-4">
                  Last assessed: {formatDate(eligibility.assessment_date)}
                  {eligibility.next_assessment_date && (
                    <> • Next: {formatDate(eligibility.next_assessment_date)}</>
                  )}
                </p>
              </div>

              {/* Pathway Recommendations */}
              <div>
                <p className="text-sm text-slate-600 mb-2">
                  Recommended Pathways
                </p>
                {pathwayRecs && pathwayRecs.length > 0 ? (
                  <div className="space-y-3">
                    {pathwayRecs.map((rec) => {
                      const pathway = rec.career_pathways as unknown as {
                        name: string;
                        code: string;
                        color: string;
                        description: string;
                      };
                      return (
                        <div
                          key={rec.id}
                          className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                          style={{
                            borderLeftColor: pathway.color,
                            borderLeftWidth: "4px",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-900">
                              {pathway.name}
                            </p>
                            {rec.confidence_score && (
                              <span className="text-xs text-slate-500">
                                {Math.round(rec.confidence_score * 100)}% match
                              </span>
                            )}
                          </div>
                          {rec.estimated_completion_months && (
                            <p className="text-xs text-slate-500 mt-1">
                              Est. {rec.estimated_completion_months} months
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    No pathway recommendations yet
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Visualization */}
      <StudentProgressVisualization
        masteryData={(masteryData || []).map((m) => ({
          ...m,
          skills: m.skills as unknown as {
            code: string;
            name: string;
            category: string | null;
            course_track:
              | "math_1"
              | "math_2"
              | "math_3"
              | "pre_calc"
              | "ap_calc_ab"
              | "ap_calc_bc"
              | "ap_stats";
          },
        }))}
        diagnostics={(diagnostics || []).map((d) => ({
          id: d.id,
          administered_at: d.administered_at,
          course_track: d.course_track as
            | "math_1"
            | "math_2"
            | "math_3"
            | "pre_calc"
            | "ap_calc_ab"
            | "ap_calc_bc"
            | "ap_stats",
          score: d.score,
          max_score: d.max_score,
        }))}
        studentName={profile.full_name}
      />

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {studentSessions.length > 0 ? (
            <div className="space-y-4">
              {studentSessions.map((session) => {
                const booking = session.bookings as unknown as {
                  start_at: string;
                  tutor_user_id: string;
                };
                const tutorName =
                  tutorNameMap.get(booking.tutor_user_id) || "Coach";
                return (
                  <div
                    key={session.id}
                    className="p-4 border border-slate-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-slate-900">
                        with {tutorName}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatDate(booking.start_at)}
                      </p>
                    </div>
                    {session.parent_summary && (
                      <p className="text-sm text-slate-600">
                        {session.parent_summary}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-7 h-7 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-slate-500">No completed sessions yet</p>
              <Link
                href="/parent/book"
                className="text-sm text-blue-600 hover:underline font-medium mt-2 inline-block"
              >
                Book a session
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
