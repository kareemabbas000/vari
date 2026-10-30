'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import type { EmailOtpType } from '@supabase/supabase-js';
import AuthCard from '@/components/admin/AuthCard';
import { Button, Field, Input } from '@/components/admin/ui';
import { supabaseBrowser } from '@/lib/supabase/browser';

/**
 * Landing page for invitation and password-reset links. Accepts every link format
 * Supabase produces (token_hash, PKCE code, or tokens in the URL fragment), then lets the
 * person choose a password.
 */
export default function AcceptPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'checking' | 'ready' | 'invalid'>('checking');
  const [problem, setProblem] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = supabaseBrowser();
    (async () => {
      const q = new URLSearchParams(window.location.search);
      const h = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const failure = h.get('error_description') || q.get('error_description');
      if (failure) {
        setProblem(failure.replace(/\+/g, ' '));
        return setPhase('invalid');
      }
      let err: { message: string } | null = null;
      if (q.get('token_hash') && q.get('type')) {
        ({ error: err } = await supabase.auth.verifyOtp({ token_hash: q.get('token_hash')!, type: q.get('type') as EmailOtpType }));
      } else if (q.get('code')) {
        ({ error: err } = await supabase.auth.exchangeCodeForSession(q.get('code')!));
      } else if (h.get('access_token') && h.get('refresh_token')) {
        ({ error: err } = await supabase.auth.setSession({ access_token: h.get('access_token')!, refresh_token: h.get('refresh_token')! }));
      }
      // Clean the URL so tokens never linger in history.
      window.history.replaceState(null, '', '/admin/accept');
      const { data } = await supabase.auth.getUser();
      if (err || !data.user) {
        setProblem(err?.message || 'This link is invalid or has expired.');
        return setPhase('invalid');
      }
      setEmail(data.user.email || '');
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', data.user.id).maybeSingle();
      setName(profile?.full_name || '');
      setPhase('ready');
    })();
  }, []);

  const weak = password.length > 0 && password.length < 10;
  const mismatch = confirm.length > 0 && confirm !== password;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 10 || password !== confirm) return;
    setBusy(true);
    setError('');
    const supabase = supabaseBrowser();
    const { data, error: err } = await supabase.auth.updateUser({ password });
    if (err || !data.user) {
      setError(err?.message || 'Could not save the password.');
      setBusy(false);
      return;
    }
    if (name.trim()) await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', data.user.id);
    router.replace('/admin');
    router.refresh();
  }

  if (phase === 'checking') {
    return (
      <AuthCard title="One moment…" subtitle="Verifying your link.">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border border-gold border-t-transparent" />
      </AuthCard>
    );
  }

  if (phase === 'invalid') {
    return (
      <AuthCard title="Link expired" subtitle={problem}>
        <p className="text-sm leading-relaxed text-bone/65">Ask an admin to resend your invitation, or request a new password-reset link.</p>
        <div className="mt-5 flex gap-4 text-sm">
          <Link href="/admin/forgot" className="text-gold hover:underline">
            New reset link
          </Link>
          <Link href="/admin/login" className="text-bone/50 hover:text-bone">
            Sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose your password" subtitle={email ? `Signed in as ${email}` : undefined}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Your name" htmlFor="name" hint="Shown to your team in the activity log.">
          <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        </Field>
        <Field label="New password" htmlFor="password" error={weak ? 'Use at least 10 characters.' : undefined} hint="At least 10 characters. A phrase of a few words works well.">
          <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Repeat password" htmlFor="confirm" error={mismatch ? 'The passwords do not match.' : undefined}>
          <Input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-[#E8A598]">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" busy={busy} disabled={password.length < 10 || password !== confirm}>
          Save and continue
        </Button>
      </form>
    </AuthCard>
  );
}
