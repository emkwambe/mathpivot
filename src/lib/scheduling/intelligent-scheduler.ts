/**
 * Intelligent Scheduling Service
 * Suggests optimal session times based on:
 * - Student's historical engagement patterns
 * - Tutor availability
 * - Time preferences
 * - Learning analytics
 */

import { createClient } from '@/lib/supabase/server';
import { startOfWeek, endOfWeek, addDays, format, parseISO, isAfter, isBefore, setHours, setMinutes } from 'date-fns';

export interface SchedulingSuggestion {
  date: string;
  startTime: string;
  endTime: string;
  tutorId: string;
  tutorName: string;
  reason: string;
  score: number;
}

export interface StudentSchedulingProfile {
  preferredDays: number[]; // 0-6 (Sunday-Saturday)
  preferredTimeSlots: { start: string; end: string }[];
  averageSessionsPerWeek: number;
  lastSessionDate: string | null;
  preferredTutorId: string | null;
}

// Analyze student's historical patterns
export async function analyzeStudentPatterns(studentUserId: string): Promise<StudentSchedulingProfile> {
  const supabase = await createClient();

  // Get past bookings
  const { data: pastBookings } = await supabase
    .from('bookings')
    .select('start_at, tutor_user_id')
    .eq('student_user_id', studentUserId)
    .eq('status', 'completed')
    .order('start_at', { ascending: false })
    .limit(20);

  // Analyze preferred days
  const dayCount: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const timeSlots: { hour: number; count: number }[] = [];
  const tutorCount: Record<string, number> = {};

  pastBookings?.forEach(booking => {
    const date = parseISO(booking.start_at);
    const day = date.getDay();
    const hour = date.getHours();

    dayCount[day]++;

    const existingSlot = timeSlots.find(s => s.hour === hour);
    if (existingSlot) {
      existingSlot.count++;
    } else {
      timeSlots.push({ hour, count: 1 });
    }

    tutorCount[booking.tutor_user_id] = (tutorCount[booking.tutor_user_id] || 0) + 1;
  });

  // Find preferred days (top 3)
  const preferredDays = Object.entries(dayCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .filter(([, count]) => count > 0)
    .map(([day]) => parseInt(day));

  // Find preferred time slots (top 2)
  const preferredTimeSlots = timeSlots
    .sort((a, b) => b.count - a.count)
    .slice(0, 2)
    .map(slot => ({
      start: `${slot.hour.toString().padStart(2, '0')}:00`,
      end: `${(slot.hour + 1).toString().padStart(2, '0')}:00`,
    }));

  // Calculate average sessions per week
  const weekCount = pastBookings && pastBookings.length > 0 ? 4 : 0; // Assume 4 weeks of history
  const averageSessionsPerWeek = weekCount > 0 ? (pastBookings?.length || 0) / weekCount : 1;

  // Find most used tutor
  const preferredTutorId = Object.entries(tutorCount)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

  // Get last session date
  const lastSessionDate = pastBookings?.[0]?.start_at || null;

  return {
    preferredDays: preferredDays.length > 0 ? preferredDays : [1, 3, 5], // Default: Mon, Wed, Fri
    preferredTimeSlots: preferredTimeSlots.length > 0
      ? preferredTimeSlots
      : [{ start: '16:00', end: '17:00' }, { start: '17:00', end: '18:00' }], // Default: After school
    averageSessionsPerWeek,
    lastSessionDate,
    preferredTutorId,
  };
}

// Get available tutors for a time slot
async function getAvailableTutors(
  date: Date,
  startTime: string,
  endTime: string,
  preferredTutorId?: string | null
): Promise<Array<{ id: string; name: string; score: number }>> {
  const supabase = await createClient();
  const dayOfWeek = date.getDay();
  const dateStr = format(date, 'yyyy-MM-dd');

  // Get tutors with availability rules for this day
  const { data: availableRules } = await supabase
    .from('availability_rules')
    .select(`
      tutor_user_id,
      start_time,
      end_time,
      tutor:tutors_profile!inner (
        user_id,
        is_active,
        user:users_profile!inner (full_name)
      )
    `)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .lte('start_time', startTime)
    .gte('end_time', endTime);

  // Check for exceptions
  const { data: exceptions } = await supabase
    .from('availability_exceptions')
    .select('tutor_user_id, is_available')
    .eq('exception_date', dateStr);

  const exceptionMap = new Map(exceptions?.map(e => [e.tutor_user_id, e.is_available]) || []);

  // Check for existing bookings at this time
  const startDateTime = new Date(`${dateStr}T${startTime}`);
  const endDateTime = new Date(`${dateStr}T${endTime}`);

  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('tutor_user_id')
    .gte('start_at', startDateTime.toISOString())
    .lt('end_at', endDateTime.toISOString())
    .not('status', 'eq', 'canceled');

  const bookedTutors = new Set(existingBookings?.map(b => b.tutor_user_id) || []);

  // Filter and score tutors
  const availableTutors: Array<{ id: string; name: string; score: number }> = [];

  availableRules?.forEach(rule => {
    const tutorId = rule.tutor_user_id;
    const tutor = rule.tutor as unknown as { user_id: string; is_active: boolean; user: { full_name: string } } | null;

    // Skip if not active or has blocking exception or already booked
    if (!tutor || !tutor.is_active) return;
    if (exceptionMap.get(tutorId) === false) return;
    if (bookedTutors.has(tutorId)) return;

    let score = 0.5; // Base score

    // Boost score for preferred tutor
    if (preferredTutorId && tutorId === preferredTutorId) {
      score += 0.3;
    }

    // Boost score if explicitly available (exception says available)
    if (exceptionMap.get(tutorId) === true) {
      score += 0.1;
    }

    availableTutors.push({
      id: tutorId,
      name: tutor.user.full_name,
      score,
    });
  });

  return availableTutors.sort((a, b) => b.score - a.score);
}

// Generate scheduling suggestions
export async function generateSchedulingSuggestions(
  studentUserId: string,
  familyId: string,
  weeksAhead: number = 2
): Promise<SchedulingSuggestion[]> {
  const profile = await analyzeStudentPatterns(studentUserId);
  const suggestions: SchedulingSuggestion[] = [];
  const now = new Date();

  // Generate suggestions for the next N weeks
  for (let week = 0; week < weeksAhead; week++) {
    const weekStart = addDays(startOfWeek(now, { weekStartsOn: 0 }), week * 7);

    for (const preferredDay of profile.preferredDays) {
      const targetDate = addDays(weekStart, preferredDay);

      // Skip if date is in the past
      if (isBefore(targetDate, now)) continue;

      for (const timeSlot of profile.preferredTimeSlots) {
        const availableTutors = await getAvailableTutors(
          targetDate,
          timeSlot.start,
          timeSlot.end,
          profile.preferredTutorId
        );

        if (availableTutors.length > 0) {
          const bestTutor = availableTutors[0];
          const dayName = format(targetDate, 'EEEE');

          // Calculate overall score
          let score = bestTutor.score;

          // Boost if it's been a while since last session
          if (profile.lastSessionDate) {
            const daysSinceLastSession = Math.floor(
              (now.getTime() - parseISO(profile.lastSessionDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysSinceLastSession > 7) {
              score += 0.1;
            }
          }

          // Generate reason
          let reason = '';
          if (bestTutor.id === profile.preferredTutorId) {
            reason = `${dayName} ${timeSlot.start} with your preferred tutor ${bestTutor.name}`;
          } else if (profile.preferredDays.includes(preferredDay)) {
            reason = `${dayName} matches your usual schedule`;
          } else {
            reason = `${bestTutor.name} is available at your preferred time`;
          }

          suggestions.push({
            date: format(targetDate, 'yyyy-MM-dd'),
            startTime: timeSlot.start,
            endTime: timeSlot.end,
            tutorId: bestTutor.id,
            tutorName: bestTutor.name,
            reason,
            score: Math.min(score, 1),
          });
        }
      }
    }
  }

  // Sort by score and limit
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

// Get scheduling suggestions for a student
export async function getSchedulingSuggestions(studentUserId: string) {
  const supabase = await createClient();

  // Get family ID
  const { data: student } = await supabase
    .from('students_profile')
    .select('family_id')
    .eq('user_id', studentUserId)
    .single();

  if (!student) return [];

  return generateSchedulingSuggestions(studentUserId, student.family_id);
}

// Save a suggestion when accepted
export async function saveSuggestion(
  studentUserId: string,
  familyId: string,
  suggestion: SchedulingSuggestion,
  isAccepted: boolean
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('scheduling_suggestions').insert({
    student_user_id: studentUserId,
    family_id: familyId,
    tutor_user_id: suggestion.tutorId,
    suggested_date: suggestion.date,
    suggested_start_time: suggestion.startTime,
    suggested_end_time: suggestion.endTime,
    reason: suggestion.reason,
    score: suggestion.score,
    is_accepted: isAccepted,
  });
}
