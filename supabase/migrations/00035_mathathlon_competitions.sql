-- Migration: Mathathlon competition system
-- Curriculum-based competitions (not trick math) as the accessible on-ramp

-- ============================================================
-- COMPETITIONS (Mathathlon events + external competitions)
-- ============================================================
CREATE TABLE IF NOT EXISTS math_competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  competition_type TEXT NOT NULL CHECK (competition_type IN ('mathathlon', 'external')),
  description TEXT,
  course_id UUID REFERENCES courses(id),
  grade_range_start INTEGER,
  grade_range_end INTEGER,
  registration_opens_at TIMESTAMPTZ,
  registration_closes_at TIMESTAMPTZ,
  competition_date TIMESTAMPTZ,
  max_participants INTEGER,
  entry_fee_cents INTEGER DEFAULT 0,
  location TEXT,
  is_virtual BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('draft', 'upcoming', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled')),
  created_by UUID REFERENCES users_profile(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- COMPETITION ROUNDS (Mathathlon can have multiple rounds)
-- ============================================================
CREATE TABLE IF NOT EXISTS competition_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES math_competitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  round_number INTEGER NOT NULL DEFAULT 1,
  round_type TEXT NOT NULL CHECK (round_type IN ('individual', 'team', 'speed', 'applied', 'presentation')),
  time_limit_minutes INTEGER,
  max_score INTEGER,
  concept_ids UUID[] DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- COMPETITION REGISTRATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS competition_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES math_competitions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users_profile(id),
  registered_by UUID REFERENCES users_profile(id),
  enrollment_id UUID REFERENCES program_enrollments(id),
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'waitlisted', 'withdrawn', 'no_show', 'completed')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'waived', 'refunded')),
  team_name TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (competition_id, student_id)
);

-- ============================================================
-- COMPETITION RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS competition_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES math_competitions(id) ON DELETE CASCADE,
  round_id UUID REFERENCES competition_rounds(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users_profile(id),
  score NUMERIC,
  max_possible_score NUMERIC,
  placement INTEGER,
  percentile NUMERIC,
  badge_earned TEXT CHECK (badge_earned IN ('gold', 'silver', 'bronze', 'excellence', 'participation')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (competition_id, round_id, student_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_competitions_type ON math_competitions(competition_type);
CREATE INDEX idx_competitions_status ON math_competitions(status);
CREATE INDEX idx_competitions_date ON math_competitions(competition_date);
CREATE INDEX idx_competition_regs_student ON competition_registrations(student_id);
CREATE INDEX idx_competition_regs_comp ON competition_registrations(competition_id);
CREATE INDEX idx_competition_results_student ON competition_results(student_id);
CREATE INDEX idx_competition_results_comp ON competition_results(competition_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE math_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_results ENABLE ROW LEVEL SECURITY;

-- Competitions and rounds: readable by all authenticated
CREATE POLICY "competitions_select" ON math_competitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "competition_rounds_select" ON competition_rounds FOR SELECT TO authenticated USING (true);

-- Competitions: writable by admins
CREATE POLICY "competitions_admin" ON math_competitions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "competition_rounds_admin" ON competition_rounds FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Registrations: students/parents see own, coaches see their students, admins see all
CREATE POLICY "comp_regs_select" ON competition_registrations FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR registered_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM program_enrollments pe
      WHERE pe.student_id = competition_registrations.student_id
      AND (pe.coach_id = auth.uid() OR pe.parent_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "comp_regs_insert" ON competition_registrations FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'parent'))
  );

-- Results: same visibility as registrations
CREATE POLICY "comp_results_select" ON competition_results FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM program_enrollments pe
      WHERE pe.student_id = competition_results.student_id
      AND (pe.coach_id = auth.uid() OR pe.parent_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "comp_results_admin" ON competition_results FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
