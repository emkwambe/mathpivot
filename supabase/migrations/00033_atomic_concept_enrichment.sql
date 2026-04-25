-- Migration: Add enrichment columns to atomic_concepts
-- Supports per-concept pedagogical metadata (misconceptions, hints, career links)

ALTER TABLE atomic_concepts
  ADD COLUMN IF NOT EXISTS common_misconceptions TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS teaching_notes TEXT,
  ADD COLUMN IF NOT EXISTS prerequisite_concepts TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS career_connections TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('intro', 'standard', 'challenge', 'extension')),
  ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER;
