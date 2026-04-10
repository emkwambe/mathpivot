import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLeadAnalytics } from "@/app/actions/leads";
import type { LeadSourceStat } from "@/types/views";

const sourceLabels: Record<string, string> = {
  website: "Website",
  referral: "Referral",
  social_media: "Social Media",
  google_ads: "Google Ads",
  facebook_ads: "Facebook Ads",
  walk_in: "Walk-In",
  phone: "Phone",
  email: "Email",
  partner: "Partner",
  event: "Event",
  other: "Other",
};

const funnelColors: Record<string, string> = {
  new: "bg-slate-400",
  contacted: "bg-blue-400",
  qualified: "bg-indigo-400",
  trial_scheduled: "bg-purple-400",
  trial_completed: "bg-amber-400",
  converted: "bg-green-500",
  lost: "bg-red-400",
};

export default async function LeadAnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { stats, funnelData, error } = await getLeadAnalytics();

  const totalLeads = funnelData.reduce((s, f) => s + f.count, 0);
  const totalConverted =
    funnelData.find((f) => f.status === "converted")?.count || 0;
  const overallRate =
    totalLeads > 0 ? ((totalConverted / totalLeads) * 100).toFixed(1) : "0";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lead Analytics</h1>
          <p className="text-sm text-slate-500">
            Conversion tracking and source performance
          </p>
        </div>
        <Link
          href="/admin/leads"
          className="border border-slate-300 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Back to Pipeline
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Total Leads
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalLeads}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Converted
          </p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {totalConverted}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Conversion Rate
          </p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {overallRate}%
          </p>
        </div>
      </div>

      {/* Funnel */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="font-semibold text-slate-900 mb-4">Pipeline Funnel</h2>
        {totalLeads === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">
            No leads yet. Share your get-started page to start capturing leads.
          </p>
        ) : (
          <div className="space-y-3">
            {funnelData.map((stage) => {
              const pct = totalLeads > 0 ? (stage.count / totalLeads) * 100 : 0;
              return (
                <div key={stage.status} className="flex items-center gap-3">
                  <span className="w-32 text-sm text-slate-600 capitalize text-right">
                    {stage.status.replace("_", " ")}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-7 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${funnelColors[stage.status] || "bg-slate-300"} flex items-center pl-2 transition-all`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    >
                      {pct >= 10 && (
                        <span className="text-white text-xs font-medium">
                          {stage.count}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="w-12 text-sm text-slate-500 text-right">
                    {stage.count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Source Performance */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Source Performance</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Source
              </th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">
                Total
              </th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">
                Qualified
              </th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">
                Trials
              </th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">
                Converted
              </th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">
                Conv. Rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stats.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-slate-400"
                >
                  No data yet
                </td>
              </tr>
            )}
            {stats.map((row: LeadSourceStat) => (
              <tr key={row.source}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {sourceLabels[row.source] || row.source}
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {row.total}
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {row.qualified}
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {row.trials}
                </td>
                <td className="px-4 py-3 text-right font-medium text-green-600">
                  {row.converted}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      parseFloat(row.conversionRate) >= 20
                        ? "bg-green-100 text-green-700"
                        : parseFloat(row.conversionRate) >= 10
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {row.conversionRate}%
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
