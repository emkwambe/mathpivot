-- Migration 00056: Subscription invoices ledger
-- Records every successful Stripe recurring charge. Feeds the admin
-- Revenue tile so monthly coaching revenue is visible alongside one-time
-- summer-clinic purchases. Keyed by stripe_invoice_id — the webhook
-- upserts on this key so Stripe retries are idempotent.

CREATE TABLE IF NOT EXISTS public.subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  program_subscription_id UUID REFERENCES public.program_subscriptions(id) ON DELETE SET NULL,

  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,

  amount_paid_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',

  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  paid_at TIMESTAMPTZ NOT NULL,

  hosted_invoice_url TEXT,
  invoice_pdf_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_inv_program_sub
  ON public.subscription_invoices(program_subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_inv_stripe_sub
  ON public.subscription_invoices(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_inv_paid_at
  ON public.subscription_invoices(paid_at);

ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;

-- Parent can read their own family's invoices.
DO $$ BEGIN
  CREATE POLICY sub_inv_family_read ON public.subscription_invoices
    FOR SELECT USING (
      program_subscription_id IN (
        SELECT id FROM public.program_subscriptions
        WHERE parent_user_id = auth.uid()
          OR family_id IN (
            SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
          )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin/super_admin full access.
DO $$ BEGIN
  CREATE POLICY sub_inv_admin ON public.subscription_invoices
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.users_profile
        WHERE users_profile.id = auth.uid()
          AND users_profile.role IN ('admin', 'super_admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
