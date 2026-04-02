-- ============================================================================
-- MATHPIVOT TUTOROS - COMPLETE REFERENCE DATA
--
-- Run this single file to seed all reference data:
-- - Skills (Math 1, Math 3, Career-specific)
-- - Products (packages, subscriptions, tiered)
-- - Career Pathways
-- - Guide Levels & Compensation
-- - Certifications & Assessments
--
-- Run order: After all migrations, before demo data
-- ============================================================================

-- =============================================================================
-- SECTION 1: SKILLS
-- =============================================================================

-- Math 1 Skills (typically 9th grade)
INSERT INTO skills (id, course_track, code, name, description, category, order_index) VALUES
-- Number & Quantity
(uuid_generate_v4(), 'math_1', 'M1-NQ-01', 'Real Number System', 'Understand properties of rational and irrational numbers', 'Number & Quantity', 1),
(uuid_generate_v4(), 'math_1', 'M1-NQ-02', 'Exponent Properties', 'Apply properties of exponents to simplify expressions', 'Number & Quantity', 2),
(uuid_generate_v4(), 'math_1', 'M1-NQ-03', 'Radical Expressions', 'Simplify and operate with radical expressions', 'Number & Quantity', 3),
(uuid_generate_v4(), 'math_1', 'M1-NQ-04', 'Unit Conversions', 'Convert units in multi-step problems', 'Number & Quantity', 4),

-- Algebra - Expressions
(uuid_generate_v4(), 'math_1', 'M1-AE-01', 'Linear Expressions', 'Interpret and create linear expressions', 'Expressions', 10),
(uuid_generate_v4(), 'math_1', 'M1-AE-02', 'Polynomial Operations', 'Add, subtract, and multiply polynomials', 'Expressions', 11),
(uuid_generate_v4(), 'math_1', 'M1-AE-03', 'Factoring Quadratics', 'Factor quadratic expressions', 'Expressions', 12),
(uuid_generate_v4(), 'math_1', 'M1-AE-04', 'Completing the Square', 'Complete the square for quadratic expressions', 'Expressions', 13),

-- Algebra - Equations
(uuid_generate_v4(), 'math_1', 'M1-EQ-01', 'Linear Equations', 'Solve linear equations in one variable', 'Equations', 20),
(uuid_generate_v4(), 'math_1', 'M1-EQ-02', 'Linear Inequalities', 'Solve linear inequalities and graph solutions', 'Equations', 21),
(uuid_generate_v4(), 'math_1', 'M1-EQ-03', 'Systems of Equations', 'Solve systems of linear equations graphically and algebraically', 'Equations', 22),
(uuid_generate_v4(), 'math_1', 'M1-EQ-04', 'Quadratic Equations', 'Solve quadratic equations by various methods', 'Equations', 23),
(uuid_generate_v4(), 'math_1', 'M1-EQ-05', 'Quadratic Formula', 'Apply the quadratic formula', 'Equations', 24),

-- Functions
(uuid_generate_v4(), 'math_1', 'M1-FN-01', 'Function Notation', 'Use and interpret function notation', 'Functions', 30),
(uuid_generate_v4(), 'math_1', 'M1-FN-02', 'Linear Functions', 'Analyze and graph linear functions', 'Functions', 31),
(uuid_generate_v4(), 'math_1', 'M1-FN-03', 'Quadratic Functions', 'Analyze and graph quadratic functions', 'Functions', 32),
(uuid_generate_v4(), 'math_1', 'M1-FN-04', 'Exponential Functions', 'Understand and apply exponential growth/decay', 'Functions', 33),
(uuid_generate_v4(), 'math_1', 'M1-FN-05', 'Function Transformations', 'Describe transformations of functions', 'Functions', 34),

-- Statistics
(uuid_generate_v4(), 'math_1', 'M1-ST-01', 'Measures of Center', 'Calculate and interpret mean, median, mode', 'Statistics', 40),
(uuid_generate_v4(), 'math_1', 'M1-ST-02', 'Measures of Spread', 'Calculate and interpret range, IQR, standard deviation', 'Statistics', 41),
(uuid_generate_v4(), 'math_1', 'M1-ST-03', 'Data Visualization', 'Create and interpret histograms, box plots, scatter plots', 'Statistics', 42),
(uuid_generate_v4(), 'math_1', 'M1-ST-04', 'Linear Regression', 'Fit and interpret linear models', 'Statistics', 43),

-- Geometry
(uuid_generate_v4(), 'math_1', 'M1-GE-01', 'Coordinate Geometry', 'Apply distance, midpoint, and slope formulas', 'Geometry', 50),
(uuid_generate_v4(), 'math_1', 'M1-GE-02', 'Parallel & Perpendicular', 'Understand and apply properties of parallel and perpendicular lines', 'Geometry', 51),
(uuid_generate_v4(), 'math_1', 'M1-GE-03', 'Geometric Transformations', 'Describe and apply translations, rotations, reflections', 'Geometry', 52)
ON CONFLICT (code) DO NOTHING;

-- Math 3 Skills (typically 11th grade)
INSERT INTO skills (id, course_track, code, name, description, category, order_index) VALUES
-- Polynomial Functions
(uuid_generate_v4(), 'math_3', 'M3-PF-01', 'Polynomial Division', 'Divide polynomials using long and synthetic division', 'Polynomial Functions', 1),
(uuid_generate_v4(), 'math_3', 'M3-PF-02', 'Zeros of Polynomials', 'Find real and complex zeros of polynomial functions', 'Polynomial Functions', 2),
(uuid_generate_v4(), 'math_3', 'M3-PF-03', 'Polynomial Graphing', 'Analyze and graph polynomial functions', 'Polynomial Functions', 3),
(uuid_generate_v4(), 'math_3', 'M3-PF-04', 'Factor Theorem', 'Apply factor and remainder theorems', 'Polynomial Functions', 4),

-- Rational Functions
(uuid_generate_v4(), 'math_3', 'M3-RF-01', 'Rational Expressions', 'Simplify and operate with rational expressions', 'Rational Functions', 10),
(uuid_generate_v4(), 'math_3', 'M3-RF-02', 'Rational Equations', 'Solve rational equations', 'Rational Functions', 11),
(uuid_generate_v4(), 'math_3', 'M3-RF-03', 'Asymptotes', 'Find vertical, horizontal, and slant asymptotes', 'Rational Functions', 12),
(uuid_generate_v4(), 'math_3', 'M3-RF-04', 'Rational Graphing', 'Graph rational functions with asymptotes', 'Rational Functions', 13),

-- Exponential & Logarithmic
(uuid_generate_v4(), 'math_3', 'M3-EL-01', 'Logarithm Properties', 'Apply properties of logarithms', 'Exponential & Logarithmic', 20),
(uuid_generate_v4(), 'math_3', 'M3-EL-02', 'Exponential Equations', 'Solve exponential equations', 'Exponential & Logarithmic', 21),
(uuid_generate_v4(), 'math_3', 'M3-EL-03', 'Logarithmic Equations', 'Solve logarithmic equations', 'Exponential & Logarithmic', 22),
(uuid_generate_v4(), 'math_3', 'M3-EL-04', 'Exponential Modeling', 'Model real-world scenarios with exponential functions', 'Exponential & Logarithmic', 23),

-- Trigonometry
(uuid_generate_v4(), 'math_3', 'M3-TR-01', 'Unit Circle', 'Understand and apply the unit circle', 'Trigonometry', 30),
(uuid_generate_v4(), 'math_3', 'M3-TR-02', 'Trig Functions', 'Evaluate and graph sine, cosine, tangent', 'Trigonometry', 31),
(uuid_generate_v4(), 'math_3', 'M3-TR-03', 'Trig Identities', 'Verify and apply trigonometric identities', 'Trigonometry', 32),
(uuid_generate_v4(), 'math_3', 'M3-TR-04', 'Trig Equations', 'Solve trigonometric equations', 'Trigonometry', 33),
(uuid_generate_v4(), 'math_3', 'M3-TR-05', 'Inverse Trig', 'Evaluate and apply inverse trigonometric functions', 'Trigonometry', 34),
(uuid_generate_v4(), 'math_3', 'M3-TR-06', 'Law of Sines/Cosines', 'Apply law of sines and cosines to solve triangles', 'Trigonometry', 35),

-- Sequences & Series
(uuid_generate_v4(), 'math_3', 'M3-SS-01', 'Arithmetic Sequences', 'Find terms and sums of arithmetic sequences', 'Sequences & Series', 40),
(uuid_generate_v4(), 'math_3', 'M3-SS-02', 'Geometric Sequences', 'Find terms and sums of geometric sequences', 'Sequences & Series', 41),
(uuid_generate_v4(), 'math_3', 'M3-SS-03', 'Sigma Notation', 'Use sigma notation to represent series', 'Sequences & Series', 42),

-- Statistics
(uuid_generate_v4(), 'math_3', 'M3-ST-01', 'Normal Distribution', 'Apply properties of normal distributions', 'Statistics', 50),
(uuid_generate_v4(), 'math_3', 'M3-ST-02', 'Statistical Inference', 'Understand sampling distributions and confidence intervals', 'Statistics', 51),
(uuid_generate_v4(), 'math_3', 'M3-ST-03', 'Hypothesis Testing', 'Perform and interpret hypothesis tests', 'Statistics', 52)
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- SECTION 2: CAREER PATHWAYS
-- =============================================================================

INSERT INTO career_pathways (code, name, description, color, target_grades, prerequisite_tracks, career_outcomes, certifications, order_index) VALUES
-- Actuarial Science
(
  'actuarial',
  'Actuarial Science',
  'Master the mathematical foundations needed for actuarial exams. Learn probability, statistics, financial mathematics, and risk assessment used by insurance and pension professionals.',
  '#1E40AF',
  ARRAY[10,11,12],
  ARRAY['ap_calc_ab', 'ap_stats']::course_track[],
  ARRAY['Actuary', 'Risk Analyst', 'Insurance Underwriter', 'Pension Consultant', 'Quantitative Analyst'],
  ARRAY['SOA Exam P', 'SOA Exam FM', 'CAS Exam 1', 'CAS Exam 2'],
  1
),
-- Data Science
(
  'data_science',
  'Data Science & Analytics',
  'Build the mathematical toolkit for data science careers. Cover statistics, linear algebra, probability, and the math behind machine learning algorithms.',
  '#059669',
  ARRAY[9,10,11,12],
  ARRAY['math_2', 'ap_stats']::course_track[],
  ARRAY['Data Scientist', 'Machine Learning Engineer', 'Business Intelligence Analyst', 'Statistician', 'Research Scientist'],
  ARRAY['Google Data Analytics Certificate', 'IBM Data Science Certificate', 'AWS Machine Learning'],
  2
),
-- Epidemiology & Public Health
(
  'epidemiology',
  'Epidemiological Modeling',
  'Learn the mathematics of disease modeling and public health analytics. Study biostatistics, population dynamics, and mathematical modeling for health outcomes.',
  '#DC2626',
  ARRAY[10,11,12],
  ARRAY['ap_calc_ab', 'ap_stats']::course_track[],
  ARRAY['Epidemiologist', 'Biostatistician', 'Public Health Analyst', 'Clinical Research Scientist', 'Health Data Analyst'],
  ARRAY['CPH (Certified in Public Health)', 'SAS Certification', 'R Programming Certificate'],
  3
),
-- Robotics & Engineering
(
  'robotics',
  'Robotics & Engineering Math',
  'Master the mathematics powering robotics and automation. Cover trigonometry, physics, control systems, and programming with hands-on Arduino projects.',
  '#7C3AED',
  ARRAY[8,9,10,11,12],
  ARRAY['math_2', 'math_3']::course_track[],
  ARRAY['Robotics Engineer', 'Automation Engineer', 'Embedded Systems Developer', 'Mechatronics Engineer', 'Control Systems Engineer'],
  ARRAY['Arduino Certification', 'ROS Developer Certificate', 'FANUC Robotics Certification'],
  4
),
-- Financial Mathematics
(
  'financial_math',
  'Financial Mathematics',
  'Explore the math behind Wall Street. Learn quantitative finance, options pricing, portfolio theory, and algorithmic trading fundamentals.',
  '#CA8A04',
  ARRAY[11,12],
  ARRAY['ap_calc_bc', 'ap_stats']::course_track[],
  ARRAY['Quantitative Analyst', 'Financial Engineer', 'Risk Manager', 'Algorithmic Trader', 'Portfolio Manager'],
  ARRAY['CFA Level 1', 'FRM', 'CQF (Certificate in Quantitative Finance)'],
  5
),
-- Competition Math
(
  'competition_math',
  'Competition Mathematics',
  'Train for AMC, MATHCOUNTS, and Math Olympiad competitions. Develop problem-solving skills, learn competition strategies, and tackle challenging proofs.',
  '#EA580C',
  ARRAY[6,7,8,9,10,11,12],
  ARRAY['math_1']::course_track[],
  ARRAY['Research Mathematician', 'Professor', 'Cryptographer', 'Theoretical Computer Scientist'],
  ARRAY['AMC 10/12', 'AIME Qualifier', 'USAMO', 'IMO'],
  6
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  target_grades = EXCLUDED.target_grades,
  career_outcomes = EXCLUDED.career_outcomes,
  certifications = EXCLUDED.certifications;

-- Career-specific skills
INSERT INTO skills (course_track, code, name, description, category, order_index) VALUES
-- Actuarial Skills
('actuarial', 'ACT-001', 'Probability Fundamentals', 'Basic probability theory, counting principles, and conditional probability', 'Probability', 1),
('actuarial', 'ACT-002', 'Random Variables', 'Discrete and continuous random variables, expected value, variance', 'Probability', 2),
('actuarial', 'ACT-003', 'Common Distributions', 'Binomial, Poisson, Normal, Exponential distributions', 'Probability', 3),
('actuarial', 'ACT-004', 'Time Value of Money', 'Interest rates, present and future value, annuities', 'Financial Math', 4),
('actuarial', 'ACT-005', 'Annuities & Perpetuities', 'Ordinary annuities, annuities due, perpetuities', 'Financial Math', 5),
('actuarial', 'ACT-006', 'Bonds & Amortization', 'Bond pricing, yield rates, loan amortization', 'Financial Math', 6),
('actuarial', 'ACT-007', 'Life Tables', 'Mortality tables, survival functions, life expectancy', 'Life Contingencies', 7),
('actuarial', 'ACT-008', 'Risk Measures', 'VaR, Expected Shortfall, risk classification', 'Risk Management', 8),

-- Data Science Skills
('data_science', 'DS-001', 'Descriptive Statistics', 'Mean, median, mode, standard deviation, data visualization', 'Statistics', 1),
('data_science', 'DS-002', 'Probability for ML', 'Probability distributions, Bayes theorem, joint probability', 'Probability', 2),
('data_science', 'DS-003', 'Linear Algebra Basics', 'Vectors, matrices, matrix operations, eigenvalues', 'Linear Algebra', 3),
('data_science', 'DS-004', 'Regression Analysis', 'Linear regression, multiple regression, model evaluation', 'Machine Learning', 4),
('data_science', 'DS-005', 'Classification', 'Logistic regression, decision trees, confusion matrix', 'Machine Learning', 5),
('data_science', 'DS-006', 'Clustering', 'K-means, hierarchical clustering, dimensionality reduction', 'Machine Learning', 6),
('data_science', 'DS-007', 'Hypothesis Testing', 'T-tests, chi-square, p-values, confidence intervals', 'Statistics', 7),
('data_science', 'DS-008', 'Time Series', 'Trend analysis, seasonality, forecasting methods', 'Analytics', 8),

-- Robotics Skills
('robotics', 'ROB-001', 'Circuit Basics', 'Voltage, current, resistance, Ohm''s law, basic circuits', 'Electronics', 1),
('robotics', 'ROB-002', 'Digital Logic', 'Binary, logic gates, boolean algebra', 'Electronics', 2),
('robotics', 'ROB-003', 'Arduino Programming', 'Setup, digital/analog I/O, loops, functions', 'Programming', 3),
('robotics', 'ROB-004', 'Sensors & Input', 'Reading sensor data, calibration, signal processing', 'Sensors', 4),
('robotics', 'ROB-005', 'Motor Control', 'PWM, H-bridges, servo control, stepper motors', 'Actuators', 5),
('robotics', 'ROB-006', 'Robot Kinematics', 'Position, velocity, coordinate systems, transformations', 'Mathematics', 6),
('robotics', 'ROB-007', 'Control Systems', 'PID control, feedback loops, tuning', 'Control Theory', 7),
('robotics', 'ROB-008', 'Autonomous Navigation', 'Line following, obstacle avoidance, path planning', 'Autonomy', 8),

-- Competition Math Skills
('competition_math', 'COMP-001', 'Number Theory', 'Divisibility, primes, modular arithmetic, Diophantine equations', 'Number Theory', 1),
('competition_math', 'COMP-002', 'Combinatorics', 'Counting principles, permutations, combinations, pigeonhole', 'Combinatorics', 2),
('competition_math', 'COMP-003', 'Geometry', 'Euclidean geometry, circles, triangles, coordinate geometry', 'Geometry', 3),
('competition_math', 'COMP-004', 'Algebra', 'Polynomials, inequalities, functional equations', 'Algebra', 4),
('competition_math', 'COMP-005', 'Proof Techniques', 'Direct proof, contradiction, induction, construction', 'Proof Writing', 5),
('competition_math', 'COMP-006', 'Problem Solving Strategies', 'Working backwards, pattern recognition, extreme cases', 'Strategy', 6)
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- SECTION 3: GUIDE LEVELS
-- =============================================================================

INSERT INTO guide_levels (
  id, level_code, name, description,
  coach_focus_percent, mentor_focus_percent,
  min_experience_years, required_certifications,
  hourly_rate_min, hourly_rate_max,
  max_students, training_hours_required,
  is_active, display_order
) VALUES
(
  'a1000001-0000-0000-0000-000000000001',
  'GUIDE_I',
  'Math Development Guide I',
  'Entry-level guide focusing primarily on skill development with introductory mentorship.',
  80, 20, 2,
  ARRAY['Teaching Certification', 'MathPivot Guide I Training'],
  50.00, 75.00, 15, 40,
  true, 1
),
(
  'a1000001-0000-0000-0000-000000000002',
  'GUIDE_II',
  'Math Development Guide II',
  'Balanced guide equally skilled in coaching and mentoring. Develops skills while providing career guidance.',
  50, 50, 4,
  ARRAY['Advanced Teaching Certification', 'MathPivot Guide II Training', 'Industry Experience'],
  75.00, 110.00, 12, 60,
  true, 2
),
(
  'a1000001-0000-0000-0000-000000000003',
  'GUIDE_III',
  'Math Development Guide III',
  'Advanced guide focusing on mentorship, career guidance, and inspiration for advanced students.',
  20, 80, 6,
  ARRAY['PhD or Industry Leadership', 'MathPivot Guide III Training'],
  110.00, 150.00, 8, 80,
  true, 3
),
(
  'a1000001-0000-0000-0000-000000000004',
  'GUIDE_SPECIALIST',
  'Math Specialist Guide',
  'Expert in specific domains (competitions, research, industry). Highly focused mentorship.',
  30, 70, 5,
  ARRAY['Domain Expertise Certification', 'MathPivot Specialist Training', 'Proven Track Record'],
  125.00, 200.00, 6, 100,
  true, 4
)
ON CONFLICT (level_code) DO UPDATE SET
  coach_focus_percent = EXCLUDED.coach_focus_percent,
  mentor_focus_percent = EXCLUDED.mentor_focus_percent,
  hourly_rate_min = EXCLUDED.hourly_rate_min,
  hourly_rate_max = EXCLUDED.hourly_rate_max;

-- =============================================================================
-- SECTION 4: GUIDE COMPENSATION PLANS
-- =============================================================================

INSERT INTO guide_compensation_plans (
  guide_level_code, base_rate_per_hour, commission_percent,
  session_bonus, retention_bonus, outcome_bonus_rules,
  health_stipend, training_budget, technology_allowance,
  effective_date, is_active
) VALUES
('GUIDE_I', 45.00, 10.00, 25.00, 100.00,
  '{"grade_improvement": 50, "competition_qualification": 100, "program_completion": 75}'::JSONB,
  200.00, 500.00, 50.00, '2026-01-01', true),
('GUIDE_II', 65.00, 15.00, 35.00, 150.00,
  '{"grade_improvement": 75, "competition_advancement": 150, "research_project": 200}'::JSONB,
  300.00, 750.00, 75.00, '2026-01-01', true),
('GUIDE_III', 95.00, 20.00, 50.00, 250.00,
  '{"national_competition": 500, "research_publication": 1000, "college_admission": 750}'::JSONB,
  500.00, 1500.00, 100.00, '2026-01-01', true),
('GUIDE_SPECIALIST', 120.00, 25.00, 75.00, 350.00,
  '{"olympiad_qualification": 1000, "major_publication": 1500, "industry_placement": 1000}'::JSONB,
  600.00, 2000.00, 150.00, '2026-01-01', true)
ON CONFLICT (guide_level_code, effective_date) DO UPDATE SET
  base_rate_per_hour = EXCLUDED.base_rate_per_hour,
  commission_percent = EXCLUDED.commission_percent;

-- =============================================================================
-- SECTION 5: PRODUCTS (Base + Tiered)
-- =============================================================================

-- Base Products
INSERT INTO products (name, description, product_type, credits, price_cents, currency, is_active, metadata) VALUES
('Starter Pack', 'Perfect for trying out MathPivot. Includes 4 one-hour sessions.', 'package', 4, 19900, 'USD', true, '{"highlight": false}'),
('Standard Pack', 'Our most popular package. Includes 8 one-hour sessions with a 10% discount.', 'package', 8, 35900, 'USD', true, '{"highlight": true, "popular": true, "savings_percent": 10}'),
('Premium Pack', 'Best value for committed learners. Includes 16 one-hour sessions with a 15% discount.', 'package', 16, 67900, 'USD', true, '{"savings_percent": 15}'),
('Monthly Basic', 'Subscription with 4 sessions per month. Cancel anytime.', 'subscription', 4, 18900, 'USD', true, '{"interval": "month"}'),
('Monthly Plus', 'Subscription with 8 sessions per month. Our most flexible ongoing plan.', 'subscription', 8, 34900, 'USD', true, '{"interval": "month", "popular": true}')
ON CONFLICT DO NOTHING;

-- Tiered Products (Guide Model)
INSERT INTO products (id, name, description, product_type, guide_level_required, eligibility_tier_required, credits, price_cents, currency, is_active) VALUES
-- Tier 1: Explorer (Guide I)
('e1000001-0000-0000-0000-000000000010', 'Explorer Starter Pack', '4 sessions with Guide I (80% coaching, 20% mentoring).', 'package', 'GUIDE_I', 'TIER_1_EXPLORER', 4, 27900, 'USD', true),
('e1000001-0000-0000-0000-000000000011', 'Explorer Monthly', 'Monthly subscription with Guide I. 4 sessions/month.', 'subscription', 'GUIDE_I', 'TIER_1_EXPLORER', 4, 34900, 'USD', true),
-- Tier 2: Developer (Guide II)
('e1000001-0000-0000-0000-000000000012', 'Developer Intensive', '8 sessions with Guide II (50/50 balance).', 'package', 'GUIDE_II', 'TIER_2_DEVELOPER', 8, 79900, 'USD', true),
('e1000001-0000-0000-0000-000000000013', 'Developer Quarterly', 'Quarterly subscription with Guide II. 12 sessions.', 'subscription', 'GUIDE_II', 'TIER_2_DEVELOPER', 12, 99900, 'USD', true),
-- Tier 3: Accelerator (Guide III)
('e1000001-0000-0000-0000-000000000014', 'Accelerator Elite', '12 sessions with Guide III (20% coaching, 80% mentoring).', 'package', 'GUIDE_III', 'TIER_3_ACCELERATOR', 12, 179900, 'USD', true),
('e1000001-0000-0000-0000-000000000015', 'Accelerator Annual', 'Annual subscription with Guide III. 48 sessions.', 'subscription', 'GUIDE_III', 'TIER_3_ACCELERATOR', 48, 599900, 'USD', true),
-- Specialist
('e1000001-0000-0000-0000-000000000016', 'Competition Prep Package', 'Competition-focused mentorship with Specialist Guide.', 'package', 'GUIDE_SPECIALIST', NULL, 10, 149900, 'USD', true),
('e1000001-0000-0000-0000-000000000017', 'Research Mentorship', 'One-on-one research mentorship for original mathematical research.', 'package', 'GUIDE_SPECIALIST', NULL, 16, 249900, 'USD', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  guide_level_required = EXCLUDED.guide_level_required,
  eligibility_tier_required = EXCLUDED.eligibility_tier_required;

-- =============================================================================
-- SECTION 6: CERTIFICATIONS
-- =============================================================================

-- Question bank categories
INSERT INTO question_bank_categories (id, name, slug, description, display_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Arithmetic', 'arithmetic', 'Basic arithmetic operations', 1),
  ('a0000000-0000-0000-0000-000000000002', 'Algebra', 'algebra', 'Algebraic concepts and equations', 2),
  ('a0000000-0000-0000-0000-000000000003', 'Geometry', 'geometry', 'Shapes, angles, and spatial reasoning', 3),
  ('a0000000-0000-0000-0000-000000000004', 'Statistics', 'statistics', 'Data analysis and probability', 4),
  ('a0000000-0000-0000-0000-000000000005', 'Calculus', 'calculus', 'Limits, derivatives, and integrals', 5),
  ('a0000000-0000-0000-0000-000000000006', 'Actuarial', 'actuarial', 'Actuarial exam preparation', 6),
  ('a0000000-0000-0000-0000-000000000007', 'Data Science', 'data-science', 'Statistical modeling and ML', 7)
ON CONFLICT (slug) DO NOTHING;

-- Skill Mastery Certifications
INSERT INTO certification_programs (
  id, code, name, description, short_description,
  cert_type, level, category,
  badge_color, estimated_hours, difficulty_rating,
  target_audience, grade_level_min, grade_level_max,
  is_free, is_featured, display_order
) VALUES
('c0000000-0000-0000-0001-000000000001', 'ALG1-BRONZE', 'Algebra I Foundations', 'Demonstrates fundamental understanding of algebraic concepts.', 'Master the basics of algebra', 'skill_mastery', 'bronze', 'algebra', '#CD7F32', 20, 2, 'student', 7, 9, true, true, 1),
('c0000000-0000-0000-0001-000000000002', 'ALG1-SILVER', 'Algebra I Proficient', 'Shows proficiency in solving linear equations and functions.', 'Proficient in Algebra I concepts', 'skill_mastery', 'silver', 'algebra', '#C0C0C0', 40, 3, 'student', 7, 10, true, false, 2),
('c0000000-0000-0000-0001-000000000003', 'ALG1-GOLD', 'Algebra I Mastery', 'Demonstrates mastery of all Algebra I topics.', 'Complete mastery of Algebra I', 'skill_mastery', 'gold', 'algebra', '#FFD700', 60, 4, 'student', 8, 10, true, true, 3),
('c0000000-0000-0000-0002-000000000001', 'GEO-BRONZE', 'Geometry Foundations', 'Understanding of basic geometric shapes and spatial relationships.', 'Master geometry basics', 'skill_mastery', 'bronze', 'geometry', '#CD7F32', 20, 2, 'student', 8, 10, true, false, 4),
('c0000000-0000-0000-0002-000000000002', 'GEO-GOLD', 'Geometry Mastery', 'Complete mastery of geometry including proofs and trigonometry.', 'Complete geometry mastery', 'skill_mastery', 'gold', 'geometry', '#FFD700', 50, 4, 'student', 9, 11, true, false, 5),
('c0000000-0000-0000-0003-000000000001', 'STAT-SILVER', 'Statistics Proficient', 'Proficiency in data analysis, probability, and statistical reasoning.', 'Proficient in statistics', 'skill_mastery', 'silver', 'statistics', '#C0C0C0', 35, 3, 'student', 9, 12, true, false, 6),
('c0000000-0000-0000-0004-000000000001', 'CALC-BRONZE', 'Pre-Calculus Ready', 'Prepared for calculus with strong foundation in functions and limits.', 'Ready for calculus', 'skill_mastery', 'bronze', 'calculus', '#CD7F32', 45, 3, 'student', 10, 12, true, false, 7),
('c0000000-0000-0000-0004-000000000002', 'CALC-GOLD', 'Calculus Mastery', 'Complete mastery of differential and integral calculus.', 'Master calculus', 'skill_mastery', 'gold', 'calculus', '#FFD700', 80, 5, 'student', 11, 12, true, true, 8)
ON CONFLICT (code) DO NOTHING;

-- Competition Prep Certifications
INSERT INTO certification_programs (
  id, code, name, description, short_description,
  cert_type, level, category,
  badge_color, estimated_hours, difficulty_rating,
  target_audience, grade_level_min, grade_level_max,
  is_free, is_featured, display_order
) VALUES
('c0000000-0000-0000-0020-000000000001', 'AMC8-READY', 'AMC 8 Ready', 'Prepared for the AMC 8 competition.', 'Ready for AMC 8', 'competition_prep', 'bronze', 'competition', '#F59E0B', 30, 3, 'student', 5, 8, true, true, 70),
('c0000000-0000-0000-0020-000000000002', 'AMC10-READY', 'AMC 10 Ready', 'Prepared for AMC 10 with advanced problem-solving.', 'Ready for AMC 10', 'competition_prep', 'silver', 'competition', '#F59E0B', 60, 4, 'student', 8, 10, true, true, 71),
('c0000000-0000-0000-0020-000000000003', 'AMC12-READY', 'AMC 12 Ready', 'Prepared for AMC 12 with comprehensive problem-solving.', 'Ready for AMC 12', 'competition_prep', 'gold', 'competition', '#F59E0B', 80, 5, 'student', 10, 12, true, false, 72),
('c0000000-0000-0000-0020-000000000004', 'MATHCOUNTS-READY', 'MATHCOUNTS Ready', 'Prepared for MATHCOUNTS competition.', 'Ready for MATHCOUNTS', 'competition_prep', 'silver', 'competition', '#F59E0B', 50, 4, 'student', 6, 8, true, true, 73)
ON CONFLICT (code) DO NOTHING;

-- Tutor Certifications
INSERT INTO certification_programs (
  id, code, name, description, short_description,
  cert_type, level, category,
  badge_color, estimated_hours, difficulty_rating,
  target_audience, validity_months,
  is_free, price_cents, is_featured, display_order
) VALUES
('c0000000-0000-0000-0030-000000000001', 'TUTOR-BASIC', 'MathPivot Certified Tutor', 'Completed MathPivot tutor training.', 'Certified MathPivot Tutor', 'tutor_qualification', 'bronze', 'tutor', '#6366F1', 10, 2, 'tutor', 12, true, 0, false, 80),
('c0000000-0000-0000-0030-000000000002', 'TUTOR-ELEM', 'Elementary Math Specialist', 'Specialized in teaching K-5 mathematics.', 'Elementary math specialist', 'tutor_qualification', 'silver', 'tutor', '#6366F1', 20, 3, 'tutor', 24, true, 0, false, 81),
('c0000000-0000-0000-0030-000000000003', 'TUTOR-MIDDLE', 'Middle School Math Specialist', 'Specialized in teaching grades 6-8 mathematics.', 'Middle school math specialist', 'tutor_qualification', 'silver', 'tutor', '#6366F1', 20, 3, 'tutor', 24, true, 0, false, 82),
('c0000000-0000-0000-0030-000000000004', 'TUTOR-HIGH', 'High School Math Specialist', 'Specialized in teaching high school mathematics.', 'High school math specialist', 'tutor_qualification', 'gold', 'tutor', '#6366F1', 30, 4, 'tutor', 24, true, 0, false, 83),
('c0000000-0000-0000-0030-000000000005', 'TUTOR-COMP', 'Competition Math Coach', 'Qualified to coach students for math competitions.', 'Competition math coach', 'tutor_qualification', 'platinum', 'tutor', '#6366F1', 40, 5, 'tutor', 24, false, 2999, true, 84)
ON CONFLICT (code) DO NOTHING;

-- Sample Assessment
INSERT INTO certification_assessments (
  id, program_id, code, title, description, instructions,
  assessment_type, time_limit_minutes,
  max_attempts, cooldown_hours, passing_score, max_score,
  question_count, randomize_questions, randomize_options,
  show_correct_answers, show_explanations,
  allows_calculator, is_active
) VALUES
(
  'e0000000-0000-0000-0001-000000000001',
  'c0000000-0000-0000-0001-000000000003',
  'ALG1-FINAL',
  'Algebra I Mastery Assessment',
  'Comprehensive assessment covering all Algebra I topics.',
  'You have 90 minutes to complete this assessment. Score 85% or higher to pass.',
  'quiz', 90,
  3, 48, 85.00, 100.00,
  40, true, true,
  true, true,
  true, true
)
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- SECTION 8: PROGRAMS & CAMPS
-- =============================================================================

INSERT INTO programs (
  id, name, slug, description, program_type,
  career_pathway_id, start_date, end_date,
  min_participants, max_participants, price_cents,
  early_bird_price_cents, early_bird_deadline,
  min_grade, max_grade, status, featured
) VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'AMC 8 Prep Workshop',
  'amc-8-prep-workshop-spring-2026',
  'Intensive preparation for the AMC 8 competition. Learn problem-solving strategies and practice with past problems.',
  'workshop',
  (SELECT id FROM career_pathways WHERE code = 'competition_math'),
  '2026-04-01', '2026-04-15',
  5, 20, 19900,
  14900, '2026-03-15',
  5, 8, 'registration_open', true
),
(
  'b0000000-0000-0000-0000-000000000002',
  'Summer Math Camp 2026',
  'summer-math-camp-2026',
  'A week-long immersive math experience covering advanced topics, games, and competitions. Perfect for math enthusiasts!',
  'camp',
  NULL,
  '2026-06-15', '2026-06-21',
  10, 30, 49900,
  39900, '2026-05-01',
  6, 10, 'published', true
),
(
  'b0000000-0000-0000-0000-000000000003',
  'Algebra Bootcamp',
  'algebra-bootcamp-spring-2026',
  'Intensive 3-day bootcamp to master algebra fundamentals. Perfect for students preparing for high school.',
  'bootcamp',
  NULL,
  '2026-03-20', '2026-03-22',
  8, 15, 29900,
  NULL, NULL,
  7, 9, 'draft', false
),
(
  'b0000000-0000-0000-0000-000000000004',
  'MATHCOUNTS Competition Training',
  'mathcounts-training-2026',
  'Comprehensive training program for MATHCOUNTS competition. Includes mock competitions and strategy sessions.',
  'competition',
  (SELECT id FROM career_pathways WHERE code = 'competition_math'),
  '2026-01-15', '2026-02-15',
  5, 12, 34900,
  29900, '2026-01-01',
  6, 8, 'in_progress', true
),
(
  'b0000000-0000-0000-0000-000000000005',
  'Data Science for Teens',
  'data-science-teens-spring-2026',
  'Introduction to data science using Python. Learn statistics, data visualization, and basic machine learning.',
  'workshop',
  (SELECT id FROM career_pathways WHERE code = 'data_science'),
  '2026-04-10', '2026-04-24',
  5, 15, 39900,
  NULL, NULL,
  9, 12, 'published', false
),
(
  'b0000000-0000-0000-0000-000000000006',
  'SAT Math Intensive',
  'sat-math-intensive-spring-2026',
  'Focused SAT math preparation covering all tested topics. Includes practice tests and personalized feedback.',
  'clinic',
  (SELECT id FROM career_pathways WHERE code = 'college_prep'),
  '2026-05-01', '2026-05-31',
  5, 20, 44900,
  39900, '2026-04-15',
  10, 12, 'registration_open', true
)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- Reference Data Summary:
-- - 50+ Math skills (Math 1, Math 3, career-specific)
-- - 6 Career pathways
-- - 4 Guide levels with compensation plans
-- - 15+ Products (base + tiered)
-- - 15+ Certification programs
-- - 6 Sample programs/camps
-- - Sample assessments
--
-- Run this file ONCE after migrations to set up all reference data.
