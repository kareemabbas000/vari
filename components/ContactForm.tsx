'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { contact, copy } from '@/lib/content';

type Status = 'idle' | 'sending' | 'sent' | 'handoff' | 'error';
type Values = { firstName: string; lastName: string; email: string; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,63}$/;

/** Topics the hero / studio CTAs link to (`/contact?intent=…`). */
const INTENTS: Record<string, { label: string; message: string }> = {
  design: {
    label: copy.hero.ctaDesign,
    message: "Hello VARI Studio, I'd like to start designing a space with you. Here is a little about the project:\n\n",
  },
  visualize: {
    label: copy.hero.ctaVisualize,
    message: "Hello VARI Studio, I'd like to visualize a project in 3D. Here is a little about it:\n\n",
  },
};

function mailtoHref(v: Values) {
  const body = `${v.message}\n\n— ${[v.firstName, v.lastName].filter(Boolean).join(' ')}\n${v.email}`.trim();
  return `mailto:${contact.email}?subject=${encodeURIComponent('Project enquiry — vari-studio.com')}&body=${encodeURIComponent(body)}`;
}

/** Mirrors the original Wix form: First Name, Last Name, Email (required), Message, Send. */
export default function ContactForm({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [intent, setIntent] = useState<string | null>(null);
  const [draft, setDraft] = useState<Values | null>(null);
  const [copied, setCopied] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const message = useRef<HTMLTextAreaElement>(null);
  const result = useRef<HTMLDivElement>(null);

  // Prefill from `?intent=` so the hero buttons land on a form that already knows why you came.
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get('intent');
    if (key && INTENTS[key]) {
      setIntent(key);
      if (message.current && !message.current.value) message.current.value = INTENTS[key].message;
    }
  }, []);

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
    const msg = !value.trim() ? 'Email is required so we can reply.' : !EMAIL_RE.test(value.trim()) ? 'Please enter a valid email address.' : '';
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
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, intent }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
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
      setError(json.error || 'Something went wrong. Please try again or email us directly.');
      setStatus('error');
    } catch {
      setDraft(values);
      setError('We could not reach the server. Check your connection, or send it by email instead.');
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
        <p className="display h-md text-gold">{copy.contact.success}</p>
        <p className="mt-3 text-bone/70">Your message reached the studio. We will reply to you by email shortly.</p>
        <button type="button" className="label link-line mt-6 text-gold" onClick={() => setStatus('idle')}>
          Send another message
        </button>
      </div>
    );
  }

  if (status === 'handoff' && draft) {
    const text = `${draft.message}\n\n— ${[draft.firstName, draft.lastName].filter(Boolean).join(' ')}\n${draft.email}`.trim();
    return (
      <div ref={result} tabIndex={-1} role="status" className="border border-gold/40 p-8 outline-none">
        <p className="label text-gold">One last step</p>
        <p className="display h-md mt-3">Your message is ready to send</p>
        <p className="mt-3 text-bone/70">
          Open it in your email app and press send — it goes straight to{' '}
          <span className="text-bone">{contact.email}</span>.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={mailtoHref(draft)} className="btn btn-solid">
            <span>Open in email app</span>
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
            <span>{copied ? 'Copied ✓' : 'Copy message'}</span>
          </button>
        </div>
        <button type="button" className="label link-line mt-8 text-bone/60" onClick={() => setStatus('idle')}>
          ← Edit message
        </button>
      </div>
    );
  }

  return (
    <form ref={form} onSubmit={onSubmit} noValidate className="grid gap-x-8 gap-y-6 sm:grid-cols-2" aria-busy={status === 'sending'}>
      {intent && (
        <p className="label flex items-center gap-3 text-gold sm:col-span-2">
          <span className="block h-px w-8 bg-gold" />
          Enquiry · {INTENTS[intent].label}
        </p>
      )}
      <label className="field">
        <input name="firstName" type="text" maxLength={100} autoComplete="given-name" placeholder=" " defaultValue={draft?.firstName} />
        <span>First Name</span>
      </label>
      <label className="field">
        <input name="lastName" type="text" maxLength={100} autoComplete="family-name" placeholder=" " defaultValue={draft?.lastName} />
        <span>Last Name</span>
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
          <span>Email *</span>
        </label>
        {emailError && (
          <p id="email-error" className="mt-2 text-sm text-[#E8A598]">
            {emailError}
          </p>
        )}
      </div>
      <label className="field sm:col-span-2">
        <textarea ref={message} name="message" rows={compact ? 3 : 5} maxLength={5000} placeholder=" " defaultValue={draft?.message} />
        <span>Message</span>
      </label>
      <label className="hidden" aria-hidden>
        Company
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>
      <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
        <button type="submit" className="btn btn-solid" disabled={status === 'sending'}>
          <span className="flex items-center gap-3">
            {status === 'sending' && <span aria-hidden className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />}
            {status === 'sending' ? 'Sending…' : 'Send'}
          </span>
        </button>
        <p role="alert" className="text-sm text-[#E8A598]">
          {error}
          {status === 'error' && draft && (
            <>
              {' '}
              <a href={mailtoHref(draft)} className="link-line text-gold">
                Email it instead
              </a>
            </>
          )}
        </p>
      </div>
    </form>
  );
}
