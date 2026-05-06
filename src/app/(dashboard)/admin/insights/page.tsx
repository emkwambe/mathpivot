import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@/components/ui";
import { getAtRiskStudents } from "@/app/actions/student-insights";

export default async function AdminInsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users_profile")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    redirect("/admin");
  }

  const atRiskStudents = await getAtRiskStudents();

  const { count: totalEnrollments } = await supabase
    .from("program_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  const atRiskPct =
    totalEnrollments && totalEnrollments > 0
      ? Math.round((atRiskStudents.length / totalEnrollments) * 100)
      : 0;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Student Insights</h1>
        <p className="text-slate-600">
          Risk scoring and retention intelligence
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {totalEnrollments || 0}
            </p>
            <p className="text-xs text-slate-500">Active Enrollments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p
              className={`text-2xl font-bold ${atRiskStudents.length > 0 ? "text-red-600" : "text-emerald-600"}`}
            >
              {atRiskStudents.length}
            </p>
            <p className="text-xs text-slate-500">At Risk</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold text-slate-900">{atRiskPct}%</p>
            <p className="text-xs text-slate-500">Risk Rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            At-Risk Students (score 25+)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {atRiskStudents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-emerald-600 font-medium">
                No at-risk students detected
              </p>
              <p className="text-xs text-slate-400 mt-1">
                All enrolled students are on track
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {atRiskStudents.map((student) => (
                <div
                  key={student.enrollmentId}
                  className="border border-slate-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {student.studentName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Coach: {student.coachName} &middot;{" "}
                        {student.programName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          student.riskScore >= 60
                            ? "text-red-600"
                            : student.riskScore >= 40
                              ? "text-amber-600"
                              : "text-yellow-600"
                        }`}
                      >
                        {student.riskScore}
                      </p>
                      <p className="text-xs text-slate-400">risk score</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {student.riskFactors.map((factor, i) => (
                      <span
                        key={i}
                        className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded"
                      >
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
