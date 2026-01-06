/**
 * Audit Logging System for MathPivot TutorOS
 * Tracks all sensitive operations for compliance (COPPA, FERPA)
 */

import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase/admin';
import { headers } from 'next/headers';

export type AuditAction =
  // Authentication
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_change'
  | 'password_reset'
  | 'mfa_enabled'
  | 'mfa_disabled'
  // Data access
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'export'
  | 'import'
  // Sensitive actions
  | 'consent_granted'
  | 'consent_revoked'
  | 'permission_changed'
  | 'role_changed'
  // Admin actions
  | 'impersonate_start'
  | 'impersonate_end'
  | 'user_suspended'
  | 'user_activated'
  // Financial
  | 'payment_initiated'
  | 'refund_issued';

export interface AuditLogParams {
  actorUserId: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  description?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  isSensitive?: boolean;
  dataCategories?: string[];
  impersonatorUserId?: string;
}

export interface AuditLogEntry extends AuditLogParams {
  id: string;
  actorRole?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  occurredAt: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(params: AuditLogParams): Promise<string | null> {
  if (!isAdminConfigured()) {
    console.log('[Audit]', params.action, params.resourceType, params.resourceId);
    return null;
  }

  // Get request context
  let ipAddress: string | null = null;
  let userAgent: string | null = null;

  try {
    const headersList = await headers();
    ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] ||
                headersList.get('x-real-ip');
    userAgent = headersList.get('user-agent');
  } catch {
    // Headers not available (not in request context)
  }

  // Get actor role
  let actorRole: string | null = null;
  if (params.actorUserId) {
    const { data: user } = await supabaseAdmin
      .from('users_profile')
      .select('role')
      .eq('id', params.actorUserId)
      .single();
    actorRole = user?.role || null;
  }

  const { data, error } = await supabaseAdmin
    .from('audit_logs')
    .insert({
      actor_user_id: params.actorUserId,
      actor_role: actorRole,
      impersonator_user_id: params.impersonatorUserId || null,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      description: params.description || null,
      old_values: params.oldValues || null,
      new_values: params.newValues || null,
      metadata: params.metadata || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      is_sensitive: params.isSensitive || false,
      data_categories: params.dataCategories || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to log audit event:', error);
    return null;
  }

  return data.id;
}

/**
 * Log a data access event
 */
export async function logDataAccess(
  actorUserId: string,
  resourceType: string,
  resourceId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    actorUserId,
    action: 'view',
    resourceType,
    resourceId,
    metadata,
    isSensitive: ['student', 'users_profile', 'parental_consents'].includes(resourceType),
    dataCategories: resourceType === 'student' ? ['pii', 'educational_record'] : undefined,
  });
}

/**
 * Log a consent event
 */
export async function logConsentEvent(
  parentUserId: string,
  studentUserId: string,
  consentType: string,
  granted: boolean,
  consentId: string
): Promise<void> {
  await logAuditEvent({
    actorUserId: parentUserId,
    action: granted ? 'consent_granted' : 'consent_revoked',
    resourceType: 'parental_consent',
    resourceId: consentId,
    description: `${granted ? 'Granted' : 'Revoked'} ${consentType} consent for student`,
    metadata: {
      student_user_id: studentUserId,
      consent_type: consentType,
    },
    isSensitive: true,
    dataCategories: ['consent', 'pii'],
  });
}

/**
 * Log an authentication event
 */
export async function logAuthEvent(
  userId: string | null,
  action: 'login' | 'logout' | 'login_failed' | 'password_change' | 'password_reset',
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    actorUserId: userId,
    action,
    resourceType: 'auth',
    resourceId: userId || undefined,
    metadata,
  });
}

/**
 * Log admin impersonation
 */
export async function logImpersonation(
  adminUserId: string,
  targetUserId: string,
  action: 'start' | 'end',
  reason: string,
  ticketId?: string
): Promise<void> {
  await logAuditEvent({
    actorUserId: adminUserId,
    action: action === 'start' ? 'impersonate_start' : 'impersonate_end',
    resourceType: 'user',
    resourceId: targetUserId,
    description: `Admin ${action === 'start' ? 'started' : 'ended'} impersonation`,
    metadata: {
      reason,
      ticket_id: ticketId,
    },
    isSensitive: true,
  });
}

/**
 * Query audit logs (admin only)
 */
export async function queryAuditLogs(params: {
  actorUserId?: string;
  resourceType?: string;
  resourceId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<AuditLogEntry[]> {
  if (!isAdminConfigured()) return [];

  let query = supabaseAdmin
    .from('audit_logs')
    .select('*')
    .order('occurred_at', { ascending: false });

  if (params.actorUserId) {
    query = query.eq('actor_user_id', params.actorUserId);
  }
  if (params.resourceType) {
    query = query.eq('resource_type', params.resourceType);
  }
  if (params.resourceId) {
    query = query.eq('resource_id', params.resourceId);
  }
  if (params.action) {
    query = query.eq('action', params.action);
  }
  if (params.startDate) {
    query = query.gte('occurred_at', params.startDate.toISOString());
  }
  if (params.endDate) {
    query = query.lte('occurred_at', params.endDate.toISOString());
  }

  query = query.limit(params.limit || 100);

  if (params.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 100) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to query audit logs:', error);
    return [];
  }

  return (data || []).map((log) => ({
    id: log.id,
    actorUserId: log.actor_user_id,
    actorRole: log.actor_role,
    impersonatorUserId: log.impersonator_user_id,
    action: log.action as AuditAction,
    resourceType: log.resource_type,
    resourceId: log.resource_id,
    description: log.description,
    oldValues: log.old_values,
    newValues: log.new_values,
    metadata: log.metadata,
    ipAddress: log.ip_address,
    userAgent: log.user_agent,
    requestId: log.request_id,
    isSensitive: log.is_sensitive,
    dataCategories: log.data_categories,
    occurredAt: log.occurred_at,
  }));
}

/**
 * Get audit log summary for a resource
 */
export async function getResourceAuditSummary(
  resourceType: string,
  resourceId: string
): Promise<{
  totalEvents: number;
  lastAccessed: string | null;
  lastModified: string | null;
  accessCount: number;
}> {
  if (!isAdminConfigured()) {
    return { totalEvents: 0, lastAccessed: null, lastModified: null, accessCount: 0 };
  }

  const { data: logs } = await supabaseAdmin
    .from('audit_logs')
    .select('action, occurred_at')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .order('occurred_at', { ascending: false });

  if (!logs || logs.length === 0) {
    return { totalEvents: 0, lastAccessed: null, lastModified: null, accessCount: 0 };
  }

  const viewLogs = logs.filter((l) => l.action === 'view');
  const modifyLogs = logs.filter((l) => ['create', 'update', 'delete'].includes(l.action));

  return {
    totalEvents: logs.length,
    lastAccessed: viewLogs[0]?.occurred_at || null,
    lastModified: modifyLogs[0]?.occurred_at || null,
    accessCount: viewLogs.length,
  };
}
