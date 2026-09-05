import Link from "next/link";
import { listCoaches } from "@/app/actions/coach-roster";
import { lifecycleStage, type CoachRosterRow } from "@/lib/coach-roster";
import { Badge } from "@/components/ui";

const STAGE_LABELS: Record<string, string> = {
  active: "Active",
  certified_not_active: "Certified · awaiting activation",
  in_training: "In training",
  onboarding: "Onboarding",
  invited_no_login: "Invited",
  inactive: "Inactive",
};

const STAGE_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  certified_not_active: "bg-blue-100 text-blue-700",
  in_training: "bg-amber-100 text-amber-700",
  onboarding: "bg-amber-50 text-amber-700",
  invited_no_login: "bg-slate-100 text-slate-600",
  inactive: "bg-slate-100 text-slate-500",
};

const FILTER_TABS = [
  { key: "all", label: "All coaches" },
  { key: "active", label: "Active" },
  { key: "in_training", label: "In training" },
  { key: "certified_not_active", label: "Awaiting activation" },
  { key: "onboarding", label: "Onboarding" },
];

export default async function AdminCoachesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const activeFilter = filter || "all";

  const all = await listCoaches();
  const rows =
    activeFilter === "all"
      ? all
      : all.filter((c) => lifecycleStage(c) === activeFilter);

  const counts = {
    total: all.length,
    active: all.filter((c) => lifecycleStage(c) === "active").length,
    inTraining: all.filter((c) => lifecycleStage(c) === "in_training").length,
    awaitingActivation: all.filter(
      (c) => lifecycleStage(c) === "certified_not_active",
    ).length,
  };

  const upcomingBookings = all.reduce(
    (sum, c) => sum + c.activity.upcoming_bookings,
    0,
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Coach Roster</h1>
        <p className="text-sm text-slate-600 mt-1">
          Every coach's onboarding, certification, and current activity in one
          place.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatTile value={counts.total} label="Total coaches" />
        <StatTile value={counts.active} label="Active" tone="emerald" />
        <StatTile
          value={counts.inTraining + counts.awaitingActivation}
          label="In pipeline"
          tone="amber"
        />
        <StatTile
          value={upcomingBookings}
          label="Upcoming sessions"
          tone="blue"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5 border-b border-slate-200">
        {FILTER_TABS.map((tab) => {
          const active = tab.key === activeFilter;
          return (
            <Link
              key={tab.key}
              href={`/admin/coaches?filter=${tab.key}`}
              className={`px-3 py-2 text-sm border-b-2 -mb-px ${
                active
                  ? "border-blue-700 text-blue-700 font-semibold"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-500">
          No coaches match this filter yet.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((c) => (
            <CoachRow key={c.id} coach={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatTile({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone?: "emerald" | "amber" | "blue";
}) {
  const color = {
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    blue: "text-blue-700",
  }[tone ?? "amber"];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className={`text-2xl font-bold ${tone ? color : "text-slate-900"}`}>
        {value}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function CoachRow({ coach }: { coach: CoachRosterRow }) {
  const stage = lifecycleStage(coach);
  const pct = Math.round(
    (coach.onboarding.steps_done / coach.onboarding.steps_total) * 100,
  );
  const initials = (coach.full_name || coach.email).slice(0, 2).toUpperCase();

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-900 truncate">
              {coach.full_name || coach.email}
            </h3>
            <Badge className={STAGE_COLORS[stage]}>{STAGE_LABELS[stage]}</Badge>
            {coach.certified.tier === "master" &&
              coach.certified.status === "approved" && (
                <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border bg-purple-50 text-purple-800 border-purple-200">
                  Master Coach
                </span>
              )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{coach.email}</p>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <MiniStat
              label="Onboarding"
              value={`${coach.onboarding.steps_done}/${coach.onboarding.steps_total}`}
              pct={pct}
            />
            <MiniStat
              label="Training"
              value={`${coach.training.completed}/${coach.training.required || "?"}`}
            />
            <MiniStat
              label="Upcoming"
              value={String(coach.activity.upcoming_bookings)}
              suffix="sessions"
            />
            <MiniStat
              label="All-time"
              value={String(coach.activity.total_bookings)}
              suffix="sessions"
            />
          </div>

          <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
            <Dot ok={coach.onboarding.background_check_attested}>
              BG attested
            </Dot>
            <Dot ok={coach.onboarding.admin_verified_background}>
              BG verified
            </Dot>
            <Dot ok={coach.onboarding.code_of_conduct_accepted}>
              Code of Conduct
            </Dot>
            <Dot ok={coach.certified.status === "approved"}>Certified</Dot>
            <Dot ok={coach.onboarding.activated}>Activated</Dot>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  suffix,
  pct,
}: {
  label: string;
  value: string;
  suffix?: string;
  pct?: number;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
        {label}
      </p>
      <p className="text-sm text-slate-800 font-medium">
        {value}
        {suffix && (
          <span className="text-[11px] font-normal text-slate-500 ml-1">
            {suffix}
          </span>
        )}
      </p>
      {pct != null && (
        <div className="mt-1 w-full bg-slate-100 rounded-full h-1">
          <div
            className="bg-blue-600 h-1 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

function Dot({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full ${
          ok ? "bg-emerald-500" : "bg-slate-300"
        }`}
      />
      <span className={ok ? "text-slate-700" : "text-slate-400"}>
        {children}
      </span>
    </span>
  );
}
