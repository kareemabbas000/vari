'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Button, Field, Input } from '@/components/admin/ui';

type Setup = { needsSetup: boolean; ownerHint?: string; configured: boolean; problem?: string | null };

/** What to tell the site owner when the server key in Vercel cannot be used. */
const KEY_PROBLEMS: Record<string, string> = {
  missing: 'SUPABASE_SECRET_KEY is not set in Vercel. Add the project’s secret key and redeploy.',
  personal_token:
    'SUPABASE_SECRET_KEY in Vercel holds a personal access token (sbp_…), not the project key. Replace it with the secret key from Supabase → Project Settings → API Keys (it starts with sb_secret_) and redeploy.',
  publishable_key:
    'SUPABASE_SECRET_KEY in Vercel holds the publishable key. Replace it with the secret key from Supabase → Project Settings → API Keys (it starts with sb_secret_) and redeploy.',
  unrecognised: 'SUPABASE_SECRET_KEY in Vercel is not a Supabase project key. Use the secret key (sb_secret_…) from Project Settings → API Keys and redeploy.',
  rejected: 'Supabase rejected SUPABASE_SECRET_KEY. It may belong to another project or have been revoked — copy the current secret key from Project Settings → API Keys and redeploy.',
  unreachable: 'The database could not be reached. Please try again in a minute.',
};

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [setup, setSetup] = useState<Setup | null>(null);
  const [setupState, setSetupState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [setupError, setSetupError] = useState('');

  useEffect(() => {
    fetch('/api/admin/bootstrap')
      .then((r) => r.json())
      .then(setSetup)
      .catch(() => setSetup(null));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error: err } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password });
    if (err) {
      setError(err.message.includes('Invalid login') ? 'Email or password is incorrect.' : err.message);
      setBusy(false);
      return;
    }
    router.replace(next.startsWith('/admin') ? next : '/admin');
    router.refresh();
  }

  async function sendSetup() {
    setSetupState('sending');
    const res = await fetch('/api/admin/bootstrap', { method: 'POST' }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { error?: string; detail?: string } | null;
    if (res?.ok) return setSetupState('sent');
    setSetupError(
      (body?.error && KEY_PROBLEMS[body.error]) ||
        (body?.error === 'already_set_up' ? 'An owner account already exists — sign in below.' : '') ||
        `Could not send the invitation${body?.detail ? ` (${body.detail})` : ''}. Please try again.`,
    );
    setSetupState('error');
  }

  return (
    <div className="space-y-6">
      {setup?.needsSetup && (
        <div className="rounded-sm border border-gold/30 bg-gold/5 p-4 text-sm leading-relaxed">
          <p className="font-medium text-gold">First-time setup</p>
          {setupState === 'sent' ? (
            <p className="mt-1 text-bone/75">Invitation sent to {setup.ownerHint}. Open the email and choose your password.</p>
          ) : !setup.configured ? (
            <p className="mt-1 text-[#E8A598]">{KEY_PROBLEMS[setup.problem || 'missing'] || KEY_PROBLEMS.missing}</p>
          ) : (
            <>
              <p className="mt-1 text-bone/65">No owner account exists yet. Send the owner invitation to {setup.ownerHint}.</p>
              <Button className="mt-3" size="sm" onClick={sendSetup} busy={setupState === 'sending'}>
                Send owner invitation
              </Button>
              {setupState === 'error' && <p className="mt-2 text-[#E8A598]">{setupError}</p>}
            </>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-[#E8A598]">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" busy={busy} disabled={!email || !password}>
          Sign in
        </Button>
      </form>
      <div className="flex items-center justify-between text-sm">
        <Link href="/admin/forgot" className="text-bone/60 underline-offset-4 hover:text-gold hover:underline">
          Forgot password?
        </Link>
        <Link href="/" className="text-bone/40 hover:text-bone">
          ← Website
        </Link>
      </div>
    </div>
  );
}
