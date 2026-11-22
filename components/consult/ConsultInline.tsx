import type { Dictionary } from '@/lib/i18n';
import ConsultButton from './ConsultButton';
import type { ProjectType } from './ConsultProvider';

const Check = () => (
  <svg viewBox="0 0 24 24" className="mt-1 h-4 w-4 shrink-0 text-gold" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

function Gold({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/g).filter(Boolean).map((p, i) => (p.startsWith('*') && p.endsWith('*') ? <span key={i} className="display-italic text-gold">{p.slice(1, -1)}</span> : <span key={i}>{p}</span>))}
    </>
  );
}

/**
 * The offer in the middle of an article, placed between two sections so it reads as part of
 * the page, not an ad. Static HTML (cached with the article); only the button is interactive.
 * phone: stacked · tablet and desktop: the promise left, the button right.
 */
export function ConsultInline({ t, title, projectType }: { t: Dictionary; title: string; projectType?: ProjectType }) {
  const c = t.consult;
  return (
    <aside data-consult-inline className="relative my-14 overflow-hidden border border-gold/30 bg-gradient-to-br from-gold/[0.07] via-transparent to-transparent p-6 sm:p-8 md:my-16" aria-label={c.inlineEyebrow}>
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-gold/10" />
      <span aria-hidden className="pointer-events-none absolute -right-2 -top-2 h-24 w-24 rounded-full border border-gold/10" />
      <p className="label flex items-center gap-2.5 text-gold">
        <span className="h-px w-6 bg-gold" aria-hidden />
        {c.inlineEyebrow}
      </p>
      <div className="mt-5 grid gap-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-10">
        <div>
          <p className="display text-[clamp(1.6rem,3.4vw,2.2rem)] leading-[1.1]">
            <Gold text={c.inlineTitle} />
          </p>
          <ul className="mt-5 space-y-2.5 text-[0.98rem] leading-snug text-bone/75">
            {[c.point1, c.point2, c.point3].map((p) => (
              <li key={p} className="flex gap-3">
                <Check />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:text-right">
          <ConsultButton trigger="in-article" title={title} projectType={projectType} className="btn btn-solid w-full md:w-auto">
            {c.inlineCta}
          </ConsultButton>
          <p className="mt-3 text-xs text-bone/45">{c.stayNote}</p>
        </div>
      </div>
    </aside>
  );
}

/** Desktop sidebar: a quiet, always-available version under the share buttons. */
export function ConsultSideCard({ t, title, projectType }: { t: Dictionary; title: string; projectType?: ProjectType }) {
  const c = t.consult;
  return (
    <div className="mt-10 border border-gold/25 p-5">
      <p className="label text-gold">{c.sideTitle}</p>
      <p className="mt-3 text-sm leading-relaxed text-bone/65">{c.sideBody}</p>
      <ConsultButton trigger="sidebar" title={title} projectType={projectType} className="btn mt-5 w-full px-4 py-3">
        {c.sideCta}
      </ConsultButton>
    </div>
  );
}

/** Category of an article → the kind of project its readers likely have. */
export function projectTypeFor(category?: string): ProjectType | undefined {
  if (!category) return undefined;
  if (/interior/.test(category)) return 'interior';
  if (/visuali|render|3d/.test(category)) return 'visualization';
  return undefined;
}
