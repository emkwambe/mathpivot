-- ============================================================================
-- MATHPIVOT TUTOROS - ROW LEVEL SECURITY POLICIES
-- Migration 00002: RLS policies for all tables
-- DENY by default, ALLOW via policies
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS (Security Definer)
-- ============================================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.role
  FROM public.users_profile up
  WHERE up.id = auth.uid()
$$;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_role() = 'admin', false)
$$;

-- Check if current user is tutor
CREATE OR REPLACE FUNCTION public.is_tutor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_role() = 'tutor', false)
$$;

-- Check if current user is parent
CREATE OR REPLACE FUNCTION public.is_parent()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_role() = 'parent', false)
$$;

-- Check if current user is student
CREATE OR REPLACE FUNCTION public.is_student()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_role() = 'student', false)
$$;

-- Check if current user is a parent in a given family
CREATE OR REPLACE FUNCTION public.is_parent_in_family(p_family_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.family_id = p_family_id
      AND fm.user_id = auth.uid()
      AND fm.member_role = 'parent'
  )
$$;

-- Check if current user is the student
CREATE OR REPLACE FUNCTION public.is_self_student(p_student_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = p_student_user_id
$$;

-- Check if current user can access a student's data
CREATE OR REPLACE FUNCTION public.can_access_student(p_student_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin()
    OR public.is_self_student(p_student_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.students_profile sp
      WHERE sp.user_id = p_student_user_id
        AND public.is_parent_in_family(sp.family_id)
    )
$$;

-- Check if current user is the tutor for a booking
CREATE OR REPLACE FUNCTION public.is_booking_tutor(p_booking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = p_booking_id
      AND b.tutor_user_id = auth.uid()
  )
$$;

-- Check if current user can access a booking
CREATE OR REPLACE FUNCTION public.can_access_booking(p_booking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin()
    OR public.is_booking_tutor(p_booking_id)
    OR EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = p_booking_id
        AND (
          b.parent_user_id = auth.uid()
          OR b.student_user_id = auth.uid()
          OR public.is_parent_in_family(b.family_id)
        )
    )
$$;

-- Check if current user can access a session
CREATE OR REPLACE FUNCTION public.can_access_session(p_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.sessions s
      JOIN public.bookings b ON b.id = s.booking_id
      WHERE s.id = p_session_id
        AND (
          b.tutor_user_id = auth.uid()
          OR b.parent_user_id = auth.uid()
          OR b.student_user_id = auth.uid()
          OR public.is_parent_in_family(b.family_id)
        )
    )
$$;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutors_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skill_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS PROFILE POLICIES
-- ============================================================================

-- Users can read/update their own profile; admin can read/update all
DROP POLICY IF EXISTS "users_profile_select" ON public.users_profile;
CREATE POLICY "users_profile_select"
ON public.users_profile FOR SELECT
USING (public.is_admin() OR id = auth.uid());

DROP POLICY IF EXISTS "users_profile_update" ON public.users_profile;
CREATE POLICY "users_profile_update"
ON public.users_profile FOR UPDATE
USING (public.is_admin() OR id = auth.uid())
WITH CHECK (public.is_admin() OR id = auth.uid());

-- ============================================================================
-- FAMILIES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "families_select" ON public.families;
CREATE POLICY "families_select"
ON public.families FOR SELECT
USING (
  public.is_admin()
  OR public.is_parent_in_family(id)
  OR EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = families.id AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "families_insert" ON public.families;
CREATE POLICY "families_insert"
ON public.families FOR INSERT
WITH CHECK (public.is_admin() OR public.is_parent());

DROP POLICY IF EXISTS "families_update" ON public.families;
CREATE POLICY "families_update"
ON public.families FOR UPDATE
USING (public.is_admin() OR public.is_parent_in_family(id))
WITH CHECK (public.is_admin() OR public.is_parent_in_family(id));

-- ============================================================================
-- FAMILY MEMBERS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "family_members_select" ON public.family_members;
CREATE POLICY "family_members_select"
ON public.family_members FOR SELECT
USING (
  public.is_admin()
  OR user_id = auth.uid()
  OR public.is_parent_in_family(family_id)
);

DROP POLICY IF EXISTS "family_members_insert" ON public.family_members;
CREATE POLICY "family_members_insert"
ON public.family_members FOR INSERT
WITH CHECK (public.is_admin() OR public.is_parent_in_family(family_id));

DROP POLICY IF EXISTS "family_members_delete" ON public.family_members;
CREATE POLICY "family_members_delete"
ON public.family_members FOR DELETE
USING (public.is_admin() OR public.is_parent_in_family(family_id));

-- ============================================================================
-- STUDENTS PROFILE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "students_profile_select" ON public.students_profile;
CREATE POLICY "students_profile_select"
ON public.students_profile FOR SELECT
USING (
  public.is_admin()
  OR user_id = auth.uid()
  OR public.is_parent_in_family(family_id)
);

DROP POLICY IF EXISTS "students_profile_insert" ON public.students_profile;
CREATE POLICY "students_profile_insert"
ON public.students_profile FOR INSERT
WITH CHECK (public.is_admin() OR public.is_parent_in_family(family_id));

DROP POLICY IF EXISTS "students_profile_update" ON public.students_profile;
CREATE POLICY "students_profile_update"
ON public.students_profile FOR UPDATE
USING (
  public.is_admin()
  OR public.is_parent_in_family(family_id)
  OR user_id = auth.uid()
)
WITH CHECK (
  public.is_admin()
  OR public.is_parent_in_family(family_id)
  OR user_id = auth.uid()
);

-- ============================================================================
-- TUTORS PROFILE POLICIES
-- ============================================================================

-- Public read (so parents/students can see tutor bios)
DROP POLICY IF EXISTS "tutors_profile_select" ON public.tutors_profile;
CREATE POLICY "tutors_profile_select"
ON public.tutors_profile FOR SELECT
USING (true);

DROP POLICY IF EXISTS "tutors_profile_insert" ON public.tutors_profile;
CREATE POLICY "tutors_profile_insert"
ON public.tutors_profile FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tutors_profile_update" ON public.tutors_profile;
CREATE POLICY "tutors_profile_update"
ON public.tutors_profile FOR UPDATE
USING (public.is_admin() OR user_id = auth.uid())
WITH CHECK (public.is_admin() OR user_id = auth.uid());

-- ============================================================================
-- AVAILABILITY RULES POLICIES
-- ============================================================================

-- Tutors manage their own; admin can manage all; others can read (for booking)
DROP POLICY IF EXISTS "availability_rules_select" ON public.availability_rules;
CREATE POLICY "availability_rules_select"
ON public.availability_rules FOR SELECT
USING (true);

DROP POLICY IF EXISTS "availability_rules_insert" ON public.availability_rules;
CREATE POLICY "availability_rules_insert"
ON public.availability_rules FOR INSERT
WITH CHECK (public.is_admin() OR tutor_user_id = auth.uid());

DROP POLICY IF EXISTS "availability_rules_update" ON public.availability_rules;
CREATE POLICY "availability_rules_update"
ON public.availability_rules FOR UPDATE
USING (public.is_admin() OR tutor_user_id = auth.uid())
WITH CHECK (public.is_admin() OR tutor_user_id = auth.uid());

DROP POLICY IF EXISTS "availability_rules_delete" ON public.availability_rules;
CREATE POLICY "availability_rules_delete"
ON public.availability_rules FOR DELETE
USING (public.is_admin() OR tutor_user_id = auth.uid());

-- ============================================================================
-- AVAILABILITY EXCEPTIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "availability_exceptions_select" ON public.availability_exceptions;
CREATE POLICY "availability_exceptions_select"
ON public.availability_exceptions FOR SELECT
USING (true);

DROP POLICY IF EXISTS "availability_exceptions_insert" ON public.availability_exceptions;
CREATE POLICY "availability_exceptions_insert"
ON public.availability_exceptions FOR INSERT
WITH CHECK (public.is_admin() OR tutor_user_id = auth.uid());

DROP POLICY IF EXISTS "availability_exceptions_update" ON public.availability_exceptions;
CREATE POLICY "availability_exceptions_update"
ON public.availability_exceptions FOR UPDATE
USING (public.is_admin() OR tutor_user_id = auth.uid())
WITH CHECK (public.is_admin() OR tutor_user_id = auth.uid());

DROP POLICY IF EXISTS "availability_exceptions_delete" ON public.availability_exceptions;
CREATE POLICY "availability_exceptions_delete"
ON public.availability_exceptions FOR DELETE
USING (public.is_admin() OR tutor_user_id = auth.uid());

-- ============================================================================
-- BOOKINGS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "bookings_select" ON public.bookings;
CREATE POLICY "bookings_select"
ON public.bookings FOR SELECT
USING (
  public.is_admin()
  OR tutor_user_id = auth.uid()
  OR student_user_id = auth.uid()
  OR parent_user_id = auth.uid()
  OR public.is_parent_in_family(family_id)
);

DROP POLICY IF EXISTS "bookings_insert" ON public.bookings;
CREATE POLICY "bookings_insert"
ON public.bookings FOR INSERT
WITH CHECK (
  public.is_admin()
  OR (public.is_parent_in_family(family_id) AND parent_user_id = auth.uid())
);

DROP POLICY IF EXISTS "bookings_update" ON public.bookings;
CREATE POLICY "bookings_update"
ON public.bookings FOR UPDATE
USING (
  public.is_admin()
  OR tutor_user_id = auth.uid()
  OR public.is_parent_in_family(family_id)
)
WITH CHECK (
  public.is_admin()
  OR tutor_user_id = auth.uid()
  OR public.is_parent_in_family(family_id)
);

DROP POLICY IF EXISTS "bookings_delete" ON public.bookings;
CREATE POLICY "bookings_delete"
ON public.bookings FOR DELETE
USING (public.is_admin());

-- ============================================================================
-- WAITLIST POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "waitlist_select" ON public.waitlist;
CREATE POLICY "waitlist_select"
ON public.waitlist FOR SELECT
USING (
  public.is_admin()
  OR parent_user_id = auth.uid()
  OR public.is_parent_in_family(family_id)
);

DROP POLICY IF EXISTS "waitlist_insert" ON public.waitlist;
CREATE POLICY "waitlist_insert"
ON public.waitlist FOR INSERT
WITH CHECK (
  public.is_admin()
  OR (public.is_parent_in_family(family_id) AND parent_user_id = auth.uid())
);

DROP POLICY IF EXISTS "waitlist_update" ON public.waitlist;
CREATE POLICY "waitlist_update"
ON public.waitlist FOR UPDATE
USING (public.is_admin() OR public.is_parent_in_family(family_id))
WITH CHECK (public.is_admin() OR public.is_parent_in_family(family_id));

DROP POLICY IF EXISTS "waitlist_delete" ON public.waitlist;
CREATE POLICY "waitlist_delete"
ON public.waitlist FOR DELETE
USING (public.is_admin() OR public.is_parent_in_family(family_id));

-- ============================================================================
-- SESSIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "sessions_select" ON public.sessions;
CREATE POLICY "sessions_select"
ON public.sessions FOR SELECT
USING (public.is_admin() OR public.can_access_booking(booking_id));

DROP POLICY IF EXISTS "sessions_insert" ON public.sessions;
CREATE POLICY "sessions_insert"
ON public.sessions FOR INSERT
WITH CHECK (public.is_admin() OR public.is_booking_tutor(booking_id));

DROP POLICY IF EXISTS "sessions_update" ON public.sessions;
CREATE POLICY "sessions_update"
ON public.sessions FOR UPDATE
USING (public.is_admin() OR public.is_booking_tutor(booking_id))
WITH CHECK (public.is_admin() OR public.is_booking_tutor(booking_id));

DROP POLICY IF EXISTS "sessions_delete" ON public.sessions;
CREATE POLICY "sessions_delete"
ON public.sessions FOR DELETE
USING (public.is_admin());

-- ============================================================================
-- SESSION ATTACHMENTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "session_attachments_select" ON public.session_attachments;
CREATE POLICY "session_attachments_select"
ON public.session_attachments FOR SELECT
USING (public.is_admin() OR public.can_access_session(session_id));

DROP POLICY IF EXISTS "session_attachments_insert" ON public.session_attachments;
CREATE POLICY "session_attachments_insert"
ON public.session_attachments FOR INSERT
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.bookings b ON b.id = s.booking_id
    WHERE s.id = session_attachments.session_id
      AND (b.tutor_user_id = auth.uid() OR b.student_user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "session_attachments_delete" ON public.session_attachments;
CREATE POLICY "session_attachments_delete"
ON public.session_attachments FOR DELETE
USING (public.is_admin() OR uploaded_by = auth.uid());

-- ============================================================================
-- SKILLS POLICIES
-- ============================================================================

-- Everyone can read skills; admin can manage
DROP POLICY IF EXISTS "skills_select" ON public.skills;
CREATE POLICY "skills_select"
ON public.skills FOR SELECT
USING (true);

DROP POLICY IF EXISTS "skills_insert" ON public.skills;
CREATE POLICY "skills_insert"
ON public.skills FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "skills_update" ON public.skills;
CREATE POLICY "skills_update"
ON public.skills FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "skills_delete" ON public.skills;
CREATE POLICY "skills_delete"
ON public.skills FOR DELETE
USING (public.is_admin());

-- ============================================================================
-- SESSION SKILLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "session_skills_select" ON public.session_skills;
CREATE POLICY "session_skills_select"
ON public.session_skills FOR SELECT
USING (public.is_admin() OR public.can_access_session(session_id));

DROP POLICY IF EXISTS "session_skills_insert" ON public.session_skills;
CREATE POLICY "session_skills_insert"
ON public.session_skills FOR INSERT
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.bookings b ON b.id = s.booking_id
    WHERE s.id = session_skills.session_id
      AND b.tutor_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "session_skills_delete" ON public.session_skills;
CREATE POLICY "session_skills_delete"
ON public.session_skills FOR DELETE
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.bookings b ON b.id = s.booking_id
    WHERE s.id = session_skills.session_id
      AND b.tutor_user_id = auth.uid()
  )
);

-- ============================================================================
-- STUDENT SKILL MASTERY POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "student_skill_mastery_select" ON public.student_skill_mastery;
CREATE POLICY "student_skill_mastery_select"
ON public.student_skill_mastery FOR SELECT
USING (public.is_admin() OR public.can_access_student(student_user_id));

DROP POLICY IF EXISTS "student_skill_mastery_insert" ON public.student_skill_mastery;
CREATE POLICY "student_skill_mastery_insert"
ON public.student_skill_mastery FOR INSERT
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.bookings b ON b.id = s.booking_id
    WHERE b.student_user_id = student_skill_mastery.student_user_id
      AND b.tutor_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "student_skill_mastery_update" ON public.student_skill_mastery;
CREATE POLICY "student_skill_mastery_update"
ON public.student_skill_mastery FOR UPDATE
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.bookings b ON b.id = s.booking_id
    WHERE b.student_user_id = student_skill_mastery.student_user_id
      AND b.tutor_user_id = auth.uid()
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.bookings b ON b.id = s.booking_id
    WHERE b.student_user_id = student_skill_mastery.student_user_id
      AND b.tutor_user_id = auth.uid()
  )
);

-- ============================================================================
-- DIAGNOSTICS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "diagnostics_select" ON public.diagnostics;
CREATE POLICY "diagnostics_select"
ON public.diagnostics FOR SELECT
USING (public.is_admin() OR public.can_access_student(student_user_id));

DROP POLICY IF EXISTS "diagnostics_insert" ON public.diagnostics;
CREATE POLICY "diagnostics_insert"
ON public.diagnostics FOR INSERT
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.bookings b ON b.id = s.booking_id
    WHERE b.student_user_id = diagnostics.student_user_id
      AND b.tutor_user_id = auth.uid()
  )
);

-- ============================================================================
-- HOMEWORK ITEMS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "homework_items_select" ON public.homework_items;
CREATE POLICY "homework_items_select"
ON public.homework_items FOR SELECT
USING (public.is_admin() OR public.can_access_session(session_id));

DROP POLICY IF EXISTS "homework_items_insert" ON public.homework_items;
CREATE POLICY "homework_items_insert"
ON public.homework_items FOR INSERT
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.bookings b ON b.id = s.booking_id
    WHERE s.id = homework_items.session_id
      AND b.tutor_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "homework_items_update" ON public.homework_items;
CREATE POLICY "homework_items_update"
ON public.homework_items FOR UPDATE
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.bookings b ON b.id = s.booking_id
    WHERE s.id = homework_items.session_id
      AND (b.tutor_user_id = auth.uid() OR b.student_user_id = auth.uid())
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.bookings b ON b.id = s.booking_id
    WHERE s.id = homework_items.session_id
      AND (b.tutor_user_id = auth.uid() OR b.student_user_id = auth.uid())
  )
);

-- ============================================================================
-- PRODUCTS POLICIES
-- ============================================================================

-- Public read; admin manage
DROP POLICY IF EXISTS "products_select" ON public.products;
CREATE POLICY "products_select"
ON public.products FOR SELECT
USING (true);

DROP POLICY IF EXISTS "products_insert" ON public.products;
CREATE POLICY "products_insert"
ON public.products FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_update" ON public.products;
CREATE POLICY "products_update"
ON public.products FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_delete" ON public.products;
CREATE POLICY "products_delete"
ON public.products FOR DELETE
USING (public.is_admin());

-- ============================================================================
-- PURCHASES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "purchases_select" ON public.purchases;
CREATE POLICY "purchases_select"
ON public.purchases FOR SELECT
USING (
  public.is_admin()
  OR parent_user_id = auth.uid()
  OR public.is_parent_in_family(family_id)
);

DROP POLICY IF EXISTS "purchases_insert" ON public.purchases;
CREATE POLICY "purchases_insert"
ON public.purchases FOR INSERT
WITH CHECK (
  public.is_admin()
  OR (public.is_parent_in_family(family_id) AND parent_user_id = auth.uid())
);

-- ============================================================================
-- CREDIT LEDGER POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "credit_ledger_select" ON public.credit_ledger;
CREATE POLICY "credit_ledger_select"
ON public.credit_ledger FOR SELECT
USING (public.is_admin() OR public.is_parent_in_family(family_id));

-- Only admin/service role can insert (handled by server)
DROP POLICY IF EXISTS "credit_ledger_insert" ON public.credit_ledger;
CREATE POLICY "credit_ledger_insert"
ON public.credit_ledger FOR INSERT
WITH CHECK (public.is_admin());

-- ============================================================================
-- NOTIFICATION PREFERENCES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "notification_preferences_select" ON public.notification_preferences;
CREATE POLICY "notification_preferences_select"
ON public.notification_preferences FOR SELECT
USING (public.is_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS "notification_preferences_insert" ON public.notification_preferences;
CREATE POLICY "notification_preferences_insert"
ON public.notification_preferences FOR INSERT
WITH CHECK (public.is_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS "notification_preferences_update" ON public.notification_preferences;
CREATE POLICY "notification_preferences_update"
ON public.notification_preferences FOR UPDATE
USING (public.is_admin() OR user_id = auth.uid())
WITH CHECK (public.is_admin() OR user_id = auth.uid());

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select"
ON public.notifications FOR SELECT
USING (public.is_admin() OR user_id = auth.uid());

-- Only admin/service role can manage notifications (handled by server)
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert"
ON public.notifications FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update"
ON public.notifications FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- EVENTS POLICIES
-- ============================================================================

-- Only admin can read events (service role for writes)
DROP POLICY IF EXISTS "events_select" ON public.events;
CREATE POLICY "events_select"
ON public.events FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "events_insert" ON public.events;
CREATE POLICY "events_insert"
ON public.events FOR INSERT
WITH CHECK (public.is_admin());

-- ============================================================================
-- STRIPE WEBHOOK EVENTS POLICIES
-- ============================================================================

-- Only admin/service role
DROP POLICY IF EXISTS "stripe_webhook_events_select" ON public.stripe_webhook_events;
CREATE POLICY "stripe_webhook_events_select"
ON public.stripe_webhook_events FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "stripe_webhook_events_insert" ON public.stripe_webhook_events;
CREATE POLICY "stripe_webhook_events_insert"
ON public.stripe_webhook_events FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "stripe_webhook_events_update" ON public.stripe_webhook_events;
CREATE POLICY "stripe_webhook_events_update"
ON public.stripe_webhook_events FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- WEEKLY REPORTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "weekly_reports_select" ON public.weekly_reports;
CREATE POLICY "weekly_reports_select"
ON public.weekly_reports FOR SELECT
USING (
  public.is_admin()
  OR public.can_access_student(student_user_id)
);

-- Only admin/service role can manage weekly reports (handled by server)
DROP POLICY IF EXISTS "weekly_reports_insert" ON public.weekly_reports;
CREATE POLICY "weekly_reports_insert"
ON public.weekly_reports FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "weekly_reports_update" ON public.weekly_reports;
CREATE POLICY "weekly_reports_update"
ON public.weekly_reports FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());
