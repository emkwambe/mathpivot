-- Migration: Add integrations support
-- Stores OAuth tokens and integration settings for external services

-- User integrations table (Google, Zoom, etc.)
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'zoom', etc.
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  email VARCHAR(255), -- Connected account email
  scopes TEXT, -- Comma-separated list of granted scopes
  metadata JSONB DEFAULT '{}', -- Provider-specific data
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, provider)
);

-- Google Calendar sync table
CREATE TABLE IF NOT EXISTS calendar_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL DEFAULT 'google',
  external_event_id VARCHAR(255) NOT NULL,
  sync_status VARCHAR(50) DEFAULT 'synced', -- 'synced', 'pending', 'failed'
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(booking_id, user_id, provider)
);

-- Zoom meeting links table
CREATE TABLE IF NOT EXISTS zoom_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  zoom_meeting_id VARCHAR(255) NOT NULL,
  join_url TEXT NOT NULL,
  start_url TEXT,
  password VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(booking_id)
);

-- Google Classroom sync table
CREATE TABLE IF NOT EXISTS classroom_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  student_user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
  course_id VARCHAR(255) NOT NULL,
  course_name VARCHAR(255),
  sync_enabled BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, course_id)
);

-- Desmos saved states table
CREATE TABLE IF NOT EXISTS desmos_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
  student_user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
  tutor_user_id UUID REFERENCES users_profile(id) ON DELETE SET NULL,
  name VARCHAR(255),
  state_json JSONB NOT NULL, -- Desmos calculator state
  screenshot_url TEXT, -- Optional screenshot
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_integrations_user ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_provider ON user_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_booking ON calendar_sync(booking_id);
CREATE INDEX IF NOT EXISTS idx_zoom_meetings_booking ON zoom_meetings(booking_id);
CREATE INDEX IF NOT EXISTS idx_desmos_states_session ON desmos_states(session_id);
CREATE INDEX IF NOT EXISTS idx_desmos_states_student ON desmos_states(student_user_id);

-- RLS Policies
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoom_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE desmos_states ENABLE ROW LEVEL SECURITY;

-- Users can only see their own integrations
CREATE POLICY user_integrations_select ON user_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_integrations_insert ON user_integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_integrations_update ON user_integrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY user_integrations_delete ON user_integrations
  FOR DELETE USING (auth.uid() = user_id);

-- Calendar sync accessible by booking participants
CREATE POLICY calendar_sync_select ON calendar_sync
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
      AND (b.student_user_id = auth.uid() OR b.tutor_user_id = auth.uid() OR b.parent_user_id = auth.uid())
    )
  );

-- Zoom meetings accessible by booking participants
CREATE POLICY zoom_meetings_select ON zoom_meetings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
      AND (b.student_user_id = auth.uid() OR b.tutor_user_id = auth.uid() OR b.parent_user_id = auth.uid())
    )
  );

-- Desmos states accessible by session participants and admins
CREATE POLICY desmos_states_select ON desmos_states
  FOR SELECT USING (
    student_user_id = auth.uid() OR
    tutor_user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY desmos_states_insert ON desmos_states
  FOR INSERT WITH CHECK (
    tutor_user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin')
  );

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_integrations_updated_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW EXECUTE FUNCTION update_integrations_updated_at();

CREATE TRIGGER desmos_states_updated_at
  BEFORE UPDATE ON desmos_states
  FOR EACH ROW EXECUTE FUNCTION update_integrations_updated_at();

-- Comments
COMMENT ON TABLE user_integrations IS 'OAuth tokens and settings for external service integrations';
COMMENT ON TABLE calendar_sync IS 'Tracks Google Calendar event IDs synced with bookings';
COMMENT ON TABLE zoom_meetings IS 'Zoom meeting links associated with bookings';
COMMENT ON TABLE classroom_sync IS 'Google Classroom courses linked to students';
COMMENT ON TABLE desmos_states IS 'Saved Desmos calculator states from tutoring sessions';
