-- ============================================================================
-- MATHPIVOT TUTOROS - SEED DATA: SKILLS
-- Seed file 01: Skills library for Math 1 and Math 3
-- ============================================================================

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
(uuid_generate_v4(), 'math_1', 'M1-GE-03', 'Geometric Transformations', 'Describe and apply translations, rotations, reflections', 'Geometry', 52);

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
(uuid_generate_v4(), 'math_3', 'M3-ST-03', 'Hypothesis Testing', 'Perform and interpret hypothesis tests', 'Statistics', 52);

-- Verify insertion
-- SELECT course_track, COUNT(*) FROM skills GROUP BY course_track;
