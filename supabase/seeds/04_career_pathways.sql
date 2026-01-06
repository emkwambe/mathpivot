-- Seed data: Career Pathways and Equipment Types
-- Career-focused math readiness programs

-- =============================================================================
-- CAREER PATHWAYS
-- =============================================================================

INSERT INTO career_pathways (code, name, description, color, target_grades, prerequisite_tracks, career_outcomes, certifications, order_index) VALUES

-- Actuarial Science
(
  'actuarial',
  'Actuarial Science',
  'Master the mathematical foundations needed for actuarial exams. Learn probability, statistics, financial mathematics, and risk assessment used by insurance and pension professionals.',
  '#1E40AF', -- Blue
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
  '#059669', -- Green
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
  '#DC2626', -- Red
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
  '#7C3AED', -- Purple
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
  '#CA8A04', -- Yellow/Gold
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
  '#EA580C', -- Orange
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

-- =============================================================================
-- EQUIPMENT TYPES (for Robotics track)
-- =============================================================================

INSERT INTO equipment_types (name, description, manufacturer, category, is_kit, kit_contents, purchase_price_cents, rental_price_cents, deposit_cents) VALUES

-- Arduino Kits
(
  'Arduino Starter Kit',
  'Complete beginner kit with Arduino Uno, breadboard, LEDs, resistors, sensors, and project book.',
  'Arduino',
  'kit',
  TRUE,
  '{"items": ["Arduino Uno R3", "USB Cable", "Breadboard", "Jumper Wires (65pc)", "LEDs (20pc)", "Resistors (100pc)", "Pushbuttons (10pc)", "Potentiometer", "Photoresistor", "Temperature Sensor", "Servo Motor", "DC Motor", "LCD Display", "Project Book"]}',
  8999, -- $89.99
  1500, -- $15/program
  5000  -- $50 deposit
),

(
  'Arduino Uno R3',
  'The classic Arduino microcontroller board based on ATmega328P.',
  'Arduino',
  'microcontroller',
  FALSE,
  NULL,
  2799,
  500,
  2500
),

(
  'Arduino Mega 2560',
  'Arduino board with more I/O pins and memory for complex projects.',
  'Arduino',
  'microcontroller',
  FALSE,
  NULL,
  4599,
  800,
  4000
),

-- Sensors
(
  'Ultrasonic Distance Sensor (HC-SR04)',
  'Measures distance using ultrasonic waves. Range: 2cm to 400cm.',
  'Generic',
  'sensor',
  FALSE,
  NULL,
  399,
  100,
  300
),

(
  'Infrared Obstacle Sensor',
  'Detects obstacles using infrared light. Great for line-following robots.',
  'Generic',
  'sensor',
  FALSE,
  NULL,
  299,
  75,
  200
),

(
  'Temperature & Humidity Sensor (DHT22)',
  'High-precision digital temperature and humidity sensor.',
  'Generic',
  'sensor',
  FALSE,
  NULL,
  999,
  200,
  800
),

(
  'Accelerometer/Gyroscope (MPU-6050)',
  '6-axis motion sensor for detecting orientation and movement.',
  'InvenSense',
  'sensor',
  FALSE,
  NULL,
  699,
  150,
  500
),

-- Motors & Movement
(
  'Servo Motor (SG90)',
  'Micro servo motor for precise angular control. 180° range.',
  'TowerPro',
  'motor',
  FALSE,
  NULL,
  499,
  100,
  400
),

(
  'DC Motor with Wheel',
  'Geared DC motor with wheel for robot chassis.',
  'Generic',
  'motor',
  FALSE,
  NULL,
  599,
  125,
  500
),

(
  'Stepper Motor (28BYJ-48)',
  'Stepper motor with driver board for precise positioning.',
  'Generic',
  'motor',
  FALSE,
  NULL,
  899,
  175,
  700
),

-- Robot Kits
(
  'Two-Wheel Robot Chassis Kit',
  'Complete robot base with motors, wheels, battery holder, and chassis.',
  'Generic',
  'kit',
  TRUE,
  '{"items": ["Acrylic Chassis", "2x DC Motors", "2x Wheels", "Caster Wheel", "Battery Holder", "Motor Mount Brackets", "Screws and Standoffs"]}',
  2499,
  500,
  2000
),

(
  'Robot Arm Kit (4-DOF)',
  '4 degree-of-freedom robotic arm with servo motors.',
  'Generic',
  'kit',
  TRUE,
  '{"items": ["Arm Structure", "4x Servo Motors", "Gripper", "Base Plate", "Control Board"]}',
  4999,
  1000,
  4000
),

-- Advanced Kits
(
  'Raspberry Pi 4 Starter Kit',
  'Complete Raspberry Pi 4 kit for advanced robotics and AI projects.',
  'Raspberry Pi Foundation',
  'kit',
  TRUE,
  '{"items": ["Raspberry Pi 4 (4GB)", "32GB SD Card", "Power Supply", "Case", "HDMI Cable", "Heatsinks", "GPIO Reference Card"]}',
  9999,
  2000,
  7500
),

(
  'Machine Learning Camera Kit',
  'AI camera module for computer vision and machine learning projects.',
  'Generic',
  'kit',
  TRUE,
  '{"items": ["Pi Camera Module", "Camera Mount", "LED Ring Light", "USB Accelerator"]}',
  5999,
  1200,
  5000
)

ON CONFLICT DO NOTHING;

-- =============================================================================
-- CAREER-SPECIFIC SKILLS (extend skills table)
-- =============================================================================

-- Actuarial Skills
INSERT INTO skills (course_track, code, name, description, category, order_index) VALUES
('actuarial', 'ACT-001', 'Probability Fundamentals', 'Basic probability theory, counting principles, and conditional probability', 'Probability', 1),
('actuarial', 'ACT-002', 'Random Variables', 'Discrete and continuous random variables, expected value, variance', 'Probability', 2),
('actuarial', 'ACT-003', 'Common Distributions', 'Binomial, Poisson, Normal, Exponential distributions', 'Probability', 3),
('actuarial', 'ACT-004', 'Time Value of Money', 'Interest rates, present and future value, annuities', 'Financial Math', 4),
('actuarial', 'ACT-005', 'Annuities & Perpetuities', 'Ordinary annuities, annuities due, perpetuities', 'Financial Math', 5),
('actuarial', 'ACT-006', 'Bonds & Amortization', 'Bond pricing, yield rates, loan amortization', 'Financial Math', 6),
('actuarial', 'ACT-007', 'Life Tables', 'Mortality tables, survival functions, life expectancy', 'Life Contingencies', 7),
('actuarial', 'ACT-008', 'Risk Measures', 'VaR, Expected Shortfall, risk classification', 'Risk Management', 8)
ON CONFLICT (code) DO NOTHING;

-- Data Science Skills
INSERT INTO skills (course_track, code, name, description, category, order_index) VALUES
('data_science', 'DS-001', 'Descriptive Statistics', 'Mean, median, mode, standard deviation, data visualization', 'Statistics', 1),
('data_science', 'DS-002', 'Probability for ML', 'Probability distributions, Bayes theorem, joint probability', 'Probability', 2),
('data_science', 'DS-003', 'Linear Algebra Basics', 'Vectors, matrices, matrix operations, eigenvalues', 'Linear Algebra', 3),
('data_science', 'DS-004', 'Regression Analysis', 'Linear regression, multiple regression, model evaluation', 'Machine Learning', 4),
('data_science', 'DS-005', 'Classification', 'Logistic regression, decision trees, confusion matrix', 'Machine Learning', 5),
('data_science', 'DS-006', 'Clustering', 'K-means, hierarchical clustering, dimensionality reduction', 'Machine Learning', 6),
('data_science', 'DS-007', 'Hypothesis Testing', 'T-tests, chi-square, p-values, confidence intervals', 'Statistics', 7),
('data_science', 'DS-008', 'Time Series', 'Trend analysis, seasonality, forecasting methods', 'Analytics', 8)
ON CONFLICT (code) DO NOTHING;

-- Epidemiology Skills
INSERT INTO skills (course_track, code, name, description, category, order_index) VALUES
('epidemiology', 'EPI-001', 'Biostatistics Foundations', 'Statistical methods for biological and health data', 'Biostatistics', 1),
('epidemiology', 'EPI-002', 'Study Design', 'Cohort studies, case-control, randomized trials', 'Research Methods', 2),
('epidemiology', 'EPI-003', 'Disease Measures', 'Incidence, prevalence, mortality rates, risk ratios', 'Epidemiology', 3),
('epidemiology', 'EPI-004', 'SIR Models', 'Compartmental models, basic reproduction number R0', 'Disease Modeling', 4),
('epidemiology', 'EPI-005', 'Survival Analysis', 'Kaplan-Meier curves, hazard ratios, Cox regression', 'Biostatistics', 5),
('epidemiology', 'EPI-006', 'Spatial Epidemiology', 'Geographic patterns, cluster detection, GIS basics', 'Spatial Analysis', 6),
('epidemiology', 'EPI-007', 'Meta-Analysis', 'Combining studies, effect sizes, heterogeneity', 'Research Methods', 7),
('epidemiology', 'EPI-008', 'Outbreak Investigation', 'Epidemic curves, contact tracing math, intervention modeling', 'Applied Epi', 8)
ON CONFLICT (code) DO NOTHING;

-- Robotics Skills
INSERT INTO skills (course_track, code, name, description, category, order_index) VALUES
('robotics', 'ROB-001', 'Circuit Basics', 'Voltage, current, resistance, Ohm''s law, basic circuits', 'Electronics', 1),
('robotics', 'ROB-002', 'Digital Logic', 'Binary, logic gates, boolean algebra', 'Electronics', 2),
('robotics', 'ROB-003', 'Arduino Programming', 'Setup, digital/analog I/O, loops, functions', 'Programming', 3),
('robotics', 'ROB-004', 'Sensors & Input', 'Reading sensor data, calibration, signal processing', 'Sensors', 4),
('robotics', 'ROB-005', 'Motor Control', 'PWM, H-bridges, servo control, stepper motors', 'Actuators', 5),
('robotics', 'ROB-006', 'Robot Kinematics', 'Position, velocity, coordinate systems, transformations', 'Mathematics', 6),
('robotics', 'ROB-007', 'Control Systems', 'PID control, feedback loops, tuning', 'Control Theory', 7),
('robotics', 'ROB-008', 'Autonomous Navigation', 'Line following, obstacle avoidance, path planning', 'Autonomy', 8),
('robotics', 'ROB-009', 'Computer Vision Basics', 'Image processing, object detection, OpenCV basics', 'Vision', 9),
('robotics', 'ROB-010', 'Robot Communication', 'Serial, I2C, SPI, Bluetooth, WiFi', 'Communication', 10)
ON CONFLICT (code) DO NOTHING;

-- Competition Math Skills
INSERT INTO skills (course_track, code, name, description, category, order_index) VALUES
('competition_math', 'COMP-001', 'Number Theory', 'Divisibility, primes, modular arithmetic, Diophantine equations', 'Number Theory', 1),
('competition_math', 'COMP-002', 'Combinatorics', 'Counting principles, permutations, combinations, pigeonhole', 'Combinatorics', 2),
('competition_math', 'COMP-003', 'Geometry', 'Euclidean geometry, circles, triangles, coordinate geometry', 'Geometry', 3),
('competition_math', 'COMP-004', 'Algebra', 'Polynomials, inequalities, functional equations', 'Algebra', 4),
('competition_math', 'COMP-005', 'Proof Techniques', 'Direct proof, contradiction, induction, construction', 'Proof Writing', 5),
('competition_math', 'COMP-006', 'Problem Solving Strategies', 'Working backwards, pattern recognition, extreme cases', 'Strategy', 6),
('competition_math', 'COMP-007', 'Competition Strategy', 'Time management, point maximization, guess-and-check', 'Competition Skills', 7),
('competition_math', 'COMP-008', 'AMC/AIME Prep', 'AMC 10/12 and AIME specific problem types', 'Competition Prep', 8)
ON CONFLICT (code) DO NOTHING;
