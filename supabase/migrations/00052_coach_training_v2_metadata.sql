-- Migration 00052: Coach Training v2 — metadata refresh
-- Aligns the seeded training_modules rows with the v2 curriculum spec:
--   Certified tier: 10 modules · ~6h 20m (380 min)
--   Master tier:     5 modules · ~4h 25m (265 min)
-- Rich long-form content lives in src/lib/training/module-content.ts
-- (loaded by slug at render time). This migration only updates title,
-- description and estimated_minutes for the existing rows. Slugs are
-- unchanged, so coach progress rows keyed by module_id remain valid.
--
-- Also removes the "confidence pulse survey above 4.0" text from the
-- parent-communication module description — certification must not
-- depend directly on a satisfaction score.

UPDATE training_modules SET
  title = 'The MathPivot Method',
  description = 'Understand the principles that distinguish MathPivot coaching from conventional tutoring — the named-coach relationship, mastery-centered progression, alignment with the student''s school curriculum, and how coaches help students become mathematically capable, confident, and increasingly independent.',
  estimated_minutes = 30
WHERE slug = 'mp-philosophy';

UPDATE training_modules SET
  title = 'The 60-Minute Coaching Session',
  description = 'Learn how to lead a focused, structured session while remaining responsive to the needs of individual students. The five-segment framework (warm-up, review, core, practice, reflection) is a planning tool, not a rigid script.',
  estimated_minutes = 45
WHERE slug = 'mp-session-structure';

UPDATE training_modules SET
  title = 'Mastery Tracking System',
  description = 'Learn how MathPivot records progress at the concept level rather than relying only on completed assignments, attendance, or test scores. Covers the five-level mastery progression and how to gather evidence, advance students, and respond when progress stalls.',
  estimated_minutes = 30
WHERE slug = 'mp-mastery-tracking';

UPDATE training_modules SET
  title = 'Administering Diagnostics',
  description = 'Learn how to administer MathPivot diagnostics consistently, preserve assessment validity, interpret domain and prerequisite patterns, and make placement recommendations. A diagnostic supports professional judgment; it does not define a student''s ability or potential.',
  estimated_minutes = 40
WHERE slug = 'mp-diagnostic-admin';

UPDATE training_modules SET
  title = 'Student Onboarding Protocol',
  description = 'Learn the six-step process used to establish a productive coaching relationship from the beginning — rapport, diagnostic, expectation alignment, initial learning plan, communication rhythm, and first mastery update.',
  estimated_minutes = 25
WHERE slug = 'mp-onboarding-protocol';

-- Note: previous description referenced maintaining a satisfaction score
-- above 4.0. Removed here — coaches can be accountable for communication
-- quality and responsiveness, but certification should not depend directly
-- on any particular survey score.
UPDATE training_modules SET
  title = 'Parent and Guardian Communication',
  description = 'Learn how to communicate clearly, honestly, and constructively with families — alignment calls, progress updates, plain-language explanations of diagnostic and mastery information, and appropriate escalation of academic, behavioral, or safeguarding concerns.',
  estimated_minutes = 35
WHERE slug = 'mp-parent-communication';

UPDATE training_modules SET
  title = 'Platform and Coaching Tools',
  description = 'Learn how to use the MathPivot platform before, during, and after a coaching session — session-preparation briefs, attendance and check-ins, mastery updates, the digital whiteboard, and data-privacy expectations.',
  estimated_minutes = 30
WHERE slug = 'mp-platform-training';

UPDATE training_modules SET
  title = 'Curriculum Navigation and Session Planning',
  description = 'Learn how MathPivot organizes mathematics into teachable concepts, prerequisites, and progression pathways, and how to use the Session Prep Brief as a starting point while applying professional judgment to the students actually present.',
  estimated_minutes = 45
WHERE slug = 'mp-curriculum-overview';

UPDATE training_modules SET
  title = 'Small-Group Coaching',
  description = 'Develop the skills needed to coach a cohort of typically five and no more than six students without turning the session into a sequence of miniature private lessons. Preserve individual accountability while using peer reasoning as an instructional strength.',
  estimated_minutes = 40
WHERE slug = 'mp-small-group-dynamics';

UPDATE training_modules SET
  title = 'Certified Coach Assessment',
  description = 'Demonstrate readiness to coach MathPivot students safely, consistently, and effectively. Includes knowledge questions, mastery classification, diagnostic interpretation, parent-communication and small-group scenarios, a complete sample session plan, and professional conduct scenarios. Requires 80% or higher and an acceptable session plan.',
  estimated_minutes = 60
WHERE slug = 'mp-certification-assessment';

-- Master tier

UPDATE training_modules SET
  title = 'Advanced and Competition Coaching',
  description = 'Learn how to prepare students for Mathathlon, MATHCOUNTS, AMC 8, AMC 10, and other approved mathematical challenges. Competition coaching should deepen mathematical thinking rather than reduce learning to shortcuts or test tricks.',
  estimated_minutes = 45
WHERE slug = 'mp-competition-prep';

UPDATE training_modules SET
  title = 'Career and Opportunity Exposure',
  description = 'Learn how to connect mathematical learning to authentic educational and career opportunities without forcing superficial examples or pressuring students into early career decisions.',
  estimated_minutes = 30
WHERE slug = 'mp-career-exposure';

UPDATE training_modules SET
  title = 'Leading Instructional Calibration',
  description = 'Learn how to facilitate calibration sessions that improve consistency without eliminating coach judgment or individual teaching style — reviewing student work, comparing scoring decisions, and recording agreed quality standards.',
  estimated_minutes = 40
WHERE slug = 'mp-coach-calibration';

UPDATE training_modules SET
  title = 'Training and Mentoring New Coaches',
  description = 'Learn how to onboard, observe, support, and evaluate new MathPivot coaches — planning an onboarding sequence, structured observations, evidence-based feedback, and knowing when additional support or escalation is required.',
  estimated_minutes = 60
WHERE slug = 'mp-train-the-trainer';

UPDATE training_modules SET
  title = 'Master Coach Assessment',
  description = 'Demonstrate the instructional judgment, communication skill, and leadership readiness required of a MathPivot Master Coach. Includes a live or recorded session observation, mastery evidence analysis, complex coaching scenarios, calibration facilitation, and a coach-development plan. Master Coach status is awarded only after all required evidence has been reviewed and approved.',
  estimated_minutes = 90
WHERE slug = 'mp-master-assessment';
