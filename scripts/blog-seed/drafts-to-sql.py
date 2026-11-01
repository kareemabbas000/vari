"""
Turn the drafted articles in docs/seo/articles/*.md into SQL that inserts them as
UNPUBLISHED drafts (status 'draft', translations not ready) for the team to finish in
Panel → Blog. ⟦VARI⟧ placeholders become highlighted paragraphs so they can't be missed.

    python3 -I scripts/blog-seed/drafts-to-sql.py > scripts/db/articles-drafts.sql

Re-running the SQL is safe: a post is skipped when its English slug already exists.
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ARTICLES = ROOT / 'docs' / 'seo' / 'articles'


def inline(text: str) -> str:
    t = html.escape(text, quote=False)
    t = re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', lambda m: f'<a href="{html.escape(m.group(2))}">{m.group(1)}</a>', t)
    t = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<![\w*])\*([^*\n]+)\*(?![\w*])', r'<em>\1</em>', t)
    return t


def body_html(md: str) -> str:
    out, para, items = [], [], []

    def flush():
        nonlocal para, items
        if para:
            text = ' '.join(para)
            out.append(f'<p><mark>{inline(text)}</mark></p>' if '⟦VARI' in text else f'<p>{inline(text)}</p>')
        if items:
            out.append('<ul>' + ''.join(f'<li>{inline(i)}</li>' for i in items) + '</ul>')
        para, items = [], []

    for line in md.splitlines():
        s = line.rstrip()
        if not s.strip():
            flush()
            continue
        if s.startswith('### '):
            flush(); out.append(f'<h3>{inline(s[4:])}</h3>')
        elif s.startswith('## '):
            flush(); out.append(f'<h2>{inline(s[3:])}</h2>')
        elif s.lstrip().startswith('- '):
            if para:
                flush()
            items.append(s.lstrip()[2:])
        else:
            if items:
                flush()
            para.append(s.strip())
    flush()
    return '\n'.join(out)


def parse(path: Path):
    text = path.read_text(encoding='utf-8')
    article = text.split('\n## Article\n', 1)[1] if '\n## Article\n' in text else text.split('\n## Artikel\n', 1)[1]
    article = re.split(r'\n### (Editorial QA|Lektorat)', article)[0]
    title = re.search(r'^# (.+)$', article, re.M).group(1).strip()
    article = re.sub(r'^# .+$', '', article, count=1, flags=re.M)
    # FAQ → structured field; everything after it (references) stays as a "Sources" section.
    faq_head = re.search(r'^## (FAQ|Häufige Fragen)\s*$', article, re.M)
    faq, refs = [], ''
    if faq_head:
        before, after = article[: faq_head.start()], article[faq_head.end():]
        faq_part, _, refs = after.partition('\n---\n')
        for q, a in re.findall(r'\*\*(.+?)\*\*\n(.+?)(?=\n\n\*\*|\Z)', faq_part.strip(), re.S):
            faq.append({'q': q.strip(), 'a': ' '.join(a.split())})
        article = before
    refs = re.sub(r'^### (References|Quellen)\s*$', r'## \1', refs.strip(), flags=re.M)
    meta = dict(re.findall(r'^\| (Title tag|Title-Tag)[^|]*\| `([^`]+)` \|', text, re.M))
    seo_title = next(iter(meta.values()), title)
    seo_desc = re.search(r'^\| Meta [Dd]escription[^|]*\| `([^`]+)` \|', text, re.M).group(1)
    slug = re.search(r'^\| (URL slug|URL) \| `/(?:en|de)/blog/([^`]+)` \|', text, re.M).group(2)
    focus = re.search(r'^\| (Primary keyword|Haupt-Keyword) \| ([^|]+) \|', text, re.M).group(2).strip()
    html_body = body_html(article) + ('\n' + body_html(refs) if refs else '')
    words = len(re.sub(r'<[^>]+>', ' ', html_body).split())
    return dict(title=title, slug=slug, seo_title=seo_title, seo_desc=seo_desc, focus=focus.split(' (')[0], html=html_body, faq=faq, words=words)


POSTS = [
    # (category slug, {locale: (file, excerpt, takeaways)})
    ('3d-visualization', {
        'en': ('02-renders-vs-reality.en.md',
               'A render is a set of decisions, not a photograph. What lens, light, planting and editing change, and the questions buyers should ask before they sign.',
               ['Every render is an edited view: camera, lens, hour, planting and omissions are all choices.',
                'Wide lenses and low cameras make rooms look larger; compare every render with the dimensioned plan.',
                'Glowing windows, designed lighting and mature trees are conventions, so ask what the building looks like on an ordinary day.',
                'Courts have treated off-plan renders as part of what a buyer was shown, and disclaimers do not automatically neutralise them.']),
    }),
    ('3d-visualization', {
        'en': ('01-ai-rendering-vs-studio.en.md',
               'AI image tools changed early design work. Where AI architectural rendering is genuinely useful, where it breaks down, and when a studio still matters.',
               ['Generative AI excels at exploring options; 3D production excels at holding one design steady.',
                'AI images rarely keep a building consistent across several views. Test it yourself with three views of one house.',
                'If anyone will make a decision based on the image being accurate, use an image built from the drawings.',
                'AI is already part of professional pipelines, for example denoising and upscaling.']),
        'de': ('01-ai-rendering-vs-studio.de.md',
               'KI-Bilder sind schnell, aber nicht verbindlich. Wo KI in der Architekturvisualisierung hilft, wo sie scheitert und wann ein Studio unverzichtbar bleibt.',
               ['Generative KI ist stark in der Ideenfindung, die 3D-Visualisierung beim Festlegen eines Entwurfs.',
                'KI-Bilder zeigen dasselbe Gebäude selten über mehrere Ansichten hinweg gleich.',
                'Für Wettbewerb, Bauantrag und Vermarktung braucht es Bilder, die aus den Plänen entstehen.',
                'Rein KI-generierte Bilder sind nach herrschender Meinung urheberrechtlich nicht geschützt.']),
    }),
]


# English FAQ index → translated FAQ index, where the native translation orders or picks differently.
FAQ_MAP = {
    # DE: will-AI-replace, ChatGPT, developer marketing, copyright. There is no DE question on cost (EN #3).
    ('ai-architectural-rendering-vs-studio', 'de'): {0: 0, 1: 1, 2: 2, 3: None, 4: 3},
}


def q(s: str) -> str:
    return '$v$' + s.replace('$v$', '') + '$v$'


def main():
    print('-- Article drafts generated by scripts/blog-seed/drafts-to-sql.py: UNPUBLISHED (status draft, ready = false).')
    print('-- Finish them in Panel → Blog: resolve every highlighted ⟦VARI⟧ paragraph, set the author, add a cover image, then publish.')
    print('-- Safe to re-run: each post is skipped if its English slug already exists.\n')
    for category, langs in POSTS:
        parsed = {l: (parse(ARTICLES / f), ex, tk) for l, (f, ex, tk) in langs.items()}
        en = parsed['en'][0]
        faq = []
        for i, item in enumerate(en['faq']):
            entry = {'q': {'en': item['q']}, 'a': {'en': item['a']}}
            for l, (p, _, _) in parsed.items():
                # Which English FAQ each translated FAQ answers (they are written natively, not 1:1).
                j = FAQ_MAP.get((en['slug'], l), {}).get(i, i if l != 'en' else None)
                if l != 'en' and j is not None and j < len(p['faq']):
                    entry['q'][l] = p['faq'][j]['q']
                    entry['a'][l] = p['faq'][j]['a']
            faq.append(entry)
        rows = []
        for l, (p, excerpt, takeaways) in parsed.items():
            rows.append('(' + ', '.join([q(l), q(p['slug']), q(p['title']), q(excerpt), q(p['html']), q(json.dumps(takeaways, ensure_ascii=False)) + '::jsonb',
                                         q(p['seo_title']), q(p['seo_desc']), q(p['focus']), str(p['words'])]) + ')')
        print(f"-- {en['title']}  ({', '.join(parsed)})")
        print(f"""with post as (
  insert into public.blog_posts (status, category_id, author_id, faq)
  select 'draft', (select id from public.blog_categories where slug = {q(category)}), (select id from public.blog_authors where slug = 'vari-studio'), {q(json.dumps(faq, ensure_ascii=False))}::jsonb
  where not exists (select 1 from public.blog_post_translations where locale = 'en' and slug = {q(en['slug'])})
  returning id
)
insert into public.blog_post_translations (post_id, locale, slug, title, excerpt, html, takeaways, seo_title, seo_description, focus_keyword, ready, word_count)
select post.id, v.locale, v.slug, v.title, v.excerpt, v.html, v.takeaways, v.seo_title, v.seo_description, v.focus, false, v.words
from post, (values
  {(','+chr(10)+'  ').join(rows)}
) as v(locale, slug, title, excerpt, html, takeaways, seo_title, seo_description, focus, words);
""")


if __name__ == '__main__':
    sys.exit(main())
