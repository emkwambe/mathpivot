# Stripe Pilot Verification Checklist

## Prerequisites
- [ ] Stripe account created at https://dashboard.stripe.com
- [ ] Test mode enabled (toggle at top of dashboard)
- [ ] Get test keys from https://dashboard.stripe.com/test/apikeys

## Environment Variables
Set in Vercel (or .env.local for development):
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Create Test Products
In Stripe Dashboard → Products:
1. Create "Starter Pack" — $49, one-time
2. Create "Standard Pack" — $99, one-time
3. Note the Price IDs (price_...) for each product

In Supabase SQL Editor:
```sql
INSERT INTO products (name, description, product_type, credits, price_cents, is_active, stripe_price_id)
VALUES 
  ('Starter Pack', '4 tutoring credits', 'package', 4, 4900, true, 'price_YOUR_STARTER_ID'),
  ('Standard Pack', '10 tutoring credits', 'package', 10, 9900, true, 'price_YOUR_STANDARD_ID');
```

## Webhook Setup
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. URL: `https://your-production-url.vercel.app/api/stripe/webhook`
4. Events to listen for:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret → Set as `STRIPE_WEBHOOK_SECRET`

## Manual Test Flow
1. Login as Demo Parent
2. Go to Credits → Purchase
3. Click "Buy Now" on a package
4. Should redirect to Stripe Checkout (test mode)
5. Use test card: `4242 4242 4242 4242`, any future expiry, any CVC
6. Complete payment
7. Should redirect to success page
8. Verify: Credits increased on parent dashboard
9. Verify: credit_ledger has new entry
10. Verify: purchases table has completed record

## Verification Queries
```sql
-- Check purchase was recorded
SELECT * FROM purchases ORDER BY created_at DESC LIMIT 5;

-- Check credits were added
SELECT * FROM credit_ledger ORDER BY created_at DESC LIMIT 5;

-- Check webhook was received
SELECT * FROM stripe_webhook_events ORDER BY created_at DESC LIMIT 5;
```

## Common Issues
- **"Stripe is not configured"**: STRIPE_SECRET_KEY not set in environment
- **Webhook signature fails**: STRIPE_WEBHOOK_SECRET doesn't match dashboard
- **Credits not added**: Webhook endpoint not receiving events (check Stripe dashboard → Webhooks → Events)
- **Redirect fails after payment**: NEXT_PUBLIC_APP_URL must match actual production URL

## Test Cards
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Requires auth: `4000 0025 0000 3155`
- Insufficient funds: `4000 0000 0000 9995`
