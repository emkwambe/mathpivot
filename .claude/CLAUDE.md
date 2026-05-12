# MathPivot

## Overview

MathPivot is a structured math coaching platform — "the travel ball of math." Named coaches, mastery tracking, Mathathlon competitions, and career exposure. Built with Next.js 16 and Supabase.

**Important:** This is NOT a tutoring platform. Coaches are not tutors. We sell structured programs (Foundation $349/mo, Acceleration $549/mo, Elite $799/mo), not hourly sessions. All user-facing copy should use "coach/coaching" never "tutor/tutoring."

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **UI:** shadcn/ui components
- **AI:** Claude API, Gemini API
- **Email:** Resend (noreply@mathpivot.com)
- **Monitoring:** Sentry

## Project Structure

```
mathpivot/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (dashboard)/  # Role-based dashboards
│   │   │   ├── student/  # Student dashboard
│   │   │   ├── parent/   # Parent dashboard
│   │   │   ├── tutor/    # Coach dashboard (route says "tutor", DB role is "tutor")
│   │   │   └── admin/    # Admin dashboard
│   │   ├── (public)/     # Public pages (get-started, pricing, careers, about)
│   │   ├── actions/      # Server actions
│   │   └── api/          # API routes
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   └── types/            # TypeScript types
├── supabase/             # Database migrations (00001-00039)
├── docs/                 # Strategic docs, sprint plans
└── public/               # Static assets
```

## Key Concepts

- **Programs:** Foundation (2x/week), Acceleration (3x/week), Elite (4x/week)
- **Sessions:** 60 minutes standard + 10-min grace extension max
- **Mastery levels:** not_started → introduced → developing → proficient → mastered
- **Onboarding:** 6-step protocol before coaches start regular sessions
- **Revenue share:** Coaches earn 60% of program revenue
- **DB role "tutor":** The database uses "tutor" as the role name. Do NOT rename in DB — only change user-facing text to "coach"

## Development Commands

```bash
npm install                        # Install dependencies
npm run dev                        # Start dev server
NODE_ENV=production npm run build  # Build (required in this environment)
```

## For Claude Code

When starting work:
1. Read this file first
2. Run `NODE_ENV=production npm run build` to verify state
3. Always use "coach/coaching" in user-facing text, never "tutor/tutoring"
4. Session duration is 60 minutes (not 45)
