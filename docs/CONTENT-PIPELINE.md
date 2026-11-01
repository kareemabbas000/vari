# VARI Studio — Content pipeline

How content goes from the control panel to a rendered page, in every language. Read this
before changing anything in `lib/cms.ts`, `lib/i18n/`, `lib/blocks/`, `lib/pages.ts`,
`lib/blog*.ts` or the panel's content screens.

---

## 1. One read path: `getSiteContent(locale)`

`lib/cms.ts` is the single entry point for site-wide content. Every page and the locale
layout call it, and the result is shared with client components through
`components/I18nProvider.tsx` (`useI18n()`).

```
loadRaw()  ── 5 parallel REST reads (tag "cms", revalidate 300 s, 5 s timeout) ──┐
   site_settings · categories · projects(+category, gallery→media) · services · content_blocks
                                                                                  │
   ok + ≥1 project ──► buildContent(raw, locale)                                  │
   error / empty   ──► staticContent(locale)   (lib/content.ts + dictionary)  ◄───┘
                        and skip the DB for 60 s
                                  │
getLanguages() ───────────────────┴──► SiteContent { locale, t, projects, categories,
                                        services, settings, source, languages, defaultLocale }
```

What `buildContent` does:

1. **Texts (`t`)**: starts from the built-in dictionary (`lib/i18n/dictionaries/{en,de,es,tr}.ts`,
   or English for languages that have no built-in file). It then deep-merges each
   `content_blocks.value[locale]` over the matching dictionary section (`lib/merge.ts`).
   Empty strings never override.
2. **Projects**: each i18n field goes through `pick()` (English fallback). Gallery `media`
   becomes `Media`, where `mediaSrc()` turns a Storage path into a public URL. Projects with
   no images or no title are dropped.
3. **Services**: a CMS list. It also *rewrites* `t.services.items` and `t.services.notes`, so
   components that read the dictionary stay in step with the CMS.
4. **Settings**: each part is merged over `defaultSettings`, part by part. Settings SEO
   title and description override `t.meta`.

**Rule:** anything the public site reads must have a built-in default, so an empty or
unreachable database can't break a page (ARCHITECTURE.md §5).

### Adding a site-wide setting
1. Extend `SiteSettings` + `defaultSettings` in `lib/cms.ts`.
2. Merge it in `buildContent` (keep the default when it's missing).
3. Add the control to the panel screen (`app/admin/(panel)/settings|menus|tracking|home`).
   Settings are admin-only under RLS.
4. No migration is needed, because `site_settings.data` is free-form `jsonb`.

### Adding interface text
Add the key to `lib/i18n/dictionaries/en.ts`. `de`, `es` and `tr` are typed as `Dictionary`,
so **the build fails until they have it too**. The panel's *Texts & translations* screen is
generated from the English dictionary (`components/admin/texts.ts`, using `leaves()`), so the
new text becomes editable automatically. Only differences from the built-in text are saved
to `content_blocks`. "Reset to original" deletes the override.

---

## 2. Languages

- **Registry**: the `languages` table (DATA-MODEL.md). `lib/i18n/config.ts` holds only what
  has to exist without the DB: the `Locale` type (any code), `SOURCE_LOCALE = 'en'`, the
  cookie name and `FALLBACK_LANGUAGES`.
- **Server**: `getLanguages()` in `lib/i18n/languages.ts` (tag `cms`) returns
  `{ all, enabled, defaultCode, codes, byCode }`. Middleware has its own 60-second
  in-memory copy.
- **URLs**: every page lives at `/{code}/…` and **keeps its English slug in every language**
  (`localizePath`). Blog articles are the exception: each translation has its own slug.
- **SEO**: `alternatesFor(locale, path)` builds the canonical URL plus `hreflang` for every
  enabled language and `x-default`. `postAlternates` lists only languages that really have
  the article. `app/sitemap.ts` writes one entry per page per enabled language.
- **Disabling a language**: it disappears from menus, the switcher, the intro gate, the
  sitemap and hreflang. Its URLs redirect (307) to the visitor's language. Rows that
  reference it stay.
- **Adding a language** in the panel: the new language shows English until its texts are
  translated (`content_blocks`, i18n jsonb fields, blog translations). Right-to-left is
  supported through `dir` on `<html>`.
- Turkish ships fully translated but switched off. Run `scripts/db/turkish-content.sql`
  first, then enable it.

---

## 3. Page builder

### Block library (`lib/blocks/schema.ts`)
One `BlockDef` per type drives **both** the public renderer (`components/blocks/Blocks.tsx`)
**and** the panel's settings forms (`components/admin/builder/FieldEditor.tsx`). Adding a
field to a definition is all it takes to make it editable.

There are 20 types: `hero, heading, text, image, imageText, gallery, cards, stats, quote,
cta, video, faq, projects, services, marquee, logos, contactForm, newsletter, map, spacer`.
There is also the special **`module`** block (see below).

- `fields` use these kinds: `text` (with `i18n`), `richtext`, `image`, `images`, `select`,
  `toggle`, `number`, `link`, `url`, `projects`, and `list` (nested fields).
- Every block has a `style` (`bg`, `pad`, `width`, `align`, `reveal`, `hideOn`, `anchor`).
- In titles, `*words*` render in the gold italic.
- Starter texts are given for en, de, es and tr. Other languages fall back to English.
- New pages start from `lib/blocks/templates.ts` (blank, landing, about, service, SEO landing).

### Page kinds (`pages.kind`)
| Kind | Slug | Route | Original content |
| --- | --- | --- | --- |
| `system` | `home`, `work`, `services`, `studio`, `contact`, `blog`, `privacy`, `project-template` | The built-in route (fixed by `pages_guard`) | A locked **`module: 'page'`** block that can be moved but never removed |
| `custom` | Anything not in `RESERVED_SLUGS`, can be nested (`a/b`) | `app/[locale]/[...rest]` | — |

### Signature modules
`components/blocks/modules.tsx` maps `hero, welcome, exteriors, interiors, services, story,
experience, contact` to the home-page sections. Any page can place them as `module` blocks.
Their texts are edited under Texts & translations, not in the block.

### Rendering (`components/blocks/PageBlocks.tsx`)
`Interleave` walks the blocks. Runs of normal blocks go to `BlockRenderer`. Each `module`
block is replaced by the page-specific node (`modules[id]`) or by the shared registry entry.
`hideOn` becomes a responsive `contents` / `hidden` wrapper. With no builder data, the
original page renders unchanged. For the home page, `settings.home.sections` provides the
fallback order.

### Draft → publish
```
edit ──auto-save──► pages.draft = {title, seo, blocks}     (live site unaffected)
publish ──► pages.blocks/title/seo = draft, draft = null, published = true
            + insert page_revisions (last 30 kept) + revalidateTag('cms')
discard ──► pages.draft = null
```
Visitors can never read `draft`, because of the column grants for `anon`.

### Live preview
The builder embeds `/{lang}/builder-preview` in an iframe. That page renders only what the
panel posts to it, same origin only:
- panel → canvas: `vari:render { blocks, selected, scroll }`
- canvas → panel: `vari:ready`, `vari:select`, `vari:action`

Device widths (desktop, tablet, phone) are just iframe sizes.

---

## 4. Blog

- **Model**: `blog_posts` (language-independent fields) + one `blog_post_translations` row per
  language, with its own slug, SEO fields and `ready` flag.
- **Editor**: Tiptap (`components/admin/blog/RichEditor.tsx`, custom extensions for callouts,
  figures, video and CTA). It saves `content` (JSON, panel only) and `html` (public).
- **Translation workflow**: English is the source. Each translation stores `source_hash`, a
  fingerprint of the English text it was made from. When the English text changes later, the
  panel marks the translation **outdated**. The optional DeepL draft
  (`/api/admin/translate`) is always reviewed by a person before it's marked ready.
- **What's public** is decided by RLS alone. A post is visible when
  `status = 'published' and publish_at <= now()`, and a translation when it's `ready`.
  **Scheduling needs no job**: a future post appears on its own once the 5-minute cache
  refreshes.
- **Rendering**: `renderArticle()` in `lib/blog-html.ts` sanitizes the HTML again, adds
  heading ids and builds the table of contents. It opens external links safely and adds the
  language prefix to internal links.
- **SEO**: `lib/seo-check.ts` scores each translation (also used by the seed scripts).
  Articles output BlogPosting, Breadcrumb and FAQ JSON-LD, and have an RSS feed per language
  (`/{lang}/blog/rss.xml`, revalidated every 300 s).
- **Seeding**: `scripts/blog-seed/generate.mts` prints SQL for the launch articles
  (`scripts/blog-seed/tr/` for Turkish). `scripts/landing-seed/generate.mjs` prints SQL for
  the published custom landing pages.

---

## 5. Media

| Source | Stored as | Served |
| --- | --- | --- |
| Original Wix renders | `media.source = 'wix'`, `path` = Wix media id | `lib/image-loader.ts` → Wix CDN at the requested width (AVIF), or `/media/<id>` when `NEXT_PUBLIC_MEDIA_SOURCE=local` |
| Panel uploads | `media.source = 'storage'`, `path` in bucket `media` | Public Storage URL (`mediaSrc`) |

The media library (`components/admin/MediaLibrary.tsx`) won't delete an image that is still
in use.

---

## 6. Cache map

| What | Cache | Invalidated by |
| --- | --- | --- |
| Every CMS, pages, blog and languages fetch | Next data cache, tag `cms`, 300 s | `POST /api/admin/revalidate` (panel publish), or the 300 s expiry |
| Static pages per locale | Full-route cache (SSG/ISR) | Same tag |
| `sitemap.xml`, RSS | `revalidate = 300` | Time |
| Middleware language registry | In-memory, 60 s, per instance | Time |
| CMS outage | `unavailableUntil` 60 s, per instance | Time |
| `/admin/*`, `/api/*` | `no-store` | — |

Because there is only one tag, any publish refreshes the whole site. That is cheap at this
size. If content volume grows a lot, split the tag (for example `cms:blog`, `cms:pages`).

---

## 7. Checklist for a content-related change

- [ ] Does the public site still render with the DB unreachable? (Built-in default present?)
- [ ] Is visitor-facing text i18n `jsonb` or a dictionary key, never a single string?
- [ ] Is it added to every built-in dictionary (`en`, `de`, `es`, `tr`)? `tsc` will tell you.
- [ ] RLS: can `anon` read only published data, can editors write, are admin-only settings guarded?
- [ ] After a panel write, does it call `usePublish()` so the site refreshes?
- [ ] Do new routes or slugs avoid `RESERVED_SLUGS`, and are they added to `app/sitemap.ts`?
- [ ] Are there any new hard-coded language lists? Use `getLanguages()` instead (see ARCHITECTURE.md §9).
- [ ] `npm run typecheck && npm run lint && npm run build`.
