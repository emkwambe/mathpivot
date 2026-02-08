-- Session Whiteboards table for persisting Excalidraw whiteboard data
-- Migration: 00012_session_whiteboards.sql

-- Create the session_whiteboards table
CREATE TABLE session_whiteboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_session_whiteboard UNIQUE (session_id)
);

-- Create index for fast lookups by session_id
CREATE INDEX idx_session_whiteboards_session_id ON session_whiteboards(session_id);

-- Add updated_at trigger
CREATE TRIGGER set_session_whiteboards_updated_at
    BEFORE UPDATE ON session_whiteboards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE session_whiteboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Tutors can view and update whiteboards for sessions they're assigned to
CREATE POLICY "Tutors can manage their session whiteboards"
    ON session_whiteboards
    FOR ALL
    TO authenticated
    USING (
        public.is_tutor() AND
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN bookings b ON b.id = s.booking_id
            WHERE s.id = session_whiteboards.session_id
            AND b.tutor_user_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_tutor() AND
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN bookings b ON b.id = s.booking_id
            WHERE s.id = session_whiteboards.session_id
            AND b.tutor_user_id = auth.uid()
        )
    );

-- Students can view and update whiteboards for their own sessions
CREATE POLICY "Students can manage their session whiteboards"
    ON session_whiteboards
    FOR ALL
    TO authenticated
    USING (
        public.is_student() AND
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN bookings b ON b.id = s.booking_id
            WHERE s.id = session_whiteboards.session_id
            AND b.student_user_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_student() AND
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN bookings b ON b.id = s.booking_id
            WHERE s.id = session_whiteboards.session_id
            AND b.student_user_id = auth.uid()
        )
    );

-- Parents can view whiteboards for their children's sessions (read-only)
CREATE POLICY "Parents can view their children's session whiteboards"
    ON session_whiteboards
    FOR SELECT
    TO authenticated
    USING (
        public.is_parent() AND
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN bookings b ON b.id = s.booking_id
            JOIN family_members fm ON fm.family_id = b.family_id
            WHERE s.id = session_whiteboards.session_id
            AND fm.user_id = auth.uid()
            AND fm.member_role = 'parent'
        )
    );

-- Admins can manage all whiteboards
CREATE POLICY "Admins can manage all session whiteboards"
    ON session_whiteboards
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Add comment for documentation
COMMENT ON TABLE session_whiteboards IS 'Stores Excalidraw whiteboard data for tutoring sessions';
COMMENT ON COLUMN session_whiteboards.elements IS 'JSON array of Excalidraw elements';
COMMENT ON COLUMN session_whiteboards.version IS 'Version counter for optimistic concurrency control';
