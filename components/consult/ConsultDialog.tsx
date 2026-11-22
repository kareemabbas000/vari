'use client';

import Image from 'next/image';
import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { fmt } from '@/lib/i18n';
import { newEventId, readConsent, track } from '@/lib/analytics';
import { consultState } from './state';
import type { ConsultOpen, ProjectType } from './ConsultProvider';

/**
 * The free-call form, shown over the page (the visitor never leaves it).
 *   phone   — a sheet that slides up from the bottom, full width, thumb-friendly
 *   tablet  — a centred card
 *   desktop — a two-column window: a project image with reassurance on the left, the form right
 * Two short steps: what the project is about (one tap), then how to reach you. Esc, the close
 * button, a click outside and the phone's back button all close it.
 */
const TYPES: { id: ProjectType; key: 'typeInterior' | 'typeVisualization' | 'typeArchitecture' | 'typeUnsure'; icon: ReactNode }[] = [
  { id: 'interior', key: 'typeInterior', icon: <path d="M4 16v-4a2 2 0 012-2h12a2 2 0 012 2v4M4 16h16M6 16v3M18 16v3M7 10V7a2 2 0 012-2h6a2 2 0 012 2v3" /> },
  { id: 'visualization', key: 'typeVisualization', icon: <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5" /> },
  { id: 'architecture', key: 'typeArchitecture', icon: <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" /> },
  { id: 'unsure', key: 'typeUnsure', icon: <path d="M9.5 9a2.5 2.5 0 015 0c0 1.7-2.5 2-2.5 4M12 17h.01M12 21a9 9 0 100-18 9 9 0 000 18z" /> },
];
const ASIDE_IMAGE = 'b80319_962a6cc04617409f94ea031705d4ee66~mv2.png'; // Hearthstone Haven

function Gold({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/g).filter(Boolean).map((p, i) => (p.startsWith('*') && p.endsWith('*') ? <span key={i} className="display-italic text-gold">{p.slice(1, -1)}</span> : <span key={i}>{p}</span>))}
    </>
  );
}

export default function ConsultDialog({ trigger, title, projectType, onClose }: ConsultOpen & { onClose: () => void }) {
  const { t, locale, href, settings } = useI18n();
  const c = t.consult;
  const saved = useMemo(() => consultState.contact(), []);
  const [step, setStep] = useState<1 | 2 | 3>(projectType ? 2 : 1);
  const [type, setType] = useState<ProjectType>(projectType ?? 'unsure');
  const [values, setValues] = useState({ name: saved.name, email: saved.email, phone: saved.phone, time: '', message: '' });
  const [noteOpen, setNoteOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [error, setError] = useState('');
  const [shown, setShown] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const firstField = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const tz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch {
      return '';
    }
  }, []);
  const chips = c.timeChips.split('|').map((s) => s.trim()).filter(Boolean);

  // Enter animation, scroll lock (with no layout jump), focus, Esc and focus trap.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const { overflow, paddingRight } = document.body.style;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
    const raf = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !panel.current) return;
      const f = panel.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([tabindex="-1"]),textarea,[tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      prev?.focus?.();
    };
  }, [onClose]);

  useEffect(() => {
    // Phones: the keyboard would cover the sheet's animation, so focus after it settles.
    const id = setTimeout(() => (step === 2 ? firstField.current : panel.current?.querySelector<HTMLElement>('[data-autofocus]'))?.focus({ preventScroll: true }), 380);
    return () => clearTimeout(id);
  }, [step]);

  const set = (k: keyof typeof values) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [k]: e.target.value }));
  const pickChip = (chip: string) => setValues((v) => ({ ...v, time: v.time.includes(chip) ? v.time : v.time ? `${v.time}, ${chip}` : chip }));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = values.name.trim();
    const email = values.email.trim();
    if (!name) {
      setError(c.nameMissing);
      setStatus('error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,63}$/.test(email)) {
      setError(t.form.emailInvalid);
      setStatus('error');
      return;
    }
    setStatus('sending');
    setError('');
    const eventId = newEventId();
    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: values.phone.trim(),
          preferredTime: values.time.trim(),
          timezone: tz,
          projectType: type,
          message: values.message.trim(),
          locale,
          sourceTitle: title || document.title,
          sourcePath: location.pathname,
          trigger,
          eventId,
          marketingConsent: !!readConsent()?.marketing,
          company: (form.elements.namedItem('company') as HTMLInputElement | null)?.value || '',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        consultState.submit({ name, email, phone: values.phone.trim() });
        track('lead', { eventId, params: { source: 'consultation', trigger, project: type } });
        setStatus('idle');
        setStep(3);
        return;
      }
      if (json.fallback === 'mailto') {
        const body = `${name}\n${email}\n${values.phone}\n${c.ackProject}: ${t.consult[TYPES.find((x) => x.id === type)!.key]}\n${c.ackTime}: ${values.time} ${tz}\n\n${values.message}`;
        location.href = `mailto:${settings.contact.email}?subject=${encodeURIComponent(c.ackSubject)}&body=${encodeURIComponent(body)}`;
        setStatus('idle');
        return;
      }
      setError(res.status === 422 ? t.form.emailInvalid : res.status === 429 ? t.messages.rateLimited : t.form.genericError);
      setStatus('error');
    } catch {
      setError(t.form.networkError);
      setStatus('error');
    }
  }

  const field = 'block w-full border-0 border-b border-bone/20 bg-transparent px-0 pb-2.5 pt-1.5 text-[1rem] text-bone placeholder:text-bone/30 transition-colors focus:border-gold focus:outline-none focus:ring-0';
  const lbl = 'label flex items-baseline justify-between gap-3 text-bone/55';

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6" role="presentation">
      <div
        aria-hidden
        onClick={onClose}
        className={`absolute inset-0 bg-[#060505]/75 backdrop-blur-[6px] transition-opacity duration-500 motion-reduce:transition-none ${shown ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-lenis-prevent
        className={`relative flex max-h-[94svh] w-full flex-col overflow-hidden border-t border-gold/30 bg-[#11100e] shadow-[0_-30px_80px_-20px_rgba(0,0,0,0.9)] transition-[transform,opacity] duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:max-h-[90svh] sm:max-w-[36rem] sm:border lg:max-w-[60rem] lg:flex-row ${
          shown ? 'translate-y-0 opacity-100 sm:scale-100' : 'translate-y-full opacity-0 sm:translate-y-6 sm:scale-[0.98]'
        }`}
      >
        {/* Desktop: a real project as the backdrop of the promise. */}
        <aside className="relative hidden w-[23rem] shrink-0 lg:block" aria-hidden>
          <Image src={ASIDE_IMAGE} alt="" fill sizes="368px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0a09] via-[#0b0a09]/55 to-[#0b0a09]/10" />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <p className="label text-gold">{c.dialogEyebrow}</p>
            <ul className="mt-6 space-y-4 text-[0.95rem] leading-snug text-bone/85">
              {[c.point1, c.point2, c.point3].map((p) => (
                <li key={p} className="flex gap-3">
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-gold" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 border-t border-bone/15 pt-5 text-xs leading-relaxed text-bone/50">{c.trust}</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          {/* Phone grab handle: says "this is a sheet over your page". */}
          <div className="flex justify-center pt-3 sm:hidden" aria-hidden>
            <span className="h-1 w-10 rounded-full bg-bone/20" />
          </div>

          <header className="flex items-start justify-between gap-6 px-6 pb-2 pt-4 sm:px-9 sm:pt-8">
            <div>
              <p className="label flex items-center gap-2.5 text-gold lg:hidden">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
                </span>
                {c.dialogEyebrow}
              </p>
              <h2 id={titleId} className="display mt-3 text-[clamp(1.7rem,5vw,2.3rem)] leading-[1.05] lg:mt-0">
                {step === 3 ? fmt(c.successTitle, { name: values.name.trim().split(' ')[0] }) : <Gold text={c.dialogTitle} />}
              </h2>
            </div>
            <button type="button" onClick={onClose} aria-label={c.close} className="-mr-2 -mt-1 grid h-11 w-11 shrink-0 place-items-center text-bone/55 transition-colors hover:text-gold">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>

          {step !== 3 && (
            <div className="px-6 sm:px-9">
              <p className="flex items-center gap-2 text-xs text-bone/45">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-gold/80" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <path d="M4 12h12M11 7l5 5-5 5M20 4v16" />
                </svg>
                {c.stayNote}
              </p>
              <div className="mt-5 flex items-center gap-3" aria-hidden>
                <span className={`h-px flex-1 transition-colors duration-500 ${step >= 1 ? 'bg-gold' : 'bg-bone/15'}`} />
                <span className={`h-px flex-1 transition-colors duration-500 ${step >= 2 ? 'bg-gold' : 'bg-bone/15'}`} />
              </div>
              <p className="label mt-3 text-bone/40">{fmt(c.stepOf, { n: step })}</p>
            </div>
          )}

          {step === 1 && (
            <section className="px-6 pb-8 pt-5 sm:px-9 sm:pb-10">
              <p className="text-[0.98rem] leading-relaxed text-bone/70">{c.dialogIntro}</p>
              <h3 className="mt-6 text-[1.05rem] text-bone">{c.stepWhat}</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {TYPES.map((x, i) => (
                  <button
                    key={x.id}
                    type="button"
                    data-autofocus={i === 0 ? '' : undefined}
                    onClick={() => {
                      setType(x.id);
                      setTimeout(() => setStep(2), 180);
                    }}
                    aria-pressed={type === x.id}
                    className={`group flex min-h-[92px] flex-col items-start justify-between gap-3 border p-4 text-left transition-colors duration-300 ${
                      type === x.id && projectType ? 'border-gold bg-gold/[0.08]' : 'border-bone/15 hover:border-gold/60 hover:bg-gold/[0.04]'
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-gold transition-transform duration-500 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
                      {x.icon}
                    </svg>
                    <span className="text-[0.95rem] leading-tight text-bone/90">{c[x.key]}</span>
                  </button>
                ))}
              </div>
              <p className="mt-6 text-xs leading-relaxed text-bone/40 lg:hidden">{c.trust}</p>
            </section>
          )}

          {step === 2 && (
            <form onSubmit={submit} noValidate className="px-6 pb-7 pt-5 sm:px-9 sm:pb-9">
              <button type="button" onClick={() => setStep(1)} className="label mb-5 inline-flex items-center gap-2 text-gold/90 hover:text-gold">
                <span aria-hidden>←</span> {c[TYPES.find((x) => x.id === type)!.key]}
              </button>
              <h3 className="text-[1.05rem] text-bone">{c.stepYou}</h3>

              <div className="mt-5 grid gap-5 sm:grid-cols-2 sm:gap-x-6">
                <label className="block sm:col-span-2">
                  <span className={lbl}>{c.name}</span>
                  <input ref={firstField} name="name" autoComplete="name" required value={values.name} onChange={set('name')} className={field} maxLength={120} />
                </label>
                <label className="block">
                  <span className={lbl}>{c.email}</span>
                  <input name="email" type="email" inputMode="email" autoComplete="email" required value={values.email} onChange={set('email')} className={field} maxLength={254} />
                </label>
                <label className="block">
                  <span className={lbl}>
                    {c.phone} <span className="normal-case tracking-normal text-bone/30">{c.optional}</span>
                  </span>
                  <input name="phone" type="tel" inputMode="tel" autoComplete="tel" value={values.phone} onChange={set('phone')} className={field} maxLength={40} />
                </label>
                <div className="sm:col-span-2">
                  <label className="block">
                    <span className={lbl}>{c.time}</span>
                    <input name="time" value={values.time} onChange={set('time')} placeholder={c.timePlaceholder} className={field} maxLength={200} />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {chips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => pickChip(chip)}
                        className={`min-h-[36px] border px-3 text-[0.8rem] transition-colors ${values.time.includes(chip) ? 'border-gold bg-gold/10 text-gold' : 'border-bone/15 text-bone/60 hover:border-gold/50 hover:text-bone'}`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                  {tz && <p className="mt-2.5 text-xs text-bone/35">{fmt(c.timezone, { tz: tz.replace(/_/g, ' ') })}</p>}
                </div>
                <div className="sm:col-span-2">
                  {noteOpen ? (
                    <label className="block">
                      <span className={lbl}>
                        {c.note} <span className="normal-case tracking-normal text-bone/30">{c.optional}</span>
                      </span>
                      <textarea name="message" value={values.message} onChange={set('message')} rows={3} maxLength={2000} className={`${field} resize-none`} autoFocus />
                    </label>
                  ) : (
                    <button type="button" onClick={() => setNoteOpen(true)} className="text-sm text-bone/50 transition-colors hover:text-gold">
                      + {c.addNote}
                    </button>
                  )}
                </div>
              </div>

              {/* Honeypot: invisible to people, filled by bots. */}
              <input type="text" name="company" tabIndex={-1} autoComplete="off" className="absolute left-[-9999px] h-0 w-0 opacity-0" aria-hidden />

              <p aria-live="polite" className="mt-5 min-h-[1.25rem] text-sm text-[#E8A598]">
                {status === 'error' ? error : ''}
              </p>
              <button type="submit" disabled={status === 'sending'} className="btn btn-solid mt-2 w-full">
                {status === 'sending' ? c.sending : c.submit}
              </button>
              <p className="mt-4 text-center text-xs leading-relaxed text-bone/40">
                {c.privacy}{' '}
                <a href={href('/privacy')} target="_blank" rel="noopener" className="underline decoration-bone/25 underline-offset-2 hover:text-gold">
                  {c.privacyLink}
                </a>
              </p>
            </form>
          )}

          {step === 3 && (
            <section className="px-6 pb-9 pt-4 sm:px-9 sm:pb-11" aria-live="polite">
              <svg viewBox="0 0 52 52" className="h-14 w-14 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <circle cx="26" cy="26" r="24" className="consult-draw" style={{ strokeDasharray: 151, strokeDashoffset: 151 }} />
                <path d="M15 27l7 7 15-16" className="consult-draw consult-draw-late" style={{ strokeDasharray: 40, strokeDashoffset: 40 }} />
              </svg>
              <p className="mt-6 max-w-md text-[1.02rem] leading-relaxed text-bone/75">{c.successBody}</p>
              <button type="button" onClick={onClose} className="btn mt-8 w-full sm:w-auto" data-autofocus>
                {c.successCta}
              </button>
            </section>
          )}

          <div className="h-[env(safe-area-inset-bottom)] shrink-0 sm:hidden" aria-hidden />
        </div>
      </div>
    </div>
  );
}
