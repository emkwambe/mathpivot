// Summer clinic catalog and season dates (MP-M1 S1 task 2).
//
// Dates live here as ISO strings so public pages never render a past date as
// if it were upcoming: callers show a clinic's dates only while
// isUpcoming(clinic.end) is true, and otherwise fall back to
// NEXT_SEASON_NOTICE. To launch a new season, update start/end below.

export interface SummerClinic {
  name: string;
  slug: string;
  price: string;
  days: string;
  audience: string;
  focus: string;
  outcome: string;
  creditExample: string;
  creditShort: string;
  featured?: boolean;
  wave: 1 | 2;
  /** First clinic day, YYYY-MM-DD. */
  start: string;
  /** Last clinic day, YYYY-MM-DD. */
  end: string;
}

export const NEXT_SEASON_NOTICE = "Next season dates to be announced";

export const SUMMER_CLINICS: SummerClinic[] = [
  {
    name: "Propel Math 7",
    slug: "propel-7",
    price: "$249",
    days: "8 days",
    audience: "Rising 7th Graders",
    focus: "Ratios & Proportional Relationships",
    outcome: "Build confidence and readiness for Grade 7 mathematics.",
    creditExample:
      "Receive a $75 enrollment credit if you continue into Foundation Coaching.",
    creditShort: "$75 enrollment credit toward Foundation Coaching",
    wave: 1,
    start: "2026-07-06",
    end: "2026-07-15",
  },
  {
    name: "Ignite Math 1",
    slug: "ignite-math1",
    price: "$449",
    days: "10 days",
    audience: "Rising 9th Graders",
    focus: "Number Sense, Algebra, and Functions",
    outcome: "Target the standards that drive Algebra 1 and EOC success.",
    creditExample:
      "Receive a $100 enrollment credit if you continue into Foundation Coaching.",
    creditShort: "$100 enrollment credit toward Foundation Coaching",
    featured: true,
    wave: 1,
    start: "2026-07-06",
    end: "2026-07-17",
  },
  {
    name: "Advantage Math 8",
    slug: "advantage-8",
    price: "$349",
    days: "9 days",
    audience: "Rising 8th Graders",
    focus: "Functions & Relations",
    outcome:
      "Strengthen the concepts that drive success in Grade 8 mathematics.",
    creditExample:
      "Receive a $100 enrollment credit if you continue into Acceleration Coaching.",
    creditShort: "$100 enrollment credit toward Acceleration Coaching",
    wave: 2,
    start: "2026-07-20",
    end: "2026-07-30",
  },
  {
    name: "Ascent Pre-Calc",
    slug: "ascent-precalc",
    price: "$549",
    days: "11 days",
    audience: "Rising 11th Graders",
    focus: "Advanced Functions, Trigonometry, and Pre-Calculus",
    outcome:
      "Prepare for advanced high school mathematics and future STEM coursework.",
    creditExample:
      "Receive a $150 enrollment credit if you continue into MathPivot Advanced.",
    creditShort: "$150 enrollment credit toward MathPivot Advanced",
    wave: 2,
    start: "2026-07-20",
    end: "2026-08-01",
  },
];

/** Today's date as YYYY-MM-DD (UTC). */
export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** True while the given YYYY-MM-DD date is today or later. */
export function isUpcoming(endIso: string, now: Date = new Date()): boolean {
  return endIso >= todayIso(now);
}

function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** "July 6 – July 15" while upcoming, otherwise null. */
export function clinicDateLabel(
  clinic: SummerClinic,
  now: Date = new Date(),
): string | null {
  if (!isUpcoming(clinic.end, now)) return null;
  return `${formatDay(clinic.start)} – ${formatDay(clinic.end)}`;
}

/** "Starts July 6" for a wave while any clinic in it is upcoming, else null. */
export function waveStartLabel(
  wave: 1 | 2,
  now: Date = new Date(),
): string | null {
  const clinics = SUMMER_CLINICS.filter(
    (c) => c.wave === wave && isUpcoming(c.end, now),
  );
  if (clinics.length === 0) return null;
  const start = clinics.map((c) => c.start).sort()[0];
  return `Starts ${formatDay(start)}`;
}
