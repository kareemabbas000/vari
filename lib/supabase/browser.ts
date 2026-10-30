'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase/config';

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/** Browser client for the control panel (session in cookies; every write checked by RLS). */
export function supabaseBrowser() {
  if (!client) client = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  return client;
}
