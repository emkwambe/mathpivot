/**
 * Admin Supabase client (service role)
 * ONLY use this on the server for operations that need to bypass RLS:
 * - Inserting events
 * - Processing notifications
 * - Handling webhooks
 * - Admin cross-tenant operations
 *
 * NEVER expose this client to the browser or import it in client components
 */
import { createClient } from '@supabase/supabase-js';

// Ensure this is only used server-side
if (typeof window !== 'undefined') {
  throw new Error('supabase/admin.ts should only be imported server-side');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const hasCredentials = Boolean(supabaseUrl && supabaseServiceRoleKey);

if (!hasCredentials) {
  console.warn('Missing Supabase admin credentials - admin operations will fail');
}

// Create admin client - use placeholder values during build if not configured
// The actual client will only work at runtime with proper env vars
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceRoleKey || 'placeholder-key-for-build-only',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Helper to check if admin client is configured
export function isAdminConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}
