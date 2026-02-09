-- ============================================================================
-- GUIDE MODEL SEED DATA
-- Populates guide levels, career pathways, and tiered programs
-- ============================================================================

-- =============================================================================
-- GUIDE LEVELS
-- =============================================================================

INSERT INTO guide_levels (
  id, level_code, name, description,
  coach_focus_percent, mentor_focus_percent,
  min_experience_years, required_certifications,
  hourly_rate_min, hourly_rate_max,
  max_students, training_hours_required,
  is_active, display_order
) VALUES
-- GUIDE I: 80% Coach, 20% Mentor (Entry-level, skill-focused)
(
  'g1000001-0000-0000-0000-000000000001',
  'GUIDE_I',
  'Math Development Guide I',
  'Entry-level guide focusing primarily on skill development with introductory mentorship. Ideal for younger students or those building foundations.',
  80, 20,
  2,
  ARRAY['Teaching Certification', 'MathPivot Guide I Training'],
  50.00, 75.00,
  15,
  40,
  true, 1
),

-- GUIDE II: 50% Coach, 50% Mentor (Balanced)
(
  'g1000001-0000-0000-0000-000000000002',
  'GUIDE_II',
  'Math Development Guide II',
  'Balanced guide equally skilled in coaching and mentoring. Develops skills while providing career and pathway guidance.',
  50, 50,
  4,
  ARRAY['Advanced Teaching Certification', 'MathPivot Guide II Training', 'Industry Experience or Advanced Degree'],
  75.00, 110.00,
  12,
  60,
  true, 2
),

-- GUIDE III: 20% Coach, 80% Mentor (Advanced)
(
  'g1000001-0000-0000-0000-000000000003',
  'GUIDE_III',
  'Math Development Guide III',
  'Advanced guide focusing on mentorship, career guidance, and inspiration. For students with strong foundations seeking direction.',
  20, 80,
  6,
  ARRAY['PhD or Industry Leadership', 'MathPivot Guide III Training', 'Competition/Research Achievements'],
  110.00, 150.00,
  8,
  80,
  true, 3
),

-- SPECIALIST: Competition/Research Focus
(
  'g1000001-0000-0000-0000-000000000004',
  'GUIDE_SPECIALIST',
  'Math Specialist Guide',
  'Expert in specific domains (competitions, research, industry applications). Highly focused mentorship for exceptional students.',
  30, 70,
  5,
  ARRAY['Domain Expertise Certification', 'MathPivot Specialist Training', 'Proven Track Record'],
  125.00, 200.00,
  6,
  100,
  true, 4
)
ON CONFLICT (level_code) DO UPDATE SET
  coach_focus_percent = EXCLUDED.coach_focus_percent,
  mentor_focus_percent = EXCLUDED.mentor_focus_percent,
  hourly_rate_min = EXCLUDED.hourly_rate_min,
  hourly_rate_max = EXCLUDED.hourly_rate_max;

-- =============================================================================
-- CAREER PATHWAYS - Update with Guide Specializations
-- =============================================================================

-- Update existing career pathways with guide requirements
UPDATE career_pathways SET
  guide_specializations = ARRAY['Guide II', 'Guide III']::guide_level[],
  target_grades = ARRAY[9,10,11,12]
WHERE code = 'data_science';

UPDATE career_pathways SET
  guide_specializations = ARRAY['Guide II', 'Guide III']::guide_level[],
  target_grades = ARRAY[10,11,12]
WHERE code = 'actuarial';

-- Insert new pathways if they don't exist
INSERT INTO career_pathways (
  id, code, name, description, icon_url, color,
  target_grades, guide_specializations, prerequisite_tracks,
  career_outcomes, certifications, is_active, order_index
) VALUES
-- Academic Foundation (for younger students)
(
  'a1000001-0000-0000-0000-000000000007',
  'academic-foundation',
  'Academic Foundation',
  'Build strong mathematical fundamentals for students exploring interests or preparing for advanced pathways.',
  '/icons/academic-cap.svg', '#8B5CF6',
  ARRAY[6,7,8,9],
  ARRAY['Guide I']::guide_level[],
  ARRAY['algebra_1', 'geometry']::course_track[],
  ARRAY['High School Math Success', 'STEM Preparation', 'Competition Readiness'],
  ARRAY['Algebra Foundations', 'Geometry Essentials'],
  true, 7
),

-- Competition Pathway
(
  'a1000001-0000-0000-0000-000000000008',
  'competition',
  'Mathematical Competitions',
  'Prepare for AMC, MathCounts, and other mathematics competitions. Advanced problem-solving and strategy.',
  '/icons/trophy.svg', '#F59E0B',
  ARRAY[6,7,8,9,10,11,12],
  ARRAY['Guide II', 'Guide III']::guide_level[],
  ARRAY[]::course_track[],
  ARRAY['Competition Champion', 'Math Olympian', 'Problem Solving Expert'],
  ARRAY['AMC 10/12 Qualifier', 'AIME Qualifier', 'MathCounts State/National'],
  true, 8
),

-- Engineering
(
  'a1000001-0000-0000-0000-000000000002',
  'engineering',
  'Engineering',
  'Build math skills for mechanical, electrical, civil, and aerospace engineering. Focus on calculus and problem-solving.',
  '/icons/cog.svg', '#10B981',
  ARRAY[10,11,12],
  ARRAY['Guide II', 'Guide III']::guide_level[],
  ARRAY['ap_calc_ab', 'ap_calc_bc']::course_track[],
  ARRAY['Mechanical Engineer', 'Electrical Engineer', 'Civil Engineer', 'Aerospace Engineer'],
  ARRAY['FE Exam', 'PE License'],
  true, 2
),

-- Computer Science
(
  'a1000001-0000-0000-0000-000000000003',
  'computer-science',
  'Computer Science',
  'Develop mathematical thinking for software development, algorithms, and computational theory.',
  '/icons/code.svg', '#8B5CF6',
  ARRAY[9,10,11,12],
  ARRAY['Guide I', 'Guide II', 'Guide III']::guide_level[],
  ARRAY['pre_calc', 'ap_calc_ab']::course_track[],
  ARRAY['Software Engineer', 'Data Engineer', 'AI Researcher'],
  ARRAY['AWS Solutions Architect', 'Google Cloud Certifications'],
  true, 3
),

-- Finance
(
  'a1000001-0000-0000-0000-000000000004',
  'finance',
  'Finance & Economics',
  'Prepare for careers in investment banking, financial analysis, and economics.',
  '/icons/currency-dollar.svg', '#F59E0B',
  ARRAY[11,12],
  ARRAY['Guide III']::guide_level[],
  ARRAY['ap_stats', 'pre_calc']::course_track[],
  ARRAY['Financial Analyst', 'Investment Banker', 'Economist', 'Quantitative Analyst'],
  ARRAY['CFA Level 1', 'FRM'],
  true, 4
),

-- Healthcare
(
  'a1000001-0000-0000-0000-000000000006',
  'healthcare',
  'Healthcare & Medicine',
  'Math foundations for pre-med, nursing, pharmacy, and healthcare administration.',
  '/icons/heart.svg', '#EC4899',
  ARRAY[10,11,12],
  ARRAY['Guide II', 'Guide III']::guide_level[],
  ARRAY['pre_calc', 'ap_stats']::course_track[],
  ARRAY['Physician', 'Pharmacist', 'Nurse Practitioner', 'Medical Researcher'],
  ARRAY['MCAT Math', 'Biostatistics Certification'],
  true, 6
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  guide_specializations = EXCLUDED.guide_specializations,
  target_grades = EXCLUDED.target_grades;

-- =============================================================================
-- GUIDE COMPENSATION PLANS
-- =============================================================================

INSERT INTO guide_compensation_plans (
  guide_level_code, base_rate_per_hour, commission_percent,
  session_bonus, retention_bonus, outcome_bonus_rules,
  health_stipend, training_budget, technology_allowance,
  effective_date, is_active
) VALUES
-- Guide I Compensation
(
  'GUIDE_I', 45.00, 10.00,
  25.00, 100.00,
  '{"grade_improvement": 50, "competition_qualification": 100, "program_completion": 75}'::JSONB,
  200.00, 500.00, 50.00,
  '2026-01-01', true
),

-- Guide II Compensation
(
  'GUIDE_II', 65.00, 15.00,
  35.00, 150.00,
  '{"grade_improvement": 75, "competition_advancement": 150, "research_project": 200}'::JSONB,
  300.00, 750.00, 75.00,
  '2026-01-01', true
),

-- Guide III Compensation
(
  'GUIDE_III', 95.00, 20.00,
  50.00, 250.00,
  '{"national_competition": 500, "research_publication": 1000, "college_admission": 750}'::JSONB,
  500.00, 1500.00, 100.00,
  '2026-01-01', true
),

-- Specialist Compensation
(
  'GUIDE_SPECIALIST', 120.00, 25.00,
  75.00, 350.00,
  '{"olympiad_qualification": 1000, "major_publication": 1500, "industry_placement": 1000}'::JSONB,
  600.00, 2000.00, 150.00,
  '2026-01-01', true
)
ON CONFLICT (guide_level_code, effective_date) DO UPDATE SET
  base_rate_per_hour = EXCLUDED.base_rate_per_hour,
  commission_percent = EXCLUDED.commission_percent;

-- =============================================================================
-- TIERED PRODUCTS
-- =============================================================================

-- Tier 1: Explorer Packages (Guide I, Score 16-19)
INSERT INTO products (
  id, name, description, product_type,
  guide_level_required, eligibility_tier_required,
  credits, price_cents, currency, is_active
) VALUES
(
  'e1000001-0000-0000-0000-000000000010',
  'Explorer Starter Pack',
  '4 sessions with Guide I (80% coaching, 20% mentoring). Perfect for students beginning their math journey.',
  'package', 'GUIDE_I', 'TIER_1_EXPLORER',
  4, 27900, 'USD', true
),
(
  'e1000001-0000-0000-0000-000000000011',
  'Explorer Monthly',
  'Monthly subscription with Guide I. 4 sessions/month + weekly check-ins.',
  'subscription', 'GUIDE_I', 'TIER_1_EXPLORER',
  4, 34900, 'USD', true
),

-- Tier 2: Developer Packages (Guide II, Score 20-22)
(
  'e1000001-0000-0000-0000-000000000012',
  'Developer Intensive',
  '8 sessions with Guide II (50/50 balance). Develop skills while exploring pathways.',
  'package', 'GUIDE_II', 'TIER_2_DEVELOPER',
  8, 79900, 'USD', true
),
(
  'e1000001-0000-0000-0000-000000000013',
  'Developer Quarterly',
  'Quarterly subscription with Guide II. 12 sessions + project mentorship.',
  'subscription', 'GUIDE_II', 'TIER_2_DEVELOPER',
  12, 99900, 'USD', true
),

-- Tier 3: Accelerator Packages (Guide III, Score 23-25)
(
  'e1000001-0000-0000-0000-000000000014',
  'Accelerator Elite',
  '12 sessions with Guide III (20% coaching, 80% mentoring). For advanced students.',
  'package', 'GUIDE_III', 'TIER_3_ACCELERATOR',
  12, 179900, 'USD', true
),
(
  'e1000001-0000-0000-0000-000000000015',
  'Accelerator Annual',
  'Annual subscription with Guide III. 48 sessions with PhD/industry mentor.',
  'subscription', 'GUIDE_III', 'TIER_3_ACCELERATOR',
  48, 599900, 'USD', true
),

-- Specialized Packages
(
  'e1000001-0000-0000-0000-000000000016',
  'Competition Prep Package',
  'Competition-focused mentorship with Specialist Guide. Mock tests and strategy.',
  'package', 'GUIDE_SPECIALIST', NULL,
  10, 149900, 'USD', true
),
(
  'e1000001-0000-0000-0000-000000000017',
  'Research Mentorship',
  'One-on-one research mentorship for original mathematical research.',
  'package', 'GUIDE_SPECIALIST', NULL,
  16, 249900, 'USD', true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  guide_level_required = EXCLUDED.guide_level_required,
  eligibility_tier_required = EXCLUDED.eligibility_tier_required;

-- =============================================================================
-- SUMMARY
-- =============================================================================

/*
Guide Model Summary:

1. GUIDE LEVELS:
   - Guide I:  80% coach, 20% mentor ($50-75/hr) - Foundation building
   - Guide II: 50% coach, 50% mentor ($75-110/hr) - Balanced development
   - Guide III: 20% coach, 80% mentor ($110-150/hr) - Advanced mentorship
   - Specialist: 30% coach, 70% mentor ($125-200/hr) - Domain expertise

2. ELIGIBILITY TIERS (based on 5-factor assessment):
   - Tier 1 Explorer: Score 16-19 - Guide I programs
   - Tier 2 Developer: Score 20-22 - Guide II programs
   - Tier 3 Accelerator: Score 23-25 - Guide III programs

3. PRODUCTS aligned to tiers:
   - Explorer packages: $279-349 (4 sessions)
   - Developer packages: $799-999 (8-12 sessions)
   - Accelerator packages: $1799-5999 (12-48 sessions)

4. CAREER PATHWAYS with guide requirements:
   - Academic Foundation: Guide I (grades 6-9)
   - Competition: Guide II-III (all grades)
   - STEM careers: Guide II-III (grades 9-12)
   - Finance/Actuarial: Guide III (grades 11-12)
*/
