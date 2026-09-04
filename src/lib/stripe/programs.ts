export type ProgramTier = "foundation" | "acceleration" | "advanced";

export interface ProgramConfig {
  tier: ProgramTier;
  name: string;
  displayName: string;
  priceMonthly: number;
  priceMonthlyCents: number;
  cadence: string;
  capability: string;
  tagline: string;
  description: string;
  color: "blue" | "amber" | "purple";
  features: string[];
  bestFor: string;
  primaryOutcome: string;
}

export const PROGRAMS: Record<ProgramTier, ProgramConfig> = {
  foundation: {
    tier: "foundation",
    name: "Foundation",
    displayName: "MathPivot Foundation",
    priceMonthly: 349,
    priceMonthlyCents: 34900,
    cadence: "Two 60-minute sessions per week",
    capability: "Ground",
    tagline:
      "For students whose progress is being limited by unfinished learning, weak prerequisite skills, or declining confidence.",
    description:
      "Foundation is for students whose progress is being limited by unfinished learning, weak prerequisite skills, or declining confidence. The program identifies the specific concepts causing difficulty and rebuilds them while connecting each skill to the student's current school course. Students receive structured instruction, guided practice, and repeated opportunities to explain their reasoning. The goal is not simply to complete tonight's homework; it is to help the student become more independent, accurate, and confident.",
    color: "blue",
    features: [
      "Initial diagnostic and placement review",
      "Small, mastery-matched cohort",
      "Two guided 60-minute sessions each week",
      "Personalized prerequisite-gap plan",
      "Support connected to the student's current course",
      "Preparation for important assessments when materials and dates are provided",
      "Progress updates for parents",
      "MathPivot School Strategy Checklist",
      "14-day placement and program-fit review",
    ],
    bestFor:
      "Students who frequently feel lost in class, have persistent knowledge gaps, struggle to work independently, or need to rebuild confidence before accelerating.",
    primaryOutcome:
      "Restore the readiness needed to participate successfully in the current math course.",
  },
  acceleration: {
    tier: "acceleration",
    name: "Acceleration",
    displayName: "MathPivot Acceleration",
    priceMonthly: 549,
    priceMonthlyCents: 54900,
    cadence: "Three 60-minute sessions per week",
    capability: "Align",
    tagline:
      "For students who understand much of their current course but need consistency, stronger assessment performance, and support staying ahead of emerging gaps.",
    description:
      "Acceleration is for students who need more than recovery. It helps them stay firmly aligned with their school curriculum while building enough mastery and continuity to approach upcoming concepts with confidence. The third weekly session allows the coach to balance four priorities: correcting remaining gaps, strengthening current-course understanding, preparing for assessments, and selectively previewing upcoming material. The exact balance changes according to the student's needs and school progress. Students learn mathematical reasoning, efficient problem-solving strategies, and study habits that make school assignments more manageable and independent.",
    color: "amber",
    features: [
      "Everything in Foundation",
      "Three guided 60-minute sessions each week",
      "Greater continuity between coaching and school instruction",
      "Selective preview of upcoming concepts",
      "Cumulative review and assessment preparation",
      "More challenging applications and multi-step problems",
      "Closer monitoring of current-course progress",
      "Regular adjustment of the student's learning plan",
      "Moves beyond procedural understanding into why the mathematics works",
    ],
    bestFor:
      "Students who understand much of their current course but need greater consistency, stronger assessment performance, or structured support to stay ahead of emerging gaps.",
    primaryOutcome:
      "Turn fragile or inconsistent performance into sustained mastery and forward momentum.",
  },
  advanced: {
    tier: "advanced",
    name: "Advanced",
    displayName: "MathPivot Advanced",
    priceMonthly: 799,
    priceMonthlyCents: 79900,
    cadence: "Three 60-minute sessions per week + monthly one-to-one",
    capability: "Propel",
    tagline:
      "For motivated students ready to extend mathematical ability beyond ordinary course support — rigorous problem-solving, advanced-course preparation, and long-term direction.",
    description:
      "Advanced is for motivated students who are ready to extend their mathematical ability beyond ordinary course support. The program combines rigorous problem-solving, advanced-course preparation, academic strategy, and longer-term college and career awareness. Sessions go deeper into mathematical reasoning, unfamiliar problems, modeling, communication, and connections across topics. When appropriate, students may also explore advanced courses, competitions, projects, technical fields, or other opportunities suited to their interests and readiness. Advanced is distinguished by the depth, personalization, and long-term direction of the program — not merely by additional instructional time.",
    color: "purple",
    features: [
      "Everything in Acceleration",
      "Advanced and non-routine problem-solving",
      "Preparation for demanding future coursework",
      "Mathematical modeling and applied investigations",
      "Individualized enrichment based on readiness and interests",
      "Monthly 30-minute one-to-one Pathway Strategy session",
      "College, career, competition, or project exploration when relevant",
      "Personalized year-ahead learning blueprint",
      "Portfolio-quality mathematical work when appropriate",
      "Coach placement based on student needs and available expertise",
    ],
    bestFor:
      "Students who are performing well, demonstrate strong motivation, or need greater challenge and strategic preparation for advanced academic opportunities.",
    primaryOutcome:
      "Convert strong course performance into deeper capability, intellectual independence, and purposeful preparation for what comes next.",
  },
};

export const VALID_TIERS: ProgramTier[] = [
  "foundation",
  "acceleration",
  "advanced",
];

export function isValidTier(v: unknown): v is ProgramTier {
  return typeof v === "string" && VALID_TIERS.includes(v as ProgramTier);
}

export function priceIdForTier(tier: ProgramTier): string | undefined {
  switch (tier) {
    case "foundation":
      return process.env.STRIPE_PRICE_ID_FOUNDATION;
    case "acceleration":
      return process.env.STRIPE_PRICE_ID_ACCELERATION;
    case "advanced":
      return process.env.STRIPE_PRICE_ID_ADVANCED;
  }
}

// Legacy tier value retained ONLY as historic marker for Sprint 9 test-mode
// rows created before the Elite → Advanced rename. Application MUST NOT
// create new subscriptions with this value; VALID_TIERS excludes it, so
// isValidTier() returns false for "elite" going forward.
export const LEGACY_TIER_ELITE = "elite" as const;
