// MathPivot Coach Code of Conduct.
//
// The version string is stored on coach_onboarding_progress when a coach
// accepts. Bumping the version here means a coach's acceptance is stale
// and the UI should re-prompt.

export const CODE_OF_CONDUCT_VERSION = "2026-09-04";

export const CODE_OF_CONDUCT_TITLE = "MathPivot Coach Code of Conduct";

export interface CocSection {
  heading: string;
  paragraphs: string[];
}

export const CODE_OF_CONDUCT_SECTIONS: CocSection[] = [
  {
    heading: "Purpose",
    paragraphs: [
      "MathPivot Math Coaches occupy a position of trust with students, families, schools, and the mathematics profession. This Code of Conduct describes the professional standards that make that trust possible.",
      "Signing this document affirms that the coach has read, understood, and will act in accordance with these standards.",
    ],
  },
  {
    heading: "1. Student welfare",
    paragraphs: [
      "The safety, dignity, and academic development of every student comes before every other consideration.",
      "Coaches will maintain a professional relationship at all times; use age-appropriate language and tone; and will not engage in private communication with a student outside the platform without a parent or guardian aware.",
      "Any suspected safeguarding concern — physical, emotional, or academic — must be escalated to the MathPivot Coach Lead promptly and in writing.",
    ],
  },
  {
    heading: "2. Instructional integrity",
    paragraphs: [
      "MathPivot prepares students by strengthening understanding. Coaches will not obtain, reproduce, or use unauthorized assessment materials, and will not complete graded work on a student's behalf.",
      "Coaches teach mathematical reasoning, problem-solving, and skill development. They do not guarantee grades, test outcomes, or class placements.",
    ],
  },
  {
    heading: "3. School alignment boundaries",
    paragraphs: [
      "Coaches use only school information voluntarily provided by the student, family, or a participating school. They do not contact school staff, evaluate teachers, or speak on behalf of the school.",
      "Unconfirmed pacing or curriculum information is marked provisional. Estimates are not presented as official school plans.",
    ],
  },
  {
    heading: "4. Communication with families",
    paragraphs: [
      "Coaches communicate clearly, honestly, and constructively with families. Progress updates share both strengths and concerns and are based on observable evidence.",
      "Coaches respond to family messages within one business day. Sensitive concerns are escalated to the Coach Lead rather than handled unilaterally.",
    ],
  },
  {
    heading: "5. Privacy and recordkeeping",
    paragraphs: [
      "Coaches will not share, forward, or discuss identifiable student information outside the platform except as required for lawful safeguarding reasons.",
      "Coach notes describe observable mathematical evidence. They do not include personal medical, family, disciplinary, or other sensitive information not necessary for instruction.",
    ],
  },
  {
    heading: "6. Session conduct",
    paragraphs: [
      "Sessions begin on time, end on time, and follow the MathPivot session structure while remaining responsive to the students actually present.",
      "Coaches record attendance, mastery evidence, and follow-up actions in the platform after each session.",
      "Coaches do not conduct MathPivot sessions while impaired, distracted, or in a setting that compromises student privacy or safety.",
    ],
  },
  {
    heading: "7. Professional conduct outside MathPivot",
    paragraphs: [
      "Coaches will not recruit MathPivot students or families into private tutoring arrangements or competing services.",
      "Coaches will not misrepresent MathPivot, its programs, or their own certification status in public communications.",
    ],
  },
  {
    heading: "8. Background check and eligibility",
    paragraphs: [
      "Coaches attest to a completed background check within the last twelve months and will notify the Coach Lead promptly if any new information arises that would affect eligibility to work with minors.",
    ],
  },
  {
    heading: "9. Reporting and accountability",
    paragraphs: [
      "Coaches report knowledge of any violation of this Code of Conduct — their own or another coach's — to the Coach Lead.",
      "MathPivot may suspend or revoke certification for violations of this Code. Coaches will receive written notice of the concern and an opportunity to respond, except where student safety requires immediate action.",
    ],
  },
];
