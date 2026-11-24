import type { Persona } from "@/lib/persona";

export const PERSONA_MONTHLY_REVENUE: Record<Persona, number> = {
  proactive_suburban: 379,
  travel_ball_family: 549,
  homeschool_family: 379,
  falling_behind: 379,
  competition_math: 649,
  school_partner: 2000,
  unclassified: 379,
};

export const PERSONA_RETENTION_MONTHS: Record<Persona, number> = {
  proactive_suburban: 18,
  travel_ball_family: 24,
  homeschool_family: 30,
  falling_behind: 12,
  competition_math: 24,
  school_partner: 12,
  unclassified: 12,
};
