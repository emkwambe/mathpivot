import { createClient } from "@supabase/supabase-js";

/**
 * Check whether admin env vars are present (without throwing).
 */
export function isAdminConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Supabase admin client with service_role key.
 * NEVER expose this to the client — server-only.
 * Bypasses RLS — use only for trusted server operations.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Lazy singleton admin client for modules that import `supabaseAdmin` directly.
 */
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createAdminClient>, {
  get(_target, prop, receiver) {
    const client = createAdminClient();
    return Reflect.get(client, prop, receiver);
  },
});
