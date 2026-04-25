-- Migration: Coaching programs, curriculum, and enrollment tables
-- Supports the MathPivot coaching model (programs, not hourly tutoring)

-- ============================================================
-- COACHING PROGRAMS (Foundation / Acceleration / Elite tracks)
-- ============================================================
CREATE TABLE IF NOT EXISTS coaching_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  track_level TEXT NOT NULL CHECK (track_level IN ('foundation', 'acceleration', 'elite')),
  description TEXT,
  monthly_price_cents INTEGER NOT NULL,
  sessions_per_month INTEGER NOT NULL DEFAULT 4,
  max_students_per_coach INTEGER NOT NULL DEFAULT 15,
  min_enrollment_months INTEGER NOT NULL DEFAULT 3,
  grade_range_start INTEGER,
  grade_range_end INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- COURSES (e.g., "NC 6th Grade Math", "NC Math 1")
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  grade_level TEXT,
  state_standard TEXT DEFAULT 'NC',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- CURRICULUM UNITS (e.g., "The Number System", "Ratio & Proportional Relationships")
-- ============================================================
CREATE TABLE IF NOT EXISTS curriculum_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ATOMIC CONCEPTS (the core learning objectives)
-- Each concept has a lesson number, name, skills, and standard alignment
-- ============================================================
CREATE TABLE IF NOT EXISTS atomic_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES curriculum_units(id) ON DELETE CASCADE,
  lesson_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  key_skills TEXT[] NOT NULL DEFAULT '{}',
  standard_code TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PROGRAM-COURSE MAPPING (which courses belong to which program)
-- ============================================================
CREATE TABLE IF NOT EXISTS program_courses (
  program_id UUID NOT NULL REFERENCES coaching_programs(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  PRIMARY KEY (program_id, course_id)
);

-- ============================================================
-- PROGRAM ENROLLMENTS (student enrolled in a program with a coach)
-- ============================================================
CREATE TABLE IF NOT EXISTS program_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users_profile(id),
  coach_id UUID NOT NULL REFERENCES users_profile(id),
  program_id UUID NOT NULL REFERENCES coaching_programs(id),
  parent_id UUID REFERENCES users_profile(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paused_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  current_course_id UUID REFERENCES courses(id),
  stripe_subscription_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, program_id, coach_id)
);

-- ============================================================
-- STUDENT CONCEPT MASTERY (tracks mastery per atomic concept)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_concept_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users_profile(id),
  concept_id UUID NOT NULL REFERENCES atomic_concepts(id),
  enrollment_id UUID REFERENCES program_enrollments(id),
  mastery_level TEXT NOT NULL DEFAULT 'not_started' CHECK (mastery_level IN ('not_started', 'introduced', 'developing', 'proficient', 'mastered')),
  assessed_by UUID REFERENCES users_profile(id),
  assessed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, concept_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_coaching_programs_track ON coaching_programs(track_level);
CREATE INDEX idx_coaching_programs_active ON coaching_programs(is_active);
CREATE INDEX idx_curriculum_units_course ON curriculum_units(course_id);
CREATE INDEX idx_atomic_concepts_unit ON atomic_concepts(unit_id);
CREATE INDEX idx_atomic_concepts_lesson ON atomic_concepts(lesson_number);
CREATE INDEX idx_program_enrollments_student ON program_enrollments(student_id);
CREATE INDEX idx_program_enrollments_coach ON program_enrollments(coach_id);
CREATE INDEX idx_program_enrollments_status ON program_enrollments(status);
CREATE INDEX idx_student_mastery_student ON student_concept_mastery(student_id);
CREATE INDEX idx_student_mastery_concept ON student_concept_mastery(concept_id);
CREATE INDEX idx_student_mastery_level ON student_concept_mastery(mastery_level);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE coaching_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE atomic_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_concept_mastery ENABLE ROW LEVEL SECURITY;

-- Programs, courses, units, concepts: readable by all authenticated users
CREATE POLICY "coaching_programs_select" ON coaching_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "courses_select" ON courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "curriculum_units_select" ON curriculum_units FOR SELECT TO authenticated USING (true);
CREATE POLICY "atomic_concepts_select" ON atomic_concepts FOR SELECT TO authenticated USING (true);
CREATE POLICY "program_courses_select" ON program_courses FOR SELECT TO authenticated USING (true);

-- Programs, courses, units, concepts: writable by admins only
CREATE POLICY "coaching_programs_admin" ON coaching_programs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "courses_admin" ON courses FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "curriculum_units_admin" ON curriculum_units FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "atomic_concepts_admin" ON atomic_concepts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "program_courses_admin" ON program_courses FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Enrollments: students see their own, coaches see their portfolio, parents see their children, admins see all
CREATE POLICY "enrollments_select" ON program_enrollments FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR coach_id = auth.uid()
    OR parent_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "enrollments_insert" ON program_enrollments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'parent'))
  );

CREATE POLICY "enrollments_update" ON program_enrollments FOR UPDATE TO authenticated
  USING (
    coach_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Mastery: students see their own, coaches can read/write their students, admins see all
CREATE POLICY "mastery_select" ON student_concept_mastery FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR assessed_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM program_enrollments pe
      WHERE pe.student_id = student_concept_mastery.student_id
      AND pe.coach_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM program_enrollments pe
      WHERE pe.student_id = student_concept_mastery.student_id
      AND pe.parent_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "mastery_insert" ON student_concept_mastery FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM program_enrollments pe
      WHERE pe.student_id = student_concept_mastery.student_id
      AND pe.coach_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "mastery_update" ON student_concept_mastery FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM program_enrollments pe
      WHERE pe.student_id = student_concept_mastery.student_id
      AND pe.coach_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );
