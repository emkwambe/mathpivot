import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui";
import {
  getSurveyTemplates,
  getRecentSurveyResponses,
} from "@/app/actions/surveys";
import SurveyRunner from "./SurveyRunner";

export default async function SurveysPage({
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
    .select("id, student_id, program_id")
    .eq("id", enrollmentId)
    .eq("coach_id", user.id)
    .single();

  if (!enrollment) redirect("/tutor/portfolio");

  const [
    { data: studentProfile },
    { data: academicProfile },
    templates,
    recentResponses,
  ] = await Promise.all([
    supabase
      .from("users_profile")
      .select("full_name")
      .eq("id", enrollment.student_id)
      .single(),
    supabase
      .from("student_academic_profiles")
      .select("school_current_topic, school_topic_updated_at")
      .eq("student_id", enrollment.student_id)
      .single(),
    getSurveyTemplates(),
    getRecentSurveyResponses(enrollmentId, 10),
  ]);

  const emojiMap: Record<string, string> = {
    low: "😴",
    okay: "😐",
    focused: "🎯",
    fired_up: "🔥",
  };

  const confidenceMap: Record<string, string> = {
    down: "↓ Down",
    same: "→ Same",
    up: "↑ Up",
    breakthrough: "⚡ Breakthrough",
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
        <h1 className="text-2xl font-bold text-slate-900">
          Check-ins: {studentProfile?.full_name || "Student"}
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Session reflections, school pulse, and career interest assessments.
        </p>
      </div>

      {academicProfile?.school_current_topic && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                Current School Topic
              </p>
              <p className="text-sm font-medium text-slate-900 mt-1">
                {academicProfile.school_current_topic}
              </p>
            </div>
            {academicProfile.school_topic_updated_at && (
              <span className="text-xs text-blue-400">
                Updated{" "}
                {new Date(
                  academicProfile.school_topic_updated_at,
                ).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}

      <SurveyRunner
        templates={templates}
        enrollmentId={enrollmentId}
        studentId={enrollment.student_id}
      />

      {recentResponses.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Recent Check-ins
          </h2>
          <div className="space-y-2">
            {recentResponses.map((response) => (
              <div
                key={response.id}
                className="bg-white border border-slate-200 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge className="bg-slate-100 text-slate-600 text-xs">
                    {response.template_title}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {new Date(response.completed_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(
                    response.answers as Record<string, string | number>,
                  ).map(([key, value]) => {
                    if (!value && value !== 0) return null;
                    const display =
                      emojiMap[String(value)] ||
                      confidenceMap[String(value)] ||
                      String(value);
                    return (
                      <span
                        key={key}
                        className="text-xs bg-slate-50 px-2 py-1 rounded"
                      >
                        <span className="text-slate-400">{key}:</span> {display}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
