-- Migration 00048: Diagnostic question bank expansion (grades 9-11)
-- Adds coverage for Algebra 1, Geometry, Algebra 2, and Pre-Calculus so that
-- /diagnostic/grade/9, /grade/10, and /grade/11 pull real, level-appropriate items.

-- ============================================================================
-- Grade 9 · Algebra 1 (grade_band '8-9' and '9-10')
-- ============================================================================

INSERT INTO diagnostic_questions (domain, grade_band, difficulty, question_text, question_type, choices, correct_answer, explanation, standard_code, concept_tag) VALUES
('functions', '9-10', 2, 'What is the y-intercept of the line y = -3x + 7?', 'multiple_choice', '["-3", "3", "7", "-7"]', '7', 'In slope-intercept form y = mx + b, the y-intercept is b.', 'NC.M1.F-IF.4', 'y_intercept'),
('functions', '9-10', 3, 'A function is defined by f(x) = 2x² - 3. What is f(-4)?', 'multiple_choice', '["29", "-19", "-11", "13"]', '29', 'f(-4) = 2(-4)² - 3 = 2(16) - 3 = 32 - 3 = 29', 'NC.M1.F-IF.2', 'function_evaluation'),
('functions', '9-10', 4, 'Which is a solution to x² - 5x + 6 = 0?', 'multiple_choice', '["x = 1", "x = 2", "x = 4", "x = 6"]', 'x = 2', 'Factor: (x-2)(x-3) = 0, so x = 2 or x = 3.', 'NC.M1.A-REI.4', 'quadratic_factoring'),
('expressions_equations', '9-10', 2, 'Solve the system: y = 2x + 1 and y = x + 4', 'multiple_choice', '["(3, 7)", "(1, 3)", "(-3, -5)", "(0, 1)"]', '(3, 7)', 'Set equal: 2x + 1 = x + 4 → x = 3, then y = 2(3) + 1 = 7.', 'NC.M1.A-REI.6', 'systems_substitution'),
('expressions_equations', '9-10', 3, 'Which expression is equivalent to (2x - 3)²?', 'multiple_choice', '["4x² - 9", "4x² + 9", "4x² - 12x + 9", "4x² - 6x + 9"]', '4x² - 12x + 9', '(2x - 3)² = (2x)² - 2(2x)(3) + 3² = 4x² - 12x + 9', 'NC.M1.A-SSE.2', 'binomial_square'),
('expressions_equations', '9-10', 4, 'Factor completely: x² - 9', 'multiple_choice', '["(x - 3)(x + 3)", "(x - 3)²", "(x + 3)²", "Cannot be factored"]', '(x - 3)(x + 3)', 'Difference of squares: a² - b² = (a-b)(a+b).', 'NC.M1.A-SSE.3', 'difference_of_squares'),
('functions', '8-9', 3, 'A function has domain {-2, 0, 1, 4} and rule f(x) = x + 5. What is the range?', 'multiple_choice', '["{3, 5, 6, 9}", "{7, 5, 6, 9}", "{-7, -5, -4, -1}", "{3, 4, 5, 6}"]', '{3, 5, 6, 9}', 'Apply f to each: f(-2)=3, f(0)=5, f(1)=6, f(4)=9.', 'NC.M1.F-IF.1', 'domain_range'),
('statistics', '9-10', 2, 'The mean of five numbers is 12. Four of the numbers are 8, 10, 14, and 16. What is the fifth?', 'multiple_choice', '["12", "14", "10", "8"]', '12', 'Sum = 5 × 12 = 60. 8+10+14+16 = 48. Fifth = 60 - 48 = 12.', 'NC.M1.S-ID.2', 'mean'),
('statistics', '9-10', 3, 'Which measure of spread is most affected by outliers?', 'multiple_choice', '["Median", "Interquartile range", "Range", "Mode"]', 'Range', 'Range = max − min, so a single outlier at either extreme changes it directly.', 'NC.M1.S-ID.3', 'measures_of_spread'),
('geometry', '9-10', 3, 'A right triangle has legs of 6 and 8. What is the hypotenuse?', 'multiple_choice', '["10", "12", "14", "48"]', '10', 'By Pythagorean theorem: √(6² + 8²) = √100 = 10.', 'NC.8.G.7', 'pythagorean')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Grade 10 · Geometry + Algebra continuation (grade_band '9-10' focus)
-- ============================================================================

INSERT INTO diagnostic_questions (domain, grade_band, difficulty, question_text, question_type, choices, correct_answer, explanation, standard_code, concept_tag) VALUES
('geometry', '9-10', 2, 'What is the sum of the interior angles of a hexagon?', 'multiple_choice', '["540°", "720°", "900°", "1080°"]', '720°', '(n − 2) × 180 = (6 − 2) × 180 = 720°.', 'NC.M2.G-CO.11', 'polygon_angles'),
('geometry', '9-10', 3, 'Two triangles are similar with a scale factor of 3. If the smaller triangle has area 12, what is the larger triangle''s area?', 'multiple_choice', '["36", "72", "108", "144"]', '108', 'Areas scale by the square of the ratio: 12 × 3² = 108.', 'NC.M2.G-SRT.5', 'similar_areas'),
('geometry', '9-10', 4, 'In a right triangle, one acute angle is 30° and the hypotenuse is 12. What is the length of the side opposite the 30° angle?', 'multiple_choice', '["6", "6√3", "12", "24"]', '6', 'sin(30°) = opp/hyp = 1/2, so opp = 12 × 1/2 = 6.', 'NC.M2.G-SRT.7', 'right_triangle_trig'),
('geometry', '9-10', 3, 'A circle has radius 5. What is its area? (use π)', 'multiple_choice', '["10π", "25π", "50π", "100π"]', '25π', 'Area = πr² = π(5)² = 25π.', 'NC.7.G.4', 'circle_area'),
('geometry', '10-11', 3, 'What is the distance between the points (1, 2) and (4, 6)?', 'multiple_choice', '["3", "4", "5", "7"]', '5', '√((4-1)² + (6-2)²) = √(9 + 16) = √25 = 5.', 'NC.M2.G-GPE.7', 'distance_formula'),
('geometry', '10-11', 4, 'A chord of a circle is 8 units and lies 3 units from the center. What is the radius?', 'multiple_choice', '["4", "5", "√73", "7"]', '5', 'Half-chord (4) and distance from center (3) form legs of a right triangle with the radius as hypotenuse: r = √(3² + 4²) = 5.', 'NC.M2.G-C.2', 'chord_radius'),
('statistics', '10-11', 3, 'Two fair coins are flipped. What is the probability of exactly one head?', 'multiple_choice', '["1/4", "1/3", "1/2", "3/4"]', '1/2', 'Outcomes: HH, HT, TH, TT. Exactly one head: HT or TH → 2/4 = 1/2.', 'NC.M2.S-CP.7', 'probability_basic'),
('advanced_algebra', '10-11', 3, 'Simplify: (x² · x³) / x⁴', 'multiple_choice', '["x", "x²", "x⁴", "x⁹"]', 'x', 'Numerator: x^(2+3) = x⁵. Divide: x^(5-4) = x.', 'NC.M2.A-SSE.2', 'exponent_rules_advanced')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Grade 11 · Algebra 2 / Pre-Calculus (grade_band '10-11')
-- ============================================================================

INSERT INTO diagnostic_questions (domain, grade_band, difficulty, question_text, question_type, choices, correct_answer, explanation, standard_code, concept_tag) VALUES
('advanced_algebra', '10-11', 2, 'Simplify: log₁₀(1000)', 'multiple_choice', '["2", "3", "10", "100"]', '3', '10³ = 1000, so log₁₀(1000) = 3.', 'NC.M3.F-BF.5', 'logarithms_basic'),
('advanced_algebra', '10-11', 3, 'If f(x) = 2ˣ, what is f(5) / f(3)?', 'multiple_choice', '["2", "4", "8", "32"]', '4', 'f(5)/f(3) = 2⁵/2³ = 2^(5-3) = 2² = 4.', 'NC.M3.F-LE.4', 'exponential_ratio'),
('advanced_algebra', '10-11', 4, 'Solve: log₂(x) = 5', 'multiple_choice', '["2", "10", "25", "32"]', '32', 'log₂(x) = 5 means x = 2⁵ = 32.', 'NC.M3.F-BF.5', 'logarithm_equation'),
('advanced_algebra', '10-11', 3, 'What is the degree of the polynomial 4x³ − 2x⁵ + x − 7?', 'multiple_choice', '["1", "3", "5", "7"]', '5', 'Degree is the highest exponent on x. Here, x⁵ gives degree 5.', 'NC.M3.A-APR.1', 'polynomial_degree'),
('advanced_algebra', '10-11', 4, 'Which is a factor of x³ − 8?', 'multiple_choice', '["x − 4", "x + 4", "x − 2", "x² + 4"]', 'x − 2', 'Difference of cubes: a³ − b³ = (a − b)(a² + ab + b²). Here b = 2, so (x − 2) is a factor.', 'NC.M3.A-APR.4', 'difference_of_cubes'),
('trigonometry', '10-11', 2, 'What is sin(90°)?', 'multiple_choice', '["0", "1", "-1", "1/2"]', '1', 'On the unit circle at 90°, y-coordinate = 1, so sin(90°) = 1.', 'NC.M3.F-TF.2', 'sine_special'),
('trigonometry', '10-11', 3, 'If cos(θ) = 3/5 and θ is in the first quadrant, what is sin(θ)?', 'multiple_choice', '["3/5", "4/5", "5/4", "5/3"]', '4/5', 'sin²(θ) + cos²(θ) = 1 → sin²(θ) = 1 − 9/25 = 16/25 → sin(θ) = 4/5 (Q1 positive).', 'NC.M3.F-TF.8', 'pythagorean_identity'),
('trigonometry', '10-11', 4, 'What is the exact value of tan(45°)?', 'multiple_choice', '["1/2", "√2/2", "1", "√3"]', '1', 'tan(45°) = sin(45°)/cos(45°) = (√2/2)/(√2/2) = 1.', 'NC.M3.F-TF.2', 'tan_45'),
('functions', '10-11', 3, 'If f(x) = x + 3 and g(x) = 2x, what is (f ∘ g)(4)?', 'multiple_choice', '["8", "11", "14", "16"]', '11', '(f ∘ g)(4) = f(g(4)) = f(8) = 8 + 3 = 11.', 'NC.M3.F-BF.1', 'function_composition'),
('functions', '10-11', 4, 'What is the inverse of f(x) = 3x − 6?', 'multiple_choice', '["(x + 6)/3", "(x − 6)/3", "3/(x − 6)", "3(x + 6)"]', '(x + 6)/3', 'Swap x and y: x = 3y − 6 → y = (x + 6)/3.', 'NC.M3.F-BF.4', 'inverse_function'),
('statistics', '10-11', 3, 'A normal distribution has mean 50 and standard deviation 5. Approximately what percent of data lies between 45 and 55?', 'multiple_choice', '["50%", "68%", "95%", "99.7%"]', '68%', 'By the empirical rule, ~68% of data lies within 1 standard deviation of the mean.', 'NC.M3.S-ID.4', 'empirical_rule')
ON CONFLICT DO NOTHING;
