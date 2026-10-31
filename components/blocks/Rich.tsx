import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';

/**
 * Tiny, safe markdown for builder texts — rendered as React elements, never as HTML.
 *   **bold**  *italic*  [label](https://… or /path)  "## " sub-heading  "- " / "1. " lists
 * Blank lines separate paragraphs.
 */

type Localize = (href: string) => string;

function inline(text: string, localize: Localize, key = 'i'): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${n++}`;
    if (m[1]) out.push(<strong key={k} className="font-medium text-current">{m[1]}</strong>);
    else if (m[2]) out.push(<em key={k} className="display-italic text-gold">{m[2]}</em>);
    else if (m[3]) out.push(<SmartLink key={k} href={m[4]} localize={localize} className="link-line text-gold">{m[3]}</SmartLink>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function SmartLink({ href, localize, className, children }: { href: string; localize: Localize; className?: string; children: ReactNode }) {
  const h = href.trim();
  if (/^javascript:/i.test(h)) return <>{children}</>;
  if (/^(https?:)?\/\//i.test(h)) return <a href={h} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
  if (/^(mailto:|tel:|#)/i.test(h)) return <a href={h} className={className}>{children}</a>;
  return <Link href={localize(h.startsWith('/') ? h : `/${h}`)} className={className}>{children}</Link>;
}

export function RichText({ text, localize, className = '' }: { text: string; localize: Localize; className?: string }) {
  const blocks = text.replace(/\r/g, '').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className={`space-y-5 ${className}`}>
      {blocks.map((b, i) => {
        const lines = b.split('\n');
        if (b.startsWith('## ')) return <h3 key={i} className="display h-md pt-2 text-current">{inline(b.slice(3), localize, `h${i}`)}</h3>;
        if (lines.every((l) => /^[-•]\s/.test(l)))
          return (
            <ul key={i} className="space-y-2">
              {lines.map((l, j) => (
                <li key={j} className="relative pl-6 before:absolute before:left-0 before:top-[0.7em] before:h-px before:w-3 before:bg-gold">
                  {inline(l.replace(/^[-•]\s/, ''), localize, `u${i}${j}`)}
                </li>
              ))}
            </ul>
          );
        if (lines.every((l) => /^\d+[.)]\s/.test(l)))
          return (
            <ol key={i} className="space-y-2">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-4">
                  <span className="label pt-[0.3em] text-gold">{String(j + 1).padStart(2, '0')}</span>
                  <span>{inline(l.replace(/^\d+[.)]\s/, ''), localize, `o${i}${j}`)}</span>
                </li>
              ))}
            </ol>
          );
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l, localize, `p${i}${j}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/** Title with *gold italic* words, matching the site's headline style. */
export function Title({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('*') && p.endsWith('*') && p.length > 2 ? (
          <span key={i} className="display-italic text-gold">
            {p.slice(1, -1)}
          </span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

/** Plain text of a title (for alt texts, aria labels, SEO). */
export const plain = (s: string) => s.replace(/\*\*?([^*]+)\*\*?/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
