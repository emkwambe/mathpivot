import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui";
import {
  getCoachProgress,
  startModule,
  completeModule,
  submitCertificationApplication,
} from "@/app/actions/training";
import { revalidatePath } from "next/cache";

async function startModuleAction(formData: FormData) {
  "use server";
  await startModule(formData.get("moduleId") as string);
  revalidatePath("/tutor/training");
}

async function completeModuleAction(formData: FormData) {
  "use server";
  await completeModule(formData.get("moduleId") as string, 100);
  revalidatePath("/tutor/training");
}

async function applyCertAction(formData: FormData) {
  "use server";
  await submitCertificationApplication(formData.get("tier") as string);
  revalidatePath("/tutor/training");
}

const categoryIcons: Record<string, string> = {
  foundations:
    "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  curriculum:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
  session_delivery:
    "M15 10l4.553-2.276A1 1 0 0021 8.618V15.382a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  assessment: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  parent_communication:
    "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  technology:
    "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  competition_prep:
    "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  advanced: "M13 10V3L4 14h7v7l9-11h-7z",
};

const statusColors: Record<string, string> = {
  not_started: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

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

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Coach Training</h1>
        <p className="text-slate-600 text-sm mt-1">
          Complete the MathPivot Method training to become a certified coach.
        </p>
      </div>

      {status && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">Certified Coach</h3>
              {status.certifiedEligible ? (
                <Badge className="bg-emerald-100 text-emerald-700">
                  Eligible
                </Badge>
              ) : (
                <span className="text-xs text-slate-400">
                  {status.certifiedModulesDone}/{status.certifiedModulesTotal}{" "}
                  modules
                </span>
              )}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-3">
              <div
                className="bg-blue-700 h-2.5 rounded-full transition-all"
                style={{ width: `${status.certifiedPercentage}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              10 required modules · ~6 hours total · Assessment at the end
            </p>
            {status.certifiedEligible && (
              <form action={applyCertAction} className="mt-3">
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

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">Master Coach</h3>
              {status.masterEligible ? (
                <Badge className="bg-purple-100 text-purple-700">
                  Eligible
                </Badge>
              ) : (
                <span className="text-xs text-slate-400">
                  {status.masterModulesDone}/{status.masterModulesTotal} modules
                </span>
              )}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-3">
              <div
                className="bg-purple-600 h-2.5 rounded-full transition-all"
                style={{ width: `${status.masterPercentage}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              Requires Certified Coach + 5 advanced modules · Train other
              coaches
            </p>
            {status.masterEligible && (
              <form action={applyCertAction} className="mt-3">
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
          Certified Coach Modules ({status?.certifiedModulesDone || 0}/
          {status?.certifiedModulesTotal || 0})
        </h2>
        <div className="space-y-3">
          {certifiedModules.map((item, idx) => (
            <div
              key={item.module.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d={
                        categoryIcons[item.module.category] ||
                        categoryIcons.foundations
                      }
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-semibold text-slate-900 text-sm truncate">
                      {item.module.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {item.module.description}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-slate-400">
                    {item.module.estimated_minutes} min
                  </span>
                  <Badge className={statusColors[item.status]}>
                    {item.status.replace("_", " ")}
                  </Badge>
                  {item.status === "not_started" && (
                    <form action={startModuleAction}>
                      <input
                        type="hidden"
                        name="moduleId"
                        value={item.module.id}
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-lg hover:bg-blue-800"
                      >
                        Start
                      </button>
                    </form>
                  )}
                  {item.status === "in_progress" && (
                    <form action={completeModuleAction}>
                      <input
                        type="hidden"
                        name="moduleId"
                        value={item.module.id}
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700"
                      >
                        Complete
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {masterModules.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-purple-600 mb-4">
            Master Coach Modules ({status?.masterModulesDone || 0}/
            {status?.masterModulesTotal || 0})
          </h2>
          <div className="space-y-3">
            {masterModules.map((item, idx) => (
              <div
                key={item.module.id}
                className={`bg-white border rounded-xl overflow-hidden ${
                  status?.certifiedEligible
                    ? "border-slate-200"
                    : "border-slate-100 opacity-60"
                }`}
              >
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-purple-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d={
                          categoryIcons[item.module.category] ||
                          categoryIcons.advanced
                        }
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-purple-400 font-mono">
                        M{idx + 1}
                      </span>
                      <h3 className="font-semibold text-slate-900 text-sm truncate">
                        {item.module.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {item.module.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-slate-400">
                      {item.module.estimated_minutes} min
                    </span>
                    <Badge className={statusColors[item.status]}>
                      {item.status.replace("_", " ")}
                    </Badge>
                    {status?.certifiedEligible &&
                      item.status === "not_started" && (
                        <form action={startModuleAction}>
                          <input
                            type="hidden"
                            name="moduleId"
                            value={item.module.id}
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700"
                          >
                            Start
                          </button>
                        </form>
                      )}
                    {status?.certifiedEligible &&
                      item.status === "in_progress" && (
                        <form action={completeModuleAction}>
                          <input
                            type="hidden"
                            name="moduleId"
                            value={item.module.id}
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700"
                          >
                            Complete
                          </button>
                        </form>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {!status?.certifiedEligible && (
            <p className="text-xs text-slate-400 mt-3 text-center">
              Complete all Certified Coach modules to unlock Master Coach
              training.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
