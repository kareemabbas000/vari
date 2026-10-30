import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase/config';

/** Server client acting as the signed-in panel user (RLS applies). */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component: the middleware refreshes the session instead.
        }
      },
    },
  });
}

export type AppRole = Database['public']['Enums']['app_role'];
const RANK: Record<AppRole, number> = { viewer: 1, editor: 2, admin: 3, owner: 4 };
export const roleAtLeast = (role: AppRole | null | undefined, min: AppRole) => !!role && RANK[role] >= RANK[min];

/** The signed-in team member (verified with Supabase Auth) and their profile, or null. */
export async function currentMember() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase.from('profiles').select('id,email,full_name,role').eq('id', data.user.id).maybeSingle();
  return { user: data.user, profile, supabase };
}
