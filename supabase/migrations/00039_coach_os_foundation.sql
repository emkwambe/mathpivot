-- Migration 00039: Student intake profile + onboarding checklist + career spotlights + coach certifications

-- ============================================================
-- STUDENT ACADEMIC PROFILE (progressive intake)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_academic_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users_profile(id) UNIQUE,
  grade_level TEXT,
  school_type TEXT CHECK (school_type IN ('public', 'private', 'charter', 'homeschool', 'virtual', 'other')),
  school_name TEXT,
  current_math_course TEXT,
  textbook_curriculum TEXT,
  current_math_grade TEXT,
  teacher_name TEXT,
  next_test_dates JSONB DEFAULT '[]',
  learning_goal_parent TEXT,
  learning_goal_student TEXT,
  accommodations TEXT,
  extracurriculars TEXT,
  best_session_times TEXT,
  is_homeschool BOOLEAN DEFAULT false,
  homeschool_curriculum TEXT,
  communication_preference TEXT DEFAULT 'email' CHECK (communication_preference IN ('email', 'text', 'in_app')),
  coach_observations TEXT,
  profile_completeness INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ONBOARDING CHECKLIST (enforced steps per enrollment)
-- ============================================================
CREATE TABLE IF NOT EXISTS onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES program_enrollments(id) ON DELETE CASCADE,
  step_key TEXT NOT NULL CHECK (step_key IN (
    'rapport_building', 'diagnostic_assessment', 'parent_goal_alignment',
    'learning_plan_created', 'communication_rhythm_set', 'first_mastery_update'
  )),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE (enrollment_id, step_key)
);

ALTER TABLE program_enrollments
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'pending' CHECK (onboarding_status IN ('pending', 'in_progress', 'completed')),
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS session_duration_minutes INTEGER DEFAULT 60;

-- ============================================================
-- CAREER SPOTLIGHTS (mastery domain → career mapping)
-- ============================================================
CREATE TABLE IF NOT EXISTS career_spotlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  daily_work TEXT,
  math_domains TEXT[] NOT NULL DEFAULT '{}',
  salary_range TEXT,
  growth_outlook TEXT,
  partner_org TEXT,
  partner_url TEXT,
  icon TEXT DEFAULT 'briefcase',
  color TEXT DEFAULT 'blue',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- COACH CERTIFICATIONS (training & readiness tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES users_profile(id),
  certification_type TEXT NOT NULL CHECK (certification_type IN (
    'background_check', 'platform_training', 'pedagogy_basics',
    'curriculum_familiarity', 'monthly_calibration'
  )),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users_profile(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coach_id, certification_type)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_academic_profiles_student ON student_academic_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_enrollment ON onboarding_steps(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_career_spotlights_active ON career_spotlights(is_active);
CREATE INDEX IF NOT EXISTS idx_coach_certs_coach ON coach_certifications(coach_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE student_academic_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_spotlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_certifications ENABLE ROW LEVEL SECURITY;

-- Academic profiles: student sees own, parent sees child, coach sees enrolled students, admin sees all
DO $$ BEGIN
  CREATE POLICY "academic_profile_select" ON student_academic_profiles FOR SELECT TO authenticated
    USING (
      student_id = auth.uid()
      OR EXISTS (SELECT 1 FROM program_enrollments pe WHERE pe.student_id = student_academic_profiles.student_id AND (pe.coach_id = auth.uid() OR pe.parent_id = auth.uid()))
      OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "academic_profile_upsert" ON student_academic_profiles FOR INSERT TO authenticated
    WITH CHECK (
      student_id = auth.uid()
      OR EXISTS (SELECT 1 FROM program_enrollments pe WHERE pe.student_id = student_academic_profiles.student_id AND pe.parent_id = auth.uid())
      OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'tutor'))
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "academic_profile_update" ON student_academic_profiles FOR UPDATE TO authenticated
    USING (
      student_id = auth.uid()
      OR EXISTS (SELECT 1 FROM program_enrollments pe WHERE pe.student_id = student_academic_profiles.student_id AND (pe.coach_id = auth.uid() OR pe.parent_id = auth.uid()))
      OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Onboarding steps: coach + admin
DO $$ BEGIN
  CREATE POLICY "onboarding_select" ON onboarding_steps FOR SELECT TO authenticated
    USING (
      EXISTS (SELECT 1 FROM program_enrollments pe WHERE pe.id = onboarding_steps.enrollment_id AND (pe.coach_id = auth.uid() OR pe.parent_id = auth.uid()))
      OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "onboarding_modify" ON onboarding_steps FOR ALL TO authenticated
    USING (
      EXISTS (SELECT 1 FROM program_enrollments pe WHERE pe.id = onboarding_steps.enrollment_id AND pe.coach_id = auth.uid())
      OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Career spotlights: readable by all, writable by admin
DO $$ BEGIN
  CREATE POLICY "career_spotlights_select" ON career_spotlights FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "career_spotlights_admin" ON career_spotlights FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Coach certifications: coach sees own, admin sees all
DO $$ BEGIN
  CREATE POLICY "coach_certs_select" ON coach_certifications FOR SELECT TO authenticated
    USING (coach_id = auth.uid() OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "coach_certs_admin" ON coach_certifications FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- SEED CAREER SPOTLIGHTS
-- ============================================================
INSERT INTO career_spotlights (title, description, daily_work, math_domains, salary_range, growth_outlook, partner_org, icon, color, sort_order) VALUES
  ('Data Scientist', 'Analyze large datasets to find patterns and make predictions that drive business decisions.', 'Clean data, build models, create visualizations, present findings to stakeholders.', ARRAY['statistics', 'probability', 'algebra'], '$95K - $160K', '35% growth (much faster than average)', 'American Statistical Association', 'chart', 'blue', 1),
  ('Actuary', 'Calculate risk and uncertainty for insurance companies, pension funds, and financial institutions.', 'Build probability models, analyze mortality tables, price insurance products, present to executives.', ARRAY['probability', 'statistics', 'calculus'], '$105K - $150K', '21% growth (much faster than average)', 'The Actuarial Foundation', 'shield', 'green', 2),
  ('Software Engineer', 'Design and build software applications, websites, and systems used by millions.', 'Write code, solve algorithmic problems, review designs, collaborate with teams.', ARRAY['algebra', 'logic', 'discrete_math'], '$90K - $170K', '25% growth (much faster than average)', 'IEEE', 'code', 'purple', 3),
  ('Financial Analyst', 'Help businesses and individuals make investment decisions based on economic data.', 'Analyze financial statements, build forecasting models, write investment reports.', ARRAY['algebra', 'statistics', 'calculus'], '$85K - $130K', '9% growth (faster than average)', 'Council for Economic Education', 'trending-up', 'amber', 4),
  ('Epidemiologist', 'Study patterns of disease and injury to protect public health.', 'Design studies, collect health data, analyze disease patterns, publish findings.', ARRAY['statistics', 'probability', 'data_analysis'], '$80K - $120K', '27% growth (much faster than average)', 'ASPPH', 'heart', 'red', 5),
  ('Aerospace Engineer', 'Design aircraft, spacecraft, satellites, and missiles.', 'Run simulations, analyze aerodynamic data, test prototypes, solve structural problems.', ARRAY['calculus', 'geometry', 'physics_math'], '$95K - $160K', '6% growth (as fast as average)', 'SIAM', 'rocket', 'indigo', 6),
  ('Biostatistician', 'Apply statistics to biological and health science research, including clinical trials.', 'Design experiments, analyze clinical trial data, determine drug efficacy, write reports.', ARRAY['statistics', 'probability', 'calculus'], '$85K - $140K', '30% growth (much faster than average)', 'ASPPH', 'microscope', 'teal', 7),
  ('Robotics Engineer', 'Design, build, and program robots for manufacturing, healthcare, and exploration.', 'Program robot controllers, design mechanical systems, test sensors, debug autonomous behavior.', ARRAY['geometry', 'calculus', 'algebra'], '$90K - $150K', '15% growth (faster than average)', 'IEEE', 'cpu', 'orange', 8),
  ('Economist', 'Study production and distribution of resources, goods, and services.', 'Collect economic data, build models, forecast trends, advise on policy.', ARRAY['statistics', 'calculus', 'algebra'], '$105K - $155K', '6% growth (as fast as average)', 'Council for Economic Education', 'bar-chart', 'emerald', 9),
  ('Machine Learning Engineer', 'Build AI systems that learn from data and make decisions.', 'Train models, tune algorithms, deploy AI systems, monitor performance.', ARRAY['calculus', 'statistics', 'algebra', 'probability'], '$120K - $200K', '40% growth (much faster than average)', 'AI4ALL', 'brain', 'violet', 10),
  ('Architect', 'Design buildings and structures that are safe, functional, and beautiful.', 'Create blueprints, calculate structural loads, model 3D designs, meet with clients.', ARRAY['geometry', 'measurement', 'proportional_reasoning'], '$80K - $130K', '5% growth (as fast as average)', 'SWE', 'building', 'slate', 11),
  ('Risk Analyst', 'Assess and manage financial risk for banks, insurance companies, and investment firms.', 'Build risk models, stress-test portfolios, analyze market data, write risk reports.', ARRAY['probability', 'statistics', 'algebra'], '$75K - $120K', '12% growth (faster than average)', 'The Actuarial Foundation', 'alert-triangle', 'yellow', 12)
ON CONFLICT DO NOTHING;
