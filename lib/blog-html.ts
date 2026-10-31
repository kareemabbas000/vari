import sanitizeHtml from 'sanitize-html';

/**
 * Article HTML for the website. The panel stores the editor's HTML; here it is sanitized
 * again (only the elements the editor can produce survive), headings get ids for the
 * table of contents, external links open safely in a new tab and internal links get the
 * language prefix.
 */

export type TocItem = { id: string; text: string; level: 2 | 3 };

const VIDEO_HOSTS = ['www.youtube-nocookie.com', 'www.youtube.com', 'player.vimeo.com'];

export function slugifyHeading(text: string) {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'section'
  );
}

const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');

export function renderArticle(html: string, localize: (path: string) => string): { html: string; toc: TocItem[] } {
  const clean = sanitizeHtml(html || '', {
    allowedTags: ['p', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'a', 'ul', 'ol', 'li', 'blockquote', 'figure', 'figcaption', 'img', 'hr', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'iframe', 'code', 'span'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      figure: ['data-figure', 'data-size'],
      div: ['data-callout', 'data-video', 'data-id'],
      p: ['data-cta', 'style'],
      h2: ['style'],
      h3: ['style'],
      h4: ['style'],
      th: ['colspan', 'rowspan'],
      td: ['colspan', 'rowspan'],
      iframe: ['src', 'title', 'allowfullscreen', 'loading'],
    },
    allowedStyles: { '*': { 'text-align': [/^(left|center|right)$/] } },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedIframeHostnames: VIDEO_HOSTS,
    allowProtocolRelative: false,
    transformTags: {
      a: (tag, attribs): sanitizeHtml.Tag => {
        const href = (attribs.href || '').trim();
        if (/^https?:\/\//i.test(href) && !/^https?:\/\/(www\.)?vari-studio\.com/i.test(href)) {
          return { tagName: 'a', attribs: { href, target: '_blank', rel: 'noopener noreferrer' } };
        }
        if (href.startsWith('/') && !/^\/(en|de|es)(\/|$)/.test(href)) return { tagName: 'a', attribs: { href: localize(href) } };
        return { tagName: 'a', attribs: { href } };
      },
      img: (tag, attribs) => ({ tagName: 'img', attribs: { ...attribs, loading: 'lazy', decoding: 'async' } as Record<string, string> }),
      iframe: (tag, attribs) => ({ tagName: 'iframe', attribs: { ...attribs, loading: 'lazy', allow: 'autoplay; fullscreen; picture-in-picture', allowfullscreen: 'true' } }),
    },
  });

  // Heading ids (unique) + table of contents.
  const toc: TocItem[] = [];
  const used = new Map<string, number>();
  const withIds = clean.replace(/<(h2|h3)([^>]*)>([\s\S]*?)<\/\1>/g, (_m, tag: string, attrs: string, inner: string) => {
    const text = decode(inner.replace(/<[^>]+>/g, '')).trim();
    let id = slugifyHeading(text);
    const n = used.get(id) ?? 0;
    used.set(id, n + 1);
    if (n) id = `${id}-${n + 1}`;
    toc.push({ id, text, level: tag === 'h2' ? 2 : 3 });
    return `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
  });
  return { html: withIds, toc };
}

/** Plain text (for word counts, SEO checks and reading time). */
export function textOf(html: string) {
  return decode((html || '').replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

export function readingMinutes(words: number) {
  return Math.max(1, Math.round(words / 220));
}
