import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function PendingReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get assessment attempts that need manual grading
  const { data: attempts } = await supabase
    .from("assessment_attempts")
    .select(
      "id, user_id, assessment_id, attempt_number, submitted_at, raw_score, max_possible_score, status",
    )
    .in("status", ["submitted", "grading"])
    .order("submitted_at", { ascending: true })
    .limit(50);

  // Get names separately
  const userIds = [...new Set(attempts?.map((a) => a.user_id) || [])];
  const assessmentIds = [
    ...new Set(attempts?.map((a) => a.assessment_id) || []),
  ];

  const { data: users } =
    userIds.length > 0
      ? await supabase
          .from("users_profile")
          .select("id, full_name")
          .in("id", userIds)
      : { data: [] };
  const { data: assessments } =
    assessmentIds.length > 0
      ? await supabase
          .from("certification_assessments")
          .select("id, title")
          .in("id", assessmentIds)
      : { data: [] };

  const userMap = new Map((users || []).map((u) => [u.id, u.full_name]));
  const assessmentMap = new Map(
    (assessments || []).map((a) => [a.id, a.title]),
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/certifications"
          className="text-slate-400 hover:text-slate-600"
        >
          <svg
            className="w-5 h-5"
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
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pending Reviews</h1>
          <p className="text-sm text-slate-500">
            {attempts?.length || 0} submissions awaiting review
          </p>
        </div>
      </div>

      {!attempts || attempts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-700 mb-2">
            All caught up!
          </h2>
          <p className="text-slate-500">
            No submissions need manual review right now.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt) => (
            <div
              key={attempt.id}
              className="bg-white border border-slate-200 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">
                    {userMap.get(attempt.user_id) || "Unknown Student"}
                  </p>
                  <p className="text-sm text-slate-600">
                    {assessmentMap.get(attempt.assessment_id) || "Assessment"} —
                    Attempt #{attempt.attempt_number}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Submitted{" "}
                    {attempt.submitted_at
                      ? formatDate(attempt.submitted_at, "MMM d, yyyy h:mm a")
                      : "—"}
                  </p>
                </div>
                <div className="text-right">
                  {attempt.raw_score !== null && (
                    <p className="text-lg font-bold text-slate-900">
                      {attempt.raw_score}/{attempt.max_possible_score}
                    </p>
                  )}
                  <Badge
                    variant={attempt.status === "grading" ? "warning" : "info"}
                  >
                    {attempt.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
