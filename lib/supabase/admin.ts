import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { SUPABASE_URL } from '@/lib/supabase/config';

/**
 * Privileged client (secret key, bypasses RLS) — server only, for operations that need
 * Supabase Auth admin rights: inviting, deleting users, changing roles.
 * Returns null when the key is not configured.
 */
export function supabaseAdmin() {
  const key = serverKey();
  if (!key || serverKeyProblem()) return null;
  return createClient<Database>(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Email that may claim the first Owner account (one-time setup). */
export const OWNER_EMAIL = (process.env.ADMIN_OWNER_EMAIL || 'kareemaitools@gmail.com').toLowerCase();

/** The server key from the environment, tolerating stray quotes or whitespace from pasting. */
export function serverKey() {
  return (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/^["']|["']$/g, '');
}

/** Spot the usual paste mistakes, so the panel can say what is wrong instead of failing later. */
export function serverKeyProblem(): string | null {
  const key = serverKey();
  if (!key) return 'missing';
  if (key.startsWith('sbp_')) return 'personal_token'; // account access token, not a project key
  if (key.startsWith('sb_publishable_')) return 'publishable_key';
  if (!key.startsWith('sb_secret_') && !key.startsWith('eyJ')) return 'unrecognised';
  return null;
}
