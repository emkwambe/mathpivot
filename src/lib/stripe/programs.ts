export type ProgramTier = "foundation" | "acceleration" | "elite";

export interface ProgramConfig {
  tier: ProgramTier;
  name: string;
  displayName: string;
  priceMonthly: number;
  priceMonthlyCents: number;
  cadence: string;
  tagline: string;
  color: "blue" | "amber" | "purple";
  features: string[];
  bestFor: string;
}

export const PROGRAMS: Record<ProgramTier, ProgramConfig> = {
  foundation: {
    tier: "foundation",
    name: "Foundation",
    displayName: "Foundation Coaching",
    priceMonthly: 349,
    priceMonthlyCents: 34900,
    cadence: "2 coaching sessions / week",
    tagline: "Rebuild confidence and close mastery gaps.",
    color: "blue",
    features: [
      "Dedicated math coach",
      "2 coaching meetings per week (60 min each)",
      "Diagnostic-driven learning roadmap",
      "Mastery tracking dashboard",
      "Weekly progress reports",
      "Micro-cohort of 5-6 students",
    ],
    bestFor:
      "Students who need to rebuild confidence and close specific mastery gaps.",
  },
  acceleration: {
    tier: "acceleration",
    name: "Acceleration",
    displayName: "Acceleration Coaching",
    priceMonthly: 549,
    priceMonthlyCents: 54900,
    cadence: "3 coaching sessions / week",
    tagline: "Fill gaps and move ahead of grade level.",
    color: "amber",
    features: [
      "Everything in Foundation",
      "3 coaching meetings per week",
      "Academic acceleration pathway",
      "Advanced problem-solving",
      "Honors & competition readiness",
      "School curriculum anticipation",
    ],
    bestFor:
      "Motivated students preparing for honors coursework or seeking additional challenge.",
  },
  elite: {
    tier: "elite",
    name: "Elite",
    displayName: "Elite Coaching",
    priceMonthly: 799,
    priceMonthlyCents: 79900,
    cadence: "2-3 sessions / week + enrichment opportunities",
    tagline: "Accelerate, compete, and lead.",
    color: "purple",
    features: [
      "Everything in Acceleration",
      "Competition prep (AMC, MATHCOUNTS, AIME)",
      "Advanced projects & guided research",
      "Career exploration & mentorship",
      "Parent strategy reviews",
      "Personalized academic planning",
    ],
    bestFor:
      "High-performing students ready to accelerate, compete, and explore STEM career pathways.",
  },
};

export const VALID_TIERS: ProgramTier[] = [
  "foundation",
  "acceleration",
  "elite",
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
    case "elite":
      return process.env.STRIPE_PRICE_ID_ELITE;
  }
}
