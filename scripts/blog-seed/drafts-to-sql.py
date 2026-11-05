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
    ordered = False

    def flush():
        nonlocal para, items, ordered
        if para:
            text = ' '.join(para)
            out.append(f'<p><mark>{inline(text)}</mark></p>' if '⟦VARI' in text else f'<p>{inline(text)}</p>')
        if items:
            tag = 'ol' if ordered else 'ul'
            out.append(f'<{tag}>' + ''.join(f'<li>{inline(i)}</li>' for i in items) + f'</{tag}>')
        para, items = [], []

    table = []

    def flush_table():
        nonlocal table
        rows = [[c.strip() for c in r.strip().strip('|').split('|')] for r in table if not re.match(r'^\|\s*:?-{3,}', r.strip())]
        if rows:
            head, body = rows[0], rows[1:]
            out.append('<table><thead><tr>' + ''.join(f'<th>{inline(c)}</th>' for c in head) + '</tr></thead><tbody>'
                       + ''.join('<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in r) + '</tr>' for r in body) + '</tbody></table>')
        table = []

    for line in md.splitlines():
        s = line.rstrip()
        if s.lstrip().startswith('|'):
            flush()
            table.append(s)
            continue
        if table:
            flush_table()
        if not s.strip():
            flush()
            continue
        if s.startswith('### '):
            flush(); out.append(f'<h3>{inline(s[4:])}</h3>')
        elif s.startswith('## '):
            flush(); out.append(f'<h2>{inline(s[3:])}</h2>')
        elif s.lstrip().startswith('- ') or re.match(r'\s*\d+\. ', s):
            is_ol = bool(re.match(r'\s*\d+\. ', s))
            if para or (items and is_ol != ordered):
                flush()
            ordered = is_ol
            items.append(re.sub(r'^\s*(?:- |\d+\. )', '', s))
        else:
            if items:
                flush()
            para.append(s.strip())
    flush()
    if table:
        flush_table()
    return '\n'.join(out)


def parse(path: Path):
    text = path.read_text(encoding='utf-8')
    article = text.split('\n## Article\n', 1)[1] if '\n## Article\n' in text else text.split('\n## Artikel\n', 1)[1]
    article = re.split(r'\n### (Editorial QA|Lektorat)', article)[0]
    title = re.search(r'^# (.+)$', article, re.M).group(1).strip()
    article = re.sub(r'^# .+$', '', article, count=1, flags=re.M)
    # FAQ → structured field; everything after it (references) stays as a "Sources" section.
    faq_head = re.search(r'^## (FAQ|Häufige Fragen|Preguntas frecuentes|Sıkça sorulan sorular)\s*$', article, re.M)
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
    slug = re.search(r'^\| (URL slug|URL) \| `/[a-z]{2}/blog/([^`]+)` \|', text, re.M).group(2)
    focus = re.search(r'^\| (Primary keyword|Haupt-Keyword) \| ([^|]+) \|', text, re.M).group(2).strip()
    refs_html = body_html(refs) if refs else ''
    # Sources are written as bare addresses (archdaily.com/941488); make each a real, clickable link.
    refs_html = re.sub(r'(?<![\w/">])((?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|org|de|at|net|io|co|ai|archi)(?:/[^\s<,;·)…]*)?)',
                       lambda m: f'<a href="https://{m.group(1).rstrip(".")}">{m.group(1).rstrip(".")}</a>', refs_html)
    html_body = body_html(article) + ('\n' + refs_html if refs_html else '')
    words = len(re.sub(r'<[^>]+>', ' ', html_body).split())
    # Optional, used by translated files: excerpt, cover alt text and takeaways live in the file itself.
    excerpt = (re.search(r'^\| Excerpt \| `([^`]+)` \|', text, re.M) or [None, None])[1]
    cover_alt = (re.search(r'^\| Cover alt \| `([^`]+)` \|', text, re.M) or [None, None])[1]
    tk = re.search(r'^### Takeaways\n((?:- .+\n)+)', text, re.M)
    takeaways = [l[2:].strip() for l in tk.group(1).splitlines()] if tk else None
    return dict(title=title, slug=slug, seo_title=seo_title, seo_desc=seo_desc, focus=focus.split(' (')[0].split(' · ')[0].strip(), html=html_body, faq=faq, words=words,
                excerpt=excerpt, cover_alt=cover_alt, takeaways=takeaways)


POSTS = [
    ('guides', {'en': ('08-best-3d-rendering-companies-2026.en.md',
        "The 3D rendering companies and visualization studios that won the industry's own awards, what the 2024–2025 results reveal, and how to use them in 2026.",
        ['SALTVISION (Belgium) was CGArchitect Studio of the Year 2025; Brick Visual (Hungary) in 2024.',
         'Recent winners and nominees come from more than a dozen countries, including Egypt and Ukraine.',
         'Film and interactive work are gaining ground in the awards.',
         'Use award lists to shortlist, then judge full portfolios against your own project.'])}),
    ('guides', {'en': ('09-top-3d-visualization-companies.en.md',
        'The top 3D visualization companies are not all studios. A map of the industry: award-winning studios, the software makers behind them, and where to find talent.',
        ['Visualization studios make the images; software makers such as Chaos and Epic Games make the tools.',
         'Directories such as Clutch and GoodFirms are useful for breadth but need verification.',
         'Large architecture firms often run in-house visualization teams and outsource peaks.',
         'Decide which kind of company you need before you shortlist.'])}),
    ('guides', {'en': ('10-top-3d-visualization-companies-germany.en.md',
        'German 3D visualization studios with verifiable track records, their award-winning DACH neighbours, and what to check before hiring for a German project.',
        ['bloomimages, xoio and gmsvision are established German studios with verifiable track records.',
         'Nightnurse Images (Switzerland) and bildform.at (Austria) have recent international award recognition.',
         'German projects demand images that match the plans and respect competition rules.',
         'Published 2026 guides put a professional still in Germany at roughly €250 to €3,000.'])}),
    ('guides', {'en': ('11-top-3d-visualization-companies-united-states.en.md',
        "American 3D visualization studios recognized by the industry's awards and independent sources, what US projects need from a studio, and what renders cost.",
        ['DBOX, Brooklyn Digital Foundry, Neoscape, Kilograph and Fortes.Vision each have independent recognition.',
         'US projects need imperial drawings, US products and marketing at scale.',
         'Published 2026 guides put a professional still at roughly US$600 to US$2,500.',
         'Studios abroad can work while your office is closed if review times are agreed.'])}),
    ('guides', {'en': ('12-top-3d-visualization-studios-europe.en.md',
        "Europe's top 3D visualization studios, country by country, chosen by the industry's own awards and press, with what to check before hiring across borders.",
        ['Recent Studio of the Year titles went to SALTVISION (Belgium) and Brick Visual (Hungary).',
         'The UK, Ukraine, Italy, Spain, Portugal and Estonia all have recent award winners or nominees.',
         'Specialities differ: film, interactive work or stills.',
         'Agree language, revisions and usage rights in writing for cross-border projects.'])}),
    ('interior-design', {'en': ('13-3d-visualization-interior-design.en.md',
        'How 3D visualization helps interior designers and clients decide layout, scale, materials, lighting and budget before anything is ordered, with real examples.',
        ['Visualization moves expensive decisions forward, to when changes are cheap.',
         'Eye-level views and real furniture sizes make layout and scale easy to judge.',
         'Materials and lighting are best chosen together, in context and at different times of day.',
         'Rendering alternatives from the same camera makes budget trade-offs visible.'])}),
    ('interior-design', {'en': ('14-3d-visualization-interior-design-united-states.en.md',
        'How US interior designers, builders and developers use 3D visualization: imperial drawings, US products, costs in dollars, time zones and choosing a studio.',
        ['US designers, home builders, multifamily developers and hospitality teams all rely on interior visualization.',
         'Make sure the studio models in your original imperial units and uses the US products you specify.',
         'Published 2026 guides put a professional still at roughly US$600 to US$2,500.',
         'Time differences can speed work up if review times are agreed in advance.'])}),
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
    ('interior-design', {'en': ('15-best-interior-design-firms-world.en.md',
        'The best interior design firms in the world by the numbers: the biggest firms by fees in 2026, the studios their peers award, and how to choose the right one.',
        ["Gensler is the world's biggest interior design firm by fees: US$969.7 million in 2025, more than 2.6 times the next firm.", 'The Top 100 Giants ranking measures size, not taste, and only counts firms with a North American presence.', "Award juries point to design-led studios such as Dimorestudio, Dezeen's interior designer of the year 2025.", 'Choose by sector and project size: a global giant for a 40-floor office, a boutique studio for a home.'])}),
    ('interior-design', {'en': ('16-best-interior-design-firms-europe.en.md',
        'The best interior design firms in Europe, country by country: studios recognised by Dezeen, Iconic, FRAME and other juries, with a full section on Germany.',
        ["Europe's interior design scene is led by mid-sized, design-led studios rather than the giant firms that dominate the US.", "In 2025, Dimorestudio (Milan) was Dezeen's interior designer of the year and Lucas Muñoz Muñoz (Madrid) won the Iconic Awards title.", "Germany's most decorated studios include Ippolito Fleitz Group, JOI-Design, Studio Aisslinger and Landau + Kindelbacher.", 'In Germany, "Innenarchitekt" is a protected title: check the chamber registration before you hire.'])}),
    ('3d-visualization', {'en': ('17-virtual-staging.en.md',
        "Virtual staging explained: what it costs per photo, what NAR's 2025 data says about staging, and the 2026 disclosure rules in the US, UK and EU.",
        ["83% of buyers' agents say staging helps buyers picture a home as their own (NAR, 2025).", 'Physical staging has a median cost of US$1,500; human-designed virtual staging typically costs US$16 to US$50 per photo.', 'Since 1 January 2026, California requires altered listing photos to be labelled and the original to be shown.', 'Virtual staging may add furniture, never hide flaws: changing walls, floors, views or defects is misleading.'])}),
    ('interior-design', {'en': ('18-interior-designer-cost.en.md',
        'How much does an interior designer cost in 2026? US and UK prices by hour, per square foot and per project, the fee models explained, and how to compare quotes.',
        ["In the US, most clients pay about US$614 to US$2,791 for an interior designer, according to Thumbtack's October 2026 data; full-home projects cost far more.", 'US hourly rates typically run from US$60 to US$200; in the UK, from £25 to £150, and up to £450 for senior London designers.', 'Designers charge by the hour, a flat fee, a percentage of the project, per square foot or a markup on furniture.', 'Compare quotes by scope: stages included, revisions, site visits, purchasing and who owns the drawings.'])}),
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
    'best-interior-design-firms-in-the-world': ('8b4d4f_ecc4d5d2e2734e05be4233cb2cb30abe~mv2.png', {}),
    'best-interior-design-firms-in-europe': ('8b4d4f_70a8688e9ac2463cb47876221adedfff~mv2.png', {}),
    'virtual-staging-cost-and-rules': ('b80319_3ac40368e6ed49ca87fcc96f461d1b4a~mv2.png', {}),
    'how-much-does-an-interior-designer-cost': ('8b4d4f_f7242312985d4b2abfbe8e482b9f1bfc~mv2.png', {}),
    'best-3d-rendering-companies-2026': ('8b4d4f_ecc4d5d2e2734e05be4233cb2cb30abe~mv2.png', {'en': 'Elysian Aura, an interior combining minimalism and opulence, visualized by VARI Studio'}),
    'top-3d-visualization-companies': ('b80319_eaf114bae9ad46aebe7b9c11a9e978c2~mv2.png', {'en': 'Timeless English Roof Architecture, a European-style roofing concept visualized by VARI Studio'}),
    'top-3d-visualization-companies-germany': ('8b4d4f_52780c64f74a4a3dac703141b59358c2~mv2.png', {'en': 'HNE Laboratory, a timber-clad building in Germany visualized by VARI Studio for DGI Bauwerk'}),
    'top-3d-visualization-companies-united-states': ('8b4d4f_149006f8cd784a8998f7e2e140d9f1aa~mv2.jpg', {'en': 'Exterior project in the USA, visualized by VARI Studio'}),
    'top-3d-visualization-studios-europe': ('8b4d4f_c3a0694b95d942b5a3374c47c1b19392~mv2.png', {'en': 'Rustic Chic Oasis, an interior blending modern sophistication and rustic charm, visualized by VARI Studio'}),
    '3d-visualization-interior-design': ('8b4d4f_1bfd140a3aec4e58898b8812dfebcdec~mv2.png', {'en': 'Minimal Wood, a residential interior mixing wood and minimal modern art, visualized by VARI Studio'}),
    '3d-visualization-interior-design-united-states': ('b80319_3dcc1d8eb6814b7f91a14dc472afcb62~mv2.png', {'en': 'Sophisticated home office with a glossy blue desk, plaid wallpaper and black wainscoting, visualized by VARI Studio'}),
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


# Portfolio images placed inside each article: (media id, project name). Alt text is built per language.
WIX = lambda id, w=1800: f"https://static.wixstatic.com/media/{id}/v1/fit/w_{w},h_{w * 2},q_82,enc_avif,quality_auto/{id}"
IMG = {
    'hne': '8b4d4f_52780c64f74a4a3dac703141b59358c2~mv2.png', 'hearth': 'b80319_962a6cc04617409f94ea031705d4ee66~mv2.png',
    'penthouse': '8b4d4f_2762a08d2c794d689b134249fc6cabac~mv2.png', 'lightDark': '8b4d4f_df3765a13fea45d5ba0da2dc00f8b694~mv2.png',
    'blackHome': '8b4d4f_525775bc11554914a009fed0206e2afc~mv2.png', 'urbanNest': 'b80319_425c2f36f32b420da9c91cbd856c607d~mv2.jpg',
    'englishRoof': 'b80319_eaf114bae9ad46aebe7b9c11a9e978c2~mv2.png', 'roofGarden': '8b4d4f_d8c978fb79044dd5b22cf9f8edca55b7~mv2.png',
    'usa': '8b4d4f_149006f8cd784a8998f7e2e140d9f1aa~mv2.jpg', 'constance': '8b4d4f_62ef08a1c1ce4732900dd4921a28094e~mv2.jpg',
    'minimalWood': '8b4d4f_1bfd140a3aec4e58898b8812dfebcdec~mv2.png', 'elysian': '8b4d4f_ecc4d5d2e2734e05be4233cb2cb30abe~mv2.png',
}
NAMES = {'hne': 'HNE Laboratory', 'hearth': 'Hearthstone Haven', 'penthouse': 'Penthouse in Dark Mood', 'lightDark': 'Light in the Dark',
         'blackHome': 'Black Home', 'urbanNest': 'The Urban Nest', 'englishRoof': 'Timeless English Roof Architecture', 'roofGarden': 'Roof & Garden',
         'usa': 'Exterior Project USA', 'constance': 'Constance Ave', 'minimalWood': 'Minimal Wood', 'elysian': 'Elysian Aura'}
ALT = {'en': '{n}: architectural visualization by VARI Studio', 'de': '{n}: Architekturvisualisierung von VARI Studio',
       'es': '{n}: visualización arquitectónica de VARI Studio', 'tr': '{n}: VARI Studio mimari görselleştirmesi'}
FIGURES = {
    'renders-vs-reality': ['hearth', 'penthouse'], 'ai-architectural-rendering-vs-studio': ['hne'],
    'best-architectural-visualization-studios': ['lightDark'], 'what-is-architectural-visualization': ['hearth'],
    'best-rendering-software-for-architecture': ['lightDark'], 'outsourcing-architectural-rendering': ['blackHome'],
    'architect-vs-interior-architect-vs-interior-designer': ['englishRoof'], 'best-3d-rendering-companies-2026': ['urbanNest'],
    'top-3d-visualization-companies': ['penthouse'], 'top-3d-visualization-companies-germany': ['roofGarden'],
    'top-3d-visualization-companies-united-states': ['blackHome'], 'top-3d-visualization-studios-europe': ['urbanNest', 'hearth'],
    '3d-visualization-interior-design': ['hearth', 'penthouse'], '3d-visualization-interior-design-united-states': ['constance'],
    'best-interior-design-firms-in-the-world': ['penthouse', 'hearth'], 'best-interior-design-firms-in-europe': ['hearth', 'urbanNest'],
    'virtual-staging-cost-and-rules': ['minimalWood'], 'how-much-does-an-interior-designer-cost': ['elysian', 'penthouse'],
}


def with_figures(html, keys, lang):
    """Place each image before the 2nd, 4th… H2, so it breaks up the text where a reader expects a pause."""
    parts = re.split(r'(?=<h2>)', html)
    for i, k in enumerate(keys):
        alt = ALT.get(lang, ALT['en']).format(n=NAMES[k]).replace('&', '&amp;').replace('"', '&quot;')
        fig = f'<figure data-figure="" data-size="normal"><img src="{WIX(IMG[k])}" alt="{alt}" loading="lazy"></figure>\n'
        pos = min(2 + 2 * i, len(parts) - 1)
        parts[pos] = fig + parts[pos]
    return ''.join(parts)


def main():
    publish = '--publish' in sys.argv
    # --only <english-slug>[,<slug>…]: emit just that post, so republishing one article never touches
    # edits made to the others in the panel.
    only = set(sys.argv[sys.argv.index('--only') + 1].split(',')) if '--only' in sys.argv else None
    if publish:
        print('-- Publishes the finished articles (author: VARI Studio). Generated by scripts/blog-seed/drafts-to-sql.py --publish.')
        print('-- Updates the drafts inserted earlier (matched by English slug) or creates them. Safe to re-run.')
        print('-- Every language version in the files is published (ready) and appears on the site for each language that is switched on.\n')
    else:
        print('-- Article drafts generated by scripts/blog-seed/drafts-to-sql.py: UNPUBLISHED (status draft, ready = false).')
        print('-- Safe to re-run: a post found by its English slug is updated in place.\n')
    for category, langs in POSTS:
        langs = dict(langs)
        # Sibling language files (same name, .de.md / .es.md / .tr.md) are this post's translations.
        base = langs['en'][0].removesuffix('.en.md')
        for f in sorted(ARTICLES.glob(base + '.*.md')):
            code = f.name[len(base) + 1:-3]
            if code not in langs and re.fullmatch(r'[a-z]{2}', code):
                langs[code] = (f.name, None, None)
        parsed = {}
        for l, (f, ex, tk) in langs.items():
            p = parse(ARTICLES / f)
            parsed[l] = (p, ex or p['excerpt'], tk or p['takeaways'])
            if not parsed[l][1] or not parsed[l][2]:
                sys.exit(f'{f}: excerpt and takeaways are required')
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
        alt.update({l: p['cover_alt'] for l, (p, _, _) in parsed.items() if p.get('cover_alt')})
        ready = 'true' if publish else 'false'
        rows = []
        for l, (p, excerpt, takeaways) in parsed.items():
            p['html'] = with_figures(p['html'], FIGURES.get(en['slug'], []), l)
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
