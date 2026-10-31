'use client';

import { newEventId, readConsent, track } from '@/lib/analytics';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useI18n } from './I18nProvider';

type Status = 'idle' | 'sending' | 'sent' | 'handoff' | 'error';
type Values = { firstName: string; lastName: string; email: string; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,63}$/;

type Intent = 'design' | 'visualize';
const isIntent = (v: string | null): v is Intent => v === 'design' || v === 'visualize';

function mailtoHref(to: string, v: Values, subject: string) {
  const body = `${v.message}\n\n— ${[v.firstName, v.lastName].filter(Boolean).join(' ')}\n${v.email}`.trim();
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Mirrors the original Wix form: First Name, Last Name, Email (required), Message, Send. */
export default function ContactForm({ compact = false }: { compact?: boolean }) {
  const { t, locale, href, settings } = useI18n();
  const contact = settings.contact;
  const f = t.form;
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [intent, setIntent] = useState<Intent | null>(null);
  const [draft, setDraft] = useState<Values | null>(null);
  const [copied, setCopied] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const message = useRef<HTMLTextAreaElement>(null);
  const result = useRef<HTMLDivElement>(null);

  // Prefill from `?intent=` so the hero buttons land on a form that already knows why you came.
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get('intent');
    if (isIntent(key)) {
      setIntent(key);
      if (message.current && !message.current.value) message.current.value = f.intents[key].message;
    }
  }, [f]);

  useEffect(() => {
    if (status !== 'sent' && status !== 'handoff') return;
    const el = result.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    // Keep the confirmation clear of the fixed header.
    const top = el.getBoundingClientRect().top;
    if (top < 120 || top > window.innerHeight * 0.6) window.scrollBy({ top: top - 120, behavior: 'smooth' });
  }, [status]);

  function validateEmail(value: string) {
    const msg = !value.trim() ? f.emailRequired : !EMAIL_RE.test(value.trim()) ? f.emailInvalid : '';
    setEmailError(msg);
    return !msg;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const el = e.currentTarget;
    const values = Object.fromEntries(new FormData(el).entries()) as Values & { company?: string };
    if (!validateEmail(values.email)) {
      (el.elements.namedItem('email') as HTMLInputElement | null)?.focus();
      return;
    }
    setStatus('sending');
    setError('');
    // One id for the browser pixel and the server-side Conversions API, so Meta counts it once.
    const eventId = newEventId();
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, intent, locale, eventId, marketingConsent: !!readConsent()?.marketing }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        track('lead', { eventId, params: { intent } });
        setStatus('sent');
        el.reset();
        return;
      }
      if (json.fallback === 'mailto') {
        // Direct delivery is unavailable: hand the composed message to the visitor's mail app.
        setDraft(values);
        setStatus('handoff');
        return;
      }
      setError(res.status === 422 ? f.emailInvalid : res.status === 429 ? t.messages.rateLimited : f.genericError);
      setStatus('error');
    } catch {
      setDraft(values);
      setError(f.networkError);
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div ref={result} tabIndex={-1} role="status" className="border border-gold/40 p-8 outline-none">
        <span aria-hidden className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-gold text-gold">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 10.5l4 4 8-9" />
          </svg>
        </span>
        <p className="display h-md text-gold">{f.success}</p>
        <p className="mt-3 text-bone/70">{f.sentBody}</p>
        <button type="button" className="label link-line mt-6 text-gold" onClick={() => setStatus('idle')}>
          {f.another}
        </button>
      </div>
    );
  }

  if (status === 'handoff' && draft) {
    const text = `${draft.message}\n\n— ${[draft.firstName, draft.lastName].filter(Boolean).join(' ')}\n${draft.email}`.trim();
    return (
      <div ref={result} tabIndex={-1} role="status" className="border border-gold/40 p-8 outline-none">
        <p className="label text-gold">{f.handoffEyebrow}</p>
        <p className="display h-md mt-3">{f.handoffTitle}</p>
        <p className="mt-3 text-bone/70">
          {f.handoffBody}{' '}
          <span className="text-bone">{contact.email}</span>.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={mailtoHref(contact.email, draft, f.subject)} className="btn btn-solid">
            <span>{f.openEmail}</span>
          </a>
          <button
            type="button"
            className="btn"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(text);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            <span>{copied ? f.copied : f.copy}</span>
          </button>
        </div>
        <button type="button" className="label link-line mt-8 text-bone/60" onClick={() => setStatus('idle')}>
          {f.edit}
        </button>
      </div>
    );
  }

  return (
    <form data-clarity-mask="true" ref={form} onSubmit={onSubmit} noValidate className="grid gap-x-8 gap-y-6 sm:grid-cols-2" aria-busy={status === 'sending'}>
      {intent && (
        <p className="label flex items-center gap-3 text-gold sm:col-span-2">
          <span className="block h-px w-8 bg-gold" />
          {f.enquiry} · {f.intents[intent].label}
        </p>
      )}
      <label className="field">
        <input name="firstName" type="text" maxLength={100} autoComplete="given-name" placeholder=" " defaultValue={draft?.firstName} />
        <span>{f.firstName}</span>
      </label>
      <label className="field">
        <input name="lastName" type="text" maxLength={100} autoComplete="family-name" placeholder=" " defaultValue={draft?.lastName} />
        <span>{f.lastName}</span>
      </label>
      <div className="sm:col-span-2">
        <label className="field" data-invalid={emailError ? '' : undefined}>
          <input
            name="email"
            type="email"
            required
            maxLength={250}
            autoComplete="email"
            inputMode="email"
            placeholder=" "
            defaultValue={draft?.email}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'email-error' : undefined}
            onBlur={(e) => e.target.value && validateEmail(e.target.value)}
            onInput={(e) => emailError && validateEmail((e.target as HTMLInputElement).value)}
          />
          <span>{f.email}</span>
        </label>
        {emailError && (
          <p id="email-error" className="mt-2 text-sm text-[#E8A598]">
            {emailError}
          </p>
        )}
      </div>
      <label className="field sm:col-span-2">
        <textarea ref={message} name="message" rows={compact ? 3 : 5} maxLength={5000} placeholder=" " defaultValue={draft?.message} />
        <span>{f.message}</span>
      </label>
      <label className="hidden" aria-hidden>
        Company
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>
      <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
        <button type="submit" className="btn btn-solid" disabled={status === 'sending'}>
          <span className="flex items-center gap-3">
            {status === 'sending' && <span aria-hidden className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />}
            {status === 'sending' ? f.sending : f.send}
          </span>
        </button>
        <p role="alert" className="text-sm text-[#E8A598]">
          {error}
          {status === 'error' && draft && (
            <>
              {' '}
              <a href={mailtoHref(contact.email, draft, f.subject)} className="link-line text-gold">
                {f.emailInstead}
              </a>
            </>
          )}
        </p>
      </div>
      <p className="text-xs leading-relaxed text-bone/45 sm:col-span-2">
        {t.legal.formConsent}{' '}
        <Link href={href('/privacy')} className="link-line text-bone/70 hover:text-gold">
          {t.legal.privacyLink}
        </Link>
        .
      </p>
    </form>
  );
}
