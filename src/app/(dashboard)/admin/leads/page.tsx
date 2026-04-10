import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLeadsByStatus } from "@/app/actions/leads";
import { LeadKanban } from "./LeadKanban";

interface LeadRow {
  next_follow_up_at: string | null;
}

export default async function AdminLeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { columns, error } = await getLeadsByStatus();

  // Summary
  const cols = columns as Record<string, LeadRow[]>;
  const allLeads = Object.values(cols).flat();
  const totalLeads = allLeads.length;
  const newLeads = cols["new"]?.length || 0;
  const followUpsToday = allLeads.filter(
    (l: LeadRow) =>
      l.next_follow_up_at &&
      new Date(l.next_follow_up_at).toDateString() ===
        new Date().toDateString(),
  ).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lead Pipeline</h1>
          <p className="text-sm text-slate-500">Manage prospective families</p>
        </div>
        <Link
          href="/admin/leads/analytics"
          className="border border-slate-300 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          View Analytics
        </Link>
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
            Total Leads
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalLeads}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            New (uncontacted)
          </p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{newLeads}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Follow-ups Today
          </p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {followUpsToday}
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <LeadKanban columns={columns} />
    </div>
  );
}
