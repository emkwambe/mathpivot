# Coach Operating System — Sprint Plan

## Context
This plan builds the infrastructure for coaches to operate professionally:
student intake, onboarding protocols, session workflows, career spotlight,
and homeschool compliance. All items are implementable in the current
Next.js/Supabase stack.

---

## Sprint A: Student Intake & Coach Context (3 days)

### Goal
Give coaches everything they need to know about a student before session 1.

### Database
- Migration 00039: `student_profiles_extended` table
  - school_name, grade_level, current_math_course, textbook_curriculum
  - current_math_grade, teacher_name
  - next_test_dates (JSONB array of {name, date})
  - learning_goals_parent, learning_goals_student
  - accommodations (IEP/504 text)
  - extracurriculars, best_session_times
  - is_homeschool, homeschool_curriculum
  - communication_preference (email/text/in-app)
  - Linked to student user_id, filled by parent during enrollment

### Frontend
- Parent enrollment flow: add intake form after coach selection
- Coach portfolio: show student context card (school, course, goals, next tests)
- Admin: view all student profiles

### Server Actions
- `saveStudentIntake()` — parent fills during enrollment
- `getStudentContext()` — coach sees before every session

---

## Sprint B: Onboarding Protocol (2 days)

### Goal
Enforce a structured onboarding checklist that coaches must complete
before they're "active" with a student. No shortcuts.

### Database
- Add to `program_enrollments`:
  - onboarding_status: 'pending' | 'in_progress' | 'completed'
  - onboarding_completed_at: TIMESTAMPTZ
- Migration 00040: `onboarding_checklist` table
  - enrollment_id, step_key, completed_at, notes
  - Steps: rapport_building, diagnostic_assessment, parent_goal_alignment,
    learning_plan_created, communication_rhythm_set, first_mastery_update

### Frontend
- Coach portfolio: show onboarding progress per student (0/6 → 6/6)
- Onboarding page: checklist UI with notes per step
- Block mastery tracking until onboarding is complete
- Admin: see which enrollments are still onboarding

### Server Actions
- `completeOnboardingStep()` — mark step done with notes
- `getOnboardingStatus()` — check completion

---

## Sprint C: Session Protocol & Auto-Summary (2 days)

### Goal
Structure every session and auto-generate parent summaries.

### Database
- Add to `sessions` table:
  - session_type: 'onboarding' | 'regular' | 'assessment' | 'review'
  - concepts_planned (UUID array — from session prep brief)
  - concepts_covered (UUID array — filled at session end)
  - parent_summary_sent: BOOLEAN

### Frontend
- Coach session view: structured template showing
  1. Review (auto-populated from session prep brief)
  2. Focus areas (from stalled concepts)
  3. Mastery update section
  4. Notes + next steps
- Session end: auto-generate parent summary email from mastery updates

### Server Actions
- Extend `endSession()` to auto-send parent summary
- `getSessionTemplate()` — pre-populate session structure from prep brief

---

## Sprint D: Career Spotlight (2 days)

### Goal
Show students which careers connect to their strongest math domains.
No full career platform — just a contextual card on the Journey page.

### Database
- Migration 00041: `career_spotlights` table
  - id, title, description, math_domains (text array)
  - salary_range, growth_outlook, partner_org
  - icon, color
- Seed 15-20 career profiles mapped to math domains:
  - statistics → Data Scientist, Actuary, Epidemiologist
  - algebra → Software Engineer, Financial Analyst
  - geometry → Architect, Robotics Engineer
  - probability → Risk Analyst, Insurance Underwriter
  - calculus → Aerospace Engineer, ML Engineer

### Frontend
- Student Journey page: "Career Spotlight" card showing 2-3 careers
  based on student's strongest mastery domains
- Career detail view (optional): description, what they do daily,
  math connection, partner org link

### Server Actions
- `getCareerSpotlights(studentId)` — analyze mastery data,
  return matching careers

---

## Sprint E: Homeschool Compliance (2 days)

### Goal
Generate exportable documents homeschool families need for state compliance.

### What to build
- Attendance log PDF: date, duration, concepts covered per session
- Mastery portfolio PDF: all concepts with mastery levels, dates assessed
- Progress report: monthly summary aligned to NC DPI standards
- High school transcript: course name, credit hours, grade (for older students)

### Frontend
- Parent dashboard: "Export Records" section with download buttons
- Format: server-generated HTML → PDF (or printable HTML page)

### Server Actions
- `generateAttendanceLog(studentId, dateRange)` — returns HTML/data
- `generateMasteryPortfolio(studentId)` — full concept list with levels
- `generateProgressReport(studentId, month)` — monthly standards summary

### No database changes needed — all generated from existing data.

---

## Sprint F: Coach Training & Certification (1 day)

### Goal
Track coach readiness and training completion.

### Database
- Migration 00042: `coach_certifications` table
  - coach_id, certification_type, completed_at, expires_at
  - Types: background_check, platform_training, pedagogy_basics,
    curriculum_familiarity, monthly_calibration

### Frontend
- Admin: coach readiness dashboard showing training status per coach
- Coach: "My Certifications" section on settings page

### Server Actions
- `getCoachReadiness(coachId)` — returns completion status per requirement
- Block coach from receiving students until required certs are complete

---

## Sprint Order & Dependencies

```
Sprint A (intake) ──→ Sprint B (onboarding) ──→ Sprint C (session protocol)
                                                        ↓
Sprint D (career spotlight) ← no dependency      Sprint F (coach training)
                                                        ↑
Sprint E (homeschool) ← no dependency ───────────────────┘
```

### Recommended execution order:
1. **Sprint A** — intake form (foundation for everything else)
2. **Sprint B** — onboarding checklist (depends on intake)
3. **Sprint C** — session protocol + auto-summary (depends on onboarding)
4. **Sprint D** — career spotlight (independent, can run parallel with C)
5. **Sprint E** — homeschool exports (independent, can run parallel with D)
6. **Sprint F** — coach training (independent, can run anytime)

### Total: ~12 days of development

### What's NOT in these sprints (future)
- Video session integration (Zoom/Google Meet)
- AI-generated practice problems
- Parent mobile app
- Stripe subscription billing
- Curriculum marketplace (buy/sell lesson plans)
