-- Migration 00053: School Strategy Checklist
-- Per-student, per-week working document used by a coach to connect
-- coaching with the student's current school experience while preserving
-- MathPivot's broader mastery, acceleration, and long-term development goals.
--
-- One row per (student_id, coach_id, week_of). The coach can revise the
-- entry throughout the week; a fresh row is created for a new week to
-- preserve history. All checklist state (checkbox booleans + free-text
-- fields) is stored as a JSONB blob so the client-side form can evolve
-- without new migrations for every field.

CREATE TABLE IF NOT EXISTS school_strategy_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_of DATE NOT NULL,
  -- Free-form JSONB payload holding every section's checkbox state and
  -- text fields. Shape is defined in
  -- src/lib/school-strategy/schema.ts (SchoolStrategyPayload).
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'on_track' CHECK (
    status IN ('on_track', 'monitor', 'adjust', 'escalate')
  ),
  next_review_date DATE,
  coach_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, coach_id, week_of)
);

CREATE INDEX IF NOT EXISTS idx_school_strategy_student ON school_strategy_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_school_strategy_coach ON school_strategy_entries(coach_id);
CREATE INDEX IF NOT EXISTS idx_school_strategy_week ON school_strategy_entries(week_of DESC);

-- Maintain updated_at automatically. Guarded so re-running the migration
-- (or supabase db reset) does not error on the trigger already existing.
CREATE OR REPLACE FUNCTION set_school_strategy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_school_strategy_updated_at ON school_strategy_entries;
CREATE TRIGGER trg_school_strategy_updated_at
BEFORE UPDATE ON school_strategy_entries
FOR EACH ROW
EXECUTE FUNCTION set_school_strategy_updated_at();

ALTER TABLE school_strategy_entries ENABLE ROW LEVEL SECURITY;

-- Coach can read and write their own entries. Admins can read all
-- (write policies for admins can be added later if needed).
DO $$ BEGIN
  CREATE POLICY "school_strategy_read_own_coach"
    ON school_strategy_entries FOR SELECT
    USING (coach_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "school_strategy_insert_own_coach"
    ON school_strategy_entries FOR INSERT
    WITH CHECK (coach_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "school_strategy_update_own_coach"
    ON school_strategy_entries FOR UPDATE
    USING (coach_id = auth.uid())
    WITH CHECK (coach_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admins/super_admins can read everything for oversight.
DO $$ BEGIN
  CREATE POLICY "school_strategy_read_admin"
    ON school_strategy_entries FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM users_profile up
        WHERE up.id = auth.uid()
          AND up.role IN ('admin', 'super_admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
