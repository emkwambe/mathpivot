import { Card, CardContent } from "@/components/ui";

interface DosageProps {
  studentName: string;
  sessionsAttended: number;
  sessionsTarget: number;
  practiceDaysThisWeek: number;
  practiceDaysTarget: number;
  streakDays: number;
  missedSessions: number;
}

export function DosageCompliance({
  studentName,
  sessionsAttended,
  sessionsTarget,
  practiceDaysThisWeek,
  practiceDaysTarget,
  streakDays,
  missedSessions,
}: DosageProps) {
  const sessionPct =
    sessionsTarget > 0
      ? Math.min(Math.round((sessionsAttended / sessionsTarget) * 100), 100)
      : 0;
  const practicePct =
    practiceDaysTarget > 0
      ? Math.min(
          Math.round((practiceDaysThisWeek / practiceDaysTarget) * 100),
          100,
        )
      : 0;

  const overallCompliance = Math.round((sessionPct + practicePct) / 2);

  const complianceColor =
    overallCompliance >= 80
      ? "text-emerald-600"
      : overallCompliance >= 50
        ? "text-amber-600"
        : "text-red-600";

  const complianceBg =
    overallCompliance >= 80
      ? "bg-emerald-500"
      : overallCompliance >= 50
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">
              {studentName}
            </h3>
            <p className="text-xs text-slate-400">Dosage Compliance</p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${complianceColor}`}>
              {overallCompliance}%
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600">
                Sessions ({sessionsAttended}/{sessionsTarget} this month)
              </span>
              <span className="font-medium text-slate-900">{sessionPct}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${complianceBg}`}
                style={{ width: `${sessionPct}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600">
                Practice ({practiceDaysThisWeek}/{practiceDaysTarget} days this
                week)
              </span>
              <span className="font-medium text-slate-900">{practicePct}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${complianceBg}`}
                style={{ width: `${practicePct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3">
              {streakDays > 0 && (
                <span className="text-xs text-emerald-600 font-medium">
                  {streakDays}-day streak
                </span>
              )}
              {missedSessions > 0 && (
                <span className="text-xs text-red-500 font-medium">
                  {missedSessions} missed session
                  {missedSessions !== 1 ? "s" : ""}
                </span>
              )}
              {missedSessions === 0 && streakDays === 0 && (
                <span className="text-xs text-slate-400">
                  No data yet this month
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
