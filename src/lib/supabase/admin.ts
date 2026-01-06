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

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('Missing Supabase admin credentials - admin operations will fail');
}

export const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceRoleKey || '',
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
