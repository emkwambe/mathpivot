# ============================================================================
# MathPivot TutorOS - Claude Code Setup Script
# ============================================================================
# Purpose: Create .claude/ folder with comprehensive project documentation
# Author: Claude (CTO/PM)
# Date: 2026-01-24
# ============================================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Setting Up Claude Code for MathPivot" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Create .claude directory if it doesn't exist
$claudeDir = ".\.claude"
if (-not (Test-Path $claudeDir)) {
    New-Item -ItemType Directory -Path $claudeDir | Out-Null
    Write-Host "✓ Created .claude/ directory" -ForegroundColor Green
} else {
    Write-Host "⚠️  .claude/ directory already exists - will update files" -ForegroundColor Yellow
}

# ============================================================================
# CLAUDE.md - Main Project Documentation
# ============================================================================

$claudeMd = @"
# MathPivot TutorOS

## Overview
MathPivot TutorOS is a comprehensive tutoring management platform that connects students, parents, tutors, and administrators in a math education ecosystem. Built with Next.js 16 and Supabase, it features AI-powered tutoring, intelligent scheduling, skill mastery tracking, and program management.

## Tech Stack
- **Frontend:** Next.js 16 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Supabase (PostgreSQL + Auth)
- **Database:** PostgreSQL with Row Level Security (RLS)
- **UI Components:** shadcn/ui, Lucide icons
- **Authentication:** Supabase Auth with role-based access (student, parent, tutor, admin)
- **AI Integration:** Claude API (Anthropic), Gemini API (Google)
- **Styling:** Tailwind CSS with custom design system

## Project Structure
````
mathpivot/
├── src/
│   ├── app/                    # Next.js 16 App Router
│   │   ├── (auth)/            # Auth pages (login, signup)
│   │   ├── (dashboard)/       # Role-based dashboards
│   │   │   ├── student/      # Student dashboard & AI Tutor
│   │   │   ├── parent/       # Parent dashboard & booking
│   │   │   ├── tutor/        # Tutor dashboard & sessions
│   │   │   └── admin/        # Admin dashboard & management
│   │   ├── api/              # API routes
│   │   │   ├── ai/          # AI-powered endpoints
│   │   │   ├── auth/        # Authentication endpoints
│   │   │   └── ...
│   │   └── layout.tsx        # Root layout
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── dashboard/        # Dashboard-specific components
│   │   └── ...
│   ├── lib/
│   │   ├── supabase/         # Supabase client & utilities
│   │   ├── ai/               # AI service integrations
│   │   └── utils.ts          # Utility functions
│   └── types/                # TypeScript type definitions
├── supabase/                  # Supabase configuration
│   ├── migrations/           # Database migrations
│   └── seed.sql             # Seed data
├── public/                    # Static assets
├── .claude/                   # Claude Code context (this folder!)
└── ...
````

## Key Files

### Core Configuration
- \`next.config.ts\` — Next.js configuration (Turbopack enabled)
- \`tsconfig.json\` — TypeScript configuration
- \`tailwind.config.ts\` — Tailwind CSS configuration
- \`components.json\` — shadcn/ui component configuration

### Authentication & Database
- \`src/lib/supabase/client.ts\` — Supabase client initialization
- \`src/lib/supabase/middleware.ts\` — Auth middleware for route protection
- \`src/types/database.types.ts\` — Database type definitions (auto-generated)

### AI Integration
- \`src/lib/ai/claude-service.ts\` — Claude API integration for tutoring
- \`src/app/api/ai/chat/route.ts\` — AI chat endpoint
- \`src/app/(dashboard)/student/ai-tutor/page.tsx\` — AI Tutor UI (needs react-markdown)

### Dashboard Pages
- \`src/app/(dashboard)/student/page.tsx\` — Student dashboard
- \`src/app/(dashboard)/parent/page.tsx\` — Parent dashboard
- \`src/app/(dashboard)/tutor/page.tsx\` — Tutor dashboard
- \`src/app/(dashboard)/admin/page.tsx\` — Admin dashboard

## Database Schema (39+ Tables)

### User Management
- \`users_profile\` — Extended user profiles
- \`families\` — Family groupings
- \`family_members\` — Family member relationships
- \`students_profile\` — Student-specific data
- \`tutors_profile\` — Tutor-specific data

### Scheduling System
- \`bookings\` — Session bookings
- \`sessions\` — Completed/ongoing sessions
- \`availability_rules\` — Tutor availability
- \`waitlist\` — Session waitlist

### Learning & Skills
- \`skills\` — Skills library by course track
- \`student_skill_mastery\` — Student progress tracking
- \`session_skills\` — Skills covered in sessions

### Programs & Competitions
- \`programs\` — Math camps, bootcamps, workshops
- \`competitions\` — Math competitions (team/individual)
- \`certification_programs\` — Certification pathways
- \`career_pathways\` — Career-focused tracks

### Credits & Payments
- \`products\` — Session credit packages
- \`purchases\` — Purchase history
- \`credit_ledger\` — Credit transactions

### AI Chat
- \`ai_chat_conversations\` — Chat sessions
- \`ai_chat_messages\` — Individual messages

## Development Commands

\`\`\`bash
# Install dependencies
npm install

# Install missing react-markdown (if needed)
npm install react-markdown remark-gfm remark-math rehype-katex

# Start development server (with Turbopack)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Generate TypeScript types from Supabase
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
\`\`\`

## Environment Variables

Required in \`.env.local\`:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI APIs
ANTHROPIC_API_KEY=your_anthropic_key
GEMINI_API_KEY=your_gemini_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

## Architecture Notes

### Authentication Flow
1. Supabase Auth handles user authentication
2. Middleware checks auth status on protected routes
3. Role-based routing redirects users to appropriate dashboards
4. RLS policies enforce data access control

### AI Tutor Architecture
1. Student sends message via AI Tutor interface
2. Request sent to \`/api/ai/chat\` endpoint
3. Endpoint fetches student context (grade, skills, goals)
4. Claude API generates personalized tutoring response
5. Markdown-formatted response rendered with react-markdown

### Scheduling System
1. Tutors set availability rules (recurring schedules)
2. Parents browse available slots
3. Booking system checks for conflicts
4. Credits deducted on successful booking
5. Sessions tracked for skill mastery updates

## Current Status

### ✅ Working
- Student dashboard
- Parent dashboard
- AI Tutor chat interface
- Role-based authentication & routing
- Database schema with RLS policies
- Seed data for testing

### 🚧 In Progress
- AI Tutor markdown rendering (react-markdown needed)
- Tutor availability management UI
- Parent booking flow
- Skill mastery tracking UI

### ❌ Not Started
- Stripe payment integration
- Real-time session features
- Program enrollment system
- Certification tracking
- Admin analytics dashboard

### 🐛 Known Issues
- **Build Error:** Module not found: 'react-markdown' in AI Tutor page
- **Solution:** Run \`npm install react-markdown remark-gfm remark-math rehype-katex\`

## Coding Conventions

### TypeScript
- Strict mode enabled
- Use explicit types (avoid \`any\`)
- Interface for object shapes, Type for unions/intersections
- Use \`Database['public']['Tables']['table_name']['Row']\` for database types

### React/Next.js
- Use "use client" directive for client components
- Server components by default
- App Router file conventions (page.tsx, layout.tsx, route.ts)
- Dynamic routes: \`[param]/page.tsx\`

### Styling
- Tailwind CSS utility classes
- shadcn/ui components for UI elements
- Use \`cn()\` helper for conditional classes
- Custom theme in tailwind.config.ts

### Database
- Row Level Security (RLS) enabled on all tables
- Use parameterized queries to prevent SQL injection
- Handle auth via Supabase client methods
- Use transactions for multi-table updates

### Git Commits
- Format: \`type: description\`
- Types: feat, fix, docs, style, refactor, test, chore
- Example: \`feat: add AI tutor markdown rendering\`

## For Claude Code

When starting work:
1. **ALWAYS** read this file first
2. Check \`.claude/CURRENT.md\` for active tasks
3. Run \`npm run build\` to verify project state
4. Check \`.claude/HANDOFF.md\` for session notes
5. Ask Eddy if anything is unclear

When implementing features:
1. Follow existing patterns in the codebase
2. Use TypeScript with proper types
3. Test locally before committing
4. Update this documentation if making architectural changes
5. Commit with descriptive messages

When fixing errors:
1. Check error message for file path and line number
2. Verify dependencies are installed
3. Check environment variables
4. Test the fix thoroughly
5. Commit with "fix:" prefix
"@

Set-Content -Path "$claudeDir\CLAUDE.md" -Value $claudeMd -Encoding UTF8
Write-Host "✓ Created CLAUDE.md (main project documentation)" -ForegroundColor Green

# ============================================================================
# CURRENT.md - Active Tasks
# ============================================================================

$currentMd = @"
# Current Sprint/Task

## Sprint: Initial Setup & AI Tutor Fix
**Goal:** Get AI Tutor working with proper markdown rendering and prepare for Claude Code integration
**Started:** 2026-01-24
**Target:** 2026-01-25

## Active Tasks

### Task 1: Fix AI Tutor Build Error
**Status:** 🔴 Not Started
**Description:** Install react-markdown and related dependencies to enable markdown rendering in AI Tutor
**Files Involved:**
- \`src/app/(dashboard)/student/ai-tutor/page.tsx\`
- \`package.json\`

**Steps:**
1. Install react-markdown: \`npm install react-markdown\`
2. Install markdown plugins: \`npm install remark-gfm remark-math rehype-katex\`
3. Test build: \`npm run build\`
4. Test AI Tutor in dev mode: \`npm run dev\`

### Task 2: Verify .claude/ Setup
**Status:** 🟡 In Progress
**Description:** Ensure .claude/ folder is properly configured for Claude Code
**Files Involved:**
- \`.claude/CLAUDE.md\`
- \`.claude/CURRENT.md\`
- \`.claude/BACKLOG.md\`

### Task 3: Test Full Build
**Status:** 🔴 Not Started
**Description:** Verify entire project builds without errors
**Commands:**
\`\`\`bash
npm run build
npm run lint
\`\`\`

## Progress Log
- 2026-01-24: Created .claude/ folder structure
- 2026-01-24: Identified react-markdown missing dependency

## Blockers
- None currently

## Success Criteria
- [ ] react-markdown installed and working
- [ ] AI Tutor page renders without errors
- [ ] Build passes without errors
- [ ] Dev server runs successfully
- [ ] .claude/ documentation complete

## Notes
- AI Tutor is a critical feature for student engagement
- Need to implement math equation rendering with KaTeX
- Consider adding syntax highlighting for code examples
"@

Set-Content -Path "$claudeDir\CURRENT.md" -Value $currentMd -Encoding UTF8
Write-Host "✓ Created CURRENT.md (active tasks)" -ForegroundColor Green

# ============================================================================
# BACKLOG.md - Future Work
# ============================================================================

$backlogMd = @"
# Backlog

## 🔥 High Priority

### Core Features
- [ ] **Real-time Session Features** — Video/audio, whiteboard, screen sharing
- [ ] **Stripe Payment Integration** — Credit purchases, subscription plans
- [ ] **Tutor Availability Management** — UI for setting recurring schedules
- [ ] **Parent Booking Flow** — Browse tutors, book sessions, manage credits
- [ ] **Skill Mastery Dashboard** — Visual progress tracking for students

### AI Enhancements
- [ ] **Math Equation Rendering** — KaTeX support for LaTeX in AI Tutor
- [ ] **Code Syntax Highlighting** — For programming-related math content
- [ ] **Conversation History** — Show past AI Tutor conversations
- [ ] **AI Session Summaries** — Auto-generate session notes for tutors

### Database & Backend
- [ ] **Database Indexes** — Optimize query performance
- [ ] **Caching Layer** — Redis for session data
- [ ] **Webhook System** — For Stripe events
- [ ] **Batch Operations** — Bulk student imports, credit allocations

## 📊 Medium Priority

### Analytics & Reporting
- [ ] **Admin Dashboard Analytics** — User growth, revenue, engagement metrics
- [ ] **Tutor Performance Reports** — Session counts, ratings, earnings
- [ ] **Student Progress Reports** — Skill mastery over time
- [ ] **Parent Reports** — Session summaries, credit usage

### User Experience
- [ ] **Notification System** — Email/SMS for bookings, reminders
- [ ] **Calendar Integration** — Google Calendar, Outlook sync
- [ ] **Mobile Responsive Design** — Optimize for tablets, phones
- [ ] **Dark Mode** — User preference for light/dark theme

### Program Management
- [ ] **Program Enrollment UI** — Register for camps, workshops
- [ ] **Competition Management** — Team formation, scoring, leaderboards
- [ ] **Certification Tracking** — Progress through certification programs
- [ ] **Career Pathway Guidance** — Recommend courses based on career goals

## 🎯 Low Priority / Nice to Have

### Gamification
- [ ] **Achievement Badges** — Milestones for students
- [ ] **Leaderboards** — Top performers by skill/program
- [ ] **Streak Tracking** — Consecutive days of practice
- [ ] **Points System** — Earn points for completing sessions, assessments

### Content Creation
- [ ] **Practice Problem Generator** — AI-powered problem sets
- [ ] **Assessment Builder** — Create custom quizzes
- [ ] **Lesson Plan Templates** — For tutors to prepare sessions
- [ ] **Resource Library** — Videos, PDFs, interactive content

### Community Features
- [ ] **Student Forums** — Peer-to-peer help
- [ ] **Tutor Collaboration** — Share lesson plans, best practices
- [ ] **Parent Community** — Tips, advice, event announcements
- [ ] **Live Group Sessions** — Webinars, study groups

### Advanced AI
- [ ] **Adaptive Learning Paths** — Personalized skill progression
- [ ] **Automated Skill Assessment** — AI evaluates student mastery
- [ ] **Voice-to-Text Tutoring** — Speech input for accessibility
- [ ] **Multi-language Support** — Tutoring in other languages

## 🔧 Technical Debt

### Code Quality
- [ ] **Unit Tests** — Jest/React Testing Library
- [ ] **E2E Tests** — Playwright or Cypress
- [ ] **TypeScript Coverage** — Eliminate 'any' types
- [ ] **Code Documentation** — JSDoc comments for complex functions

### Performance
- [ ] **Image Optimization** — Next.js Image component everywhere
- [ ] **Bundle Size Analysis** — Identify and reduce bloat
- [ ] **Lazy Loading** — Code splitting for routes
- [ ] **Database Query Optimization** — Reduce N+1 queries

### Security
- [ ] **Security Audit** — Penetration testing
- [ ] **Rate Limiting** — Protect API endpoints
- [ ] **Input Validation** — Zod schemas for all forms
- [ ] **CSRF Protection** — Token-based validation

### DevOps
- [ ] **CI/CD Pipeline** — Automated testing, deployment
- [ ] **Monitoring** — Sentry, LogRocket for error tracking
- [ ] **Backup Strategy** — Automated database backups
- [ ] **Staging Environment** — Pre-production testing

## 💡 Ideas / Future Exploration

### Innovative Features
- **AI-Powered Tutor Matching** — Match students with best-fit tutors
- **Augmented Reality Math Tools** — Visualize 3D geometry concepts
- **Virtual Math Escape Rooms** — Gamified problem-solving
- **AI Homework Helper** — Take photo of problem, get step-by-step solution
- **Blockchain Credentials** — Verifiable certifications on blockchain

### Partnerships
- **School District Integration** — Bulk licenses for schools
- **College Prep Partnerships** — SAT/ACT prep programs
- **STEM Organization Collaborations** — Joint events, scholarships
- **Publisher Integrations** — Official prep materials for exams

### Expansion
- **Subject Expansion** — Physics, chemistry, computer science
- **International Markets** — Localization for different countries
- **B2B Platform** — White-label solution for tutoring companies
- **Open API** — Third-party integrations

## ✅ Completed (Archive)
- [x] Basic project structure — 2026-01-24
- [x] Database schema design — 2026-01-24
- [x] Role-based authentication — 2026-01-24
- [x] Student dashboard — 2026-01-24
- [x] Parent dashboard — 2026-01-24
- [x] AI Tutor chat interface — 2026-01-24
"@

Set-Content -Path "$claudeDir\BACKLOG.md" -Value $backlogMd -Encoding UTF8
Write-Host "✓ Created BACKLOG.md (future work)" -ForegroundColor Green

# ============================================================================
# PROMPTS.md - Reusable Claude Code Prompts
# ============================================================================

$promptsMd = @"
# Reusable Prompts for Claude Code

## 🚀 Starting a Session

### First Prompt of the Day
\`\`\`
Read .claude/CLAUDE.md for full project context, then .claude/HANDOFF.md for last session notes.

Summarize:
1. Project state (what works, what doesn't)
2. What was done last session
3. What should be prioritized this session

Then run: npm run build

Report status with any errors found.
\`\`\`

### Quick Status Check
\`\`\`
Read .claude/CLAUDE.md and .claude/CURRENT.md.
Run: npm run build
Report: build status, active tasks, any blockers.
\`\`\`

## 🔧 Development Tasks

### Fix Build Error
\`\`\`
Read .claude/CLAUDE.md for context.

Build error detected: [ERROR_MESSAGE]

Steps:
1. Identify root cause of the error
2. Check if it's a missing dependency (check package.json)
3. If dependency is missing, install it
4. Verify fix by running: npm run build
5. Test in dev mode: npm run dev
6. Commit with: "fix: [description]"
\`\`\`

### Install Missing Dependency
\`\`\`
Read .claude/CLAUDE.md.

Install the following package(s):
- react-markdown
- remark-gfm
- remark-math
- rehype-katex

Steps:
1. Run: npm install react-markdown remark-gfm remark-math rehype-katex
2. Verify installation in package.json
3. Run: npm run build
4. Test: npm run dev
5. Commit with: "chore: add markdown rendering dependencies"
\`\`\`

### Implement New Feature
\`\`\`
Read .claude/CLAUDE.md and .claude/CURRENT.md.

Implement feature: [FEATURE_NAME]

Requirements:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

Files to modify:
- [File 1]
- [File 2]

Follow existing patterns in similar files.
Test by [TEST_METHOD].
Commit with: "feat: [description]"
Update .claude/CURRENT.md with progress.
\`\`\`

### Debug Specific Issue
\`\`\`
Read .claude/CLAUDE.md.

Debug issue: [ISSUE_DESCRIPTION]

Location: [FILE_PATH]:[LINE_NUMBER]

Steps:
1. Examine the code at the specified location
2. Check for related files that might be affected
3. Identify root cause
4. Propose fix
5. Implement fix
6. Test thoroughly
7. Commit with: "fix: [description]"
\`\`\`

## 📄 Code Review & Quality

### Code Quality Check
\`\`\`
Read .claude/CLAUDE.md.

Review code quality in: [DIRECTORY/FILE]

Check for:
1. TypeScript types (no 'any')
2. Error handling (try/catch)
3. Code duplication
4. Best practices violations
5. Performance issues

Report findings and suggest improvements.
\`\`\`

### Add TypeScript Types
\`\`\`
Read .claude/CLAUDE.md.

Add proper TypeScript types to: [FILE_PATH]

Requirements:
1. Replace 'any' types with specific types
2. Use interfaces for object shapes
3. Use type aliases for unions
4. Add JSDoc comments for complex types
5. Verify with: npm run build
6. Commit with: "refactor: add TypeScript types to [FILE]"
\`\`\`

## 🧪 Testing

### Test a Feature
\`\`\`
Read .claude/CLAUDE.md.

Test the following feature: [FEATURE_NAME]

Steps:
1. Start dev server: npm run dev
2. Navigate to: [URL]
3. Test scenario: [SCENARIO]
4. Verify: [EXPECTED_BEHAVIOR]
5. Report results (success/failure, any errors)
\`\`\`

### Integration Testing
\`\`\`
Read .claude/CLAUDE.md.

Test integration between:
- Component: [COMPONENT_NAME]
- API: [API_ENDPOINT]
- Database: [TABLE_NAME]

Steps:
1. Verify API endpoint exists and returns correct data
2. Test component renders with API data
3. Test error handling (network errors, empty data)
4. Check database queries (look for N+1, missing indexes)
5. Report findings
\`\`\`

## 📦 Database Operations

### Generate Database Types
\`\`\`
Read .claude/CLAUDE.md.

Generate TypeScript types from Supabase:

Steps:
1. Run: npx supabase gen types typescript --project-id [PROJECT_ID] > src/types/database.types.ts
2. Verify the file was created
3. Check for any type errors in the project
4. Commit with: "chore: update database types"
\`\`\`

### Create Database Migration
\`\`\`
Read .claude/CLAUDE.md.

Create database migration for: [CHANGE_DESCRIPTION]

Requirements:
- [Schema change 1]
- [Schema change 2]

Create SQL migration file in supabase/migrations/
Include up and down migrations.
Test migration locally if possible.
Commit with: "feat: add [TABLE/COLUMN] to database"
\`\`\`

## 🔍 Analysis & Documentation

### Analyze Codebase
\`\`\`
Read .claude/CLAUDE.md.

Analyze the project and report:
1. Total lines of code (by language)
2. Number of components
3. Number of API routes
4. Unused dependencies in package.json
5. Potential security issues
6. Performance bottlenecks
7. Technical debt items
\`\`\`

### Update Documentation
\`\`\`
Read .claude/CLAUDE.md and .claude/CURRENT.md.

Update documentation:
1. Review .claude/CLAUDE.md — ensure it's accurate
2. Update .claude/CURRENT.md with latest progress
3. Add new features to .claude/BACKLOG.md if applicable
4. Commit with: "docs: update .claude/ documentation"
\`\`\`

## 🏁 End of Session

### Session Wrap-Up
\`\`\`
Session complete. Perform final checks:

1. Run: npm run build (verify passing)
2. Run: npm run lint (check for issues)
3. Review git status: git status
4. Update .claude/CURRENT.md:
   - Mark completed tasks as 🟢 Complete
   - Update progress log with today's date
5. Update .claude/HANDOFF.md:
   - Summarize what was accomplished
   - Note any blockers or issues
   - List next priority tasks
6. Commit documentation updates: "docs: end of session 2026-[DATE]"
7. Report final status:
   - Build status
   - Commits made
   - Issues resolved
   - Next recommended steps
\`\`\`

### Quick End
\`\`\`
Quick session end:
1. Run: npm run build
2. Update .claude/CURRENT.md with progress
3. Report status
\`\`\`

## 🚨 Emergency Prompts

### Rollback Changes
\`\`\`
Emergency: Rollback to last working state.

Steps:
1. Check git log to find last good commit
2. Show changes: git diff [COMMIT_HASH]
3. Revert if safe: git revert [COMMIT_HASH]
4. Or reset: git reset --hard [COMMIT_HASH]
5. Verify: npm run build
6. Report what was rolled back
\`\`\`

### Fix Broken Build
\`\`\`
URGENT: Build is broken.

Steps:
1. Run: npm run build (capture full error)
2. Identify error type (syntax, type, import, etc.)
3. Check recent changes: git diff HEAD~1
4. Fix the immediate issue
5. Verify: npm run build
6. If still broken, rollback last commit
7. Report status
\`\`\`

## 📝 Custom Prompts

### [Your Custom Prompt]
\`\`\`
[Your prompt here]
\`\`\`
"@

Set-Content -Path "$claudeDir\PROMPTS.md" -Value $promptsMd -Encoding UTF8
Write-Host "✓ Created PROMPTS.md (reusable prompts)" -ForegroundColor Green

# ============================================================================
# HANDOFF.md - Session Notes
# ============================================================================

$handoffMd = @"
# Session Handoff Notes

## Last Session: [Not Yet Run]
**Date:** [Date]
**Duration:** [Duration]

### What Was Accomplished
- [Item 1]
- [Item 2]

### Files Modified
- \`[file1]\`
- \`[file2]\`

### Commits Made
- [commit 1]
- [commit 2]

### Current Build Status
- Build: [Pass/Fail]
- Linter: [Pass/Fail]
- Tests: [Pass/Fail]

### Issues Encountered
- [Issue 1]
- [Issue 2]

### Blockers
- [Blocker 1]

### Next Priority Tasks
1. [Task 1]
2. [Task 2]

### Notes for Next Session
- [Note 1]
- [Note 2]

---

## Session History

### Session 1: Initial Setup (2026-01-24)
**Accomplishments:**
- Created .claude/ folder structure
- Documented project in CLAUDE.md
- Identified react-markdown missing dependency

**Next Steps:**
- Install react-markdown and plugins
- Verify AI Tutor builds without errors
- Test full application build
"@

Set-Content -Path "$claudeDir\HANDOFF.md" -Value $handoffMd -Encoding UTF8
Write-Host "✓ Created HANDOFF.md (session notes)" -ForegroundColor Green

# ============================================================================
# DECISIONS.md - Architecture Decisions
# ============================================================================

$decisionsMd = @"
# Architecture Decisions Log

This file documents significant architectural and technical decisions made during development.

---

## ADR-001: Next.js 16 with App Router (2026-01-24)

**Status:** Accepted

**Context:**
Need modern React framework with good TypeScript support, server-side rendering, and built-in routing.

**Decision:**
Use Next.js 16 with App Router instead of Pages Router.

**Rationale:**
- App Router is the future of Next.js
- Better TypeScript support
- Server Components by default (better performance)
- Improved data fetching patterns
- Better support for parallel routes and layouts

**Consequences:**
- Learning curve for App Router patterns
- Some third-party libraries may not be fully compatible yet
- Need to use "use client" directive for client components

---

## ADR-002: Supabase for Backend (2026-01-24)

**Status:** Accepted

**Context:**
Need robust authentication, PostgreSQL database, real-time capabilities, and object storage.

**Decision:**
Use Supabase as primary backend instead of Firebase or custom Node.js backend.

**Rationale:**
- PostgreSQL (better than NoSQL for relational data)
- Built-in authentication with RLS
- Real-time subscriptions
- Auto-generated TypeScript types
- RESTful API out of the box
- Easier to migrate to self-hosted if needed

**Consequences:**
- Lock-in to Supabase ecosystem
- Need to manage PostgreSQL schema carefully
- RLS policies can be complex
- Some advanced features require direct SQL

---

## ADR-003: shadcn/ui for Component Library (2026-01-24)

**Status:** Accepted

**Context:**
Need consistent UI components without heavy framework overhead.

**Decision:**
Use shadcn/ui instead of Material-UI, Chakra, or Ant Design.

**Rationale:**
- Copy-paste components (full control, no bloat)
- Built on Radix UI primitives (accessibility)
- Tailwind CSS for styling (consistent with project)
- Highly customizable
- No extra bundle size

**Consequences:**
- Need to manage component updates manually
- More initial setup per component
- Less comprehensive than all-in-one libraries

---

## ADR-004: Anthropic Claude for AI Tutor (2026-01-24)

**Status:** Accepted

**Context:**
Need AI model for personalized math tutoring that understands context and generates quality responses.

**Decision:**
Use Anthropic's Claude API as primary AI model for tutoring.

**Rationale:**
- Excellent at educational content
- Strong reasoning capabilities for math
- Good context window size
- Function calling support for future features
- More controllable than GPT-4

**Consequences:**
- API cost considerations
- Need fallback to Gemini for cost management
- Rate limits on free tier
- Need to implement context management

---

## ADR-005: Credit-Based Booking System (2026-01-24)

**Status:** Accepted

**Context:**
Need flexible payment system for tutoring sessions that works for various package sizes and family sharing.

**Decision:**
Implement credit-based system where parents purchase credit packages and spend credits to book sessions.

**Rationale:**
- Flexibility for different session types (1 credit = 30 min, 2 credits = 1 hour)
- Family credit pooling
- Easier to implement discounts and promotions
- Prepaid model reduces payment friction
- Better for cash flow management

**Consequences:**
- Need credit ledger system
- Refund logic is more complex
- Need to prevent credit abuse
- Expiration policies needed

---

## ADR-006: Role-Based Dashboard Architecture (2026-01-24)

**Status:** Accepted

**Context:**
Four distinct user types with different needs: students, parents, tutors, admins.

**Decision:**
Create separate dashboard routes under \`/student\`, \`/parent\`, \`/tutor\`, \`/admin\` instead of a single unified dashboard.

**Rationale:**
- Clear separation of concerns
- Easier to implement role-based access control
- Better user experience (no unnecessary UI clutter)
- Independent feature development per role
- Simpler routing logic

**Consequences:**
- Some code duplication across dashboards
- Need shared components for common functionality
- More complex navigation structure
- Need middleware to enforce role-based routing

---

## ADR-007: Markdown for AI Tutor Responses (2026-01-24)

**Status:** Accepted

**Context:**
AI Tutor needs to display formatted math equations, code snippets, lists, and structured content.

**Decision:**
Use Markdown with react-markdown, KaTeX for math, and remark-gfm for GitHub Flavored Markdown.

**Rationale:**
- Markdown is simple and human-readable
- KaTeX renders LaTeX math beautifully
- Easy for AI to generate consistent formatting
- Compatible with Claude's output format
- Support for tables, lists, code blocks

**Consequences:**
- Additional dependencies (react-markdown, rehype, remark plugins)
- Need sanitization to prevent XSS
- Performance impact of rendering complex equations
- Need custom styling for markdown elements

---

## ADR-008: Row Level Security (RLS) for Data Access (2026-01-24)

**Status:** Accepted

**Context:**
Need to ensure users can only access their own data and authorized shared data.

**Decision:**
Implement Row Level Security policies in PostgreSQL instead of application-level access control.

**Rationale:**
- Security at database level (defense in depth)
- Works across API, direct queries, and Supabase client
- Prevents accidental data leaks
- Automatic filtering of query results
- Standard PostgreSQL feature

**Consequences:**
- Complex policy writing for multi-tenant scenarios
- Performance impact on queries
- Harder to debug (need to understand RLS context)
- Migrations are more complex

---

## Future Decisions

### Under Consideration
- **Real-time Features:** Should we use Supabase Realtime or WebSockets for live sessions?
- **Testing Strategy:** Jest + React Testing Library vs. Vitest?
- **State Management:** Zustand vs. Redux Toolkit vs. Context API?
- **Deployment:** Vercel vs. self-hosted?

### Deferred
- **Mobile Apps:** React Native vs. Flutter vs. Progressive Web App?
- **Internationalization:** Which i18n library?
- **Email Service:** SendGrid vs. Resend vs. Supabase functions?

---

**Note:** Update this file whenever a significant architectural decision is made.
"@

Set-Content -Path "$claudeDir\DECISIONS.md" -Value $decisionsMd -Encoding UTF8
Write-Host "✓ Created DECISIONS.md (architecture decisions)" -ForegroundColor Green

# ============================================================================
# Final Message
# ============================================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Claude Code Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📁 Created Files:" -ForegroundColor Yellow
Write-Host "  • .claude/CLAUDE.md       - Main project documentation" -ForegroundColor White
Write-Host "  • .claude/CURRENT.md      - Active tasks & sprint info" -ForegroundColor White
Write-Host "  • .claude/BACKLOG.md      - Future work & ideas" -ForegroundColor White
Write-Host "  • .claude/PROMPTS.md      - Reusable Claude Code prompts" -ForegroundColor White
Write-Host "  • .claude/HANDOFF.md      - Session notes & handoffs" -ForegroundColor White
Write-Host "  • .claude/DECISIONS.md    - Architecture decisions log" -ForegroundColor White

Write-Host "`n📋 Next Steps:`n" -ForegroundColor Yellow
Write-Host "  1. Open Windows Terminal" -ForegroundColor Green
Write-Host "  2. Navigate to mathpivot directory" -ForegroundColor Green
Write-Host "  3. Run: claude" -ForegroundColor Green
Write-Host "  4. Copy the first prompt from PROMPTS.md" -ForegroundColor Green
Write-Host "  5. Share results back in this chat`n" -ForegroundColor Green

Write-Host "🎯 First Prompt to Use:`n" -ForegroundColor Cyan
Write-Host "---------------------------------------" -ForegroundColor Gray
Write-Host "Read .claude/CLAUDE.md for full project context, then .claude/HANDOFF.md for last session notes." -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Summarize:" -ForegroundColor White
Write-Host "1. Project state (what works, what doesn't)" -ForegroundColor White
Write-Host "2. What was done last session" -ForegroundColor White
Write-Host "3. What should be prioritized this session" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Then run: npm run build" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Report status with any errors found." -ForegroundColor White
Write-Host "---------------------------------------`n" -ForegroundColor Gray

Write-Host "✅ Ready to start working with Claude Code!" -ForegroundColor Green
Write-Host ""
