-- ============================================================================
-- MATHPIVOT TUTOROS - INITIAL DATABASE SCHEMA
-- Migration 00001: Core tables, RLS policies, and functions
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ============================================================================
-- CUSTOM TYPES (ENUMS)
-- ============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'tutor', 'parent', 'student');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'canceled', 'no_show');
CREATE TYPE session_status AS ENUM ('scheduled', 'in_progress', 'completed', 'canceled');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'no_show');
CREATE TYPE mastery_level AS ENUM ('not_started', 'developing', 'proficient', 'mastered');
CREATE TYPE skill_exposure AS ENUM ('introduced', 'practiced', 'assessed');
CREATE TYPE homework_status AS ENUM ('assigned', 'submitted', 'reviewed');
CREATE TYPE product_type AS ENUM ('package', 'subscription');
CREATE TYPE purchase_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE credit_transaction_type AS ENUM ('purchase', 'session_debit', 'refund', 'adjustment', 'expiry');
CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push', 'in_app');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'canceled');
CREATE TYPE modality AS ENUM ('online', 'in_person');
CREATE TYPE course_track AS ENUM ('math_1', 'math_2', 'math_3', 'pre_calc', 'ap_calc_ab', 'ap_calc_bc', 'ap_stats');
CREATE TYPE waitlist_status AS ENUM ('waiting', 'notified', 'booked', 'expired');
CREATE TYPE family_member_role AS ENUM ('parent', 'student');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users Profile (extends auth.users)
CREATE TABLE users_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'parent',
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    timezone TEXT NOT NULL DEFAULT 'America/New_York',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Families
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    primary_parent_user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Family Members (junction table)
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    member_role family_member_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(family_id, user_id)
);

-- Students Profile
CREATE TABLE students_profile (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    grade INTEGER NOT NULL CHECK (grade >= 1 AND grade <= 12),
    course_track course_track NOT NULL,
    goals TEXT,
    notes TEXT,
    baseline_diagnostic_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tutors Profile
CREATE TABLE tutors_profile (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    bio TEXT,
    specialties TEXT[] DEFAULT '{}',
    timezone TEXT NOT NULL DEFAULT 'America/New_York',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    hourly_rate INTEGER, -- in cents
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SCHEDULING TABLES
-- ============================================================================

-- Tutor Availability Rules (recurring)
CREATE TABLE availability_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_user_id UUID NOT NULL REFERENCES tutors_profile(user_id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (start_time < end_time)
);

-- Tutor Availability Exceptions (one-off)
CREATE TABLE availability_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_user_id UUID NOT NULL REFERENCES tutors_profile(user_id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    is_available BOOLEAN NOT NULL,
    start_time TIME,
    end_time TIME,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tutor_user_id, exception_date),
    CHECK (
        (is_available = false) OR
        (is_available = true AND start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
    )
);

-- Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id),
    student_user_id UUID NOT NULL REFERENCES auth.users(id),
    parent_user_id UUID NOT NULL REFERENCES auth.users(id),
    tutor_user_id UUID NOT NULL REFERENCES tutors_profile(user_id),
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    modality modality NOT NULL DEFAULT 'online',
    status booking_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    canceled_at TIMESTAMPTZ,
    canceled_by UUID REFERENCES auth.users(id),
    cancel_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (start_at < end_at)
);

-- Prevent overlapping bookings for the same tutor
-- Using EXCLUDE constraint with tstzrange for atomicity
CREATE INDEX idx_bookings_tutor_time ON bookings (tutor_user_id, start_at, end_at) WHERE status NOT IN ('canceled');
ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings
    EXCLUDE USING gist (
        tutor_user_id WITH =,
        tstzrange(start_at, end_at) WITH &&
    )
    WHERE (status NOT IN ('canceled'));

-- Waitlist
CREATE TABLE waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id),
    student_user_id UUID NOT NULL REFERENCES auth.users(id),
    parent_user_id UUID NOT NULL REFERENCES auth.users(id),
    tutor_user_id UUID REFERENCES tutors_profile(user_id),
    preferred_date DATE NOT NULL,
    preferred_start_time TIME NOT NULL,
    preferred_end_time TIME NOT NULL,
    modality modality NOT NULL DEFAULT 'online',
    status waitlist_status NOT NULL DEFAULT 'waiting',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SESSION TABLES
-- ============================================================================

-- Sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    status session_status NOT NULL DEFAULT 'scheduled',
    attendance_status attendance_status,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    internal_notes TEXT,
    parent_summary TEXT,
    next_steps TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Session Attachments
CREATE TABLE session_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SKILLS & MASTERY TABLES
-- ============================================================================

-- Skills Library
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_track course_track NOT NULL,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skills Tagged in Session
CREATE TABLE session_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    exposure_level skill_exposure NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, skill_id)
);

-- Student Skill Mastery
CREATE TABLE student_skill_mastery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    mastery_level mastery_level NOT NULL DEFAULT 'not_started',
    last_practiced_at TIMESTAMPTZ,
    updated_by_user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_user_id, skill_id)
);

-- Diagnostics
CREATE TABLE diagnostics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    administered_by_user_id UUID NOT NULL REFERENCES auth.users(id),
    administered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    course_track course_track NOT NULL,
    score INTEGER,
    max_score INTEGER,
    results_json JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- HOMEWORK TABLES
-- ============================================================================

-- Homework Items
CREATE TABLE homework_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    status homework_status NOT NULL DEFAULT 'assigned',
    submission_text TEXT,
    submission_file_path TEXT,
    submitted_at TIMESTAMPTZ,
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PAYMENT & CREDITS TABLES
-- ============================================================================

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    product_type product_type NOT NULL,
    credits INTEGER NOT NULL CHECK (credits > 0),
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    stripe_product_id TEXT,
    stripe_price_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Purchases
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id),
    parent_user_id UUID NOT NULL REFERENCES auth.users(id),
    product_id UUID NOT NULL REFERENCES products(id),
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status purchase_status NOT NULL DEFAULT 'pending',
    stripe_payment_intent_id TEXT,
    stripe_checkout_session_id TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Credit Ledger
CREATE TABLE credit_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id),
    transaction_type credit_transaction_type NOT NULL,
    amount INTEGER NOT NULL, -- positive for credit, negative for debit
    balance_after INTEGER NOT NULL,
    reference_type TEXT, -- 'purchase', 'session', etc.
    reference_id UUID,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS TABLES
-- ============================================================================

-- Notification Preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel notification_channel NOT NULL,
    notification_type TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, channel, notification_type)
);

-- Notifications Queue
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    channel notification_channel NOT NULL,
    template_key TEXT NOT NULL,
    payload_json JSONB NOT NULL DEFAULT '{}',
    status notification_status NOT NULL DEFAULT 'pending',
    scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- EVENT & AUDIT TABLES
-- ============================================================================

-- Events (append-only event store)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    actor_user_id UUID REFERENCES auth.users(id),
    subject_type TEXT NOT NULL,
    subject_id UUID NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stripe Webhook Events (for idempotency)
CREATE TABLE stripe_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    payload_json JSONB NOT NULL,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weekly Reports
CREATE TABLE weekly_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_user_id UUID NOT NULL REFERENCES auth.users(id),
    family_id UUID NOT NULL REFERENCES families(id),
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    sessions_count INTEGER NOT NULL DEFAULT 0,
    attendance_rate DECIMAL(5,4),
    skills_practiced TEXT[] DEFAULT '{}',
    mastery_changes JSONB DEFAULT '[]',
    summary_text TEXT,
    recommendations TEXT,
    is_at_risk BOOLEAN NOT NULL DEFAULT FALSE,
    at_risk_reasons TEXT[] DEFAULT '{}',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_user_id, week_start)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_users_profile_role ON users_profile(role);
CREATE INDEX idx_users_profile_email ON users_profile(email);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_students_profile_family_id ON students_profile(family_id);
CREATE INDEX idx_bookings_family_id ON bookings(family_id);
CREATE INDEX idx_bookings_student_user_id ON bookings(student_user_id);
CREATE INDEX idx_bookings_tutor_user_id ON bookings(tutor_user_id);
CREATE INDEX idx_bookings_start_at ON bookings(start_at);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_sessions_booking_id ON sessions(booking_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_session_skills_session_id ON session_skills(session_id);
CREATE INDEX idx_session_skills_skill_id ON session_skills(skill_id);
CREATE INDEX idx_student_skill_mastery_student_id ON student_skill_mastery(student_user_id);
CREATE INDEX idx_skills_course_track ON skills(course_track);
CREATE INDEX idx_credit_ledger_family_id ON credit_ledger(family_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_subject ON events(subject_type, subject_id);
CREATE INDEX idx_events_occurred_at ON events(occurred_at);
CREATE INDEX idx_weekly_reports_student_id ON weekly_reports(student_user_id);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_profile_updated_at BEFORE UPDATE ON users_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_profile_updated_at BEFORE UPDATE ON students_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutors_profile_updated_at BEFORE UPDATE ON tutors_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_availability_rules_updated_at BEFORE UPDATE ON availability_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON waitlist FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_skill_mastery_updated_at BEFORE UPDATE ON student_skill_mastery FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_homework_items_updated_at BEFORE UPDATE ON homework_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AUTO-CREATE USER PROFILE ON AUTH.USERS INSERT
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users_profile (id, role, full_name, email, timezone)
    VALUES (
        NEW.id,
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'parent'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        'America/New_York'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
