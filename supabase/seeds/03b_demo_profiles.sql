-- ============================================================================
-- PART 2: USER PROFILES, TUTORS, FAMILY, STUDENTS
-- ============================================================================

-- Admin User
INSERT INTO users_profile (id, role, full_name, email, timezone)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'Admin User',
    'admin@mathpivot.dev',
    'America/New_York'
) ON CONFLICT (id) DO NOTHING;

-- Tutor 1
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
    'Experienced math tutor with 10+ years helping students succeed.',
    ARRAY['Algebra', 'Pre-Calculus', 'AP Calculus AB'],
    'America/New_York',
    true,
    4900
) ON CONFLICT (user_id) DO NOTHING;

-- Tutor 2
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
    'MIT graduate passionate about making math accessible.',
    ARRAY['Math 1', 'Math 3', 'AP Statistics'],
    'America/Los_Angeles',
    true,
    5500
) ON CONFLICT (user_id) DO NOTHING;

-- Parent
INSERT INTO users_profile (id, role, full_name, email, phone, timezone)
VALUES (
    '00000000-0000-0000-0000-000000000020',
    'parent',
    'Jennifer Smith',
    'parent1@mathpivot.dev',
    '+1-555-123-4567',
    'America/New_York'
) ON CONFLICT (id) DO NOTHING;

-- Student 1
INSERT INTO users_profile (id, role, full_name, email, timezone)
VALUES (
    '00000000-0000-0000-0000-000000000030',
    'student',
    'Emma Smith',
    'student1@mathpivot.dev',
    'America/New_York'
) ON CONFLICT (id) DO NOTHING;

-- Student 2
INSERT INTO users_profile (id, role, full_name, email, timezone)
VALUES (
    '00000000-0000-0000-0000-000000000031',
    'student',
    'Jake Smith',
    'student2@mathpivot.dev',
    'America/New_York'
) ON CONFLICT (id) DO NOTHING;

-- Family
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
    'Build strong algebra foundation',
    'Visual learner'
) ON CONFLICT (user_id) DO NOTHING;

INSERT INTO students_profile (user_id, family_id, grade, course_track, goals, notes)
VALUES (
    '00000000-0000-0000-0000-000000000031',
    '00000000-0000-0000-0000-000000000100',
    11,
    'math_3',
    'Prepare for SAT Math section',
    'Strong problem solver'
) ON CONFLICT (user_id) DO NOTHING;
