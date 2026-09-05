// Pure helpers used by both the coach-roster server action and the
// admin page that renders it. Kept out of the "use server" module because
// Next.js only lets server-action files export async functions.

export interface CoachRosterRow {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  created_at: string;
  onboarding: {
    background_check_attested: boolean;
    admin_verified_background: boolean;
    code_of_conduct_accepted: boolean;
    activated: boolean;
    steps_done: number;
    steps_total: number;
  };
  certified: {
    tier: "certified" | "master" | null;
    status: string | null;
    certified_at: string | null;
    expires_at: string | null;
  };
  training: {
    completed: number;
    required: number;
  };
  activity: {
    total_bookings: number;
    upcoming_bookings: number;
  };
}

export type LifecycleStage =
  | "active"
  | "certified_not_active"
  | "in_training"
  | "onboarding"
  | "invited_no_login"
  | "inactive";

export function lifecycleStage(row: CoachRosterRow): LifecycleStage {
  if (row.onboarding.activated) return "active";
  if (row.certified.status === "approved") return "certified_not_active";
  if (row.training.completed > 0) return "in_training";
  if (row.onboarding.steps_done > 0) return "onboarding";
  return "invited_no_login";
}
