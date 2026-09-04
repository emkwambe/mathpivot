// Rich structured content for each training module. Keyed by slug (which
// matches training_modules.slug in the database). The DB stores metadata
// (title, description, estimated_minutes, tier); this file stores the
// long-form learning content shown on the module detail page.
//
// To edit a module's content, change the entry below. To add a new module,
// add it here AND insert a corresponding row in training_modules.

export type ContentSection =
  | { type: "text"; body: string }
  | { type: "list"; items: string[] }
  | {
      type: "table";
      title?: string;
      columns: string[];
      rows: string[][];
    }
  | { type: "note"; label: string; body: string };

export interface ModuleContent {
  purpose: string;
  objectives?: string[];
  sections: ContentSection[];
  completionEvidence: string;
}

export const MODULE_CONTENT: Record<string, ModuleContent> = {
  "mp-philosophy": {
    purpose:
      "Understand the principles that distinguish MathPivot coaching from conventional tutoring.",
    objectives: [
      "The named-coach relationship",
      "Mastery-centered progression",
      "Alignment with each student's school curriculum",
      "Strategic gap repair without allowing remediation to consume the entire program",
      "Previewing upcoming concepts so students can remain ahead of the curve",
      "Small-group social learning",
      "College, career, and competition exposure",
    ],
    sections: [
      {
        type: "text",
        body: "Coaches will learn why MathPivot does not simply help students finish homework or prepare for the next test. The goal is to help students become mathematically capable, confident, and increasingly independent.",
      },
    ],
    completionEvidence:
      "Short reflection explaining how MathPivot coaching differs from homework-based tutoring.",
  },

  "mp-session-structure": {
    purpose:
      "Learn how to lead a focused, structured session while remaining responsive to the needs of individual students.",
    sections: [
      {
        type: "table",
        title: "Standard session structure",
        columns: ["Segment", "Time", "Purpose"],
        rows: [
          [
            "Readiness warm-up",
            "10 min",
            "Activate prerequisite knowledge and identify immediate misconceptions",
          ],
          [
            "Review and retrieval",
            "10 min",
            "Revisit recent concepts and check whether learning has been retained",
          ],
          [
            "Core concept development",
            "15 min",
            "Introduce, clarify, or extend the session's primary concept",
          ],
          [
            "Guided and collaborative practice",
            "20 min",
            "Develop reasoning through individual, paired, and group problem solving",
          ],
          [
            "Reflection and next step",
            "5 min",
            "Confirm learning, record evidence, and explain what comes next",
          ],
        ],
      },
      {
        type: "text",
        body: "The structure is a planning framework, not a rigid script. Coaches learn when to adjust timing without losing the purpose of the session.",
      },
    ],
    completionEvidence: "Prepare and annotate a sample 60-minute session plan.",
  },

  "mp-mastery-tracking": {
    purpose:
      "Learn how MathPivot records progress at the concept level rather than relying only on completed assignments, attendance, or test scores.",
    sections: [
      {
        type: "table",
        title: "Mastery progression",
        columns: ["Level", "Meaning"],
        rows: [
          ["Not started", "The concept has not yet been taught or assessed"],
          [
            "Introduced",
            "The student has encountered the concept but still requires substantial support",
          ],
          [
            "Developing",
            "The student demonstrates partial understanding with inconsistent accuracy or reasoning",
          ],
          [
            "Proficient",
            "The student can solve representative problems independently and explain the main reasoning",
          ],
          [
            "Mastered",
            "The student demonstrates accurate, durable, and transferable understanding across contexts",
          ],
        ],
      },
      {
        type: "text",
        body: "Coaches learn how to gather evidence, distinguish temporary success from durable mastery, determine when a student is ready to advance, and respond when progress stalls.",
      },
    ],
    completionEvidence:
      "Evaluate sample student work and assign evidence-based mastery levels.",
  },

  "mp-diagnostic-admin": {
    purpose:
      "Learn how to administer MathPivot diagnostics consistently and use the results to guide instruction.",
    sections: [
      {
        type: "text",
        body: "This module covers:",
      },
      {
        type: "list",
        items: [
          "Preparing the student for the diagnostic",
          "Preserving assessment validity",
          "Scoring responses consistently",
          "Interpreting domain and prerequisite patterns",
          "Distinguishing knowledge gaps from procedural mistakes",
          "Identifying strengths that can support new learning",
          "Recommending the appropriate program, cohort, and starting point",
        ],
      },
      {
        type: "text",
        body: "A diagnostic supports professional judgment; it does not define a student's ability or potential.",
      },
    ],
    completionEvidence:
      "Score a sample diagnostic and write a placement recommendation.",
  },

  "mp-onboarding-protocol": {
    purpose:
      "Learn the six-step process used to establish a productive coaching relationship from the beginning.",
    sections: [
      {
        type: "list",
        items: [
          "Build rapport and understand the student's experience with mathematics.",
          "Administer or review the diagnostic.",
          "Align expectations with the student and parent or guardian.",
          "Create the initial learning plan.",
          "Establish the communication rhythm.",
          "Deliver the first mastery update.",
        ],
      },
      {
        type: "text",
        body: "Coaches also learn how to explain the role of the student, coach, family, and school without promising outcomes that depend on factors outside MathPivot's control.",
      },
    ],
    completionEvidence:
      "Complete a sample onboarding record and initial learning plan.",
  },

  "mp-parent-communication": {
    purpose:
      "Learn how to communicate clearly, honestly, and constructively with families.",
    sections: [
      { type: "text", body: "This module covers:" },
      {
        type: "list",
        items: [
          "Conducting the initial alignment conversation",
          "Explaining diagnostic and mastery information in plain language",
          "Writing concise progress updates",
          "Communicating strengths as well as concerns",
          "Responding to questions about grades, pacing, and assignments",
          "Separating observable evidence from assumptions",
          "Escalating academic, behavioral, or safeguarding concerns appropriately",
          "Using feedback surveys to identify service-quality concerns",
        ],
      },
      {
        type: "text",
        body: "The goal is informed partnership, not constant reporting or guaranteed satisfaction scores.",
      },
    ],
    completionEvidence:
      "Write a weekly progress update and respond to a sample parent concern.",
  },

  "mp-platform-training": {
    purpose:
      "Learn how to use the MathPivot platform before, during, and after a coaching session.",
    sections: [
      { type: "text", body: "Coaches practice:" },
      {
        type: "list",
        items: [
          "Reviewing session-preparation briefs",
          "Recording attendance and check-ins",
          "Accessing student learning plans",
          "Updating concept-level mastery",
          "Capturing brief instructional evidence",
          "Using the digital whiteboard and approved mathematics tools",
          "Reviewing school-alignment information",
          "Recording follow-up actions",
        ],
      },
      {
        type: "text",
        body: "This module also explains data privacy, appropriate recordkeeping, and what should never be entered into student notes.",
      },
    ],
    completionEvidence:
      "Complete a simulated coaching workflow in the platform.",
  },

  "mp-curriculum-overview": {
    purpose:
      "Learn how MathPivot organizes mathematics into teachable concepts, prerequisites, units, and progression pathways.",
    sections: [
      { type: "text", body: "This module covers:" },
      {
        type: "list",
        items: [
          "Navigating the concept map",
          "Identifying prerequisite relationships",
          "Aligning sessions with the student's current school curriculum",
          "Repairing essential gaps efficiently",
          "Previewing upcoming concepts",
          "Selecting appropriate examples and practice tasks",
          "Planning for retention and transfer",
          "Adapting instruction across active MathPivot programs and cohorts",
        ],
      },
      {
        type: "text",
        body: "Coaches learn to use the Session Prep Brief as a starting point while applying professional judgment to the students actually present.",
      },
    ],
    completionEvidence:
      "Create a one-week coaching plan from a sample Session Prep Brief.",
  },

  "mp-small-group-dynamics": {
    purpose:
      "Develop the skills needed to coach a cohort of typically five and no more than six students without turning the session into a sequence of miniature private lessons.",
    sections: [
      { type: "text", body: "This module covers:" },
      {
        type: "list",
        items: [
          "Establishing group routines",
          "Using purposeful student discussion",
          "Rotating attention equitably",
          "Checking every student's understanding",
          "Differentiating by support, representation, and challenge",
          "Managing differences in pace",
          "Using student explanations without creating embarrassment",
          "Maintaining productive participation",
          "Recording individual evidence within a shared session",
        ],
      },
      {
        type: "text",
        body: "Small-group coaching should preserve individual accountability while using peer reasoning and social learning as instructional strengths.",
      },
    ],
    completionEvidence:
      "Respond to a classroom scenario and design a differentiation plan for six students.",
  },

  "mp-certification-assessment": {
    purpose:
      "Demonstrate readiness to coach MathPivot students safely, consistently, and effectively.",
    sections: [
      { type: "text", body: "The assessment includes:" },
      {
        type: "list",
        items: [
          "Knowledge questions covering the MathPivot Method",
          "Mastery-level classification",
          "Diagnostic interpretation",
          "Parent-communication scenarios",
          "Small-group coaching decisions",
          "A complete sample session plan",
          "Professional conduct and safeguarding scenarios",
        ],
      },
      {
        type: "note",
        label: "Certification requirements",
        body: "To earn Certified Coach status, a candidate must: complete Modules 1–9; score at least 80% on the knowledge and scenario assessment; submit an acceptable session plan; complete any required safeguarding or background-check requirements; and acknowledge the MathPivot Coach Code of Conduct.",
      },
      {
        type: "text",
        body: "Candidates who do not meet the standard receive targeted feedback and may complete a reassessment.",
      },
    ],
    completionEvidence:
      "Contact your program administrator to schedule and complete the assessment. Assessment is proctored; results are recorded by the administrator.",
  },

  "mp-competition-prep": {
    purpose:
      "Learn how to prepare students for Mathathlon, MATHCOUNTS, AMC 8, AMC 10, and other approved mathematical challenges.",
    sections: [
      { type: "text", body: "This module covers:" },
      {
        type: "list",
        items: [
          "Non-routine problem-solving strategies",
          "Pattern recognition and representation",
          "Strategic use of time",
          "Productive struggle",
          "Solution comparison",
          "Competition preparation cycles",
          "Managing performance anxiety",
          "Maintaining healthy expectations",
        ],
      },
      {
        type: "text",
        body: "Competition coaching should deepen mathematical thinking rather than reduce learning to shortcuts or test tricks.",
      },
    ],
    completionEvidence:
      "Develop a four-session preparation sequence for a selected competition.",
  },

  "mp-career-exposure": {
    purpose:
      "Learn how to connect mathematical learning to authentic educational and career opportunities.",
    sections: [
      { type: "text", body: "This module covers:" },
      {
        type: "list",
        items: [
          "Brief monthly career connections",
          "Periodic RIASEC-guided exploration",
          "Connecting concepts to real fields without forcing superficial examples",
          "Introducing competitions, courses, projects, and enrichment opportunities",
          "Avoiding premature career labeling",
          "Documenting student interests and follow-up opportunities",
        ],
      },
      {
        type: "text",
        body: "Career exposure is intended to expand what students can imagine, not pressure them into making early career decisions.",
      },
    ],
    completionEvidence:
      "Create an age-appropriate career connection for a selected mathematics concept.",
  },

  "mp-coach-calibration": {
    purpose:
      "Learn how to facilitate calibration sessions that improve consistency without eliminating coach judgment or individual teaching style.",
    sections: [
      { type: "text", body: "This module covers:" },
      {
        type: "list",
        items: [
          "Reviewing student work and mastery evidence",
          "Comparing scoring decisions",
          "Discussing challenging concepts",
          "Identifying inconsistent instructional practices",
          "Sharing successful approaches",
          "Recording agreed quality standards",
          "Following up on unresolved concerns",
        ],
      },
    ],
    completionEvidence:
      "Facilitate or simulate a calibration discussion using sample student work.",
  },

  "mp-train-the-trainer": {
    purpose:
      "Learn how to onboard, observe, support, and evaluate new MathPivot coaches.",
    sections: [
      { type: "text", body: "This module covers:" },
      {
        type: "list",
        items: [
          "Planning a coach's onboarding sequence",
          "Modeling an effective session",
          "Conducting structured observations",
          "Using the Coach Quality Rubric",
          "Delivering specific, evidence-based feedback",
          "Creating improvement plans",
          "Recognizing when additional support or escalation is required",
          "Separating mentoring from formal performance decisions",
        ],
      },
    ],
    completionEvidence:
      "Review a simulated session and prepare a written feedback conversation.",
  },

  "mp-master-assessment": {
    purpose:
      "Demonstrate the instructional judgment, communication skill, and leadership readiness required of a MathPivot Master Coach.",
    sections: [
      { type: "text", body: "The assessment includes:" },
      {
        type: "list",
        items: [
          "A live or recorded session observation",
          "Analysis of student mastery evidence",
          "Responses to complex coaching scenarios",
          "Facilitation of a calibration activity",
          "Feedback for a hypothetical new coach",
          "A structured coach-development plan",
        ],
      },
      {
        type: "note",
        label: "Master Coach status",
        body: "Master Coach status is awarded only after all required evidence has been reviewed and approved. Completing the modules alone does not guarantee advancement.",
      },
    ],
    completionEvidence:
      "Contact your program administrator to schedule the Master Coach assessment. Requires prior Certified Coach status.",
  },
};

export function getModuleContent(slug: string): ModuleContent | null {
  return MODULE_CONTENT[slug] ?? null;
}
