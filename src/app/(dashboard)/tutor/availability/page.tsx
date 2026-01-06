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

  await supabase
    .from('availability')
    .insert({
      tutor_user_id: user.id,
      day_of_week: parseInt(formData.get('dayOfWeek') as string, 10),
      start_time: formData.get('startTime') as string,
      end_time: formData.get('endTime') as string,
    });

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
    .from('availability')
    .delete()
    .eq('id', slotId)
    .eq('tutor_user_id', user.id);

  revalidatePath('/tutor/availability');
}

async function addBlockedTimeAction(formData: FormData) {
  'use server';

  const { getCurrentUser } = await import('@/lib/auth');
  const { createClient } = await import('@/lib/supabase/server');

  const user = await getCurrentUser();
  if (!user || user.role !== 'tutor') return;

  const supabase = await createClient();

  await supabase
    .from('blocked_times')
    .insert({
      tutor_user_id: user.id,
      start_at: formData.get('startAt') as string,
      end_at: formData.get('endAt') as string,
      reason: (formData.get('reason') as string) || null,
    });

  revalidatePath('/tutor/availability');
}

async function removeBlockedTimeAction(blockId: string) {
  'use server';

  const { getCurrentUser } = await import('@/lib/auth');
  const { createClient } = await import('@/lib/supabase/server');

  const user = await getCurrentUser();
  if (!user || user.role !== 'tutor') return;

  const supabase = await createClient();

  await supabase
    .from('blocked_times')
    .delete()
    .eq('id', blockId)
    .eq('tutor_user_id', user.id);

  revalidatePath('/tutor/availability');
}

export default async function AvailabilityPage() {
  const user = await requireRole('tutor');
  const supabase = await createClient();

  // Get tutor's availability
  const { data: availability } = await supabase
    .from('availability')
    .select('*')
    .eq('tutor_user_id', user.id)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  // Get upcoming blocked times
  const { data: blockedTimes } = await supabase
    .from('blocked_times')
    .select('*')
    .eq('tutor_user_id', user.id)
    .gte('end_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .limit(10);

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
        <p className="text-slate-600">Set your weekly schedule and block specific times</p>
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
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900">{day}</h3>
                    {slots.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {slots.map((slot) => (
                          <div key={slot.id} className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {slot.start_time} - {slot.end_time}
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

      {/* Blocked Times */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Blocked Times</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add blocked time form */}
            <form action={addBlockedTimeAction} className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-lg">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Start</label>
                <input
                  type="datetime-local"
                  name="startAt"
                  required
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">End</label>
                <input
                  type="datetime-local"
                  name="endAt"
                  required
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Reason (optional)</label>
                <input
                  type="text"
                  name="reason"
                  placeholder="e.g., Vacation"
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" size="sm">Block Time</Button>
              </div>
            </form>

            {/* List of blocked times */}
            {blockedTimes && blockedTimes.length > 0 ? (
              <div className="space-y-2">
                {blockedTimes.map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {formatDate(block.start_at, 'MMM d, yyyy h:mm a')} -{' '}
                        {formatDate(block.end_at, 'MMM d, yyyy h:mm a')}
                      </p>
                      {block.reason && (
                        <p className="text-sm text-slate-600">{block.reason}</p>
                      )}
                    </div>
                    <form action={removeBlockedTimeAction.bind(null, block.id)}>
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
              <p className="text-slate-500 text-center py-4">No blocked times scheduled.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
