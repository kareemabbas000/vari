'use client';

import { CONSENT_COOKIE, type Consent } from './tracking';

/**
 * Conversion events for whatever trackers the visitor has allowed. Calls are no-ops when
 * nothing is loaded, so components can report events unconditionally.
 */
type W = Window & {
  gtag?: (...a: unknown[]) => void;
  dataLayer?: unknown[];
  fbq?: (...a: unknown[]) => void;
  ttq?: { track: (e: string, p?: object, o?: object) => void };
  lintrk?: (a: string, o: object) => void;
};

export function readConsent(): Consent | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]+)`));
  if (!m) return null;
  try {
    const v = JSON.parse(decodeURIComponent(m[1])) as { a?: number; m?: number; v?: number };
    return { analytics: v.a === 1, marketing: v.m === 1 };
  } catch {
    return null;
  }
}

export function newEventId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** `lead` = enquiry sent, `signup` = newsletter. */
export function track(kind: 'lead' | 'signup', opts: { eventId?: string; params?: Record<string, unknown> } = {}) {
  if (typeof window === 'undefined') return;
  const w = window as W;
  const params = opts.params || {};
  const ga = kind === 'lead' ? 'generate_lead' : 'sign_up';
  w.gtag?.('event', ga, params);
  w.dataLayer?.push({ event: ga, ...params });
  const meta = kind === 'lead' ? 'Lead' : 'CompleteRegistration';
  w.fbq?.('track', meta, params, opts.eventId ? { eventID: opts.eventId } : undefined);
  w.ttq?.track(kind === 'lead' ? 'SubmitForm' : 'CompleteRegistration', params, opts.eventId ? { event_id: opts.eventId } : undefined);
}
