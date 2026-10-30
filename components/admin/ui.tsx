'use client';

import Link from 'next/link';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

/* ── Buttons ─────────────────────────────────────────────────────────────── */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-gold text-night hover:bg-gold-light disabled:bg-gold/40',
  secondary: 'border border-bone/20 text-bone hover:border-gold hover:text-gold',
  ghost: 'text-bone/70 hover:bg-bone/5 hover:text-bone',
  danger: 'border border-[#E8A598]/40 text-[#E8A598] hover:bg-[#E8A598]/10',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; busy?: boolean; size?: 'sm' | 'md' };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', busy, size = 'md', className = '', children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || busy}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-sm font-sans text-[0.8rem] font-medium uppercase tracking-[0.14em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-60 ${
        size === 'sm' ? 'min-h-[36px] px-3 text-[0.7rem]' : 'px-5'
      } ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {busy && <Spinner />}
      {children}
    </button>
  );
});

export function LinkButton({ href, variant = 'secondary', children, className = '' }: { href: string; variant?: Variant; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-sm px-5 font-sans text-[0.8rem] font-medium uppercase tracking-[0.14em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return <span aria-hidden className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent ${className}`} />;
}

/* ── Form fields ─────────────────────────────────────────────────────────── */

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: ReactNode; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block font-sans text-[0.72rem] font-medium uppercase tracking-[0.16em] text-bone/60">
        {label}
      </label>
      {children}
      {error ? <p className="text-sm text-[#E8A598]">{error}</p> : hint ? <p className="text-xs leading-relaxed text-bone/40">{hint}</p> : null}
    </div>
  );
}

const control =
  'w-full rounded-sm border border-bone/15 bg-night/60 px-3.5 py-2.5 font-sans text-[0.95rem] text-bone placeholder:text-bone/30 transition-colors focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40 disabled:opacity-60';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className = '', ...rest }, ref) {
  return <input ref={ref} className={`${control} min-h-[44px] ${className}`} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className = '', ...rest }, ref) {
  return <textarea ref={ref} className={`${control} min-h-[110px] resize-y leading-relaxed ${className}`} {...rest} />;
});

export function Select({ className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${control} min-h-[44px] appearance-none bg-[length:12px] bg-[right_0.9rem_center] bg-no-repeat pr-9 ${className}`} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%23D4AF37'/%3E%3C/svg%3E\")" }} {...rest}>
      {children}
    </select>
  );
}

export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer text-[0.95rem] text-bone">
          {label}
        </label>
        {description && <p className="mt-0.5 text-xs leading-relaxed text-bone/45">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-50 ${
          checked ? 'border-gold bg-gold/80' : 'border-bone/25 bg-bone/10'
        }`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-bone shadow transition-transform ${checked ? 'translate-x-[1.35rem]' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

/* ── Layout pieces ───────────────────────────────────────────────────────── */

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: ReactNode; actions?: ReactNode; eyebrow?: string }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 font-sans text-[0.7rem] uppercase tracking-[0.2em] text-gold">{eyebrow}</p>}
        <h1 className="font-display text-[1.9rem] leading-tight text-bone sm:text-[2.3rem]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bone/55">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ children, className = '', title, actions }: { children: ReactNode; className?: string; title?: string; actions?: ReactNode }) {
  return (
    <section className={`rounded-sm border border-bone/10 bg-[#141312] ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-bone/10 px-4 py-3 sm:px-5">
          {title && <h2 className="font-sans text-[0.75rem] font-medium uppercase tracking-[0.18em] text-bone/70">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

const BADGE: Record<string, string> = {
  gold: 'border-gold/40 bg-gold/10 text-gold',
  green: 'border-[#8FBF8F]/40 bg-[#8FBF8F]/10 text-[#A9D3A9]',
  red: 'border-[#E8A598]/40 bg-[#E8A598]/10 text-[#E8A598]',
  grey: 'border-bone/15 bg-bone/5 text-bone/60',
  blue: 'border-[#8FB3D9]/40 bg-[#8FB3D9]/10 text-[#A9C6E6]',
};

export function Badge({ children, tone = 'grey' }: { children: ReactNode; tone?: keyof typeof BADGE }) {
  return <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-sans text-[0.68rem] font-medium uppercase tracking-[0.12em] ${BADGE[tone]}`}>{children}</span>;
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-bone/15 px-6 py-14 text-center">
      <p className="font-display text-xl text-bone/80">{title}</p>
      {body && <p className="mt-2 max-w-sm text-sm text-bone/45">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ── Toasts ──────────────────────────────────────────────────────────────── */

type Toast = { id: number; tone: 'success' | 'error' | 'info'; text: string };
const ToastContext = createContext<(tone: Toast['tone'], text: string) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((tone: Toast['tone'], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 7000 : 3500);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto w-full max-w-sm rounded-sm border px-4 py-3 text-sm shadow-2xl backdrop-blur ${
              t.tone === 'success' ? 'border-gold/40 bg-[#1b1810]/95 text-bone' : t.tone === 'error' ? 'border-[#E8A598]/40 bg-[#1f1413]/95 text-[#F3D0C8]' : 'border-bone/15 bg-[#141312]/95 text-bone'
            }`}
          >
            {t.tone === 'success' ? '✓ ' : t.tone === 'error' ? '! ' : ''}
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/* ── Confirm dialog ──────────────────────────────────────────────────────── */

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  tone = 'danger',
  onConfirm,
  onCancel,
  busy,
  requireText,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  /** Ask the user to type this exact text before confirming (for irreversible actions). */
  requireText?: string;
}) {
  const [typed, setTyped] = useState('');
  useEffect(() => {
    if (!open) setTyped('');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && open && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);
  if (!open) return null;
  const blocked = !!requireText && typed.trim() !== requireText;
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[90] flex items-end justify-center bg-night/80 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="w-full max-w-md rounded-t-md border border-bone/15 bg-[#141312] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-sm sm:p-6">
        <h2 className="font-display text-2xl text-bone">{title}</h2>
        <div className="mt-3 text-sm leading-relaxed text-bone/65">{body}</div>
        {requireText && (
          <div className="mt-4">
            <Field label={`Type “${requireText}” to confirm`}>
              <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
            </Field>
          </div>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} busy={busy} disabled={blocked}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
