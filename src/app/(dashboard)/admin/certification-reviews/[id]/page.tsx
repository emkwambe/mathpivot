import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui";
import {
  approveCertification,
  denyCertification,
  getCertificationApplication,
  getCoachTrainingSnapshot,
  markUnderReview,
  revokeCertification,
} from "@/app/actions/certification-review";
import { createClient } from "@/lib/supabase/server";

async function underReviewAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await markUnderReview(id);
  revalidatePath(`/admin/certification-reviews/${id}`);
}

async function approveAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const notes = (formData.get("notes") as string) || undefined;
  await approveCertification(id, notes);
  revalidatePath(`/admin/certification-reviews/${id}`);
}

async function denyAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const notes = (formData.get("notes") as string) || "";
  await denyCertification(id, notes);
  revalidatePath(`/admin/certification-reviews/${id}`);
}

async function revokeAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const notes = (formData.get("notes") as string) || "";
  await revokeCertification(id, notes);
  revalidatePath(`/admin/certification-reviews/${id}`);
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-100 text-blue-700",
  under_review: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  denied: "bg-slate-100 text-slate-600",
  revoked: "bg-red-100 text-red-700",
};

const MODULE_STATUS_COLORS: Record<string, string> = {
  not_started: "text-slate-400",
  in_progress: "text-blue-600",
  completed: "text-emerald-600",
  failed: "text-red-600",
};

export default async function CertificationReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const app = await getCertificationApplication(id);
  if (!app) return notFound();

  const modules =
    (await getCoachTrainingSnapshot(app.coach_id, app.tier)) ?? [];

  // Pull the coach's onboarding progress so the reviewer sees whether
  // safeguarding + Code of Conduct requirements are satisfied. Approving
  // certification without these is a red flag we surface, not enforce.
  const supabase = await createClient();
  const { data: onboarding } = await supabase
    .from("coach_onboarding_progress")
    .select(
      "background_check_attested, admin_verified_background, code_of_conduct_accepted, activated",
    )
    .eq("coach_id", app.coach_id)
    .maybeSingle();

  const completed = modules.filter((m) => m.status === "completed").length;
  const required = modules.filter((m) => m.isRequired).length;
  const allDone = completed >= required && required > 0;
  const canReview = app.status === "pending" || app.status === "under_review";
  const isApproved = app.status === "approved";

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Link
        href="/admin/certification-reviews"
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to certification reviews
      </Link>

      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-900">
            {app.coach_name || app.coach_email || "Coach"}
          </h1>
          <span
            className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${
              app.tier === "master"
                ? "bg-purple-50 text-purple-800 border-purple-200"
                : "bg-blue-50 text-blue-800 border-blue-200"
            }`}
          >
            {app.tier === "master" ? "Master Coach" : "Certified Coach"}
          </span>
          <Badge className={STATUS_COLORS[app.status]}>
            {app.status.replace(/_/g, " ")}
          </Badge>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          {app.coach_email && <>{app.coach_email} · </>}Submitted{" "}
          {new Date(app.submitted_at).toLocaleString()}
        </p>
      </div>

      {/* Module completion snapshot */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900">
            Module completion
          </h2>
          <span
            className={`text-sm font-semibold ${allDone ? "text-emerald-700" : "text-amber-700"}`}
          >
            {completed} / {required} required
          </span>
        </div>
        <ul className="divide-y divide-slate-100">
          {modules.map((m) => (
            <li key={m.slug} className="flex items-start gap-3 py-2 text-sm">
              {m.status === "completed" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <Circle
                  className={`w-4 h-4 mt-0.5 shrink-0 ${MODULE_STATUS_COLORS[m.status]}`}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800">
                  {String(m.sortOrder).padStart(2, "0")} — {m.title}
                </p>
                <p className="text-xs text-slate-500">
                  {m.minutes} min ·{" "}
                  <span className={MODULE_STATUS_COLORS[m.status]}>
                    {m.status.replace(/_/g, " ")}
                  </span>
                  {m.score != null && (
                    <>
                      {" · "}Score: {m.score}%
                    </>
                  )}
                  {m.completedAt && (
                    <>
                      {" · "}
                      {new Date(m.completedAt).toLocaleDateString()}
                    </>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Safeguarding / Code of Conduct context */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-3">
          Safeguarding & conduct
        </h2>
        {onboarding ? (
          <ul className="space-y-1.5 text-sm">
            <StatusLine
              label="Background check attested"
              done={onboarding.background_check_attested}
            />
            <StatusLine
              label="Admin verified background check"
              done={onboarding.admin_verified_background}
            />
            <StatusLine
              label="Code of Conduct accepted"
              done={onboarding.code_of_conduct_accepted}
            />
          </ul>
        ) : (
          <p className="text-sm text-slate-500 italic">
            No coach onboarding record found. This coach may have been created
            outside the standard invitation flow.
          </p>
        )}
        {onboarding &&
          (!onboarding.admin_verified_background ||
            !onboarding.code_of_conduct_accepted) && (
            <p className="text-xs text-amber-800 mt-3">
              You can still approve certification, but activation for student
              assignment on the coach applications page will refuse until these
              are complete.
            </p>
          )}
      </section>

      {/* Prior review notes / decision */}
      {(app.review_notes || app.certified_at) && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
          <h2 className="text-sm font-bold text-slate-900">Decision history</h2>
          {app.reviewed_at && (
            <p className="text-xs text-slate-500">
              Last reviewed {new Date(app.reviewed_at).toLocaleString()}
            </p>
          )}
          {app.certified_at && (
            <p className="text-sm text-slate-800">
              <span className="font-medium">Certified:</span>{" "}
              {new Date(app.certified_at).toLocaleDateString()}
              {app.expires_at && (
                <>
                  {" · "}Expires {new Date(app.expires_at).toLocaleDateString()}
                </>
              )}
            </p>
          )}
          {app.review_notes && (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {app.review_notes}
            </p>
          )}
        </section>
      )}

      {/* Actions */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Decision</h2>

        {canReview && (
          <>
            {app.status === "pending" && (
              <form action={underReviewAction}>
                <input type="hidden" name="id" value={app.id} />
                <button
                  type="submit"
                  className="w-full py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Mark under review
                </button>
              </form>
            )}

            <form action={approveAction} className="space-y-2">
              <input type="hidden" name="id" value={app.id} />
              <textarea
                name="notes"
                rows={2}
                placeholder="Optional approval notes (visible to admins)"
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-700"
              />
              <button
                type="submit"
                disabled={!allDone}
                className="w-full py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                Approve {app.tier === "master" ? "Master" : "Certified"} Coach
              </button>
              {!allDone && (
                <p className="text-[11px] text-amber-700 text-center">
                  Required modules are not all complete. The coach must finish
                  the remaining modules before certification is approved.
                </p>
              )}
            </form>

            <form
              action={denyAction}
              className="space-y-2 pt-2 border-t border-slate-100"
            >
              <input type="hidden" name="id" value={app.id} />
              <textarea
                name="notes"
                rows={2}
                required
                placeholder="Required — explain what needs to change before reapplying"
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                className="w-full py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50"
              >
                Deny application
              </button>
            </form>
          </>
        )}

        {isApproved && (
          <form action={revokeAction} className="space-y-2">
            <input type="hidden" name="id" value={app.id} />
            <textarea
              name="notes"
              rows={2}
              required
              placeholder="Required — reason for revocation (Code of Conduct violation, failed calibration, etc.)"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500"
            />
            <button
              type="submit"
              className="w-full py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50"
            >
              Revoke certification
            </button>
            <p className="text-[11px] text-slate-500 text-center">
              Revoking does not delete the record. The coach loses Certified
              status and student-assignment activation. They can reapply later.
            </p>
          </form>
        )}

        {app.status === "denied" && (
          <p className="text-sm text-slate-600 italic">
            This application was denied. The coach can submit a new application
            from their training page after addressing the notes.
          </p>
        )}

        {app.status === "revoked" && (
          <p className="text-sm text-slate-600 italic">
            This certification was revoked. The coach may reapply after
            addressing the concerns in the notes above.
          </p>
        )}
      </section>
    </div>
  );
}

function StatusLine({ label, done }: { label: string; done: boolean }) {
  return (
    <li className="flex items-start gap-2">
      <span
        className={`mt-1 inline-block w-2 h-2 rounded-full ${
          done ? "bg-emerald-500" : "bg-slate-300"
        }`}
      />
      <span className={done ? "text-slate-800" : "text-slate-500"}>
        {label}
      </span>
    </li>
  );
}
