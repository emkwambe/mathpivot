'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type InvoiceResult = {
  success: boolean;
  error?: string;
  invoiceId?: string;
};

// ============================================================
// GET INVOICES (admin: all, parent: own family)
// ============================================================
export async function getInvoices(familyId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('invoices')
    .select(`
      *,
      family:family_id (name),
      parent:parent_user_id (full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (familyId) {
    query = query.eq('family_id', familyId);
  }

  const { data, error } = await query;
  if (error) return { invoices: [], error: error.message };
  return { invoices: data || [], error: null };
}

// ============================================================
// GET INVOICE DETAIL
// ============================================================
export async function getInvoiceDetail(invoiceId: string) {
  const supabase = await createClient();

  const [invoiceResult, itemsResult] = await Promise.all([
    supabase
      .from('invoices')
      .select(`
        *,
        family:family_id (name),
        parent:parent_user_id (full_name, email)
      `)
      .eq('id', invoiceId)
      .single(),
    supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true }),
  ]);

  return {
    invoice: invoiceResult.data,
    lineItems: itemsResult.data || [],
    error: invoiceResult.error?.message || itemsResult.error?.message || null,
  };
}

// ============================================================
// GET PARENT'S INVOICES
// ============================================================
export async function getMyInvoices() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { invoices: [], error: 'Not authenticated' };

  // Get family IDs for this parent
  const { data: memberships } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .eq('member_role', 'parent');

  const familyIds = (memberships || []).map(m => m.family_id);
  if (familyIds.length === 0) return { invoices: [], error: null };

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      family:family_id (name)
    `)
    .in('family_id', familyIds)
    .in('status', ['sent', 'paid', 'overdue'])
    .order('created_at', { ascending: false });

  if (error) return { invoices: [], error: error.message };
  return { invoices: data || [], error: null };
}

// ============================================================
// CREATE INVOICE FOR A FAMILY (admin)
// ============================================================
export async function createInvoiceForFamily(
  familyId: string,
  parentUserId: string,
  lineItems: { description: string; quantity: number; unitPriceCents: number; lineType: string }[],
  options?: { dueDate?: string; notes?: string }
): Promise<InvoiceResult> {
  const admin = createAdminClient();

  // Generate invoice number
  const { data: invNumber, error: numError } = await admin.rpc('generate_invoice_number');
  if (numError) return { success: false, error: 'Failed to generate invoice number' };

  const subtotalCents = lineItems.reduce((sum, li) => sum + (li.unitPriceCents * li.quantity), 0);
  const totalCents = subtotalCents; // no tax for now

  // Create invoice
  const { data: invoice, error: invError } = await admin
    .from('invoices')
    .insert({
      invoice_number: invNumber,
      family_id: familyId,
      parent_user_id: parentUserId,
      status: 'draft',
      subtotal_cents: subtotalCents,
      total_cents: totalCents,
      due_date: options?.dueDate || null,
      notes: options?.notes || null,
    })
    .select('id')
    .single();

  if (invError || !invoice) return { success: false, error: invError?.message || 'Failed to create invoice' };

  // Create line items
  const items = lineItems.map(li => ({
    invoice_id: invoice.id,
    description: li.description,
    quantity: li.quantity,
    unit_price_cents: li.unitPriceCents,
    amount_cents: li.unitPriceCents * li.quantity,
    line_type: li.lineType,
  }));

  const { error: itemsError } = await admin
    .from('invoice_line_items')
    .insert(items);

  if (itemsError) return { success: false, error: itemsError.message };

  revalidatePath('/admin/invoices');
  return { success: true, invoiceId: invoice.id };
}

// ============================================================
// GENERATE SESSION INVOICE (admin)
// Creates an invoice from unbilled completed sessions for a family
// ============================================================
export async function generateSessionInvoice(
  familyId: string,
  dateFrom: string,
  dateTo: string
): Promise<InvoiceResult> {
  const admin = createAdminClient();

  // Get family info
  const { data: family } = await admin
    .from('families')
    .select('id, name, primary_parent_user_id')
    .eq('id', familyId)
    .single();

  if (!family) return { success: false, error: 'Family not found' };

  // Get completed sessions in date range for this family
  const { data: sessions } = await admin
    .from('sessions')
    .select(`
      id,
      completed_at,
      booking:booking_id (
        id,
        student_user_id,
        tutor_user_id,
        start_at,
        end_at,
        family_id
      )
    `)
    .eq('status', 'completed')
    .gte('completed_at', dateFrom)
    .lte('completed_at', dateTo) as { data: unknown[] | null };

  // Filter to this family's sessions
  const familySessions = (sessions || []).filter(
    (s: unknown) => s.booking?.family_id === familyId
  );

  if (familySessions.length === 0) return { success: false, error: 'No billable sessions found' };

  // Get tutor names and student names for descriptions
  const userIds = new Set<string>();
  for (const s of familySessions) {
    if (s.booking?.tutor_user_id) userIds.add(s.booking.tutor_user_id);
    if (s.booking?.student_user_id) userIds.add(s.booking.student_user_id);
  }

  const { data: profiles } = await admin
    .from('users_profile')
    .select('id, full_name')
    .in('id', [...userIds]);

  const nameMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

  // Build line items from sessions
  const lineItems: { description: string; quantity: number; unitPriceCents: number; lineType: string }[] = familySessions.map((s: unknown) => {
    const hours = (new Date(s.booking.end_at).getTime() - new Date(s.booking.start_at).getTime()) / 3600000;
    const tutorName = nameMap.get(s.booking.tutor_user_id) || 'Tutor';
    const studentName = nameMap.get(s.booking.student_user_id) || 'Student';
    const date = new Date(s.booking.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return {
      description: `${date} — ${studentName} with ${tutorName} (${hours}h)`,
      quantity: 1,
      unitPriceCents: 0, // Sessions use credits, show $0 for credit-based
      lineType: 'session' as const,
    };
  });

  // Also get any applied fees for this family in date range
  const { data: fees } = await admin
    .from('applied_fees')
    .select('*')
    .eq('family_id', familyId)
    .eq('waived', false)
    .is('invoice_id', null)
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo);

  for (const fee of fees || []) {
    lineItems.push({
      description: `Fee: ${fee.reason || fee.fee_type}`,
      quantity: 1,
      unitPriceCents: fee.amount_cents,
      lineType: 'fee' as const,
    });
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  return createInvoiceForFamily(
    familyId,
    family.primary_parent_user_id,
    lineItems,
    { dueDate: dueDate.toISOString().split('T')[0] }
  );
}

// ============================================================
// SEND INVOICE (admin — changes status to sent)
// ============================================================
export async function sendInvoice(invoiceId: string): Promise<InvoiceResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'sent',
      issued_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .eq('status', 'draft');

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/invoices');
  revalidatePath('/parent/invoices');
  return { success: true, invoiceId };
}

// ============================================================
// MARK INVOICE PAID (admin)
// ============================================================
export async function markInvoicePaid(invoiceId: string): Promise<InvoiceResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .in('status', ['sent', 'overdue']);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/invoices');
  revalidatePath('/parent/invoices');
  return { success: true, invoiceId };
}

// ============================================================
// VOID INVOICE (admin)
// ============================================================
export async function voidInvoice(invoiceId: string): Promise<InvoiceResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'void',
      voided_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .neq('status', 'void');

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/invoices');
  return { success: true, invoiceId };
}


