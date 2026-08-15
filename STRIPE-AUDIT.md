# Stripe Integration Audit

- Repo: `C:\Users\HP\Documents\mathpivot`
- Runtime detected: **next**
- Generated: 2026-08-14 21:21
- Blocking issues: **2** | Warnings: **4**

| Area | Status | Detail |
|------|--------|--------|
| Inventory | INFO | 488 source files scanned |
| Project | OK | package.json found (name: mathpivot) |
| Runtime | INFO | Next.js detected (next.config.* present) |
| Dependency | OK | stripe (server SDK) ^20.1.0 |
| Dependency | WARN | @stripe/stripe-js not installed (only needed for client-side redirect or Elements) |
| Env | INFO | Env files present: .env.local |
| Env | MISSING | STRIPE_SECRET_KEY declared but empty |
| Env | MISSING | STRIPE_WEBHOOK_SECRET declared but empty |
| Env | WARN | No publishable key found (needed for client-side Stripe.js; not needed for server-only redirect flow) |
| Env | WARN | No *PRICE* env var found - price IDs may be hardcoded |
| Security | OK | No hardcoded secret keys in source |
| Security | OK | .gitignore covers env files |
| Checkout | OK | checkout.sessions.create in .\.agents\skills\stripe-best-practices\SKILL.md, .\.agents\skills\stripe-best-practices\references\billing.md, .\.agents\skills\stripe-best-practices\references\payments.md, .\mathpivot-sprint9\0001-sprint-9-self-serve-subscription-checkout-for-coachi.patch, .\src\lib\stripe\index.ts, .\src\lib\stripe\subscription-checkout.ts |
| Portal | WARN | No billing portal route - users cannot self-manage subscriptions |
| Webhook | OK | Signature verification found in .\src\lib\stripe\index.ts |
| Webhook | OK | Raw body handling present |
| Webhook | OK | stripe-signature header is read |
| Webhook | OK | Node runtime pinned on a route |
| Events | OK | Handles checkout.session.completed |
| Events | OK | Handles customer.subscription.updated |
| Events | OK | Handles customer.subscription.deleted |
| Events | OK | Handles invoice.payment_failed |
| Idempotency | OK | Some idempotency or event-id handling present (verify it dedupes on event.id) |
| Tooling | OK | Stripe CLI at C:\Users\HP\AppData\Local\Microsoft\WinGet\Packages\Stripe.StripeCli_Microsoft.Winget.Source_8wekyb3d8bbwe\stripe.exe |
| Tooling | INFO | Node v22.18.0 |
