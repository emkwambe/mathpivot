import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui";
import {
  getModuleBySlug,
  getCoachProgress,
  startModule,
  completeModule,
} from "@/app/actions/training";
import { getModuleContent } from "@/lib/training/module-content";
import { ArrowLeft, Clock, CheckCircle2, Lock, BookOpen } from "lucide-react";

async function startAction(formData: FormData) {
  "use server";
  await startModule(formData.get("moduleId") as string);
  revalidatePath(`/tutor/training/${formData.get("slug")}`);
  revalidatePath("/tutor/training");
}

async function completeAction(formData: FormData) {
  "use server";
  await completeModule(formData.get("moduleId") as string);
  revalidatePath(`/tutor/training/${formData.get("slug")}`);
  revalidatePath("/tutor/training");
}

const STATUS_STYLES: Record<string, string> = {
  not_started: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  failed: "Reassessment needed",
};

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const mod = await getModuleBySlug(slug);
  if (!mod) return notFound();

  const content = getModuleContent(slug);
  const { modules, status } = await getCoachProgress();
  const progress = modules.find((m) => m.module.id === mod.id);
  const moduleStatus = progress?.status || "not_started";

  // Lock rules mirror the server-side enforcement in startModule:
  //   - Certification assessment (mp-certification-assessment) locks until
  //     modules 1-9 (all other required certified-tier modules) are done.
  //   - Master modules lock until certified tier is complete.
  //   - Master assessment locks until master 1-4 are done.
  const isCertifiedAssessment = slug === "mp-certification-assessment";
  const isMasterAssessment = slug === "mp-master-assessment";
  const isMasterModule = mod.certification_tier === "master";

  const certifiedPrereqDone =
    (status?.certifiedModulesDone ?? 0) >=
    Math.max(0, (status?.certifiedModulesTotal ?? 0) - 1);
  const certifiedEligible = status?.certifiedEligible ?? false;
  const masterPrereqDone =
    (status?.masterModulesDone ?? 0) >=
    Math.max(0, (status?.masterModulesTotal ?? 0) - 1);

  const locked =
    (isCertifiedAssessment && !certifiedPrereqDone) ||
    (isMasterModule && !isMasterAssessment && !certifiedEligible) ||
    (isMasterAssessment && (!certifiedEligible || !masterPrereqDone));

  const lockReason = locked
    ? isCertifiedAssessment
      ? "Complete Modules 1–9 to unlock the Certified Coach Assessment."
      : isMasterAssessment
        ? "Complete Certified Coach status and all Master modules to unlock the Master Coach Assessment."
        : "Master Coach training becomes available after Certified Coach status has been earned."
    : null;

  const backHref = "/tutor/training";
  const moduleNumber = isMasterModule
    ? `M${mod.sort_order - 10}`
    : String(mod.sort_order).padStart(2, "0");

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Coach Training
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              isMasterModule ? "text-purple-600" : "text-blue-700"
            }`}
          >
            {isMasterModule ? "Master Coach" : "Certified Coach"} ·{" "}
            {moduleNumber}
          </span>
          <Badge className={STATUS_STYLES[moduleStatus]}>
            {STATUS_LABELS[moduleStatus]}
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
          {mod.title}
        </h1>
        <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {mod.estimated_minutes} minutes
          </span>
          <span className="inline-flex items-center gap-1.5 capitalize">
            <BookOpen className="w-4 h-4" />
            {mod.content_type}
          </span>
        </div>
      </div>

      {locked && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-900 text-sm">
              This module is locked.
            </p>
            <p className="text-sm text-amber-800 mt-1">{lockReason}</p>
          </div>
        </div>
      )}

      {content && (
        <section className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6">
          <p className="text-slate-800 leading-relaxed">{content.purpose}</p>

          {content.objectives && content.objectives.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
                This module introduces
              </p>
              <ul className="space-y-2">
                {content.objectives.map((o) => (
                  <li
                    key={o}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {content.sections.map((section, i) => {
            if (section.type === "text") {
              return (
                <p key={i} className="text-sm text-slate-700 leading-relaxed">
                  {section.body}
                </p>
              );
            }
            if (section.type === "list") {
              return (
                <ul key={i} className="space-y-2">
                  {section.items.map((it) => (
                    <li
                      key={it}
                      className="flex items-start gap-2 text-sm text-slate-700"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            if (section.type === "table") {
              return (
                <div key={i}>
                  {section.title && (
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
                      {section.title}
                    </p>
                  )}
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-left">
                        <tr>
                          {section.columns.map((c) => (
                            <th
                              key={c}
                              className="px-3 py-2 font-semibold text-slate-700"
                            >
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {section.rows.map((row, ri) => (
                          <tr key={ri}>
                            {row.map((cell, ci) => (
                              <td
                                key={ci}
                                className="px-3 py-2 text-slate-700 align-top"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }
            if (section.type === "note") {
              return (
                <div
                  key={i}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
                    {section.label}
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {section.body}
                  </p>
                </div>
              );
            }
            return null;
          })}

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700 mb-1">
              Completion evidence
            </p>
            <p className="text-sm text-slate-800">
              {content.completionEvidence}
            </p>
            {slug === "mp-session-structure" && (
              <Link
                href="/tutor/resources/session-plan-template"
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline mt-3"
              >
                Open the session plan template →
              </Link>
            )}
          </div>
        </section>
      )}

      {!content && (
        <section className="rounded-2xl bg-white border border-slate-200 p-6 text-sm text-slate-700">
          {mod.description}
        </section>
      )}

      <div className="mt-6 flex items-center justify-between gap-4">
        <div>
          {moduleStatus === "completed" && (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              You completed this module.
            </span>
          )}
          {moduleStatus === "failed" && isCertifiedAssessment && (
            <span className="text-sm text-amber-700">
              Previous attempt did not pass. Retake below.
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Certified Coach Assessment has a real quiz — route there
              instead of the generic Start/Mark-complete flow. */}
          {!locked && isCertifiedAssessment && moduleStatus !== "completed" && (
            <Link
              href="/tutor/training/mp-certification-assessment/take"
              className="inline-flex items-center gap-2 bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800"
            >
              {moduleStatus === "failed"
                ? "Retake assessment"
                : "Take assessment"}
            </Link>
          )}
          {!locked &&
            !isCertifiedAssessment &&
            moduleStatus === "not_started" && (
              <form action={startAction}>
                <input type="hidden" name="moduleId" value={mod.id} />
                <input type="hidden" name="slug" value={slug} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800"
                >
                  Start module
                </button>
              </form>
            )}
          {!locked &&
            !isCertifiedAssessment &&
            moduleStatus === "in_progress" && (
              <form action={completeAction}>
                <input type="hidden" name="moduleId" value={mod.id} />
                <input type="hidden" name="slug" value={slug} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700"
                >
                  Mark complete
                </button>
              </form>
            )}
        </div>
      </div>
    </div>
  );
}
