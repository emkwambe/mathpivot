/**
 * Browser-side Supabase client
 * Use this for client components and browser-side operations
 * RLS is enforced based on the authenticated user
 */
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
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
