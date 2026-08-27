-- Add 'advanced' to program_tier enum as part of the Elite -> Advanced rename.
--
-- The application canonical tier value becomes 'advanced'. The old 'elite' value
-- is retained ONLY as a historic marker for Sprint 9 test-mode subscription rows
-- created before this migration. No new rows should be inserted with tier =
-- 'elite'; VALID_TIERS in src/lib/stripe/programs.ts excludes it and the
-- subscription webhook skips events carrying the legacy value.
--
-- Postgres does not support dropping enum values without recreating the type,
-- so 'elite' remains a valid enum value at the database level. Application
-- discipline is the enforcement mechanism.

ALTER TYPE program_tier ADD VALUE IF NOT EXISTS 'advanced';

COMMENT ON TYPE program_tier IS
  'MathPivot coaching program tier. Canonical values: foundation, acceleration, advanced. Value ''elite'' is deprecated and retained only for historic Sprint 9 test-mode rows — do not insert new rows with this value.';
