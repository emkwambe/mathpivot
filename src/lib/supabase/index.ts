// Re-export all Supabase utilities
export { createClient as createBrowserClient, getClient } from './client';
export { createClient as createServerClient } from './server';
export { supabaseAdmin, isAdminConfigured } from './admin';
export { updateSession } from './middleware';
