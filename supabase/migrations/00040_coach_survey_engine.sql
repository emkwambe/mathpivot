-- Migration 00040: Coach Survey Engine
-- Mini-survey system for structured coaching check-ins

-- Survey templates (system-defined + coach-custom)
CREATE TABLE IF NOT EXISTS survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('session_checkin', 'school_pulse', 'parent_pulse', 'career_interest', 'onboarding', 'custom')),
  target_role TEXT NOT NULL CHECK (target_role IN ('coach', 'student', 'parent')),
  questions JSONB NOT NULL DEFAULT '[]',
  frequency_days INTEGER, -- NULL = one-time or ad-hoc
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Survey responses
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES survey_templates(id),
  enrollment_id UUID REFERENCES program_enrollments(id),
  student_id UUID REFERENCES auth.users(id),
  respondent_id UUID NOT NULL REFERENCES auth.users(id),
  respondent_role TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ DEFAULT now(),
  session_id UUID REFERENCES sessions(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Survey schedule tracker (when each required survey is next due)
CREATE TABLE IF NOT EXISTS survey_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES survey_templates(id),
  enrollment_id UUID NOT NULL REFERENCES program_enrollments(id),
  next_due_at TIMESTAMPTZ NOT NULL,
  last_completed_at TIMESTAMPTZ,
  is_overdue BOOLEAN GENERATED ALWAYS AS (next_due_at < now() AND last_completed_at IS NULL OR last_completed_at < next_due_at) STORED,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(template_id, enrollment_id)
);

-- Career interest profiles (aggregated from career interest surveys)
CREATE TABLE IF NOT EXISTS student_career_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id),
  riasec_scores JSONB DEFAULT '{}',
  top_careers TEXT[] DEFAULT '{}',
  last_assessed_at TIMESTAMPTZ,
  survey_response_id UUID REFERENCES survey_responses(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id)
);

-- Add school_current_topic to academic profiles for school pulse tracking
DO $$ BEGIN
  ALTER TABLE student_academic_profiles
    ADD COLUMN school_current_topic TEXT,
    ADD COLUMN school_topic_updated_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_survey_responses_enrollment ON survey_responses(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_student ON survey_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_template ON survey_responses(template_id);
CREATE INDEX IF NOT EXISTS idx_survey_schedule_overdue ON survey_schedule(next_due_at) WHERE last_completed_at IS NULL OR last_completed_at < next_due_at;

-- RLS
ALTER TABLE survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_career_interests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "survey_templates_read" ON survey_templates FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "survey_responses_coach_insert" ON survey_responses FOR INSERT
    WITH CHECK (respondent_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "survey_responses_read" ON survey_responses FOR SELECT
    USING (respondent_id = auth.uid() OR student_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "survey_schedule_read" ON survey_schedule FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "career_interests_read" ON student_career_interests FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed system survey templates

-- 1. School Pulse (1 question, session start)
INSERT INTO survey_templates (slug, title, description, category, target_role, questions, frequency_days, is_system) VALUES
('school_pulse', 'School Topic Pulse', 'Quick check: what is the student covering in school right now?', 'school_pulse', 'coach', '[
  {"key": "current_topic", "type": "text", "label": "What math topic is your class working on right now?", "placeholder": "e.g., Solving equations, Geometry proofs, Graphing functions..."}
]', 7, true)
ON CONFLICT (slug) DO NOTHING;

-- 2. Parent Confidence Pulse (3 questions, monthly)
INSERT INTO survey_templates (slug, title, description, category, target_role, questions, frequency_days, is_system) VALUES
('parent_pulse', 'Parent Confidence Pulse', 'Monthly check-in: how confident is the parent in their child''s progress?', 'parent_pulse', 'parent', '[
  {"key": "confidence", "type": "scale_1_5", "label": "How confident are you in your child''s math progress?", "anchors": ["Not confident", "Very confident"]},
  {"key": "communication", "type": "scale_1_5", "label": "How well does your child''s coach communicate with you?", "anchors": ["Poorly", "Excellently"]},
  {"key": "nps", "type": "scale_0_10", "label": "How likely are you to recommend MathPivot to another family?", "anchors": ["Not likely", "Extremely likely"]}
]', 30, true)
ON CONFLICT (slug) DO NOTHING;

-- 3. Career Interest Mini (10 questions, quarterly RIASEC-lite)
INSERT INTO survey_templates (slug, title, description, category, target_role, questions, frequency_days, is_system) VALUES
('career_interest', 'Career Interest Check', 'Quarterly: discover which careers match the student''s interests.', 'career_interest', 'student', '[
  {"key": "r1", "type": "enjoy_scale", "label": "Building or fixing things with your hands", "domain": "realistic"},
  {"key": "i1", "type": "enjoy_scale", "label": "Solving puzzles or figuring out how things work", "domain": "investigative"},
  {"key": "a1", "type": "enjoy_scale", "label": "Creating art, music, or designs", "domain": "artistic"},
  {"key": "s1", "type": "enjoy_scale", "label": "Helping people learn or solve problems", "domain": "social"},
  {"key": "e1", "type": "enjoy_scale", "label": "Leading a team or starting a project", "domain": "enterprising"},
  {"key": "c1", "type": "enjoy_scale", "label": "Organizing data or following detailed steps", "domain": "conventional"},
  {"key": "i2", "type": "enjoy_scale", "label": "Using math to analyze patterns or predict outcomes", "domain": "investigative"},
  {"key": "r2", "type": "enjoy_scale", "label": "Writing code or programming computers", "domain": "realistic"},
  {"key": "e2", "type": "enjoy_scale", "label": "Presenting ideas and convincing others", "domain": "enterprising"},
  {"key": "s2", "type": "enjoy_scale", "label": "Working with a team to solve a big challenge", "domain": "social"}
]', 90, true)
ON CONFLICT (slug) DO NOTHING;

-- 4. Session Check-in (3 structured fields, every session)
INSERT INTO survey_templates (slug, title, description, category, target_role, questions, frequency_days, is_system) VALUES
('session_checkin', 'Session Check-in', 'Coach logs structured observations after each session.', 'session_checkin', 'coach', '[
  {"key": "energy_level", "type": "emoji_scale", "label": "Student energy/engagement today", "options": ["low", "okay", "focused", "fired_up"]},
  {"key": "confidence_shift", "type": "select", "label": "Confidence compared to last session", "options": ["down", "same", "up", "breakthrough"]},
  {"key": "blocker", "type": "text", "label": "Any blocker or concern?", "placeholder": "Leave blank if none", "required": false}
]', null, true)
ON CONFLICT (slug) DO NOTHING;
