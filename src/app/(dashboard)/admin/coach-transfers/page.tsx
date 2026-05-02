import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@/components/ui";
import {
  transferStudentToCoach,
  bulkTransferCoachPortfolio,
} from "@/app/actions/coach-transfer";

async function singleTransferAction(formData: FormData) {
  "use server";
  const enrollmentId = formData.get("enrollmentId") as string;
  const newCoachId = formData.get("newCoachId") as string;
  const reason = (formData.get("reason") as string) || "Admin transfer";
  await transferStudentToCoach(enrollmentId, newCoachId, reason);
  revalidatePath("/admin/coach-transfers");
}

async function bulkTransferAction(formData: FormData) {
  "use server";
  const fromCoachId = formData.get("fromCoachId") as string;
  const toCoachId = formData.get("toCoachId") as string;
  const reason = (formData.get("reason") as string) || "Coach departure";
  await bulkTransferCoachPortfolio(fromCoachId, toCoachId, reason);
  revalidatePath("/admin/coach-transfers");
}

export default async function CoachTransfersPage() {
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
    redirect("/admin");
  }

  const { data: coaches } = await supabase
    .from("tutors_profile")
    .select("user_id, is_active")
    .order("is_active", { ascending: false });

  const coachIds = (coaches || []).map((c) => c.user_id);
  const { data: coachProfiles } =
    coachIds.length > 0
      ? await supabase
          .from("users_profile")
          .select("id, full_name")
          .in("id", coachIds)
      : { data: [] };

  const coachNameMap = new Map(
    (coachProfiles || []).map((p) => [p.id, p.full_name]),
  );
  const coachActiveMap = new Map(
    (coaches || []).map((c) => [c.user_id, c.is_active]),
  );

  const { data: enrollments } = await supabase
    .from("program_enrollments")
    .select("id, student_id, coach_id, program_id, status, enrolled_at")
    .eq("status", "active")
    .order("coach_id");

  const studentIds = [...new Set((enrollments || []).map((e) => e.student_id))];
  const { data: studentProfiles } =
    studentIds.length > 0
      ? await supabase
          .from("users_profile")
          .select("id, full_name")
          .in("id", studentIds)
      : { data: [] };

  const studentNameMap = new Map(
    (studentProfiles || []).map((p) => [p.id, p.full_name]),
  );

  const coachPortfolios = new Map<
    string,
    { enrollmentId: string; studentId: string; studentName: string }[]
  >();
  (enrollments || []).forEach((e) => {
    const existing = coachPortfolios.get(e.coach_id) || [];
    existing.push({
      enrollmentId: e.id,
      studentId: e.student_id,
      studentName: studentNameMap.get(e.student_id) || "Student",
    });
    coachPortfolios.set(e.coach_id, existing);
  });

  const activeCoaches = coachIds.filter((id) => coachActiveMap.get(id));

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Coach Transfers</h1>
        <p className="text-slate-600">
          Transfer students between coaches for emergencies, departures, or
          rebalancing.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">
            Bulk Transfer (Coach Departure)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={bulkTransferAction} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  From Coach (departing)
                </label>
                <select
                  name="fromCoachId"
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select coach...</option>
                  {coachIds.map((id) => (
                    <option key={id} value={id}>
                      {coachNameMap.get(id) || id} (
                      {coachPortfolios.get(id)?.length || 0} students)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  To Coach (receiving)
                </label>
                <select
                  name="toCoachId"
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select coach...</option>
                  {activeCoaches.map((id) => (
                    <option key={id} value={id}>
                      {coachNameMap.get(id) || id} (
                      {coachPortfolios.get(id)?.length || 0}/15)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <input
              type="text"
              name="reason"
              placeholder="Reason for transfer"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Transfer All Students
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Current Portfolios ({enrollments?.length || 0} active enrollments)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {coachIds.length === 0 ? (
            <p className="text-slate-500 text-sm">No coaches registered.</p>
          ) : (
            <div className="space-y-4">
              {coachIds.map((coachId) => {
                const portfolio = coachPortfolios.get(coachId) || [];
                const isActive = coachActiveMap.get(coachId);

                return (
                  <div
                    key={coachId}
                    className="border border-slate-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {coachNameMap.get(coachId) || "Coach"}
                        </h3>
                        <Badge variant={isActive ? "success" : "warning"}>
                          {isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <span className="text-sm text-slate-500">
                        {portfolio.length}/15 students
                      </span>
                    </div>

                    {portfolio.length > 0 ? (
                      <div className="space-y-2">
                        {portfolio.map((student) => (
                          <form
                            key={student.enrollmentId}
                            action={singleTransferAction}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="hidden"
                              name="enrollmentId"
                              value={student.enrollmentId}
                            />
                            <input
                              type="hidden"
                              name="reason"
                              value="Admin rebalance"
                            />
                            <span className="text-sm text-slate-700 flex-1">
                              {student.studentName}
                            </span>
                            <select
                              name="newCoachId"
                              className="text-xs border border-slate-200 rounded px-2 py-1"
                            >
                              <option value="">Transfer to...</option>
                              {activeCoaches
                                .filter((id) => id !== coachId)
                                .map((id) => (
                                  <option key={id} value={id}>
                                    {coachNameMap.get(id)} (
                                    {coachPortfolios.get(id)?.length || 0}
                                    /15)
                                  </option>
                                ))}
                            </select>
                            <button
                              type="submit"
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Transfer
                            </button>
                          </form>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No students</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
