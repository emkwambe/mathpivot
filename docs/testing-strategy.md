# Testing Strategy — MathPivot TutorOS

## Test Structure

```
tests/
├── unit/              # Pure logic tests (jsdom environment)
│   ├── auth-helpers.test.ts
│   ├── csv-parser.test.ts
│   └── middleware-routing.test.ts
├── integration/       # Server action and flow tests (node environment)
│   ├── api-health.test.ts
│   ├── critical-flows.test.ts    ← NEW: Core business logic validation
│   ├── rls-policies.test.ts
│   └── supabase-connection.test.ts
├── smoke/             # Structural regression checks
│   └── pilot-flows.test.ts
└── e2e/               # Browser-based tests (Playwright)
    ├── auth.spec.ts
    └── lead-capture.spec.ts
```

## How to Run

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Smoke tests
npx jest tests/smoke/

# E2E tests (requires running dev server)
npm run test:e2e
```

## What Is Covered

### Integration Tests (critical-flows.test.ts)
- **Booking validation**: Required fields, cancellation reason, datetime format
- **Session lifecycle**: End session schema, mastery level enum validation
- **Messaging**: Body length limits (1-5000 chars)
- **Auth**: Rate limiting presence, enumeration protection
- **Consent**: Function exports, family action wiring
- **Audit logging**: Wiring verification in booking, session, user actions

### Smoke Tests (pilot-flows.test.ts)
- Schema alignment (correct table names in code vs database)
- Middleware protection (no startsWith('/') bug)
- Auth guard exports on all critical action modules

### Unit Tests
- Auth helper functions (role checking, hierarchy)
- CSV parser logic
- Middleware routing rules

## What Is NOT Covered

- **Live database interactions**: No tests run against real Supabase
- **End-to-end browser flows**: Playwright specs exist but are not regularly run
- **RLS policy behavior**: Verified manually, not automated
- **Email delivery**: Requires RESEND_API_KEY
- **Stripe payment flow**: Requires Stripe test keys
- **Performance/load testing**: Not implemented
- **Mobile rendering**: Manual verification only

## Limitations

1. **No real DB in CI**: Tests validate logic and structure, not database behavior
2. **Server actions can't be imported directly in tests**: We test schemas and file contents
3. **E2E tests require running server**: Must start `npm run dev` first
4. **No snapshot testing**: UI changes are manually verified

## Upgrade Path

1. **Supabase local**: Set up `supabase start` for local testing with real DB
2. **Testcontainers**: Use PostgreSQL containers for integration tests
3. **Playwright in CI**: Add browser testing to GitHub Actions
4. **Visual regression**: Add Chromatic or similar for UI snapshot testing
