import Link from "next/link";
import { listCoachApplications } from "@/app/actions/coach-applications";
import { Badge } from "@/components/ui";

const STATUS_TABS: Array<{
  key: string;
  label: string;
}> = [
  { key: "submitted", label: "New" },
  { key: "screening", label: "Screening" },
  { key: "interview_scheduled", label: "Interview" },
  { key: "approved", label: "Approved" },
  { key: "accepted", label: "Accepted" },
  { key: "denied", label: "Denied" },
  { key: "all", label: "All" },
];

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700",
  screening: "bg-amber-100 text-amber-700",
  interview_scheduled: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  accepted: "bg-emerald-100 text-emerald-700",
  denied: "bg-slate-100 text-slate-600",
  withdrawn: "bg-slate-100 text-slate-600",
};

export default async function CoachApplicationsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeTab = status || "submitted";
  const apps = await listCoachApplications(activeTab);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Coach Applications
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Applications submitted through <code>/coach-apply</code>. Review,
          screen, and send invitations to onboard new MathPivot Math Coaches.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5 border-b border-slate-200">
        {STATUS_TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <Link
              key={tab.key}
              href={`/admin/coach-applications?status=${tab.key}`}
              className={`px-3 py-2 text-sm border-b-2 -mb-px ${
                active
                  ? "border-blue-700 text-blue-700 font-semibold"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {apps.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-500">
          No applications in this state yet.
        </div>
      ) : (
        <div className="space-y-2">
          {apps.map((app) => (
            <Link
              key={app.id}
              href={`/admin/coach-applications/${app.id}`}
              className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">
                      {app.full_name}
                    </h3>
                    <Badge className={STATUS_COLORS[app.status]}>
                      {app.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {app.email}
                    {app.location ? ` · ${app.location}` : ""}
                  </p>
                  {app.current_role && (
                    <p className="text-sm text-slate-600 mt-1">
                      {app.current_role}
                      {app.years_teaching != null
                        ? ` · ${app.years_teaching} yrs teaching`
                        : ""}
                    </p>
                  )}
                  {app.specialties.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {app.specialties.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                        >
                          {s}
                        </span>
                      ))}
                      {app.specialties.length > 4 && (
                        <span className="text-[11px] text-slate-400">
                          +{app.specialties.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-400 whitespace-nowrap">
                  {new Date(app.created_at).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
