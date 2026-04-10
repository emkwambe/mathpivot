'use client';

import { useRouter } from 'next/navigation';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  status: string;
  modality: string;
  isGroup: boolean;
  room: string | null;
  tutorName: string;
  studentName: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  weekStart: string;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarView({ events, weekStart }: CalendarViewProps) {
  const router = useRouter();
  const startDate = new Date(weekStart);

  function navigateWeek(delta: number) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + delta * 7);
    router.push(`/admin/calendar?week=${d.toISOString().split('T')[0]}`);
  }

  // Map events to day/hour grid
  function getEventsForDayHour(dayIndex: number, hour: number) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + dayIndex);

    return events.filter(e => {
      const eStart = new Date(e.start);
      return eStart.getDay() === (dayIndex === 6 ? 0 : dayIndex + 1) &&
             eStart.getHours() === hour &&
             eStart.getDate() === dayDate.getDate();
    });
  }

  function getDateForDay(dayIndex: number) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + dayIndex);
    return d;
  }

  const weekLabel = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${getDateForDay(6).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Week Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <button
          onClick={() => navigateWeek(-1)}
          className="text-slate-500 hover:text-slate-700 p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="font-semibold text-slate-900">{weekLabel}</h2>
        <button
          onClick={() => navigateWeek(1)}
          className="text-slate-500 hover:text-slate-700 p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b border-slate-200">
            <div className="px-2 py-2 text-xs text-slate-400 border-r border-slate-100" />
            {DAYS.map((day, i) => {
              const d = getDateForDay(i);
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <div
                  key={day}
                  className={`px-2 py-2 text-center border-r border-slate-100 last:border-r-0 ${
                    isToday ? 'bg-blue-50' : ''
                  }`}
                >
                  <p className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>{day}</p>
                  <p className={`text-sm font-semibold ${isToday ? 'text-blue-700' : 'text-slate-900'}`}>
                    {d.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time Rows */}
          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-slate-50 min-h-[60px]">
              {/* Time Label */}
              <div className="px-2 py-1 text-[11px] text-slate-400 border-r border-slate-100 text-right pt-1">
                {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
              </div>

              {/* Day Cells */}
              {DAYS.map((_, dayIndex) => {
                const cellEvents = getEventsForDayHour(dayIndex, hour);
                const isToday = getDateForDay(dayIndex).toDateString() === new Date().toDateString();

                return (
                  <div
                    key={dayIndex}
                    className={`border-r border-slate-50 last:border-r-0 p-0.5 ${
                      isToday ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {cellEvents.map(event => (
                      <div
                        key={event.id}
                        className={`rounded px-1.5 py-1 mb-0.5 cursor-pointer text-[11px] leading-tight truncate ${
                          event.status === 'completed'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : event.isGroup
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                        title={`${event.title}\n${event.room ? `Room: ${event.room}` : event.modality}\n${new Date(event.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${new Date(event.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                      >
                        <p className="font-medium truncate">{event.title}</p>
                        {event.room && (
                          <p className="text-[9px] opacity-70">{event.room}</p>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
