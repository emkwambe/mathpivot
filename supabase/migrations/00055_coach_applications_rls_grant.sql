-- Migration 00055: Fix coach_applications INSERT RLS
--
-- The initial 00054 policy CREATE POLICY ... FOR INSERT WITH CHECK (true)
-- was rejecting submissions from /coach-apply with:
--   new row violates row-level security policy for table "coach_applications"
--
-- Cause: the policy had no explicit TO clause and the anon role lacked
-- an INSERT grant on the table. Fix both here.

-- Ensure the API roles Supabase uses can attempt INSERT (RLS still gates
-- what actually lands).
GRANT INSERT ON coach_applications TO anon, authenticated;

-- Recreate the insert policy so it explicitly applies to anon and
-- authenticated. WITH CHECK (true) — the /coach-apply form is public.
DROP POLICY IF EXISTS "coach_apps_insert_anon" ON coach_applications;
CREATE POLICY "coach_apps_insert_public"
  ON coach_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
