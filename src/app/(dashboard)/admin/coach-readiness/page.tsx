import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui";
import { getAllCoachReadiness } from "@/app/actions/coach-certifications";
import { updateCertification } from "@/app/actions/coach-certifications";
import { revalidatePath } from "next/cache";

async function toggleCertAction(formData: FormData) {
  "use server";
  const coachId = formData.get("coachId") as string;
  const certType = formData.get("certType") as string;
  const action = formData.get("action") as "complete" | "revoke";
  await updateCertification(coachId, certType, action);
  revalidatePath("/admin/coach-readiness");
}

export default async function CoachReadinessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users_profile")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    redirect("/");
  }

  const coaches = await getAllCoachReadiness();

  const readyCount = coaches.filter((c) => c.isReady).length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Coach Readiness</h1>
        <p className="text-slate-600 text-sm mt-1">
          {readyCount}/{coaches.length} coaches fully certified and ready to
          receive students
        </p>
      </div>

      {coaches.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-slate-500">No coaches registered yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {coaches.map((coach) => (
            <div
              key={coach.coachId}
              className={`border rounded-xl overflow-hidden ${
                coach.isReady
                  ? "border-green-200 bg-green-50/30"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      coach.isReady
                        ? "bg-green-500 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {coach.coachName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {coach.coachName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {coach.completedCount}/{coach.totalRequired}{" "}
                      certifications
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    coach.isReady
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }
                >
                  {coach.isReady ? "Ready" : "Incomplete"}
                </Badge>
              </div>

              <div className="border-t border-slate-100 px-4 py-3">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {coach.certifications.map((cert) => (
                    <form key={cert.key} action={toggleCertAction}>
                      <input
                        type="hidden"
                        name="coachId"
                        value={coach.coachId}
                      />
                      <input type="hidden" name="certType" value={cert.key} />
                      <input
                        type="hidden"
                        name="action"
                        value={cert.isComplete ? "revoke" : "complete"}
                      />
                      <button
                        type="submit"
                        className={`w-full text-left p-2 rounded-lg border text-xs transition-colors ${
                          cert.isComplete
                            ? "border-green-200 bg-green-50 hover:bg-green-100"
                            : cert.isExpired
                              ? "border-red-200 bg-red-50 hover:bg-red-100"
                              : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {cert.isComplete ? (
                            <svg
                              className="w-3.5 h-3.5 text-green-600 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : cert.isExpired ? (
                            <svg
                              className="w-3.5 h-3.5 text-red-500 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                              />
                            </svg>
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                          )}
                          <span
                            className={
                              cert.isComplete
                                ? "text-green-800"
                                : cert.isExpired
                                  ? "text-red-700"
                                  : "text-slate-600"
                            }
                          >
                            {cert.title}
                          </span>
                        </div>
                        {cert.isExpired && (
                          <p className="text-red-500 mt-0.5 ml-5">Expired</p>
                        )}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
