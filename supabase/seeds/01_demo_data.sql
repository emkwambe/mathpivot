-- ============================================================================
-- MATHPIVOT TUTOROS - DEMO DATA
--
-- IMPORTANT: This file creates demo data for EXISTING authenticated users.
-- You must FIRST create users through Supabase Auth (dashboard or signup flow)
-- then run this file to populate their profiles and sample data.
--
-- Run order: After 00_reference_data.sql
-- ============================================================================

-- =============================================================================
-- HELPER: Function to get user ID by email
-- =============================================================================
CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email TEXT)
RETURNS UUID AS $$
DECLARE
  found_id UUID;
BEGIN
  SELECT id INTO found_id FROM auth.users WHERE email = user_email;
  RETURN found_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- DEMO TUTOR PROFILE
-- Create a tutor account first at: https://your-project.supabase.co
-- Email: demo.tutor@mathpivot.com
-- =============================================================================

-- Update tutor profile with guide level (run after user signs up)
DO $$
DECLARE
  tutor_id UUID;
BEGIN
  -- Get tutor by email (must exist in auth.users first)
  SELECT id INTO tutor_id FROM auth.users WHERE email = 'demo.tutor@mathpivot.com';

  IF tutor_id IS NOT NULL THEN
    -- Update their tutor profile
    UPDATE tutors_profile SET
      bio = 'Experienced math educator with 5+ years helping students excel. Specializing in algebra, geometry, and competition math preparation.',
      specialties = ARRAY['Algebra', 'Geometry', 'Competition Math', 'SAT/ACT Prep'],
      is_active = true,
      hourly_rate = 65.00,
      guide_level = 'Guide II',
      guide_level_code = 'GUIDE_II',
      career_pathway_specializations = ARRAY[
        (SELECT id::TEXT FROM career_pathways WHERE code = 'competition_math' LIMIT 1),
        (SELECT id::TEXT FROM career_pathways WHERE code = 'data_science' LIMIT 1)
      ],
      eligible_grades = ARRAY[6,7,8,9,10,11,12],
      max_concurrent_students = 12,
      guide_certified_at = NOW()
    WHERE user_id = tutor_id;

    -- Add availability rules (weekdays 3pm-8pm, Saturday 9am-3pm)
    INSERT INTO availability_rules (tutor_user_id, day_of_week, start_time, end_time, is_active) VALUES
      (tutor_id, 1, '15:00', '20:00', true), -- Monday
      (tutor_id, 2, '15:00', '20:00', true), -- Tuesday
      (tutor_id, 3, '15:00', '20:00', true), -- Wednesday
      (tutor_id, 4, '15:00', '20:00', true), -- Thursday
      (tutor_id, 5, '15:00', '20:00', true), -- Friday
      (tutor_id, 6, '09:00', '15:00', true)  -- Saturday
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Tutor profile updated for: demo.tutor@mathpivot.com';
  ELSE
    RAISE NOTICE 'Tutor not found. Please create account first: demo.tutor@mathpivot.com';
  END IF;
END $$;

-- =============================================================================
-- DEMO PARENT & FAMILY PROFILE
-- Create a parent account first
-- Email: demo.parent@mathpivot.com
-- =============================================================================

DO $$
DECLARE
  parent_id UUID;
  family_id UUID;
BEGIN
  SELECT id INTO parent_id FROM auth.users WHERE email = 'demo.parent@mathpivot.com';

  IF parent_id IS NOT NULL THEN
    -- Create family
    INSERT INTO families (id, name, primary_parent_user_id)
    VALUES (gen_random_uuid(), 'Demo Family', parent_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO family_id;

    -- If family already exists, get its ID
    IF family_id IS NULL THEN
      SELECT f.id INTO family_id FROM families f WHERE f.primary_parent_user_id = parent_id;
    END IF;

    -- Add parent to family
    INSERT INTO family_members (family_id, user_id, member_role)
    VALUES (family_id, parent_id, 'parent')
    ON CONFLICT DO NOTHING;

    -- Add credits to family
    INSERT INTO credit_ledger (family_id, transaction_type, amount, balance_after, description)
    VALUES (family_id, 'purchase', 8, 8, 'Demo: Standard Pack purchased')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Parent profile and family created for: demo.parent@mathpivot.com';
  ELSE
    RAISE NOTICE 'Parent not found. Please create account first: demo.parent@mathpivot.com';
  END IF;
END $$;

-- =============================================================================
-- DEMO STUDENT PROFILE
-- Create a student account first
-- Email: demo.student@mathpivot.com
-- =============================================================================

DO $$
DECLARE
  student_id UUID;
  family_id UUID;
  parent_id UUID;
BEGIN
  SELECT id INTO student_id FROM auth.users WHERE email = 'demo.student@mathpivot.com';
  SELECT id INTO parent_id FROM auth.users WHERE email = 'demo.parent@mathpivot.com';

  IF student_id IS NOT NULL AND parent_id IS NOT NULL THEN
    -- Get family ID
    SELECT f.id INTO family_id FROM families f WHERE f.primary_parent_user_id = parent_id;

    IF family_id IS NOT NULL THEN
      -- Add student to family
      INSERT INTO family_members (family_id, user_id, member_role)
      VALUES (family_id, student_id, 'student')
      ON CONFLICT DO NOTHING;

      -- Update student profile
      UPDATE student_profiles SET
        family_id = family_id,
        grade = 10,
        course_track = 'math_3',
        goals = 'Improve algebra skills and prepare for AMC 10 competition',
        notes = 'Strong in geometry, needs work on algebraic manipulation'
      WHERE user_id = student_id;

      -- Create eligibility profile (Score: 21 = Tier 2 Developer)
      INSERT INTO student_eligibility_profiles (
        student_id, assessment_date,
        academic_performance, math_passion, achievement_level,
        career_direction, personal_qualities,
        notes, assessed_by
      ) VALUES (
        student_id, CURRENT_DATE,
        4, -- Academic: A student
        5, -- Passion: Very enthusiastic about math
        4, -- Achievement: Good competition history
        4, -- Direction: Clear interest in STEM
        4, -- Qualities: Hardworking, curious
        'Demo student with strong potential. Recommended for Developer tier programs with Guide II.',
        (SELECT id FROM auth.users WHERE email = 'demo.tutor@mathpivot.com')
      )
      ON CONFLICT DO NOTHING;

      -- Create pathway recommendation
      INSERT INTO student_pathway_recommendations (
        student_id, pathway_id,
        recommended_guide_level, confidence_score,
        reason_codes, suggested_programs,
        estimated_completion_months
      ) VALUES (
        student_id,
        (SELECT id FROM career_pathways WHERE code = 'competition_math'),
        'GUIDE_II',
        0.85,
        ARRAY['strong_problem_solving', 'competition_interest', 'academic_excellence'],
        NULL,
        12
      )
      ON CONFLICT DO NOTHING;

      RAISE NOTICE 'Student profile created for: demo.student@mathpivot.com';
    END IF;
  ELSE
    RAISE NOTICE 'Student or parent not found. Please create accounts first.';
  END IF;
END $$;

-- =============================================================================
-- DEMO BOOKING & SESSION
-- Creates a sample upcoming session
-- =============================================================================

DO $$
DECLARE
  student_id UUID;
  parent_id UUID;
  tutor_id UUID;
  family_id UUID;
  booking_id UUID;
  session_id UUID;
  session_start TIMESTAMPTZ;
BEGIN
  SELECT id INTO student_id FROM auth.users WHERE email = 'demo.student@mathpivot.com';
  SELECT id INTO parent_id FROM auth.users WHERE email = 'demo.parent@mathpivot.com';
  SELECT id INTO tutor_id FROM auth.users WHERE email = 'demo.tutor@mathpivot.com';

  IF student_id IS NOT NULL AND parent_id IS NOT NULL AND tutor_id IS NOT NULL THEN
    SELECT f.id INTO family_id FROM families f WHERE f.primary_parent_user_id = parent_id;

    -- Set session to next Tuesday at 4pm
    session_start := (date_trunc('week', CURRENT_DATE) + INTERVAL '8 days' + INTERVAL '16 hours');

    -- Create booking
    INSERT INTO bookings (
      id, family_id, student_user_id, parent_user_id, tutor_user_id,
      start_at, end_at, modality, status, notes
    ) VALUES (
      gen_random_uuid(), family_id, student_id, parent_id, tutor_id,
      session_start, session_start + INTERVAL '1 hour',
      'online', 'confirmed',
      'Focus on quadratic equations and AMC 10 problem strategies'
    )
    RETURNING id INTO booking_id;

    -- Create session
    INSERT INTO sessions (id, booking_id, status)
    VALUES (gen_random_uuid(), booking_id, 'scheduled')
    RETURNING id INTO session_id;

    -- Debit a credit
    UPDATE credit_ledger SET balance_after = balance_after - 1
    WHERE family_id = family_id AND id = (
      SELECT id FROM credit_ledger WHERE family_id = family_id ORDER BY created_at DESC LIMIT 1
    );

    INSERT INTO credit_ledger (family_id, transaction_type, amount, balance_after, reference_type, reference_id, description)
    VALUES (family_id, 'session_debit', -1, 7, 'booking', booking_id, 'Session booked: Quadratic equations');

    RAISE NOTICE 'Demo booking created for next Tuesday at 4pm';
  ELSE
    RAISE NOTICE 'Could not create demo booking - missing users';
  END IF;
END $$;

-- =============================================================================
-- DEMO PAST SESSION (with notes)
-- Creates a completed session for history
-- =============================================================================

DO $$
DECLARE
  student_id UUID;
  parent_id UUID;
  tutor_id UUID;
  family_id UUID;
  booking_id UUID;
  session_id UUID;
  past_session_time TIMESTAMPTZ;
  algebra_skill_id UUID;
BEGIN
  SELECT id INTO student_id FROM auth.users WHERE email = 'demo.student@mathpivot.com';
  SELECT id INTO parent_id FROM auth.users WHERE email = 'demo.parent@mathpivot.com';
  SELECT id INTO tutor_id FROM auth.users WHERE email = 'demo.tutor@mathpivot.com';

  IF student_id IS NOT NULL AND parent_id IS NOT NULL AND tutor_id IS NOT NULL THEN
    SELECT f.id INTO family_id FROM families f WHERE f.primary_parent_user_id = parent_id;

    -- Last week Tuesday at 4pm
    past_session_time := (date_trunc('week', CURRENT_DATE) + INTERVAL '1 day' + INTERVAL '16 hours') - INTERVAL '7 days';

    -- Create past booking
    INSERT INTO bookings (
      id, family_id, student_user_id, parent_user_id, tutor_user_id,
      start_at, end_at, modality, status, notes
    ) VALUES (
      gen_random_uuid(), family_id, student_id, parent_id, tutor_id,
      past_session_time, past_session_time + INTERVAL '1 hour',
      'online', 'completed',
      'Linear equations review and systems introduction'
    )
    RETURNING id INTO booking_id;

    -- Create completed session
    INSERT INTO sessions (
      id, booking_id, status, attendance_status,
      started_at, completed_at,
      internal_notes, parent_summary, next_steps
    ) VALUES (
      gen_random_uuid(), booking_id, 'completed', 'present',
      past_session_time, past_session_time + INTERVAL '55 minutes',
      'Student showed great progress with systems of equations. Needs more practice with substitution method.',
      'Great session! We reviewed linear equations and introduced systems. Alex is making excellent progress and showed strong understanding of the graphing method.',
      'Practice problems 1-15 on page 142. Focus on substitution method. Review before next session.'
    )
    RETURNING id INTO session_id;

    -- Link a skill
    SELECT id INTO algebra_skill_id FROM skills WHERE code = 'M1-EQ-03' LIMIT 1;
    IF algebra_skill_id IS NOT NULL THEN
      INSERT INTO session_skills (session_id, skill_id, exposure_level, notes)
      VALUES (session_id, algebra_skill_id, 'practiced', 'Good progress on graphing method')
      ON CONFLICT DO NOTHING;

      -- Update student mastery
      INSERT INTO student_skill_mastery (student_user_id, skill_id, mastery_level, last_practiced_at, updated_by_user_id)
      VALUES (student_id, algebra_skill_id, 'developing', past_session_time, tutor_id)
      ON CONFLICT (student_user_id, skill_id) DO UPDATE SET
        mastery_level = 'developing',
        last_practiced_at = past_session_time;
    END IF;

    RAISE NOTICE 'Demo past session created with notes and skill tracking';
  END IF;
END $$;

-- =============================================================================
-- CLEANUP
-- =============================================================================

DROP FUNCTION IF EXISTS get_user_id_by_email(TEXT);

-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*
TO USE THIS DEMO DATA:

1. Create the following accounts via Supabase Auth dashboard or signup:
   - demo.tutor@mathpivot.com (role: tutor)
   - demo.parent@mathpivot.com (role: parent)
   - demo.student@mathpivot.com (role: student)

2. After accounts exist, run this file in SQL Editor

3. Demo data includes:
   - Tutor with Guide II level, availability, and specializations
   - Parent with family and 8 credits
   - Student with eligibility profile (Tier 2 Developer, score 21)
   - Pathway recommendation for Competition Math
   - Upcoming booking for next Tuesday 4pm
   - Completed past session with notes and skill tracking

4. Test the platform:
   - Login as student: View dashboard, AI tutor, progress
   - Login as parent: View student progress, book sessions
   - Login as tutor: View sessions, availability, students
*/
