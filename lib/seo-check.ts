import { textOf } from './blog-html';
import { postSlug } from './blog-slug';

/** On-page SEO checks for one translation of an article (shown live in the editor). */
export type Check = { ok: boolean; label: string; tip: string; weight: number };

/** Words needed for the same depth of content, relative to English. */
const WORD_FACTOR: Record<string, number> = { tr: 0.75, fi: 0.75, hu: 0.8, ja: 0.6, zh: 0.6 };
const norm = (s: string) => s.toLowerCase().replace(/ı/g, 'i').normalize('NFKD').replace(/[̀-ͯ]/g, '');
/** Search engines match keyword words in any order: the exact phrase, or every meaningful word. */
const words = (kw: string) => kw.split(/\s+/).filter((w) => w.length > 3);
const has = (text: string, kw: string) => !!kw && (text.includes(kw) || (words(kw).length > 0 && words(kw).every((w) => text.includes(w))));

export function seoChecks(t: { title: string; slug: string; excerpt: string; html: string; seoTitle: string; seoDescription: string; focus: string; takeaways: string[] }, opts: { hasCover: boolean; hasCoverAlt: boolean; faqCount: number; locale?: string }): { checks: Check[]; score: number } {
  const kw = norm(t.focus.trim());
  const text = textOf(t.html);
  const wordCount = text ? text.split(/\s+/).length : 0;
  const first = norm(textOf((t.html.match(/<p[^>]*>[\s\S]*?<\/p>/) || [''])[0]));
  const headings = [...t.html.matchAll(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/g)].map((m) => norm(textOf(m[2])));
  const h2 = (t.html.match(/<h2/g) || []).length;
  const imgs = [...t.html.matchAll(/<img[^>]*>/g)].map((m) => m[0]);
  const imgsNoAlt = imgs.filter((i) => !/alt="[^"]+"/.test(i)).length;
  const links = [...t.html.matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => m[1]);
  const internal = links.filter((h) => h.startsWith('/') || /vari-studio\.com/.test(h)).length;
  const external = links.filter((h) => /^https?:/.test(h) && !/vari-studio\.com/.test(h)).length;
  const title = t.seoTitle || t.title;
  const desc = t.seoDescription || t.excerpt;
  // Density: how often the keyword's words appear together, relative to the text length.
  const body = norm(text);
  const count = (w: string) => (body.match(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  const occurrences = kw ? Math.min(...(words(kw).length ? words(kw) : [kw]).map(count)) : 0;
  const density = wordCount ? (occurrences * Math.max(1, words(kw).length) * 100) / wordCount : 0;
  const sentences = text.split(/[.!?]+\s/).filter((s) => s.trim().length > 0);
  const avgSentence = sentences.length ? wordCount / sentences.length : 0;
  const slugKw = postSlug(t.focus, opts.locale);
  // Agglutinative languages say the same thing in fewer, longer words (Turkish ≈ 25% fewer than English).
  const minWords = Math.round(900 * (WORD_FACTOR[opts.locale || ''] ?? 1));

  const checks: Check[] = [
    { ok: !!kw, label: 'Focus keyword set', tip: 'Choose the main search phrase this article should rank for.', weight: 2 },
    { ok: has(norm(title), kw), label: 'Keyword in the SEO title', tip: 'Put the focus keyword in the title, ideally near the start.', weight: 3 },
    { ok: title.length >= 30 && title.length <= 62, label: `SEO title length (${title.length}/60)`, tip: 'Aim for 30–60 characters so Google shows it in full.', weight: 2 },
    { ok: has(norm(desc), kw), label: 'Keyword in the meta description', tip: 'Mention the keyword naturally in the description.', weight: 2 },
    { ok: desc.length >= 110 && desc.length <= 165, label: `Meta description length (${desc.length}/160)`, tip: 'Aim for 120–160 characters — the snippet people read in Google.', weight: 2 },
    { ok: !!kw && (t.slug.includes(slugKw) || slugKw.split('-').filter((w) => w.length > 3).every((w) => t.slug.includes(w))), label: 'Keyword in the address', tip: 'Short address that contains the keyword, e.g. /blog/3d-rendering-cost.', weight: 1 },
    { ok: has(first, kw), label: 'Keyword in the first paragraph', tip: 'Use the keyword in the opening paragraph.', weight: 2 },
    { ok: !!kw && headings.some((h) => has(h, kw)), label: 'Keyword in a sub-heading', tip: 'Use the keyword (or its words) in at least one H2/H3.', weight: 1 },
    { ok: !kw || (density >= 0.4 && density <= 2.8), label: `Keyword density ${density.toFixed(1)}%`, tip: 'Between about 0.5% and 2.5% — natural use, no stuffing.', weight: 1 },
    { ok: wordCount >= minWords, label: `Length: ${wordCount} words`, tip: `In-depth guides (${minWords}–${Math.round(minWords * 2.8)} words) rank better for informational searches.`, weight: 2 },
    { ok: h2 >= 3, label: `Structure: ${h2} H2 sections`, tip: 'Break the article into at least three H2 sections.', weight: 1 },
    { ok: internal >= 2, label: `Internal links: ${internal}`, tip: 'Link to at least two of your pages (services, projects, other articles).', weight: 2 },
    { ok: external >= 1, label: `External sources: ${external}`, tip: 'Cite at least one trustworthy external source.', weight: 1 },
    { ok: opts.hasCover && opts.hasCoverAlt, label: 'Cover image with alt text', tip: 'A cover image with a description improves sharing and image search.', weight: 1 },
    { ok: imgs.length > 0 && imgsNoAlt === 0, label: imgs.length ? `Images with alt text (${imgs.length - imgsNoAlt}/${imgs.length})` : 'Images in the article', tip: 'Add images and describe each one in its alt text.', weight: 1 },
    { ok: t.takeaways.filter(Boolean).length >= 3, label: 'Key takeaways', tip: 'Three to five takeaways help readers — and AI answers — summarise the article.', weight: 1 },
    { ok: opts.faqCount >= 2, label: 'FAQ section', tip: 'Two or more questions can earn extra space in Google results.', weight: 1 },
    { ok: avgSentence > 0 && avgSentence <= 24, label: `Readability: ${avgSentence.toFixed(0)} words per sentence`, tip: 'Keep sentences short — under about 20–24 words on average.', weight: 1 },
  ];
  const total = checks.reduce((n, c) => n + c.weight, 0);
  const score = Math.round((checks.filter((c) => c.ok).reduce((n, c) => n + c.weight, 0) * 100) / total);
  return { checks, score };
}

/** Fingerprint of the English text — translations remember which version they were made from. */
export function sourceHash(parts: string[]) {
  let h = 5381;
  const s = parts.join('\u0001');
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
