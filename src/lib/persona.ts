/**
 * Persona classification for MathPivot leads.
 * Maps intake form signals → one of 6 personas from docs/customer-personas.md
 */

export type Persona =
  | "proactive_suburban"
  | "travel_ball_family"
  | "homeschool_family"
  | "falling_behind"
  | "competition_math"
  | "school_partner"
  | "unclassified";

export interface PersonaSignals {
  studentGrade?: number;
  goals?: string;
  source?: string;
  subjectsInterested?: string[];
  sourceDetail?: string;
}

export interface PersonaResult {
  persona: Persona;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  signals: Record<string, boolean>;
}

const KEYWORDS = {
  homeschool: [
    "homeschool",
    "home-school",
    "home school",
    "hsldda",
    "hslda",
    "co-op",
    "coop",
    "curriculum",
    "compliance",
  ],
  competition: [
    "amc",
    "mathcounts",
    "competition",
    "olympiad",
    "aime",
    "aops",
    "art of problem solving",
    "gifted",
    "advanced",
    "challenge",
    "ahead",
  ],
  fallingBehind: [
    "failing",
    "falling behind",
    "struggling",
    "grade drop",
    "bad grade",
    "d in math",
    "f in math",
    "hate math",
    "confused",
    "lost",
    "help",
    "catch up",
    "urgent",
    "worried",
  ],
  travelBall: [
    "travel ball",
    "travel team",
    "aau",
    "select team",
    "club sports",
    "competitive sport",
    "athlete",
    "scholarship",
  ],
  suburbanProactive: [
    "get ahead",
    "advantage",
    "prep for",
    "prepare for",
    "readiness",
    "confidence",
    "next level",
  ],
  schoolPartner: [
    "school",
    "district",
    "principal",
    "administrator",
    "title i",
    "esser",
    "charter",
    "learning center",
    "partnership",
    "bulk",
    "cohort",
  ],
};

function textContains(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export function classifyPersona(input: PersonaSignals): PersonaResult {
  const goals = (input.goals || "").trim();
  const sourceDetail = (input.sourceDetail || "").trim();
  const combined = `${goals} ${sourceDetail}`.trim();
  const grade = input.studentGrade;

  const signals: Record<string, boolean> = {
    mentionsHomeschool: textContains(combined, KEYWORDS.homeschool),
    mentionsCompetition: textContains(combined, KEYWORDS.competition),
    mentionsFallingBehind: textContains(combined, KEYWORDS.fallingBehind),
    mentionsTravelBall: textContains(combined, KEYWORDS.travelBall),
    mentionsSuburbanProactive: textContains(
      combined,
      KEYWORDS.suburbanProactive,
    ),
    mentionsSchoolPartner: textContains(combined, KEYWORDS.schoolPartner),
    fromCoachApplication: input.source === "coach_application",
    fromSummerWaitlist: input.source === "summer_clinic_waitlist",
    fromDiagnostic: input.source === "free_diagnostic",
    gradeInMiddleSchool: !!grade && grade >= 6 && grade <= 8,
    gradeInHighSchool: !!grade && grade >= 9 && grade <= 12,
  };

  if (signals.mentionsSchoolPartner) {
    return {
      persona: "school_partner",
      confidence: "high",
      reasoning: "Mentions school, district, or partnership language",
      signals,
    };
  }
  if (signals.mentionsHomeschool) {
    return {
      persona: "homeschool_family",
      confidence: "high",
      reasoning: "Explicitly mentions homeschooling",
      signals,
    };
  }
  if (signals.mentionsCompetition) {
    return {
      persona: "competition_math",
      confidence:
        signals.gradeInMiddleSchool || signals.gradeInHighSchool
          ? "high"
          : "medium",
      reasoning: "Mentions competition, AMC, MATHCOUNTS, or advanced/gifted",
      signals,
    };
  }
  if (signals.mentionsFallingBehind) {
    return {
      persona: "falling_behind",
      confidence: "high",
      reasoning: "Uses urgent language about struggling or grade drop",
      signals,
    };
  }
  if (signals.mentionsTravelBall) {
    return {
      persona: "travel_ball_family",
      confidence: "high",
      reasoning: "Mentions travel sports, AAU, or athletic scholarships",
      signals,
    };
  }
  if (
    signals.mentionsSuburbanProactive ||
    (grade && grade >= 5 && grade <= 10)
  ) {
    return {
      persona: "proactive_suburban",
      confidence: signals.mentionsSuburbanProactive ? "medium" : "low",
      reasoning: signals.mentionsSuburbanProactive
        ? "Uses growth/readiness language"
        : "Default for grade 5-10 students without other strong signals",
      signals,
    };
  }
  return {
    persona: "unclassified",
    confidence: "low",
    reasoning: "Not enough signals to classify",
    signals,
  };
}

export const PERSONA_LABELS: Record<Persona, string> = {
  proactive_suburban: "Proactive Suburban",
  travel_ball_family: "Travel Ball Family",
  homeschool_family: "Homeschool Family",
  falling_behind: "Falling Behind",
  competition_math: "Competition Math",
  school_partner: "School Partner",
  unclassified: "Unclassified",
};

export const PERSONA_COLORS: Record<Persona, string> = {
  proactive_suburban: "bg-blue-100 text-blue-800",
  travel_ball_family: "bg-orange-100 text-orange-800",
  homeschool_family: "bg-emerald-100 text-emerald-800",
  falling_behind: "bg-red-100 text-red-800",
  competition_math: "bg-purple-100 text-purple-800",
  school_partner: "bg-indigo-100 text-indigo-800",
  unclassified: "bg-slate-100 text-slate-600",
};

export const PERSONA_PRIORITY: Record<Persona, number> = {
  falling_behind: 1,
  school_partner: 2,
  competition_math: 3,
  travel_ball_family: 4,
  homeschool_family: 5,
  proactive_suburban: 6,
  unclassified: 7,
};

export const PERSONA_RECOMMENDATIONS: Record<Persona, string> = {
  proactive_suburban:
    "Emphasize named coach, mastery tracking, and structured progress. Foundation program fits best; upsell to Acceleration.",
  travel_ball_family:
    "Position as 'the travel ball of math'. Compare ROI vs sports spend. Acceleration is primary; Advanced for students pursuing demanding mathematics.",
  homeschool_family:
    "Lead with homeschool compliance exports and mastery portfolio. Foundation fits most. Highlight peer interaction in small cohorts.",
  falling_behind:
    "Urgent — respond within 24 hours. Summer clinic ($249) as low-risk entry. Free diagnostic reveals exact gap. Foundation for rebuilding.",
  competition_math:
    "Advanced program is the primary fit. Highlight Mathathlon + AMC/MATHCOUNTS prep. Emphasize small cohort vs RSM's 20-student classes.",
  school_partner:
    "B2B sales cycle. Send partnership deck. Focus on diagnostic-driven placement, mastery data for admins, and coach certification.",
  unclassified:
    "Follow up with a discovery call to identify the primary need and recommend the appropriate persona pathway.",
};
