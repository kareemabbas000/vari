/**
 * Server-side access to the VARI Supabase project (never import from client components).
 *
 * The browser has no database access at all: tables have Row Level Security with no
 * policies, and the form functions are executable by service_role only. API routes call
 * those functions through PostgREST with the secret key from the environment.
 *
 *   SUPABASE_URL                     project URL (defaults to the VARI project)
 *   SUPABASE_SECRET_KEY              new-style secret key (sb_secret_…), or
 *   SUPABASE_SERVICE_ROLE_KEY        legacy service_role JWT
 */
import { serverKey, serverKeyProblem } from '@/lib/supabase/admin';

const DEFAULT_URL = 'https://wdejuqvggvayxtrvkqye.supabase.co';

function config() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL).replace(/\/$/, '');
  const key = serverKeyProblem() ? '' : serverKey();
  return { url, key };
}

export function isDatabaseConfigured() {
  return !!config().key;
}

export type RpcResult<T> = { ok: true; data: T } | { ok: false; code: 'not_configured' | 'invalid_email' | 'rate_limited' | 'error'; message?: string };

/** Call a Postgres function. Never throws; errors come back as a typed result. */
export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<RpcResult<T>> {
  const { url, key } = config();
  if (!key) return { ok: false, code: 'not_configured' };

  const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json' };
  // Legacy keys are JWTs and go in Authorization too; new sb_secret_ keys use apikey alone.
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;

  try {
    const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(args),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    const body = await res.json().catch(() => null);
    if (res.ok) return { ok: true, data: body as T };
    const message = String(body?.message || res.statusText);
    if (message.includes('rate_limited')) return { ok: false, code: 'rate_limited' };
    if (message.includes('invalid_email')) return { ok: false, code: 'invalid_email' };
    console.error(`[supabase] ${fn} failed`, res.status, message);
    return { ok: false, code: 'error', message };
  } catch (err) {
    console.error(`[supabase] ${fn} unreachable`, err);
    return { ok: false, code: 'error', message: String(err) };
  }
}
