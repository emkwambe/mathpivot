"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  currentWeekOf,
  EMPTY_PAYLOAD,
  type SchoolStrategyPayload,
  type StrategyStatus,
} from "@/lib/school-strategy/schema";

export interface SchoolStrategyEntry {
  id: string;
  student_id: string;
  coach_id: string;
  week_of: string;
  data: SchoolStrategyPayload;
  status: StrategyStatus;
  next_review_date: string | null;
  coach_notes: string | null;
  updated_at: string;
}

// Loads the coach's checklist for the given student and week. If none
// exists yet, returns a shell entry with EMPTY_PAYLOAD so the form has
// something to bind to; it is created in the DB on first save.
export async function getOrInitEntry(studentId: string, weekOf?: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") return null;

  const week = weekOf ?? currentWeekOf();
  const supabase = await createClient();

  const { data } = await supabase
    .from("school_strategy_entries")
    .select("*")
    .eq("student_id", studentId)
    .eq("coach_id", user.id)
    .eq("week_of", week)
    .maybeSingle();

  if (data) return data as SchoolStrategyEntry;

  return {
    id: "",
    student_id: studentId,
    coach_id: user.id,
    week_of: week,
    data: EMPTY_PAYLOAD,
    status: "on_track" as StrategyStatus,
    next_review_date: null,
    coach_notes: null,
    updated_at: new Date().toISOString(),
  } satisfies SchoolStrategyEntry;
}

export interface SaveInput {
  studentId: string;
  weekOf: string;
  data: SchoolStrategyPayload;
  status: StrategyStatus;
  nextReviewDate?: string | null;
  coachNotes?: string | null;
}

export async function saveEntry(input: SaveInput) {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor")
    return { success: false, error: "Not authorized" };

  const supabase = await createClient();

  const { error } = await supabase.from("school_strategy_entries").upsert(
    {
      student_id: input.studentId,
      coach_id: user.id,
      week_of: input.weekOf,
      data: input.data,
      status: input.status,
      next_review_date: input.nextReviewDate ?? null,
      coach_notes: input.coachNotes ?? null,
    },
    { onConflict: "student_id,coach_id,week_of" },
  );

  if (error) return { success: false, error: error.message };

  revalidatePath(`/tutor/students/${input.studentId}/school-strategy`);
  return { success: true };
}
