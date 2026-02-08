-- ============================================================================
-- SEED TEST SESSION FOR WHITEBOARD TESTING
-- Uses existing demo users
-- Run this in Supabase SQL Editor
-- ============================================================================

DO $$
DECLARE
    v_tutor_id UUID;
    v_parent_id UUID;
    v_student_id UUID;
    v_family_id UUID;
    v_booking_id UUID := gen_random_uuid();
    v_session_id UUID := gen_random_uuid();
BEGIN
    -- Get existing user IDs
    SELECT id INTO v_tutor_id FROM users_profile WHERE email = 'tutor1@mathpivot.dev';
    SELECT id INTO v_parent_id FROM users_profile WHERE email = 'parent1@mathpivot.dev';
    SELECT id INTO v_student_id FROM users_profile WHERE email = 'student1@mathpivot.dev';

    IF v_tutor_id IS NULL OR v_parent_id IS NULL OR v_student_id IS NULL THEN
        RAISE EXCEPTION 'Could not find required users. Make sure demo users exist.';
    END IF;

    -- Get family ID for the student
    SELECT family_id INTO v_family_id FROM students_profile WHERE user_id = v_student_id;

    IF v_family_id IS NULL THEN
        -- Create family if doesn't exist
        v_family_id := gen_random_uuid();
        INSERT INTO families (id, name, primary_parent_user_id)
        VALUES (v_family_id, 'Demo Family', v_parent_id);

        INSERT INTO family_members (family_id, user_id, member_role)
        VALUES
            (v_family_id, v_parent_id, 'parent'),
            (v_family_id, v_student_id, 'student');

        INSERT INTO students_profile (user_id, family_id, grade, course_track)
        VALUES (v_student_id, v_family_id, 10, 'math_2');
    END IF;

    -- Ensure tutor profile exists
    INSERT INTO tutors_profile (user_id, bio, specialties, is_active)
    VALUES (v_tutor_id, 'Demo tutor', ARRAY['Algebra'], TRUE)
    ON CONFLICT (user_id) DO NOTHING;

    -- Create booking
    INSERT INTO bookings (id, family_id, student_user_id, parent_user_id, tutor_user_id, start_at, end_at, modality, status)
    VALUES (
        v_booking_id,
        v_family_id,
        v_student_id,
        v_parent_id,
        v_tutor_id,
        NOW(),
        NOW() + INTERVAL '1 hour',
        'online',
        'confirmed'
    );

    -- Create session
    INSERT INTO sessions (id, booking_id, status, started_at)
    VALUES (v_session_id, v_booking_id, 'in_progress', NOW());

    -- Output results
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST SESSION CREATED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Session ID: %', v_session_id;
    RAISE NOTICE '';
    RAISE NOTICE 'URL: http://localhost:3000/tutor/sessions/%', v_session_id;
    RAISE NOTICE '';
    RAISE NOTICE 'Login: tutor1@mathpivot.dev / Demo123!';
    RAISE NOTICE '========================================';
END $$;

-- Show the created session
SELECT
    s.id AS session_id,
    'http://localhost:3000/tutor/sessions/' || s.id AS url,
    s.status,
    b.start_at
FROM sessions s
JOIN bookings b ON b.id = s.booking_id
JOIN users_profile t ON t.id = b.tutor_user_id
WHERE t.email = 'tutor1@mathpivot.dev'
ORDER BY s.created_at DESC
LIMIT 1;
