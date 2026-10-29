'use client';

import { useState, type FormEvent } from 'react';
import { contact, copy } from '@/lib/content';

export default function Newsletter() {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get('email') || '');
    setState('sending');
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok && json.ok) return setState('done');
    if (json.fallback === 'mailto') {
      window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent('Newsletter sign-up')}&body=${encodeURIComponent(email)}`;
      return setState('done');
    }
    setState('error');
  }

  if (state === 'done') return <p className="text-gold" role="status">{copy.contact.success}</p>;

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md">
      <p className="label mb-4 text-bone/70">{copy.contact.newsletter}</p>
      <div className="flex items-end gap-4">
        <label className="field flex-1">
          <input name="email" type="email" required placeholder=" " autoComplete="email" />
          <span>Email *</span>
        </label>
        <button type="submit" className="btn !px-5" disabled={state === 'sending'}>
          <span>Sign up</span>
        </button>
      </div>
      {state === 'error' && <p role="alert" className="mt-3 text-sm text-red-300">Please check your email and try again.</p>}
    </form>
  );
}
