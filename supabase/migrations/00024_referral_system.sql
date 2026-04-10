-- ============================================================================
-- Migration 00024: Referral System
-- Referral codes, tracking, and reward credits
-- ============================================================================

CREATE TYPE referral_status AS ENUM ('pending', 'trial_completed', 'converted', 'rewarded', 'expired');

-- ============================================================================
-- REFERRAL CODES
-- Each family gets a unique referral code
-- ============================================================================
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    total_referrals INTEGER NOT NULL DEFAULT 0,
    total_conversions INTEGER NOT NULL DEFAULT 0,
    total_reward_cents INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(family_id)
);

CREATE INDEX idx_referral_codes_code ON referral_codes(code);

-- ============================================================================
-- REFERRALS (individual referral tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_code_id UUID NOT NULL REFERENCES referral_codes(id),
    referrer_family_id UUID NOT NULL REFERENCES families(id),
    -- Referred person (starts as lead, may become family)
    referred_lead_id UUID REFERENCES leads(id),
    referred_family_id UUID REFERENCES families(id),
    referred_name TEXT NOT NULL,
    referred_email TEXT NOT NULL,
    -- Status
    status referral_status NOT NULL DEFAULT 'pending',
    -- Rewards
    referrer_reward_cents INTEGER NOT NULL DEFAULT 0,
    referred_reward_cents INTEGER NOT NULL DEFAULT 0,
    reward_applied_at TIMESTAMPTZ,
    -- Timestamps
    converted_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referrals_code ON referrals(referral_code_id);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_family_id);
CREATE INDEX idx_referrals_email ON referrals(referred_email);
CREATE INDEX idx_referrals_status ON referrals(status);

-- ============================================================================
-- REFERRAL REWARD POLICIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS referral_reward_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    referrer_reward_cents INTEGER NOT NULL DEFAULT 0,    -- reward for person who referred
    referred_reward_cents INTEGER NOT NULL DEFAULT 0,    -- reward for new family
    min_sessions_to_qualify INTEGER NOT NULL DEFAULT 1,  -- sessions before reward triggers
    expires_after_days INTEGER DEFAULT 90,               -- referral must convert within N days
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default policy: $25 credit for referrer, $15 credit for new family after 1 session
INSERT INTO referral_reward_policies (name, description, referrer_reward_cents, referred_reward_cents, min_sessions_to_qualify, expires_after_days)
VALUES ('Standard Referral', 'Earn $25 credit when your referral completes their first session. They get $15 credit too!', 2500, 1500, 1, 90);

-- ============================================================================
-- FUNCTION: Generate unique referral code for a family
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_referral_code(p_family_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code TEXT;
    v_family_name TEXT;
    v_attempts INTEGER := 0;
BEGIN
    -- Check if code already exists
    SELECT code INTO v_code FROM referral_codes WHERE family_id = p_family_id;
    IF v_code IS NOT NULL THEN
        RETURN v_code;
    END IF;

    -- Generate from family name
    SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 4))
    INTO v_family_name FROM families WHERE id = p_family_id;

    LOOP
        v_code := COALESCE(v_family_name, 'MP') || '-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 5));
        BEGIN
            INSERT INTO referral_codes (family_id, code) VALUES (p_family_id, v_code);
            RETURN v_code;
        EXCEPTION WHEN unique_violation THEN
            v_attempts := v_attempts + 1;
            IF v_attempts > 10 THEN
                RAISE EXCEPTION 'Could not generate unique referral code';
            END IF;
        END;
    END LOOP;
END;
$$;

-- ============================================================================
-- FUNCTION: Apply referral reward (called when conditions met)
-- ============================================================================
CREATE OR REPLACE FUNCTION apply_referral_reward(p_referral_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ref referrals%ROWTYPE;
    v_policy referral_reward_policies%ROWTYPE;
BEGIN
    SELECT * INTO v_ref FROM referrals WHERE id = p_referral_id AND status = 'converted';
    IF v_ref.id IS NULL THEN RETURN FALSE; END IF;

    -- Get active policy
    SELECT * INTO v_policy FROM referral_reward_policies WHERE is_active = true LIMIT 1;
    IF v_policy.id IS NULL THEN RETURN FALSE; END IF;

    -- Apply referrer reward as credit
    IF v_policy.referrer_reward_cents > 0 THEN
        INSERT INTO credit_ledger (family_id, transaction_type, amount, description)
        VALUES (v_ref.referrer_family_id, 'adjustment', v_policy.referrer_reward_cents, 'Referral reward for ' || v_ref.referred_name);

        UPDATE families SET credit_balance = credit_balance + v_policy.referrer_reward_cents
        WHERE id = v_ref.referrer_family_id;
    END IF;

    -- Apply referred reward if they have a family
    IF v_policy.referred_reward_cents > 0 AND v_ref.referred_family_id IS NOT NULL THEN
        INSERT INTO credit_ledger (family_id, transaction_type, amount, description)
        VALUES (v_ref.referred_family_id, 'adjustment', v_policy.referred_reward_cents, 'Welcome bonus from referral');

        UPDATE families SET credit_balance = credit_balance + v_policy.referred_reward_cents
        WHERE id = v_ref.referred_family_id;
    END IF;

    -- Update referral
    UPDATE referrals SET
        status = 'rewarded',
        referrer_reward_cents = v_policy.referrer_reward_cents,
        referred_reward_cents = v_policy.referred_reward_cents,
        reward_applied_at = NOW(),
        updated_at = NOW()
    WHERE id = p_referral_id;

    -- Update referral code stats
    UPDATE referral_codes SET
        total_conversions = total_conversions + 1,
        total_reward_cents = total_reward_cents + v_policy.referrer_reward_cents
    WHERE id = v_ref.referral_code_id;

    RETURN TRUE;
END;
$$;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY referral_codes_own ON referral_codes
    FOR SELECT TO authenticated
    USING (
        family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
        OR is_admin()
    );

CREATE POLICY referral_codes_admin ON referral_codes
    FOR ALL TO authenticated
    USING (is_admin());

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY referrals_own ON referrals
    FOR SELECT TO authenticated
    USING (
        referrer_family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
        OR is_admin()
    );

CREATE POLICY referrals_admin ON referrals
    FOR ALL TO authenticated
    USING (is_admin());

ALTER TABLE referral_reward_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY reward_policies_select ON referral_reward_policies
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY reward_policies_admin ON referral_reward_policies
    FOR ALL TO authenticated
    USING (is_admin());
