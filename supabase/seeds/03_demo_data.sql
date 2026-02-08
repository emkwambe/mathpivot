-- ============================================================================
-- MATHPIVOT TUTOROS - SEED DATA: DEMO DATA
-- Seed file 03: Demo users, families, and sample data for local development
-- NOTE: This should only be run in development environments!
-- ============================================================================

-- IMPORTANT: In production, users are created via Supabase Auth.
-- This script creates both auth.users and users_profile records for demo purposes.

-- ============================================================================
-- CREATE AUTH USERS FIRST (required for foreign key constraint)
-- Default password for all demo users: Demo123!
-- ============================================================================

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES
-- Admin
(
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@mathpivot.dev',
  crypt('Demo123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Admin User"}',
  'authenticated',
  'authenticated'
),
-- Tutor 1
(
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000000',
  'tutor1@mathpivot.dev',
  crypt('Demo123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Sarah Johnson"}',
  'authenticated',
  'authenticated'
),
-- Tutor 2
(
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000000',
  'tutor2@mathpivot.dev',
  crypt('Demo123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Michael Chen"}',
  'authenticated',
  'authenticated'
),
-- Parent 1
(
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000000',
  'parent1@mathpivot.dev',
  crypt('Demo123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Jennifer Smith"}',
  'authenticated',
  'authenticated'
),
-- Student 1
(
  '00000000-0000-0000-0000-000000000030',
  '00000000-0000-0000-0000-000000000000',
  'student1@mathpivot.dev',
  crypt('Demo123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Emma Smith"}',
  'authenticated',
  'authenticated'
),
-- Student 2
(
  '00000000-0000-0000-0000-000000000031',
  '00000000-0000-0000-0000-000000000000',
  'student2@mathpivot.dev',
  crypt('Demo123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Jake Smith"}',
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Also create identities for email login
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  created_at,
  updated_at
) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '{"sub": "00000000-0000-0000-0000-000000000001", "email": "admin@mathpivot.dev"}', 'email', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000010', '{"sub": "00000000-0000-0000-0000-000000000010", "email": "tutor1@mathpivot.dev"}', 'email', '00000000-0000-0000-0000-000000000010', NOW(), NOW()),
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', '{"sub": "00000000-0000-0000-0000-000000000011", "email": "tutor2@mathpivot.dev"}', 'email', '00000000-0000-0000-0000-000000000011', NOW(), NOW()),
('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000020', '{"sub": "00000000-0000-0000-0000-000000000020", "email": "parent1@mathpivot.dev"}', 'email', '00000000-0000-0000-0000-000000000020', NOW(), NOW()),
('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000030', '{"sub": "00000000-0000-0000-0000-000000000030", "email": "student1@mathpivot.dev"}', 'email', '00000000-0000-0000-0000-000000000030', NOW(), NOW()),
('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000031', '{"sub": "00000000-0000-0000-0000-000000000031", "email": "student2@mathpivot.dev"}', 'email', '00000000-0000-0000-0000-000000000031', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- NOW CREATE USER PROFILES
-- ============================================================================

-- Demo Admin User
-- Email: admin@mathpivot.dev | Password: Demo123!
INSERT INTO users_profile (id, role, full_name, email, timezone)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'Admin User',
    'admin@mathpivot.dev',
    'America/New_York'
) ON CONFLICT (id) DO NOTHING;

-- Demo Tutor Users
-- Email: tutor1@mathpivot.dev | Password: Demo123!
INSERT INTO users_profile (id, role, full_name, email, timezone)
VALUES (
    '00000000-0000-0000-0000-000000000010',
    'tutor',
    'Sarah Johnson',
    'tutor1@mathpivot.dev',
    'America/New_York'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO tutors_profile (user_id, bio, specialties, timezone, is_active, hourly_rate)
VALUES (
    '00000000-0000-0000-0000-000000000010',
    'Experienced math tutor with 10+ years helping students succeed. Specializes in algebra and calculus. Patient, encouraging teaching style.',
    ARRAY['Algebra', 'Pre-Calculus', 'AP Calculus AB'],
    'America/New_York',
    true,
    4900 -- $49/hour
) ON CONFLICT (user_id) DO NOTHING;

-- Email: tutor2@mathpivot.dev | Password: Demo123!
INSERT INTO users_profile (id, role, full_name, email, timezone)
VALUES (
    '00000000-0000-0000-0000-000000000011',
    'tutor',
    'Michael Chen',
    'tutor2@mathpivot.dev',
    'America/Los_Angeles'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO tutors_profile (user_id, bio, specialties, timezone, is_active, hourly_rate)
VALUES (
    '00000000-0000-0000-0000-000000000011',
    'MIT graduate passionate about making math accessible. Strong focus on problem-solving strategies and building confidence.',
    ARRAY['Math 1', 'Math 3', 'AP Statistics'],
    'America/Los_Angeles',
    true,
    5500 -- $55/hour
) ON CONFLICT (user_id) DO NOTHING;

-- Demo Parent User
-- Email: parent1@mathpivot.dev | Password: Demo123!
INSERT INTO users_profile (id, role, full_name, email, phone, timezone)
VALUES (
    '00000000-0000-0000-0000-000000000020',
    'parent',
    'Jennifer Smith',
    'parent1@mathpivot.dev',
    '+1-555-123-4567',
    'America/New_York'
) ON CONFLICT (id) DO NOTHING;

-- Demo Student Users
-- Email: student1@mathpivot.dev | Password: Demo123!
INSERT INTO users_profile (id, role, full_name, email, timezone)
VALUES (
    '00000000-0000-0000-0000-000000000030',
    'student',
    'Emma Smith',
    'student1@mathpivot.dev',
    'America/New_York'
) ON CONFLICT (id) DO NOTHING;

-- Email: student2@mathpivot.dev | Password: Demo123!
INSERT INTO users_profile (id, role, full_name, email, timezone)
VALUES (
    '00000000-0000-0000-0000-000000000031',
    'student',
    'Jake Smith',
    'student2@mathpivot.dev',
    'America/New_York'
) ON CONFLICT (id) DO NOTHING;

-- Demo Family
INSERT INTO families (id, name, primary_parent_user_id)
VALUES (
    '00000000-0000-0000-0000-000000000100',
    'Smith Family',
    '00000000-0000-0000-0000-000000000020'
) ON CONFLICT (id) DO NOTHING;

-- Family Members
INSERT INTO family_members (family_id, user_id, member_role) VALUES
('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000020', 'parent'),
('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000030', 'student'),
('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000031', 'student')
ON CONFLICT (family_id, user_id) DO NOTHING;

-- Student Profiles
INSERT INTO students_profile (user_id, family_id, grade, course_track, goals, notes)
VALUES (
    '00000000-0000-0000-0000-000000000030',
    '00000000-0000-0000-0000-000000000100',
    9,
    'math_1',
    'Build strong algebra foundation for future AP courses',
    'Visual learner, benefits from graphs and diagrams'
) ON CONFLICT (user_id) DO NOTHING;

INSERT INTO students_profile (user_id, family_id, grade, course_track, goals, notes)
VALUES (
    '00000000-0000-0000-0000-000000000031',
    '00000000-0000-0000-0000-000000000100',
    11,
    'math_3',
    'Prepare for SAT Math section and AP Calculus next year',
    'Strong problem solver, needs help with trig identities'
) ON CONFLICT (user_id) DO NOTHING;

-- Tutor Availability Rules (for tutor1)
INSERT INTO availability_rules (tutor_user_id, day_of_week, start_time, end_time, is_active) VALUES
('00000000-0000-0000-0000-000000000010', 1, '15:00', '20:00', true), -- Monday
('00000000-0000-0000-0000-000000000010', 2, '15:00', '20:00', true), -- Tuesday
('00000000-0000-0000-0000-000000000010', 3, '15:00', '20:00', true), -- Wednesday
('00000000-0000-0000-0000-000000000010', 4, '15:00', '20:00', true), -- Thursday
('00000000-0000-0000-0000-000000000010', 5, '14:00', '18:00', true), -- Friday
('00000000-0000-0000-0000-000000000010', 6, '10:00', '14:00', true); -- Saturday

-- Tutor Availability Rules (for tutor2 - PST)
INSERT INTO availability_rules (tutor_user_id, day_of_week, start_time, end_time, is_active) VALUES
('00000000-0000-0000-0000-000000000011', 1, '16:00', '21:00', true), -- Monday
('00000000-0000-0000-0000-000000000011', 3, '16:00', '21:00', true), -- Wednesday
('00000000-0000-0000-0000-000000000011', 5, '16:00', '21:00', true), -- Friday
('00000000-0000-0000-0000-000000000011', 0, '09:00', '13:00', true); -- Sunday

-- Sample Credit Ledger Entry (initial credits from "purchase")
INSERT INTO credit_ledger (family_id, transaction_type, amount, balance_after, reference_type, description)
VALUES (
    '00000000-0000-0000-0000-000000000100',
    'purchase',
    10,
    10,
    'purchase',
    'Initial demo credits'
);

-- ============================================================================
-- DEMO BOOKINGS AND SESSIONS
-- ============================================================================

-- Past completed session (Emma with Sarah)
INSERT INTO bookings (id, family_id, student_user_id, parent_user_id, tutor_user_id, start_at, end_at, modality, status, notes)
VALUES (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000100',
    '00000000-0000-0000-0000-000000000030', -- Emma
    '00000000-0000-0000-0000-000000000020', -- Jennifer
    '00000000-0000-0000-0000-000000000010', -- Sarah
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days' + INTERVAL '1 hour',
    'online',
    'completed',
    'Algebra fundamentals review'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO sessions (id, booking_id, status, attendance_status, started_at, completed_at, internal_notes, parent_summary, next_steps)
VALUES (
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000201',
    'completed',
    'attended',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days' + INTERVAL '55 minutes',
    'Emma showed great progress on linear equations. Need to work on word problems next.',
    'Emma did excellent work today! We covered solving linear equations and she mastered the basics. Looking forward to tackling word problems next session.',
    'Practice word problems from Chapter 3, pages 45-48'
) ON CONFLICT (id) DO NOTHING;

-- Deduct credit for completed session
INSERT INTO credit_ledger (family_id, transaction_type, amount, balance_after, reference_type, reference_id, description)
VALUES (
    '00000000-0000-0000-0000-000000000100',
    'usage',
    -1,
    9,
    'booking',
    '00000000-0000-0000-0000-000000000201',
    'Session with Sarah Johnson - Algebra fundamentals'
);

-- Upcoming session tomorrow (Jake with Sarah)
INSERT INTO bookings (id, family_id, student_user_id, parent_user_id, tutor_user_id, start_at, end_at, modality, status, notes)
VALUES (
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000100',
    '00000000-0000-0000-0000-000000000031', -- Jake
    '00000000-0000-0000-0000-000000000020', -- Jennifer
    '00000000-0000-0000-0000-000000000010', -- Sarah
    NOW() + INTERVAL '1 day' + INTERVAL '16 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '17 hours',
    'online',
    'confirmed',
    'SAT Math prep - focus on trigonometry'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO sessions (id, booking_id, status)
VALUES (
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000202',
    'scheduled'
) ON CONFLICT (id) DO NOTHING;

-- In-progress session NOW (Emma with Michael) - for testing whiteboard
INSERT INTO bookings (id, family_id, student_user_id, parent_user_id, tutor_user_id, start_at, end_at, modality, status, notes)
VALUES (
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000100',
    '00000000-0000-0000-0000-000000000030', -- Emma
    '00000000-0000-0000-0000-000000000020', -- Jennifer
    '00000000-0000-0000-0000-000000000011', -- Michael
    NOW() - INTERVAL '30 minutes',
    NOW() + INTERVAL '30 minutes',
    'online',
    'confirmed',
    'Statistics introduction'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO sessions (id, booking_id, status, attendance_status, started_at)
VALUES (
    '00000000-0000-0000-0000-000000000303',
    '00000000-0000-0000-0000-000000000203',
    'in_progress',
    'attended',
    NOW() - INTERVAL '30 minutes'
) ON CONFLICT (id) DO NOTHING;

-- Verify demo data
-- SELECT 'users_profile' as table_name, COUNT(*) FROM users_profile
-- UNION ALL SELECT 'families', COUNT(*) FROM families
-- UNION ALL SELECT 'family_members', COUNT(*) FROM family_members
-- UNION ALL SELECT 'students_profile', COUNT(*) FROM students_profile
-- UNION ALL SELECT 'tutors_profile', COUNT(*) FROM tutors_profile
-- UNION ALL SELECT 'availability_rules', COUNT(*) FROM availability_rules;
