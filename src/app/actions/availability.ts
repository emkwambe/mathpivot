"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const setAvailabilitySchema = z.object({
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const blockTimeSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  reason: z.string().optional(),
});

export type AvailabilityActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

export async function addAvailabilitySlot(
  formData: FormData,
): Promise<AvailabilityActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") {
    return { success: false, error: "Only tutors can set availability" };
  }

  const rawData = {
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  };

  const result = setAvailabilitySchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { dayOfWeek, startTime, endTime } = result.data;

  // Validate end time is after start time
  if (startTime >= endTime) {
    return { success: false, error: "End time must be after start time" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("availability_rules")
    .insert({
      tutor_user_id: user.id,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Availability error:", error);
    return { success: false, error: "Failed to add availability" };
  }

  revalidatePath("/tutor/availability");

  return { success: true, id: data.id };
}

export async function removeAvailabilitySlot(
  slotId: string,
): Promise<AvailabilityActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") {
    return { success: false, error: "Only tutors can modify availability" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("availability_rules")
    .delete()
    .eq("id", slotId)
    .eq("tutor_user_id", user.id);

  if (error) {
    return { success: false, error: "Failed to remove availability" };
  }

  revalidatePath("/tutor/availability");

  return { success: true };
}

export async function addBlockedTime(
  formData: FormData,
): Promise<AvailabilityActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") {
    return { success: false, error: "Only tutors can block time" };
  }

  const rawData = {
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
    reason: formData.get("reason") || undefined,
  };

  const result = blockTimeSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { startAt, endAt, reason } = result.data;

  const supabase = await createClient();

  // Map blocked time to availability_exceptions with is_available=false
  const exceptionDate = startAt.split("T")[0]; // Extract date from datetime
  const { data, error } = await supabase
    .from("availability_exceptions")
    .insert({
      tutor_user_id: user.id,
      exception_date: exceptionDate,
      is_available: false,
      reason: reason || null,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: "Failed to block time" };
  }

  revalidatePath("/tutor/availability");

  return { success: true, id: data.id };
}

export async function removeBlockedTime(
  blockId: string,
): Promise<AvailabilityActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") {
    return { success: false, error: "Only tutors can modify blocked times" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("availability_exceptions")
    .delete()
    .eq("id", blockId)
    .eq("tutor_user_id", user.id);

  if (error) {
    return { success: false, error: "Failed to remove blocked time" };
  }

  revalidatePath("/tutor/availability");

  return { success: true };
}

// Get available slots for a specific date (for booking UI)
export async function getAvailableSlotsForDate(
  tutorUserId: string,
  date: string,
): Promise<{ slots: { start: string; end: string }[]; error?: string }> {
  const supabase = await createClient();

  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay();

  // Get tutor's availability for this day
  const { data: availability } = await supabase
    .from("availability_rules")
    .select("start_time, end_time")
    .eq("tutor_user_id", tutorUserId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true);

  if (!availability || availability.length === 0) {
    return { slots: [] };
  }

  // Get existing bookings for this date
  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("start_at, end_at")
    .eq("tutor_user_id", tutorUserId)
    .neq("status", "canceled")
    .gte("start_at", dateStart.toISOString())
    .lte("start_at", dateEnd.toISOString());

  // Get blocked dates (availability exceptions where is_available=false)
  const { data: blockedExceptions } = await supabase
    .from("availability_exceptions")
    .select("exception_date, is_available")
    .eq("tutor_user_id", tutorUserId)
    .eq("exception_date", date)
    .eq("is_available", false);

  // If this date is blocked entirely, return no slots
  if (blockedExceptions && blockedExceptions.length > 0) {
    return { slots: [] };
  }

  // Generate 1-hour slots from availability
  const slots: { start: string; end: string }[] = [];

  for (const avail of availability) {
    const [startHour, startMin] = avail.start_time.split(":").map(Number);
    const [endHour, endMin] = avail.end_time.split(":").map(Number);

    let currentHour = startHour;
    const currentMin = startMin;

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMin < endMin)
    ) {
      const slotStart = new Date(date);
      slotStart.setHours(currentHour, currentMin, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setHours(slotEnd.getHours() + 1);

      // Check if slot end exceeds availability end
      const availEnd = new Date(date);
      availEnd.setHours(endHour, endMin, 0, 0);
      if (slotEnd > availEnd) break;

      // Check if slot overlaps with any booking
      const hasBookingConflict = bookings?.some((b) => {
        const bookStart = new Date(b.start_at);
        const bookEnd = new Date(b.end_at);
        return slotStart < bookEnd && slotEnd > bookStart;
      });

      // Only add if no booking conflict and slot is in the future
      if (!hasBookingConflict && slotStart > new Date()) {
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        });
      }

      currentHour += 1;
    }
  }

  return { slots };
}
