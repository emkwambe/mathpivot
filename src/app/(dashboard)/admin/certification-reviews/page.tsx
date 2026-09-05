import Link from "next/link";
import { Badge } from "@/components/ui";
import { listCertificationApplications } from "@/app/actions/certification-review";

const STATUS_TABS: Array<{ key: string; label: string }> = [
  { key: "pending", label: "New" },
  { key: "under_review", label: "In review" },
  { key: "approved", label: "Approved" },
  { key: "denied", label: "Denied" },
  { key: "revoked", label: "Revoked" },
  { key: "all", label: "All" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-100 text-blue-700",
  under_review: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  denied: "bg-slate-100 text-slate-600",
  revoked: "bg-red-100 text-red-700",
};

const TIER_COLORS: Record<string, string> = {
  certified: "bg-blue-50 text-blue-800 border-blue-200",
  master: "bg-purple-50 text-purple-800 border-purple-200",
};

export default async function CertificationReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeTab = status || "pending";
  const apps = await listCertificationApplications(activeTab);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Certification Reviews
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Coaches who have completed the training modules and applied for
          Certified or Master Coach status. Approving here grants the credential
          and unlocks activation for student assignment.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5 border-b border-slate-200">
        {STATUS_TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <Link
              key={tab.key}
              href={`/admin/certification-reviews?status=${tab.key}`}
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
          No certification applications in this state yet.
        </div>
      ) : (
        <div className="space-y-2">
          {apps.map((app) => {
            const modulesReady =
              app.modules_completed != null &&
              app.modules_required != null &&
              app.modules_completed >= app.modules_required;
            return (
              <Link
                key={app.id}
                href={`/admin/certification-reviews/${app.id}`}
                className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900">
                        {app.coach_name || app.coach_email || "Coach"}
                      </h3>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${TIER_COLORS[app.tier]}`}
                      >
                        {app.tier === "master"
                          ? "Master Coach"
                          : "Certified Coach"}
                      </span>
                      <Badge className={STATUS_COLORS[app.status]}>
                        {app.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    {app.coach_email && (
                      <p className="text-sm text-slate-500 mt-1">
                        {app.coach_email}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      Modules:{" "}
                      <span
                        className={
                          modulesReady
                            ? "text-emerald-700 font-medium"
                            : "text-amber-700 font-medium"
                        }
                      >
                        {app.modules_completed ?? 0} of{" "}
                        {app.modules_required ?? "?"}
                      </span>
                      {app.certified_at && (
                        <>
                          {" · "}
                          <span>
                            Certified{" "}
                            {new Date(app.certified_at).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-xs text-slate-400 whitespace-nowrap text-right">
                    <div>Submitted</div>
                    <div>{new Date(app.submitted_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
