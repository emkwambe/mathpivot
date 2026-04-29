import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

export default async function CoachPerformancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: enrollments } = await supabase
    .from("program_enrollments")
    .select("id, student_id, program_id, enrolled_at, status")
    .eq("coach_id", user.id);

  const activeEnrollments = (enrollments || []).filter(
    (e) => e.status === "active",
  );
  const totalEnrolled = activeEnrollments.length;

  const studentIds = activeEnrollments.map((e) => e.student_id);

  const { data: mastery } =
    studentIds.length > 0
      ? await supabase
          .from("student_concept_mastery")
          .select("student_id, mastery_level, assessed_at")
          .in("student_id", studentIds)
          .eq("assessed_by", user.id)
      : { data: [] };

  const totalAssessments = (mastery || []).length;
  const masteredCount = (mastery || []).filter(
    (m) => m.mastery_level === "mastered" || m.mastery_level === "proficient",
  ).length;
  const masteryRate =
    totalAssessments > 0
      ? Math.round((masteredCount / totalAssessments) * 100)
      : 0;

  const now = new Date();
  const oneWeekAgo = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const weekAssessments = (mastery || []).filter(
    (m) => m.assessed_at && m.assessed_at >= oneWeekAgo,
  ).length;

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, status, booking:bookings!inner(tutor_user_id)")
    .eq("booking.tutor_user_id", user.id);

  const completedSessions = (sessions || []).filter(
    (s) => s.status === "completed",
  ).length;
  const totalSessions = (sessions || []).length;
  const completionRate =
    totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0;

  const programIds = [...new Set(activeEnrollments.map((e) => e.program_id))];
  const { data: programs } =
    programIds.length > 0
      ? await supabase
          .from("coaching_programs")
          .select("id, monthly_price_cents")
          .in("id", programIds)
      : { data: [] };

  const programPriceMap = new Map(
    (programs || []).map((p) => [p.id, p.monthly_price_cents]),
  );

  const coachShare = 0.6;
  const estimatedMonthlyRevenue = activeEnrollments.reduce((sum, e) => {
    const price = programPriceMap.get(e.program_id) || 0;
    return sum + price * coachShare;
  }, 0);

  const metrics = [
    {
      label: "Active Students",
      value: totalEnrolled.toString(),
      sublabel: "in your portfolio",
      color: "text-blue-600",
    },
    {
      label: "Mastery Rate",
      value: `${masteryRate}%`,
      sublabel: `${masteredCount}/${totalAssessments} proficient+`,
      color: "text-emerald-600",
    },
    {
      label: "Session Completion",
      value: `${completionRate}%`,
      sublabel: `${completedSessions}/${totalSessions} sessions`,
      color: "text-amber-600",
    },
    {
      label: "Est. Monthly Earnings",
      value: `$${(estimatedMonthlyRevenue / 100).toFixed(0)}`,
      sublabel: "at 60% revenue share",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Performance</h1>
        <p className="text-slate-600">
          Track your coaching impact and earnings
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="pt-6 text-center">
              <p className={`text-3xl font-bold ${metric.color}`}>
                {metric.value}
              </p>
              <p className="text-sm font-medium text-slate-900 mt-1">
                {metric.label}
              </p>
              <p className="text-xs text-slate-400">{metric.sublabel}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  Concepts assessed
                </span>
                <span className="font-semibold text-slate-900">
                  {weekAssessments}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Active students</span>
                <span className="font-semibold text-slate-900">
                  {totalEnrolled}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  Avg concepts/student
                </span>
                <span className="font-semibold text-slate-900">
                  {totalEnrolled > 0
                    ? (weekAssessments / totalEnrolled).toFixed(1)
                    : "0"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quality Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Mastery delivery</span>
                  <span className="font-semibold text-slate-900">
                    {masteryRate}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${masteryRate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Session completion</span>
                  <span className="font-semibold text-slate-900">
                    {completionRate}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Portfolio capacity</span>
                  <span className="font-semibold text-slate-900">
                    {totalEnrolled}/15
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{
                      width: `${Math.min((totalEnrolled / 15) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
