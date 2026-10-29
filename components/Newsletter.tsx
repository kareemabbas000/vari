'use client';

import { useState, type FormEvent } from 'react';
import { contact, copy } from '@/lib/content';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,63}$/;

export default function Newsletter() {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'handoff' | 'error'>('idle');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError(value ? 'Please enter a valid email address.' : 'Enter your email to sign up.');
      setState('error');
      return;
    }
    setState('sending');
    setError('');
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: value }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok && json.ok) return setState('done');
    if (json.fallback === 'mailto') return setState('handoff');
    setError(res ? json.error || 'Something went wrong — please try again.' : 'Network error — please try again.');
    setState('error');
  }

  if (state === 'done') {
    return (
      <div role="status">
        <p className="label mb-3 text-gold">{copy.contact.newsletter}</p>
        <p className="display text-2xl text-bone">You are on the list.</p>
        <p className="mt-2 text-sm text-bone/60">News from the studio will reach {email}.</p>
      </div>
    );
  }

  if (state === 'handoff') {
    const href = `mailto:${contact.email}?subject=${encodeURIComponent('Newsletter sign-up')}&body=${encodeURIComponent(`Please add ${email.trim()} to the VARI Studio newsletter.`)}`;
    return (
      <div role="status">
        <p className="label mb-3 text-gold">{copy.contact.newsletter}</p>
        <p className="text-bone/80">Almost there — confirm your sign-up with one email to the studio.</p>
        <div className="mt-5 flex flex-wrap items-center gap-5">
          <a href={href} className="btn !px-5">
            <span>Send confirmation</span>
          </a>
          <button type="button" className="label link-line text-bone/50" onClick={() => setState('idle')}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="w-full max-w-md">
      <p className="label mb-4 text-bone/70">{copy.contact.newsletter}</p>
      <div className="flex items-end gap-4">
        <label className="field flex-1" data-invalid={state === 'error' ? '' : undefined}>
          <input
            name="email"
            type="email"
            required
            placeholder=" "
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state === 'error') setState('idle');
            }}
            aria-invalid={state === 'error'}
            aria-describedby="newsletter-error"
          />
          <span>Email *</span>
        </label>
        <button type="submit" className="btn shrink-0 !px-5" disabled={state === 'sending'}>
          <span>{state === 'sending' ? 'Signing…' : 'Sign up'}</span>
        </button>
      </div>
      <p id="newsletter-error" role="alert" className="mt-3 min-h-[1.25rem] text-sm text-[#E8A598]">
        {state === 'error' ? error : ''}
      </p>
    </form>
  );
}
