-- ============================================================================
-- Migration 00022: Lead Pipeline & Trial Lessons
-- Sprint 2 — Growth Engine
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================
CREATE TYPE lead_status AS ENUM (
    'new',
    'contacted',
    'qualified',
    'trial_scheduled',
    'trial_completed',
    'converted',
    'lost'
);

CREATE TYPE lead_source AS ENUM (
    'website',
    'referral',
    'social_media',
    'google_ads',
    'facebook_ads',
    'walk_in',
    'phone',
    'email',
    'partner',
    'event',
    'other'
);

CREATE TYPE trial_status AS ENUM (
    'scheduled',
    'completed',
    'no_show',
    'canceled'
);

-- ============================================================================
-- LEADS
-- ============================================================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Contact info
    parent_name TEXT NOT NULL,
    parent_email TEXT NOT NULL,
    parent_phone TEXT,
    student_name TEXT,
    student_grade INTEGER CHECK (student_grade IS NULL OR (student_grade >= 1 AND student_grade <= 12)),
    -- Pipeline
    status lead_status NOT NULL DEFAULT 'new',
    source lead_source NOT NULL DEFAULT 'website',
    source_detail TEXT,                       -- e.g. "Google search: math tutor near me"
    -- Qualification
    subjects_interested TEXT[] DEFAULT '{}',   -- e.g. {"algebra", "ap_calc_ab"}
    goals TEXT,
    notes TEXT,
    budget_range TEXT,                        -- e.g. "$50-75/hr"
    preferred_modality TEXT CHECK (preferred_modality IS NULL OR preferred_modality IN ('online', 'in_person', 'either')),
    preferred_schedule TEXT,                  -- free text: "Weekday afternoons"
    -- Scoring
    score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    -- Assignment
    assigned_to UUID REFERENCES auth.users(id),
    -- Conversion
    converted_family_id UUID REFERENCES families(id),
    converted_at TIMESTAMPTZ,
    lost_reason TEXT,
    -- Timestamps
    last_contacted_at TIMESTAMPTZ,
    next_follow_up_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_email ON leads(parent_email);
CREATE INDEX idx_leads_follow_up ON leads(next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;
CREATE INDEX idx_leads_created ON leads(created_at DESC);

-- ============================================================================
-- LEAD ACTIVITY LOG
-- ============================================================================
CREATE TYPE lead_activity_type AS ENUM (
    'created',
    'status_changed',
    'note_added',
    'email_sent',
    'call_made',
    'trial_scheduled',
    'trial_completed',
    'converted',
    'lost',
    'reassigned'
);

CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    activity_type lead_activity_type NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id, created_at DESC);

-- ============================================================================
-- TRIAL LESSONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS trial_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    tutor_user_id UUID REFERENCES tutors_profile(user_id),
    student_name TEXT NOT NULL,
    student_grade INTEGER CHECK (student_grade >= 1 AND student_grade <= 12),
    subject TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    modality TEXT NOT NULL DEFAULT 'online' CHECK (modality IN ('online', 'in_person')),
    status trial_status NOT NULL DEFAULT 'scheduled',
    -- Feedback
    tutor_notes TEXT,
    tutor_rating INTEGER CHECK (tutor_rating IS NULL OR (tutor_rating >= 1 AND tutor_rating <= 5)),
    parent_feedback TEXT,
    parent_rating INTEGER CHECK (parent_rating IS NULL OR (parent_rating >= 1 AND parent_rating <= 5)),
    -- Outcome
    recommended_track TEXT,
    recommended_package TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trial_lessons_lead ON trial_lessons(lead_id);
CREATE INDEX idx_trial_lessons_tutor ON trial_lessons(tutor_user_id);
CREATE INDEX idx_trial_lessons_scheduled ON trial_lessons(scheduled_at);

-- ============================================================================
-- LEAD SOURCE ANALYTICS (materialized summary)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lead_source_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source lead_source NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_leads INTEGER NOT NULL DEFAULT 0,
    qualified_leads INTEGER NOT NULL DEFAULT 0,
    trials_scheduled INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    conversion_rate NUMERIC(5,2) DEFAULT 0,
    avg_time_to_convert_days NUMERIC(6,1),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(source, period_start, period_end)
);

-- ============================================================================
-- TRIGGER: Auto-log lead status changes
-- ============================================================================
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO lead_activities (lead_id, activity_type, description, metadata)
        VALUES (
            NEW.id,
            'status_changed',
            'Status changed from ' || OLD.status || ' to ' || NEW.status,
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
        );
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lead_status_change
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION log_lead_status_change();

-- ============================================================================
-- TRIGGER: Auto-log new lead creation
-- ============================================================================
CREATE OR REPLACE FUNCTION log_lead_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO lead_activities (lead_id, activity_type, description, metadata)
    VALUES (
        NEW.id,
        'created',
        'Lead created from ' || NEW.source,
        jsonb_build_object('source', NEW.source, 'source_detail', NEW.source_detail)
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lead_created
    AFTER INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION log_lead_created();

-- ============================================================================
-- FUNCTION: Refresh lead source stats for a period
-- ============================================================================
CREATE OR REPLACE FUNCTION refresh_lead_source_stats(
    p_period_start DATE,
    p_period_end DATE
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO lead_source_stats (source, period_start, period_end, total_leads, qualified_leads, trials_scheduled, conversions, conversion_rate, avg_time_to_convert_days)
    SELECT
        l.source,
        p_period_start,
        p_period_end,
        COUNT(*)::INTEGER AS total_leads,
        COUNT(*) FILTER (WHERE l.status NOT IN ('new', 'lost'))::INTEGER AS qualified_leads,
        COUNT(*) FILTER (WHERE l.status IN ('trial_scheduled', 'trial_completed', 'converted'))::INTEGER AS trials_scheduled,
        COUNT(*) FILTER (WHERE l.status = 'converted')::INTEGER AS conversions,
        CASE
            WHEN COUNT(*) > 0 THEN
                ROUND((COUNT(*) FILTER (WHERE l.status = 'converted')::NUMERIC / COUNT(*)) * 100, 2)
            ELSE 0
        END AS conversion_rate,
        AVG(
            CASE WHEN l.converted_at IS NOT NULL THEN
                EXTRACT(EPOCH FROM (l.converted_at - l.created_at)) / 86400
            END
        )::NUMERIC(6,1) AS avg_time_to_convert_days
    FROM leads l
    WHERE l.created_at >= p_period_start::TIMESTAMPTZ
      AND l.created_at < (p_period_end + 1)::TIMESTAMPTZ
    GROUP BY l.source
    ON CONFLICT (source, period_start, period_end) DO UPDATE SET
        total_leads = EXCLUDED.total_leads,
        qualified_leads = EXCLUDED.qualified_leads,
        trials_scheduled = EXCLUDED.trials_scheduled,
        conversions = EXCLUDED.conversions,
        conversion_rate = EXCLUDED.conversion_rate,
        avg_time_to_convert_days = EXCLUDED.avg_time_to_convert_days,
        updated_at = NOW();
END;
$$;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Leads: admin only (public form uses service role)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY leads_admin ON leads
    FOR ALL TO authenticated
    USING (is_admin());

-- Lead activities: admin only
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY lead_activities_admin ON lead_activities
    FOR ALL TO authenticated
    USING (is_admin());

-- Trial lessons: admin + assigned tutor
ALTER TABLE trial_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY trial_lessons_select ON trial_lessons
    FOR SELECT TO authenticated
    USING (
        is_admin()
        OR tutor_user_id = auth.uid()
    );

CREATE POLICY trial_lessons_admin ON trial_lessons
    FOR ALL TO authenticated
    USING (is_admin());

-- Lead source stats: admin only
ALTER TABLE lead_source_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY lead_source_stats_admin ON lead_source_stats
    FOR ALL TO authenticated
    USING (is_admin());
