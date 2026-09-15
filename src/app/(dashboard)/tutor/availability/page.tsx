import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { revalidatePath } from "next/cache";

// Coaching modality: cohorts run in fixed windows so coaches slot into the
// same rhythm students expect. Weekday evenings hold up to 3 back-to-back
// 60-min cohorts starting 5:30 / 6:45 / 8:00 PM; Saturday morning holds up
// to 3 starting 10:00 / 11:15 / 12:30. Sun/Fri are off by design — no
// arbitrary times, no 9-to-5 rows.
const COHORT_SLOTS: Record<
  number,
  { start: string; end: string; label: string }[]
> = {
  1: [
    { start: "17:30:00", end: "18:30:00", label: "5:30 PM" },
    { start: "18:45:00", end: "19:45:00", label: "6:45 PM" },
    { start: "20:00:00", end: "21:00:00", label: "8:00 PM" },
  ],
  2: [
    { start: "17:30:00", end: "18:30:00", label: "5:30 PM" },
    { start: "18:45:00", end: "19:45:00", label: "6:45 PM" },
    { start: "20:00:00", end: "21:00:00", label: "8:00 PM" },
  ],
  3: [
    { start: "17:30:00", end: "18:30:00", label: "5:30 PM" },
    { start: "18:45:00", end: "19:45:00", label: "6:45 PM" },
    { start: "20:00:00", end: "21:00:00", label: "8:00 PM" },
  ],
  4: [
    { start: "17:30:00", end: "18:30:00", label: "5:30 PM" },
    { start: "18:45:00", end: "19:45:00", label: "6:45 PM" },
    { start: "20:00:00", end: "21:00:00", label: "8:00 PM" },
  ],
  6: [
    { start: "10:00:00", end: "11:00:00", label: "10:00 AM" },
    { start: "11:15:00", end: "12:15:00", label: "11:15 AM" },
    { start: "12:30:00", end: "13:30:00", label: "12:30 PM" },
  ],
};

// Ordered display: Mon → Sat (skip Sun/Fri — no cohorts run those days).
const DISPLAY_ORDER: { dayIndex: number; label: string }[] = [
  { dayIndex: 1, label: "Monday" },
  { dayIndex: 2, label: "Tuesday" },
  { dayIndex: 3, label: "Wednesday" },
  { dayIndex: 4, label: "Thursday" },
  { dayIndex: 6, label: "Saturday" },
];

const MAX_COHORTS_PER_COACH = 3;

// Slot equality key so we can compare stored rows against the fixed grid.
function slotKey(dayIndex: number, start: string): string {
  return `${dayIndex}|${start.slice(0, 8)}`;
}

async function toggleSlotAction(formData: FormData) {
  "use server";

  const { getCurrentUser } = await import("@/lib/auth");
  const { createClient } = await import("@/lib/supabase/server");

  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") return;

  const supabase = await createClient();
  const dayOfWeek = Number.parseInt(formData.get("dayOfWeek") as string, 10);
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const existingId = (formData.get("existingId") as string) || "";

  if (existingId) {
    await supabase
      .from("availability_rules")
      .delete()
      .eq("id", existingId)
      .eq("tutor_user_id", user.id);
  } else {
    // Enforce cohort ceiling: never let a coach open more than 3 slots
    // total (matches MAX_COHORTS_PER_COACH from CLAUDE.md).
    const { count } = await supabase
      .from("availability_rules")
      .select("id", { count: "exact", head: true })
      .eq("tutor_user_id", user.id)
      .eq("is_active", true);
    if ((count ?? 0) >= MAX_COHORTS_PER_COACH) return;

    await supabase.from("availability_rules").insert({
      tutor_user_id: user.id,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      is_active: true,
    });
  }

  revalidatePath("/tutor/availability");
}

async function addBlockedDateAction(formData: FormData) {
  "use server";

  const { getCurrentUser } = await import("@/lib/auth");
  const { createClient } = await import("@/lib/supabase/server");

  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") return;

  const supabase = await createClient();

  const { error } = await supabase.from("availability_exceptions").insert({
    tutor_user_id: user.id,
    exception_date: formData.get("exceptionDate") as string,
    is_available: false,
    reason: (formData.get("reason") as string) || null,
  });

  if (error) console.error("Failed to add blocked date:", error);
  revalidatePath("/tutor/availability");
}

async function removeBlockedDateAction(blockId: string) {
  "use server";

  const { getCurrentUser } = await import("@/lib/auth");
  const { createClient } = await import("@/lib/supabase/server");

  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") return;

  const supabase = await createClient();

  await supabase
    .from("availability_exceptions")
    .delete()
    .eq("id", blockId)
    .eq("tutor_user_id", user.id);

  revalidatePath("/tutor/availability");
}

export default async function AvailabilityPage() {
  const user = await requireRole("tutor");
  const supabase = await createClient();

  const { data: availability } = await supabase
    .from("availability_rules")
    .select("id, day_of_week, start_time, end_time, is_active")
    .eq("tutor_user_id", user.id)
    .eq("is_active", true);

  // Index selections by (day, start) so the button grid can flip a slot in O(1).
  const activeMap = new Map<string, string>(); // key → row id
  (availability ?? []).forEach((row) => {
    activeMap.set(
      slotKey(row.day_of_week as number, row.start_time as string),
      row.id as string,
    );
  });
  const selectedCount = activeMap.size;
  const atCap = selectedCount >= MAX_COHORTS_PER_COACH;

  const today = new Date().toISOString().split("T")[0];
  const { data: blockedDates } = await supabase
    .from("availability_exceptions")
    .select("*")
    .eq("tutor_user_id", user.id)
    .eq("is_available", false)
    .gte("exception_date", today)
    .order("exception_date", { ascending: true })
    .limit(10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Cohort Availability
        </h1>
        <p className="text-slate-600">
          Pick the cohort slots you can commit to. Each cohort is a 60-min
          session that runs every week at the same time.
        </p>
        <p className="text-sm text-slate-500 mt-1">
          {selectedCount} of {MAX_COHORTS_PER_COACH} cohorts selected
          {atCap && (
            <span className="ml-2 inline-block text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              at cap — remove one to add another
            </span>
          )}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Cohort Slots</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DISPLAY_ORDER.map(({ dayIndex, label }) => {
              const slots = COHORT_SLOTS[dayIndex] ?? [];
              return (
                <div
                  key={dayIndex}
                  className="border-b border-slate-100 pb-4 last:border-0"
                >
                  <h3 className="font-medium text-slate-900 mb-2">{label}</h3>
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot) => {
                      const key = slotKey(dayIndex, slot.start);
                      const existingId = activeMap.get(key) ?? "";
                      const selected = existingId !== "";
                      const disabledForCap = !selected && atCap;
                      return (
                        <form key={key} action={toggleSlotAction}>
                          <input
                            type="hidden"
                            name="dayOfWeek"
                            value={dayIndex}
                          />
                          <input
                            type="hidden"
                            name="startTime"
                            value={slot.start}
                          />
                          <input
                            type="hidden"
                            name="endTime"
                            value={slot.end}
                          />
                          <input
                            type="hidden"
                            name="existingId"
                            value={existingId}
                          />
                          <button
                            type="submit"
                            disabled={disabledForCap}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                              selected
                                ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                                : disabledForCap
                                  ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {slot.label}
                          </button>
                        </form>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Cohorts run Mon&ndash;Thu evenings and Saturday mornings. Sunday and
            Friday are off by design. Sessions are 60 minutes with 15-min breaks
            between back-to-back cohorts.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Blocked Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <form
              action={addBlockedDateAction}
              className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-lg"
            >
              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Date to Block
                </label>
                <input
                  type="date"
                  name="exceptionDate"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  name="reason"
                  placeholder="e.g., Vacation, Appointment"
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" size="sm">
                  Block Date
                </Button>
              </div>
            </form>

            {blockedDates && blockedDates.length > 0 ? (
              <div className="space-y-2">
                {blockedDates.map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {formatDate(block.exception_date, "EEEE, MMMM d, yyyy")}
                      </p>
                      {block.reason && (
                        <p className="text-sm text-slate-600">{block.reason}</p>
                      )}
                    </div>
                    <form action={removeBlockedDateAction.bind(null, block.id)}>
                      <button
                        type="submit"
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">
                No blocked dates scheduled.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
