import Link from "next/link";
import { AlertTriangle, Sparkles } from "lucide-react";
import type { CohortNudge } from "@/app/actions/cohort-nudges";
import { PROGRAMS } from "@/lib/stripe/programs";

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
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Prominent "spin up another cohort" prompt. Rendered atop the coach
// roster and the placement queue. Shows nothing when there are no
// cohorts at or over target — silent by design.
export function CohortNudges({ nudges }: { nudges: CohortNudge[] }) {
  if (nudges.length === 0) return null;

  const hasFull = nudges.some((n) => n.full_count > 0);

  return (
    <section
      className={`mb-6 rounded-2xl border p-5 ${
        hasFull ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
      }`}
    >
      <div className="flex items-start gap-3">
        {hasFull ? (
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
        ) : (
          <Sparkles className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h2
            className={`text-sm font-bold ${
              hasFull ? "text-red-900" : "text-amber-900"
            }`}
          >
            {hasFull
              ? "Cohorts at maximum — new families cannot be placed"
              : "Time to spin up another cohort"}
          </h2>
          <p
            className={`text-sm mt-1 ${
              hasFull ? "text-red-800" : "text-amber-800"
            }`}
          >
            {hasFull
              ? "One or more cohorts have hit six students (the max). Any new enrollment in that tier needs a fresh cohort. "
              : "One or more cohorts have hit five students (your target). Consider adding a second cohort at another time for the same coach + program so growth continues without exceeding the six-student max. "}
            Create a new cohort in{" "}
            <Link
              href="/admin/schedules"
              className={`font-semibold underline ${
                hasFull ? "text-red-900" : "text-amber-900"
              }`}
            >
              Admin → Schedules
            </Link>
            .
          </p>

          <ul className="mt-4 space-y-2">
            {nudges.map((n) => {
              const programName =
                PROGRAMS[n.program_slug as keyof typeof PROGRAMS]?.name ??
                n.program_slug;
              return (
                <li
                  key={`${n.coach_id}|${n.program_slug}`}
                  className="rounded-lg bg-white/70 border border-white p-3"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {n.coach_name || n.coach_email || "Coach"} ·{" "}
                        <span className="text-slate-700">{programName}</span>
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {n.schedules.map((s, i) => (
                          <span key={s.schedule_id}>
                            {i > 0 && " · "}
                            {s.cohort_label} —{" "}
                            {DAY_SHORT[s.day_of_week] ?? s.day_of_week}{" "}
                            {formatTime(s.start_time)}{" "}
                            <span
                              className={`font-semibold ${
                                s.fill_status === "full"
                                  ? "text-red-700"
                                  : "text-amber-700"
                              }`}
                            >
                              ({s.enrolled_count}/{s.max_capacity})
                            </span>
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
