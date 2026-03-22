/**
 * Server-side Supabase client (with cookie handling)
 * Use this in Server Components, Route Handlers, and Server Actions
 * RLS is enforced based on the authenticated user from cookies
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { validateSupabaseEnv } from './validate-env';

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = validateSupabaseEnv();

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}
