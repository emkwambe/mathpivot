import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { getAllSchedules, createSchedule } from "@/app/actions/schedules";
import { revalidatePath } from "next/cache";

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const DAY_SHORT: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const PROGRAMS = [
  { slug: "propel-7", name: "Propel Math 7" },
  { slug: "advantage-8", name: "Advantage Math 8" },
  { slug: "ignite-math1", name: "Ignite Math 1" },
  { slug: "ascent-precalc", name: "Ascent Pre-Calc" },
];

const TIME_SLOTS = [
  { value: "10:00", label: "10:00 AM" },
  { value: "11:15", label: "11:15 AM" },
  { value: "17:30", label: "5:30 PM" },
  { value: "18:45", label: "6:45 PM" },
];

async function createScheduleAction(formData: FormData) {
  "use server";
  await createSchedule({
    coachId: formData.get("coachId") as string,
    programSlug: formData.get("programSlug") as string,
    cohortLabel: formData.get("cohortLabel") as string,
    dayOfWeek: formData.get("dayOfWeek") as string,
    startTime: formData.get("startTime") as string,
    endTime: formData.get("endTime") as string,
    isSummerClinic: formData.get("isSummerClinic") === "true",
  });
  revalidatePath("/admin/schedules");
}

export default async function SchedulesPage() {
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

  const schedules = await getAllSchedules();

  const { data: coaches } = await supabase
    .from("users_profile")
    .select("id, full_name")
    .eq("role", "tutor");

  const coachMap = new Map((coaches || []).map((c) => [c.id, c.full_name]));

  const byCoach = new Map<string, typeof schedules>();
  for (const s of schedules) {
    const existing = byCoach.get(s.coach_id) || [];
    existing.push(s);
    byCoach.set(s.coach_id, existing);
  }

  const fillColors: Record<string, string> = {
    open: "bg-green-100 text-green-800",
    overflow: "bg-amber-100 text-amber-800",
    full: "bg-red-100 text-red-800",
  };

  const totalStudents = schedules.reduce((sum, s) => sum + s.enrolled_count, 0);
  const totalWaitlisted = schedules.reduce(
    (sum, s) => sum + s.waitlisted_count,
    0,
  );

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Coaching Schedules
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Manage cohorts, assign coaches, and track capacity across all
            programs.
          </p>
        </div>
        <Link
          href="/admin/summer-waitlist"
          className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
        >
          Summer Waitlist
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {schedules.length}
          </p>
          <p className="text-xs text-slate-500">Active Cohorts</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{totalStudents}</p>
          <p className="text-xs text-slate-500">Enrolled Students</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{totalWaitlisted}</p>
          <p className="text-xs text-slate-500">Waitlisted</p>
        </div>
      </div>

      {byCoach.size > 0 && (
        <div className="space-y-6 mb-8">
          {Array.from(byCoach.entries()).map(([coachId, coachSchedules]) => {
            const programs = new Set(coachSchedules.map((s) => s.program_slug));
            const isMixed = programs.size > 1;

            return (
              <div
                key={coachId}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-700 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {(coachMap.get(coachId) || "C").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {coachMap.get(coachId) || "Coach"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {coachSchedules.length} cohort
                        {coachSchedules.length !== 1 ? "s" : ""}
                        {isMixed && (
                          <span className="text-amber-600 ml-1">
                            (mixed programs)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">
                    {coachSchedules.reduce((s, c) => s + c.enrolled_count, 0)}{" "}
                    students
                  </p>
                </div>

                <div className="divide-y divide-slate-50">
                  {coachSchedules
                    .sort(
                      (a, b) =>
                        DAY_ORDER.indexOf(a.day_of_week) -
                        DAY_ORDER.indexOf(b.day_of_week),
                    )
                    .map((s) => (
                      <div
                        key={s.schedule_id}
                        className="px-5 py-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-mono text-slate-400 w-8">
                            {DAY_SHORT[s.day_of_week]}
                          </span>
                          <span className="text-sm text-slate-700">
                            {s.start_time.slice(0, 5)} –{" "}
                            {s.end_time.slice(0, 5)}
                          </span>
                          <Badge className="bg-blue-50 text-blue-700 text-xs">
                            {s.program_slug}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {s.cohort_label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-700">
                            {s.enrolled_count}/{s.default_capacity}
                            {s.enrolled_count > s.default_capacity && (
                              <span className="text-amber-600">
                                {" "}
                                (+{s.enrolled_count - s.default_capacity})
                              </span>
                            )}
                          </span>
                          <Badge
                            className={
                              fillColors[s.fill_status] || "bg-slate-100"
                            }
                          >
                            {s.fill_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          Create Schedule
        </h2>
        <form
          action={createScheduleAction}
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Coach *
            </label>
            <select
              name="coachId"
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select coach</option>
              {(coaches || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Program *
            </label>
            <select
              name="programSlug"
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select program</option>
              {PROGRAMS.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cohort Label
            </label>
            <input
              name="cohortLabel"
              defaultValue="Group A"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Day *
            </label>
            <select
              name="dayOfWeek"
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              {DAY_ORDER.slice(0, 6).map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Start Time *
            </label>
            <select
              name="startTime"
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              {TIME_SLOTS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              End Time *
            </label>
            <select
              name="endTime"
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              {[
                { value: "11:00", label: "11:00 AM" },
                { value: "12:15", label: "12:15 PM" },
                { value: "18:30", label: "6:30 PM" },
                { value: "19:45", label: "7:45 PM" },
              ].map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isSummerClinic"
                value="true"
                className="rounded text-orange-500"
              />
              Summer clinic
            </label>
          </div>

          <div className="flex items-end col-span-2 md:col-span-1">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors"
            >
              Create Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
