-- Migration 00049: Program subscription state (Stripe monthly recurring)
-- Tracks Foundation/Acceleration/Elite subscriptions per family, kept in
-- sync by the Stripe subscription webhook.

DO $$ BEGIN
  CREATE TYPE program_tier AS ENUM ('foundation', 'acceleration', 'elite');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'incomplete', 'incomplete_expired', 'trialing', 'active',
    'past_due', 'canceled', 'unpaid', 'paused'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.program_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
  student_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Captured at checkout, used for account provisioning when the parent
  -- is brand-new (no auth.users row yet at webhook time).
  parent_email TEXT NOT NULL,
  parent_name TEXT,
  student_name TEXT,
  student_grade INTEGER CHECK (student_grade BETWEEN 1 AND 12),

  program_tier program_tier NOT NULL,
  price_monthly_cents INTEGER NOT NULL,

  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,
  stripe_checkout_session_id TEXT,
  status subscription_status NOT NULL DEFAULT 'incomplete',

  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,

  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ps_family ON public.program_subscriptions(family_id);
CREATE INDEX IF NOT EXISTS idx_ps_parent ON public.program_subscriptions(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_ps_customer ON public.program_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_ps_status ON public.program_subscriptions(status);

ALTER TABLE public.program_subscriptions ENABLE ROW LEVEL SECURITY;

-- Parent can read their own family's subscriptions
DO $$ BEGIN
  CREATE POLICY program_subs_family_read ON public.program_subscriptions
    FOR SELECT USING (
      parent_user_id = auth.uid()
      OR family_id IN (
        SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin/super_admin full access
DO $$ BEGIN
  CREATE POLICY program_subs_admin ON public.program_subscriptions
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.users_profile
        WHERE users_profile.id = auth.uid()
          AND users_profile.role IN ('admin', 'super_admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.tg_program_subscriptions_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS program_subscriptions_touch ON public.program_subscriptions;
CREATE TRIGGER program_subscriptions_touch
BEFORE UPDATE ON public.program_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.tg_program_subscriptions_touch_updated_at();
