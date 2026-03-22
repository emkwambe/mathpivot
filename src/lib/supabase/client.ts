/**
 * Browser-side Supabase client
 * Use this for client components and browser-side operations
 * RLS is enforced based on the authenticated user
 */
import { createBrowserClient } from '@supabase/ssr';
import { validateSupabaseEnv } from './validate-env';

export function createClient() {
  const { url, anonKey } = validateSupabaseEnv();
  return createBrowserClient(url, anonKey);
}

// Singleton for client-side use
let browserClient: ReturnType<typeof createClient> | null = null;

export function getClient() {
  if (typeof window === 'undefined') {
    throw new Error('getClient() should only be called in browser context');
  }
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}
