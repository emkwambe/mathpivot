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
import { formatDate } from "@/lib/utils";
import { startOfWeek, endOfWeek } from "date-fns";

async function logPracticeAction(formData: FormData) {
  "use server";

  const { getCurrentUser } = await import("@/lib/auth");
  const { createClient } = await import("@/lib/supabase/server");

  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  const duration = parseInt(formData.get("duration") as string) || 0;
  const description = formData.get("description") as string;
  const practiceDate =
    (formData.get("practiceDate") as string) ||
    new Date().toISOString().split("T")[0];

  if (duration <= 0) return;

  const loggedBy =
    user.role === "parent"
      ? user.id
      : user.role === "student"
        ? user.id
        : user.id;

  const studentId =
    user.role === "student"
      ? user.id
      : (formData.get("studentId") as string) || user.id;

  await supabase.from("practice_logs").upsert(
    {
      student_id: studentId,
      practice_date: practiceDate,
      duration_minutes: duration,
      description: description || null,
      logged_by: loggedBy,
    },
    { onConflict: "student_id,practice_date" },
  );

  revalidatePath("/student/practice");
}

export default async function PracticeLogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const { data: thisWeekLogs } = await supabase
    .from("practice_logs")
    .select("*")
    .eq("student_id", user.id)
    .gte("practice_date", weekStart.toISOString().split("T")[0])
    .lte("practice_date", weekEnd.toISOString().split("T")[0])
    .order("practice_date", { ascending: false });

  const { data: recentLogs } = await supabase
    .from("practice_logs")
    .select("*")
    .eq("student_id", user.id)
    .order("practice_date", { ascending: false })
    .limit(14);

  const daysThisWeek = (thisWeekLogs || []).length;
  const totalMinutesThisWeek = (thisWeekLogs || []).reduce(
    (sum, l) => sum + (l.duration_minutes || 0),
    0,
  );

  const { data: enrollment } = await supabase
    .from("program_enrollments")
    .select("target_practice_days_per_week")
    .eq("student_id", user.id)
    .eq("status", "active")
    .limit(1)
    .single();

  const targetDays = enrollment?.target_practice_days_per_week || 3;

  let streak = 0;
  if (recentLogs && recentLogs.length > 0) {
    const today = new Date().toISOString().split("T")[0];
    const logDates = new Set(recentLogs.map((l) => l.practice_date));
    const checkDate = new Date();
    if (!logDates.has(today)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (logDates.has(checkDate.toISOString().split("T")[0])) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const loggedToday = (thisWeekLogs || []).some(
    (l) => l.practice_date === todayStr,
  );

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Practice Log</h1>
        <p className="text-slate-600">
          Log your daily practice to build consistency and show your coach
          you&apos;re putting in the work.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {daysThisWeek}/{targetDays}
            </p>
            <p className="text-xs text-slate-500">Days this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {totalMinutesThisWeek}
            </p>
            <p className="text-xs text-slate-500">Minutes this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold text-amber-600">{streak}</p>
            <p className="text-xs text-slate-500">Day streak</p>
          </CardContent>
        </Card>
      </div>

      {!loggedToday && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">
              Log Today&apos;s Practice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={logPracticeAction} className="space-y-3">
              <input type="hidden" name="practiceDate" value={todayStr} />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">
                    Minutes practiced
                  </label>
                  <input
                    type="number"
                    name="duration"
                    min="5"
                    max="180"
                    defaultValue="30"
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex-[2]">
                  <label className="block text-xs text-slate-500 mb-1">
                    What did you work on?
                  </label>
                  <input
                    type="text"
                    name="description"
                    placeholder="e.g., Fraction division practice problems"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Log Practice
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {loggedToday && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-center">
          <p className="text-emerald-800 font-medium text-sm">
            Practice logged for today! Keep the streak going.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Practice</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs && recentLogs.length > 0 ? (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {formatDate(log.practice_date, "EEE, MMM d")}
                    </p>
                    {log.description && (
                      <p className="text-xs text-slate-500">
                        {log.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">
                      {log.duration_minutes} min
                    </span>
                    {log.verified_by_coach && (
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">
              No practice logged yet. Start today!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
