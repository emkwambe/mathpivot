-- supabase/seed/service-packages.sql
-- Purpose: Seed initial service packages for all three tiers.
-- Run after migration 00016_service_tiers.sql

DELETE FROM service_packages WHERE slug IN (
  'single-session', 'starter-4-pack', 'booster-8-pack',
  'growth-monthly', 'growth-quarterly',
  'elite-monthly', 'elite-semester', 'elite-annual'
);

-- TIER 1: TUTORING
INSERT INTO service_packages
  (name, slug, tagline, description, service_tier, billing_type, price_cents,
   credits_per_period, session_duration_minutes, guide_level_required,
   requires_diagnostic, is_active, is_featured, display_order, feature_gates)
VALUES
  ('Single Session', 'single-session',
   'Get unstuck on any math topic',
   'One 60-minute session with a Guide I coach. Perfect for homework help, test prep review, or working through a specific concept.',
   'TIER_TUTORING', 'one_time', 5000, 1, 60, 'GUIDE_I', false, true, false, 10,
   '{"ai_tutor":false,"career_pathways":false,"competition_prep":false,"advanced_certifications":false,"weekly_reports":false,"parent_meetings":false,"async_support":false,"priority_scheduling":false}'),

  ('Starter 4-Pack', 'starter-4-pack',
   'Build momentum with 4 focused sessions',
   'Four 60-minute sessions with a Guide I coach. Use at your own pace. Ideal for targeted test prep or filling specific skill gaps.',
   'TIER_TUTORING', 'one_time', 18000, 4, 60, 'GUIDE_I', false, true, true, 20,
   '{"ai_tutor":false,"career_pathways":false,"competition_prep":false,"advanced_certifications":false,"weekly_reports":false,"parent_meetings":false,"async_support":false,"priority_scheduling":false}'),

  ('Booster 8-Pack', 'booster-8-pack',
   'Serious practice for serious results',
   'Eight 60-minute sessions with a Guide I coach. Best value per session. Great for EOG/EOC prep or sustained skill building.',
   'TIER_TUTORING', 'one_time', 32000, 8, 60, 'GUIDE_I', false, true, false, 30,
   '{"ai_tutor":false,"career_pathways":false,"competition_prep":false,"advanced_certifications":false,"weekly_reports":false,"parent_meetings":false,"async_support":false,"priority_scheduling":false}');

-- TIER 2: COACHING
INSERT INTO service_packages
  (name, slug, tagline, description, service_tier, billing_type, price_cents,
   credits_per_period, rollover_credits, max_rollover, session_duration_minutes,
   guide_level_required, requires_diagnostic, is_active, is_featured, display_order, feature_gates)
VALUES
  ('Growth Monthly', 'growth-monthly',
   'Weekly coaching with a personalized plan',
   'Four 60-minute weekly sessions with a dedicated Guide II coach. Includes diagnostic assessment, structured learning plan, weekly progress reports, AI Tutor access, and monthly parent check-in.',
   'TIER_COACHING', 'monthly', 25000, 4, true, 2, 60, 'GUIDE_II', true, true, true, 40,
   '{"ai_tutor":true,"career_pathways":"explore","competition_prep":"group","advanced_certifications":true,"weekly_reports":true,"parent_meetings":"monthly","async_support":false,"priority_scheduling":false}'),

  ('Growth Quarterly', 'growth-quarterly',
   'Commit to a quarter of growth - save 10 percent',
   'Twelve sessions over 3 months with a dedicated Guide II coach. Same benefits as Growth Monthly with 10 percent savings. Unused sessions roll over (max 2).',
   'TIER_COACHING', 'quarterly', 67500, 12, true, 2, 60, 'GUIDE_II', true, true, false, 50,
   '{"ai_tutor":true,"career_pathways":"explore","competition_prep":"group","advanced_certifications":true,"weekly_reports":true,"parent_meetings":"monthly","async_support":false,"priority_scheduling":false}');

-- TIER 3: MENTORSHIP
INSERT INTO service_packages
  (name, slug, tagline, description, service_tier, billing_type, price_cents,
   credits_per_period, rollover_credits, max_rollover, session_duration_minutes,
   guide_level_required, min_eligibility_tier, requires_diagnostic,
   is_active, is_featured, display_order, feature_gates)
VALUES
  ('Elite Monthly', 'elite-monthly',
   'Personalized mentorship for future math leaders',
   'Eight sessions per month with a dedicated Guide III mentor. Full access to AI Tutor, career pathway planning, individual competition prep, advanced certifications, bi-weekly parent meetings, and async support.',
   'TIER_MENTORSHIP', 'monthly', 50000, 8, true, 2, 60,
   'GUIDE_III', 'TIER_2_DEVELOPER', true, true, false, 60,
   '{"ai_tutor":true,"career_pathways":"full","competition_prep":"individual","advanced_certifications":true,"weekly_reports":true,"parent_meetings":"biweekly","async_support":true,"priority_scheduling":true}'),

  ('Elite Semester', 'elite-semester',
   'A semester of transformation - best value',
   'Forty sessions over 5 months with a dedicated Guide III mentor. All Elite benefits with significant savings. Includes quarterly progress portfolio and college-prep pathway review.',
   'TIER_MENTORSHIP', 'semester', 250000, 40, true, 4, 60,
   'GUIDE_III', 'TIER_2_DEVELOPER', true, true, true, 70,
   '{"ai_tutor":true,"career_pathways":"full","competition_prep":"individual","advanced_certifications":true,"weekly_reports":true,"parent_meetings":"biweekly","async_support":true,"priority_scheduling":true}'),

  ('Elite Annual', 'elite-annual',
   'Full-year mentorship commitment - maximum impact',
   'Eighty sessions over 10 months with a dedicated Guide III mentor. All Elite benefits plus priority guide selection, annual progress portfolio, and personalized college/career pathway roadmap.',
   'TIER_MENTORSHIP', 'annual', 450000, 80, true, 4, 60,
   'GUIDE_III', 'TIER_2_DEVELOPER', true, true, false, 80,
   '{"ai_tutor":true,"career_pathways":"full","competition_prep":"individual","advanced_certifications":true,"weekly_reports":true,"parent_meetings":"biweekly","async_support":true,"priority_scheduling":true}');
