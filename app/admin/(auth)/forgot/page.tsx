'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import AuthCard from '@/components/admin/AuthCard';
import { Button, Field, Input } from '@/components/admin/ui';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState('sending');
    await fetch('/api/admin/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    }).catch(() => null);
    // Same answer whether or not the address exists (no account enumeration).
    setState('sent');
  }

  return (
    <AuthCard title="Reset your password" subtitle="We'll email you a secure link to choose a new password.">
      {state === 'sent' ? (
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-bone/75">If {email} belongs to a team member, a reset link is on its way. It is valid for one hour.</p>
          <Link href="/admin/login" className="text-sm text-gold hover:underline">
            ← Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full" busy={state === 'sending'} disabled={!email}>
            Send reset link
          </Button>
          <Link href="/admin/login" className="block text-center text-sm text-bone/50 hover:text-bone">
            Back to sign in
          </Link>
        </form>
      )}
    </AuthCard>
  );
}
