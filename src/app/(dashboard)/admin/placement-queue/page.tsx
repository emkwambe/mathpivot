import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Badge } from "@/components/ui";
import {
  getPlacementQueue,
  getSuggestionsForTier,
  placeStudent,
  type UnplacedRow,
  type SuggestedSchedule,
} from "@/app/actions/placement";
import { PROGRAMS } from "@/lib/stripe/programs";

async function placeAction(formData: FormData) {
  "use server";
  await placeStudent({
    subscriptionId: formData.get("subscriptionId") as string,
    scheduleId: formData.get("scheduleId") as string,
  });
  revalidatePath("/admin/placement-queue");
}

const DAY_SHORT: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

function formatTime(t: string): string {
  // HH:MM:SS → h:MM AM/PM
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

const TIER_COLORS: Record<string, string> = {
  foundation: "bg-blue-50 text-blue-800 border-blue-200",
  acceleration: "bg-amber-50 text-amber-800 border-amber-200",
  advanced: "bg-purple-50 text-purple-800 border-purple-200",
};

export default async function PlacementQueuePage() {
  const queue = await getPlacementQueue();

  // Fetch suggestions per tier up front so we do one query per tier
  // rather than N per row. The page usually shows a small queue.
  const tiers = Array.from(new Set(queue.map((q) => q.program_tier)));
  const suggestionsByTier = new Map<string, SuggestedSchedule[]>();
  for (const tier of tiers) {
    suggestionsByTier.set(tier, await getSuggestionsForTier(tier));
  }

  const groupedByTier = queue.reduce<Record<string, UnplacedRow[]>>(
    (acc, row) => {
      (acc[row.program_tier] ??= []).push(row);
      return acc;
    },
    {},
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Placement Queue</h1>
        <p className="text-sm text-slate-600 mt-1">
          Families who have paid but have not yet been placed in a coach&apos;s
          weekly cohort. Auto-suggested schedules appear below each student —
          click to place. When a cohort hits five students, spin up a second
          cohort for the same coach and program at another time.
        </p>
      </div>

      {queue.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="text-sm text-slate-500">
            Nothing to place. Every paying family is currently assigned to a
            cohort.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {tiers.map((tier) => {
            const rows = groupedByTier[tier] ?? [];
            const suggestions = suggestionsByTier.get(tier) ?? [];
            const programName =
              PROGRAMS[tier as keyof typeof PROGRAMS]?.name ?? tier;
            return (
              <section key={tier}>
                <div className="flex items-baseline justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">
                      {programName}
                    </h2>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${TIER_COLORS[tier] ?? "bg-slate-50 text-slate-700 border-slate-200"}`}
                    >
                      {tier}
                    </span>
                    <span className="text-xs text-slate-500">
                      · {rows.length} waiting
                    </span>
                  </div>
                  {suggestions.length === 0 && (
                    <Link
                      href="/admin/schedules"
                      className="text-xs text-blue-700 hover:underline"
                    >
                      Create a cohort schedule →
                    </Link>
                  )}
                </div>

                <div className="space-y-3">
                  {rows.map((row) => (
                    <QueueRow
                      key={row.subscription_id}
                      row={row}
                      suggestions={suggestions}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );

  function QueueRow({
    row,
    suggestions,
  }: {
    row: UnplacedRow;
    suggestions: SuggestedSchedule[];
  }) {
    const waitingDays = Math.floor(
      (Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60 * 24),
    );
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900">
              {row.student_name || "(unnamed student)"}
              {row.student_grade != null && (
                <span className="font-normal text-slate-500 text-sm ml-2">
                  Grade {row.student_grade}
                </span>
              )}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Parent: {row.parent_name || row.parent_email || "unknown"}
              {row.parent_email && row.parent_name && ` · ${row.parent_email}`}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-emerald-100 text-emerald-700">
                {row.status}
              </Badge>
              <span className="text-xs text-slate-500">
                Waiting {waitingDays}d
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            Suggested placement
          </p>
          {suggestions.length === 0 ? (
            <p className="text-sm text-amber-800">
              No cohort schedule exists for this tier with capacity. Create one
              in{" "}
              <Link
                href="/admin/schedules"
                className="text-blue-700 hover:underline"
              >
                Admin → Schedules
              </Link>
              , then return here to place this student.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {suggestions.map((s) => (
                <form
                  key={s.schedule_id}
                  action={placeAction}
                  className="rounded-lg border border-slate-200 p-3 hover:border-blue-400 transition-colors"
                >
                  <input
                    type="hidden"
                    name="subscriptionId"
                    value={row.subscription_id}
                  />
                  <input
                    type="hidden"
                    name="scheduleId"
                    value={s.schedule_id}
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {s.coach_name || s.coach_email}
                      </p>
                      <p className="text-xs text-slate-600">
                        {DAY_SHORT[s.day_of_week] ?? s.day_of_week} ·{" "}
                        {formatTime(s.start_time)}
                        {" – "}
                        {formatTime(s.end_time)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {s.cohort_label} · {s.enrolled_count} of{" "}
                        {s.max_capacity} enrolled
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                        s.fill_status === "open"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {s.fill_status}
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="mt-3 w-full py-1.5 bg-blue-700 text-white text-xs font-semibold rounded-md hover:bg-blue-800"
                  >
                    Place here
                  </button>
                </form>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}
