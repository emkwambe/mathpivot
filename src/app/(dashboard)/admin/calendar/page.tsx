import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getCalendarEvents, getRecurringSeries } from '@/app/actions/recurring';
import { CalendarView } from './CalendarView';

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const params = await searchParams;

  // Default to current week
  const now = new Date();
  const weekStart = params.week ? new Date(params.week) : getMonday(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { events, error } = await getCalendarEvents(
    weekStart.toISOString(),
    weekEnd.toISOString()
  );

  const { series } = await getRecurringSeries();
  const activeSeries = series.filter((s: unknown) => s.is_active);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="text-sm text-slate-500">Visual schedule for all sessions</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="inline-block w-3 h-3 rounded bg-blue-500" /> 1-on-1
          <span className="inline-block w-3 h-3 rounded bg-purple-500 ml-2" /> Group
          <span className="inline-block w-3 h-3 rounded bg-green-500 ml-2" /> Completed
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Recurring series summary */}
      {activeSeries.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Active Recurring Series ({activeSeries.length})</h3>
          <div className="flex flex-wrap gap-2">
            {activeSeries.map((s: unknown) => (
              <span key={s.id} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg px-2.5 py-1">
                {s.title || s.subject || 'Session'} — {s.tutor?.full_name} ({s.pattern}, {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][s.day_of_week]})
              </span>
            ))}
          </div>
        </div>
      )}

      <CalendarView events={events} weekStart={weekStart.toISOString()} />
    </div>
  );
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

