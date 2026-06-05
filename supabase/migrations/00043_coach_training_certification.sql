-- Migration 00043: Coach Training & Certification System
-- Layer 3 (Coach Infrastructure) + Layer 5 (Network Infrastructure)
-- Enables: good teacher → great MathPivot coach, at scale

-- Training modules (structured learning path for certification)
CREATE TABLE IF NOT EXISTS training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'foundations', 'curriculum', 'session_delivery', 'assessment',
    'parent_communication', 'technology', 'competition_prep', 'advanced'
  )),
  sort_order INTEGER NOT NULL DEFAULT 0,
  estimated_minutes INTEGER NOT NULL DEFAULT 30,
  content_type TEXT NOT NULL DEFAULT 'reading' CHECK (content_type IN ('reading', 'video', 'practice', 'assessment', 'observation')),
  content JSONB DEFAULT '{}',
  passing_score INTEGER DEFAULT 80,
  is_required BOOLEAN DEFAULT true,
  certification_tier TEXT DEFAULT 'certified' CHECK (certification_tier IN ('certified', 'master')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Coach training progress (tracks each coach's journey through modules)
CREATE TABLE IF NOT EXISTS coach_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id),
  module_id UUID NOT NULL REFERENCES training_modules(id),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  score INTEGER,
  attempts INTEGER DEFAULT 0,
  notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(coach_id, module_id)
);

-- Coach certification applications
CREATE TABLE IF NOT EXISTS certification_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id),
  tier TEXT NOT NULL CHECK (tier IN ('certified', 'master')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'denied', 'revoked')),
  modules_completed INTEGER DEFAULT 0,
  modules_required INTEGER DEFAULT 0,
  practicum_hours NUMERIC(5,1) DEFAULT 0,
  practicum_required NUMERIC(5,1) DEFAULT 10,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  certified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_progress_coach ON coach_training_progress(coach_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_status ON coach_training_progress(status) WHERE status != 'completed';
CREATE INDEX IF NOT EXISTS idx_cert_applications_coach ON certification_applications(coach_id);
CREATE INDEX IF NOT EXISTS idx_cert_applications_status ON certification_applications(status) WHERE status IN ('pending', 'under_review');

-- RLS
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_applications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "training_modules_read" ON training_modules FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "training_progress_read" ON coach_training_progress FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "training_progress_write" ON coach_training_progress FOR INSERT WITH CHECK (coach_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "cert_applications_read" ON certification_applications FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed: MathPivot Coach Certification training modules
-- Tier 1: Certified MathPivot Coach (required modules)
INSERT INTO training_modules (slug, title, description, category, sort_order, estimated_minutes, content_type, is_required, certification_tier) VALUES
('mp-philosophy', 'The MathPivot Method', 'Understand the coaching philosophy: named coach model, mastery tracking, structured sessions, career exposure. Why we are not a tutoring company.', 'foundations', 1, 30, 'reading', true, 'certified'),
('mp-session-structure', 'The 60-Minute Session', 'Master the session template: warm-up (10 min), review (15 min), core instruction (15 min), guided practice (15 min), wrap-up (5 min). Practice with sample lesson.', 'session_delivery', 2, 45, 'practice', true, 'certified'),
('mp-mastery-tracking', 'Mastery Tracking System', 'Learn the 5-level mastery progression (not_started → introduced → developing → proficient → mastered). How to assess, when to advance, what to do when students stall.', 'assessment', 3, 30, 'reading', true, 'certified'),
('mp-diagnostic-admin', 'Administering Diagnostics', 'How to run the MathPivot diagnostic, interpret domain scores, and make placement recommendations. Practice scoring sample assessments.', 'assessment', 4, 40, 'practice', true, 'certified'),
('mp-onboarding-protocol', 'Student Onboarding Protocol', 'The 6-step onboarding checklist: rapport building, diagnostic, parent alignment, learning plan, communication rhythm, first mastery update.', 'foundations', 5, 25, 'reading', true, 'certified'),
('mp-parent-communication', 'Parent Communication', 'How to run parent alignment calls, deliver weekly progress updates, handle concerns, and maintain the confidence pulse survey above 4.0.', 'parent_communication', 6, 35, 'reading', true, 'certified'),
('mp-platform-training', 'Platform & Tools', 'Navigate the MathPivot platform: session prep briefs, check-ins, mastery updates, whiteboard, Desmos, and the school pulse system.', 'technology', 7, 30, 'practice', true, 'certified'),
('mp-curriculum-overview', 'Curriculum Navigation', 'Understand the atomic concept structure, unit sequencing, and how to use the session prep brief to plan effective lessons. Covers all 4 programs.', 'curriculum', 8, 45, 'reading', true, 'certified'),
('mp-small-group-dynamics', 'Small Group Coaching (5-6 Students)', 'Techniques for managing a cohort of 5-6 students: differentiation, engagement rotation, individual check-ins within group sessions, pacing.', 'session_delivery', 9, 40, 'practice', true, 'certified'),
('mp-certification-assessment', 'Certification Assessment', 'Final assessment covering all required modules. Must score 80% or higher. Includes scenario-based questions and a sample session plan.', 'assessment', 10, 60, 'assessment', true, 'certified')
ON CONFLICT (slug) DO NOTHING;

-- Tier 2: Master MathPivot Coach (additional modules)
INSERT INTO training_modules (slug, title, description, category, sort_order, estimated_minutes, content_type, is_required, certification_tier) VALUES
('mp-competition-prep', 'Competition Coaching', 'Prepare students for Mathathlon, AMC 8/10, and MATHCOUNTS. Problem-solving strategies, time management, competition psychology.', 'competition_prep', 11, 45, 'reading', true, 'master'),
('mp-career-exposure', 'Career Exposure Protocol', 'Monthly career check-ins and quarterly RIASEC deep-dives. How to connect math concepts to real careers authentically.', 'foundations', 12, 30, 'reading', true, 'master'),
('mp-coach-calibration', 'Leading Calibration Sessions', 'How to facilitate monthly calibration meetings with other coaches. Review challenging concepts, share strategies, maintain teaching quality.', 'advanced', 13, 40, 'practice', true, 'master'),
('mp-train-the-trainer', 'Training New Coaches', 'How to onboard, mentor, and evaluate new MathPivot coaches. Observation rubrics, feedback frameworks, quality standards.', 'advanced', 14, 60, 'practice', true, 'master'),
('mp-master-assessment', 'Master Coach Assessment', 'Comprehensive assessment including a live session observation, coaching scenario responses, and a training plan for a hypothetical new coach.', 'assessment', 15, 90, 'observation', true, 'master')
ON CONFLICT (slug) DO NOTHING;

-- View: coach certification status
CREATE OR REPLACE VIEW coach_certification_status AS
SELECT
  up.id AS coach_id,
  up.full_name AS coach_name,
  COUNT(ctp.id) FILTER (WHERE ctp.status = 'completed' AND tm.certification_tier = 'certified') AS certified_modules_done,
  COUNT(tm.id) FILTER (WHERE tm.is_required AND tm.certification_tier = 'certified' AND tm.is_active) AS certified_modules_total,
  COUNT(ctp.id) FILTER (WHERE ctp.status = 'completed' AND tm.certification_tier = 'master') AS master_modules_done,
  COUNT(tm.id) FILTER (WHERE tm.is_required AND tm.certification_tier = 'master' AND tm.is_active) AS master_modules_total,
  CASE
    WHEN COUNT(ctp.id) FILTER (WHERE ctp.status = 'completed' AND tm.certification_tier = 'certified')
         >= COUNT(tm.id) FILTER (WHERE tm.is_required AND tm.certification_tier = 'certified' AND tm.is_active)
    THEN true ELSE false
  END AS certified_eligible,
  CASE
    WHEN COUNT(ctp.id) FILTER (WHERE ctp.status = 'completed')
         >= COUNT(tm.id) FILTER (WHERE tm.is_required AND tm.is_active)
    THEN true ELSE false
  END AS master_eligible
FROM users_profile up
LEFT JOIN coach_training_progress ctp ON ctp.coach_id = up.id
LEFT JOIN training_modules tm ON tm.id = ctp.module_id
WHERE up.role = 'tutor'
GROUP BY up.id, up.full_name;
