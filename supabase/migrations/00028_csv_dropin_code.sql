-- ============================================================================
-- Migration 00028: Sprint 4 — CSV Import, Drop-in Sessions, Code Grading
-- ============================================================================

-- ============================================================================
-- 1. CSV IMPORT JOBS (tracks bulk import operations)
-- ============================================================================
CREATE TYPE import_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE import_entity AS ENUM ('students', 'tutors', 'families', 'skills');

CREATE TABLE IF NOT EXISTS csv_import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type import_entity NOT NULL,
    file_name TEXT NOT NULL,
    total_rows INTEGER NOT NULL DEFAULT 0,
    processed_rows INTEGER NOT NULL DEFAULT 0,
    success_rows INTEGER NOT NULL DEFAULT 0,
    error_rows INTEGER NOT NULL DEFAULT 0,
    errors JSONB DEFAULT '[]',
    status import_status NOT NULL DEFAULT 'pending',
    imported_by UUID NOT NULL REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_import_jobs_status ON csv_import_jobs(status);

-- ============================================================================
-- 2. DROP-IN / OPEN LAB SESSIONS
-- ============================================================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_drop_in BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS drop_in_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_user_id UUID NOT NULL REFERENCES tutors_profile(user_id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id),
    title TEXT NOT NULL,                      -- e.g. "Algebra Help Desk", "Open Math Lab"
    subject TEXT,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_concurrent INTEGER NOT NULL DEFAULT 5,
    modality modality NOT NULL DEFAULT 'in_person',
    is_active BOOLEAN NOT NULL DEFAULT true,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (start_time < end_time)
);

CREATE INDEX idx_dropin_slots_tutor ON drop_in_slots(tutor_user_id);
CREATE INDEX idx_dropin_slots_day ON drop_in_slots(day_of_week);

-- Drop-in attendance log (students who walked in)
CREATE TABLE IF NOT EXISTS drop_in_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID NOT NULL REFERENCES drop_in_slots(id) ON DELETE CASCADE,
    student_user_id UUID NOT NULL REFERENCES auth.users(id),
    family_id UUID REFERENCES families(id),
    check_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_out_at TIMESTAMPTZ,
    topics_covered TEXT,
    tutor_notes TEXT,
    -- unique per student per slot per day enforced via index below
);

CREATE INDEX idx_dropin_attendance_slot ON drop_in_attendance(slot_id, check_in_at);
CREATE UNIQUE INDEX idx_dropin_one_per_day ON drop_in_attendance(slot_id, student_user_id, (check_in_at::DATE));

-- ============================================================================
-- 3. CODE HOMEWORK GRADING
-- ============================================================================
CREATE TYPE code_language AS ENUM (
    'python', 'javascript', 'java', 'cpp', 'r', 'sql', 'pseudocode'
);

CREATE TYPE submission_verdict AS ENUM (
    'pending', 'running', 'accepted', 'wrong_answer',
    'runtime_error', 'time_limit', 'compilation_error', 'manual_review'
);

-- Code problems (reusable problem bank)
CREATE TABLE IF NOT EXISTS code_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    language code_language NOT NULL DEFAULT 'python',
    starter_code TEXT,
    solution_code TEXT,                       -- reference solution (admin only)
    -- Test cases stored as JSON array
    test_cases JSONB NOT NULL DEFAULT '[]',   -- [{input: "...", expected_output: "...", is_hidden: false}]
    time_limit_ms INTEGER NOT NULL DEFAULT 5000,
    memory_limit_mb INTEGER NOT NULL DEFAULT 128,
    -- Metadata
    topic TEXT,                               -- e.g. "recursion", "sorting", "linear_algebra"
    skill_id UUID REFERENCES skills(id),
    hints JSONB DEFAULT '[]',
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_code_problems_topic ON code_problems(topic);
CREATE INDEX idx_code_problems_language ON code_problems(language);

-- Code submissions
CREATE TABLE IF NOT EXISTS code_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES code_problems(id),
    student_user_id UUID NOT NULL REFERENCES auth.users(id),
    homework_item_id UUID REFERENCES homework_items(id),
    -- Submission
    language code_language NOT NULL,
    source_code TEXT NOT NULL,
    -- Results
    verdict submission_verdict NOT NULL DEFAULT 'pending',
    test_results JSONB DEFAULT '[]',          -- [{test_id, passed, actual_output, expected_output, runtime_ms}]
    tests_passed INTEGER NOT NULL DEFAULT 0,
    tests_total INTEGER NOT NULL DEFAULT 0,
    execution_time_ms INTEGER,
    -- Feedback
    ai_feedback TEXT,                         -- AI-generated code review
    tutor_feedback TEXT,
    score INTEGER CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_code_submissions_student ON code_submissions(student_user_id, created_at DESC);
CREATE INDEX idx_code_submissions_problem ON code_submissions(problem_id);
CREATE INDEX idx_code_submissions_homework ON code_submissions(homework_item_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- CSV import jobs: admin only
ALTER TABLE csv_import_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY import_jobs_admin ON csv_import_jobs
    FOR ALL TO authenticated USING (is_admin());

-- Drop-in slots: everyone reads, admin manages
ALTER TABLE drop_in_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY dropin_slots_select ON drop_in_slots
    FOR SELECT TO authenticated USING (true);
CREATE POLICY dropin_slots_admin ON drop_in_slots
    FOR ALL TO authenticated USING (is_admin());

-- Drop-in attendance: student sees own, tutor sees own slot, admin sees all
ALTER TABLE drop_in_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY dropin_attendance_select ON drop_in_attendance
    FOR SELECT TO authenticated
    USING (
        student_user_id = auth.uid()
        OR is_admin()
        OR EXISTS (
            SELECT 1 FROM drop_in_slots ds
            WHERE ds.id = slot_id AND ds.tutor_user_id = auth.uid()
        )
    );
CREATE POLICY dropin_attendance_insert ON drop_in_attendance
    FOR INSERT TO authenticated
    WITH CHECK (student_user_id = auth.uid() OR is_admin());
CREATE POLICY dropin_attendance_admin ON drop_in_attendance
    FOR ALL TO authenticated USING (is_admin());

-- Code problems: everyone reads active, admin manages
ALTER TABLE code_problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY code_problems_select ON code_problems
    FOR SELECT TO authenticated USING (is_active = true OR is_admin());
CREATE POLICY code_problems_admin ON code_problems
    FOR ALL TO authenticated USING (is_admin());

-- Code submissions: student sees own, tutor sees assigned students, admin sees all
ALTER TABLE code_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY code_submissions_select ON code_submissions
    FOR SELECT TO authenticated
    USING (
        student_user_id = auth.uid()
        OR is_admin()
        OR (is_tutor() AND EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.student_user_id = code_submissions.student_user_id
              AND b.tutor_user_id = auth.uid()
              AND b.status != 'canceled'
        ))
    );
CREATE POLICY code_submissions_insert ON code_submissions
    FOR INSERT TO authenticated
    WITH CHECK (student_user_id = auth.uid());
CREATE POLICY code_submissions_admin ON code_submissions
    FOR ALL TO authenticated USING (is_admin());
