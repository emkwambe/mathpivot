// Certified Coach Assessment question bank.
//
// 15 multiple-choice questions covering the nine required Certified
// modules. A coach must answer at least 12 of 15 correctly (80%) to
// pass the assessment. Order is shuffled at render time so retakes do
// not simply recall the previous sequence.

export interface AssessmentQuestion {
  id: string;
  topic: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  rationale: string;
}

export const CERTIFIED_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "philosophy-goal",
    topic: "The MathPivot Method",
    prompt: "What is the primary purpose of a MathPivot coaching relationship?",
    choices: [
      "To help students complete tonight's homework accurately",
      "To ensure students earn the highest possible grade on the next test",
      "To help students become mathematically capable, confident, and increasingly independent",
      "To keep students ahead of every classmate in their school",
    ],
    correctIndex: 2,
    rationale:
      "MathPivot exists to build durable mathematical capability and independence — not to complete homework or guarantee grades.",
  },
  {
    id: "session-warmup",
    topic: "The 60-Minute Coaching Session",
    prompt:
      "During the standard 10-minute readiness warm-up, what is the coach primarily trying to do?",
    choices: [
      "Introduce today's brand-new concept quickly",
      "Activate prerequisite knowledge and identify immediate misconceptions",
      "Grade last week's homework",
      "Give the student a graded quiz on the previous unit",
    ],
    correctIndex: 1,
    rationale:
      "The warm-up activates prior knowledge and surfaces misconceptions before new material is introduced.",
  },
  {
    id: "session-structure-purpose",
    topic: "The 60-Minute Coaching Session",
    prompt: "The five-segment session structure is best understood as:",
    choices: [
      "A rigid script that must be followed step by step every session",
      "A planning framework — coaches adjust timing while preserving each segment's purpose",
      "A grading rubric used by admin to evaluate coaches",
      "A guideline that only applies to Foundation students",
    ],
    correctIndex: 1,
    rationale:
      "The structure is a planning framework, not a script. Coaches adjust timing without losing each segment's purpose.",
  },
  {
    id: "mastery-levels",
    topic: "Mastery Tracking",
    prompt:
      "A student solves representative problems independently and can explain the main reasoning, but has not yet demonstrated the concept in unfamiliar contexts. Which mastery level fits best?",
    choices: ["Introduced", "Developing", "Proficient", "Mastered"],
    correctIndex: 2,
    rationale:
      "Proficient means the student can solve representative problems independently and explain the reasoning. Mastered requires accurate, durable, transferable understanding across contexts.",
  },
  {
    id: "mastery-evidence",
    topic: "Mastery Tracking",
    prompt: "Which of the following is the strongest evidence of true mastery?",
    choices: [
      "The student answered ten homework problems in a row correctly last night",
      "The student earned an A on Friday's quiz",
      "The student can accurately solve and explain the concept across different problem types over several sessions",
      "The student says they feel confident with the topic",
    ],
    correctIndex: 2,
    rationale:
      "Mastery requires accurate, durable, transferable understanding demonstrated across contexts — not a single high score or a self-report.",
  },
  {
    id: "diagnostic-purpose",
    topic: "Administering Diagnostics",
    prompt: "A MathPivot diagnostic should be treated as:",
    choices: [
      "A definitive measure of the student's mathematical ability",
      "A tool that supports professional judgment about placement and instruction",
      "A pass/fail entrance exam that gates enrollment",
      "A confidential ranking of the student against their peers",
    ],
    correctIndex: 1,
    rationale:
      "A diagnostic supports professional judgment. It does not define a student's ability or potential.",
  },
  {
    id: "gap-repair-priority",
    topic: "Curriculum Navigation",
    prompt:
      "A student has three prerequisite gaps affecting the current unit. What is the recommended coaching response?",
    choices: [
      "Pause the current-course work and remediate all three gaps until they are all resolved",
      "Prioritize no more than two immediate gap-repair priorities and continue current-course work",
      "Escalate the student to a lower program tier immediately",
      "Report the gaps to the school teacher for classroom follow-up",
    ],
    correctIndex: 1,
    rationale:
      "Gap repair should be targeted — no more than two immediate priorities at a time — while the coach continues to support the current course.",
  },
  {
    id: "onboarding-first-step",
    topic: "Student Onboarding Protocol",
    prompt:
      "What is the first step in the six-step onboarding sequence for a new student?",
    choices: [
      "Deliver the first mastery update",
      "Build rapport and understand the student's experience with mathematics",
      "Create the learning plan",
      "Administer the diagnostic",
    ],
    correctIndex: 1,
    rationale:
      "Onboarding begins with rapport and understanding the student's relationship with math. Diagnostic, alignment, plan, cadence, and mastery update follow.",
  },
  {
    id: "parent-communication",
    topic: "Parent and Guardian Communication",
    prompt:
      "A parent asks whether their child will earn an A this semester. The best coaching response is to:",
    choices: [
      "Promise the A if the student attends every session",
      "Refuse to discuss grades because they are the school's responsibility",
      "Describe observable progress and be clear that final grades depend on classroom performance and factors outside MathPivot's control",
      "Estimate a specific grade based on current homework scores",
    ],
    correctIndex: 2,
    rationale:
      "Coaches share observable evidence and are honest about what MathPivot can and cannot influence. They do not promise or estimate specific grades.",
  },
  {
    id: "parent-updates",
    topic: "Parent and Guardian Communication",
    prompt: "A weekly progress update to a family should:",
    choices: [
      "Cover only positive news to keep the family motivated",
      "Communicate both strengths and concerns using observable evidence",
      "Be identical for every student to save the coach's time",
      "Recommend a specific tier upgrade or downgrade",
    ],
    correctIndex: 1,
    rationale:
      "Progress updates communicate both strengths and concerns, separating observable evidence from assumptions.",
  },
  {
    id: "small-group-differentiation",
    topic: "Small-Group Coaching",
    prompt:
      "In a five-student cohort where three students are on-pace and two are working through a lingering gap, the coach should:",
    choices: [
      "Give private mini-lessons in sequence — each student one at a time",
      "Slow the entire group to the pace of the two struggling students",
      "Differentiate by support, representation, or challenge while keeping shared instructional moments and using peer reasoning",
      "Remove the two struggling students from the cohort",
    ],
    correctIndex: 2,
    rationale:
      "Small-group coaching uses differentiation and peer reasoning as instructional strengths. It does not become a sequence of private lessons.",
  },
  {
    id: "small-group-participation",
    topic: "Small-Group Coaching",
    prompt: "Individual accountability inside a small-group session means:",
    choices: [
      "Every student is called on the same number of times regardless of readiness",
      "Only the highest-performing student is asked to explain their thinking",
      "The coach checks every student's understanding and records individual evidence within the shared session",
      "Students grade each other's work at the end",
    ],
    correctIndex: 2,
    rationale:
      "Every student's understanding is checked and individual evidence is recorded, even while working within a shared session.",
  },
  {
    id: "conduct-assessment-materials",
    topic: "Professional conduct",
    prompt:
      "A student's classroom teacher has posted the answer key to next week's test on an unsecured web page. The coach should:",
    choices: [
      "Use the answer key discreetly to prepare the student — it was publicly posted",
      "Share the answer key with the parent so they can decide",
      "Not obtain, reproduce, or use the material, and continue preparing the student by strengthening understanding of the tested concepts",
      "Report the teacher to the school district",
    ],
    correctIndex: 2,
    rationale:
      "Coaches strengthen understanding. They must not obtain, reproduce, or use unauthorized assessment materials, regardless of how the material was posted.",
  },
  {
    id: "safeguarding-escalation",
    topic: "Professional conduct",
    prompt:
      "During a session a student mentions something that raises a safeguarding concern. The coach should:",
    choices: [
      "Investigate on their own to be sure the concern is real",
      "Wait until the concern is repeated before acting",
      "Escalate promptly and in writing to the MathPivot Coach Lead",
      "Discuss the concern with other coaches for their advice",
    ],
    correctIndex: 2,
    rationale:
      "Any suspected safeguarding concern must be escalated to the Coach Lead promptly and in writing.",
  },
  {
    id: "school-boundaries",
    topic: "Curriculum Navigation",
    prompt:
      "The student's family is not sure exactly what topic the classroom teacher is covering next. The coach should:",
    choices: [
      "Email the teacher directly for the pacing information",
      "Guess based on the student's textbook and present the guess as official",
      "Mark the pacing information as provisional and plan accordingly, or ask the family to confirm with the school",
      "Assume every school covers the same topic in the same order and proceed",
    ],
    correctIndex: 2,
    rationale:
      "Coaches use only authorized school information, mark unconfirmed items provisional, and do not contact school staff without proper authorization.",
  },
];

export const PASS_THRESHOLD_PERCENT = 80;
