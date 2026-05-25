import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui";
import { getWaitlistLeads, updateLeadStatus } from "@/app/actions/schedules";
import { revalidatePath } from "next/cache";

async function updateStatusAction(formData: FormData) {
  "use server";
  const leadId = formData.get("leadId") as string;
  const status = formData.get("status") as string;
  await updateLeadStatus(leadId, status);
  revalidatePath("/admin/summer-waitlist");
}

export default async function SummerWaitlistPage() {
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
  if (profile?.role !== "admin" && profile?.role !== "super_admin")
    redirect("/");

  const leads = await getWaitlistLeads("summer_clinic_waitlist");

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-amber-100 text-amber-800",
    diagnostic_scheduled: "bg-purple-100 text-purple-800",
    diagnostic_complete: "bg-indigo-100 text-indigo-800",
    enrolled: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
    waitlisted: "bg-slate-100 text-slate-800",
  };

  const newCount = leads.filter(
    (l) => l.lead_status === "new" || !l.lead_status,
  ).length;
  const contactedCount = leads.filter(
    (l) => l.lead_status === "contacted",
  ).length;
  const enrolledCount = leads.filter(
    (l) => l.lead_status === "enrolled",
  ).length;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Summer Clinic Waitlist
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Manage summer clinic signups — triage, schedule diagnostics, and place
          students into cohorts.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{leads.length}</p>
          <p className="text-xs text-slate-500">Total Signups</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{newCount}</p>
          <p className="text-xs text-blue-600">New (uncontacted)</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{contactedCount}</p>
          <p className="text-xs text-amber-600">Contacted</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{enrolledCount}</p>
          <p className="text-xs text-green-600">Enrolled</p>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-slate-500">No summer waitlist signups yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">
                    Parent
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">
                    Contact
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">
                    Student
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">
                    Interest
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => {
                  const status = lead.lead_status || "new";
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">
                          {lead.parent_name}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-600">{lead.parent_email}</p>
                        {lead.parent_phone && (
                          <p className="text-xs text-slate-400">
                            {lead.parent_phone}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700">
                          {lead.student_name || "—"}
                        </p>
                        <p className="text-xs text-slate-400">
                          Grade {lead.student_grade || "?"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-600">
                          {lead.subjects_interested || "Not specified"}
                        </p>
                        {lead.goals && (
                          <p className="text-xs text-slate-400 mt-1 truncate max-w-[200px]">
                            {lead.goals}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            statusColors[status] ||
                            "bg-slate-100 text-slate-600"
                          }
                        >
                          {status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <form
                          action={updateStatusAction}
                          className="flex gap-1"
                        >
                          <input type="hidden" name="leadId" value={lead.id} />
                          {status === "new" && (
                            <button
                              type="submit"
                              name="status"
                              value="contacted"
                              className="px-2 py-1 bg-amber-500 text-white text-xs rounded hover:bg-amber-600"
                            >
                              Mark Contacted
                            </button>
                          )}
                          {status === "contacted" && (
                            <>
                              <button
                                type="submit"
                                name="status"
                                value="diagnostic_scheduled"
                                className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                              >
                                Schedule Dx
                              </button>
                              <button
                                type="submit"
                                name="status"
                                value="enrolled"
                                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              >
                                Enroll
                              </button>
                            </>
                          )}
                          {(status === "diagnostic_scheduled" ||
                            status === "diagnostic_complete") && (
                            <button
                              type="submit"
                              name="status"
                              value="enrolled"
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              Enroll
                            </button>
                          )}
                          {status !== "declined" && status !== "enrolled" && (
                            <button
                              type="submit"
                              name="status"
                              value="declined"
                              className="px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded hover:bg-slate-300"
                            >
                              Decline
                            </button>
                          )}
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
