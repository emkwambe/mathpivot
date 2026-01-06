-- Migration: Add video link support to bookings
-- This allows storing video conference links (Zoom, Google Meet, etc.)

-- Add video_link column to bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS video_link TEXT;

-- Add index for quick lookup of online sessions
CREATE INDEX IF NOT EXISTS idx_bookings_modality ON bookings(modality) WHERE modality = 'online';

-- Add a column to track if calendar invite was sent
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS calendar_invite_sent BOOLEAN DEFAULT FALSE;

-- Comment for documentation
COMMENT ON COLUMN bookings.video_link IS 'Video conference link for online sessions (Zoom, Google Meet, etc.)';
COMMENT ON COLUMN bookings.calendar_invite_sent IS 'Whether a calendar invite has been sent to participants';
