-- Migration: Coach earnings and payout tracking

-- ============================================================
-- COACH EARNINGS (monthly calculated earnings per coach)
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES users_profile(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_revenue_cents INTEGER NOT NULL DEFAULT 0,
  coach_share_percent NUMERIC NOT NULL DEFAULT 60,
  coach_earnings_cents INTEGER NOT NULL DEFAULT 0,
  active_students INTEGER NOT NULL DEFAULT 0,
  sessions_delivered INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'disputed')),
  approved_by UUID REFERENCES users_profile(id),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payout_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coach_id, period_start)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_coach_earnings_coach ON coach_earnings(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_earnings_period ON coach_earnings(period_start);
CREATE INDEX IF NOT EXISTS idx_coach_earnings_status ON coach_earnings(status);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE coach_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_earnings_select" ON coach_earnings FOR SELECT TO authenticated
  USING (
    coach_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "coach_earnings_admin" ON coach_earnings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
