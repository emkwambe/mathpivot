\# MathPivot TutorOS



\## Overview

MathPivot TutorOS is a comprehensive tutoring management platform connecting students, parents, tutors, and administrators in a math education ecosystem. Built with Next.js 16 and Supabase.



\## Tech Stack

\- \*\*Frontend:\*\* Next.js 16 (App Router), React, TypeScript, Tailwind CSS

\- \*\*Backend:\*\* Supabase (PostgreSQL + Auth)

\- \*\*UI:\*\* shadcn/ui components

\- \*\*AI:\*\* Claude API, Gemini API



\## Project Structure

```

mathpivot/

├── src/

│   ├── app/              # Next.js App Router

│   │   ├── (dashboard)/  # Role-based dashboards

│   │   │   ├── student/  # Student dashboard

│   │   │   ├── parent/   # Parent dashboard

│   │   │   ├── tutor/    # Tutor dashboard

│   │   │   └── admin/    # Admin dashboard

│   │   └── api/          # API routes

│   ├── components/       # React components

│   ├── lib/             # Utilities

│   └── types/           # TypeScript types

├── supabase/            # Database migrations

└── public/              # Static assets

```



\## Development Commands

```bash

npm install          # Install dependencies

npm run dev          # Start dev server

npm run build        # Build for production

```



\## Current Status

\- Student dashboard: Working

\- Parent dashboard: Working

\- AI Tutor: Needs testing

\- Build status: Check with npm run build



\## For Claude Code

When starting work:

1\. Read this file first

2\. Run npm run build to verify state

3\. Ask if anything is unclear

