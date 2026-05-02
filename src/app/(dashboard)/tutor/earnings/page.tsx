import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  disputed: "bg-red-100 text-red-700",
};

export default async function CoachEarningsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: earnings } = await supabase
    .from("coach_earnings")
    .select("*")
    .eq("coach_id", user.id)
    .order("period_start", { ascending: false })
    .limit(12);

  const { data: activeEnrollments } = await supabase
    .from("program_enrollments")
    .select("id, program_id")
    .eq("coach_id", user.id)
    .eq("status", "active");

  const programIds = [
    ...new Set((activeEnrollments || []).map((e) => e.program_id)),
  ];
  const { data: programs } =
    programIds.length > 0
      ? await supabase
          .from("coaching_programs")
          .select("id, monthly_price_cents")
          .in("id", programIds)
      : { data: [] };

  const priceMap = new Map(
    (programs || []).map((p) => [p.id, p.monthly_price_cents]),
  );

  const coachShare = 0.6;
  const currentMonthlyRevenue = (activeEnrollments || []).reduce((sum, e) => {
    return sum + (priceMap.get(e.program_id) || 0);
  }, 0);
  const currentMonthlyEarnings = Math.round(currentMonthlyRevenue * coachShare);

  const totalPaid = (earnings || [])
    .filter((e) => e.status === "paid")
    .reduce((sum, e) => sum + e.coach_earnings_cents, 0);

  const totalPending = (earnings || [])
    .filter((e) => e.status === "pending" || e.status === "approved")
    .reduce((sum, e) => sum + e.coach_earnings_cents, 0);

  const activeStudents = (activeEnrollments || []).length;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Earnings</h1>
        <p className="text-slate-600">
          Revenue share from your coaching portfolio
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              ${(currentMonthlyEarnings / 100).toFixed(0)}
            </p>
            <p className="text-xs text-slate-500">Est. This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold text-green-600">
              ${(totalPaid / 100).toFixed(0)}
            </p>
            <p className="text-xs text-slate-500">Total Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold text-amber-600">
              ${(totalPending / 100).toFixed(0)}
            </p>
            <p className="text-xs text-slate-500">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold text-blue-600">{activeStudents}</p>
            <p className="text-xs text-slate-500">Active Students</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">How Your Earnings Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="font-medium text-slate-900">Revenue Share</p>
              <p className="text-slate-600 mt-1">
                You earn <strong>60%</strong> of each enrolled student&apos;s
                monthly program fee.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="font-medium text-slate-900">Monthly Cycle</p>
              <p className="text-slate-600 mt-1">
                Earnings are calculated at month-end, reviewed by admin, then
                paid out.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="font-medium text-slate-900">Growth Path</p>
              <p className="text-slate-600 mt-1">
                15 students x $399/mo avg = <strong>$3,593/mo</strong> at 60%
                share.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Earnings History</CardTitle>
        </CardHeader>
        <CardContent>
          {earnings && earnings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="text-left py-2 pr-4 font-medium text-slate-600">
                      Period
                    </th>
                    <th className="text-left py-2 pr-4 font-medium text-slate-600">
                      Students
                    </th>
                    <th className="text-left py-2 pr-4 font-medium text-slate-600">
                      Sessions
                    </th>
                    <th className="text-left py-2 pr-4 font-medium text-slate-600">
                      Revenue
                    </th>
                    <th className="text-left py-2 pr-4 font-medium text-slate-600">
                      Your Share
                    </th>
                    <th className="text-left py-2 font-medium text-slate-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {earnings.map((e) => (
                    <tr key={e.id}>
                      <td className="py-3 pr-4 text-slate-900">
                        {formatDate(e.period_start, "MMM yyyy")}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {e.active_students}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {e.sessions_delivered}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        ${(e.total_revenue_cents / 100).toFixed(0)}
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        ${(e.coach_earnings_cents / 100).toFixed(0)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[e.status] || "bg-slate-100"}`}
                        >
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">
              No earnings recorded yet. Earnings will appear after your first
              month with enrolled students.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
