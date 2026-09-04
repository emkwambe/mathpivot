// Type definitions for the School Strategy Checklist payload stored in
// school_strategy_entries.data (JSONB). Kept in TypeScript because the
// checklist evolves rapidly during early product iteration and new fields
// should not require a DB migration each time.

export type StrategyStatus = "on_track" | "monitor" | "adjust" | "escalate";

export const STATUS_LABELS: Record<StrategyStatus, string> = {
  on_track: "On track — current plan remains appropriate",
  monitor: "Monitor — new concern requires observation",
  adjust: "Adjust — coaching priorities or pacing must change",
  escalate: "Escalate — Coach Lead or family discussion is required",
};

export type FamilyUpdateSignal =
  | "none"
  | "progress"
  | "assessment"
  | "learning_plan_concern"
  | "coach_lead_review";

export const FAMILY_UPDATE_LABELS: Record<FamilyUpdateSignal, string> = {
  none: "No routine update beyond the scheduled report",
  progress: "Progress update",
  assessment: "Upcoming-assessment update",
  learning_plan_concern: "Learning-plan concern",
  coach_lead_review: "Coach-lead review required",
};

// Every section is a plain map of check-id → boolean plus optional text
// fields. Coach forms are permissive: a coach can save partial state and
// return later — nothing here is validated for completeness at the server.
export interface SchoolStrategyPayload {
  // 1. School and Course Profile
  section1: {
    school_confirmed?: boolean;
    grade_recorded?: boolean;
    course_confirmed?: boolean;
    teacher_recorded?: boolean;
    curriculum_identified?: boolean;
    unit_recorded?: boolean;
    grading_periods_identified?: boolean;
    exam_recorded?: boolean;
  };
  // 2. Current Classroom Position
  section2: {
    current_concepts_identified?: boolean;
    recent_topic_recorded?: boolean;
    next_topic_identified?: boolean;
    recent_work_reviewed?: boolean;
    upcoming_dates_noted?: boolean;
    missing_work_identified?: boolean;
    grade_recorded?: boolean;
    student_perception_captured?: boolean;
  };
  // 3. Essential Gap Check
  section3: {
    prereq_gaps_identified?: boolean;
    foundational_vs_temporary?: boolean;
    gaps_prioritized?: boolean;
    two_priorities_selected?: boolean;
    inside_session_feasibility?: boolean;
    escalated_if_needed?: boolean;
    evidence_recorded?: boolean;
  };
  // 4. Stay-Ahead Plan
  section4: {
    next_concept_identified?: boolean;
    prerequisites_secure?: boolean;
    preview_activity_selected?: boolean;
    vocabulary_introduced?: boolean;
    example_provided?: boolean;
    initial_understanding_recorded?: boolean;
    deeper_practice_scheduled?: boolean;
  };
  // 5. Assessment Readiness
  section5: {
    date_material_confirmed?: boolean;
    study_guide_reviewed?: boolean;
    additional_practice_identified?: boolean;
    procedural_and_reasoning?: boolean;
    realistic_conditions?: boolean;
    errors_reviewed?: boolean;
    independent_readiness_confirmed?: boolean;
    post_reflection_recorded?: boolean;
  };
  // 6. Classroom Habits and Independence
  section6: {
    understands_assignments?: boolean;
    organization_checked?: boolean;
    late_work_pattern_identified?: boolean;
    help_seeking_discussed?: boolean;
    reasoning_practice?: boolean;
    weekly_action_set?: boolean;
    previous_action_reviewed?: boolean;
    independence_recognized?: boolean;
  };
  // 7. School Alignment Boundaries
  section7: {
    authorized_info_only?: boolean;
    source_and_date_recorded?: boolean;
    provisional_marked?: boolean;
    no_official_estimates?: boolean;
    no_unauthorized_contact?: boolean;
    no_graded_work_completion?: boolean;
    information_protected?: boolean;
    integrity_escalated?: boolean;
  };
  // 8. Weekly Coaching Strategy — free-text fields
  section8: {
    school_focus?: string;
    gap_to_repair?: string;
    concept_to_preview?: string;
    evidence_to_collect?: string;
    student_owned_action?: string;
    family_update?: FamilyUpdateSignal;
  };
  // 9. Coach Review
  section9: {
    addresses_school_needs?: boolean;
    meaningful_learning?: boolean;
    realistic_workload?: boolean;
    matches_mastery?: boolean;
    student_has_role?: boolean;
    not_homework_completion?: boolean;
    next_review_scheduled?: boolean;
  };
}

export const EMPTY_PAYLOAD: SchoolStrategyPayload = {
  section1: {},
  section2: {},
  section3: {},
  section4: {},
  section5: {},
  section6: {},
  section7: {},
  section8: { family_update: "none" },
  section9: {},
};

// Compute this coming Monday's date (ISO YYYY-MM-DD) — anchor for a
// weekly checklist row. Uses UTC so different browser locales don't
// create off-by-one week rows.
export function currentWeekOf(now: Date = new Date()): string {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const day = d.getUTCDay();
  // 0 = Sunday, 1 = Monday. Shift to nearest previous Monday.
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}
