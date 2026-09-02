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
  color: "blue" | "amber" | "purple";
  features: string[];
  bestFor: string;
}

export const PROGRAMS: Record<ProgramTier, ProgramConfig> = {
  foundation: {
    tier: "foundation",
    name: "Foundation",
    displayName: "MathPivot Foundation",
    priceMonthly: 349,
    priceMonthlyCents: 34900,
    cadence: "2 guided sessions each week",
    capability: "Establish Capability",
    tagline:
      "Strengthen essential mathematics, resolve prerequisite gaps, and establish the mastery future learning depends upon.",
    color: "blue",
    features: [
      "Individual mastery plan",
      "Mastery-matched cohort",
      "Guided instruction",
      "Purposeful practice",
      "Coach feedback",
      "Progress monitoring",
    ],
    bestFor:
      "For students strengthening essential mathematics, closing prerequisite gaps, or building dependable mastery before advancing.",
  },
  acceleration: {
    tier: "acceleration",
    name: "Acceleration",
    displayName: "MathPivot Acceleration",
    priceMonthly: 549,
    priceMonthlyCents: 54900,
    cadence: "3 guided sessions each week",
    capability: "Expand Capability",
    tagline:
      "Progress deeper or faster, remain ahead of current course demands, and prepare for increasingly advanced mathematics.",
    color: "amber",
    features: [
      "Accelerated mastery plan",
      "Mastery-matched cohort",
      "Guided instruction",
      "Advanced practice & enrichment",
      "Coach feedback",
      "Progress monitoring",
    ],
    bestFor:
      "For students with sufficient foundations to progress deeper or faster, remain ahead of current course demands, and prepare for increasingly advanced mathematics.",
  },
  advanced: {
    tier: "advanced",
    name: "Advanced",
    displayName: "MathPivot Advanced",
    priceMonthly: 799,
    priceMonthlyCents: 79900,
    cadence: "2–3 guided sessions each week + pathway-specific opportunities",
    capability: "Advance Capability",
    tagline:
      "Pursue demanding mathematics — advanced high-school coursework, AP mathematics, competition pathways, and preparation for quantitatively demanding college and career directions.",
    color: "purple",
    features: [
      "Advanced mastery plan",
      "Mastery-matched cohort",
      "Specialized guided instruction",
      "Advanced practice & extended problem solving",
      "Specialized feedback",
      "Progress monitoring",
      "Pathway-specific opportunities",
    ],
    bestFor:
      "For students pursuing demanding mathematics, including advanced high-school coursework, AP mathematics, competition pathways, and preparation for quantitatively demanding college and career directions.",
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
