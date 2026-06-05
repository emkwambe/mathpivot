"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface USState {
  code: string;
  name: string;
  region: string;
  has_eoc_exam: boolean;
  standards_framework: string;
}

export interface StateStandard {
  id: string;
  state_code: string;
  state_name: string;
  exam_name: string;
  exam_type: string;
  grade_or_course: string;
  standards_framework: string;
  blueprint_url: string | null;
  released_items_url: string | null;
  domain_weights: Record<string, number>;
}

export async function getUSStates(): Promise<USState[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("us_states").select("*").order("name");
  return (data || []) as USState[];
}

export async function getStateStandards(
  stateCode: string,
): Promise<StateStandard[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("state_standards")
    .select("*")
    .eq("state_code", stateCode)
    .eq("is_active", true)
    .order("grade_or_course");

  if (data && data.length > 0) return data as StateStandard[];

  const { data: ccData } = await supabase
    .from("state_standards")
    .select("*")
    .eq("state_code", "CC")
    .eq("is_active", true)
    .order("grade_or_course");

  return (ccData || []) as StateStandard[];
}

export async function updateUserLocation(input: {
  country?: string;
  stateCode?: string;
  city?: string;
  county?: string;
  timezone?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { success: false };

  const supabase = await createClient();

  const updates: Record<string, unknown> = {};
  if (input.country !== undefined) updates.country = input.country;
  if (input.stateCode !== undefined) updates.state_code = input.stateCode;
  if (input.city !== undefined) updates.city = input.city;
  if (input.county !== undefined) updates.county = input.county;
  if (input.timezone !== undefined) updates.timezone = input.timezone;

  const { error } = await supabase
    .from("users_profile")
    .update(updates)
    .eq("id", user.id);

  if (error) return { success: false };

  revalidatePath("/settings");
  return { success: true };
}

export async function getDiagnosticQuestionsForState(
  stateCode: string,
  gradeHint?: number,
) {
  const supabase = await createClient();

  let gradeBands: string[];
  if (gradeHint && gradeHint <= 7) {
    gradeBands = ["6-7", "7-8"];
  } else if (gradeHint && gradeHint <= 9) {
    gradeBands = ["7-8", "8-9"];
  } else {
    gradeBands = ["8-9", "9-10", "10-11"];
  }

  const { data: stateQuestions } = await supabase
    .from("diagnostic_questions")
    .select("id")
    .eq("state_code", stateCode)
    .eq("is_active", true)
    .in("grade_band", gradeBands);

  if (stateQuestions && stateQuestions.length >= 15) {
    return stateCode;
  }

  return "CC";
}
