-- Fix monthly recurrence arithmetic
-- Previously used v_date + 28 which causes drift (Feb=28, most months=30-31)
-- Now uses proper INTERVAL '1 month' which PostgreSQL handles correctly

CREATE OR REPLACE FUNCTION generate_recurring_bookings(
    p_series_id UUID,
    p_weeks_ahead INT DEFAULT 4
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_series RECORD;
    v_date DATE;
    v_end_date DATE;
    v_start_at TIMESTAMPTZ;
    v_end_at TIMESTAMPTZ;
    v_count INT := 0;
    v_exists BOOLEAN;
BEGIN
    -- Get series details
    SELECT * INTO v_series
    FROM recurring_series
    WHERE id = p_series_id AND is_active = TRUE;

    IF v_series IS NULL THEN
        RETURN 0;
    END IF;

    -- Calculate date range
    v_date := GREATEST(v_series.starts_on, CURRENT_DATE);
    v_end_date := COALESCE(
        v_series.ends_on,
        CURRENT_DATE + (p_weeks_ahead * 7)
    );

    -- Generate bookings for each occurrence
    WHILE v_date <= v_end_date LOOP
        -- Build timestamps
        v_start_at := (v_date || ' ' || v_series.start_time)::TIMESTAMPTZ;
        v_end_at := (v_date || ' ' || v_series.end_time)::TIMESTAMPTZ;

        -- Skip if booking already exists for this date/time/tutor
        SELECT EXISTS(
            SELECT 1 FROM bookings
            WHERE tutor_user_id = v_series.tutor_user_id
              AND start_at = v_start_at
              AND recurring_series_id = p_series_id
              AND status != 'canceled'
        ) INTO v_exists;

        IF NOT v_exists THEN
            INSERT INTO bookings (
                student_user_id, tutor_user_id, family_id,
                parent_user_id,
                start_at, end_at,
                modality, status,
                room_id,
                is_group_session, max_students,
                recurring_series_id,
                notes
            )
            SELECT
                v_series.student_user_id, v_series.tutor_user_id, v_series.family_id,
                f.primary_parent_user_id,
                v_start_at, v_end_at,
                v_series.modality, 'confirmed',
                v_series.room_id,
                v_series.is_group, v_series.max_students,
                p_series_id,
                'Auto-generated from recurring series'
            FROM families f
            WHERE f.id = v_series.family_id;

            v_count := v_count + 1;
        END IF;

        -- Advance by pattern (FIXED: use proper month arithmetic)
        IF v_series.pattern = 'weekly' THEN
            v_date := v_date + 7;
        ELSIF v_series.pattern = 'biweekly' THEN
            v_date := v_date + 14;
        ELSIF v_series.pattern = 'monthly' THEN
            v_date := (v_date + INTERVAL '1 month')::DATE;
        END IF;
    END LOOP;

    -- Update counter
    UPDATE recurring_series
    SET total_generated = total_generated + v_count, updated_at = NOW()
    WHERE id = p_series_id;

    RETURN v_count;
END;
$$;
