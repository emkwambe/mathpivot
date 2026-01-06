-- Function to decrement family credits (used after session completion)
CREATE OR REPLACE FUNCTION decrement_family_credits(p_family_id uuid, p_amount integer)
RETURNS void AS $$
BEGIN
  UPDATE families
  SET credit_balance = GREATEST(0, credit_balance - p_amount)
  WHERE id = p_family_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate weekly report for a student
CREATE OR REPLACE FUNCTION generate_weekly_report(
  p_student_user_id uuid,
  p_week_start date,
  p_week_end date
)
RETURNS uuid AS $$
DECLARE
  v_report_id uuid;
  v_session_count integer;
  v_skills_worked jsonb;
  v_homework_completion_rate numeric;
  v_is_at_risk boolean := false;
  v_at_risk_reasons text[] := '{}';
BEGIN
  -- Count sessions this week
  SELECT COUNT(*) INTO v_session_count
  FROM sessions
  WHERE student_user_id = p_student_user_id
    AND started_at >= p_week_start
    AND started_at < p_week_end + interval '1 day'
    AND ended_at IS NOT NULL;

  -- Get skills worked on
  SELECT COALESCE(jsonb_agg(DISTINCT skill_id), '[]'::jsonb) INTO v_skills_worked
  FROM sessions s, unnest(s.skills_covered) AS skill_id
  WHERE s.student_user_id = p_student_user_id
    AND s.started_at >= p_week_start
    AND s.started_at < p_week_end + interval '1 day';

  -- Calculate homework completion (simplified - would need homework table in production)
  v_homework_completion_rate := 1.0;

  -- Determine at-risk status
  IF v_session_count = 0 THEN
    v_is_at_risk := true;
    v_at_risk_reasons := array_append(v_at_risk_reasons, 'No sessions completed this week');
  END IF;

  -- Check for no-shows
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE student_user_id = p_student_user_id
      AND status = 'no_show'
      AND start_at >= p_week_start
      AND start_at < p_week_end + interval '1 day'
  ) THEN
    v_is_at_risk := true;
    v_at_risk_reasons := array_append(v_at_risk_reasons, 'Had no-show(s) this week');
  END IF;

  -- Insert the report
  INSERT INTO weekly_reports (
    student_user_id,
    week_start,
    week_end,
    session_count,
    skills_worked,
    homework_completion_rate,
    is_at_risk,
    at_risk_reasons
  ) VALUES (
    p_student_user_id,
    p_week_start,
    p_week_end,
    v_session_count,
    v_skills_worked,
    v_homework_completion_rate,
    v_is_at_risk,
    v_at_risk_reasons
  )
  RETURNING id INTO v_report_id;

  RETURN v_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION decrement_family_credits(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_weekly_report(uuid, date, date) TO authenticated;
