import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { createCheckoutSession, isStripeConfigured } from '@/lib/stripe';
import { emitEvent } from '@/lib/events';

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 503 }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { productId, familyId } = body;

  if (!productId || !familyId) {
    return NextResponse.json(
      { error: 'Missing productId or familyId' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Verify user belongs to this family
  const { data: familyMember } = await supabase
    .from('family_members')
    .select('role')
    .eq('family_id', familyId)
    .eq('user_id', user.id)
    .single();

  if (!familyMember && user.role !== 'admin') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Get product with Stripe price ID
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('is_active', true)
    .single();

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  if (!product.stripe_price_id) {
    return NextResponse.json(
      { error: 'Product not configured for Stripe' },
      { status: 400 }
    );
  }

  // Create pending purchase record
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert({
      family_id: familyId,
      user_id: user.id,
      product_id: productId,
      amount_cents: product.price_cents,
      credits_added: product.credits,
      status: 'pending',
    })
    .select('id')
    .single();

  if (purchaseError) {
    console.error('Failed to create purchase:', purchaseError);
    return NextResponse.json(
      { error: 'Failed to create purchase' },
      { status: 500 }
    );
  }

  // Emit purchase initiated event
  await emitEvent({
    type: 'payment.purchase_initiated.v1',
    actorUserId: user.id,
    subjectType: 'purchase',
    subjectId: purchase.id,
    data: {
      purchase_id: purchase.id,
      family_id: familyId,
      product_id: productId,
      amount_cents: product.price_cents,
    },
  });

  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL;

  // Create Stripe checkout session
  const session = await createCheckoutSession({
    productId,
    familyId,
    userId: user.id,
    priceId: product.stripe_price_id,
    successUrl: `${origin}/parent/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/parent/purchase/cancel`,
  });

  if (!session) {
    // Rollback purchase
    await supabase.from('purchases').delete().eq('id', purchase.id);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }

  // Update purchase with Stripe session ID
  await supabase
    .from('purchases')
    .update({ stripe_checkout_session_id: session.sessionId })
    .eq('id', purchase.id);

  return NextResponse.json({
    sessionId: session.sessionId,
    url: session.url,
  });
}
