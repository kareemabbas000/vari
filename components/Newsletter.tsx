'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { fmt } from '@/lib/i18n';
import { useI18n } from './I18nProvider';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,63}$/;

export default function Newsletter() {
  const { t, locale, href, settings } = useI18n();
  const contact = settings.contact;
  const [doneMsg, setDoneMsg] = useState<'confirmed' | 'check_inbox' | 'already'>('confirmed');
  const n = t.newsletter;
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'handoff' | 'error'>('idle');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError(value ? n.invalid : n.empty);
      setState('error');
      return;
    }
    setState('sending');
    setError('');
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: value, locale }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok && json.ok) {
      setDoneMsg(json.status === 'check_inbox' ? 'check_inbox' : json.status === 'already' ? 'already' : 'confirmed');
      return setState('done');
    }
    if (res?.status === 429) {
      setError(t.messages.newsletterRateLimited);
      return setState('error');
    }
    if (json.fallback === 'mailto') return setState('handoff');
    setError(res ? n.error : n.network);
    setState('error');
  }

  if (state === 'done') {
    return (
      <div role="status">
        <p className="label mb-3 text-gold">{n.title}</p>
        <p className="display text-2xl text-bone">{doneMsg === 'already' ? t.messages.newsletterAlready : n.onList}</p>
        <p className="mt-2 text-sm text-bone/60">{doneMsg === 'check_inbox' ? t.messages.newsletterCheckInbox : fmt(n.reach, { email })}</p>
      </div>
    );
  }

  if (state === 'handoff') {
    const href = `mailto:${contact.email}?subject=${encodeURIComponent(n.mailSubject)}&body=${encodeURIComponent(fmt(n.mailBody, { email: email.trim() }))}`;
    return (
      <div role="status">
        <p className="label mb-3 text-gold">{n.title}</p>
        <p className="text-bone/80">{n.almost}</p>
        <div className="mt-5 flex flex-wrap items-center gap-5">
          <a href={href} className="btn !px-5">
            <span>{n.confirm}</span>
          </a>
          <button type="button" className="label link-line text-bone/50" onClick={() => setState('idle')}>
            {n.back}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="w-full max-w-md">
      <p className="label mb-4 text-bone/70">{n.title}</p>
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
          <span>{t.form.email}</span>
        </label>
        <button type="submit" className="btn shrink-0 !px-5" disabled={state === 'sending'}>
          <span>{state === 'sending' ? n.signing : n.signUp}</span>
        </button>
      </div>
      <p id="newsletter-error" role="alert" className="mt-3 min-h-[1.25rem] text-sm text-[#E8A598]">
        {state === 'error' ? error : ''}
      </p>
      <p className="text-xs text-bone/40">
        {t.legal.newsletterConsent}{' '}
        <Link href={href('/privacy')} className="link-line text-bone/60 hover:text-gold">
          {t.legal.privacyLink}
        </Link>
        .
      </p>
    </form>
  );
}
