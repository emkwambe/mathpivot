/**
 * Higher-Order Function for Automatic Audit Logging
 * Wraps server actions with automatic audit trail
 */

import { logAuditEvent, AuditAction } from '@/lib/audit';
import { getCurrentUser } from '@/lib/auth';

type AuditableAction<T extends unknown[], R> = (...args: T) => Promise<R>;

interface WithAuditOptions {
  action: AuditAction;
  resourceType: string;
  getResourceId?: (...args: unknown[]) => string | undefined;
  getDescription?: (...args: unknown[]) => string;
  isSensitive?: boolean;
  dataCategories?: string[];
  logOnError?: boolean;
}

/**
 * Wrap a server action with automatic audit logging
 *
 * @example
 * const updateStudentProfile = withAudit(
 *   async (studentId: string, data: UpdateData) => {
 *     // ... update logic
 *   },
 *   {
 *     action: 'update',
 *     resourceType: 'student',
 *     getResourceId: (studentId) => studentId,
 *     isSensitive: true,
 *   }
 * );
 */
export function withAudit<T extends unknown[], R>(
  fn: AuditableAction<T, R>,
  options: WithAuditOptions
): AuditableAction<T, R> {
  return async (...args: T): Promise<R> => {
    const user = await getCurrentUser();
    const startTime = Date.now();
    let result: R;
    let error: Error | null = null;

    try {
      result = await fn(...args);
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e));
      if (options.logOnError !== false) {
        await logAuditEvent({
          actorUserId: user?.id || null,
          action: options.action,
          resourceType: options.resourceType,
          resourceId: options.getResourceId?.(...args),
          description: options.getDescription?.(...args) || `Failed: ${error.message}`,
          metadata: {
            error: error.message,
            duration_ms: Date.now() - startTime,
            args_summary: args.map(a => typeof a).join(', '),
          },
          isSensitive: options.isSensitive,
          dataCategories: options.dataCategories,
        });
      }
      throw error;
    }

    // Log successful action
    await logAuditEvent({
      actorUserId: user?.id || null,
      action: options.action,
      resourceType: options.resourceType,
      resourceId: options.getResourceId?.(...args),
      description: options.getDescription?.(...args),
      metadata: {
        duration_ms: Date.now() - startTime,
        success: true,
      },
      isSensitive: options.isSensitive,
      dataCategories: options.dataCategories,
    });

    return result;
  };
}

/**
 * Create an audited data mutation
 * Automatically captures old/new values for comparison
 */
export function withAuditedMutation<T extends Record<string, unknown>>(
  fn: (id: string, data: Partial<T>, oldData: T) => Promise<T>,
  options: Omit<WithAuditOptions, 'action'> & { action?: AuditAction }
): (id: string, data: Partial<T>, oldData: T) => Promise<T> {
  return async (id: string, data: Partial<T>, oldData: T): Promise<T> => {
    const user = await getCurrentUser();
    const result = await fn(id, data, oldData);

    // Calculate changed fields
    const changedFields: string[] = [];
    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    for (const key of Object.keys(data)) {
      if (oldData[key] !== data[key]) {
        changedFields.push(key);
        oldValues[key] = oldData[key];
        newValues[key] = data[key];
      }
    }

    if (changedFields.length > 0) {
      await logAuditEvent({
        actorUserId: user?.id || null,
        action: options.action || 'update',
        resourceType: options.resourceType,
        resourceId: id,
        description: `Updated fields: ${changedFields.join(', ')}`,
        oldValues,
        newValues,
        isSensitive: options.isSensitive,
        dataCategories: options.dataCategories,
      });
    }

    return result;
  };
}

/**
 * Permission change auditor
 * Use when modifying user roles or permissions
 */
export async function auditPermissionChange(
  targetUserId: string,
  changeType: 'role_changed' | 'permission_changed',
  oldPermissions: Record<string, unknown>,
  newPermissions: Record<string, unknown>,
  reason?: string
): Promise<void> {
  const user = await getCurrentUser();

  await logAuditEvent({
    actorUserId: user?.id || null,
    action: changeType,
    resourceType: 'user_permissions',
    resourceId: targetUserId,
    description: reason || `${changeType.replace('_', ' ')} for user`,
    oldValues: oldPermissions,
    newValues: newPermissions,
    isSensitive: true,
    dataCategories: ['access_control'],
  });
}

/**
 * Bulk action auditor
 * Use when performing operations on multiple resources
 */
export async function auditBulkAction(
  action: AuditAction,
  resourceType: string,
  resourceIds: string[],
  description: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const user = await getCurrentUser();

  await logAuditEvent({
    actorUserId: user?.id || null,
    action,
    resourceType,
    description: `Bulk ${action}: ${description}`,
    metadata: {
      ...metadata,
      resource_ids: resourceIds,
      affected_count: resourceIds.length,
    },
    isSensitive: resourceIds.length > 10, // Flag large bulk operations
  });
}
