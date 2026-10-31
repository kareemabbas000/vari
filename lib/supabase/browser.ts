'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase/config';

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export const NOTHING_CHANGED = 'Nothing was changed — you may not have permission for this, or your session has expired. Please sign in again.';

/**
 * Row Level Security answers a blocked update or delete with success and zero rows, which
 * would look like it worked. Every write aimed at one record (filtered by `id=eq.…`)
 * therefore asks for the changed rows back and turns "zero rows" into a clear error.
 * Bulk writes (e.g. clearing a gallery by project_id) may legitimately touch no rows.
 */
const guardedFetch: typeof fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
  const single = (method === 'PATCH' || method === 'DELETE') && url.pathname.startsWith('/rest/v1/') && url.searchParams.get('id')?.startsWith('eq.');
  if (!single) return fetch(input, init);

  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  const prefer = (headers.get('Prefer') || '').split(',').map((s) => s.trim()).filter((s) => s && !s.startsWith('return='));
  headers.set('Prefer', [...prefer, 'return=representation'].join(','));
  const res = await fetch(input, { ...init, headers });
  if (!res.ok) return res;
  const rows = await res.clone().json().catch(() => null);
  const count = Array.isArray(rows) ? rows.length : rows ? 1 : 0;
  if (count > 0) return res;
  return new Response(JSON.stringify({ code: 'NO_ROWS', message: NOTHING_CHANGED, details: null, hint: null }), { status: 403, headers: { 'Content-Type': 'application/json' } });
};

/** Browser client for the control panel (session in cookies; every write checked by RLS). */
export function supabaseBrowser() {
  if (!client) client = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { global: { fetch: guardedFetch } });
  return client;
}
