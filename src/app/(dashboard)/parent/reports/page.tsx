import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ParentReportsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get family
  const { data: familyMember } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .single();

  if (!familyMember) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <h2 className="text-lg font-semibold text-yellow-800">
            No Family Associated
          </h2>
          <p className="text-yellow-600 mt-2">
            Please contact support to set up your family account.
          </p>
        </div>
      </div>
    );
  }

  // Get students in this family
  const { data: students } = await supabase
    .from("family_members")
    .select(
      `
      user_id,
      users_profile:user_id (
        full_name
      )
    `,
    )
    .eq("family_id", familyMember.family_id)
    .eq("member_role", "student");

  const studentIds = students?.map((s) => s.user_id) || [];

  // Get weekly reports for these students
  const { data: reports } = await supabase
    .from("weekly_reports")
    .select("*")
    .in(
      "student_user_id",
      studentIds.length > 0
        ? studentIds
        : ["00000000-0000-0000-0000-000000000000"],
    )
    .order("week_start", { ascending: false })
    .limit(20);

  // Create student name map
  const studentNameMap = new Map(
    students?.map((s) => {
      const profile = Array.isArray(s.users_profile)
        ? (s.users_profile[0] as { full_name: string } | undefined)
        : (s.users_profile as { full_name: string } | null);
      return [s.user_id, profile?.full_name || "Unknown"];
    }) || [],
  );

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Weekly Reports</h1>
        <p className="text-slate-600">
          Progress updates from your students&apos; tutors
        </p>
      </div>

      {!reports || reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            No Reports Yet
          </h3>
          <p className="text-slate-500">
            Weekly reports will appear here after coaching sessions are
            completed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className={`bg-white rounded-xl border p-5 ${
                report.is_at_risk ? "border-red-300" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">
                      {studentNameMap.get(report.student_user_id) || "Student"}
                    </h3>
                    {report.is_at_risk && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                        Needs Attention
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    {formatDateRange(report.week_start, report.week_end)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">
                    {report.sessions_count}
                  </p>
                  <p className="text-xs text-slate-500">sessions</p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-slate-50 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-900">
                    {report.attendance_rate
                      ? `${Math.round(report.attendance_rate * 100)}%`
                      : "N/A"}
                  </p>
                  <p className="text-xs text-slate-500">Attendance</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-900">
                    {report.skills_practiced?.length || 0}
                  </p>
                  <p className="text-xs text-slate-500">Skills Practiced</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-900">
                    {Array.isArray(report.mastery_changes)
                      ? report.mastery_changes.length
                      : 0}
                  </p>
                  <p className="text-xs text-slate-500">Mastery Updates</p>
                </div>
              </div>

              {/* Summary */}
              {report.summary_text && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Summary
                  </p>
                  <p className="text-sm text-slate-600">
                    {report.summary_text}
                  </p>
                </div>
              )}

              {/* Recommendations */}
              {report.recommendations && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Recommendations
                  </p>
                  <p className="text-sm text-slate-600">
                    {report.recommendations}
                  </p>
                </div>
              )}

              {/* At Risk Reasons */}
              {report.is_at_risk &&
                report.at_risk_reasons &&
                report.at_risk_reasons.length > 0 && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm font-medium text-red-800 mb-1">
                      Areas of Concern
                    </p>
                    <ul className="list-disc list-inside text-sm text-red-700">
                      {report.at_risk_reasons.map(
                        (reason: string, i: number) => (
                          <li key={i}>{reason}</li>
                        ),
                      )}
                    </ul>
                  </div>
                )}

              {/* Skills Practiced */}
              {report.skills_practiced &&
                report.skills_practiced.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {report.skills_practiced
                      .slice(0, 5)
                      .map((skill: string, i: number) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    {report.skills_practiced.length > 5 && (
                      <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                        +{report.skills_practiced.length - 5} more
                      </span>
                    )}
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
