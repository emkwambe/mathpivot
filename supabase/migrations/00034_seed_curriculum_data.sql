-- Seed: Curriculum data from NC 6th Grade Math and NC Math 1
-- Auto-generated from docs/curricula/*.json

-- Course: NC 6th Grade Math
INSERT INTO courses (id, title, code, grade_level, state_standard) VALUES
  ('00000000-0000-0000-0001-000000000001', 'NC 6th Grade Math', 'NC-M6', '6', 'NC')
ON CONFLICT (code) DO NOTHING;

INSERT INTO curriculum_units (id, course_id, title, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000001', 'The Number System', 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000001', 'M6.NS.1.1', 'Fluently Add and Subtract Multi-Digit Decimals', ARRAY['Add and subtract multi-digit numbers involving decimals using the standard algorithm'], 'NC.6.NS.B.3', 1)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000001', 'M6.NS.1.2', 'Fluently Multiply Multi-Digit Decimals', ARRAY['Multiply multi-digit numbers involving decimals using the standard algorithm'], 'NC.6.NS.B.3', 2)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000001', 'M6.NS.1.3', 'Fluently Divide Multi-Digit Whole Numbers (Long Division)', ARRAY['Divide multi-digit whole numbers using the standard algorithm for long division'], 'NC.6.NS.B.2', 3)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000001', 'M6.NS.1.4', 'Fluently Divide Multi-Digit Decimals', ARRAY['Divide multi-digit decimals using the standard algorithm'], 'NC.6.NS.B.3', 4)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000001', 'M6.NS.2.1', 'Understanding Fraction Division (Conceptually)', ARRAY['Interpret and compute quotients of fractions using visual models (e.g., how many 3/4s are in 1/2)'], 'NC.6.NS.A.1', 5)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000001', 'M6.NS.2.2', 'Computing Quotients of Fractions by Fractions (Algorithm)', ARRAY['Apply the algorithm (invert and multiply) to divide fractions by fractions'], 'NC.6.NS.A.1', 6)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000001', 'M6.NS.2.3', 'Solving Word Problems Involving Fraction Division', ARRAY['Use fraction division to solve real-world problems involving lengths, areas, and quantities'], 'NC.6.NS.A.1', 7)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000001', 'M6.NS.3.1', 'Finding the Greatest Common Factor (GCF) of Two Whole Numbers', ARRAY['Find the GCF of two whole numbers less than or equal to 100'], 'NC.6.NS.B.4', 8)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000001', 'M6.NS.3.2', 'Finding the Least Common Multiple (LCM) of Two Whole Numbers', ARRAY['Find the LCM of two whole numbers less than or equal to 12'], 'NC.6.NS.B.4', 9)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000001', 'M6.NS.3.3', 'Using GCF and LCM to Rewrite Expressions (Distributive Property, Common Denominators)', ARRAY['Use the distributive property to express a sum of two whole numbers with a common factor'], 'NC.6.NS.B.4', 10)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000001', 'M6.NS.4.1', 'Understanding Positive and Negative Numbers in Context', ARRAY['Use positive and negative numbers to represent quantities in real-world contexts (e.g., temperature, elevation)'], 'NC.6.NS.C.5', 11)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000001', 'M6.NS.4.2', 'Understanding Integers and Opposites', ARRAY['Define integers', 'Understand that opposite numbers are equidistant from zero on a number line'], 'NC.6.NS.C.5, NC.6.NS.C.6a', 12)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000001', 'M6.NS.4.3', 'Plotting Rational Numbers on a Number Line and Coordinate Plane', ARRAY['Plot rational numbers on a horizontal or vertical number line and in all four quadrants of the coordinate plane'], 'NC.6.NS.C.6, NC.6.NS.C.8', 13)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000001', 'M6.NS.4.4', 'Understanding Absolute Value of Rational Numbers', ARRAY['Define absolute value as distance from zero', 'Interpret absolute value in real-world situations'], 'NC.6.NS.C.7c', 14)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000001', 'M6.NS.4.5', 'Comparing and Ordering Rational Numbers', ARRAY['Use inequality symbols (<, >, =) to compare rational numbers', 'Order rational numbers on a number line'], 'NC.6.NS.C.7', 15)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000001', 'M6.NS.4.6', 'Graphing Points in All Four Quadrants of the Coordinate Plane', ARRAY['Plot points (x, y) in all four quadrants', 'Understand the meaning of coordinates in context'], 'NC.6.NS.C.8', 16)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000001', 'M6.NS.4.7', 'Finding Distances Between Points in the Coordinate Plane', ARRAY['Find distances between points with the same first or second coordinate by applying absolute value'], 'NC.6.NS.C.8', 17)
ON CONFLICT (lesson_number) DO NOTHING;

INSERT INTO curriculum_units (id, course_id, title, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000001', 'Ratio & Proportional Relationships', 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000002', 'M6.RP.1.1', 'Understanding Ratios (Definition and Different Forms)', ARRAY['Define a ratio as a comparison of two quantities', 'Write ratios in fraction form, with a colon, or with the word "to"'], 'NC.6.RP.A.1', 18)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000002', 'M6.RP.1.2', 'Understanding Rates and Unit Rates', ARRAY['Define a rate as a ratio comparing quantities with different units', 'Define a unit rate as a rate with a denominator of 1'], 'NC.6.RP.A.2', 19)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000002', 'M6.RP.1.3', 'Calculating Unit Rates (from Ratios and Rates)', ARRAY['Compute unit rates associated with ratios of whole numbers, fractions, and decimals'], 'NC.6.RP.A.2', 20)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000002', 'M6.RP.2.1', 'Using Ratio Reasoning in Tables and Tape Diagrams', ARRAY['Use tables of equivalent ratios or tape diagrams to solve ratio problems'], 'NC.6.RP.A.3', 21)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000002', 'M6.RP.2.2', 'Using Ratio Reasoning with Double Number Lines and Equations', ARRAY['Use double number line diagrams or write simple equations to solve ratio problems'], 'NC.6.RP.A.3', 22)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000002', 'M6.RP.2.3', 'Solving Real-World Ratio Problems', ARRAY['Apply ratio reasoning to solve various real-world problems (e.g., mixing paint colors, calculating ingredients)'], 'NC.6.RP.A.3', 23)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000002', 'M6.RP.3.1', 'Understanding Percentages as Rates Per 100', ARRAY['Define a percentage as a rate per 100', 'Understand percent as "per hundred"'], 'NC.6.RP.A.3c', 24)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000002', 'M6.RP.3.2', 'Finding a Percent of a Quantity', ARRAY['Calculate a given percent of a number (e.g., find 30% of 200)'], 'NC.6.RP.A.3c', 25)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000002', 'M6.RP.3.3', 'Solving Percentage Problems (Finding the Whole or the Part)', ARRAY['Solve problems involving finding the whole, given a part and the percent', 'Find what percent one number is of another'], 'NC.6.RP.A.3c', 26)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000002', 'M6.RP.3.4', 'Converting Between Fractions, Decimals, and Percentages', ARRAY['Convert between fraction, decimal, and percent forms of numbers'], 'NC.6.RP.A.3c', 27)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000002', 'M6.RP.4.1', 'Using Ratio and Rate Reasoning to Solve Measurement Problems', ARRAY['Apply ratio and rate reasoning to convert measurement units by multiplying or dividing by ratios'], 'NC.6.RP.A.3d', 28)
ON CONFLICT (lesson_number) DO NOTHING;

INSERT INTO curriculum_units (id, course_id, title, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000001', 'Expressions & Equations', 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000003', 'M6.EE.1.1', 'Understanding Numerical Expressions with Whole-Number Exponents', ARRAY['Write and evaluate numerical expressions involving whole-number exponents (e.g., 3² + 5)'], 'NC.6.EE.A.1', 29)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000003', 'M6.EE.1.2', 'Writing Algebraic Expressions from Verbal Descriptions', ARRAY['Translate verbal phrases into algebraic expressions (e.g., "the sum of 5 and a number x")'], 'NC.6.EE.A.2a', 30)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000003', 'M6.EE.1.3', 'Identifying Parts of an Algebraic Expression', ARRAY['Identify terms, factors, coefficients, and exponents within an expression'], 'NC.6.EE.A.2b', 31)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000003', 'M6.EE.1.4', 'Evaluating Algebraic Expressions', ARRAY['Substitute given values for variables and evaluate expressions (e.g., if x=3, find 2x+1)'], 'NC.6.EE.A.2c', 32)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000003', 'M6.EE.2.1', 'Applying the Distributive Property to Generate Equivalent Expressions', ARRAY['Use the distributive property to rewrite expressions (e.g., 3(x+2) = 3x+6)'], 'NC.6.EE.A.3', 33)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000003', 'M6.EE.2.2', 'Combining Like Terms to Generate Equivalent Expressions', ARRAY['Identify like terms', 'Combine like terms to simplify expressions (e.g., 2x + 3y + 5x = 7x + 3y)'], 'NC.6.EE.A.3', 34)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000003', 'M6.EE.3.1', 'Understanding What it Means to Solve an Equation or Inequality', ARRAY['Understand that solutions make the equation/inequality true', 'Use substitution to check solutions'], 'NC.6.EE.B.5', 35)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000003', 'M6.EE.3.2', 'Solving One-Step Equations with Addition or Subtraction (x+p=q)', ARRAY['Solve equations of the form x+p=q using inverse operations (e.g., x+5=12)'], 'NC.6.EE.B.7', 36)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000003', 'M6.EE.3.3', 'Solving One-Step Equations with Multiplication or Division (px=q)', ARRAY['Solve equations of the form px=q using inverse operations (e.g., 3x=15)'], 'NC.6.EE.B.7', 37)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000003', 'M6.EE.3.4', 'Writing Equations to Solve Real-World Problems', ARRAY['Translate word problems into one-step equations (e.g., "If I have 10 apples and give away x, I have 3 left, write the equation")'], 'NC.6.EE.B.6', 38)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000003', 'M6.EE.4.1', 'Writing Inequalities to Represent Constraints (x>c, x<c, etc.)', ARRAY['Write inequalities to express conditions in real-world situations (e.g., "speed limit is 55 mph, so s ≤ 55")'], 'NC.6.EE.B.8', 39)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000003', 'M6.EE.4.2', 'Representing Solutions of Inequalities on Number Lines', ARRAY['Graph the solution set of an inequality (e.g., x > 2) on a number line'], 'NC.6.EE.B.8', 40)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000003', 'M6.EE.4.3', 'Solving Real-World Problems Involving Linear Inequalities', ARRAY['Construct inequalities from word problems (e.g., "At most $15", "at least $12")'], 'NC.6.EE.B.4b', 41)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000003', 'M6.EE.5.1', 'Using Variables to Represent Two Quantities in a Real-World Relationship', ARRAY['Identify dependent and independent variables in a real-world context', 'Represent them with variables'], 'NC.6.EE.C.9', 42)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000003', 'M6.EE.5.2', 'Writing Equations to Express Relationships Between Dependent and Independent Variables', ARRAY['Write an equation to represent a relationship between two quantities (e.g., distance = rate × time)'], 'NC.6.EE.C.9', 43)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000003', 'M6.EE.5.3', 'Analyzing Relationships Between Dependent and Independent Variables Using Graphs and Tables', ARRAY['Use graphs and tables to analyze how a change in the independent variable affects the dependent variable'], 'NC.6.EE.C.9', 44)
ON CONFLICT (lesson_number) DO NOTHING;

INSERT INTO curriculum_units (id, course_id, title, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0001-000000000001', 'Geometry', 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000004', 'M6.GEO.1.1', 'Understanding Area of Triangles', ARRAY['Find the area of triangles by composing into rectangles or decomposing into right triangles.', 'Use the formula A = ½bh to calculate area.'], 'NC.6.G.A.1', 45)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000004', 'M6.GEO.1.2', 'Understanding Area of Quadrilaterals (Parallelograms)', ARRAY['Find the area of parallelograms by composing into rectangles or decomposing.', 'Use the formula A = bh to calculate area.'], 'NC.6.G.A.1', 46)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000004', 'M6.GEO.1.3', 'Understanding Area of Quadrilaterals (Trapezoids)', ARRAY['Find the area of trapezoids by composing into rectangles or decomposing into triangles and rectangles.', 'Use the formula A = ½(b₁+b₂)h to calculate area.'], 'NC.6.G.A.1', 47)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000004', 'M6.GEO.1.4', 'Finding Areas of Other Polygons (Composing and Decomposing)', ARRAY['Find areas of complex polygons by decomposing them into triangles, rectangles, and other known shapes.', 'Recompose shapes to form new polygons with known area formulas.'], 'NC.6.G.A.1', 48)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000004', 'M6.GEO.2.1', 'Understanding Polyhedra and Nets', ARRAY['Define polyhedra as three-dimensional figures composed of polygons', 'Draw and analyze nets of cubes, prisms, and pyramids.'], 'NC.6.G.A.4', 49)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000004', 'M6.GEO.2.2', 'Calculating Surface Area of 3D Figures using Nets', ARRAY['Find the surface area of cubes and right prisms using their nets.', 'Calculate the area of each face and sum them.'], 'NC.6.G.A.4', 50)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000004', 'M6.GEO.2.3', 'Calculating Surface Area of Right Pyramids using Nets', ARRAY['Find the surface area of right pyramids using their nets, by calculating the area of the base and all triangular faces.'], 'NC.6.G.A.4', 51)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000004', 'M6.GEO.3.1', 'Understanding Volume of Right Rectangular Prisms', ARRAY['Understand that the volume of a right rectangular prism is found by packing it with unit cubes.'], 'NC.6.G.A.2', 52)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000004', 'M6.GEO.3.2', 'Calculating Volume of Right Rectangular Prisms with Whole-Number Edge Lengths', ARRAY['Apply the formula V=lwh or V=Bh to calculate the volume of prisms with whole-number dimensions.'], 'NC.6.G.A.2', 53)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000004', 'M6.GEO.3.3', 'Calculating Volume of Right Rectangular Prisms with Fractional Edge Lengths', ARRAY['Calculate the volume of right rectangular prisms with fractional side lengths by packing with fractional unit cubes.', 'Apply the formulas V=lwh and V=Bh.'], 'NC.6.G.A.2', 54)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000004', 'M6.GEO.4.1', 'Solving Real-World Problems Involving Area', ARRAY['Solve real-world and mathematical problems involving area of triangles, quadrilaterals, and other polygons.'], 'NC.6.G.A.1', 55)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000004', 'M6.GEO.4.2', 'Solving Real-World Problems Involving Surface Area', ARRAY['Solve real-world problems involving surface area of cubes, prisms, and pyramids (e.g., painting a room, wrapping a gift).'], 'NC.6.G.A.4', 56)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000004', 'M6.GEO.4.3', 'Solving Real-World Problems Involving Volume', ARRAY['Solve real-world problems involving volume of right rectangular prisms (e.g., finding capacity of a box, filling a container).'], 'NC.6.G.A.2', 57)
ON CONFLICT (lesson_number) DO NOTHING;

INSERT INTO curriculum_units (id, course_id, title, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0001-000000000001', 'Statistics and Probability', 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000005', 'M6.SP.1.1', 'Understanding Statistical Questions', ARRAY['Define a statistical question (one that anticipates variability in data)', 'Differentiate from non-statistical questions'], 'NC.6.SP.A.1', 58)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000005', 'M6.SP.1.2', 'Understanding Data Distributions and Data Sets', ARRAY['Recognize a data set as a collection of numerical or categorical data', 'Understand variability in data'], 'NC.6.SP.A.1', 59)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000005', 'M6.SP.2.1', 'Representing Data on Dot Plots and Histograms', ARRAY['Create dot plots and histograms to display numerical data', 'Interpret basic features of these plots'], 'NC.6.SP.B.4', 60)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000005', 'M6.SP.2.2', 'Representing Data on Box Plots (Box-and-Whisker Plots)', ARRAY['Create box plots to display numerical data', 'Identify five-number summary (min, Q1, median, Q3, max)'], 'NC.6.SP.B.4', 61)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000005', 'M6.SP.3.1', 'Summarizing Data Distributions: Understanding Center (Mean, Median, Mode)', ARRAY['Calculate mean, median, and mode for a numerical data set', 'Interpret each as a measure of center'], 'NC.6.SP.B.5c', 62)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000005', 'M6.SP.3.2', 'Summarizing Data Distributions: Understanding Variability (Range, IQR)', ARRAY['Calculate range and interquartile range (IQR) for a numerical data set', 'Interpret as measures of variability'], 'NC.6.SP.B.5c', 63)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000005', 'M6.SP.3.3', 'Understanding Mean Absolute Deviation (MAD)', ARRAY['Calculate MAD for a numerical data set as a measure of variation', 'Interpret what it means about typical deviation from the mean'], 'NC.6.SP.B.5c', 64)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000005', 'M6.SP.4.1', 'Describing the Overall Shape of Data Distributions (Symmetry, Skew, Peaks)', ARRAY['Describe data distributions by their shape (e.g., symmetric, skewed left/right, peaks)', 'Identify clusters and gaps'], 'NC.6.SP.B.5b', 65)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000005', 'M6.SP.4.2', 'Identifying Outliers in Data Distributions', ARRAY['Recognize outliers as data points significantly different from others', 'Explain their potential impact on measures of center and variability'], 'NC.6.SP.B.5a', 66)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000005', 'M6.SP.5.1', 'Summarizing Numerical Data Sets in Relation to their Context (Part 1)', ARRAY['Report the number of observations', 'Describe the context that generated the data'], 'NC.6.SP.B.5a, NC.6.SP.B.5b', 67)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000005', 'M6.SP.5.2', 'Summarizing Numerical Data Sets in Relation to their Context (Part 2)', ARRAY['Relate the choice of measures of center and variability to the shape of the data distribution and the context'], 'NC.6.SP.B.5d', 68)
ON CONFLICT (lesson_number) DO NOTHING;

-- Course: NC Math 1
INSERT INTO courses (id, title, code, grade_level, state_standard) VALUES
  ('00000000-0000-0000-0001-000000000002', 'NC Math 1', 'NC-M1', '9', 'NC')
ON CONFLICT (code) DO NOTHING;

INSERT INTO curriculum_units (id, course_id, title, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0001-000000000002', 'Equations & Inequalities', 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO curriculum_units (id, course_id, title, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0001-000000000002', 'Functions & Linear Functions', 7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO curriculum_units (id, course_id, title, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0001-000000000002', 'Systems of Eqns & Inequalities', 8)
ON CONFLICT (id) DO NOTHING;
INSERT INTO curriculum_units (id, course_id, title, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000009', '00000000-0000-0000-0001-000000000002', 'Exponents & Exponential Functions', 9)
ON CONFLICT (id) DO NOTHING;
INSERT INTO curriculum_units (id, course_id, title, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0001-000000000002', 'Polynomials & Factoring', 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO curriculum_units (id, course_id, title, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000011', '00000000-0000-0000-0001-000000000002', 'Quadratic Functions & Equations', 11)
ON CONFLICT (id) DO NOTHING;
INSERT INTO curriculum_units (id, course_id, title, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000012', '00000000-0000-0000-0001-000000000002', 'Data Analysis & Statistics', 12)
ON CONFLICT (id) DO NOTHING;
INSERT INTO curriculum_units (id, course_id, title, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000013', '00000000-0000-0000-0001-000000000002', 'Geometric Transformations & Congruence', 13)
ON CONFLICT (id) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000006', 'M1.EQN.1.1', 'Understanding Variables and Algebraic Expressions', ARRAY['Differentiate between constants, variables, coefficients, and terms'], 'NC.M1.A-SSE.1', 69)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000006', 'M1.EQN.1.2', 'Evaluating Algebraic Expressions', ARRAY['Substitute values for variables and simplify expressions'], 'NC.M1.A-SSE.1', 70)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000006', 'M1.EQN.1.3', 'Simplifying Algebraic Expressions (Combining Like Terms and Distributive Property)', ARRAY['Group and combine like terms', 'Apply the distributive property'], 'NC.M1.A-SSE.1', 71)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000006', 'M1.EQN.2.1', 'Understanding Equations and Solutions', ARRAY['Define an equation', 'Determine if a value is a solution'], 'NC.M1.A-REI.1', 72)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000006', 'M1.EQN.2.2', 'Solving One-Step Linear Equations (Addition/Subtraction)', ARRAY['Isolate the variable using inverse operations'], 'NC.M1.A-REI.3', 73)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000006', 'M1.EQN.2.3', 'Solving One-Step Linear Equations (Multiplication/Division)', ARRAY['Isolate the variable using inverse operations'], 'NC.M1.A-REI.3', 74)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000006', 'M1.EQN.2.4', 'Solving Two-Step Linear Equations', ARRAY['Apply inverse operations in sequence to solve'], 'NC.M1.A-REI.3', 75)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000006', 'M1.EQN.2.5', 'Solving Multi-Step Linear Equations (Distribute & Combine Like Terms)', ARRAY['Use distributive property', 'Combine like terms', 'Apply inverse operations'], 'NC.M1.A-REI.3', 76)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000006', 'M1.EQN.2.6', 'Solving Linear Equations with Variables on Both Sides', ARRAY['Collect variable terms on one side and constant terms on the other'], 'NC.M1.A-REI.3', 77)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000006', 'M1.EQN.2.7', 'Identifying Equations with No Solution or Infinitely Many Solutions', ARRAY['Recognize when an equation leads to a contradiction or an identity'], 'NC.M1.A-REI.3', 78)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000006', 'M1.EQN.3.1', 'Solving Absolute Value Equations', ARRAY['Isolate absolute value', 'Set up two equations', 'Solve and check for extraneous solutions'], 'NC.M1.A-REI.1', 79)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000006', 'M1.EQN.4.1', 'Rewriting Literal Equations (Solving for a Variable)', ARRAY['Isolate a specified variable in a formula or equation with multiple variables'], 'NC.M1.A-CED.4', 80)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000006', 'M1.EQN.5.1', 'Understanding and Graphing Linear Inequalities in One Variable', ARRAY['Define inequality', 'Graph solutions on a number line (open/closed circles, shading)'], 'NC.M1.A-REI.3', 81)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000006', 'M1.EQN.5.2', 'Solving One-Step Linear Inequalities (Addition/Subtraction)', ARRAY['Apply inverse operations', 'Maintain inequality direction'], 'NC.M1.A-REI.3', 82)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000006', 'M1.EQN.5.3', 'Solving One-Step Linear Inequalities (Multiplication/Division by Negative)', ARRAY['Apply inverse operations', 'Reverse inequality sign when multiplying/dividing by a negative'], 'NC.M1.A-REI.3', 83)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000006', 'M1.EQN.5.4', 'Solving Multi-Step Linear Inequalities', ARRAY['Use distributive property', 'Combine like terms', 'Apply inverse operations', 'Reverse sign when necessary'], 'NC.M1.A-REI.3', 84)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000006', 'M1.EQN.5.5', 'Solving Compound Inequalities (AND/OR)', ARRAY['Solve each inequality', 'Find intersection or union of solution sets'], 'NC.M1.A-REI.3', 85)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000006', 'M1.EQN.5.6', 'Solving Absolute Value Inequalities', ARRAY['Isolate absolute value', 'Set up compound inequality', 'Solve and graph'], 'NC.M1.A-REI.3', 86)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000006', 'M1.EQN.6.1', 'Creating Linear Equations and Inequalities in One Variable from Context', ARRAY['Translate verbal descriptions into equations/inequalities', 'Define variables'], 'NC.M1.A-CED.1', 87)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000007', 'M1.FLF.1.1', 'Understanding Relations and Functions (Introduction)', ARRAY['Differentiate between a relation and a function', 'Identify domain and range'], 'NC.M1.F-IF.1', 88)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000007', 'M1.FLF.1.2', 'Identifying Functions using Vertical Line Test and Tables', ARRAY['Determine if a relation is a function from a graph or a table'], 'NC.M1.F-IF.1', 89)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000007', 'M1.FLF.1.3', 'Using Function Notation', ARRAY['Evaluate functions for given input values using f(x) notation'], 'NC.M1.F-IF.2', 90)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000007', 'M1.FLF.2.1', 'Understanding Slope as a Rate of Change', ARRAY['Calculate slope from two points or a graph', 'Interpret slope in context'], 'NC.M1.F-IF.6', 91)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000007', 'M1.FLF.2.2', 'Graphing Linear Functions from Slope-Intercept Form (y=mx+b)', ARRAY['Identify slope and y-intercept', 'Graph linear equations'], 'NC.M1.F-IF.7', 92)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000007', 'M1.FLF.2.3', 'Graphing Linear Functions from Standard Form (Ax+By=C)', ARRAY['Use intercepts to graph linear equations', 'Convert to slope-intercept form'], 'NC.M1.F-IF.7', 93)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000007', 'M1.FLF.2.4', 'Understanding Horizontal and Vertical Lines', ARRAY['Identify and graph equations of horizontal and vertical lines'], 'NC.M1.F-IF.7', 94)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000007', 'M1.FLF.3.1', 'Writing Linear Equations in Slope-Intercept Form', ARRAY['Write equations given slope and y-intercept', 'Write equations from graphs'], 'NC.M1.F-BF.1a', 95)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000007', 'M1.FLF.3.2', 'Writing Linear Equations from Two Points', ARRAY['Calculate slope', 'Use point-slope form or slope-intercept form to write equation'], 'NC.M1.F-BF.1a', 96)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000007', 'M1.FLF.3.3', 'Writing Linear Equations from a Point and a Slope (Point-Slope Form)', ARRAY['Apply the point-slope formula to write linear equations'], 'NC.M1.F-BF.1a', 97)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000007', 'M1.FLF.3.4', 'Converting Between Forms of Linear Equations', ARRAY['Convert equations between slope-intercept, point-slope, and standard forms'], 'NC.M1.A-CED.4', 98)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000007', 'M1.FLF.4.1', 'Understanding Slopes of Parallel Lines', ARRAY['Identify parallel lines based on equal slopes'], 'NC.M1.G-GPE.5', 99)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000007', 'M1.FLF.4.2', 'Understanding Slopes of Perpendicular Lines', ARRAY['Identify perpendicular lines based on negative reciprocal slopes'], 'NC.M1.G-GPE.5', 100)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000007', 'M1.FLF.4.3', 'Writing Equations of Parallel and Perpendicular Lines', ARRAY['Write equations for lines passing through a point and parallel/perpendicular to a given line'], 'NC.M1.G-GPE.5', 101)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000007', 'M1.FLF.5.1', 'Graphing Linear Inequalities in Two Variables', ARRAY['Graph boundary line', 'Determine shading region', 'Understand solution set'], 'NC.M1.A-REI.12', 102)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000007', 'M1.FLF.6.1', 'Interpreting Key Features of Linear Functions in Context', ARRAY['Analyze intercepts, slope, and domain/range in real-world problems'], 'NC.M1.F-IF.4', 103)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000007', 'M1.FLF.6.2', 'Constructing Linear Functions to Model Relationships from Context', ARRAY['Translate verbal descriptions, tables, or graphs into linear functions'], 'NC.M1.F-BF.1', 104)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000007', 'M1.FLF.7.1', 'Comparing Properties of Two Linear Functions Represented in Different Ways', ARRAY['Compare rates of change, intercepts, and domains/ranges from various representations'], 'NC.M1.F-IF.9', 105)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000008', 'M1.SYS.1.1', 'Understanding Systems of Linear Equations and their Solutions', ARRAY['Define a system of equations', 'Identify a solution to a system'], 'NC.M1.A-REI.5', 106)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000008', 'M1.SYS.1.2', 'Solving Systems of Linear Equations by Graphing', ARRAY['Graph two linear equations', 'Identify the point of intersection as the solution'], 'NC.M1.A-REI.6', 107)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000008', 'M1.SYS.2.1', 'Solving Systems of Linear Equations by Substitution', ARRAY['Solve one equation for a variable', 'Substitute into the other equation', 'Solve for both variables'], 'NC.M1.A-REI.6', 108)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000008', 'M1.SYS.2.2', 'Solving Systems of Linear Equations by Elimination (Addition/Subtraction)', ARRAY['Add or subtract equations to eliminate a variable', 'Solve for remaining variables'], 'NC.M1.A-REI.6', 109)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000008', 'M1.SYS.2.3', 'Solving Systems of Linear Equations by Elimination (Multiplication First)', ARRAY['Multiply one or both equations to create opposite coefficients', 'Add/subtract to eliminate'], 'NC.M1.A-REI.6', 110)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000008', 'M1.SYS.3.1', 'Identifying Types of Solutions to Systems of Linear Equations', ARRAY['Recognize when a system has one solution, no solution, or infinitely many solutions (graphically and algebraically)'], 'NC.M1.A-REI.6', 111)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000008', 'M1.SYS.4.1', 'Creating Systems of Linear Equations from Word Problems', ARRAY['Define variables', 'Write two linear equations to represent real-world scenarios'], 'NC.M1.A-CED.2', 112)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000008', 'M1.SYS.4.2', 'Solving Real-World Problems Using Systems of Linear Equations', ARRAY['Apply graphical or algebraic methods to solve contextual problems'], 'NC.M1.A-CED.2', 113)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000008', 'M1.SYS.5.1', 'Understanding Systems of Linear Inequalities and their Solution Sets', ARRAY['Define a system of inequalities', 'Recognize that the solution is a region of intersection'], 'NC.M1.A-REI.12', 114)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000008', 'M1.SYS.5.2', 'Solving Systems of Linear Inequalities by Graphing', ARRAY['Graph each linear inequality', 'Identify and shade the overlapping feasible region'], 'NC.M1.A-REI.12', 115)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000008', 'M1.SYS.6.1', 'Creating Systems of Linear Inequalities from Word Problems', ARRAY['Define variables', 'Write two or more linear inequalities to represent real-world constraints'], 'NC.M1.A-CED.3', 116)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000008', 'M1.SYS.6.2', 'Solving Real-World Problems Using Systems of Linear Inequalities', ARRAY['Apply graphing methods to solve contextual problems involving constraints'], 'NC.M1.A-CED.3', 117)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000009', 'M1.EXP.1.1', 'Review: Understanding Integer Exponents', ARRAY['Define base and exponent', 'Evaluate expressions with integer exponents'], 'NC.M1.N-RN.1', 118)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000009', 'M1.EXP.1.2', 'Properties of Exponents: Product of Powers and Quotient of Powers', ARRAY['Simplify expressions by adding exponents for multiplication and subtracting for division'], 'NC.M1.N-RN.1', 119)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000009', 'M1.EXP.1.3', 'Properties of Exponents: Power of a Power and Power of a Product/Quotient', ARRAY['Simplify expressions by multiplying exponents for power of a power', 'Apply power to each factor in product/quotient'], 'NC.M1.N-RN.1', 120)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000009', 'M1.EXP.1.4', 'Understanding Zero Exponents and Negative Exponents', ARRAY['Define a^0=1', 'Define a^-n = 1/a^n', 'Simplify expressions with zero or negative exponents'], 'NC.M1.N-RN.1', 121)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000009', 'M1.EXP.1.5', 'Simplifying Expressions Using All Properties of Integer Exponents', ARRAY['Apply all exponent rules to simplify complex expressions'], 'NC.M1.N-RN.1', 122)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000009', 'M1.EXP.2.1', 'Understanding Exponential Functions (Definition and Key Characteristics)', ARRAY['Identify exponential functions from equations, graphs, or tables', 'Recognize constant ratio of y-values'], 'NC.M1.F-IF.7, NC.M1.F-LE.1', 123)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000009', 'M1.EXP.2.2', 'Graphing Basic Exponential Functions (y=a • b^x)', ARRAY['Create tables of values', 'Plot points', 'Sketch graphs', 'Identify y-intercept, asymptote, domain, and range'], 'NC.M1.F-IF.7', 124)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000009', 'M1.EXP.2.3', 'Identifying Exponential Growth and Decay', ARRAY['Determine if an exponential function represents growth or decay based on the base b'], 'NC.M1.F-LE.1', 125)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000009', 'M1.EXP.3.1', 'Writing Exponential Functions from Tables or Graphs', ARRAY['Identify initial value and common ratio', 'Write equation in y=a • b^x form'], 'NC.M1.F-BF.1', 126)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000009', 'M1.EXP.3.2', 'Writing Exponential Functions from Verbal Descriptions (Growth/Decay Models)', ARRAY['Translate real-world scenarios into exponential function equations', 'Define variables'], 'NC.M1.F-BF.1', 127)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000009', 'M1.EXP.4.1', 'Solving Real-World Problems Involving Exponential Growth and Decay', ARRAY['Apply exponential growth/decay models to solve contextual problems'], 'NC.M1.F-LE.1, NC.M1.A-CED.1', 128)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000009', 'M1.EXP.5.1', 'Comparing Linear and Exponential Functions (Tables and Graphs)', ARRAY['Analyze differences in growth patterns (constant difference vs. constant ratio)', 'Compare key features'], 'NC.M1.F-LE.3, NC.M1.F-LE.2', 129)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000009', 'M1.EXP.5.2', 'Comparing Linear and Exponential Functions (Equations and Context)', ARRAY['Formulate and compare linear vs. exponential functions from equations and real-world contexts'], 'NC.M1.F-LE.3, NC.M1.F-LE.2', 130)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000010', 'M1.POLY.1.1', 'Understanding Polynomials (Terms, Coefficients, Degree, Standard Form)', ARRAY['Define what a polynomial is', 'Identify its parts', 'Write in standard form'], 'NC.M1.A-SSE.1', 131)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000010', 'M1.POLY.2.1', 'Adding Polynomials', ARRAY['Combine like terms of two or more polynomials'], 'NC.M1.A-APR.1', 132)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000010', 'M1.POLY.2.2', 'Subtracting Polynomials', ARRAY['Distribute the negative sign', 'Combine like terms'], 'NC.M1.A-APR.1', 133)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000010', 'M1.POLY.2.3', 'Multiplying Monomial by Polynomial', ARRAY['Apply the distributive property to multiply a monomial by any polynomial'], 'NC.M1.A-APR.1', 134)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000010', 'M1.POLY.2.4', 'Multiplying Binomial by Binomial (FOIL/Box Method)', ARRAY['Apply distributive property or methods like FOIL/Box to multiply two binomials'], 'NC.M1.A-APR.1', 135)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000010', 'M1.POLY.3.1', 'Factoring the Greatest Common Factor (GCF) from Polynomials', ARRAY['Identify the greatest common monomial factor', 'Factor it out from an expression'], 'NC.M1.A-SSE.1, NC.M1.A-SSE.2', 136)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000010', 'M1.POLY.4.1', 'Factoring Quadratic Expressions of the Form x² + bx + c', ARRAY['Find two numbers that multiply to c and add to b', 'Write as binomial factors'], 'NC.M1.A-SSE.2', 137)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000010', 'M1.POLY.4.2', 'Factoring Quadratic Expressions of the Form ax² + bx + c (where a ≠ 1)', ARRAY['Use methods like grouping, trial and error, or the ''slide and divide'' method to factor'], 'NC.M1.A-SSE.2', 138)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000010', 'M1.POLY.5.1', 'Factoring the Difference of Two Squares (a² - b²)', ARRAY['Recognize and factor expressions in the form (a-b)(a+b)'], 'NC.M1.A-SSE.2', 139)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000010', 'M1.POLY.5.2', 'Factoring Perfect Square Trinomials (a² ± 2ab + b²)', ARRAY['Recognize and factor expressions into (a ± b)²'], 'NC.M1.A-SSE.2', 140)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000010', 'M1.POLY.6.1', 'Choosing the Best Factoring Method (Mixed Practice)', ARRAY['Determine the most efficient factoring method for a given quadratic expression'], 'NC.M1.A-SSE.2', 141)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000011', 'M1.QUAD.1.1', 'Understanding Quadratic Functions (Definition, Standard Form)', ARRAY['Identify quadratic functions', 'Recognize coefficients a, b, c'], 'NC.M1.F-IF.7', 142)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000011', 'M1.QUAD.1.2', 'Graphing Quadratic Functions (y=ax²+bx+c) and Identifying Key Features', ARRAY['Identify vertex, axis of symmetry, x- and y-intercepts from graph', 'Graph parabolas'], 'NC.M1.F-IF.4, NC.M1.F-IF.7', 143)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000011', 'M1.QUAD.1.3', 'Interpreting Key Features of Quadratic Functions in Context', ARRAY['Analyze the meaning of vertex, intercepts, and intervals in real-world problems'], 'NC.M1.F-IF.4', 144)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000011', 'M1.QUAD.2.1', 'Understanding the Relationship between Zeros, Roots, and X-Intercepts', ARRAY['Define zero, root, and x-intercept as interchangeable terms for solutions'], 'NC.M1.A-REI.4', 145)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000011', 'M1.QUAD.2.2', 'Solving Quadratic Equations by Factoring', ARRAY['Factor quadratic expressions', 'Apply the Zero Product Property to find solutions'], 'NC.M1.A-REI.4b', 146)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000011', 'M1.QUAD.2.3', 'Solving Quadratic Equations by Taking Square Roots', ARRAY['Isolate the squared term', 'Apply the square root property to solve equations'], 'NC.M1.A-REI.4b', 147)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000011', 'M1.QUAD.2.4', 'Solving Quadratic Equations using the Quadratic Formula (Real Solutions)', ARRAY['Identify a, b, c', 'Substitute into the quadratic formula', 'Simplify to find real solutions'], 'NC.M1.A-REI.4b', 148)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000011', 'M1.QUAD.3.1', 'Creating Quadratic Equations from Graphs, Tables, or Verbal Descriptions', ARRAY['Write quadratic equations from given data points or descriptions', 'Define variables'], 'NC.M1.A-CED.1, NC.M1.F-BF.1', 149)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000011', 'M1.QUAD.4.1', 'Comparing Linear, Exponential, and Quadratic Functions (Tables and Graphs)', ARRAY['Analyze patterns of change in tables (constant 1st, 2nd differences, common ratio)', 'Compare shapes of graphs'], 'NC.M1.F-LE.3', 150)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000011', 'M1.QUAD.4.2', 'Comparing Linear, Exponential, and Quadratic Functions (Equations and Context)', ARRAY['Formulate and compare linear vs. exponential functions from equations and real-world contexts'], 'NC.M1.F-LE.3', 151)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000012', 'M1.DAS.1.1', 'Understanding Types of Data (Quantitative vs. Categorical)', ARRAY['Differentiate between types of data', 'Identify appropriate data for statistical questions'], 'NC.M1.S-ID.1', 152)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000012', 'M1.DAS.1.2', 'Representing One-Variable Data (Dot Plots and Histograms)', ARRAY['Create and interpret dot plots and histograms', 'Describe distribution shape'], 'NC.M1.S-ID.1', 153)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000012', 'M1.DAS.1.3', 'Representing One-Variable Data (Box Plots/Box-and-Whisker Plots)', ARRAY['Create and interpret box plots', 'Identify quartiles, median, and range'], 'NC.M1.S-ID.1', 154)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000012', 'M1.DAS.2.1', 'Calculating Measures of Central Tendency (Mean, Median, Mode)', ARRAY['Compute mean, median, and mode for a data set', 'Interpret their meaning'], 'NC.M1.S-ID.2', 155)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000012', 'M1.DAS.2.2', 'Calculating Measures of Variability (Range and Interquartile Range)', ARRAY['Compute range and IQR', 'Understand how they describe data spread'], 'NC.M1.S-ID.2', 156)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000012', 'M1.DAS.2.3', 'Understanding Standard Deviation (Introduction)', ARRAY['Understand standard deviation as a measure of typical distance from the mean'], 'NC.M1.S-ID.2', 157)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000012', 'M1.DAS.2.4', 'Comparing Data Sets (Using Measures of Center and Variability)', ARRAY['Compare and contrast two or more data sets using calculated statistics'], 'NC.M1.S-ID.2', 158)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000012', 'M1.DAS.3.1', 'Representing Two-Variable Data with Scatter Plots', ARRAY['Create scatter plots from bivariate data', 'Label axes correctly'], 'NC.M1.S-ID.6', 159)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000012', 'M1.DAS.3.2', 'Interpreting Scatter Plots (Correlation, Outliers, Clusters)', ARRAY['Describe the direction, form, and strength of association', 'Identify outliers'], 'NC.M1.S-ID.6', 160)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000012', 'M1.DAS.4.1', 'Understanding and Calculating the Line of Best Fit (Linear Regression)', ARRAY['Draw a line of best fit by eye', 'Use technology to calculate the least-squares regression line'], 'NC.M1.S-ID.6', 161)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000012', 'M1.DAS.4.2', 'Using the Line of Best Fit for Prediction and Interpretation', ARRAY['Predict values using the linear model', 'Interpret the slope and y-intercept in context'], 'NC.M1.S-ID.7', 162)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000012', 'M1.DAS.4.3', 'Understanding Residuals', ARRAY['Calculate residuals', 'Interpret residuals in relation to the line of best fit'], 'NC.M1.S-ID.6', 163)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000012', 'M1.DAS.5.1', 'Understanding the Correlation Coefficient (Introduction to r-value)', ARRAY['Interpret the meaning of the correlation coefficient (strength and direction)'], 'NC.M1.S-ID.8', 164)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000012', 'M1.DAS.5.2', 'Distinguishing Between Correlation and Causation', ARRAY['Explain that correlation does not imply causation', 'Identify potential lurking variables'], 'NC.M1.S-ID.9', 165)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000013', 'M1.GEO.TRANS.1.1', 'Understanding Transformations (Introduction to Rigid Motions/Isometries)', ARRAY['Define transformation', 'Identify rigid motions that preserve distance and angle measure'], 'NC.M1.G-CO.2', 166)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000013', 'M1.GEO.TRANS.2.1', 'Understanding Translations (Vector Notation and Coordinate Rules)', ARRAY['Define translation', 'Represent translations using vectors or coordinate rules'], 'NC.M1.G-CO.2, NC.M1.G-CO.4', 167)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000013', 'M1.GEO.TRANS.2.2', 'Performing and Graphing Translations in the Coordinate Plane', ARRAY['Translate figures on the coordinate plane based on given rules or vectors'], 'NC.M1.G-CO.2', 168)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000013', 'M1.GEO.TRANS.3.1', 'Understanding Reflections Across Axes and the Lines y=x and y=-x', ARRAY['Define reflection', 'Identify lines of reflection (x-axis, y-axis, y=x, y=-x)'], 'NC.M1.G-CO.2, NC.M1.G-CO.4', 169)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000013', 'M1.GEO.TRANS.3.2', 'Performing and Graphing Reflections in the Coordinate Plane', ARRAY['Reflect figures across given lines on the coordinate plane'], 'NC.M1.G-CO.2', 170)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000013', 'M1.GEO.TRANS.3.3', 'Understanding Reflections Across Horizontal and Vertical Lines (Not Axes)', ARRAY['Identify and apply rules for reflections across y=k and x=h'], 'NC.M1.G-CO.2', 171)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000013', 'M1.GEO.TRANS.4.1', 'Understanding Rotations About the Origin (90°, 180°, 270°)', ARRAY['Define rotation', 'Understand angle and direction of rotation', 'Use coordinate rules'], 'NC.M1.G-CO.2, NC.M1.G-CO.4', 172)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000013', 'M1.GEO.TRANS.4.2', 'Performing and Graphing Rotations About the Origin', ARRAY['Rotate figures on the coordinate plane using rules for specific angles'], 'NC.M1.G-CO.2', 173)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000013', 'M1.GEO.TRANS.5.1', 'Understanding Sequences of Transformations', ARRAY['Perform a composition of two or more rigid transformations'], 'NC.M1.G-CO.5', 174)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000013', 'M1.GEO.TRANS.6.1', 'Identifying Congruent Figures Based on Rigid Motions', ARRAY['Determine if two figures are congruent by identifying a sequence of rigid motions'], 'NC.M1.G-CO.6', 175)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000013', 'M1.GEO.TRANS.7.1', 'Understanding Definitions of Geometric Figures in Terms of Rigid Motions', ARRAY['Understand how rigid motions relate to definitions of angles, perpendicular lines, parallel lines, and line segments'], 'NC.M1.G-CO.1', 176)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000013', 'M1.GEO.TRANS.7.2', 'Understanding Definitions of Circles and Polygons in Terms of Rigid Motions', ARRAY['Understand how rigid motions relate to definitions of circles and polygons'], 'NC.M1.G-CO.1', 177)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000013', 'M1.GEO.TRANS.8.1', 'Understanding Line Symmetry', ARRAY['Identify lines of symmetry in two-dimensional figures'], 'NC.M1.G-CO.3', 178)
ON CONFLICT (lesson_number) DO NOTHING;
INSERT INTO atomic_concepts (unit_id, lesson_number, title, key_skills, standard_code, sort_order) VALUES
  ('00000000-0000-0000-0002-000000000013', 'M1.GEO.TRANS.8.2', 'Understanding Rotational Symmetry', ARRAY['Identify rotational symmetry in two-dimensional figures', 'Determine angle of rotation'], 'NC.M1.G-CO.3', 179)
ON CONFLICT (lesson_number) DO NOTHING;
