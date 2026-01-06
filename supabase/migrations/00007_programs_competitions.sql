-- Migration: Add Programs, Camps, Competitions, and Career Tracks
-- Extends MathPivot beyond tutoring to clinics, camps, and career math readiness

-- =============================================================================
-- CAREER TRACKS - Applied math pathways
-- =============================================================================

-- Extend course_track enum with career-focused tracks
ALTER TYPE course_track ADD VALUE IF NOT EXISTS 'actuarial';
ALTER TYPE course_track ADD VALUE IF NOT EXISTS 'data_science';
ALTER TYPE course_track ADD VALUE IF NOT EXISTS 'epidemiology';
ALTER TYPE course_track ADD VALUE IF NOT EXISTS 'robotics';
ALTER TYPE course_track ADD VALUE IF NOT EXISTS 'financial_math';
ALTER TYPE course_track ADD VALUE IF NOT EXISTS 'competition_math';

-- Career pathways with prerequisites and outcomes
CREATE TABLE IF NOT EXISTS career_pathways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL, -- 'actuarial', 'data_science', etc.
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url TEXT,
  color VARCHAR(7), -- Hex color for UI
  target_grades INT[] DEFAULT ARRAY[9,10,11,12], -- Target grade levels
  prerequisite_tracks course_track[], -- Required school math tracks
  career_outcomes TEXT[], -- Example careers
  certifications TEXT[], -- Related certifications (e.g., SOA exams)
  is_active BOOLEAN DEFAULT TRUE,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PROGRAMS - Clinics, Camps, Workshops
-- =============================================================================

CREATE TYPE program_type AS ENUM (
  'clinic',        -- Single or multi-session focused training
  'workshop',      -- Short hands-on learning session
  'camp',          -- Multi-day intensive program
  'bootcamp',      -- Intensive short-term program
  'competition',   -- Math competition or olympiad
  'hackathon'      -- Project-based competition
);

CREATE TYPE program_status AS ENUM (
  'draft',
  'published',
  'registration_open',
  'registration_closed',
  'in_progress',
  'completed',
  'canceled'
);

CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  program_type program_type NOT NULL,
  career_pathway_id UUID REFERENCES career_pathways(id),

  -- Scheduling
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  schedule_details JSONB, -- Detailed schedule (times, breaks, etc.)
  timezone VARCHAR(50) DEFAULT 'America/New_York',

  -- Capacity
  min_participants INT DEFAULT 5,
  max_participants INT NOT NULL,
  current_enrollment INT DEFAULT 0,
  waitlist_enabled BOOLEAN DEFAULT TRUE,

  -- Pricing
  price_cents INT NOT NULL,
  early_bird_price_cents INT,
  early_bird_deadline DATE,
  member_discount_percent INT DEFAULT 0,

  -- Requirements
  min_grade INT,
  max_grade INT,
  prerequisite_skills UUID[], -- Required skills
  prerequisite_programs UUID[], -- Required prior programs

  -- Location
  modality VARCHAR(50) DEFAULT 'in_person', -- 'in_person', 'online', 'hybrid'
  location_name VARCHAR(255),
  location_address TEXT,
  video_platform VARCHAR(50), -- 'zoom', 'google_meet', etc.

  -- Content
  syllabus_url TEXT,
  materials_included TEXT[],
  equipment_required TEXT[], -- e.g., 'Arduino Uno kit', 'laptop'

  -- Staff
  lead_instructor_id UUID REFERENCES users_profile(id),
  assistant_instructor_ids UUID[],

  -- Media
  cover_image_url TEXT,
  gallery_urls TEXT[],

  -- Metadata
  status program_status DEFAULT 'draft',
  featured BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program sessions (individual days/sessions within a program)
CREATE TABLE IF NOT EXISTS program_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  session_number INT NOT NULL,
  title VARCHAR(255),
  description TEXT,

  -- Timing
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,

  -- Location override
  location_name VARCHAR(255),
  video_link TEXT,

  -- Content
  topics TEXT[],
  materials_url TEXT,
  homework_description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(program_id, session_number)
);

-- =============================================================================
-- REGISTRATIONS
-- =============================================================================

CREATE TYPE registration_status AS ENUM (
  'pending',
  'confirmed',
  'waitlisted',
  'canceled',
  'no_show',
  'completed'
);

CREATE TABLE IF NOT EXISTS program_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES users_profile(id),
  parent_user_id UUID REFERENCES users_profile(id),
  family_id UUID REFERENCES families(id),

  -- Status
  status registration_status DEFAULT 'pending',
  waitlist_position INT,

  -- Payment
  amount_paid_cents INT DEFAULT 0,
  payment_status VARCHAR(50) DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),

  -- Consent & Waivers
  consent_signed BOOLEAN DEFAULT FALSE,
  consent_signed_at TIMESTAMPTZ,
  consent_signed_by UUID REFERENCES users_profile(id),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  medical_notes TEXT,

  -- Equipment
  equipment_assigned JSONB, -- Kit assignments
  equipment_returned BOOLEAN DEFAULT FALSE,

  -- Attendance tracking
  sessions_attended INT DEFAULT 0,

  registered_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancel_reason TEXT,

  UNIQUE(program_id, student_user_id)
);

-- Session attendance for programs
CREATE TABLE IF NOT EXISTS program_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_session_id UUID NOT NULL REFERENCES program_sessions(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES program_registrations(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES users_profile(id),

  status VARCHAR(50) DEFAULT 'present', -- 'present', 'absent', 'late', 'excused'
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(program_session_id, student_user_id)
);

-- =============================================================================
-- COMPETITIONS
-- =============================================================================

CREATE TYPE competition_format AS ENUM (
  'individual',
  'team',
  'mixed'
);

CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,

  -- Competition details
  format competition_format DEFAULT 'individual',
  team_size_min INT,
  team_size_max INT,

  -- Rounds
  num_rounds INT DEFAULT 1,
  time_limit_minutes INT,

  -- Scoring
  max_score INT,
  scoring_rules JSONB,
  tiebreaker_rules TEXT,

  -- Prizes
  prizes JSONB, -- [{place: 1, prize: "...", value_cents: ...}]

  -- Rules
  rules_url TEXT,
  allowed_resources TEXT[],
  prohibited_items TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competition teams
CREATE TABLE IF NOT EXISTS competition_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  captain_user_id UUID REFERENCES users_profile(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members
CREATE TABLE IF NOT EXISTS competition_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES competition_teams(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES users_profile(id),
  role VARCHAR(50) DEFAULT 'member', -- 'captain', 'member'

  joined_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(team_id, student_user_id)
);

-- Competition results/scores
CREATE TABLE IF NOT EXISTS competition_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  round_number INT DEFAULT 1,

  -- Participant (either individual or team)
  student_user_id UUID REFERENCES users_profile(id),
  team_id UUID REFERENCES competition_teams(id),

  -- Scores
  score DECIMAL(10,2),
  max_possible_score DECIMAL(10,2),
  time_taken_seconds INT,

  -- Ranking
  rank INT,
  percentile DECIMAL(5,2),

  -- Details
  problem_scores JSONB, -- Individual problem scores
  feedback TEXT,

  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES users_profile(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (student_user_id IS NOT NULL OR team_id IS NOT NULL)
);

-- =============================================================================
-- EQUIPMENT & KITS (for Robotics)
-- =============================================================================

CREATE TABLE IF NOT EXISTS equipment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  manufacturer VARCHAR(255),
  model_number VARCHAR(255),
  category VARCHAR(100), -- 'microcontroller', 'sensor', 'motor', 'kit', etc.

  -- Kit contents (for bundled items)
  is_kit BOOLEAN DEFAULT FALSE,
  kit_contents JSONB, -- List of items included

  -- Pricing
  purchase_price_cents INT,
  rental_price_cents INT,
  deposit_cents INT,

  -- Media
  image_url TEXT,
  manual_url TEXT,

  -- Inventory
  total_quantity INT DEFAULT 0,
  available_quantity INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual equipment items
CREATE TABLE IF NOT EXISTS equipment_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_type_id UUID NOT NULL REFERENCES equipment_types(id),

  serial_number VARCHAR(255),
  asset_tag VARCHAR(100) UNIQUE,

  status VARCHAR(50) DEFAULT 'available', -- 'available', 'assigned', 'maintenance', 'retired'
  condition VARCHAR(50) DEFAULT 'good', -- 'new', 'good', 'fair', 'poor'
  condition_notes TEXT,

  purchase_date DATE,
  warranty_expiry DATE,
  last_maintenance_date DATE,

  current_location VARCHAR(255),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment assignments
CREATE TABLE IF NOT EXISTS equipment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment_inventory(id),

  -- Who has it
  student_user_id UUID REFERENCES users_profile(id),
  program_id UUID REFERENCES programs(id),
  registration_id UUID REFERENCES program_registrations(id),

  -- Assignment details
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  due_date DATE,
  returned_at TIMESTAMPTZ,

  -- Condition
  condition_at_checkout VARCHAR(50),
  condition_at_return VARCHAR(50),
  damage_notes TEXT,

  -- Deposit
  deposit_collected BOOLEAN DEFAULT FALSE,
  deposit_returned BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- CAREER-SPECIFIC SKILLS
-- =============================================================================

-- Insert career pathway skills (extends existing skills table)
-- These will be inserted via seed data

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_programs_type ON programs(program_type);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_dates ON programs(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_programs_career ON programs(career_pathway_id);
CREATE INDEX IF NOT EXISTS idx_program_sessions_program ON program_sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_program_sessions_time ON program_sessions(start_at);
CREATE INDEX IF NOT EXISTS idx_registrations_program ON program_registrations(program_id);
CREATE INDEX IF NOT EXISTS idx_registrations_student ON program_registrations(student_user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON program_registrations(status);
CREATE INDEX IF NOT EXISTS idx_competition_results_competition ON competition_results(competition_id);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment_inventory(equipment_type_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment_inventory(status);
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_student ON equipment_assignments(student_user_id);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE career_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_assignments ENABLE ROW LEVEL SECURITY;

-- Public read for published programs
CREATE POLICY programs_select ON programs
  FOR SELECT USING (status != 'draft' OR EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'tutor')
  ));

-- Admin/tutor can manage programs
CREATE POLICY programs_manage ON programs
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'tutor')
  ));

-- Registration policies
CREATE POLICY registrations_select ON program_registrations
  FOR SELECT USING (
    student_user_id = auth.uid() OR
    parent_user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'tutor'))
  );

CREATE POLICY registrations_insert ON program_registrations
  FOR INSERT WITH CHECK (
    parent_user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin')
  );

-- Equipment visible to all, manageable by admin
CREATE POLICY equipment_types_select ON equipment_types FOR SELECT USING (TRUE);
CREATE POLICY equipment_inventory_select ON equipment_inventory FOR SELECT USING (TRUE);

CREATE POLICY equipment_manage ON equipment_inventory
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
  ));

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE career_pathways IS 'Career-focused math tracks (actuarial, data science, etc.)';
COMMENT ON TABLE programs IS 'Clinics, camps, workshops, and competitions';
COMMENT ON TABLE program_sessions IS 'Individual sessions within a multi-day program';
COMMENT ON TABLE program_registrations IS 'Student registrations for programs';
COMMENT ON TABLE competitions IS 'Competition-specific details';
COMMENT ON TABLE competition_results IS 'Scores and rankings for competition participants';
COMMENT ON TABLE equipment_types IS 'Types of equipment (Arduino kits, sensors, etc.)';
COMMENT ON TABLE equipment_inventory IS 'Individual equipment items with tracking';
COMMENT ON TABLE equipment_assignments IS 'Equipment loans to students/programs';
