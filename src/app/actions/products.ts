'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { emitEvent } from '@/lib/events';
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['package', 'subscription']),
  priceCents: z.coerce.number().min(0),
  credits: z.coerce.number().min(0),
  billingPeriod: z.enum(['monthly', 'yearly']).optional(),
  stripePriceId: z.string().optional(),
});

const purchaseSchema = z.object({
  productId: z.string().uuid(),
  familyId: z.string().uuid(),
});

export type ProductActionResult = {
  success: boolean;
  error?: string;
  productId?: string;
};

export type PurchaseActionResult = {
  success: boolean;
  error?: string;
  purchaseId?: string;
};

// Admin: Create product
export async function createProduct(
  formData: FormData
): Promise<ProductActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return { success: false, error: 'Admin access required' };
  }

  const rawData = {
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    type: formData.get('type'),
    priceCents: formData.get('priceCents'),
    credits: formData.get('credits'),
    billingPeriod: formData.get('billingPeriod') || undefined,
    stripePriceId: formData.get('stripePriceId') || undefined,
  };

  const result = createProductSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { name, description, type, priceCents, credits, billingPeriod, stripePriceId } = result.data;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .insert({
      name,
      description: description || null,
      type,
      price_cents: priceCents,
      credits,
      billing_period: type === 'subscription' ? (billingPeriod || 'monthly') : null,
      stripe_price_id: stripePriceId || null,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Product error:', error);
    return { success: false, error: 'Failed to create product' };
  }

  revalidatePath('/admin/products');

  return { success: true, productId: data.id };
}

// Admin: Update product
export async function updateProduct(
  formData: FormData
): Promise<ProductActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return { success: false, error: 'Admin access required' };
  }

  const productId = formData.get('productId') as string;
  if (!productId) {
    return { success: false, error: 'Product ID required' };
  }

  const rawData = {
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    type: formData.get('type'),
    priceCents: formData.get('priceCents'),
    credits: formData.get('credits'),
    billingPeriod: formData.get('billingPeriod') || undefined,
    stripePriceId: formData.get('stripePriceId') || undefined,
  };

  const result = createProductSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { name, description, type, priceCents, credits, billingPeriod, stripePriceId } = result.data;

  const supabase = await createClient();

  const { error } = await supabase
    .from('products')
    .update({
      name,
      description: description || null,
      type,
      price_cents: priceCents,
      credits,
      billing_period: type === 'subscription' ? (billingPeriod || 'monthly') : null,
      stripe_price_id: stripePriceId || null,
    })
    .eq('id', productId);

  if (error) {
    return { success: false, error: 'Failed to update product' };
  }

  revalidatePath('/admin/products');

  return { success: true, productId };
}

// Admin: Toggle product active
export async function toggleProductActive(
  productId: string,
  isActive: boolean
): Promise<ProductActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return { success: false, error: 'Admin access required' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', productId);

  if (error) {
    return { success: false, error: 'Failed to update product' };
  }

  revalidatePath('/admin/products');

  return { success: true };
}

// Parent: Purchase credits (simplified - actual payment would go through Stripe webhook)
export async function recordPurchase(
  formData: FormData
): Promise<PurchaseActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const rawData = {
    productId: formData.get('productId'),
    familyId: formData.get('familyId'),
  };

  const result = purchaseSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { productId, familyId } = result.data;

  const supabase = await createClient();

  // Verify user belongs to this family
  const { data: familyMember } = await supabase
    .from('family_members')
    .select('role')
    .eq('family_id', familyId)
    .eq('user_id', user.id)
    .single();

  if (!familyMember) {
    return { success: false, error: 'You cannot purchase for this family' };
  }

  // Get product
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('is_active', true)
    .single();

  if (!product) {
    return { success: false, error: 'Product not found' };
  }

  // Create purchase record (in real app, this would be created by Stripe webhook)
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert({
      family_id: familyId,
      user_id: user.id,
      product_id: productId,
      amount_cents: product.price_cents,
      credits_added: product.credits,
      status: 'completed',
      paid_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (purchaseError) {
    console.error('Purchase error:', purchaseError);
    return { success: false, error: 'Failed to record purchase' };
  }

  // Add credits to family
  const { data: family } = await supabase
    .from('families')
    .select('credit_balance')
    .eq('id', familyId)
    .single();

  await supabase
    .from('families')
    .update({
      credit_balance: (family?.credit_balance || 0) + product.credits,
    })
    .eq('id', familyId);

  // Emit event
  await emitEvent({
    type: 'payment.succeeded.v1',
    actorUserId: user.id,
    subjectType: 'purchase',
    subjectId: purchase.id,
    data: {
      purchase_id: purchase.id,
      family_id: familyId,
      product_id: productId,
      credits_added: product.credits,
      amount_cents: product.price_cents,
    },
  });

  revalidatePath('/parent');

  return { success: true, purchaseId: purchase.id };
}

// Get purchase history for a family
export async function getPurchaseHistory(familyId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { purchases: [], error: 'Not authenticated' };
  }

  const supabase = await createClient();

  // Verify access
  const { data: familyMember } = await supabase
    .from('family_members')
    .select('role')
    .eq('family_id', familyId)
    .eq('user_id', user.id)
    .single();

  if (!familyMember && user.role !== 'admin') {
    return { purchases: [], error: 'Access denied' };
  }

  const { data: purchases, error } = await supabase
    .from('purchases')
    .select(`
      *,
      product:products(name, type)
    `)
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });

  if (error) {
    return { purchases: [], error: 'Failed to fetch purchases' };
  }

  return { purchases: purchases || [] };
}
