-- ============================================================================
-- CERTIFICATION PROGRAMS SEED DATA
-- ============================================================================

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

-- ============================================================================
-- SKILL MASTERY CERTIFICATIONS (Students)
-- ============================================================================

INSERT INTO certification_programs (
  id, code, name, description, short_description,
  cert_type, level, category,
  badge_color, estimated_hours, difficulty_rating,
  target_audience, grade_level_min, grade_level_max,
  is_free, is_featured, display_order
) VALUES
-- Algebra Track
(
  'c0000000-0000-0000-0001-000000000001', 'ALG1-BRONZE', 'Algebra I Foundations',
  'Demonstrates fundamental understanding of algebraic concepts including variables, expressions, and basic equations.',
  'Master the basics of algebra',
  'skill_mastery', 'bronze', 'algebra',
  '#CD7F32', 20, 2,
  'student', 7, 9,
  true, true, 1
),
(
  'c0000000-0000-0000-0001-000000000002', 'ALG1-SILVER', 'Algebra I Proficient',
  'Shows proficiency in solving linear equations, working with inequalities, and understanding functions.',
  'Proficient in Algebra I concepts',
  'skill_mastery', 'silver', 'algebra',
  '#C0C0C0', 40, 3,
  'student', 7, 10,
  true, false, 2
),
(
  'c0000000-0000-0000-0001-000000000003', 'ALG1-GOLD', 'Algebra I Mastery',
  'Demonstrates mastery of all Algebra I topics including systems of equations and quadratic expressions.',
  'Complete mastery of Algebra I',
  'skill_mastery', 'gold', 'algebra',
  '#FFD700', 60, 4,
  'student', 8, 10,
  true, true, 3
),

-- Geometry Track
(
  'c0000000-0000-0000-0002-000000000001', 'GEO-BRONZE', 'Geometry Foundations',
  'Understanding of basic geometric shapes, angles, and spatial relationships.',
  'Master geometry basics',
  'skill_mastery', 'bronze', 'geometry',
  '#CD7F32', 20, 2,
  'student', 8, 10,
  true, false, 4
),
(
  'c0000000-0000-0000-0002-000000000002', 'GEO-GOLD', 'Geometry Mastery',
  'Complete mastery of geometry including proofs, trigonometry, and coordinate geometry.',
  'Complete geometry mastery',
  'skill_mastery', 'gold', 'geometry',
  '#FFD700', 50, 4,
  'student', 9, 11,
  true, false, 5
),

-- Statistics Track
(
  'c0000000-0000-0000-0003-000000000001', 'STAT-SILVER', 'Statistics Proficient',
  'Proficiency in data analysis, probability, and statistical reasoning.',
  'Proficient in statistics',
  'skill_mastery', 'silver', 'statistics',
  '#C0C0C0', 35, 3,
  'student', 9, 12,
  true, false, 6
),

-- Calculus Track
(
  'c0000000-0000-0000-0004-000000000001', 'CALC-BRONZE', 'Pre-Calculus Ready',
  'Prepared for calculus with strong foundation in functions, limits concepts, and analytical thinking.',
  'Ready for calculus',
  'skill_mastery', 'bronze', 'calculus',
  '#CD7F32', 45, 3,
  'student', 10, 12,
  true, false, 7
),
(
  'c0000000-0000-0000-0004-000000000002', 'CALC-GOLD', 'Calculus Mastery',
  'Complete mastery of differential and integral calculus.',
  'Master calculus',
  'skill_mastery', 'gold', 'calculus',
  '#FFD700', 80, 5,
  'student', 11, 12,
  true, true, 8
)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- CAREER PATHWAY CERTIFICATIONS
-- ============================================================================

INSERT INTO certification_programs (
  id, code, name, description, short_description,
  cert_type, level, category,
  badge_color, estimated_hours, difficulty_rating,
  target_audience, min_age,
  is_free, price_cents, is_featured, display_order
) VALUES
-- Actuarial Science
(
  'c0000000-0000-0000-0010-000000000001', 'ACT-FOUND', 'Actuarial Foundations',
  'Introduction to actuarial concepts including probability, financial mathematics, and risk assessment fundamentals.',
  'Start your actuarial journey',
  'career_pathway', 'foundation', 'actuarial',
  '#1E40AF', 40, 3,
  'student', 14,
  true, 0, true, 20
),
(
  'c0000000-0000-0000-0010-000000000002', 'ACT-P-PREP', 'Exam P Preparation',
  'Comprehensive preparation for SOA Exam P covering probability theory, random variables, and distributions.',
  'Prepare for SOA Exam P',
  'career_pathway', 'silver', 'actuarial',
  '#1E40AF', 100, 4,
  'student', 16,
  false, 4999, true, 21
),
(
  'c0000000-0000-0000-0010-000000000003', 'ACT-FM-PREP', 'Exam FM Preparation',
  'Financial mathematics preparation covering interest theory, annuities, and bonds.',
  'Prepare for SOA Exam FM',
  'career_pathway', 'silver', 'actuarial',
  '#1E40AF', 100, 4,
  'student', 16,
  false, 4999, false, 22
),

-- Data Science
(
  'c0000000-0000-0000-0011-000000000001', 'DS-FOUND', 'Data Science Foundations',
  'Introduction to data science covering statistics, data visualization, and basic programming concepts.',
  'Begin your data science journey',
  'career_pathway', 'foundation', 'data-science',
  '#059669', 50, 3,
  'student', 14,
  true, 0, true, 30
),
(
  'c0000000-0000-0000-0011-000000000002', 'DS-STATS', 'Statistical Modeling',
  'Advanced statistical concepts including regression, hypothesis testing, and predictive modeling.',
  'Master statistical modeling',
  'career_pathway', 'silver', 'data-science',
  '#059669', 80, 4,
  'student', 16,
  false, 3999, false, 31
),
(
  'c0000000-0000-0000-0011-000000000003', 'DS-ML', 'Machine Learning Fundamentals',
  'Introduction to machine learning algorithms, model evaluation, and practical applications.',
  'Learn machine learning',
  'career_pathway', 'gold', 'data-science',
  '#059669', 100, 5,
  'student', 16,
  false, 5999, true, 32
),

-- Epidemiology
(
  'c0000000-0000-0000-0012-000000000001', 'EPI-FOUND', 'Epidemiological Modeling Foundations',
  'Introduction to disease modeling, SIR models, and population health mathematics.',
  'Learn epidemic modeling',
  'career_pathway', 'foundation', 'epidemiology',
  '#DC2626', 45, 3,
  'student', 15,
  true, 0, false, 40
),
(
  'c0000000-0000-0000-0012-000000000002', 'EPI-ADV', 'Advanced Epidemiological Modeling',
  'Complex disease models, parameter estimation, and real-world public health applications.',
  'Advanced epidemic modeling',
  'career_pathway', 'gold', 'epidemiology',
  '#DC2626', 90, 5,
  'student', 16,
  false, 4999, false, 41
),

-- Robotics
(
  'c0000000-0000-0000-0013-000000000001', 'ROBO-FOUND', 'Robotics Mathematics Foundations',
  'Mathematical foundations for robotics including vectors, matrices, and basic control theory.',
  'Math for robotics',
  'career_pathway', 'foundation', 'robotics',
  '#7C3AED', 40, 3,
  'student', 12,
  true, 0, true, 50
),
(
  'c0000000-0000-0000-0013-000000000002', 'ROBO-ARDUINO', 'Arduino Programming',
  'Hands-on Arduino programming with emphasis on mathematical concepts in sensor reading and motor control.',
  'Program Arduino robots',
  'career_pathway', 'bronze', 'robotics',
  '#7C3AED', 50, 3,
  'student', 12,
  false, 2999, true, 51
),
(
  'c0000000-0000-0000-0013-000000000003', 'ROBO-MOTION', 'Motion Planning',
  'Advanced robotics covering kinematics, path planning, and control systems mathematics.',
  'Master robot motion planning',
  'career_pathway', 'gold', 'robotics',
  '#7C3AED', 80, 5,
  'student', 15,
  false, 4999, false, 52
),

-- Financial Mathematics
(
  'c0000000-0000-0000-0014-000000000001', 'FIN-FOUND', 'Financial Mathematics Foundations',
  'Introduction to quantitative finance including time value of money, interest rates, and basic derivatives.',
  'Learn financial math',
  'career_pathway', 'foundation', 'financial-math',
  '#0891B2', 45, 3,
  'student', 15,
  true, 0, false, 60
),
(
  'c0000000-0000-0000-0014-000000000002', 'FIN-QUANT', 'Quantitative Finance',
  'Advanced financial mathematics including options pricing, portfolio theory, and risk management.',
  'Master quantitative finance',
  'career_pathway', 'gold', 'financial-math',
  '#0891B2', 100, 5,
  'student', 17,
  false, 5999, false, 61
)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- COMPETITION PREP CERTIFICATIONS
-- ============================================================================

INSERT INTO certification_programs (
  id, code, name, description, short_description,
  cert_type, level, category,
  badge_color, estimated_hours, difficulty_rating,
  target_audience, grade_level_min, grade_level_max,
  is_free, is_featured, display_order
) VALUES
(
  'c0000000-0000-0000-0020-000000000001', 'AMC8-READY', 'AMC 8 Ready',
  'Prepared for the AMC 8 competition with strong problem-solving skills in arithmetic, algebra, and geometry.',
  'Ready for AMC 8',
  'competition_prep', 'bronze', 'competition',
  '#F59E0B', 30, 3,
  'student', 5, 8,
  true, true, 70
),
(
  'c0000000-0000-0000-0020-000000000002', 'AMC10-READY', 'AMC 10 Ready',
  'Prepared for AMC 10 with advanced problem-solving skills including number theory and combinatorics.',
  'Ready for AMC 10',
  'competition_prep', 'silver', 'competition',
  '#F59E0B', 60, 4,
  'student', 8, 10,
  true, true, 71
),
(
  'c0000000-0000-0000-0020-000000000003', 'AMC12-READY', 'AMC 12 Ready',
  'Prepared for AMC 12 with comprehensive problem-solving including complex numbers and advanced geometry.',
  'Ready for AMC 12',
  'competition_prep', 'gold', 'competition',
  '#F59E0B', 80, 5,
  'student', 10, 12,
  true, false, 72
),
(
  'c0000000-0000-0000-0020-000000000004', 'MATHCOUNTS-READY', 'MATHCOUNTS Ready',
  'Prepared for MATHCOUNTS competition with speed and accuracy in middle school mathematics.',
  'Ready for MATHCOUNTS',
  'competition_prep', 'silver', 'competition',
  '#F59E0B', 50, 4,
  'student', 6, 8,
  true, true, 73
)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- TUTOR CERTIFICATIONS
-- ============================================================================

INSERT INTO certification_programs (
  id, code, name, description, short_description,
  cert_type, level, category,
  badge_color, estimated_hours, difficulty_rating,
  target_audience, validity_months,
  is_free, price_cents, is_featured, display_order
) VALUES
(
  'c0000000-0000-0000-0030-000000000001', 'TUTOR-BASIC', 'MathPivot Certified Tutor',
  'Completed MathPivot tutor training including pedagogy, platform usage, and student engagement.',
  'Certified MathPivot Tutor',
  'tutor_qualification', 'bronze', 'tutor',
  '#6366F1', 10, 2,
  'tutor', 12,
  true, 0, false, 80
),
(
  'c0000000-0000-0000-0030-000000000002', 'TUTOR-ELEM', 'Elementary Math Specialist',
  'Specialized in teaching K-5 mathematics with age-appropriate methods and engaging activities.',
  'Elementary math specialist',
  'tutor_qualification', 'silver', 'tutor',
  '#6366F1', 20, 3,
  'tutor', 24,
  true, 0, false, 81
),
(
  'c0000000-0000-0000-0030-000000000003', 'TUTOR-MIDDLE', 'Middle School Math Specialist',
  'Specialized in teaching grades 6-8 mathematics including pre-algebra and introductory algebra.',
  'Middle school math specialist',
  'tutor_qualification', 'silver', 'tutor',
  '#6366F1', 20, 3,
  'tutor', 24,
  true, 0, false, 82
),
(
  'c0000000-0000-0000-0030-000000000004', 'TUTOR-HIGH', 'High School Math Specialist',
  'Specialized in teaching high school mathematics including algebra, geometry, and calculus.',
  'High school math specialist',
  'tutor_qualification', 'gold', 'tutor',
  '#6366F1', 30, 4,
  'tutor', 24,
  true, 0, false, 83
),
(
  'c0000000-0000-0000-0030-000000000005', 'TUTOR-COMP', 'Competition Math Coach',
  'Qualified to coach students for math competitions including AMC, MATHCOUNTS, and olympiads.',
  'Competition math coach',
  'tutor_qualification', 'platinum', 'tutor',
  '#6366F1', 40, 5,
  'tutor', 24,
  false, 2999, true, 84
)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SAMPLE REQUIREMENTS FOR ALG1-GOLD
-- ============================================================================

INSERT INTO certification_requirements (
  id, program_id, requirement_type, name, description, parameters, is_required, display_order
) VALUES
(
  'b0000000-0000-0000-0001-000000000001',
  'c0000000-0000-0000-0001-000000000003',
  'skill_count',
  'Master Core Algebra Skills',
  'Master at least 15 algebra skills to level 3 or higher',
  '{"category": "algebra", "min_count": 15, "min_level": 3}',
  true, 1
),
(
  'b0000000-0000-0000-0001-000000000002',
  'c0000000-0000-0000-0001-000000000003',
  'sessions_completed',
  'Complete Tutoring Sessions',
  'Complete at least 10 tutoring sessions',
  '{"min_sessions": 10}',
  true, 2
),
(
  'b0000000-0000-0000-0001-000000000003',
  'c0000000-0000-0000-0001-000000000003',
  'assessment_passed',
  'Pass Final Assessment',
  'Score 85% or higher on the Algebra I Mastery Assessment',
  '{"assessment_id": "e0000000-0000-0000-0001-000000000001", "min_score": 85}',
  true, 3
),
(
  'b0000000-0000-0000-0001-000000000004',
  'c0000000-0000-0000-0001-000000000003',
  'prerequisite_cert',
  'Earn Silver Certification',
  'Must have earned Algebra I Proficient (Silver) certification',
  '{"program_id": "c0000000-0000-0000-0001-000000000002"}',
  true, 4
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE REQUIREMENTS FOR ACTUARIAL P PREP
-- ============================================================================

INSERT INTO certification_requirements (
  id, program_id, requirement_type, name, description, parameters, is_required, display_order
) VALUES
(
  'b0000000-0000-0000-0002-000000000001',
  'c0000000-0000-0000-0010-000000000002',
  'prerequisite_cert',
  'Complete Foundations',
  'Complete Actuarial Foundations certification',
  '{"program_id": "c0000000-0000-0000-0010-000000000001"}',
  true, 1
),
(
  'b0000000-0000-0000-0002-000000000002',
  'c0000000-0000-0000-0010-000000000002',
  'hours_logged',
  'Study Hours',
  'Log at least 80 hours of exam preparation',
  '{"min_hours": 80, "category": "actuarial"}',
  true, 2
),
(
  'b0000000-0000-0000-0002-000000000003',
  'c0000000-0000-0000-0010-000000000002',
  'assessment_passed',
  'Practice Exams',
  'Pass 3 practice exams with 70% or higher',
  '{"assessment_id": "e0000000-0000-0000-0002-000000000001", "min_score": 70}',
  true, 3
),
(
  'b0000000-0000-0000-0002-000000000004',
  'c0000000-0000-0000-0010-000000000002',
  'assessment_passed',
  'Final Readiness Exam',
  'Score 75% or higher on final readiness assessment',
  '{"assessment_id": "e0000000-0000-0000-0002-000000000002", "min_score": 75}',
  true, 4
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE ASSESSMENT FOR ALGEBRA
-- ============================================================================

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
  'Comprehensive assessment covering all Algebra I topics including equations, inequalities, functions, and systems.',
  'You have 90 minutes to complete this assessment. A calculator is allowed. You must score 85% or higher to pass.',
  'quiz',
  90,
  3, 48, 85.00, 100.00,
  40, true, true,
  true, true,
  true, true
)
ON CONFLICT (code) DO NOTHING;

-- Sample questions for Algebra assessment
INSERT INTO assessment_questions (
  id, assessment_id, question_type, question_text, options, correct_answer,
  points, difficulty, display_order
) VALUES
(
  'd0000000-0000-0000-0001-000000000001',
  'e0000000-0000-0000-0001-000000000001',
  'multiple_choice',
  'Solve for x: 3x + 7 = 22',
  '[{"id": "a", "text": "x = 3"}, {"id": "b", "text": "x = 5"}, {"id": "c", "text": "x = 7"}, {"id": "d", "text": "x = 15"}]',
  '"b"',
  2.5, 2, 1
),
(
  'd0000000-0000-0000-0001-000000000002',
  'e0000000-0000-0000-0001-000000000001',
  'multiple_choice',
  'Which equation represents a line with slope 2 passing through point (0, 3)?',
  '[{"id": "a", "text": "y = 2x + 3"}, {"id": "b", "text": "y = 3x + 2"}, {"id": "c", "text": "y = 2x - 3"}, {"id": "d", "text": "y = -2x + 3"}]',
  '"a"',
  2.5, 2, 2
),
(
  'd0000000-0000-0000-0001-000000000003',
  'e0000000-0000-0000-0001-000000000001',
  'numeric',
  'Evaluate: 2^4 + 3^2',
  NULL,
  '{"value": 25, "tolerance": 0}',
  2.5, 1, 3
),
(
  'd0000000-0000-0000-0001-000000000004',
  'e0000000-0000-0000-0001-000000000001',
  'multiple_select',
  'Select all expressions that simplify to 6x:',
  '[{"id": "a", "text": "3x + 3x"}, {"id": "b", "text": "2(3x)"}, {"id": "c", "text": "x + 5x"}, {"id": "d", "text": "12x ÷ 2"}]',
  '["a", "b", "c", "d"]',
  2.5, 2, 4
),
(
  'd0000000-0000-0000-0001-000000000005',
  'e0000000-0000-0000-0001-000000000001',
  'multiple_choice',
  'If f(x) = 2x² - 3x + 1, what is f(2)?',
  '[{"id": "a", "text": "3"}, {"id": "b", "text": "5"}, {"id": "c", "text": "7"}, {"id": "d", "text": "9"}]',
  '"a"',
  2.5, 3, 5
),
(
  'd0000000-0000-0000-0001-000000000006',
  'e0000000-0000-0000-0001-000000000001',
  'multiple_choice',
  'Solve the system: y = 2x + 1 and y = -x + 7. What is x?',
  '[{"id": "a", "text": "1"}, {"id": "b", "text": "2"}, {"id": "c", "text": "3"}, {"id": "d", "text": "4"}]',
  '"b"',
  2.5, 3, 6
),
(
  'd0000000-0000-0000-0001-000000000007',
  'e0000000-0000-0000-0001-000000000001',
  'true_false',
  'The expression (x + 3)² equals x² + 9',
  '[{"id": "true", "text": "True"}, {"id": "false", "text": "False"}]',
  '"false"',
  2.5, 2, 7
),
(
  'd0000000-0000-0000-0001-000000000008',
  'e0000000-0000-0000-0001-000000000001',
  'numeric',
  'What is the y-intercept of the line 4x - 2y = 10?',
  NULL,
  '{"value": -5, "tolerance": 0}',
  2.5, 3, 8
)
ON CONFLICT DO NOTHING;
