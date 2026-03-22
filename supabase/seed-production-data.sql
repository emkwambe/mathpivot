-- ============================================================================
-- MATHPIVOT TUTOROS - SYNTHETIC PRODUCTION DATA SEED
-- Run this in Supabase SQL Editor after auth service is restored
-- ============================================================================

-- NOTE: Users must be created via Supabase Auth first (Dashboard or API)
-- This script assumes you've created users with these emails:
--   admin@mathpivot.com
--   tutor.sarah@mathpivot.com
--   tutor.marcus@mathpivot.com
--   parent.johnson@example.com
--   parent.chen@example.com
--   parent.williams@example.com
--   emma.johnson@example.com (student)
--   liam.johnson@example.com (student)
--   sophia.chen@example.com (student)
--   noah.williams@example.com (student)

-- ============================================================================
-- STEP 1: Create auth users (run this via Supabase Dashboard or use service role)
-- For testing, create users manually in Dashboard > Authentication > Users
-- ============================================================================

-- After creating users, get their UUIDs and update the DO block below

DO $$
DECLARE
    -- Admin
    admin_id UUID;

    -- Tutors
    tutor_sarah_id UUID;
    tutor_marcus_id UUID;

    -- Parents
    parent_johnson_id UUID;
    parent_chen_id UUID;
    parent_williams_id UUID;

    -- Students
    student_emma_id UUID;
    student_liam_id UUID;
    student_sophia_id UUID;
    student_noah_id UUID;

    -- Families
    johnson_family_id UUID;
    chen_family_id UUID;
    williams_family_id UUID;

    -- Skills
    skill_linear_eq_id UUID;
    skill_quadratic_id UUID;
    skill_functions_id UUID;
    skill_trig_id UUID;
    skill_derivatives_id UUID;
    skill_integrals_id UUID;
    skill_limits_id UUID;
    skill_probability_id UUID;

    -- Products
    product_starter_id UUID;
    product_standard_id UUID;
    product_premium_id UUID;

    -- Bookings/Sessions
    booking_1_id UUID;
    booking_2_id UUID;
    booking_3_id UUID;
    session_1_id UUID;
    session_2_id UUID;
    session_3_id UUID;

    -- Programs
    program_summer_camp_id UUID;
    program_sat_prep_id UUID;

    -- Certifications
    cert_algebra_id UUID;
    cert_calc_id UUID;

BEGIN
    -- ========================================================================
    -- Look up existing users by email (they must exist in auth.users first)
    -- ========================================================================
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@mathpivot.com';
    SELECT id INTO tutor_sarah_id FROM auth.users WHERE email = 'tutor.sarah@mathpivot.com';
    SELECT id INTO tutor_marcus_id FROM auth.users WHERE email = 'tutor.marcus@mathpivot.com';
    SELECT id INTO parent_johnson_id FROM auth.users WHERE email = 'parent.johnson@example.com';
    SELECT id INTO parent_chen_id FROM auth.users WHERE email = 'parent.chen@example.com';
    SELECT id INTO parent_williams_id FROM auth.users WHERE email = 'parent.williams@example.com';
    SELECT id INTO student_emma_id FROM auth.users WHERE email = 'emma.johnson@example.com';
    SELECT id INTO student_liam_id FROM auth.users WHERE email = 'liam.johnson@example.com';
    SELECT id INTO student_sophia_id FROM auth.users WHERE email = 'sophia.chen@example.com';
    SELECT id INTO student_noah_id FROM auth.users WHERE email = 'noah.williams@example.com';

    -- Check if users exist
    IF admin_id IS NULL THEN
        RAISE NOTICE 'Users not found. Please create auth users first via Dashboard.';
        RAISE NOTICE 'Required emails: admin@mathpivot.com, tutor.sarah@mathpivot.com, etc.';
        RETURN;
    END IF;

    -- ========================================================================
    -- Update user profiles with proper roles
    -- ========================================================================
    UPDATE users_profile SET role = 'admin', full_name = 'Admin User' WHERE id = admin_id;
    UPDATE users_profile SET role = 'tutor', full_name = 'Sarah Mitchell', phone = '+1-555-0101' WHERE id = tutor_sarah_id;
    UPDATE users_profile SET role = 'tutor', full_name = 'Marcus Thompson', phone = '+1-555-0102' WHERE id = tutor_marcus_id;
    UPDATE users_profile SET role = 'parent', full_name = 'Jennifer Johnson', phone = '+1-555-0201' WHERE id = parent_johnson_id;
    UPDATE users_profile SET role = 'parent', full_name = 'David Chen', phone = '+1-555-0202' WHERE id = parent_chen_id;
    UPDATE users_profile SET role = 'parent', full_name = 'Michelle Williams', phone = '+1-555-0203' WHERE id = parent_williams_id;
    UPDATE users_profile SET role = 'student', full_name = 'Emma Johnson', phone = NULL WHERE id = student_emma_id;
    UPDATE users_profile SET role = 'student', full_name = 'Liam Johnson', phone = NULL WHERE id = student_liam_id;
    UPDATE users_profile SET role = 'student', full_name = 'Sophia Chen', phone = NULL WHERE id = student_sophia_id;
    UPDATE users_profile SET role = 'student', full_name = 'Noah Williams', phone = NULL WHERE id = student_noah_id;

    -- ========================================================================
    -- Create Tutor Profiles
    -- ========================================================================
    INSERT INTO tutors_profile (user_id, bio, specialties, hourly_rate, is_active)
    VALUES
        (tutor_sarah_id,
         'Experienced math educator with 8 years of tutoring experience. Specializes in making complex concepts accessible through real-world applications.',
         ARRAY['Algebra', 'Calculus', 'AP Calc AB', 'AP Calc BC', 'SAT Math'],
         7500, true),
        (tutor_marcus_id,
         'Former high school math teacher with a passion for competition math and helping students excel in standardized tests.',
         ARRAY['Pre-Calculus', 'Statistics', 'AP Stats', 'Competition Math', 'ACT Math'],
         6500, true)
    ON CONFLICT (user_id) DO UPDATE SET
        bio = EXCLUDED.bio,
        specialties = EXCLUDED.specialties,
        hourly_rate = EXCLUDED.hourly_rate;

    -- ========================================================================
    -- Create Families
    -- ========================================================================
    johnson_family_id := gen_random_uuid();
    chen_family_id := gen_random_uuid();
    williams_family_id := gen_random_uuid();

    INSERT INTO families (id, name, primary_parent_user_id)
    VALUES
        (johnson_family_id, 'Johnson Family', parent_johnson_id),
        (chen_family_id, 'Chen Family', parent_chen_id),
        (williams_family_id, 'Williams Family', parent_williams_id);

    -- ========================================================================
    -- Create Family Members
    -- ========================================================================
    INSERT INTO family_members (family_id, user_id, member_role)
    VALUES
        (johnson_family_id, parent_johnson_id, 'parent'),
        (johnson_family_id, student_emma_id, 'student'),
        (johnson_family_id, student_liam_id, 'student'),
        (chen_family_id, parent_chen_id, 'parent'),
        (chen_family_id, student_sophia_id, 'student'),
        (williams_family_id, parent_williams_id, 'parent'),
        (williams_family_id, student_noah_id, 'student');

    -- ========================================================================
    -- Create Student Profiles
    -- ========================================================================
    INSERT INTO students_profile (user_id, family_id, grade, course_track, goals)
    VALUES
        (student_emma_id, johnson_family_id, 10, 'pre_calc', 'Preparing for AP Calculus next year, aiming for 5 on AP exam'),
        (student_liam_id, johnson_family_id, 8, 'math_2', 'Building strong algebra foundations for high school'),
        (student_sophia_id, chen_family_id, 11, 'ap_calc_ab', 'Targeting 750+ on SAT Math, applying to engineering programs'),
        (student_noah_id, williams_family_id, 9, 'math_3', 'Interested in competition math, preparing for AMC 10');

    -- ========================================================================
    -- Create Skills Library
    -- ========================================================================
    skill_linear_eq_id := gen_random_uuid();
    skill_quadratic_id := gen_random_uuid();
    skill_functions_id := gen_random_uuid();
    skill_trig_id := gen_random_uuid();
    skill_derivatives_id := gen_random_uuid();
    skill_integrals_id := gen_random_uuid();
    skill_limits_id := gen_random_uuid();
    skill_probability_id := gen_random_uuid();

    INSERT INTO skills (id, course_track, code, name, description, category, order_index)
    VALUES
        (skill_linear_eq_id, 'math_2', 'ALG-LIN-01', 'Linear Equations', 'Solving single and multi-step linear equations', 'Algebra', 1),
        (skill_quadratic_id, 'math_2', 'ALG-QUAD-01', 'Quadratic Equations', 'Factoring, completing the square, and quadratic formula', 'Algebra', 2),
        (skill_functions_id, 'math_3', 'FUNC-01', 'Function Notation & Operations', 'Understanding function notation, domain, range, and operations', 'Functions', 3),
        (skill_trig_id, 'pre_calc', 'TRIG-01', 'Trigonometric Functions', 'Unit circle, trig ratios, and basic identities', 'Trigonometry', 4),
        (skill_limits_id, 'ap_calc_ab', 'CALC-LIM-01', 'Limits & Continuity', 'Evaluating limits algebraically and graphically', 'Calculus', 5),
        (skill_derivatives_id, 'ap_calc_ab', 'CALC-DER-01', 'Derivatives', 'Power rule, chain rule, and applications of derivatives', 'Calculus', 6),
        (skill_integrals_id, 'ap_calc_ab', 'CALC-INT-01', 'Integration', 'Antiderivatives and definite integrals', 'Calculus', 7),
        (skill_probability_id, 'ap_stats', 'STAT-PROB-01', 'Probability', 'Basic probability, conditional probability, and distributions', 'Statistics', 8);

    -- ========================================================================
    -- Create Student Skill Mastery
    -- ========================================================================
    INSERT INTO student_skill_mastery (student_user_id, skill_id, mastery_level, last_practiced_at, updated_by_user_id)
    VALUES
        (student_emma_id, skill_linear_eq_id, 'mastered', NOW() - INTERVAL '30 days', tutor_sarah_id),
        (student_emma_id, skill_quadratic_id, 'mastered', NOW() - INTERVAL '20 days', tutor_sarah_id),
        (student_emma_id, skill_functions_id, 'proficient', NOW() - INTERVAL '10 days', tutor_sarah_id),
        (student_emma_id, skill_trig_id, 'developing', NOW() - INTERVAL '3 days', tutor_sarah_id),
        (student_sophia_id, skill_trig_id, 'mastered', NOW() - INTERVAL '45 days', tutor_sarah_id),
        (student_sophia_id, skill_limits_id, 'proficient', NOW() - INTERVAL '14 days', tutor_sarah_id),
        (student_sophia_id, skill_derivatives_id, 'developing', NOW() - INTERVAL '7 days', tutor_sarah_id),
        (student_liam_id, skill_linear_eq_id, 'proficient', NOW() - INTERVAL '5 days', tutor_marcus_id),
        (student_noah_id, skill_linear_eq_id, 'mastered', NOW() - INTERVAL '25 days', tutor_marcus_id),
        (student_noah_id, skill_quadratic_id, 'proficient', NOW() - INTERVAL '10 days', tutor_marcus_id);

    -- ========================================================================
    -- Create Tutor Availability Rules
    -- ========================================================================
    INSERT INTO availability_rules (tutor_user_id, day_of_week, start_time, end_time, is_active)
    VALUES
        -- Sarah: Mon-Thu 3pm-8pm, Sat 10am-2pm
        (tutor_sarah_id, 1, '15:00', '20:00', true),
        (tutor_sarah_id, 2, '15:00', '20:00', true),
        (tutor_sarah_id, 3, '15:00', '20:00', true),
        (tutor_sarah_id, 4, '15:00', '20:00', true),
        (tutor_sarah_id, 6, '10:00', '14:00', true),
        -- Marcus: Tue-Fri 4pm-9pm, Sun 1pm-5pm
        (tutor_marcus_id, 2, '16:00', '21:00', true),
        (tutor_marcus_id, 3, '16:00', '21:00', true),
        (tutor_marcus_id, 4, '16:00', '21:00', true),
        (tutor_marcus_id, 5, '16:00', '21:00', true),
        (tutor_marcus_id, 0, '13:00', '17:00', true);

    -- ========================================================================
    -- Create Products
    -- ========================================================================
    product_starter_id := gen_random_uuid();
    product_standard_id := gen_random_uuid();
    product_premium_id := gen_random_uuid();

    INSERT INTO products (id, name, description, product_type, credits, price_cents, is_active)
    VALUES
        (product_starter_id, 'Starter Pack', '4 one-hour tutoring sessions', 'package', 4, 28000, true),
        (product_standard_id, 'Standard Pack', '8 one-hour tutoring sessions + progress reports', 'package', 8, 52000, true),
        (product_premium_id, 'Premium Monthly', 'Unlimited sessions, AI tutor access, priority scheduling', 'subscription', 12, 39900, true);

    -- ========================================================================
    -- Create Purchases & Credits
    -- ========================================================================
    INSERT INTO purchases (family_id, parent_user_id, product_id, amount_cents, status, paid_at)
    VALUES
        (johnson_family_id, parent_johnson_id, product_standard_id, 52000, 'completed', NOW() - INTERVAL '45 days'),
        (chen_family_id, parent_chen_id, product_premium_id, 39900, 'completed', NOW() - INTERVAL '30 days'),
        (williams_family_id, parent_williams_id, product_starter_id, 28000, 'completed', NOW() - INTERVAL '15 days');

    INSERT INTO credit_ledger (family_id, transaction_type, amount, balance_after, reference_type, description)
    VALUES
        (johnson_family_id, 'purchase', 8, 8, 'purchase', 'Standard Pack purchase'),
        (johnson_family_id, 'session_debit', -1, 7, 'session', 'Session with Sarah Mitchell'),
        (johnson_family_id, 'session_debit', -1, 6, 'session', 'Session with Sarah Mitchell'),
        (johnson_family_id, 'session_debit', -1, 5, 'session', 'Session with Sarah Mitchell'),
        (chen_family_id, 'purchase', 12, 12, 'purchase', 'Premium Monthly subscription'),
        (chen_family_id, 'session_debit', -1, 11, 'session', 'Session with Sarah Mitchell'),
        (chen_family_id, 'session_debit', -1, 10, 'session', 'Session with Sarah Mitchell'),
        (williams_family_id, 'purchase', 4, 4, 'purchase', 'Starter Pack purchase'),
        (williams_family_id, 'session_debit', -1, 3, 'session', 'Session with Marcus Thompson');

    -- ========================================================================
    -- Create Bookings & Sessions (completed, past sessions)
    -- ========================================================================
    booking_1_id := gen_random_uuid();
    booking_2_id := gen_random_uuid();
    booking_3_id := gen_random_uuid();

    INSERT INTO bookings (id, family_id, student_user_id, parent_user_id, tutor_user_id, start_at, end_at, modality, status)
    VALUES
        (booking_1_id, johnson_family_id, student_emma_id, parent_johnson_id, tutor_sarah_id,
         NOW() - INTERVAL '7 days' + TIME '16:00', NOW() - INTERVAL '7 days' + TIME '17:00', 'online', 'completed'),
        (booking_2_id, chen_family_id, student_sophia_id, parent_chen_id, tutor_sarah_id,
         NOW() - INTERVAL '5 days' + TIME '17:00', NOW() - INTERVAL '5 days' + TIME '18:00', 'online', 'completed'),
        (booking_3_id, williams_family_id, student_noah_id, parent_williams_id, tutor_marcus_id,
         NOW() - INTERVAL '3 days' + TIME '18:00', NOW() - INTERVAL '3 days' + TIME '19:00', 'in_person', 'completed');

    session_1_id := gen_random_uuid();
    session_2_id := gen_random_uuid();
    session_3_id := gen_random_uuid();

    INSERT INTO sessions (id, booking_id, status, attendance_status, started_at, completed_at, parent_summary, next_steps)
    VALUES
        (session_1_id, booking_1_id, 'completed', 'present',
         NOW() - INTERVAL '7 days' + TIME '16:00', NOW() - INTERVAL '7 days' + TIME '17:00',
         'Emma made excellent progress on trigonometric identities. She successfully mastered the Pythagorean identity and can now apply it to simplify expressions.',
         'Continue practicing sum and difference formulas. Complete worksheet problems 1-20.'),
        (session_2_id, booking_2_id, 'completed', 'present',
         NOW() - INTERVAL '5 days' + TIME '17:00', NOW() - INTERVAL '5 days' + TIME '18:00',
         'Sophia worked on limit evaluation techniques. Strong understanding of direct substitution; needs more practice with indeterminate forms.',
         'Review L''Hopital''s rule examples. Practice limits approaching infinity.'),
        (session_3_id, booking_3_id, 'completed', 'present',
         NOW() - INTERVAL '3 days' + TIME '18:00', NOW() - INTERVAL '3 days' + TIME '19:00',
         'Noah tackled challenging AMC-style problems. Showed creative problem-solving approaches. Strong mental math skills.',
         'Work through 2023 AMC 10A problems 15-20. Focus on counting techniques.');

    -- Tag skills to sessions
    INSERT INTO session_skills (session_id, skill_id, exposure_level, notes)
    VALUES
        (session_1_id, skill_trig_id, 'practiced', 'Worked on trig identities'),
        (session_2_id, skill_limits_id, 'assessed', 'Quiz on limit evaluation'),
        (session_2_id, skill_derivatives_id, 'introduced', 'Previewed derivative concept'),
        (session_3_id, skill_quadratic_id, 'practiced', 'Competition-style quadratic problems');

    -- ========================================================================
    -- Create Upcoming Bookings
    -- ========================================================================
    INSERT INTO bookings (family_id, student_user_id, parent_user_id, tutor_user_id, start_at, end_at, modality, status)
    VALUES
        (johnson_family_id, student_emma_id, parent_johnson_id, tutor_sarah_id,
         NOW() + INTERVAL '2 days' + TIME '16:00', NOW() + INTERVAL '2 days' + TIME '17:00', 'online', 'confirmed'),
        (johnson_family_id, student_liam_id, parent_johnson_id, tutor_marcus_id,
         NOW() + INTERVAL '3 days' + TIME '17:00', NOW() + INTERVAL '3 days' + TIME '18:00', 'online', 'confirmed'),
        (chen_family_id, student_sophia_id, parent_chen_id, tutor_sarah_id,
         NOW() + INTERVAL '1 day' + TIME '17:00', NOW() + INTERVAL '1 day' + TIME '18:00', 'online', 'confirmed');

    -- ========================================================================
    -- Create Homework Items
    -- ========================================================================
    INSERT INTO homework_items (session_id, title, description, due_date, status)
    VALUES
        (session_1_id, 'Trig Identity Worksheet', 'Complete problems 1-20 on the trig identity practice sheet',
         (NOW() + INTERVAL '3 days')::DATE, 'assigned'),
        (session_2_id, 'Limits Practice Set', 'Khan Academy limits module + textbook section 2.3',
         (NOW() + INTERVAL '2 days')::DATE, 'submitted'),
        (session_3_id, 'AMC 10 Practice Problems', '2023 AMC 10A problems 15-20 with detailed solutions',
         (NOW() + INTERVAL '5 days')::DATE, 'assigned');

    -- ========================================================================
    -- Create AI Chat Conversations
    -- ========================================================================
    INSERT INTO ai_chat_conversations (student_user_id, title, skill_context, status, message_count, last_message_at)
    VALUES
        (student_emma_id, 'Help with trig identities', skill_trig_id, 'active', 6, NOW() - INTERVAL '2 hours'),
        (student_sophia_id, 'Understanding limits', skill_limits_id, 'active', 8, NOW() - INTERVAL '1 day'),
        (student_noah_id, 'Competition math strategies', NULL, 'active', 4, NOW() - INTERVAL '3 hours');

    -- Add sample messages
    INSERT INTO ai_chat_messages (conversation_id, role, content)
    SELECT
        c.id,
        CASE (row_number() OVER (PARTITION BY c.id ORDER BY random())) % 2
            WHEN 1 THEN 'user'
            ELSE 'assistant'
        END,
        CASE
            WHEN c.title LIKE '%trig%' THEN
                CASE (row_number() OVER (PARTITION BY c.id ORDER BY random())) % 2
                    WHEN 1 THEN 'How do I prove that sin²(x) + cos²(x) = 1?'
                    ELSE 'Great question! The Pythagorean identity can be proven using the unit circle. Consider a point (cos(x), sin(x)) on the unit circle. Since the radius is 1, by the Pythagorean theorem: cos²(x) + sin²(x) = 1².'
                END
            WHEN c.title LIKE '%limits%' THEN
                CASE (row_number() OVER (PARTITION BY c.id ORDER BY random())) % 2
                    WHEN 1 THEN 'What do I do when I get 0/0 when evaluating a limit?'
                    ELSE 'When you encounter 0/0, that''s called an indeterminate form. You have several techniques: 1) Factor and cancel, 2) Rationalize if there are radicals, 3) Use L''Hopital''s rule (take derivative of top and bottom). Would you like me to show an example?'
                END
            ELSE
                CASE (row_number() OVER (PARTITION BY c.id ORDER BY random())) % 2
                    WHEN 1 THEN 'What are some strategies for AMC problems that seem impossible at first?'
                    ELSE 'Great question! Here are key strategies: 1) Work backwards from answer choices, 2) Try small cases to find patterns, 3) Draw diagrams even when not required, 4) Consider extreme cases, 5) Use symmetry. The key is staying calm and trying multiple approaches!'
                END
        END
    FROM ai_chat_conversations c
    CROSS JOIN generate_series(1, 4);

    -- ========================================================================
    -- Create Career Pathways
    -- ========================================================================
    INSERT INTO career_pathways (code, name, description, target_grades, career_outcomes, is_active)
    VALUES
        ('data_science', 'Data Science & Analytics', 'Prepare for careers in data analysis, machine learning, and business intelligence',
         ARRAY[10, 11, 12], ARRAY['Data Scientist', 'ML Engineer', 'Business Analyst', 'Quantitative Analyst'], true),
        ('actuarial', 'Actuarial Science', 'Foundation for actuarial career with focus on probability and financial mathematics',
         ARRAY[11, 12], ARRAY['Actuary', 'Risk Analyst', 'Insurance Underwriter'], true),
        ('robotics', 'Robotics & Engineering', 'Applied mathematics for robotics, automation, and engineering',
         ARRAY[9, 10, 11, 12], ARRAY['Robotics Engineer', 'Mechanical Engineer', 'Automation Specialist'], true);

    -- ========================================================================
    -- Create Programs (Camps & Clinics)
    -- ========================================================================
    program_summer_camp_id := gen_random_uuid();
    program_sat_prep_id := gen_random_uuid();

    INSERT INTO programs (id, name, slug, description, program_type, start_date, end_date, min_participants, max_participants, price_cents, min_grade, max_grade, modality, status)
    VALUES
        (program_summer_camp_id, 'Summer Math Intensive 2026', 'summer-intensive-2026',
         'Two-week intensive math camp covering advanced algebra through calculus. Perfect for motivated students looking to get ahead.',
         'camp', '2026-07-14', '2026-07-25', 8, 20, 149900, 9, 12, 'in_person', 'registration_open'),
        (program_sat_prep_id, 'SAT Math Bootcamp', 'sat-math-bootcamp-spring-2026',
         'Intensive 4-session bootcamp focusing on SAT math strategies, timing, and high-yield topics.',
         'bootcamp', '2026-04-05', '2026-04-26', 6, 15, 49900, 10, 12, 'online', 'registration_open');

    -- Register some students for programs
    INSERT INTO program_registrations (program_id, student_user_id, parent_user_id, family_id, status, amount_paid_cents, consent_signed)
    VALUES
        (program_sat_prep_id, student_sophia_id, parent_chen_id, chen_family_id, 'confirmed', 49900, true),
        (program_sat_prep_id, student_emma_id, parent_johnson_id, johnson_family_id, 'pending', 0, false);

    -- ========================================================================
    -- Create Certification Programs
    -- ========================================================================
    cert_algebra_id := gen_random_uuid();
    cert_calc_id := gen_random_uuid();

    INSERT INTO certification_programs (id, code, name, description, cert_type, level, category, estimated_hours, difficulty_rating, grade_level_min, grade_level_max, is_active, is_featured)
    VALUES
        (cert_algebra_id, 'ALG-GOLD', 'Algebra Mastery - Gold',
         'Demonstrates comprehensive understanding of algebraic concepts including linear equations, quadratics, polynomials, and rational expressions.',
         'skill_mastery', 'gold', 'Algebra', 20, 3, 8, 10, true, true),
        (cert_calc_id, 'CALC-FOUND', 'Calculus Foundations',
         'Establishes foundational understanding of limits, derivatives, and basic integration techniques.',
         'skill_mastery', 'silver', 'Calculus', 40, 4, 10, 12, true, true);

    -- Add certification requirements
    INSERT INTO certification_requirements (program_id, requirement_type, name, description, parameters, is_required)
    VALUES
        (cert_algebra_id, 'skills_mastered', 'Master Linear Equations', 'Demonstrate mastery of linear equation solving',
         '{"skill_ids": ["' || skill_linear_eq_id || '"]}', true),
        (cert_algebra_id, 'skills_mastered', 'Master Quadratic Equations', 'Demonstrate mastery of quadratic equation solving',
         '{"skill_ids": ["' || skill_quadratic_id || '"]}', true),
        (cert_algebra_id, 'sessions_completed', 'Complete 5 Sessions', 'Attend at least 5 tutoring sessions',
         '{"min_sessions": 5}', true),
        (cert_calc_id, 'skills_mastered', 'Master Limits', 'Demonstrate understanding of limits and continuity',
         '{"skill_ids": ["' || skill_limits_id || '"]}', true),
        (cert_calc_id, 'skills_mastered', 'Master Derivatives', 'Demonstrate ability to compute and apply derivatives',
         '{"skill_ids": ["' || skill_derivatives_id || '"]}', true);

    -- Track student certification progress
    INSERT INTO user_certification_progress (user_id, program_id, completion_percentage, status)
    VALUES
        (student_emma_id, cert_algebra_id, 75.00, 'in_progress'),
        (student_sophia_id, cert_calc_id, 40.00, 'in_progress'),
        (student_noah_id, cert_algebra_id, 50.00, 'in_progress');

    -- ========================================================================
    -- Create Weekly Reports
    -- ========================================================================
    INSERT INTO weekly_reports (student_user_id, family_id, week_start, week_end, sessions_count, attendance_rate, skills_practiced, summary_text, recommendations, is_at_risk)
    VALUES
        (student_emma_id, johnson_family_id,
         DATE_TRUNC('week', NOW() - INTERVAL '1 week')::DATE,
         (DATE_TRUNC('week', NOW() - INTERVAL '1 week') + INTERVAL '6 days')::DATE,
         2, 1.0, ARRAY['Trigonometry', 'Pre-Calculus'],
         'Emma had an excellent week! She attended both scheduled sessions and made significant progress on trigonometric identities. Her problem-solving speed has improved noticeably.',
         'Continue focusing on trig identities. Consider adding one more session per week as AP Calc prep intensifies.',
         false),
        (student_sophia_id, chen_family_id,
         DATE_TRUNC('week', NOW() - INTERVAL '1 week')::DATE,
         (DATE_TRUNC('week', NOW() - INTERVAL '1 week') + INTERVAL '6 days')::DATE,
         1, 1.0, ARRAY['Limits', 'Derivatives'],
         'Sophia continues to excel in AP Calculus. This week we introduced L''Hopital''s rule and she picked it up quickly.',
         'Ready to move on to derivative applications. Schedule extra session before the upcoming unit test.',
         false);

    -- ========================================================================
    -- Create Notifications
    -- ========================================================================
    INSERT INTO notifications (user_id, channel, template_key, payload_json, status, scheduled_for)
    VALUES
        (parent_johnson_id, 'email', 'session_reminder',
         '{"student_name": "Emma", "tutor_name": "Sarah Mitchell", "session_time": "Tomorrow at 4:00 PM"}',
         'sent', NOW() - INTERVAL '1 day'),
        (parent_chen_id, 'in_app', 'weekly_report_ready',
         '{"student_name": "Sophia", "week": "March 15-21"}',
         'sent', NOW() - INTERVAL '2 days'),
        (student_sophia_id, 'in_app', 'homework_reminder',
         '{"assignment": "Limits Practice Set", "due_date": "Tomorrow"}',
         'pending', NOW() + INTERVAL '4 hours');

    RAISE NOTICE 'Seed data created successfully!';
    RAISE NOTICE 'Families: Johnson (2 students), Chen (1 student), Williams (1 student)';
    RAISE NOTICE 'Tutors: Sarah Mitchell, Marcus Thompson';
    RAISE NOTICE 'Sessions created: 3 completed, 3 upcoming';

END $$;

-- ============================================================================
-- Create Service Packages (outside transaction for guide_levels reference)
-- ============================================================================
INSERT INTO service_packages (name, slug, description, service_tier, billing_type, price_cents, credits_per_period, session_duration_minutes, is_active, is_featured, feature_gates)
VALUES
    ('Tutoring Essentials', 'tutoring-essentials',
     'Perfect for students needing targeted homework help and test prep.',
     'TIER_TUTORING', 'monthly', 19900, 4, 60, true, false,
     '{"ai_tutor": false, "career_pathways": false, "weekly_reports": false, "async_support": false}'),
    ('Coaching Plus', 'coaching-plus',
     'Comprehensive support with AI tutor access and weekly progress reports.',
     'TIER_COACHING', 'monthly', 34900, 6, 60, true, true,
     '{"ai_tutor": true, "career_pathways": false, "weekly_reports": true, "async_support": true}'),
    ('Mentorship Elite', 'mentorship-elite',
     'Premium tier with career pathway guidance, competition prep, and priority scheduling.',
     'TIER_MENTORSHIP', 'monthly', 59900, 8, 60, true, true,
     '{"ai_tutor": true, "career_pathways": true, "competition_prep": true, "weekly_reports": true, "async_support": true, "priority_scheduling": true}')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the seed data:

-- SELECT COUNT(*) as user_count FROM users_profile;
-- SELECT role, COUNT(*) FROM users_profile GROUP BY role;
-- SELECT COUNT(*) as family_count FROM families;
-- SELECT COUNT(*) as booking_count FROM bookings;
-- SELECT COUNT(*) as session_count FROM sessions;
-- SELECT COUNT(*) as skill_count FROM skills;
