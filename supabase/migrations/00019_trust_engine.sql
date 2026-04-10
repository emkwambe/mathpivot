-- ============================================================================
-- MATHPIVOT TUTOROS - TRUST ENGINE & MESSAGING
-- Migration 00019: Message threads, messages, and trust scoring
-- ============================================================================

-- ============================================================================
-- MESSAGE THREAD STATUS
-- ============================================================================
CREATE TYPE message_thread_status AS ENUM ('active', 'archived', 'blocked');

-- ============================================================================
-- MESSAGE THREADS
-- Parent-tutor conversation threads scoped by student
-- ============================================================================
CREATE TABLE IF NOT EXISTS message_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participant_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    subject TEXT,
    status message_thread_status NOT NULL DEFAULT 'active',
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT participants_ordered CHECK (participant_a < participant_b),
    CONSTRAINT no_self_thread CHECK (participant_a <> participant_b),
    UNIQUE(participant_a, participant_b, student_user_id)
);

CREATE INDEX idx_threads_participant_a ON message_threads(participant_a);
CREATE INDEX idx_threads_participant_b ON message_threads(participant_b);
CREATE INDEX idx_threads_last_message ON message_threads(last_message_at DESC);

-- ============================================================================
-- MESSAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (char_length(body) <= 5000),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_thread ON messages(thread_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(thread_id, read_at) WHERE read_at IS NULL;

-- ============================================================================
-- TRUST SCORES
-- Tracks trust level between a parent and a tutor
-- ============================================================================
CREATE TYPE trust_level AS ENUM ('new', 'building', 'established', 'high');

CREATE TABLE IF NOT EXISTS trust_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tutor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    level trust_level NOT NULL DEFAULT 'new',
    sessions_completed INTEGER NOT NULL DEFAULT 0,
    positive_reports INTEGER NOT NULL DEFAULT 0,
    concerns_raised INTEGER NOT NULL DEFAULT 0,
    last_session_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(parent_user_id, tutor_user_id)
);

CREATE INDEX idx_trust_parent ON trust_scores(parent_user_id);
CREATE INDEX idx_trust_tutor ON trust_scores(tutor_user_id);

-- ============================================================================
-- TRUST EVENTS (audit trail for score changes)
-- ============================================================================
CREATE TYPE trust_event_type AS ENUM (
    'session_completed',
    'positive_feedback',
    'concern_raised',
    'concern_resolved',
    'report_submitted',
    'admin_adjustment'
);

CREATE TABLE IF NOT EXISTS trust_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trust_score_id UUID NOT NULL REFERENCES trust_scores(id) ON DELETE CASCADE,
    event_type trust_event_type NOT NULL,
    delta INTEGER NOT NULL DEFAULT 0,
    note TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trust_events_score ON trust_events(trust_score_id, created_at DESC);

-- ============================================================================
-- HELPER: Check if user is a thread participant
-- ============================================================================
CREATE OR REPLACE FUNCTION is_thread_participant(p_thread_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM message_threads
        WHERE id = p_thread_id
          AND (participant_a = p_user_id OR participant_b = p_user_id)
    );
$$;

-- ============================================================================
-- HELPER: Compute trust level from score
-- ============================================================================
CREATE OR REPLACE FUNCTION compute_trust_level(p_score INTEGER)
RETURNS trust_level
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN p_score >= 75 THEN 'high'::trust_level
        WHEN p_score >= 50 THEN 'established'::trust_level
        WHEN p_score >= 25 THEN 'building'::trust_level
        ELSE 'new'::trust_level
    END;
$$;

-- ============================================================================
-- TRIGGER: Update thread.last_message_at on new message
-- ============================================================================
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE message_threads
    SET last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_thread_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_thread_last_message();

-- ============================================================================
-- TRIGGER: Recalculate trust level on score change
-- ============================================================================
CREATE OR REPLACE FUNCTION update_trust_level()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.level := compute_trust_level(NEW.score);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_trust_level
    BEFORE UPDATE OF score ON trust_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_trust_level();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Message threads
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY threads_select ON message_threads
    FOR SELECT TO authenticated
    USING (participant_a = auth.uid() OR participant_b = auth.uid());

CREATE POLICY threads_insert ON message_threads
    FOR INSERT TO authenticated
    WITH CHECK (participant_a = auth.uid() OR participant_b = auth.uid());

CREATE POLICY threads_update ON message_threads
    FOR UPDATE TO authenticated
    USING (participant_a = auth.uid() OR participant_b = auth.uid());

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY messages_select ON messages
    FOR SELECT TO authenticated
    USING (is_thread_participant(thread_id, auth.uid()));

CREATE POLICY messages_insert ON messages
    FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
        AND is_thread_participant(thread_id, auth.uid())
    );

-- Trust scores: parents see own, tutors see own, admins see all
ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY trust_scores_select ON trust_scores
    FOR SELECT TO authenticated
    USING (
        parent_user_id = auth.uid()
        OR tutor_user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users_profile
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY trust_scores_admin_manage ON trust_scores
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users_profile
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Trust events: same visibility as trust scores
ALTER TABLE trust_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY trust_events_select ON trust_events
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM trust_scores ts
            WHERE ts.id = trust_score_id
              AND (ts.parent_user_id = auth.uid() OR ts.tutor_user_id = auth.uid()
                   OR EXISTS (
                       SELECT 1 FROM users_profile
                       WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
                   ))
        )
    );
