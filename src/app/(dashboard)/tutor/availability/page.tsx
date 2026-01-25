import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

async function addAvailabilityAction(formData: FormData) {
  'use server';

  const { getCurrentUser } = await import('@/lib/auth');
  const { createClient } = await import('@/lib/supabase/server');

  const user = await getCurrentUser();
  if (!user || user.role !== 'tutor') return;

  const supabase = await createClient();

  const { error } = await supabase
    .from('availability_rules')
    .insert({
      tutor_user_id: user.id,
      day_of_week: parseInt(formData.get('dayOfWeek') as string, 10),
      start_time: formData.get('startTime') as string,
      end_time: formData.get('endTime') as string,
      is_active: true,
    });

  if (error) {
    console.error('Failed to add availability:', error);
  }

  revalidatePath('/tutor/availability');
}

async function removeAvailabilityAction(slotId: string) {
  'use server';

  const { getCurrentUser } = await import('@/lib/auth');
  const { createClient } = await import('@/lib/supabase/server');

  const user = await getCurrentUser();
  if (!user || user.role !== 'tutor') return;

  const supabase = await createClient();

  await supabase
    .from('availability_rules')
    .delete()
    .eq('id', slotId)
    .eq('tutor_user_id', user.id);

  revalidatePath('/tutor/availability');
}

async function addBlockedDateAction(formData: FormData) {
  'use server';

  const { getCurrentUser } = await import('@/lib/auth');
  const { createClient } = await import('@/lib/supabase/server');

  const user = await getCurrentUser();
  if (!user || user.role !== 'tutor') return;

  const supabase = await createClient();

  const { error } = await supabase
    .from('availability_exceptions')
    .insert({
      tutor_user_id: user.id,
      exception_date: formData.get('exceptionDate') as string,
      is_available: false,
      reason: (formData.get('reason') as string) || null,
    });

  if (error) {
    console.error('Failed to add blocked date:', error);
  }

  revalidatePath('/tutor/availability');
}

async function removeBlockedDateAction(blockId: string) {
  'use server';

  const { getCurrentUser } = await import('@/lib/auth');
  const { createClient } = await import('@/lib/supabase/server');

  const user = await getCurrentUser();
  if (!user || user.role !== 'tutor') return;

  const supabase = await createClient();

  await supabase
    .from('availability_exceptions')
    .delete()
    .eq('id', blockId)
    .eq('tutor_user_id', user.id);

  revalidatePath('/tutor/availability');
}

export default async function AvailabilityPage() {
  const user = await requireRole('tutor');
  const supabase = await createClient();

  // Get tutor's availability rules
  const { data: availability, error: availError } = await supabase
    .from('availability_rules')
    .select('*')
    .eq('tutor_user_id', user.id)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (availError) {
    console.error('Failed to fetch availability:', availError);
  }

  // Get upcoming blocked dates (exceptions where is_available = false)
  const today = new Date().toISOString().split('T')[0];
  const { data: blockedDates, error: blockedError } = await supabase
    .from('availability_exceptions')
    .select('*')
    .eq('tutor_user_id', user.id)
    .eq('is_available', false)
    .gte('exception_date', today)
    .order('exception_date', { ascending: true })
    .limit(10);

  if (blockedError) {
    console.error('Failed to fetch blocked dates:', blockedError);
  }

  // Group availability by day
  const availabilityByDay = DAYS.map((day, index) => ({
    day,
    dayIndex: index,
    slots: availability?.filter((a) => a.day_of_week === index) || [],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Availability</h1>
        <p className="text-slate-600">Set your weekly schedule and block specific dates</p>
      </div>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {availabilityByDay.map(({ day, dayIndex, slots }) => (
              <div key={dayIndex} className="border-b border-slate-100 pb-4 last:border-0">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="min-w-[150px]">
                    <h3 className="font-medium text-slate-900">{day}</h3>
                    {slots.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {slots.map((slot) => (
                          <div key={slot.id} className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                            </Badge>
                            <form action={removeAvailabilityAction.bind(null, slot.id)}>
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
                      <p className="text-sm text-slate-500 mt-1">Not available</p>
                    )}
                  </div>
                  <form action={addAvailabilityAction} className="flex items-end gap-2">
                    <input type="hidden" name="dayOfWeek" value={dayIndex} />
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Start</label>
                      <input
                        type="time"
                        name="startTime"
                        required
                        className="px-2 py-1 border border-slate-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">End</label>
                      <input
                        type="time"
                        name="endTime"
                        required
                        className="px-2 py-1 border border-slate-300 rounded text-sm"
                      />
                    </div>
                    <Button type="submit" size="sm" variant="secondary">Add</Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Blocked Dates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Blocked Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add blocked date form */}
            <form action={addBlockedDateAction} className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-lg">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Date to Block</label>
                <input
                  type="date"
                  name="exceptionDate"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Reason (optional)</label>
                <input
                  type="text"
                  name="reason"
                  placeholder="e.g., Vacation, Appointment"
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" size="sm">Block Date</Button>
              </div>
            </form>

            {/* List of blocked dates */}
            {blockedDates && blockedDates.length > 0 ? (
              <div className="space-y-2">
                {blockedDates.map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {formatDate(block.exception_date, 'EEEE, MMMM d, yyyy')}
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
              <p className="text-slate-500 text-center py-4">No blocked dates scheduled.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
