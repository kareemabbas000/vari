'use client';

/**
 * What this visitor already did with the free-call offer, kept in their own browser only
 * (no server, no cookie banner needed: it is strictly functional and never leaves the device).
 * Every access is guarded: private mode or blocked storage simply means "show normally".
 */
const KEY = 'vari:consult';
const SESSION = 'vari:consult:shown';

type Saved = { submittedAt?: number; dismissedAt?: number; dismissals?: number; name?: string; email?: string; phone?: string };

function read(): Saved {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Saved;
  } catch {
    return {};
  }
}
function write(patch: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...read(), ...patch }));
  } catch {}
}

export const consultState = {
  /** Asked already: the reminder never shows again (the buttons still work). */
  submitted: () => !!read().submittedAt,
  /** "Not now": quiet for 7 days, then 30 days after the second time. */
  snoozed: () => {
    const s = read();
    if (!s.dismissedAt) return false;
    const days = (s.dismissals ?? 1) >= 2 ? 30 : 7;
    return Date.now() - s.dismissedAt < days * 86_400_000;
  },
  dismiss: () => write({ dismissedAt: Date.now(), dismissals: (read().dismissals ?? 0) + 1 }),
  /** At most one automatic reminder per visit. */
  shownThisVisit: () => {
    try {
      return sessionStorage.getItem(SESSION) === '1';
    } catch {
      return false;
    }
  },
  markShown: () => {
    try {
      sessionStorage.setItem(SESSION, '1');
    } catch {}
  },
  /** Details from a previous request, to save typing next time (this device only). */
  contact: () => {
    const s = read();
    return { name: s.name ?? '', email: s.email ?? '', phone: s.phone ?? '' };
  },
  submit: (c: { name: string; email: string; phone: string }) => write({ submittedAt: Date.now(), ...c }),
};
