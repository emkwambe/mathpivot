import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // BATCH 1: All independent queries in parallel
  const [
    studentsResult,
    tutorsResult,
    sessionsResult,
    noShowsResult,
    purchasesResult,
    upcomingResult,
    atRiskResult,
  ] = await Promise.all([
    supabase
      .from("students_profile")
      .select("user_id", { count: "exact", head: true }),
    supabase
      .from("tutors_profile")
      .select("user_id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekStart)
      .lte("created_at", weekEnd),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "no_show")
      .gte("start_at", weekStart)
      .lte("start_at", weekEnd),
    supabase
      .from("purchases")
      .select("amount_cents")
      .eq("status", "completed")
      .gte("paid_at", monthStart)
      .lte("paid_at", monthEnd),
    supabase
      .from("bookings")
      .select("id, start_at, status, student_user_id, tutor_user_id")
      .in("status", ["confirmed", "pending"])
      .gte("start_at", todayStart.toISOString())
      .lte("start_at", todayEnd.toISOString())
      .order("start_at", { ascending: true })
      .limit(10),
    supabase
      .from("weekly_reports")
      .select("id, student_user_id, at_risk_reasons, week_end")
      .eq("is_at_risk", true)
      .order("week_end", { ascending: false })
      .limit(5),
  ]);

  const monthlyRevenue =
    purchasesResult.data?.reduce((sum, p) => sum + p.amount_cents, 0) || 0;

  // BATCH 2: Dependent queries (need IDs from batch 1) — in parallel
  const userIds = [
    ...(upcomingResult.data?.map((s) => s.student_user_id) || []),
    ...(upcomingResult.data?.map((s) => s.tutor_user_id) || []),
    ...(atRiskResult.data?.map((r) => r.student_user_id) || []),
  ];

  const { data: allProfiles } =
    userIds.length > 0
      ? await supabase
          .from("users_profile")
          .select("id, full_name")
          .in("id", [...new Set(userIds)])
      : { data: [] };

  const nameMap = new Map(allProfiles?.map((u) => [u.id, u.full_name]) || []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-purple-100 mt-1">
              Platform overview and operations
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/skills"
              className="inline-flex items-center justify-center px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors"
            >
              Skills
            </Link>
            <Link
              href="/admin/reports"
              className="inline-flex items-center justify-center px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 font-medium shadow-sm"
            >
              Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Active Students</p>
            <p className="text-3xl font-bold text-slate-900">
              {studentsResult.count || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Active Coaches</p>
            <p className="text-3xl font-bold text-slate-900">
              {tutorsResult.count || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Sessions This Week</p>
            <p className="text-3xl font-bold text-slate-900">
              {sessionsResult.count || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Revenue This Month</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(monthlyRevenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingResult.data && upcomingResult.data.length > 0 ? (
              <div className="space-y-3">
                {upcomingResult.data.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {nameMap.get(session.student_user_id) || "Student"}
                      </p>
                      <p className="text-sm text-slate-500">
                        with {nameMap.get(session.tutor_user_id) || "Coach"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">
                        {formatDate(session.start_at, "h:mm a")}
                      </p>
                      <Badge
                        variant={
                          session.status === "confirmed" ? "success" : "warning"
                        }
                      >
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-500">
                  No sessions scheduled for today
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* At-Risk Students */}
        <Card>
          <CardHeader>
            <CardTitle>At-Risk Students</CardTitle>
          </CardHeader>
          <CardContent>
            {atRiskResult.data && atRiskResult.data.length > 0 ? (
              <div className="space-y-3">
                {atRiskResult.data.map((report) => (
                  <div
                    key={report.id}
                    className="p-3 border-l-4 border-red-500 bg-red-50 rounded-r-lg"
                  >
                    <p className="font-medium text-slate-900">
                      {nameMap.get(report.student_user_id) || "Student"}
                    </p>
                    <div className="mt-1">
                      {((report.at_risk_reasons as string[]) || [])
                        .slice(0, 2)
                        .map((reason, i) => (
                          <p key={i} className="text-sm text-red-700">
                            {reason}
                          </p>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-500">No at-risk students</p>
                <p className="text-sm text-slate-400 mt-1">
                  All students are making progress
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(noShowsResult.count || 0) > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <p className="font-medium text-amber-900">
                No-Shows This Week: {noShowsResult.count}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
