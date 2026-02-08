-- ============================================================================
-- WHITEBOARDS TABLE - Standalone whiteboard library for tutors
-- Migration: 00013_whiteboards.sql
-- ============================================================================

-- Create the whiteboards table
CREATE TABLE whiteboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_whiteboards_tutor_user_id ON whiteboards(tutor_user_id);
CREATE INDEX idx_whiteboards_category ON whiteboards(category);
CREATE INDEX idx_whiteboards_is_public ON whiteboards(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_whiteboards_tags ON whiteboards USING GIN(tags);
CREATE INDEX idx_whiteboards_name ON whiteboards(name);
CREATE INDEX idx_whiteboards_created_at ON whiteboards(created_at DESC);

-- Updated_at trigger
CREATE TRIGGER set_whiteboards_updated_at
    BEFORE UPDATE ON whiteboards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE whiteboards ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Tutors can manage (CRUD) their own whiteboards
CREATE POLICY "Tutors can manage their own whiteboards"
    ON whiteboards
    FOR ALL
    TO authenticated
    USING (
        public.is_tutor() AND tutor_user_id = auth.uid()
    )
    WITH CHECK (
        public.is_tutor() AND tutor_user_id = auth.uid()
    );

-- Tutors can view public whiteboards from other tutors
CREATE POLICY "Tutors can view public whiteboards"
    ON whiteboards
    FOR SELECT
    TO authenticated
    USING (
        public.is_tutor() AND is_public = TRUE
    );

-- Admins can manage all whiteboards
CREATE POLICY "Admins can manage all whiteboards"
    ON whiteboards
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE whiteboards IS 'Standalone whiteboard library for tutors to create and reuse content';
COMMENT ON COLUMN whiteboards.elements IS 'JSON array of Excalidraw elements';
COMMENT ON COLUMN whiteboards.is_public IS 'If true, other tutors can view and copy this whiteboard';
COMMENT ON COLUMN whiteboards.tags IS 'Array of tags for filtering and organization';
COMMENT ON COLUMN whiteboards.version IS 'Version counter for tracking changes';
