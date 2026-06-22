-- Migration 00042: Diagnostic Question Bank
-- Layer 1 (Diagnostic Infrastructure) + Layer 7 (Data Infrastructure)
-- Enables placement by assessment, not reported grade

-- Question bank for diagnostic assessments
CREATE TABLE IF NOT EXISTS diagnostic_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL CHECK (domain IN (
    'number_sense', 'ratios_proportions', 'expressions_equations',
    'functions', 'geometry', 'statistics', 'advanced_algebra', 'trigonometry'
  )),
  grade_band TEXT NOT NULL CHECK (grade_band IN ('6-7', '7-8', '8-9', '9-10', '10-11')),
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'numeric', 'select_all')),
  choices JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  standard_code TEXT,
  concept_tag TEXT,
  time_estimate_seconds INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dq_domain ON diagnostic_questions(domain) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_dq_grade ON diagnostic_questions(grade_band) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_dq_difficulty ON diagnostic_questions(difficulty);

-- RLS
ALTER TABLE diagnostic_questions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "dq_read" ON diagnostic_questions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed: 30 diagnostic questions across 6 core domains
-- Domain 1: Number Sense (Grade 6-7)
INSERT INTO diagnostic_questions (domain, grade_band, difficulty, question_text, question_type, choices, correct_answer, explanation, standard_code, concept_tag) VALUES
('number_sense', '6-7', 1, 'What is 3/4 + 1/8?', 'multiple_choice', '["5/8", "7/8", "4/12", "1/2"]', '7/8', 'Find common denominator: 6/8 + 1/8 = 7/8', 'NC.6.NS.1', 'fraction_addition'),
('number_sense', '6-7', 2, 'What is -5 + 8 - 3?', 'multiple_choice', '["0", "6", "-6", "10"]', '0', '-5 + 8 = 3, then 3 - 3 = 0', 'NC.7.NS.1', 'integer_operations'),
('number_sense', '6-7', 3, 'Which is greater: 0.45 or 3/7?', 'multiple_choice', '["0.45", "3/7", "They are equal", "Cannot determine"]', '0.45', '3/7 ≈ 0.4286, which is less than 0.45', 'NC.6.NS.7', 'comparing_rationals'),
('number_sense', '7-8', 3, 'Simplify: 2³ × 2⁴', 'multiple_choice', '["2⁷", "2¹²", "4⁷", "8"]', '2⁷', 'When multiplying same base, add exponents: 3+4=7', 'NC.8.EE.1', 'exponent_rules'),
('number_sense', '7-8', 4, 'Between which two integers does √50 lie?', 'multiple_choice', '["6 and 7", "7 and 8", "8 and 9", "24 and 26"]', '7 and 8', '7²=49 and 8²=64, so √50 is between 7 and 8', 'NC.8.NS.2', 'irrational_numbers')
ON CONFLICT DO NOTHING;

-- Domain 2: Ratios & Proportional Relationships (Grade 6-7, 7-8)
INSERT INTO diagnostic_questions (domain, grade_band, difficulty, question_text, question_type, choices, correct_answer, explanation, standard_code, concept_tag) VALUES
('ratios_proportions', '6-7', 1, 'A recipe uses 3 cups of flour for 24 cookies. How many cups for 40 cookies?', 'multiple_choice', '["4", "5", "6", "7"]', '5', '3/24 = x/40 → x = 3×40/24 = 5', 'NC.7.RP.1', 'unit_rates'),
('ratios_proportions', '6-7', 2, 'A shirt originally costs $40 and is 25% off. What is the sale price?', 'multiple_choice', '["$10", "$15", "$30", "$35"]', '$30', '25% of $40 = $10 discount. $40 - $10 = $30', 'NC.7.RP.3', 'percent_problems'),
('ratios_proportions', '6-7', 3, 'If y = 4x, which statement is true?', 'multiple_choice', '["y is proportional to x with k=4", "x is proportional to y with k=4", "The relationship is not proportional", "k = 1/4"]', 'y is proportional to x with k=4', 'y = kx where k is the constant of proportionality', 'NC.7.RP.2', 'proportional_equations'),
('ratios_proportions', '7-8', 3, 'A map scale is 1 inch = 15 miles. Two cities are 4.5 inches apart on the map. What is the actual distance?', 'multiple_choice', '["45 miles", "60 miles", "67.5 miles", "75 miles"]', '67.5 miles', '4.5 × 15 = 67.5 miles', 'NC.7.RP.1', 'scale_problems'),
('ratios_proportions', '7-8', 4, 'A population grows from 2,000 to 2,500 in one year. What is the percent increase?', 'multiple_choice', '["20%", "25%", "50%", "125%"]', '25%', '(2500-2000)/2000 × 100 = 25%', 'NC.7.RP.3', 'percent_change')
ON CONFLICT DO NOTHING;

-- Domain 3: Expressions & Equations (Grade 7-8, 8-9)
INSERT INTO diagnostic_questions (domain, grade_band, difficulty, question_text, question_type, choices, correct_answer, explanation, standard_code, concept_tag) VALUES
('expressions_equations', '7-8', 2, 'Solve: 3x + 7 = 22', 'multiple_choice', '["3", "5", "7", "15"]', '5', '3x = 15, x = 5', 'NC.7.EE.4', 'linear_equations'),
('expressions_equations', '7-8', 3, 'Solve: 2(x - 3) = 4x + 2', 'multiple_choice', '["x = -4", "x = -2", "x = 2", "x = 4"]', 'x = -4', '2x - 6 = 4x + 2 → -2x = 8 → x = -4', 'NC.8.EE.7', 'multi_step_equations'),
('expressions_equations', '8-9', 3, 'What is the slope of the line passing through (2, 5) and (4, 11)?', 'multiple_choice', '["2", "3", "6", "8"]', '3', 'slope = (11-5)/(4-2) = 6/2 = 3', 'NC.M1.F-IF.6', 'slope'),
('expressions_equations', '8-9', 4, 'Solve the system: x + y = 10, 2x - y = 5', 'multiple_choice', '["x=5, y=5", "x=3, y=7", "x=7, y=3", "x=15, y=-5"]', 'x=5, y=5', 'Add equations: 3x = 15, x = 5, y = 5', 'NC.M1.A-REI.6', 'systems_of_equations'),
('expressions_equations', '8-9', 5, 'Factor: x² - 5x + 6', 'multiple_choice', '["(x-2)(x-3)", "(x+2)(x+3)", "(x-1)(x-6)", "(x+1)(x-6)"]', '(x-2)(x-3)', 'Find two numbers that multiply to 6 and add to -5: -2 and -3', 'NC.M1.A-SSE.3', 'factoring')
ON CONFLICT DO NOTHING;

-- Domain 4: Functions (Grade 8-9, 9-10)
INSERT INTO diagnostic_questions (domain, grade_band, difficulty, question_text, question_type, choices, correct_answer, explanation, standard_code, concept_tag) VALUES
('functions', '8-9', 2, 'Is the relation {(1,3), (2,5), (3,7), (1,9)} a function?', 'multiple_choice', '["Yes", "No", "Only if graphed", "Cannot determine"]', 'No', 'Input 1 maps to both 3 and 9, violating the function definition', 'NC.8.F.1', 'function_definition'),
('functions', '8-9', 3, 'For f(x) = 2x + 1, what is f(4)?', 'multiple_choice', '["7", "8", "9", "10"]', '9', 'f(4) = 2(4) + 1 = 9', 'NC.M1.F-IF.2', 'function_notation'),
('functions', '8-9', 3, 'Which table represents a linear function?', 'multiple_choice', '["x:1,2,3,4 y:2,4,8,16", "x:1,2,3,4 y:3,5,7,9", "x:1,2,3,4 y:1,4,9,16", "x:1,2,3,4 y:2,4,6,10"]', 'x:1,2,3,4 y:3,5,7,9', 'Constant rate of change (+2) indicates linearity', 'NC.8.F.3', 'linear_vs_nonlinear'),
('functions', '9-10', 4, 'A ball is thrown with height h(t) = -16t² + 48t + 4. When does it reach maximum height?', 'multiple_choice', '["t = 1", "t = 1.5", "t = 2", "t = 3"]', 't = 1.5', 'Max at t = -b/2a = -48/(2×-16) = 1.5', 'NC.M1.F-IF.4', 'quadratic_vertex'),
('functions', '9-10', 4, 'Which function is exponential growth?', 'multiple_choice', '["y = 3x + 2", "y = x²", "y = 2(1.5)ˣ", "y = 2(0.5)ˣ"]', 'y = 2(1.5)ˣ', 'Base > 1 means growth; y = 2(0.5)ˣ is decay', 'NC.M1.F-LE.1', 'exponential_growth')
ON CONFLICT DO NOTHING;

-- Domain 5: Geometry (Grade 7-8, 8-9)
INSERT INTO diagnostic_questions (domain, grade_band, difficulty, question_text, question_type, choices, correct_answer, explanation, standard_code, concept_tag) VALUES
('geometry', '7-8', 2, 'What is the area of a triangle with base 10 and height 6?', 'multiple_choice', '["16", "30", "60", "120"]', '30', 'A = ½ × b × h = ½ × 10 × 6 = 30', 'NC.7.G.6', 'area'),
('geometry', '7-8', 3, 'A right triangle has legs of length 3 and 4. What is the hypotenuse?', 'multiple_choice', '["5", "6", "7", "12"]', '5', '3² + 4² = 9 + 16 = 25; √25 = 5', 'NC.8.G.7', 'pythagorean_theorem'),
('geometry', '8-9', 3, 'What is the volume of a cylinder with radius 3 and height 10?', 'multiple_choice', '["30π", "60π", "90π", "900π"]', '90π', 'V = πr²h = π(9)(10) = 90π', 'NC.8.G.9', 'volume'),
('geometry', '8-9', 4, 'Point A is at (1,2) and point B is at (4,6). What is the distance between them?', 'multiple_choice', '["3", "4", "5", "7"]', '5', 'd = √((4-1)² + (6-2)²) = √(9+16) = 5', 'NC.8.G.8', 'coordinate_distance'),
('geometry', '8-9', 4, 'Triangle ABC is similar to triangle DEF. If AB=6, BC=8, and DE=9, what is EF?', 'multiple_choice', '["10", "11", "12", "13"]', '12', 'Scale factor = 9/6 = 1.5; EF = 8 × 1.5 = 12', 'NC.8.G.4', 'similarity')
ON CONFLICT DO NOTHING;

-- Domain 6: Statistics & Probability (Grade 7-8)
INSERT INTO diagnostic_questions (domain, grade_band, difficulty, question_text, question_type, choices, correct_answer, explanation, standard_code, concept_tag) VALUES
('statistics', '6-7', 2, 'Find the median of: 3, 7, 1, 9, 5', 'multiple_choice', '["3", "5", "7", "9"]', '5', 'Ordered: 1,3,5,7,9. Middle value = 5', 'NC.6.SP.5', 'median'),
('statistics', '7-8', 3, 'A bag has 3 red, 5 blue, and 2 green marbles. If you pick one marble without looking, what is the probability of picking a blue marble?', 'multiple_choice', '["1/2", "3/10", "1/5", "5/10"]', '1/2', '5 blue out of 10 total = 5/10 = 1/2', 'NC.7.SP.7', 'probability'),
('statistics', '8-9', 3, 'A scatter plot shows a negative correlation. Which is most likely the line of best fit?', 'multiple_choice', '["y = 2x + 5", "y = -3x + 10", "y = x²", "y = 5"]', 'y = -3x + 10', 'Negative correlation means negative slope', 'NC.M1.S-ID.6', 'correlation'),
('statistics', '8-9', 4, 'In a two-way frequency table, 40 out of 100 students who study pass the test, and 20 out of 100 who do not study pass. Is there an association between studying and passing?', 'multiple_choice', '["Yes, studying is associated with passing", "No, the pass rates are the same", "No, because both groups have students who pass", "Yes, but only because more students studied"]', 'Yes, studying is associated with passing', '40% pass rate for studiers vs 20% for non-studiers — different conditional rates show association', 'NC.M1.S-ID.5', 'two_way_tables')
ON CONFLICT DO NOTHING;
