-- ============================================================================
-- Migration 00021: Tutor Payroll & Invoice System
-- Sprint 1 — Revenue Operations
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================
CREATE TYPE payout_status AS ENUM ('draft', 'pending_approval', 'approved', 'paid', 'rejected');
CREATE TYPE payout_period_type AS ENUM ('weekly', 'biweekly', 'monthly');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'void', 'refunded');
CREATE TYPE fee_type AS ENUM ('cancellation', 'no_show', 'late_cancellation', 'rescheduling');

-- ============================================================================
-- TUTOR PAY RATES
-- Supports per-subject and per-session-type rates
-- ============================================================================
CREATE TABLE IF NOT EXISTS tutor_pay_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_user_id UUID NOT NULL REFERENCES tutors_profile(user_id) ON DELETE CASCADE,
    label TEXT NOT NULL,                     -- e.g. "Algebra", "AP Calc", "Group Session"
    rate_cents INTEGER NOT NULL CHECK (rate_cents > 0),
    rate_type TEXT NOT NULL DEFAULT 'per_hour' CHECK (rate_type IN ('per_hour', 'per_session', 'flat')),
    is_default BOOLEAN NOT NULL DEFAULT false,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,                    -- NULL = ongoing
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pay_rates_tutor ON tutor_pay_rates(tutor_user_id);

-- ============================================================================
-- PAYOUT PERIODS
-- Settlement windows (e.g. "Week of Mar 3-9")
-- ============================================================================
CREATE TABLE IF NOT EXISTS payout_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_type payout_period_type NOT NULL DEFAULT 'biweekly',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_period CHECK (period_start < period_end),
    UNIQUE(period_start, period_end)
);

CREATE INDEX idx_payout_periods_dates ON payout_periods(period_start, period_end);

-- ============================================================================
-- TUTOR PAYOUTS
-- One payout record per tutor per period
-- ============================================================================
CREATE TABLE IF NOT EXISTS tutor_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_user_id UUID NOT NULL REFERENCES tutors_profile(user_id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES payout_periods(id),
    status payout_status NOT NULL DEFAULT 'draft',
    sessions_count INTEGER NOT NULL DEFAULT 0,
    total_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
    base_amount_cents INTEGER NOT NULL DEFAULT 0,
    bonus_cents INTEGER NOT NULL DEFAULT 0,
    deduction_cents INTEGER NOT NULL DEFAULT 0,
    total_amount_cents INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tutor_user_id, period_id)
);

CREATE INDEX idx_payouts_tutor ON tutor_payouts(tutor_user_id);
CREATE INDEX idx_payouts_status ON tutor_payouts(status);

-- ============================================================================
-- PAYOUT LINE ITEMS
-- Individual session earnings linked to a payout
-- ============================================================================
CREATE TABLE IF NOT EXISTS payout_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payout_id UUID NOT NULL REFERENCES tutor_payouts(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id),
    booking_id UUID REFERENCES bookings(id),
    description TEXT NOT NULL,
    rate_cents INTEGER NOT NULL,
    quantity NUMERIC(6,2) NOT NULL DEFAULT 1,  -- hours or session count
    amount_cents INTEGER NOT NULL,
    line_type TEXT NOT NULL DEFAULT 'session' CHECK (line_type IN ('session', 'bonus', 'deduction', 'adjustment')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payout_items_payout ON payout_line_items(payout_id);

-- ============================================================================
-- INVOICES
-- Formal invoices for families
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    family_id UUID NOT NULL REFERENCES families(id),
    parent_user_id UUID NOT NULL REFERENCES auth.users(id),
    status invoice_status NOT NULL DEFAULT 'draft',
    subtotal_cents INTEGER NOT NULL DEFAULT 0,
    tax_cents INTEGER NOT NULL DEFAULT 0,
    discount_cents INTEGER NOT NULL DEFAULT 0,
    total_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    due_date DATE,
    issued_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    voided_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_family ON invoices(family_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- ============================================================================
-- INVOICE LINE ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(6,2) NOT NULL DEFAULT 1,
    unit_price_cents INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    session_id UUID REFERENCES sessions(id),
    booking_id UUID REFERENCES bookings(id),
    product_id UUID REFERENCES products(id),
    line_type TEXT NOT NULL DEFAULT 'session' CHECK (line_type IN ('session', 'package', 'fee', 'credit', 'adjustment')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_items_invoice ON invoice_line_items(invoice_id);

-- ============================================================================
-- CANCELLATION / NO-SHOW FEE POLICIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS fee_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_type fee_type NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    amount_cents INTEGER,                     -- fixed amount
    percentage NUMERIC(5,2),                  -- or percentage of session cost
    window_hours INTEGER,                     -- grace window (e.g. 24h before session)
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- APPLIED FEES (actual charges from fee policies)
-- ============================================================================
CREATE TABLE IF NOT EXISTS applied_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    family_id UUID NOT NULL REFERENCES families(id),
    fee_policy_id UUID REFERENCES fee_policies(id),
    fee_type fee_type NOT NULL,
    amount_cents INTEGER NOT NULL,
    reason TEXT,
    invoice_id UUID REFERENCES invoices(id),
    waived BOOLEAN NOT NULL DEFAULT false,
    waived_by UUID REFERENCES auth.users(id),
    waived_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_applied_fees_booking ON applied_fees(booking_id);
CREATE INDEX idx_applied_fees_family ON applied_fees(family_id);

-- ============================================================================
-- HELPER: Generate next invoice number
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_year TEXT;
    v_seq INTEGER;
    v_number TEXT;
BEGIN
    v_year := to_char(NOW(), 'YYYY');
    SELECT COALESCE(MAX(
        NULLIF(regexp_replace(invoice_number, '^INV-' || v_year || '-', ''), invoice_number)::INTEGER
    ), 0) + 1 INTO v_seq
    FROM invoices
    WHERE invoice_number LIKE 'INV-' || v_year || '-%';

    v_number := 'INV-' || v_year || '-' || lpad(v_seq::TEXT, 5, '0');
    RETURN v_number;
END;
$$;

-- ============================================================================
-- HELPER: Calculate payout for a tutor in a period
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_tutor_payout(
    p_tutor_user_id UUID,
    p_period_start DATE,
    p_period_end DATE
) RETURNS TABLE (
    sessions_count INTEGER,
    total_hours NUMERIC,
    total_cents INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(s.id)::INTEGER AS sessions_count,
        COALESCE(SUM(
            EXTRACT(EPOCH FROM (b.end_at - b.start_at)) / 3600
        ), 0)::NUMERIC(6,2) AS total_hours,
        COALESCE(SUM(
            CASE
                WHEN pr.rate_cents IS NOT NULL AND pr.rate_type = 'per_hour' THEN
                    (pr.rate_cents * EXTRACT(EPOCH FROM (b.end_at - b.start_at)) / 3600)::INTEGER
                WHEN pr.rate_cents IS NOT NULL AND pr.rate_type = 'per_session' THEN
                    pr.rate_cents
                WHEN tp.hourly_rate IS NOT NULL THEN
                    (tp.hourly_rate * EXTRACT(EPOCH FROM (b.end_at - b.start_at)) / 3600)::INTEGER
                ELSE 0
            END
        ), 0)::INTEGER AS total_cents
    FROM sessions s
    JOIN bookings b ON s.booking_id = b.id
    JOIN tutors_profile tp ON b.tutor_user_id = tp.user_id
    LEFT JOIN LATERAL (
        SELECT rate_cents, rate_type
        FROM tutor_pay_rates
        WHERE tutor_user_id = p_tutor_user_id
          AND is_default = true
          AND effective_from <= b.start_at::DATE
          AND (effective_until IS NULL OR effective_until >= b.start_at::DATE)
        ORDER BY effective_from DESC
        LIMIT 1
    ) pr ON true
    WHERE b.tutor_user_id = p_tutor_user_id
      AND s.status = 'completed'
      AND s.completed_at >= p_period_start::TIMESTAMPTZ
      AND s.completed_at < (p_period_end + 1)::TIMESTAMPTZ;
END;
$$;

-- ============================================================================
-- TRIGGER: Auto-apply fee on late cancellation
-- ============================================================================
CREATE OR REPLACE FUNCTION check_cancellation_fee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_policy fee_policies%ROWTYPE;
    v_hours_until NUMERIC;
BEGIN
    -- Only fire when booking is canceled
    IF NEW.status = 'canceled' AND OLD.status != 'canceled' THEN
        v_hours_until := EXTRACT(EPOCH FROM (OLD.start_at - NOW())) / 3600;

        -- Find applicable fee policy
        SELECT * INTO v_policy
        FROM fee_policies
        WHERE fee_type = 'late_cancellation'
          AND is_active = true
          AND window_hours >= v_hours_until
        ORDER BY window_hours ASC
        LIMIT 1;

        IF v_policy.id IS NOT NULL THEN
            INSERT INTO applied_fees (booking_id, family_id, fee_policy_id, fee_type, amount_cents, reason)
            VALUES (
                NEW.id,
                NEW.family_id,
                v_policy.id,
                'late_cancellation',
                COALESCE(v_policy.amount_cents, 0),
                'Canceled ' || round(v_hours_until::NUMERIC, 1) || ' hours before session'
            );
        END IF;
    END IF;

    -- No-show fee
    IF NEW.status = 'no_show' AND OLD.status != 'no_show' THEN
        SELECT * INTO v_policy
        FROM fee_policies
        WHERE fee_type = 'no_show'
          AND is_active = true
        LIMIT 1;

        IF v_policy.id IS NOT NULL THEN
            INSERT INTO applied_fees (booking_id, family_id, fee_policy_id, fee_type, amount_cents, reason)
            VALUES (
                NEW.id,
                NEW.family_id,
                v_policy.id,
                'no_show',
                COALESCE(v_policy.amount_cents, 0),
                'Student did not attend scheduled session'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_cancellation_fee
    AFTER UPDATE OF status ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION check_cancellation_fee();

-- ============================================================================
-- DEFAULT FEE POLICIES
-- ============================================================================
INSERT INTO fee_policies (fee_type, name, description, amount_cents, window_hours, is_active) VALUES
('late_cancellation', 'Late Cancellation (under 24h)', 'Fee for canceling less than 24 hours before session', 2500, 24, true),
('no_show', 'No-Show Fee', 'Fee when student does not attend without notice', 5000, NULL, true),
('cancellation', 'Standard Cancellation', 'No fee for cancellations with 24+ hours notice', 0, NULL, true);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Tutor pay rates
ALTER TABLE tutor_pay_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY pay_rates_tutor_select ON tutor_pay_rates
    FOR SELECT TO authenticated
    USING (tutor_user_id = auth.uid() OR is_admin());

CREATE POLICY pay_rates_admin_manage ON tutor_pay_rates
    FOR ALL TO authenticated
    USING (is_admin());

-- Payout periods
ALTER TABLE payout_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY payout_periods_select ON payout_periods
    FOR SELECT TO authenticated
    USING (true);  -- all authenticated users can see periods

CREATE POLICY payout_periods_admin ON payout_periods
    FOR ALL TO authenticated
    USING (is_admin());

-- Tutor payouts
ALTER TABLE tutor_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY payouts_tutor_select ON tutor_payouts
    FOR SELECT TO authenticated
    USING (tutor_user_id = auth.uid() OR is_admin());

CREATE POLICY payouts_admin_manage ON tutor_payouts
    FOR ALL TO authenticated
    USING (is_admin());

-- Payout line items
ALTER TABLE payout_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY payout_items_select ON payout_line_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tutor_payouts tp
            WHERE tp.id = payout_id
              AND (tp.tutor_user_id = auth.uid() OR is_admin())
        )
    );

CREATE POLICY payout_items_admin ON payout_line_items
    FOR ALL TO authenticated
    USING (is_admin());

-- Invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoices_family_select ON invoices
    FOR SELECT TO authenticated
    USING (
        parent_user_id = auth.uid()
        OR is_admin()
        OR EXISTS (
            SELECT 1 FROM family_members fm
            WHERE fm.family_id = invoices.family_id
              AND fm.user_id = auth.uid()
        )
    );

CREATE POLICY invoices_admin_manage ON invoices
    FOR ALL TO authenticated
    USING (is_admin());

-- Invoice line items
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoice_items_select ON invoice_line_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM invoices inv
            WHERE inv.id = invoice_id
              AND (inv.parent_user_id = auth.uid() OR is_admin()
                   OR EXISTS (
                       SELECT 1 FROM family_members fm
                       WHERE fm.family_id = inv.family_id AND fm.user_id = auth.uid()
                   ))
        )
    );

CREATE POLICY invoice_items_admin ON invoice_line_items
    FOR ALL TO authenticated
    USING (is_admin());

-- Fee policies (everyone can read, admin can manage)
ALTER TABLE fee_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY fee_policies_select ON fee_policies
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY fee_policies_admin ON fee_policies
    FOR ALL TO authenticated
    USING (is_admin());

-- Applied fees
ALTER TABLE applied_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY applied_fees_select ON applied_fees
    FOR SELECT TO authenticated
    USING (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM family_members fm
            WHERE fm.family_id = applied_fees.family_id AND fm.user_id = auth.uid()
        )
    );

CREATE POLICY applied_fees_admin ON applied_fees
    FOR ALL TO authenticated
    USING (is_admin());
