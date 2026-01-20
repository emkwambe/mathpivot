-- ============================================================================
-- MATHPIVOT TUTOROS - SEED DATA
-- Programs, Competitions, Certifications, and Career Pathways
-- ============================================================================

-- ============================================================================
-- CAREER PATHWAYS
-- ============================================================================

INSERT INTO career_pathways (id, name, slug, description, icon, color, recommended_skills, is_active, display_order) VALUES
-- STEM Careers
('cp-001', 'Data Science & Analytics', 'data-science',
 'Master the mathematical foundations for a career in data science, machine learning, and business analytics. Strong emphasis on statistics, probability, and computational thinking.',
 'chart-bar', '#3B82F6',
 ARRAY['statistics', 'probability', 'linear-algebra', 'calculus'], true, 1),

('cp-002', 'Engineering', 'engineering',
 'Build the math skills essential for mechanical, electrical, civil, and aerospace engineering. Focus on calculus, physics applications, and problem-solving.',
 'cog', '#10B981',
 ARRAY['calculus', 'trigonometry', 'physics', 'differential-equations'], true, 2),

('cp-003', 'Computer Science', 'computer-science',
 'Develop mathematical thinking for software development, algorithms, and computational theory. Emphasis on discrete math, logic, and algorithmic thinking.',
 'code', '#8B5CF6',
 ARRAY['discrete-math', 'logic', 'algorithms', 'linear-algebra'], true, 3),

('cp-004', 'Finance & Economics', 'finance',
 'Prepare for careers in investment banking, financial analysis, and economics. Strong focus on statistics, modeling, and quantitative reasoning.',
 'currency-dollar', '#F59E0B',
 ARRAY['statistics', 'calculus', 'probability', 'modeling'], true, 4),

('cp-005', 'Healthcare & Medicine', 'healthcare',
 'Math foundations for pre-med, nursing, pharmacy, and healthcare administration. Includes biostatistics and dosage calculations.',
 'heart', '#EF4444',
 ARRAY['statistics', 'algebra', 'chemistry-math', 'biostatistics'], true, 5),

('cp-006', 'Architecture & Design', 'architecture',
 'Geometry, spatial reasoning, and mathematical concepts essential for architects and designers.',
 'office-building', '#6366F1',
 ARRAY['geometry', 'trigonometry', 'spatial-reasoning', 'calculus'], true, 6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  recommended_skills = EXCLUDED.recommended_skills;

-- ============================================================================
-- PROGRAMS (Camps, Clinics, Workshops)
-- ============================================================================

INSERT INTO programs (id, name, slug, description, program_type, format, min_grade, max_grade, capacity, price_cents, early_bird_price_cents, early_bird_deadline, start_date, end_date, registration_opens, registration_closes, location, is_virtual, status, metadata) VALUES
-- Summer Math Camps
('prog-001', 'Summer Math Intensive', 'summer-intensive-2026',
 'An immersive 2-week program designed to accelerate math skills. Students work in small groups, tackling challenging problems and building confidence.',
 'camp', 'in_person', 6, 9, 24, 129900, 99900, '2026-05-01', '2026-07-14', '2026-07-28',
 '2026-03-01', '2026-06-30', 'MathPivot Learning Center', false, 'registration_open',
 '{"includes": ["Materials", "Snacks", "Certificate"], "schedule": "9am-3pm Mon-Fri"}'),

('prog-002', 'Algebra Bootcamp', 'algebra-bootcamp-2026',
 'Intensive 5-day bootcamp to master algebra fundamentals. Perfect for students preparing for high school math or needing to strengthen their foundation.',
 'bootcamp', 'hybrid', 7, 10, 16, 59900, 49900, '2026-04-15', '2026-06-16', '2026-06-20',
 '2026-02-01', '2026-06-01', 'MathPivot Learning Center + Online', true, 'registration_open',
 '{"includes": ["Workbook", "Online resources", "Certificate"], "schedule": "10am-2pm"}'),

('prog-003', 'SAT Math Prep Workshop', 'sat-prep-spring-2026',
 'Comprehensive SAT math preparation covering all tested topics, strategies, and practice tests. Includes personalized score analysis.',
 'workshop', 'online', 10, 12, 20, 39900, null, null, '2026-03-01', '2026-04-15',
 '2026-01-15', '2026-02-25', 'Online via Zoom', true, 'published',
 '{"includes": ["Practice tests", "Strategy guide", "Score analysis"], "sessions": 8}'),

('prog-004', 'Geometry Clinic', 'geometry-clinic-2026',
 'Targeted clinic for students struggling with geometry concepts. Focus on proofs, spatial reasoning, and problem-solving techniques.',
 'clinic', 'in_person', 8, 11, 12, 29900, null, null, '2026-04-05', '2026-04-05',
 '2026-03-01', '2026-04-01', 'MathPivot Learning Center', false, 'published',
 '{"includes": ["Workbook", "Geometry toolkit"], "duration": "Full day workshop"}'),

('prog-005', 'AP Calculus Summer Review', 'ap-calc-review-2026',
 'Two-week intensive review for students who completed AP Calculus AB or BC. Solidify concepts before the next academic year.',
 'camp', 'hybrid', 11, 12, 16, 89900, 74900, '2026-06-01', '2026-08-04', '2026-08-15',
 '2026-04-01', '2026-07-20', 'MathPivot Learning Center + Online', true, 'draft',
 '{"includes": ["Review materials", "Practice AP exams", "1-on-1 session"], "schedule": "10am-1pm"}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status;

-- ============================================================================
-- COMPETITIONS
-- ============================================================================

INSERT INTO competitions (id, name, slug, description, competition_type, format, min_grade, max_grade, team_size_min, team_size_max, registration_fee_cents, prize_description, rules_url, start_date, end_date, registration_opens, registration_closes, is_active, metadata) VALUES
('comp-001', 'MathPivot Problem Solving Championship', 'mpsc-2026',
 'Annual competition testing mathematical problem-solving skills across multiple rounds. Top performers qualify for the national finals.',
 'individual', 'hybrid', 6, 12, null, null, 2500,
 'Trophies for top 3 in each division, scholarships for national finalists',
 null, '2026-03-15', '2026-05-20', '2026-01-01', '2026-03-01', true,
 '{"rounds": ["School", "Regional", "State", "National"], "divisions": ["Junior (6-8)", "Senior (9-12)"]}'),

('comp-002', 'Team Math Challenge', 'team-challenge-2026',
 'Collaborative competition where teams of 4 solve complex multi-step problems. Emphasizes teamwork and communication.',
 'team', 'in_person', 7, 11, 4, 4, 5000,
 'Team trophies, individual medals, math book prizes',
 null, '2026-04-20', '2026-04-20', '2026-02-01', '2026-04-10', true,
 '{"format": "3 rounds - Individual, Team, Relay", "location": "MathPivot Learning Center"}'),

('comp-003', 'Mental Math Marathon', 'mental-math-2026',
 'Speed-based competition focusing on mental calculation skills. No calculators allowed!',
 'individual', 'online', 5, 10, null, null, 1500,
 'Medals and certificates for top performers in each grade',
 null, '2026-02-28', '2026-02-28', '2026-01-15', '2026-02-20', true,
 '{"format": "Timed online rounds", "categories": ["Arithmetic", "Fractions", "Percentages"]}'),

('comp-004', 'MathPivot Hackathon', 'math-hackathon-2026',
 'Apply math to real-world problems in this 24-hour hackathon. Teams use data analysis and mathematical modeling.',
 'team', 'hybrid', 9, 12, 2, 5, 0,
 'Cash prizes, mentorship opportunities, project showcase',
 null, '2026-06-14', '2026-06-15', '2026-04-01', '2026-06-01', true,
 '{"themes": ["Environmental modeling", "Healthcare optimization", "Financial analysis"]}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- CERTIFICATION PROGRAMS
-- ============================================================================

INSERT INTO certification_programs (id, name, slug, description, category, level, requirements, badge_image_url, is_active, display_order) VALUES
-- Foundation Certifications
('cert-001', 'Algebra Foundations', 'algebra-foundations',
 'Demonstrates mastery of core algebra concepts including equations, inequalities, and functions.',
 'Algebra', 'foundation',
 '{"skills_required": ["linear-equations", "inequalities", "functions-intro"], "min_mastery": "proficient", "assessment_required": true}',
 '/badges/algebra-foundations.svg', true, 1),

('cert-002', 'Geometry Essentials', 'geometry-essentials',
 'Certifies understanding of geometric principles, proofs, and spatial reasoning.',
 'Geometry', 'foundation',
 '{"skills_required": ["angles", "triangles", "circles", "proofs-intro"], "min_mastery": "proficient", "assessment_required": true}',
 '/badges/geometry-essentials.svg', true, 2),

-- Intermediate Certifications
('cert-003', 'Advanced Algebra', 'advanced-algebra',
 'Recognition of advanced algebraic skills including polynomials, rational expressions, and systems.',
 'Algebra', 'intermediate',
 '{"skills_required": ["polynomials", "rational-expressions", "systems-equations"], "min_mastery": "proficient", "assessment_required": true, "prerequisite": "cert-001"}',
 '/badges/advanced-algebra.svg', true, 3),

('cert-004', 'Trigonometry Proficiency', 'trigonometry-proficiency',
 'Validates mastery of trigonometric functions, identities, and applications.',
 'Trigonometry', 'intermediate',
 '{"skills_required": ["trig-functions", "trig-identities", "trig-applications"], "min_mastery": "proficient", "assessment_required": true}',
 '/badges/trigonometry.svg', true, 4),

-- Advanced Certifications
('cert-005', 'Pre-Calculus Mastery', 'precalculus-mastery',
 'Comprehensive certification covering all pre-calculus topics preparing students for calculus.',
 'Pre-Calculus', 'advanced',
 '{"skills_required": ["advanced-functions", "limits-intro", "sequences-series"], "min_mastery": "mastered", "assessment_required": true, "prerequisites": ["cert-003", "cert-004"]}',
 '/badges/precalculus.svg', true, 5),

('cert-006', 'AP Calculus Ready', 'ap-calculus-ready',
 'Certifies readiness for AP Calculus coursework with strong foundations in limits, derivatives, and integrals.',
 'Calculus', 'advanced',
 '{"skills_required": ["limits", "derivatives-intro", "integrals-intro"], "min_mastery": "proficient", "assessment_required": true, "prerequisite": "cert-005"}',
 '/badges/ap-calculus-ready.svg', true, 6),

-- Expert Certifications
('cert-007', 'Statistics & Probability Expert', 'stats-probability-expert',
 'Expert-level certification in statistical analysis and probability theory.',
 'Statistics', 'expert',
 '{"skills_required": ["descriptive-stats", "probability", "distributions", "inference"], "min_mastery": "mastered", "assessment_required": true, "project_required": true}',
 '/badges/stats-expert.svg', true, 7),

('cert-008', 'Mathematical Problem Solver', 'problem-solver',
 'Elite certification recognizing exceptional mathematical problem-solving abilities across domains.',
 'Problem Solving', 'expert',
 '{"competition_achievements": ["top-10-mpsc", "team-challenge-winner"], "min_mastery": "mastered", "portfolio_required": true}',
 '/badges/problem-solver.svg', true, 8)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  requirements = EXCLUDED.requirements;

-- ============================================================================
-- SAMPLE SKILLS (if not already populated)
-- ============================================================================

INSERT INTO skills (id, course_track, code, name, description, category, order_index, is_active, min_grade, max_grade) VALUES
-- Algebra skills
('skill-001', 'math_1', 'linear-equations', 'Linear Equations', 'Solve single and multi-step linear equations', 'Algebra', 1, true, 7, 9),
('skill-002', 'math_1', 'inequalities', 'Inequalities', 'Solve and graph linear inequalities', 'Algebra', 2, true, 7, 9),
('skill-003', 'math_2', 'functions-intro', 'Introduction to Functions', 'Understand function notation and basic properties', 'Algebra', 3, true, 8, 10),
('skill-004', 'math_2', 'polynomials', 'Polynomials', 'Operations with polynomials and factoring', 'Algebra', 4, true, 8, 10),
('skill-005', 'math_2', 'rational-expressions', 'Rational Expressions', 'Simplify and operate with rational expressions', 'Algebra', 5, true, 9, 11),
('skill-006', 'math_2', 'systems-equations', 'Systems of Equations', 'Solve systems using multiple methods', 'Algebra', 6, true, 8, 10),

-- Geometry skills
('skill-007', 'math_1', 'angles', 'Angles and Lines', 'Properties of angles, parallel lines, and transversals', 'Geometry', 1, true, 7, 9),
('skill-008', 'math_1', 'triangles', 'Triangles', 'Triangle properties, congruence, and similarity', 'Geometry', 2, true, 7, 10),
('skill-009', 'math_2', 'circles', 'Circles', 'Circle properties, arcs, chords, and sectors', 'Geometry', 3, true, 8, 10),
('skill-010', 'math_2', 'proofs-intro', 'Introduction to Proofs', 'Basic geometric proof techniques', 'Geometry', 4, true, 8, 10),

-- Trigonometry skills
('skill-011', 'math_3', 'trig-functions', 'Trigonometric Functions', 'Sin, cos, tan and their properties', 'Trigonometry', 1, true, 9, 11),
('skill-012', 'math_3', 'trig-identities', 'Trigonometric Identities', 'Prove and apply trig identities', 'Trigonometry', 2, true, 10, 12),
('skill-013', 'math_3', 'trig-applications', 'Applications of Trigonometry', 'Real-world applications and problem solving', 'Trigonometry', 3, true, 10, 12),

-- Pre-Calculus skills
('skill-014', 'pre_calc', 'advanced-functions', 'Advanced Functions', 'Polynomial, rational, exponential, and logarithmic functions', 'Pre-Calculus', 1, true, 10, 12),
('skill-015', 'pre_calc', 'limits-intro', 'Introduction to Limits', 'Concept of limits and basic calculations', 'Pre-Calculus', 2, true, 11, 12),
('skill-016', 'pre_calc', 'sequences-series', 'Sequences and Series', 'Arithmetic and geometric sequences, series notation', 'Pre-Calculus', 3, true, 10, 12),

-- Calculus skills
('skill-017', 'ap_calc_ab', 'limits', 'Limits', 'Formal definition and evaluation of limits', 'Calculus', 1, true, 11, 12),
('skill-018', 'ap_calc_ab', 'derivatives-intro', 'Introduction to Derivatives', 'Definition and basic derivative rules', 'Calculus', 2, true, 11, 12),
('skill-019', 'ap_calc_ab', 'integrals-intro', 'Introduction to Integrals', 'Antiderivatives and basic integration', 'Calculus', 3, true, 11, 12),

-- Statistics skills
('skill-020', 'ap_stats', 'descriptive-stats', 'Descriptive Statistics', 'Measures of center, spread, and data visualization', 'Statistics', 1, true, 9, 12),
('skill-021', 'ap_stats', 'probability', 'Probability', 'Basic probability rules and calculations', 'Statistics', 2, true, 9, 12),
('skill-022', 'ap_stats', 'distributions', 'Probability Distributions', 'Normal, binomial, and other distributions', 'Statistics', 3, true, 10, 12),
('skill-023', 'ap_stats', 'inference', 'Statistical Inference', 'Confidence intervals and hypothesis testing', 'Statistics', 4, true, 11, 12)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- ============================================================================
-- SAMPLE PRODUCTS
-- ============================================================================

INSERT INTO products (id, name, description, product_type, credits, price_cents, currency, is_active, stripe_product_id, metadata) VALUES
('prod-001', 'Single Session', '1 tutoring session credit', 'package', 1, 7500, 'USD', true, null, '{"popular": false}'),
('prod-002', '5 Session Pack', '5 tutoring sessions - Save 10%', 'package', 5, 33750, 'USD', true, null, '{"popular": true, "savings": "10%"}'),
('prod-003', '10 Session Pack', '10 tutoring sessions - Save 15%', 'package', 10, 63750, 'USD', true, null, '{"popular": false, "savings": "15%"}'),
('prod-004', '20 Session Pack', '20 tutoring sessions - Save 20%', 'package', 20, 120000, 'USD', true, null, '{"popular": false, "savings": "20%", "best_value": true}'),
('prod-005', 'Monthly Unlimited', 'Unlimited sessions per month', 'subscription', 999, 49900, 'USD', true, null, '{"billing": "monthly", "features": ["Unlimited sessions", "Priority booking", "Progress reports"]}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_cents = EXCLUDED.price_cents;
