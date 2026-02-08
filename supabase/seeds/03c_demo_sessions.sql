-- ============================================================================
-- PART 3: AVAILABILITY, CREDITS, AND DEMO SESSIONS
-- ============================================================================

-- Tutor 1 Availability
INSERT INTO availability_rules (tutor_user_id, day_of_week, start_time, end_time, is_active) VALUES
('00000000-0000-0000-0000-000000000010', 1, '15:00', '20:00', true),
('00000000-0000-0000-0000-000000000010', 2, '15:00', '20:00', true),
('00000000-0000-0000-0000-000000000010', 3, '15:00', '20:00', true),
('00000000-0000-0000-0000-000000000010', 4, '15:00', '20:00', true),
('00000000-0000-0000-0000-000000000010', 5, '14:00', '18:00', true),
('00000000-0000-0000-0000-000000000010', 6, '10:00', '14:00', true);

-- Tutor 2 Availability
INSERT INTO availability_rules (tutor_user_id, day_of_week, start_time, end_time, is_active) VALUES
('00000000-0000-0000-0000-000000000011', 1, '16:00', '21:00', true),
('00000000-0000-0000-0000-000000000011', 3, '16:00', '21:00', true),
('00000000-0000-0000-0000-000000000011', 5, '16:00', '21:00', true),
('00000000-0000-0000-0000-000000000011', 0, '09:00', '13:00', true);

-- Initial Credits
INSERT INTO credit_ledger (family_id, transaction_type, amount, balance_after, reference_type, description)
VALUES (
    '00000000-0000-0000-0000-000000000100',
    'purchase',
    10,
    10,
    'purchase',
    'Initial demo credits'
);

-- Past Completed Session
INSERT INTO bookings (id, family_id, student_user_id, parent_user_id, tutor_user_id, start_at, end_at, modality, status, notes)
VALUES (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000100',
    '00000000-0000-0000-0000-000000000030',
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000010',
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
    'present',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days' + INTERVAL '55 minutes',
    'Emma showed great progress on linear equations.',
    'Emma did excellent work today!',
    'Practice word problems from Chapter 3'
) ON CONFLICT (id) DO NOTHING;

-- Credit Usage
INSERT INTO credit_ledger (family_id, transaction_type, amount, balance_after, reference_type, reference_id, description)
VALUES (
    '00000000-0000-0000-0000-000000000100',
    'session_debit',
    -1,
    9,
    'booking',
    '00000000-0000-0000-0000-000000000201',
    'Session with Sarah Johnson'
);

-- Upcoming Session Tomorrow
INSERT INTO bookings (id, family_id, student_user_id, parent_user_id, tutor_user_id, start_at, end_at, modality, status, notes)
VALUES (
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000100',
    '00000000-0000-0000-0000-000000000031',
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000010',
    NOW() + INTERVAL '1 day' + INTERVAL '16 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '17 hours',
    'online',
    'confirmed',
    'SAT Math prep'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO sessions (id, booking_id, status)
VALUES (
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000202',
    'scheduled'
) ON CONFLICT (id) DO NOTHING;

-- In-Progress Session NOW
INSERT INTO bookings (id, family_id, student_user_id, parent_user_id, tutor_user_id, start_at, end_at, modality, status, notes)
VALUES (
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000100',
    '00000000-0000-0000-0000-000000000030',
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000011',
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
    'present',
    NOW() - INTERVAL '30 minutes'
) ON CONFLICT (id) DO NOTHING;
