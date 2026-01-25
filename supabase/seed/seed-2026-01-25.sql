-- ============================================================================
-- MATHPIVOT TUTOROS - SEED DATA
-- Programs, Competitions, Certifications, and Career Pathways
-- UPDATED: Matches actual migration schemas
-- ============================================================================

-- ============================================================================
-- CAREER PATHWAYS (matches 00007_programs_competitions.sql)
-- ============================================================================

INSERT INTO career_pathways (id, code, name, description, icon_url, color, target_grades, prerequisite_tracks, career_outcomes, certifications, is_active, order_index) VALUES
-- STEM Careers
('a1000001-0000-0000-0000-000000000001', 'data-science', 'Data Science & Analytics',
 'Master the mathematical foundations for a career in data science, machine learning, and business analytics. Strong emphasis on statistics, probability, and computational thinking.',
 '/icons/chart-bar.svg', '#3B82F6',
 ARRAY[9,10,11,12],
 ARRAY['ap_stats', 'pre_calc']::course_track[],
 ARRAY['Data Scientist', 'Business Analyst', 'Machine Learning Engineer'],
 ARRAY['AWS Data Analytics', 'Google Data Analytics'],
 true, 1),

('a1000001-0000-0000-0000-000000000002', 'engineering', 'Engineering',
 'Build the math skills essential for mechanical, electrical, civil, and aerospace engineering. Focus on calculus, physics applications, and problem-solving.',
 '/icons/cog.svg', '#10B981',
 ARRAY[9,10,11,12],
 ARRAY['ap_calc_ab', 'ap_calc_bc']::course_track[],
 ARRAY['Mechanical Engineer', 'Electrical Engineer', 'Civil Engineer', 'Aerospace Engineer'],
 ARRAY['FE Exam', 'PE License'],
 true, 2),

('a1000001-0000-0000-0000-000000000003', 'computer-science', 'Computer Science',
 'Develop mathematical thinking for software development, algorithms, and computational theory. Emphasis on discrete math, logic, and algorithmic thinking.',
 '/icons/code.svg', '#8B5CF6',
 ARRAY[9,10,11,12],
 ARRAY['pre_calc', 'ap_calc_ab']::course_track[],
 ARRAY['Software Engineer', 'Data Engineer', 'Systems Architect'],
 ARRAY['AWS Solutions Architect', 'CompTIA'],
 true, 3),

('a1000001-0000-0000-0000-000000000004', 'finance', 'Finance & Economics',
 'Prepare for careers in investment banking, financial analysis, and economics. Strong focus on statistics, modeling, and quantitative reasoning.',
 '/icons/currency-dollar.svg', '#F59E0B',
 ARRAY[10,11,12],
 ARRAY['ap_stats', 'pre_calc']::course_track[],
 ARRAY['Financial Analyst', 'Investment Banker', 'Economist', 'Quantitative Analyst'],
 ARRAY['CFA Level 1', 'FRM'],
 true, 4),

('a1000001-0000-0000-0000-000000000005', 'actuarial', 'Actuarial Science',
 'Comprehensive path to actuarial credentials. Master probability, statistics, and financial mathematics for insurance and risk management careers.',
 '/icons/calculator.svg', '#EF4444',
 ARRAY[10,11,12],
 ARRAY['ap_calc_bc', 'ap_stats']::course_track[],
 ARRAY['Actuary', 'Risk Analyst', 'Insurance Underwriter'],
 ARRAY['SOA Exam P', 'SOA Exam FM', 'CAS Exam 1'],
 true, 5),

('a1000001-0000-0000-0000-000000000006', 'healthcare', 'Healthcare & Medicine',
 'Math foundations for pre-med, nursing, pharmacy, and healthcare administration. Includes biostatistics and dosage calculations.',
 '/icons/heart.svg', '#EC4899',
 ARRAY[9,10,11,12],
 ARRAY['pre_calc', 'ap_stats']::course_track[],
 ARRAY['Physician', 'Pharmacist', 'Nurse', 'Healthcare Administrator'],
 ARRAY['MCAT Math', 'PCAT Math'],
 true, 6)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  career_outcomes = EXCLUDED.career_outcomes;

-- ============================================================================
-- PROGRAMS (matches 00007_programs_competitions.sql)
-- ============================================================================

INSERT INTO programs (id, name, slug, description, program_type, career_pathway_id, start_date, end_date, schedule_details, min_participants, max_participants, price_cents, early_bird_price_cents, early_bird_deadline, min_grade, max_grade, modality, location_name, materials_included, status, featured) VALUES
-- Summer Math Camps
('b1000001-0000-0000-0000-000000000001', 'Summer Math Intensive', 'summer-intensive-2026',
 'An immersive 2-week program designed to accelerate math skills. Students work in small groups, tackling challenging problems and building confidence.',
 'camp', NULL,
 '2026-07-14', '2026-07-28',
 '{"time": "9am-3pm", "days": "Mon-Fri", "breaks": "Lunch 12-1pm"}',
 8, 24, 129900, 99900, '2026-05-01',
 6, 9, 'in_person', 'MathPivot Learning Center',
 ARRAY['Materials', 'Snacks', 'Certificate'],
 'registration_open', true),

('b1000001-0000-0000-0000-000000000002', 'Algebra Bootcamp', 'algebra-bootcamp-2026',
 'Intensive 5-day bootcamp to master algebra fundamentals. Perfect for students preparing for high school math or needing to strengthen their foundation.',
 'bootcamp', NULL,
 '2026-06-16', '2026-06-20',
 '{"time": "10am-2pm", "days": "Mon-Fri"}',
 6, 16, 59900, 49900, '2026-04-15',
 7, 10, 'hybrid', 'MathPivot Learning Center + Online',
 ARRAY['Workbook', 'Online resources', 'Certificate'],
 'registration_open', false),

('b1000001-0000-0000-0000-000000000003', 'SAT Math Prep Workshop', 'sat-prep-spring-2026',
 'Comprehensive SAT math preparation covering all tested topics, strategies, and practice tests. Includes personalized score analysis.',
 'workshop', NULL,
 '2026-03-01', '2026-04-15',
 '{"sessions": 8, "duration": "2 hours each"}',
 5, 20, 39900, NULL, NULL,
 10, 12, 'online', 'Online via Zoom',
 ARRAY['Practice tests', 'Strategy guide', 'Score analysis'],
 'published', true),

('b1000001-0000-0000-0000-000000000004', 'Geometry Clinic', 'geometry-clinic-2026',
 'Targeted clinic for students struggling with geometry concepts. Focus on proofs, spatial reasoning, and problem-solving techniques.',
 'clinic', NULL,
 '2026-04-05', '2026-04-05',
 '{"time": "9am-4pm", "format": "Full day workshop"}',
 5, 12, 29900, NULL, NULL,
 8, 11, 'in_person', 'MathPivot Learning Center',
 ARRAY['Workbook', 'Geometry toolkit'],
 'published', false),

('b1000001-0000-0000-0000-000000000005', 'AP Calculus Summer Review', 'ap-calc-review-2026',
 'Two-week intensive review for students who completed AP Calculus AB or BC. Solidify concepts before the next academic year.',
 'camp', NULL,
 '2026-08-04', '2026-08-15',
 '{"time": "10am-1pm", "days": "Mon-Fri"}',
 6, 16, 89900, 74900, '2026-06-01',
 11, 12, 'hybrid', 'MathPivot Learning Center + Online',
 ARRAY['Review materials', 'Practice AP exams', '1-on-1 session'],
 'draft', false),

-- Competition program (required for competitions)
('b1000001-0000-0000-0000-000000000010', 'MathPivot Problem Solving Championship', 'mpsc-2026',
 'Annual competition testing mathematical problem-solving skills across multiple rounds. Top performers qualify for the national finals.',
 'competition', NULL,
 '2026-03-15', '2026-05-20',
 '{"rounds": ["School", "Regional", "State", "National"], "divisions": ["Junior (6-8)", "Senior (9-12)"]}',
 10, 200, 2500, NULL, NULL,
 6, 12, 'hybrid', 'Multiple Locations',
 ARRAY['Competition materials', 'Certificate'],
 'published', true),

('b1000001-0000-0000-0000-000000000011', 'Team Math Challenge', 'team-challenge-2026',
 'Collaborative competition where teams of 4 solve complex multi-step problems. Emphasizes teamwork and communication.',
 'competition', NULL,
 '2026-04-20', '2026-04-20',
 '{"format": "3 rounds - Individual, Team, Relay", "duration": "Full day"}',
 8, 80, 5000, NULL, NULL,
 7, 11, 'in_person', 'MathPivot Learning Center',
 ARRAY['Team materials', 'Medals'],
 'published', false),

('b1000001-0000-0000-0000-000000000012', 'Mental Math Marathon', 'mental-math-2026',
 'Speed-based competition focusing on mental calculation skills. No calculators allowed!',
 'competition', NULL,
 '2026-02-28', '2026-02-28',
 '{"format": "Timed online rounds", "categories": ["Arithmetic", "Fractions", "Percentages"]}',
 10, 500, 1500, NULL, NULL,
 5, 10, 'online', 'Online Platform',
 ARRAY['Certificate'],
 'published', false),

('b1000001-0000-0000-0000-000000000013', 'MathPivot Hackathon', 'math-hackathon-2026',
 'Apply math to real-world problems in this 24-hour hackathon. Teams use data analysis and mathematical modeling.',
 'hackathon', 'a1000001-0000-0000-0000-000000000001',
 '2026-06-14', '2026-06-15',
 '{"themes": ["Environmental modeling", "Healthcare optimization", "Financial analysis"], "duration": "24 hours"}',
 10, 100, 0, NULL, NULL,
 9, 12, 'hybrid', 'MathPivot Learning Center + Online',
 ARRAY['Mentorship', 'Food provided', 'Prizes'],
 'published', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status;

-- ============================================================================
-- COMPETITIONS (linked to program via program_id)
-- ============================================================================

INSERT INTO competitions (id, program_id, format, team_size_min, team_size_max, num_rounds, time_limit_minutes, max_score, scoring_rules, prizes, rules_url) VALUES
('c1000001-0000-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000010',
 'individual', NULL, NULL, 4, 60, 100,
 '{"per_problem": 10, "bonus": "time_remaining"}',
 '[{"place": 1, "prize": "Trophy + $500 scholarship", "value_cents": 50000}, {"place": 2, "prize": "Trophy + $250 scholarship", "value_cents": 25000}, {"place": 3, "prize": "Trophy + $100 scholarship", "value_cents": 10000}]',
 NULL),

('c1000001-0000-0000-0000-000000000002', 'b1000001-0000-0000-0000-000000000011',
 'team', 4, 4, 3, 90, 150,
 '{"individual_round": 50, "team_round": 50, "relay_round": 50}',
 '[{"place": 1, "prize": "Team trophies + individual medals", "value_cents": 0}, {"place": 2, "prize": "Individual medals", "value_cents": 0}, {"place": 3, "prize": "Certificates", "value_cents": 0}]',
 NULL),

('c1000001-0000-0000-0000-000000000003', 'b1000001-0000-0000-0000-000000000012',
 'individual', NULL, NULL, 5, 30, 50,
 '{"per_correct": 1, "penalty": 0}',
 '[{"place": 1, "prize": "Gold medal", "value_cents": 0}, {"place": 2, "prize": "Silver medal", "value_cents": 0}, {"place": 3, "prize": "Bronze medal", "value_cents": 0}]',
 NULL),

('c1000001-0000-0000-0000-000000000004', 'b1000001-0000-0000-0000-000000000013',
 'team', 2, 5, 1, NULL, NULL,
 '{"criteria": ["innovation", "math_complexity", "presentation", "practicality"]}',
 '[{"place": 1, "prize": "$1000 cash prize", "value_cents": 100000}, {"place": 2, "prize": "$500 cash prize", "value_cents": 50000}, {"place": 3, "prize": "$250 cash prize", "value_cents": 25000}]',
 NULL)
ON CONFLICT (id) DO UPDATE SET
  prizes = EXCLUDED.prizes;

-- ============================================================================
-- CERTIFICATION PROGRAMS (matches 00009_certifications.sql)
-- ============================================================================

INSERT INTO certification_programs (id, code, name, description, short_description, cert_type, level, category, badge_image_url, badge_color, estimated_hours, difficulty_rating, target_audience, grade_level_min, grade_level_max, is_active, display_order) VALUES
-- Foundation Certifications
('d1000001-0000-0000-0000-000000000001', 'ALG-FOUND', 'Algebra Foundations',
 'Demonstrates mastery of core algebra concepts including equations, inequalities, and functions. This certification validates that a student has a solid foundation for higher mathematics.',
 'Master core algebra concepts',
 'skill_mastery', 'foundation', 'algebra',
 '/badges/algebra-foundations.svg', '#3B82F6',
 20, 2, 'student', 7, 9, true, 1),

('d1000001-0000-0000-0000-000000000002', 'GEO-FOUND', 'Geometry Essentials',
 'Certifies understanding of geometric principles, proofs, and spatial reasoning. Students will demonstrate proficiency in angles, triangles, circles, and basic proof techniques.',
 'Master geometry principles',
 'skill_mastery', 'foundation', 'geometry',
 '/badges/geometry-essentials.svg', '#10B981',
 25, 2, 'student', 8, 10, true, 2),

-- Intermediate Certifications
('d1000001-0000-0000-0000-000000000003', 'ALG-ADV', 'Advanced Algebra',
 'Recognition of advanced algebraic skills including polynomials, rational expressions, and systems of equations. Builds upon Algebra Foundations.',
 'Advanced algebraic problem-solving',
 'skill_mastery', 'silver', 'algebra',
 '/badges/advanced-algebra.svg', '#6366F1',
 30, 3, 'student', 9, 11, true, 3),

('d1000001-0000-0000-0000-000000000004', 'TRIG-PROF', 'Trigonometry Proficiency',
 'Validates mastery of trigonometric functions, identities, and applications. Essential for students pursuing STEM fields.',
 'Complete trigonometry mastery',
 'skill_mastery', 'silver', 'trigonometry',
 '/badges/trigonometry.svg', '#F59E0B',
 35, 3, 'student', 10, 12, true, 4),

-- Advanced Certifications
('d1000001-0000-0000-0000-000000000005', 'PRECALC-GOLD', 'Pre-Calculus Mastery',
 'Comprehensive certification covering all pre-calculus topics preparing students for calculus. Includes advanced functions, limits introduction, and sequences.',
 'Complete pre-calculus preparation',
 'skill_mastery', 'gold', 'pre-calculus',
 '/badges/precalculus.svg', '#8B5CF6',
 50, 4, 'student', 10, 12, true, 5),

('d1000001-0000-0000-0000-000000000006', 'AP-CALC-READY', 'AP Calculus Ready',
 'Certifies readiness for AP Calculus coursework with strong foundations in limits, derivatives, and integrals. Ideal preparation for the AP exam.',
 'Ready for AP Calculus',
 'skill_mastery', 'gold', 'calculus',
 '/badges/ap-calculus-ready.svg', '#EF4444',
 60, 4, 'student', 11, 12, true, 6),

-- Expert/Career Certifications
('d1000001-0000-0000-0000-000000000007', 'STATS-EXPERT', 'Statistics & Probability Expert',
 'Expert-level certification in statistical analysis and probability theory. Prepares students for data science and actuarial careers.',
 'Expert statistical analysis',
 'career_pathway', 'platinum', 'statistics',
 '/badges/stats-expert.svg', '#EC4899',
 80, 5, 'student', 11, 12, true, 7),

('d1000001-0000-0000-0000-000000000008', 'PROB-SOLVER', 'Mathematical Problem Solver',
 'Elite certification recognizing exceptional mathematical problem-solving abilities across domains. Requires competition achievements and portfolio.',
 'Elite problem-solving recognition',
 'competition_prep', 'expert', 'problem-solving',
 '/badges/problem-solver.svg', '#F97316',
 100, 5, 'student', 9, 12, true, 8)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- ============================================================================
-- SAMPLE PRODUCTS
-- ============================================================================

INSERT INTO products (id, name, description, product_type, credits, price_cents, currency, is_active, stripe_product_id, metadata) VALUES
('e1000001-0000-0000-0000-000000000001', 'Single Session', '1 tutoring session credit', 'package', 1, 7500, 'USD', true, null, '{"popular": false}'),
('e1000001-0000-0000-0000-000000000002', '5 Session Pack', '5 tutoring sessions - Save 10%', 'package', 5, 33750, 'USD', true, null, '{"popular": true, "savings": "10%"}'),
('e1000001-0000-0000-0000-000000000003', '10 Session Pack', '10 tutoring sessions - Save 15%', 'package', 10, 63750, 'USD', true, null, '{"popular": false, "savings": "15%"}'),
('e1000001-0000-0000-0000-000000000004', '20 Session Pack', '20 tutoring sessions - Save 20%', 'package', 20, 120000, 'USD', true, null, '{"popular": false, "savings": "20%", "best_value": true}'),
('e1000001-0000-0000-0000-000000000005', 'Monthly Unlimited', 'Unlimited sessions per month', 'subscription', 999, 49900, 'USD', true, null, '{"billing": "monthly", "features": ["Unlimited sessions", "Priority booking", "Progress reports"]}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_cents = EXCLUDED.price_cents;
