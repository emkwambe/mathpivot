-- ============================================================================
-- MATHPIVOT TUTOROS - SEED DATA: PRODUCTS
-- Seed file 02: Product packages and subscriptions
-- ============================================================================

-- Package Products (one-time purchases)
INSERT INTO products (id, name, description, product_type, credits, price_cents, currency, is_active, metadata) VALUES
(
    uuid_generate_v4(),
    'Starter Pack',
    'Perfect for trying out MathPivot. Includes 4 one-hour sessions.',
    'package',
    4,
    19900, -- $199.00
    'USD',
    true,
    '{"highlight": false, "popular": false}'
),
(
    uuid_generate_v4(),
    'Standard Pack',
    'Our most popular package. Includes 8 one-hour sessions with a 10% discount.',
    'package',
    8,
    35900, -- $359.00 (normally $398)
    'USD',
    true,
    '{"highlight": true, "popular": true, "savings_percent": 10}'
),
(
    uuid_generate_v4(),
    'Premium Pack',
    'Best value for committed learners. Includes 16 one-hour sessions with a 15% discount.',
    'package',
    16,
    67900, -- $679.00 (normally $796)
    'USD',
    true,
    '{"highlight": false, "popular": false, "savings_percent": 15}'
),
(
    uuid_generate_v4(),
    'Intensive Pack',
    'For intensive preparation. Includes 24 one-hour sessions with a 20% discount.',
    'package',
    24,
    95900, -- $959.00 (normally $1194)
    'USD',
    true,
    '{"highlight": false, "popular": false, "savings_percent": 20}'
);

-- Subscription Products (recurring)
INSERT INTO products (id, name, description, product_type, credits, price_cents, currency, is_active, metadata) VALUES
(
    uuid_generate_v4(),
    'Monthly Basic',
    'Subscription with 4 sessions per month. Cancel anytime.',
    'subscription',
    4,
    18900, -- $189.00/month
    'USD',
    true,
    '{"interval": "month", "trial_days": 0, "auto_renew": true}'
),
(
    uuid_generate_v4(),
    'Monthly Plus',
    'Subscription with 8 sessions per month. Our most flexible ongoing plan.',
    'subscription',
    8,
    34900, -- $349.00/month
    'USD',
    true,
    '{"interval": "month", "trial_days": 0, "auto_renew": true, "popular": true}'
),
(
    uuid_generate_v4(),
    'Semester Plan',
    'Commit to a semester and save. 4 sessions per month, billed every 4 months.',
    'subscription',
    16,
    69900, -- $699.00 every 4 months
    'USD',
    true,
    '{"interval": "4months", "trial_days": 0, "auto_renew": true, "savings_percent": 8}'
);

-- Verify insertion
-- SELECT name, product_type, credits, price_cents FROM products ORDER BY product_type, price_cents;
