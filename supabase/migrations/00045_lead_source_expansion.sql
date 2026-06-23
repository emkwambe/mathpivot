-- Migration 00045: Add new lead sources for public forms
-- Extends the lead_source enum to support summer waitlist, diagnostic, and coach application forms

ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'summer_clinic_waitlist';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'free_diagnostic';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'coach_application';
