import { redirect } from "next/navigation";
import Link from "next/link";
import { getPartnerships } from "@/app/actions/partnerships";
import { PartnershipList } from "./PartnershipList";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPartnershipsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { partnerships, error } = await getPartnerships();

  const stageCounts = new Map<string, number>();
  for (const p of partnerships)
    stageCounts.set(p.stage, (stageCounts.get(p.stage) || 0) + 1);

  const total = partnerships.length;
  const newCount = stageCounts.get("new") || 0;
  const active = stageCounts.get("active") || 0;
  const pilot = stageCounts.get("pilot") || 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Partnership Pipeline
          </h1>
          <p className="text-sm text-slate-500">
            Manage school, district, and organization partnerships
          </p>
        </div>
        <Link
          href="/partnerships"
          target="_blank"
          className="border border-slate-300 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          View Public Page ↗
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Total
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            New (uncontacted)
          </p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{newCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            In Pilot
          </p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pilot}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Active
          </p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{active}</p>
        </div>
      </div>

      <PartnershipList partnerships={partnerships} />
    </div>
  );
}
