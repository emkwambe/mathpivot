/**
 * Validates Supabase environment variables
 * Throws a descriptive error if configuration is missing or uses placeholder values
 */
export function validateSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || url === 'https://your-project-id.supabase.co') {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL. Copy .env.example to .env.local and add your Supabase project URL.'
    );
  }

  if (!anonKey || anonKey.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local and add your Supabase anon key.'
    );
  }

  return { url, anonKey };
}
