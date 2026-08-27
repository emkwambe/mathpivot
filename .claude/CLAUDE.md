# MathPivot

## Strategic Directive

**Read `docs/infrastructure-directive.md` before any work.** Every feature, recommendation, and decision must pass the 7-layer infrastructure test defined there. MathPivot is not a tutoring business — it is a coaching infrastructure company.

## Overview

MathPivot is a mathematics coaching academy that develops confidence, mastery, and future opportunities through personalized learning roadmaps, dedicated coaches, and micro-cohort learning environments. **Read `docs/coaching-academy-positioning.md` for full business philosophy.**

**Hierarchy:** Human = "Math Coach" (premium). AI = "AI Math Tutor" (tool). Never call coaches "tutors" in user-facing text. Never use "tutoring hours" — use "coaching meetings" or "development pathway."

## Business Model

- **Coaching programs:** Foundation ($349/mo, 2 guided sessions/week), Acceleration ($549/mo, 3 guided sessions/week), Advanced ($799/mo, 2-3 guided sessions/week + pathway-specific opportunities). Advanced replaced the earlier "Elite" name — the value "elite" is a deprecated legacy tier retained only for historic Sprint 9 test-mode rows.
- **Summer clinics:** Propel Math 7 ($249, $75 credit), Advantage Math 8 ($399, $100 credit), Ignite Math 1 ($349, $100 credit), Ascent Pre-Calc ($449, $150 credit)
- **Future:** Coach certification ($1,500-2,500), platform licensing ($199/mo + 15% royalty)
- **Cohorts:** 5 target / 6 max per cohort, max 3 cohorts per coach, same-program default
- **Sessions:** 60 minutes + 10-min grace max. Mon-Thu 5:30-7:45 PM, Sat 10:00-12:15 PM
- **Pricing philosophy:** Never sell hours. Sell development pathways. Focus on outcomes, mastery, confidence.

## Design Tokens

- **Colors:** Royal Blue (#1D4ED8/blue-700), Slate (#334155/slate-700), Orange accent (#F97316/orange-500 — isolated to CTAs only)

## Key Systems Built

- **Mastery tracking:** 179+ atomic concepts, 5-level progression
- **Coach OS:** Onboarding protocol, session prep briefs, check-in surveys, school pulse, career touchpoints
- **Proactive anticipation:** "What's Next" maps school curriculum to coach prep
- **Diagnostic engine:** Domain scoring, placement recommendations
- **Scheduling:** Coaching schedules, cohort enrollments, capacity management (5 default/6 max)
- **Survey/Check-in engine:** Session, school pulse, parent confidence, RIASEC career interest
- **Homeschool compliance:** Attendance logs, mastery portfolios, transcripts
- **Summer clinic pipeline:** Waitlist → triage → diagnostic → placement → coaching → conversion

## DB Notes

- Role "tutor" in database — do NOT rename. User-facing = "Math Coach"
- Views: coach_schedule_overview (fill status, enrollment counts)

## Development Commands

```bash
NODE_ENV=production npm run build  # Build (required in this environment)
```

## Decision Framework

Before building anything, ask:
1. Does this improve student outcomes?
2. Does this strengthen the MathPivot Method?
3. Does this help another coach succeed?
4. Does this increase scalability beyond the founder?
5. Does this create reusable IP?
6. Does this generate valuable data?
7. Could this work with a trained coach in any state?

If most answers are no, reconsider.
