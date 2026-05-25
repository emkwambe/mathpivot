-- Migration 00041: Coaching Schedules & Cohort System
-- Supports summer clinics + year-round coaching with same-program-default model

-- Coaching schedule slots (recurring weekly time blocks)
CREATE TABLE IF NOT EXISTS coaching_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id),
  program_slug TEXT NOT NULL,
  cohort_label TEXT NOT NULL DEFAULT 'Group A',
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  default_capacity INTEGER NOT NULL DEFAULT 5,
  max_capacity INTEGER NOT NULL DEFAULT 6,
  location TEXT DEFAULT 'online',
  is_summer_clinic BOOLEAN DEFAULT false,
  clinic_start_date DATE,
  clinic_end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cohort enrollments (student placed in a specific schedule slot)
CREATE TABLE IF NOT EXISTS cohort_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES coaching_schedules(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id),
  parent_id UUID REFERENCES auth.users(id),
  enrollment_id UUID REFERENCES program_enrollments(id),
  status TEXT NOT NULL DEFAULT 'waitlisted' CHECK (status IN ('waitlisted','confirmed','active','completed','withdrawn')),
  placement_method TEXT DEFAULT 'admin' CHECK (placement_method IN ('admin','diagnostic','self_select')),
  diagnostic_score JSONB,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','credited','refunded')),
  clinic_fee_cents INTEGER,
  fee_credited_at TIMESTAMPTZ,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(schedule_id, student_id)
);

-- Diagnostic assessments (pre-placement evaluations)
CREATE TABLE IF NOT EXISTS diagnostic_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id),
  administered_by UUID REFERENCES auth.users(id),
  assessment_type TEXT NOT NULL DEFAULT 'placement' CHECK (assessment_type IN ('placement','progress','readiness')),
  questions JSONB NOT NULL DEFAULT '[]',
  answers JSONB DEFAULT '{}',
  domain_scores JSONB DEFAULT '{}',
  overall_score NUMERIC(5,2),
  recommended_program TEXT,
  recommended_cohort_id UUID REFERENCES coaching_schedules(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lead status tracking (extends existing leads table)
DO $$ BEGIN
  ALTER TABLE leads
    ADD COLUMN lead_status TEXT DEFAULT 'new' CHECK (lead_status IN ('new','contacted','diagnostic_scheduled','diagnostic_complete','enrolled','declined','waitlisted')),
    ADD COLUMN assigned_to UUID REFERENCES auth.users(id),
    ADD COLUMN contacted_at TIMESTAMPTZ,
    ADD COLUMN diagnostic_id UUID REFERENCES diagnostic_assessments(id),
    ADD COLUMN cohort_id UUID REFERENCES coaching_schedules(id),
    ADD COLUMN follow_up_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schedules_coach ON coaching_schedules(coach_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_schedules_program ON coaching_schedules(program_slug) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_schedules_summer ON coaching_schedules(is_summer_clinic) WHERE is_summer_clinic = true;
CREATE INDEX IF NOT EXISTS idx_cohort_schedule ON cohort_enrollments(schedule_id);
CREATE INDEX IF NOT EXISTS idx_cohort_student ON cohort_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_cohort_status ON cohort_enrollments(status) WHERE status IN ('waitlisted','confirmed','active');
CREATE INDEX IF NOT EXISTS idx_diagnostic_student ON diagnostic_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(lead_status) WHERE lead_status NOT IN ('enrolled','declined');

-- RLS
ALTER TABLE coaching_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_assessments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "schedules_read" ON coaching_schedules FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "cohort_read" ON cohort_enrollments FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "diagnostic_read" ON diagnostic_assessments FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- View: coach schedule overview with enrollment counts
CREATE OR REPLACE VIEW coach_schedule_overview AS
SELECT
  cs.id AS schedule_id,
  cs.coach_id,
  cs.program_slug,
  cs.cohort_label,
  cs.day_of_week,
  cs.start_time,
  cs.end_time,
  cs.default_capacity,
  cs.max_capacity,
  cs.is_summer_clinic,
  cs.is_active,
  COUNT(ce.id) FILTER (WHERE ce.status IN ('confirmed','active')) AS enrolled_count,
  COUNT(ce.id) FILTER (WHERE ce.status = 'waitlisted') AS waitlisted_count,
  cs.default_capacity - COUNT(ce.id) FILTER (WHERE ce.status IN ('confirmed','active')) AS spots_remaining,
  CASE
    WHEN COUNT(ce.id) FILTER (WHERE ce.status IN ('confirmed','active')) >= cs.max_capacity THEN 'full'
    WHEN COUNT(ce.id) FILTER (WHERE ce.status IN ('confirmed','active')) >= cs.default_capacity THEN 'overflow'
    ELSE 'open'
  END AS fill_status
FROM coaching_schedules cs
LEFT JOIN cohort_enrollments ce ON ce.schedule_id = cs.id
GROUP BY cs.id;
