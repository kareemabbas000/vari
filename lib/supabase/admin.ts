import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { SUPABASE_URL } from '@/lib/supabase/config';

/**
 * Privileged client (secret key, bypasses RLS) — server only, for operations that need
 * Supabase Auth admin rights: inviting, deleting users, changing roles.
 * Returns null when the key is not configured.
 */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient<Database>(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Email that may claim the first Owner account (one-time setup). */
export const OWNER_EMAIL = (process.env.ADMIN_OWNER_EMAIL || 'kareemaitools@gmail.com').toLowerCase();
