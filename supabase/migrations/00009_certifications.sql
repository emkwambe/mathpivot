-- ============================================================================
-- CERTIFICATION ENGINE FOR MATHPIVOT
-- Comprehensive certification system for students and tutors
-- ============================================================================

-- Certification program types
CREATE TYPE certification_type AS ENUM (
  'skill_mastery',      -- Based on skill completion
  'career_pathway',     -- Career-focused (actuarial, data science, etc.)
  'competition_prep',   -- Competition readiness
  'tutor_qualification', -- For tutors
  'course_completion',  -- Complete a course/program
  'external_validated'  -- Based on external exam scores
);

-- Certification levels
CREATE TYPE certification_level AS ENUM (
  'foundation',
  'bronze',
  'silver',
  'gold',
  'platinum',
  'expert'
);

-- Requirement types for certifications
CREATE TYPE requirement_type AS ENUM (
  'skills_mastered',     -- Must master specific skills
  'skill_count',         -- Must master N skills in category
  'hours_logged',        -- Tutoring hours completed
  'sessions_completed',  -- Number of sessions
  'assessment_passed',   -- Pass an assessment
  'project_submitted',   -- Submit a project
  'tutor_signoff',       -- Tutor verification
  'prerequisite_cert',   -- Must have another certification
  'external_score',      -- External exam score (SAT, AP, etc.)
  'attendance',          -- Attended camps/events
  'competition_score'    -- Competition placement
);

-- Assessment types
CREATE TYPE assessment_type AS ENUM (
  'quiz',                -- Multiple choice / short answer
  'timed_challenge',     -- Time-limited problems
  'project',             -- Project submission with rubric
  'demonstration',       -- Live demo observed by tutor
  'portfolio',           -- Collection of work
  'oral_exam',           -- Verbal examination
  'practical'            -- Hands-on (robotics, etc.)
);

-- Question types for quizzes
CREATE TYPE question_type AS ENUM (
  'multiple_choice',
  'multiple_select',
  'true_false',
  'numeric',
  'short_answer',
  'essay',
  'math_expression',
  'graphing',
  'code'
);

-- ============================================================================
-- CERTIFICATION PROGRAMS
-- ============================================================================

CREATE TABLE certification_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic info
  code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'ALG1-GOLD', 'ACT-PREP-1'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  short_description VARCHAR(500),

  -- Classification
  cert_type certification_type NOT NULL,
  level certification_level DEFAULT 'foundation',
  category VARCHAR(100), -- 'algebra', 'actuarial', 'robotics', etc.

  -- Visual
  icon_url TEXT,
  badge_image_url TEXT,
  badge_color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color

  -- Requirements summary
  estimated_hours INTEGER, -- Estimated time to complete
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),

  -- Targeting
  target_audience VARCHAR(50) DEFAULT 'student', -- 'student', 'tutor', 'both'
  min_age INTEGER,
  max_age INTEGER,
  grade_level_min INTEGER,
  grade_level_max INTEGER,

  -- Validity
  validity_months INTEGER, -- NULL = never expires
  recertification_program_id UUID REFERENCES certification_programs(id),

  -- Relationships
  career_pathway_id UUID, -- Links to career pathways if applicable
  prerequisite_program_ids UUID[] DEFAULT '{}',

  -- Pricing
  is_free BOOLEAN DEFAULT true,
  price_cents INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CERTIFICATION REQUIREMENTS
-- ============================================================================

CREATE TABLE certification_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES certification_programs(id) ON DELETE CASCADE,

  -- Requirement definition
  requirement_type requirement_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Requirement parameters (varies by type)
  -- For skills_mastered: { "skill_ids": ["uuid1", "uuid2"] }
  -- For skill_count: { "category": "algebra", "min_count": 5, "min_level": 3 }
  -- For hours_logged: { "min_hours": 10, "category": "tutoring" }
  -- For sessions_completed: { "min_sessions": 5, "session_type": "one_on_one" }
  -- For assessment_passed: { "assessment_id": "uuid", "min_score": 80 }
  -- For external_score: { "exam_type": "SAT_MATH", "min_score": 700 }
  parameters JSONB NOT NULL DEFAULT '{}',

  -- Logic
  is_required BOOLEAN DEFAULT true, -- false = optional/bonus
  group_id VARCHAR(50), -- For OR grouping (any in group satisfies)
  weight NUMERIC(3,2) DEFAULT 1.0, -- For partial completion

  -- Order
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ASSESSMENTS
-- ============================================================================

CREATE TABLE certification_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES certification_programs(id) ON DELETE SET NULL,

  -- Basic info
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,

  -- Type and settings
  assessment_type assessment_type NOT NULL,

  -- Timing
  time_limit_minutes INTEGER, -- NULL = untimed
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,

  -- Attempts
  max_attempts INTEGER DEFAULT 3,
  cooldown_hours INTEGER DEFAULT 24, -- Time between attempts

  -- Scoring
  passing_score NUMERIC(5,2) NOT NULL DEFAULT 70.00,
  max_score NUMERIC(7,2) DEFAULT 100.00,

  -- Question settings
  question_count INTEGER, -- NULL = use all questions
  randomize_questions BOOLEAN DEFAULT true,
  randomize_options BOOLEAN DEFAULT true,
  show_correct_answers BOOLEAN DEFAULT false,
  show_explanations BOOLEAN DEFAULT true,

  -- Proctoring
  requires_proctoring BOOLEAN DEFAULT false,
  requires_webcam BOOLEAN DEFAULT false,
  allows_calculator BOOLEAN DEFAULT true,
  allows_notes BOOLEAN DEFAULT false,

  -- Rubric (for projects/demos)
  rubric JSONB, -- { "criteria": [{ "name": "...", "max_points": 10 }] }

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ASSESSMENT QUESTIONS
-- ============================================================================

CREATE TABLE assessment_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES certification_assessments(id) ON DELETE CASCADE,

  -- Question content
  question_type question_type NOT NULL,
  question_text TEXT NOT NULL,
  question_html TEXT, -- Rich formatted version
  question_image_url TEXT,

  -- For math expressions
  latex_content TEXT,
  desmos_state JSONB, -- For graphing questions

  -- Options (for multiple choice)
  options JSONB, -- [{ "id": "a", "text": "...", "image_url": null }]

  -- Correct answer(s)
  correct_answer JSONB NOT NULL, -- Format varies by question type
  -- multiple_choice: "a"
  -- multiple_select: ["a", "c"]
  -- numeric: { "value": 42, "tolerance": 0.01 }
  -- math_expression: { "expression": "x^2 + 2x + 1", "equivalents": [...] }

  -- Scoring
  points NUMERIC(5,2) DEFAULT 1.00,
  partial_credit BOOLEAN DEFAULT false,
  partial_credit_rules JSONB, -- How to award partial credit

  -- Hints and explanations
  hint TEXT,
  explanation TEXT,
  explanation_video_url TEXT,

  -- Categorization
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5) DEFAULT 3,
  skill_ids UUID[] DEFAULT '{}', -- Related skills
  tags VARCHAR(100)[] DEFAULT '{}',

  -- Order and grouping
  display_order INTEGER DEFAULT 0,
  question_group VARCHAR(50), -- For grouping related questions

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ASSESSMENT ATTEMPTS
-- ============================================================================

CREATE TABLE assessment_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES certification_assessments(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Attempt info
  attempt_number INTEGER NOT NULL DEFAULT 1,

  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,

  -- Questions presented (if randomized)
  question_order UUID[] DEFAULT '{}',

  -- Scoring
  raw_score NUMERIC(7,2),
  max_possible_score NUMERIC(7,2),
  percentage_score NUMERIC(5,2),
  passed BOOLEAN,

  -- Proctoring
  proctor_user_id UUID REFERENCES auth.users(id),
  proctoring_notes TEXT,
  proctoring_flags JSONB DEFAULT '[]', -- Any suspicious activity

  -- Status
  status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'submitted', 'graded', 'expired', 'voided'

  -- Grading (for manual grading)
  graded_by UUID REFERENCES auth.users(id),
  graded_at TIMESTAMPTZ,
  grading_notes TEXT,

  -- Browser/device info
  user_agent TEXT,
  ip_address INET,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ASSESSMENT RESPONSES
-- ============================================================================

CREATE TABLE assessment_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES assessment_questions(id),

  -- Response
  response JSONB, -- User's answer in same format as correct_answer
  response_text TEXT, -- For essay/short answer
  response_file_urls TEXT[], -- For project submissions

  -- Timing
  started_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,

  -- Scoring
  is_correct BOOLEAN,
  points_earned NUMERIC(5,2),
  max_points NUMERIC(5,2),

  -- Feedback
  auto_feedback TEXT,
  manual_feedback TEXT,
  graded_by UUID REFERENCES auth.users(id),

  -- Flags
  flagged_for_review BOOLEAN DEFAULT false,
  flag_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(attempt_id, question_id)
);

-- ============================================================================
-- USER CERTIFICATIONS (ISSUED CREDENTIALS)
-- ============================================================================

CREATE TABLE user_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  program_id UUID NOT NULL REFERENCES certification_programs(id),

  -- Credential info
  credential_number VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'MP-ALG1-2024-00001'

  -- Achievement
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  score NUMERIC(5,2), -- Final score if applicable

  -- Validity
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ, -- NULL = never expires

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'revoked', 'suspended'
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  revoked_by UUID REFERENCES auth.users(id),

  -- Verification
  verification_token VARCHAR(64) UNIQUE NOT NULL,
  verification_url TEXT GENERATED ALWAYS AS (
    'https://mathpivot.com/verify/' || verification_token
  ) STORED,

  -- Digital badge
  badge_assertion_id VARCHAR(255), -- Open Badges 2.0
  badge_image_url TEXT,

  -- PDF Certificate
  certificate_pdf_url TEXT,
  certificate_generated_at TIMESTAMPTZ,

  -- Sharing
  is_public BOOLEAN DEFAULT true,
  shared_to_linkedin BOOLEAN DEFAULT false,

  -- Related records
  final_assessment_attempt_id UUID REFERENCES assessment_attempts(id),

  -- Metadata
  achievement_details JSONB DEFAULT '{}', -- Requirements completed, etc.
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USER CERTIFICATION PROGRESS
-- ============================================================================

CREATE TABLE user_certification_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  program_id UUID NOT NULL REFERENCES certification_programs(id),

  -- Progress tracking
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),

  -- Completion
  requirements_completed JSONB DEFAULT '{}', -- { "req_id": { "completed": true, "completed_at": "..." } }
  completion_percentage NUMERIC(5,2) DEFAULT 0,

  -- Status
  status VARCHAR(20) DEFAULT 'in_progress', -- 'not_started', 'in_progress', 'ready_for_cert', 'completed'

  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, program_id)
);

-- ============================================================================
-- CERTIFICATION VERIFICATIONS (PUBLIC LOG)
-- ============================================================================

CREATE TABLE certification_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_certification_id UUID NOT NULL REFERENCES user_certifications(id),

  -- Verification details
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  verifier_name VARCHAR(255),
  verifier_email VARCHAR(255),
  verifier_organization VARCHAR(255),

  -- Request info
  ip_address INET,
  user_agent TEXT,

  -- Result
  was_valid BOOLEAN NOT NULL
);

-- ============================================================================
-- EXTERNAL EXAM SCORES
-- ============================================================================

CREATE TABLE external_exam_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Exam info
  exam_type VARCHAR(50) NOT NULL, -- 'SAT_MATH', 'ACT_MATH', 'AP_CALC_AB', etc.
  exam_date DATE,

  -- Score
  score NUMERIC(7,2) NOT NULL,
  max_score NUMERIC(7,2),
  percentile INTEGER,

  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  verification_document_url TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- QUESTION BANK CATEGORIES
-- ============================================================================

CREATE TABLE question_bank_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES question_bank_categories(id),

  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,

  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Certification programs
CREATE INDEX idx_cert_programs_type ON certification_programs(cert_type);
CREATE INDEX idx_cert_programs_category ON certification_programs(category);
CREATE INDEX idx_cert_programs_active ON certification_programs(is_active, is_featured);
CREATE INDEX idx_cert_programs_career ON certification_programs(career_pathway_id) WHERE career_pathway_id IS NOT NULL;

-- Requirements
CREATE INDEX idx_cert_requirements_program ON certification_requirements(program_id);
CREATE INDEX idx_cert_requirements_type ON certification_requirements(requirement_type);

-- Assessments
CREATE INDEX idx_assessments_program ON certification_assessments(program_id);
CREATE INDEX idx_assessments_type ON certification_assessments(assessment_type);
CREATE INDEX idx_assessments_active ON certification_assessments(is_active);

-- Questions
CREATE INDEX idx_questions_assessment ON assessment_questions(assessment_id);
CREATE INDEX idx_questions_type ON assessment_questions(question_type);
CREATE INDEX idx_questions_difficulty ON assessment_questions(difficulty);
CREATE INDEX idx_questions_skills ON assessment_questions USING GIN(skill_ids);
CREATE INDEX idx_questions_tags ON assessment_questions USING GIN(tags);

-- Attempts
CREATE INDEX idx_attempts_assessment ON assessment_attempts(assessment_id);
CREATE INDEX idx_attempts_user ON assessment_attempts(user_id);
CREATE INDEX idx_attempts_status ON assessment_attempts(status);
CREATE INDEX idx_attempts_user_assessment ON assessment_attempts(user_id, assessment_id);

-- Responses
CREATE INDEX idx_responses_attempt ON assessment_responses(attempt_id);
CREATE INDEX idx_responses_question ON assessment_responses(question_id);

-- User certifications
CREATE INDEX idx_user_certs_user ON user_certifications(user_id);
CREATE INDEX idx_user_certs_program ON user_certifications(program_id);
CREATE INDEX idx_user_certs_status ON user_certifications(status);
CREATE INDEX idx_user_certs_token ON user_certifications(verification_token);
CREATE INDEX idx_user_certs_credential ON user_certifications(credential_number);

-- Progress
CREATE INDEX idx_cert_progress_user ON user_certification_progress(user_id);
CREATE INDEX idx_cert_progress_program ON user_certification_progress(program_id);
CREATE INDEX idx_cert_progress_status ON user_certification_progress(status);

-- Verifications
CREATE INDEX idx_verifications_cert ON certification_verifications(user_certification_id);

-- External scores
CREATE INDEX idx_external_scores_user ON external_exam_scores(user_id);
CREATE INDEX idx_external_scores_type ON external_exam_scores(exam_type);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE certification_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_certification_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_exam_scores ENABLE ROW LEVEL SECURITY;

-- Programs: everyone can view active programs
CREATE POLICY "Anyone can view active certification programs"
  ON certification_programs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage certification programs"
  ON certification_programs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Requirements: everyone can view
CREATE POLICY "Anyone can view certification requirements"
  ON certification_requirements FOR SELECT
  USING (true);

-- Assessments: view if active
CREATE POLICY "Anyone can view active assessments"
  ON certification_assessments FOR SELECT
  USING (is_active = true);

-- Questions: only see during active attempt (handled in application layer for security)
CREATE POLICY "Admins can manage questions"
  ON assessment_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Attempts: users see own
CREATE POLICY "Users can view own attempts"
  ON assessment_attempts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own attempts"
  ON assessment_attempts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own in-progress attempts"
  ON assessment_attempts FOR UPDATE
  USING (user_id = auth.uid() AND status = 'in_progress');

-- Responses: users see own
CREATE POLICY "Users can manage own responses"
  ON assessment_responses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM assessment_attempts WHERE id = attempt_id AND user_id = auth.uid()
    )
  );

-- User certifications: users see own, public ones visible to all
CREATE POLICY "Users can view own certifications"
  ON user_certifications FOR SELECT
  USING (user_id = auth.uid() OR is_public = true);

-- Progress: users see own
CREATE POLICY "Users can view own progress"
  ON user_certification_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own progress"
  ON user_certification_progress FOR ALL
  USING (user_id = auth.uid());

-- Verifications: anyone can create (public verification)
CREATE POLICY "Anyone can create verification records"
  ON certification_verifications FOR INSERT
  WITH CHECK (true);

-- External scores: users see own
CREATE POLICY "Users can manage own external scores"
  ON external_exam_scores FOR ALL
  USING (user_id = auth.uid());

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Generate unique credential number
CREATE OR REPLACE FUNCTION generate_credential_number(program_code VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  year_part VARCHAR(4);
  sequence_num INTEGER;
  credential VARCHAR(100);
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(
    NULLIF(REGEXP_REPLACE(credential_number, '^.*-(\d+)$', '\1'), credential_number)::INTEGER
  ), 0) + 1
  INTO sequence_num
  FROM user_certifications
  WHERE credential_number LIKE 'MP-' || program_code || '-' || year_part || '-%';

  credential := 'MP-' || program_code || '-' || year_part || '-' || LPAD(sequence_num::TEXT, 5, '0');

  RETURN credential;
END;
$$ LANGUAGE plpgsql;

-- Generate verification token
CREATE OR REPLACE FUNCTION generate_verification_token()
RETURNS VARCHAR AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Auto-update progress percentage
CREATE OR REPLACE FUNCTION update_certification_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_reqs INTEGER;
  completed_reqs INTEGER;
  new_percentage NUMERIC(5,2);
BEGIN
  -- Count total required requirements
  SELECT COUNT(*) INTO total_reqs
  FROM certification_requirements
  WHERE program_id = NEW.program_id AND is_required = true;

  -- Count completed requirements
  SELECT COUNT(*) INTO completed_reqs
  FROM jsonb_each(NEW.requirements_completed) AS r
  WHERE (r.value->>'completed')::boolean = true;

  -- Calculate percentage
  IF total_reqs > 0 THEN
    new_percentage := (completed_reqs::NUMERIC / total_reqs::NUMERIC) * 100;
  ELSE
    new_percentage := 0;
  END IF;

  NEW.completion_percentage := new_percentage;
  NEW.last_activity_at := NOW();
  NEW.updated_at := NOW();

  -- Update status
  IF new_percentage >= 100 THEN
    NEW.status := 'ready_for_cert';
  ELSIF new_percentage > 0 THEN
    NEW.status := 'in_progress';
  ELSE
    NEW.status := 'not_started';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_certification_progress
  BEFORE UPDATE ON user_certification_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_certification_progress();

-- Auto-grade assessment attempt
CREATE OR REPLACE FUNCTION calculate_attempt_score(attempt_uuid UUID)
RETURNS TABLE(raw_score NUMERIC, max_score NUMERIC, percentage NUMERIC, passed BOOLEAN) AS $$
DECLARE
  assessment_record RECORD;
  score_data RECORD;
BEGIN
  -- Get assessment info
  SELECT ca.* INTO assessment_record
  FROM certification_assessments ca
  JOIN assessment_attempts aa ON aa.assessment_id = ca.id
  WHERE aa.id = attempt_uuid;

  -- Calculate scores
  SELECT
    COALESCE(SUM(ar.points_earned), 0) as total_earned,
    COALESCE(SUM(ar.max_points), 0) as total_max
  INTO score_data
  FROM assessment_responses ar
  WHERE ar.attempt_id = attempt_uuid;

  raw_score := score_data.total_earned;
  max_score := score_data.total_max;

  IF max_score > 0 THEN
    percentage := (raw_score / max_score) * 100;
  ELSE
    percentage := 0;
  END IF;

  passed := percentage >= assessment_record.passing_score;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS FOR TIMESTAMPS
-- ============================================================================

CREATE TRIGGER update_cert_programs_timestamp
  BEFORE UPDATE ON certification_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_timestamp
  BEFORE UPDATE ON certification_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_timestamp
  BEFORE UPDATE ON assessment_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_responses_timestamp
  BEFORE UPDATE ON assessment_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_certs_timestamp
  BEFORE UPDATE ON user_certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
