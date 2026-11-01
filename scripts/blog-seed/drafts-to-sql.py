"""
Turn the articles in docs/seo/articles/*.md into SQL for Supabase.

    python3 -I scripts/blog-seed/drafts-to-sql.py           > scripts/db/articles-drafts.sql   (unpublished drafts)
    python3 -I scripts/blog-seed/drafts-to-sql.py --publish > scripts/db/articles-publish.sql  (live)

Both are safe to re-run. A post is found by its English slug: if it exists (e.g. inserted as a
draft earlier) it is updated in place, otherwise it is created. Any remaining ⟦VARI⟧
placeholder becomes a highlighted paragraph, and --publish refuses to run while one is left.
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
    ('3d-visualization', {'en': ('04-what-is-architectural-visualization.en.md',
        'What architectural visualization is, how a render is made, the formats it comes in, who uses it and why, explained by a studio that makes them every day.',
        ['Architectural visualization shows a design before it exists, mostly as computer-generated images, films or interactive models.',
         'It serves design, decisions, competitions and approvals, and sales.',
         'Every image follows the same steps: model, materials, light, camera, rendering, post-production.',
         'Good visualization is accurate and consistent across a series, not just beautiful.'])}),
    ('guides', {'en': ('05-best-rendering-software.en.md',
        'V-Ray, Corona, Enscape, D5, Lumion, Twinmotion, Unreal and Blender compared: what each is best at, how they fit your workflow, and how to choose between them.',
        ['There is no single best renderer, only the best fit for your workflow and deliverables.',
         'Production renderers (V-Ray, Corona) lead for final stills; real-time tools for reviews and animation.',
         'Twinmotion is free for companies under US$1 million revenue; Blender is free and open source.',
         'Start from your modelling tool and what you deliver most.'])}),
    ('guides', {'en': ('06-outsourcing-architectural-rendering.en.md',
        'When to outsource visualization, what it really costs compared with in-house, how to brief a remote studio, and how time zones, revisions and rights work.',
        ['Outsourcing pays off for uneven demand, high-stakes images and formats your team does not produce.',
         'A complete handover (drawings, materials, context, references, purpose) decides the result.',
         'Staged approvals, starting with draft cameras, prevent costly rework.',
         'Shared working hours and a common language matter more than overnight promises.'])}),
    ('interior-design', {'en': ('07-architect-vs-interior-designer.en.md',
        'Who does what, where the legal lines are, how fees usually work, and which professional your project needs: a clear guide for homeowners and businesses.',
        ['Architects design buildings and are accountable for structure, safety and approvals.',
         'Interior architects work on interiors with a reach into construction; interior designers shape layout, finishes and atmosphere.',
         'What your project changes decides who you need: new building, structural change, fit-out or refresh.',
         'Professional titles are protected differently by country; check local rules.'])}),
    ('guides', {
        'en': ('03-best-visualization-studios.en.md',
               'Six visualization studios the industry keeps recognizing, what each is known for, and how to choose the right one for your project, with sources for every claim.',
               ['Most "best studio" lists are written by studios that rank themselves first.',
                'This guide includes a studio only if an independent publication or industry award recognised it.',
                'Art-led studios, campaign studios and long-established studios serve different projects.',
                'Choose by what the images must do, portfolio fit, collaboration and budget, not by a ranking.']),
    }),
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


# Cover image per post (portfolio media ids) and its alt text per language.
COVERS = {
    'what-is-architectural-visualization': ('8b4d4f_52780c64f74a4a3dac703141b59358c2~mv2.png', {'en': 'Daylight visualization of the timber-clad HNE Laboratory in Germany, framed by trees and people for scale'}),
    'best-rendering-software-for-architecture': ('8b4d4f_2762a08d2c794d689b134249fc6cabac~mv2.png', {'en': 'Dark penthouse living room lit by recessed downlights and linear LED strips, rendered by VARI Studio'}),
    'outsourcing-architectural-rendering': ('8b4d4f_d8c978fb79044dd5b22cf9f8edca55b7~mv2.png', {'en': 'Roof & Garden, an exterior residential visualization by VARI Studio'}),
    'architect-vs-interior-architect-vs-interior-designer': ('b80319_962a6cc04617409f94ea031705d4ee66~mv2.png', {'en': 'Vaulted timber living room with a stone fireplace in Hearthstone Haven, Telemark, Norway'}),
    'best-architectural-visualization-studios': ('b80319_425c2f36f32b420da9c91cbd856c607d~mv2.jpg',
                           {'en': 'The Urban Nest, a terraced residential project in the Netherlands with cascading greenery, visualized by VARI Studio'}),
    'renders-vs-reality': ('8b4d4f_525775bc11554914a009fed0206e2afc~mv2.png',
                           {'en': 'Black Home exterior under an overcast sky with warm light glowing in every window, a common rendering convention',
                            'de': 'Außenansicht von Black Home unter bewölktem Himmel, alle Fenster warm beleuchtet: eine typische Rendering-Konvention'}),
    'ai-architectural-rendering-vs-studio': ('8b4d4f_df3765a13fea45d5ba0da2dc00f8b694~mv2.png',
                           {'en': 'Night courtyard with an illuminated water curtain reflected in a dark pool, rendered by VARI Studio',
                            'de': 'Innenhof bei Nacht mit beleuchtetem Wasservorhang, der sich im dunklen Becken spiegelt, visualisiert von VARI Studio'}),
}


def main():
    publish = '--publish' in sys.argv
    # --only <english-slug>[,<slug>…]: emit just that post, so republishing one article never touches
    # edits made to the others in the panel.
    only = set(sys.argv[sys.argv.index('--only') + 1].split(',')) if '--only' in sys.argv else None
    if publish:
        print('-- Publishes the finished articles (author: VARI Studio). Generated by scripts/blog-seed/drafts-to-sql.py --publish.')
        print('-- Updates the drafts inserted earlier (matched by English slug) or creates them. Safe to re-run.')
        print('-- German translations are stored as ready but stay invisible until German is switched on.\n')
    else:
        print('-- Article drafts generated by scripts/blog-seed/drafts-to-sql.py: UNPUBLISHED (status draft, ready = false).')
        print('-- Safe to re-run: a post found by its English slug is updated in place.\n')
    for category, langs in POSTS:
        parsed = {l: (parse(ARTICLES / f), ex, tk) for l, (f, ex, tk) in langs.items()}
        en = parsed['en'][0]
        if only and en['slug'] not in only:
            continue
        if publish and any('⟦' in p['html'] for p, _, _ in parsed.values()):
            sys.exit(f"{en['slug']}: resolve the ⟦VARI⟧ placeholders before publishing")
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
        cover, cover_alt = COVERS.get(en['slug'], (None, {}))
        alt = {l: a for l, a in cover_alt.items() if l in parsed}
        ready = 'true' if publish else 'false'
        rows = []
        for l, (p, excerpt, takeaways) in parsed.items():
            rows.append('(pid, ' + ', '.join([q(l), q(p['slug']), q(p['title']), q(excerpt), q(p['html']), q(json.dumps(takeaways, ensure_ascii=False)) + '::jsonb',
                                             q(p['seo_title']), q(p['seo_desc']), q(p['focus']), ready, str(p['words'])]) + ')')
        status = "'published', publish_at = coalesce(publish_at, now())" if publish else "'draft'"
        print(f"-- {en['title']}  ({', '.join(parsed)})")
        print(f"""do $do$
declare pid uuid;
begin
  select post_id into pid from public.blog_post_translations where locale = 'en' and slug = {q(en['slug'])};
  if pid is null then
    insert into public.blog_posts (status) values ('draft') returning id into pid;
  end if;
  update public.blog_posts set
    status = {status},
    category_id = (select id from public.blog_categories where slug = {q(category)}),
    author_id = (select id from public.blog_authors where slug = 'vari-studio'),
    cover = {q(cover) if cover else 'cover'},
    cover_alt = {q(json.dumps(alt, ensure_ascii=False)) + '::jsonb' if alt else 'cover_alt'},
    faq = {q(json.dumps(faq, ensure_ascii=False))}::jsonb
  where id = pid;
  insert into public.blog_post_translations (post_id, locale, slug, title, excerpt, html, takeaways, seo_title, seo_description, focus_keyword, ready, word_count)
  values
  {(','+chr(10)+'  ').join(rows)}
  on conflict (post_id, locale) do update set
    slug = excluded.slug, title = excluded.title, excerpt = excluded.excerpt, html = excluded.html, content = null,
    takeaways = excluded.takeaways, seo_title = excluded.seo_title, seo_description = excluded.seo_description,
    focus_keyword = excluded.focus_keyword, ready = excluded.ready, word_count = excluded.word_count;
end
$do$;
""")


if __name__ == '__main__':
    sys.exit(main())
