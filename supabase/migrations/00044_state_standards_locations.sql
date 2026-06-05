-- Migration 00044: State Standards & Location Infrastructure
-- Layer 1 (Diagnostic) + Layer 2 (Curriculum) + Layer 4 (Operating)
-- Enables state-specific diagnostics and location-aware coaching

-- State standards reference table
CREATE TABLE IF NOT EXISTS state_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code CHAR(2) NOT NULL,
  state_name TEXT NOT NULL,
  exam_name TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('eog', 'eoc', 'summative', 'regents')),
  grade_or_course TEXT NOT NULL,
  standards_framework TEXT NOT NULL,
  blueprint_url TEXT,
  released_items_url TEXT,
  domain_weights JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(state_code, exam_type, grade_or_course)
);

-- Add state_code to diagnostic questions for state-specific filtering
DO $$ BEGIN
  ALTER TABLE diagnostic_questions ADD COLUMN state_code CHAR(2) DEFAULT 'CC';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add location fields to users_profile
DO $$ BEGIN
  ALTER TABLE users_profile ADD COLUMN country TEXT DEFAULT 'US';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE users_profile ADD COLUMN state_code CHAR(2);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE users_profile ADD COLUMN city TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE users_profile ADD COLUMN county TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE users_profile ADD COLUMN timezone TEXT DEFAULT 'America/New_York';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add state to coaching_schedules for location-aware matching
DO $$ BEGIN
  ALTER TABLE coaching_schedules ADD COLUMN state_code CHAR(2);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add state to leads for geographic segmentation
DO $$ BEGIN
  ALTER TABLE leads ADD COLUMN state_code CHAR(2);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_state_standards_state ON state_standards(state_code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_dq_state ON diagnostic_questions(state_code);

-- RLS
ALTER TABLE state_standards ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "state_standards_read" ON state_standards FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed: State standards for 15 states
INSERT INTO state_standards (state_code, state_name, exam_name, exam_type, grade_or_course, standards_framework, blueprint_url, released_items_url, domain_weights) VALUES
-- North Carolina
('NC', 'North Carolina', 'NC EOG', 'eog', 'Grade 7', 'NC Standard Course of Study', 'https://www.dpi.nc.gov/documents/accountability/testing/eog/eog-mathematics-grades-3-8-test-specifications/open', NULL, '{"ratios_proportions": 26, "statistics": 24, "expressions_equations": 22, "geometry": 18, "number_sense": 10}'),
('NC', 'North Carolina', 'NC EOG', 'eog', 'Grade 8', 'NC Standard Course of Study', 'https://www.dpi.nc.gov/documents/accountability/testing/eog/eog-mathematics-grades-3-8-test-specifications/open', NULL, '{"functions": 30, "expressions_equations": 26, "geometry": 26, "statistics": 18}'),
('NC', 'North Carolina', 'NC Math 1 EOC', 'eoc', 'Math 1', 'NC Standard Course of Study', 'https://www.dpi.nc.gov/documents/accountability/testing/eoc/eoc-nc-math-1-and-nc-math-3-test-specifications/open', NULL, '{"algebra": 38, "functions": 34, "statistics": 19, "geometry": 9}'),
-- Texas
('TX', 'Texas', 'STAAR', 'eog', 'Grade 7', 'TEKS', 'https://esc13.net/resources/staar-blueprint-comparisons-response-rubrics', 'https://tea.texas.gov/student-assessment/staar/staar-released-test-questions', '{"proportionality": 30, "expressions_equations": 25, "geometry": 20, "data_analysis": 15, "number_sense": 10}'),
('TX', 'Texas', 'STAAR', 'eog', 'Grade 8', 'TEKS', NULL, 'https://tea.texas.gov/student-assessment/staar/staar-released-test-questions', '{"expressions_equations": 30, "proportionality": 25, "geometry": 25, "data_analysis": 20}'),
('TX', 'Texas', 'STAAR Algebra 1 EOC', 'eoc', 'Algebra 1', 'TEKS', NULL, 'https://tea.texas.gov/student-assessment/staar/staar-released-test-questions', '{"linear_functions": 35, "quadratic_functions": 25, "expressions_equations": 20, "exponential_functions": 10, "number_quantity": 10}'),
-- Florida
('FL', 'Florida', 'FAST', 'eog', 'Grade 7', 'B.E.S.T.', 'https://www.fldoe.org/core/fileparse.php/20102/urlt/TDS-FAST-Math.pdf', 'https://www.fldoe.org/accountability/assessments/k-12-student-assessment/best/', '{"algebraic_reasoning": 30, "number_sense": 25, "geometric_reasoning": 25, "data_analysis": 20}'),
('FL', 'Florida', 'FAST', 'eog', 'Grade 8', 'B.E.S.T.', NULL, NULL, '{"algebraic_reasoning": 35, "functions": 25, "geometric_reasoning": 20, "data_analysis": 20}'),
('FL', 'Florida', 'B.E.S.T. Algebra 1 EOC', 'eoc', 'Algebra 1', 'B.E.S.T.', NULL, NULL, '{"algebraic_reasoning": 40, "functions": 30, "data_analysis": 15, "number_sense": 15}'),
-- New York
('NY', 'New York', 'NYS Math', 'eog', 'Grade 7', 'Next Gen Learning Standards', 'https://www.nysed.gov/state-assessment/regents-examination-guides-and-samplers', 'https://www.nysedregents.org/ei/ei-math.html', '{"ratios_proportions": 28, "expressions_equations": 24, "geometry": 24, "statistics": 14, "number_sense": 10}'),
('NY', 'New York', 'NYS Math', 'eog', 'Grade 8', 'Next Gen Learning Standards', NULL, NULL, '{"expressions_equations": 28, "functions": 26, "geometry": 26, "number_sense": 10, "statistics": 10}'),
('NY', 'New York', 'Regents Algebra 1', 'regents', 'Algebra 1', 'Next Gen Learning Standards', NULL, 'https://www.nysedregents.org/regents_math.html', '{"algebra": 35, "functions": 30, "statistics": 20, "number_quantity": 15}'),
-- California (Common Core / SBAC)
('CA', 'California', 'CAASPP/SBAC', 'summative', 'Grade 7', 'Common Core (CCSS)', 'https://www.cde.ca.gov/ta/tg/sa/smarterbalresources.asp', 'https://www.caaspp-elpac.org/', '{"ratios_proportions": 25, "number_sense": 20, "expressions_equations": 25, "geometry": 20, "statistics": 10}'),
('CA', 'California', 'CAASPP/SBAC', 'summative', 'Grade 8', 'Common Core (CCSS)', NULL, NULL, '{"expressions_equations": 28, "functions": 28, "geometry": 24, "number_sense": 10, "statistics": 10}'),
('CA', 'California', 'CAASPP/SBAC', 'summative', 'Grade 11', 'Common Core (CCSS)', NULL, NULL, '{"algebra": 30, "functions": 30, "geometry": 15, "statistics": 15, "number_quantity": 10}'),
-- Ohio
('OH', 'Ohio', 'OST', 'eog', 'Grade 7', 'Ohio Learning Standards', 'https://education.ohio.gov/Topics/Testing', 'https://education.ohio.gov/Topics/Testing', '{"ratios_proportions": 25, "number_sense": 20, "expressions_equations": 25, "geometry": 20, "statistics": 10}'),
('OH', 'Ohio', 'OST Algebra 1 EOC', 'eoc', 'Algebra 1', 'Ohio Learning Standards', NULL, NULL, '{"algebra": 35, "functions": 30, "statistics": 20, "number_quantity": 15}'),
-- Virginia
('VA', 'Virginia', 'SOL', 'eog', 'Grade 7', 'VA SOL 2023', 'https://www.doe.virginia.gov/teaching-learning-assessment/student-assessment/virginia-sol-assessment-program/test-blueprints', 'https://www.doe.virginia.gov/teaching-learning-assessment/student-assessment/sol-practice-items-all-subjects/released-tests-item-sets-all-subjects', '{"proportional_reasoning": 25, "number_sense": 20, "expressions_equations": 25, "geometry": 20, "statistics": 10}'),
('VA', 'Virginia', 'SOL Algebra 1', 'eoc', 'Algebra 1', 'VA SOL 2023', NULL, NULL, '{"expressions_equations": 35, "functions": 30, "statistics": 20, "number_quantity": 15}'),
-- Georgia
('GA', 'Georgia', 'Georgia Milestones EOG', 'eog', 'Grade 7', 'GA Standards of Excellence', 'https://gadoe.org/assessment-accountability/georgia-milestones/', NULL, '{"ratios_proportions": 25, "number_sense": 20, "expressions_equations": 25, "geometry": 20, "statistics": 10}'),
('GA', 'Georgia', 'Georgia Milestones EOC', 'eoc', 'Algebra', 'GA Standards of Excellence', NULL, NULL, '{"algebra": 35, "functions": 30, "statistics": 20, "number_quantity": 15}'),
-- Pennsylvania
('PA', 'Pennsylvania', 'PSSA', 'eog', 'Grade 7', 'PA Academic Standards', 'https://www.pdesas.org/Page/Viewer/ViewPage/78', NULL, '{"ratios_proportions": 25, "number_sense": 20, "expressions_equations": 25, "geometry": 20, "statistics": 10}'),
('PA', 'Pennsylvania', 'Keystone Algebra 1', 'eoc', 'Algebra 1', 'PA Academic Standards', NULL, NULL, '{"algebra": 35, "functions": 30, "data_analysis": 20, "number_sense": 15}'),
-- Massachusetts
('MA', 'Massachusetts', 'MCAS', 'summative', 'Grade 7', 'MA Curriculum Frameworks', 'https://www.doe.mass.edu/mcas/testadmin/', 'https://www.doe.mass.edu/mcas/release.html', '{"ratios_proportions": 25, "number_sense": 20, "expressions_equations": 25, "geometry": 20, "statistics": 10}'),
-- Common Core (default for CC-aligned states: IL, MI, NJ, WA, AZ)
('CC', 'Common Core States', 'Smarter Balanced / State Assessment', 'summative', 'Grade 7', 'Common Core (CCSS)', NULL, NULL, '{"ratios_proportions": 25, "number_sense": 20, "expressions_equations": 25, "geometry": 20, "statistics": 10}'),
('CC', 'Common Core States', 'Smarter Balanced / State Assessment', 'summative', 'Grade 8', 'Common Core (CCSS)', NULL, NULL, '{"expressions_equations": 28, "functions": 28, "geometry": 24, "number_sense": 10, "statistics": 10}'),
('CC', 'Common Core States', 'State Assessment', 'summative', 'Algebra 1', 'Common Core (CCSS)', NULL, NULL, '{"algebra": 35, "functions": 30, "statistics": 20, "number_quantity": 15}')
ON CONFLICT (state_code, exam_type, grade_or_course) DO NOTHING;

-- US States reference for location dropdowns
CREATE TABLE IF NOT EXISTS us_states (
  code CHAR(2) PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT CHECK (region IN ('northeast', 'southeast', 'midwest', 'southwest', 'west')),
  has_eoc_exam BOOLEAN DEFAULT false,
  standards_framework TEXT
);

INSERT INTO us_states (code, name, region, has_eoc_exam, standards_framework) VALUES
('AL', 'Alabama', 'southeast', false, 'CC-aligned'),
('AK', 'Alaska', 'west', false, 'CC-aligned'),
('AZ', 'Arizona', 'southwest', false, 'CC-aligned'),
('AR', 'Arkansas', 'southeast', false, 'CC-aligned'),
('CA', 'California', 'west', false, 'CCSS'),
('CO', 'Colorado', 'west', false, 'CC-aligned'),
('CT', 'Connecticut', 'northeast', false, 'CC-aligned'),
('DE', 'Delaware', 'northeast', false, 'CC-aligned'),
('FL', 'Florida', 'southeast', true, 'B.E.S.T.'),
('GA', 'Georgia', 'southeast', true, 'GA Standards'),
('HI', 'Hawaii', 'west', false, 'CC-aligned'),
('ID', 'Idaho', 'west', false, 'CC-aligned'),
('IL', 'Illinois', 'midwest', false, 'CCSS'),
('IN', 'Indiana', 'midwest', true, 'IN Standards'),
('IA', 'Iowa', 'midwest', false, 'CC-aligned'),
('KS', 'Kansas', 'midwest', false, 'CC-aligned'),
('KY', 'Kentucky', 'southeast', false, 'CC-aligned'),
('LA', 'Louisiana', 'southeast', true, 'LA Standards'),
('ME', 'Maine', 'northeast', false, 'CC-aligned'),
('MD', 'Maryland', 'northeast', false, 'CC-aligned'),
('MA', 'Massachusetts', 'northeast', false, 'MA Frameworks'),
('MI', 'Michigan', 'midwest', false, 'CCSS'),
('MN', 'Minnesota', 'midwest', false, 'MN Standards'),
('MS', 'Mississippi', 'southeast', true, 'MS Standards'),
('MO', 'Missouri', 'midwest', true, 'MO Standards'),
('MT', 'Montana', 'west', false, 'CC-aligned'),
('NE', 'Nebraska', 'midwest', false, 'CC-aligned'),
('NV', 'Nevada', 'west', false, 'CC-aligned'),
('NH', 'New Hampshire', 'northeast', false, 'CC-aligned'),
('NJ', 'New Jersey', 'northeast', false, 'NJ Standards'),
('NM', 'New Mexico', 'southwest', false, 'CC-aligned'),
('NY', 'New York', 'northeast', true, 'Next Gen'),
('NC', 'North Carolina', 'southeast', true, 'NC SCS'),
('ND', 'North Dakota', 'midwest', false, 'CC-aligned'),
('OH', 'Ohio', 'midwest', true, 'OH Standards'),
('OK', 'Oklahoma', 'southwest', true, 'OK Standards'),
('OR', 'Oregon', 'west', false, 'CC-aligned'),
('PA', 'Pennsylvania', 'northeast', true, 'PA Standards'),
('RI', 'Rhode Island', 'northeast', false, 'CC-aligned'),
('SC', 'South Carolina', 'southeast', true, 'SC Standards'),
('SD', 'South Dakota', 'midwest', false, 'CC-aligned'),
('TN', 'Tennessee', 'southeast', true, 'TN Standards'),
('TX', 'Texas', 'southwest', true, 'TEKS'),
('UT', 'Utah', 'west', false, 'CC-aligned'),
('VT', 'Vermont', 'northeast', false, 'CC-aligned'),
('VA', 'Virginia', 'southeast', true, 'VA SOL'),
('WA', 'Washington', 'west', false, 'CCSS'),
('WV', 'West Virginia', 'southeast', false, 'CC-aligned'),
('WI', 'Wisconsin', 'midwest', false, 'CC-aligned'),
('WY', 'Wyoming', 'west', false, 'CC-aligned')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE us_states ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "us_states_read" ON us_states FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
