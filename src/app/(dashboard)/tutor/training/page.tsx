import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Badge } from "@/components/ui";
import {
  getCoachProgress,
  submitCertificationApplication,
} from "@/app/actions/training";
import { ArrowRight, Lock } from "lucide-react";

async function applyCertAction(formData: FormData) {
  "use server";
  await submitCertificationApplication(formData.get("tier") as string);
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

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} minutes`;
  if (m === 0) return `${h} hour${h > 1 ? "s" : ""}`;
  return `${h} hour${h > 1 ? "s" : ""} ${m} minutes`;
}

export default async function TrainingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { modules, status } = await getCoachProgress();

  const certifiedModules = modules.filter(
    (m) => m.module.certification_tier === "certified",
  );
  const masterModules = modules.filter(
    (m) => m.module.certification_tier === "master",
  );

  const certifiedMinutes = certifiedModules.reduce(
    (sum, m) => sum + (m.module.estimated_minutes || 0),
    0,
  );
  const masterMinutes = masterModules.reduce(
    (sum, m) => sum + (m.module.estimated_minutes || 0),
    0,
  );

  const certifiedEligible = status?.certifiedEligible ?? false;
  const certifiedPrereqDone =
    (status?.certifiedModulesDone ?? 0) >=
    Math.max(0, (status?.certifiedModulesTotal ?? 0) - 1);
  const masterPrereqDone =
    (status?.masterModulesDone ?? 0) >=
    Math.max(0, (status?.masterModulesTotal ?? 0) - 1);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Coach Training</h1>
        <p className="text-slate-600 text-sm mt-2 max-w-2xl leading-relaxed">
          Learn the MathPivot Method and demonstrate that you can deliver
          consistent, mastery-centered coaching to students and families.
        </p>
        <p className="text-slate-500 text-sm mt-2 max-w-2xl leading-relaxed">
          Certification requires more than completing the modules. Coaches must
          pass the final assessment and demonstrate their ability to plan and
          facilitate a MathPivot session.
        </p>
      </div>

      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900">Certified Coach</h3>
              {certifiedEligible ? (
                <Badge className="bg-emerald-100 text-emerald-700">
                  Eligible
                </Badge>
              ) : (
                <span className="text-xs text-slate-500">
                  {status.certifiedModulesDone} of{" "}
                  {status.certifiedModulesTotal} modules completed
                </span>
              )}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
              <div
                className="bg-blue-700 h-2 rounded-full transition-all"
                style={{ width: `${status.certifiedPercentage}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mb-3">
              {status.certifiedModulesTotal} required modules · Approximately{" "}
              {formatDuration(certifiedMinutes)} · Final assessment required
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Certified Coaches are prepared to lead MathPivot small-group
              sessions, track individual mastery, communicate student progress,
              and connect school mathematics to longer-term academic and career
              goals.
            </p>
            {certifiedEligible && (
              <form action={applyCertAction} className="mt-4">
                <input type="hidden" name="tier" value="certified" />
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors"
                >
                  Apply for Certification
                </button>
              </form>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900">Master Coach</h3>
              {status.masterEligible ? (
                <Badge className="bg-purple-100 text-purple-700">
                  Eligible
                </Badge>
              ) : (
                <span className="text-xs text-slate-500">
                  {status.masterModulesDone} of {status.masterModulesTotal}{" "}
                  modules completed
                </span>
              )}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${status.masterPercentage}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Requires Certified Coach status · {status.masterModulesTotal}{" "}
              advanced modules · Approximately {formatDuration(masterMinutes)}
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Master Coaches provide advanced student coaching, lead
              instructional calibration, mentor new coaches, and help maintain
              the quality and consistency of the MathPivot Method.
            </p>
            {status.masterEligible && (
              <form action={applyCertAction} className="mt-4">
                <input type="hidden" name="tier" value="master" />
                <button
                  type="submit"
                  className="w-full py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Apply for Master Certification
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-blue-700 mb-4">
          Certified Coach Modules
        </h2>
        <div className="space-y-3">
          {certifiedModules.map((item, idx) => {
            const isAssessment =
              item.module.slug === "mp-certification-assessment";
            const locked = isAssessment && !certifiedPrereqDone;
            return (
              <ModuleRow
                key={item.module.id}
                item={item}
                number={String(idx + 1).padStart(2, "0")}
                locked={locked}
                lockLabel="Complete Modules 1–9 to unlock"
                tone="certified"
              />
            );
          })}
        </div>
      </div>

      {masterModules.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-purple-600 mb-2">
            Master Coach Modules
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Master Coach training becomes available after Certified Coach status
            has been earned and the coach has demonstrated consistent delivery
            quality.
          </p>
          <div className="space-y-3">
            {masterModules.map((item, idx) => {
              const isAssessment = item.module.slug === "mp-master-assessment";
              const locked =
                !certifiedEligible || (isAssessment && !masterPrereqDone);
              const lockLabel = !certifiedEligible
                ? "Requires Certified Coach status"
                : "Complete all prerequisites to unlock";
              return (
                <ModuleRow
                  key={item.module.id}
                  item={item}
                  number={`M${idx + 1}`}
                  locked={locked}
                  lockLabel={lockLabel}
                  tone="master"
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleRow({
  item,
  number,
  locked,
  lockLabel,
  tone,
}: {
  item: {
    module: {
      id: string;
      slug: string;
      title: string;
      description: string | null;
      estimated_minutes: number;
    };
    status: string;
  };
  number: string;
  locked: boolean;
  lockLabel: string;
  tone: "certified" | "master";
}) {
  const numberColor = tone === "master" ? "text-purple-500" : "text-slate-400";

  const inner = (
    <div className="flex items-center gap-4 p-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-mono ${numberColor}`}>{number}</span>
          <h3 className="font-semibold text-slate-900 text-sm">
            {item.module.title}
          </h3>
        </div>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
          {item.module.description}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-slate-400 whitespace-nowrap">
          {item.module.estimated_minutes} min
        </span>
        {locked ? (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Lock className="w-3 h-3" />
            Locked
          </span>
        ) : (
          <>
            <Badge className={STATUS_STYLES[item.status]}>
              {STATUS_LABELS[item.status]}
            </Badge>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors hidden sm:block" />
          </>
        )}
      </div>
    </div>
  );

  if (locked) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden opacity-70">
        {inner}
        <div className="px-4 pb-3 -mt-1 text-[11px] text-slate-400">
          {lockLabel}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/tutor/training/${item.module.slug}`}
      className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-sm transition-all block"
    >
      {inner}
    </Link>
  );
}
