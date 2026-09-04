import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui";
import {
  approveAndInvite,
  getCoachApplication,
  updateApplicationStatus,
} from "@/app/actions/coach-applications";
import { getOnboardingForCoach } from "@/app/actions/coach-onboarding";
import {
  adminActivateCoach,
  adminVerifyBackground,
} from "@/app/actions/coach-onboarding";
import { createClient } from "@/lib/supabase/server";

async function approveAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await approveAndInvite(id, (formData.get("notes") as string) || undefined);
  revalidatePath(`/admin/coach-applications/${id}`);
}

async function statusAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const status = formData.get("status") as
    | "screening"
    | "interview_scheduled"
    | "denied"
    | "withdrawn";
  const deniedReason = (formData.get("deniedReason") as string) || undefined;
  await updateApplicationStatus(id, status, { deniedReason });
  revalidatePath(`/admin/coach-applications/${id}`);
}

async function verifyBgAction(formData: FormData) {
  "use server";
  const coachId = formData.get("coachId") as string;
  const notes = (formData.get("notes") as string) || undefined;
  await adminVerifyBackground(coachId, notes);
  revalidatePath(`/admin/coach-applications/${formData.get("id")}`);
}

async function activateAction(formData: FormData) {
  "use server";
  const coachId = formData.get("coachId") as string;
  await adminActivateCoach(coachId);
  revalidatePath(`/admin/coach-applications/${formData.get("id")}`);
}

async function getBaseUrl() {
  const h = await headers();
  const host =
    h.get("x-forwarded-host") ?? h.get("host") ?? "www.mathpivot.com";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700",
  screening: "bg-amber-100 text-amber-700",
  interview_scheduled: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  accepted: "bg-emerald-100 text-emerald-700",
  denied: "bg-slate-100 text-slate-600",
  withdrawn: "bg-slate-100 text-slate-600",
};

export default async function CoachApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const app = await getCoachApplication(id);
  if (!app) return notFound();

  const baseUrl = await getBaseUrl();
  const inviteUrl = app.invite_token
    ? `${baseUrl}/coach-apply/accept/${app.invite_token}`
    : null;

  const onboarding = app.user_id
    ? await getOnboardingForCoach(app.user_id)
    : null;

  const supabase = await createClient();
  const { data: certApp } = app.user_id
    ? await supabase
        .from("certification_applications")
        .select("status")
        .eq("coach_id", app.user_id)
        .eq("tier", "certified")
        .maybeSingle()
    : { data: null };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Link
        href="/admin/coach-applications"
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to applications
      </Link>

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900">{app.full_name}</h1>
          <Badge className={STATUS_COLORS[app.status]}>
            {app.status.replace(/_/g, " ")}
          </Badge>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Submitted {new Date(app.created_at).toLocaleString()}
        </p>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
        <Row label="Email" value={app.email} />
        <Row label="Phone" value={app.phone} />
        <Row label="Location" value={app.location} />
        <Row label="Current role" value={app.current_role} />
        <Row
          label="Years teaching"
          value={app.years_teaching != null ? String(app.years_teaching) : null}
        />
        <Row
          label="Specialties"
          value={app.specialties.length > 0 ? app.specialties.join(", ") : null}
        />
        <Row label="Resume" value={app.resume_url} isLink />
        <Row label="LinkedIn" value={app.linkedin_url} isLink />
        <Row label="Why MathPivot" value={app.why_mathpivot} multiline />
        <Row label="Availability" value={app.availability} multiline />
      </section>

      {/* Workflow actions */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900">
          Move this application
        </h2>

        {app.status !== "approved" &&
          app.status !== "accepted" &&
          app.status !== "denied" &&
          app.status !== "withdrawn" && (
            <div className="grid sm:grid-cols-2 gap-2">
              <form action={statusAction}>
                <input type="hidden" name="id" value={app.id} />
                <input type="hidden" name="status" value="screening" />
                <button
                  type="submit"
                  className="w-full py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Mark screening
                </button>
              </form>
              <form action={statusAction}>
                <input type="hidden" name="id" value={app.id} />
                <input
                  type="hidden"
                  name="status"
                  value="interview_scheduled"
                />
                <button
                  type="submit"
                  className="w-full py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Interview scheduled
                </button>
              </form>
            </div>
          )}

        {app.status !== "denied" && app.status !== "accepted" && (
          <form action={approveAction} className="space-y-2">
            <input type="hidden" name="id" value={app.id} />
            <textarea
              name="notes"
              rows={2}
              placeholder="Optional admin notes"
              defaultValue={app.admin_notes ?? ""}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-700"
            />
            <button
              type="submit"
              className="w-full py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800"
            >
              {app.status === "approved"
                ? "Regenerate invitation"
                : "Approve & generate invitation link"}
            </button>
          </form>
        )}

        {inviteUrl && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700 mb-2">
              Invitation link
            </p>
            <p className="text-sm text-slate-800 mb-2">
              Send this URL to {app.email}. They&apos;ll sign up (or sign in)
              with that email, and their coach role plus onboarding checklist
              are provisioned automatically.
            </p>
            <code className="block w-full text-xs bg-white border border-slate-200 rounded p-2 break-all">
              {inviteUrl}
            </code>
            {app.invited_at && (
              <p className="text-xs text-slate-500 mt-2">
                Generated {new Date(app.invited_at).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {app.status !== "denied" && app.status !== "accepted" && (
          <form
            action={statusAction}
            className="space-y-2 pt-2 border-t border-slate-100"
          >
            <input type="hidden" name="id" value={app.id} />
            <input type="hidden" name="status" value="denied" />
            <input
              name="deniedReason"
              placeholder="Reason (kept internal)"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500"
            />
            <button
              type="submit"
              className="w-full py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50"
            >
              Deny application
            </button>
          </form>
        )}

        {app.denied_reason && (
          <p className="text-xs text-slate-600">
            <span className="font-semibold">Denied reason:</span>{" "}
            {app.denied_reason}
          </p>
        )}
      </section>

      {/* Onboarding oversight, once the coach has accepted the invite */}
      {app.user_id && onboarding && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Coach onboarding</h2>
          <ul className="space-y-1.5 text-sm">
            <StatusLine
              label="Background check attested by coach"
              done={onboarding.background_check_attested}
              detail={
                onboarding.background_check_provider
                  ? `${onboarding.background_check_provider} · ${onboarding.background_check_completed_on ?? ""}`
                  : undefined
              }
            />
            <StatusLine
              label="Admin verified background check"
              done={onboarding.admin_verified_background}
            />
            <StatusLine
              label="Code of Conduct accepted"
              done={onboarding.code_of_conduct_accepted}
              detail={onboarding.code_of_conduct_version ?? undefined}
            />
            <StatusLine
              label="Certified Coach status"
              done={certApp?.status === "approved"}
              detail={certApp?.status ?? "not applied"}
            />
            <StatusLine
              label="Activated for student assignment"
              done={onboarding.activated}
            />
          </ul>

          {!onboarding.admin_verified_background &&
            onboarding.background_check_attested && (
              <form action={verifyBgAction} className="space-y-2">
                <input type="hidden" name="id" value={app.id} />
                <input type="hidden" name="coachId" value={app.user_id} />
                <input
                  name="notes"
                  placeholder="Verification notes (optional)"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-900"
                >
                  Verify background check
                </button>
              </form>
            )}

          {!onboarding.activated && (
            <form action={activateAction}>
              <input type="hidden" name="id" value={app.id} />
              <input type="hidden" name="coachId" value={app.user_id} />
              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                Activate coach for student assignment
              </button>
              <p className="text-[11px] text-slate-500 mt-1 text-center">
                Requires attestation, admin verification, Code of Conduct, and
                Certified Coach status.
              </p>
            </form>
          )}
        </section>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  isLink,
  multiline,
}: {
  label: string;
  value: string | null | undefined;
  isLink?: boolean;
  multiline?: boolean;
}) {
  if (!value) {
    return (
      <div className="grid grid-cols-[140px_1fr] gap-3 text-sm">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-400">—</span>
      </div>
    );
  }
  return (
    <div
      className={`grid grid-cols-[140px_1fr] gap-3 text-sm ${
        multiline ? "items-start" : "items-baseline"
      }`}
    >
      <span className="text-slate-500">{label}</span>
      <div
        className={
          multiline ? "whitespace-pre-wrap text-slate-800" : "text-slate-800"
        }
      >
        {isLink ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:underline break-all"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </div>
    </div>
  );
}

function StatusLine({
  label,
  done,
  detail,
}: {
  label: string;
  done: boolean;
  detail?: string;
}) {
  return (
    <li className="flex items-start gap-2">
      <span
        className={`mt-1 inline-block w-2 h-2 rounded-full ${
          done ? "bg-emerald-500" : "bg-slate-300"
        }`}
      />
      <div className="flex-1">
        <span className={done ? "text-slate-800" : "text-slate-500"}>
          {label}
        </span>
        {detail && (
          <span className="ml-2 text-xs text-slate-500">({detail})</span>
        )}
      </div>
    </li>
  );
}
