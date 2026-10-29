'use client';

import { useState, type FormEvent } from 'react';
import { contact, copy } from '@/lib/content';

type Status = 'idle' | 'sending' | 'sent' | 'error';

/** Mirrors the original Wix form: First Name, Last Name, Email (required), Message, Send. */
export default function ContactForm({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setStatus('sent');
        form.reset();
        return;
      }
      if (json.fallback === 'mailto') {
        // No mail provider configured: hand the message to the visitor's email client.
        const body = `${values.message || ''}\n\n— ${values.firstName || ''} ${values.lastName || ''}`.trim();
        window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent('Project enquiry')}&body=${encodeURIComponent(body)}`;
        setStatus('sent');
        return;
      }
      setError(json.error || 'Something went wrong. Please email us directly.');
      setStatus('error');
    } catch {
      setError('Network error. Please email us directly.');
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div role="status" className="border border-gold/40 p-8">
        <p className="display h-md text-gold">{copy.contact.success}</p>
        <p className="mt-3 text-bone/70">We will be in touch shortly.</p>
        <button type="button" className="label mt-6 text-gold link-line" onClick={() => setStatus('idle')}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate={false} className="grid gap-x-8 gap-y-6 sm:grid-cols-2" aria-describedby="form-error">
      <label className="field">
        <input name="firstName" type="text" maxLength={100} autoComplete="given-name" placeholder=" " />
        <span>First Name</span>
      </label>
      <label className="field">
        <input name="lastName" type="text" maxLength={100} autoComplete="family-name" placeholder=" " />
        <span>Last Name</span>
      </label>
      <label className="field sm:col-span-2">
        <input name="email" type="email" required maxLength={250} autoComplete="email" placeholder=" " />
        <span>Email *</span>
      </label>
      <label className="field sm:col-span-2">
        <textarea name="message" rows={compact ? 3 : 5} placeholder=" " />
        <span>Message</span>
      </label>
      <label className="hidden" aria-hidden>
        Company
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>
      <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
        <button type="submit" className="btn btn-solid" disabled={status === 'sending'}>
          <span>{status === 'sending' ? 'Sending…' : 'Send'}</span>
        </button>
        <p id="form-error" role="alert" className="text-sm text-red-300">
          {error}
        </p>
      </div>
    </form>
  );
}
