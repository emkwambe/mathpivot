import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getMyEarnings } from "@/app/actions/payroll";

interface PayoutPeriod {
  period_start: string;
  period_end: string;
}

interface PayoutRow {
  id: string;
  status: string;
  total_amount_cents: number;
  sessions_count: number;
  total_hours: number;
  period: PayoutPeriod | null;
}

interface RateRow {
  id: string;
  label: string;
  is_default: boolean;
  rate_cents: number;
  rate_type: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending_approval: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
};

export default async function TutorEarningsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { payouts, rates, error } = await getMyEarnings();

  const totalEarned = payouts
    .filter((p: PayoutRow) => p.status === "paid")
    .reduce((s: number, p: PayoutRow) => s + p.total_amount_cents, 0);
  const totalPending = payouts
    .filter((p: PayoutRow) => p.status !== "paid" && p.status !== "rejected")
    .reduce((s: number, p: PayoutRow) => s + p.total_amount_cents, 0);
  const totalSessions = payouts.reduce(
    (s: number, p: PayoutRow) => s + p.sessions_count,
    0,
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Earnings</h1>
        <p className="text-sm text-slate-500">
          Track your payouts and pay rates
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Total Earned
          </p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ${(totalEarned / 100).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Pending
          </p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            ${(totalPending / 100).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Total Sessions
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {totalSessions}
          </p>
        </div>
      </div>

      {/* Pay Rates */}
      {rates.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <h2 className="font-semibold text-slate-900 mb-3">Your Pay Rates</h2>
          <div className="space-y-2">
            {rates.map((r: RateRow) => (
              <div
                key={r.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 font-medium">{r.label}</span>
                  {r.is_default && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                      default
                    </span>
                  )}
                </div>
                <span className="text-slate-700">
                  ${(r.rate_cents / 100).toFixed(2)} /{" "}
                  {r.rate_type.replace("per_", "")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payout History */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Payout History</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Period
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Sessions
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Hours
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Amount
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payouts.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-slate-400"
                >
                  No payouts yet. Earnings will appear here after your sessions
                  are processed.
                </td>
              </tr>
            )}
            {payouts.map((p: PayoutRow) => (
              <tr key={p.id}>
                <td className="px-4 py-3 text-slate-900">
                  {p.period ? (
                    <>
                      {new Date(p.period.period_start).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" },
                      )}
                      {" - "}
                      {new Date(p.period.period_end).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" },
                      )}
                    </>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700">{p.sessions_count}</td>
                <td className="px-4 py-3 text-slate-700">
                  {Number(p.total_hours).toFixed(1)}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  ${(p.total_amount_cents / 100).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status] || "bg-slate-100"}`}
                  >
                    {p.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
