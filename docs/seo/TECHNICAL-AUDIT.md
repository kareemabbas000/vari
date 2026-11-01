# VARI Studio: technical SEO audit

**Date:** 2026-11-01. **Scope:** the live site `https://www.vari-studio.com` (production build `8f210b9`) plus the code.

**Method:**
- Fetched every URL in the live sitemap as raw HTML (35 URLs).
- Checked redirects, headers, canonicals, hreflang, titles, descriptions, headings, word count, image alt text and JSON-LD.
- Measured lab Core Web Vitals in Chromium with an emulated Pixel 7, slow 4G (1.6 Mbps, 150 ms) and 4× CPU throttling.
- Traced every finding to the code that causes it.

**Not available in this session:**
- Search Console: indexing status, queries, field Core Web Vitals.
- PageSpeed Insights: the shared API quota was exhausted.
- Bing Webmaster Tools and a backlink index.

Findings that depend on these are marked **verify in GSC**.

Severity:
- **S1** blocks growth now
- **S2** clear ranking or conversion loss
- **S3** worth fixing
- **S4** hygiene

Nothing below changes a URL or an indexing directive without a stated reason and a check.

---

## Summary

| # | Finding | Sev | Effort | Owner |
| --- | --- | --- | --- | --- |
| T1 | German, Spanish and Turkish are switched off in production. Only `/en` is indexable, including the "Germany" and "Spain" landing pages | S1 | Panel switch + content QA | Owner + editor |
| T2 | The portfolio grid on `/work` is not in the HTML (client-side rendering bailout). No crawlable links to any project from the portfolio page, and CLS 0.44 | S1 | Small code fix | Dev |
| T3 | The four commercial landing pages are orphans (0 internal links; reachable only through the sitemap) | S1 | Links in nav, services and articles | Dev + editor |
| T4 | The 19 project pages are thin (34–127 words, no H2). Titles are project names with no topic. 12 of 19 meta descriptions are 16–43 characters | S2 | Template + VARI input | Dev + VARI |
| T5 | Home page: 380-character Wix-era meta description, and an H1 with no topical signal | S2 | Copy | Editor |
| T6 | Double brand in titles ("… \| VARI — VARI Studio"). 69–75 characters, so truncated in search results | S2 | Template fix | Dev |
| T7 | Slow lab LCP (6.5–9.8 s on throttled mobile). The hero image has no `fetchpriority`/preload | S2 | Small code fix + verify in GSC | Dev |
| T8 | Social-share (OG) image served as **AVIF**, which Facebook, LinkedIn and WhatsApp previews don't support | S2 | One-line loader change | Dev |
| T9 | Missing alt text: 1 per project page, 5 on home, 4 on the interior landing page | S3 | Small | Dev + editor |
| T10 | Structured data is incomplete: no linked `Organization`/`WebSite` graph, no `Service`, no `BreadcrumbList` on projects | S3 | Small | Dev |
| T11 | One `/services` page (228 words) covers 8 services, so no service ranks for its own query | S3 | Content | Editor |
| T12 | Legacy Wix redirects are 307 (temporary) | S4 | Decision only | Owner |
| T13 | The sitemap stamps every static page with today's date; no image sitemap | S4 | Small | Dev |
| T14 | Leftover hard-coded `en\|de\|es` lists (blog links, DeepL, reserved slugs) | S3, **before enabling Turkish** | Small | Dev |
| T15 | Unknown: index coverage, field CWV, manual actions, Bing indexing | — | Check | Owner |

**What works well (keep it):**
- `vari-studio.com` → `www` is a 308.
- Every page has a self-referencing canonical.
- Clean 404s, a sensible `robots.txt`, and static pre-rendered HTML (`x-nextjs-prerender`, served from the Vercel cache).
- One H1 per page.
- `BlogPosting` + `BreadcrumbList` + `FAQPage` on articles, and `FAQPage` on landing pages.
- Security headers.
- hreflang is generated from the language registry, so it stays reciprocal automatically.
- The five launch articles are solid: 1,289–1,728 words, 10–13 H2s, every image has alt text.

---

## S1 — fix first

### T1 · Only English is live
**Evidence:**
- `/de`, `/es` and `/tr` all answer **307 → `/en`**.
- The sitemap holds 35 URLs, all `/en/…`.
- `/en` declares hreflang `en` + `x-default` only.
- The code has complete German, Spanish and Turkish dictionaries. The landing pages and the five articles have DE, ES and TR text (`scripts/landing-seed`, `scripts/blog-seed`).

**Impact:**
- German searchers never see a German page. The page built to win Germany (`/en/architectural-visualization-germany`) is in English, while the German results for *Architekturvisualisierung*, *3D-Visualisierung Kosten* and *Visualisierung Bauträger* are all German-language.
- All the existing translation work earns nothing.

**Recommendation:**
- Enable **German first**: it's the strongest stated market and the content exists.
- Spanish second, once keyword demand is confirmed (see STRATEGY.md §2.5).
- Turkish only after T14.

**Before switching a language on:**
1. Have a native speaker proofread the dictionary, the landing pages and the five articles.
2. Mark the articles `ready` in the panel.
3. Fix T14.
4. In Search Console, add nothing new: the domain property already covers `/de/`. Afterwards, submit the sitemap again and watch International Targeting / hreflang errors.

**Implication:**
- This creates new URLs (`/de/...`). It changes no existing URL.
- Visitors with German browsers who now land on `/en` will be redirected to `/de` (middleware, `Accept-Language`). That's intended, and can be undone with the same switch.

### T2 · Portfolio grid is client-rendered
**Evidence:**
- `/en/work` HTML: 19 words of text, **0 links** to `/en/work/*`, and the marker `BAILOUT_TO_CLIENT_SIDE_RENDERING`.
- Lab CLS **0.439** (threshold 0.1).
- **Cause:** `components/work/WorkIndex.tsx:37` calls `useSearchParams()` inside `<Suspense>` with no fallback (`app/[locale]/work/page.tsx:38`). Next.js then renders the whole grid only in the browser.

**Impact:**
- Googlebot renders JavaScript, so it eventually sees the grid, but later and at more cost.
- Crawlers that don't execute JS (most AI search and answer bots, many SEO tools, some Bing passes) see an empty portfolio.
- The project pages are reachable only from the home page and the sitemap.

**Fix (no URL change):**
- Render the full grid on the server.
- Read `?filter=` on the client only to filter what is already rendered. For example, move `useSearchParams` into a small `<FilterBar>` client component.
- Or give the `Suspense` a fallback that renders the same unfiltered grid.

**Check:** `curl /en/work | grep -c 'href="/en/work/'` should be 19.

### T3 · Commercial landing pages are orphans
**Evidence:** no page in the live site links to these four pages. They're found only through `sitemap.xml`.
- `/en/3d-rendering-services-for-developers`
- `/en/interior-visualization-services`
- `/en/architectural-visualization-germany`
- `/en/architectural-rendering-spain`

**Impact:**
- Internal links are how Google learns importance and topic. These are the money pages, yet they're treated as the least important pages on the site.

**Fix:**
- Link them from `/services` (per service), from the footer (a "Markets" column with Germany, Spain, and later the UAE), and from the relevant articles. The developers article should link the developers page; the cost article should link the Germany page in its German-market section.
- Set them up in Panel → Menus (no code needed for the footer).

---

## S2 — clear losses

### T4 · Thin project pages
**Evidence:**
- 34–127 words of body text, no H2.
- Titles like `Fresh Backyard — VARI Studio` or `Exterior Project — VARI Studio`.
- Descriptions like "Exterior Project" (16 characters).

**Impact:**
- Each project could rank for the image and the visual query (e.g. *modern black house exterior rendering*, *Norwegian cabin interior design*). These are also VARI's strongest proof for every article.

**Fix:**
- A case-study template (builder `project-template` page + per-project fields):
  1. **Brief**: what was given (drawings, references)
  2. **Challenge**
  3. **Visual decisions**: camera, light, materials, mood
  4. **Deliverables**
  5. **Result** (only with the client's permission)
- Title pattern: `{Name}: {type} {discipline} visualization, {location} | VARI Studio`, e.g. `Black Home: Modern Residential Exterior Visualization, USA | VARI Studio` (trim to ≤ 60 characters).
- **Needs VARI input.** Nothing can be written about decisions the team hasn't described.

### T5 · Home page snippet
**Evidence:**
- The meta description is the 380-character Wix text ("Trusted by clients worldwide… elevate your next project…"). Google shows about 155 characters and will likely rewrite it.
- H1 = *Where Elegant Spaces Meet Elemental Harmony*.

**Fix:**
- Keep the brand H1. It's a creative decision, and the H1 carries little weight on its own.
- Add a visible line under it naming what VARI does: architecture, interior design and 3D visualization, Cairo, working worldwide.
- New description (about 150 characters), set in Panel → Settings → SEO:

> Architecture, interior design and photorealistic 3D visualization from Cairo, for developers, architects and homeowners in Europe, the Gulf and beyond.

### T6 · Double brand, truncated titles
**Evidence:**
- `3D Rendering Services for Real Estate Developers | VARI — VARI Studio` (69 characters).
- The landing pages' SEO title already ends in `| VARI`, and `layout.tsx` appends the template `— VARI Studio`.

**Fix:**
- For pages with a custom SEO title, return `title: { absolute: seo.title }` in `app/[locale]/[...rest]/page.tsx` (`withSeo` in `lib/pages.ts`).
- Remove "| VARI" from the stored titles.
- Keep titles ≤ 60 characters.

### T7 · LCP
**Evidence (lab, throttled mobile; not field data):**

| Page | LCP | FCP | CLS |
| --- | --- | --- | --- |
| `/en` | 9.8 s | 2.0 s | 0.071 |
| `/en/work` | 8.8 s | 1.0 s | **0.439** |
| `/en/work/black-home` | 7.4 s | 1.0 s | 0 |
| `/en/blog/architectural-rendering-cost` | 6.5 s | 1.1 s | 0.013 |

- FCP is fast and HTML comes from the Vercel cache, so the server isn't the problem.
- LCP is the large hero render loading late: no `fetchpriority="high"` or image preload anywhere, the images come from a third-party CDN, and the home hero sits behind the intro sequence.

**Fix:**
- Add `priority` on the first visible `next/image` per page (hero, project cover, article cover). That adds the preload + `fetchpriority`.
- Make sure the intro overlay doesn't delay the LCP element for returning visitors.
- **Verify in GSC → Core Web Vitals (field data) before investing more:** lab throttling exaggerates.

### T8 · OG image is AVIF
**Evidence:** `og:image = …/v1/fit/w_1200,h_2400,q_82,enc_avif,…`.
- Facebook, LinkedIn, WhatsApp and X previews don't render AVIF, so shared links show no image.
- `fit` with `h_2400` also gives an unpredictable aspect ratio.

**Fix:**
- Add an `ogImageUrl()` helper using `/v1/fill/w_1200,h_630,q_85/` without `enc_avif`, which returns the original JPEG or PNG.
- Use it in `app/[locale]/layout.tsx`, the project pages and the articles.

---

## S3 / S4

**T9 · Missing alt text.** One empty `alt=""` per project page (the next/previous thumbnail). Five on the home page, four on the interior landing page. Decorative images may keep `alt=""`. Images that carry content need a description, e.g. "Dusk exterior of Black Home, a black-clad residence in the USA, visualized by VARI Studio".

**T10 · Structured data.** Emit one graph per page:
- `ProfessionalService` with `@id: /#org`, `sameAs` (Behance, Houzz, LinkedIn, Instagram…), and `areaServed`.
- `WebSite`.
- `Service` items on service and landing pages (`provider: {@id:#org}`).
- `BreadcrumbList` + `CreativeWork` with `creator: {@id:#org}` on projects.

Also verify that the JSON-LD address (`742 Golf District, Al Shorouk City`) matches the Google Business Profile exactly, so name, address and phone are consistent everywhere.

**T11 · One page for eight services.** Plan dedicated pages for 3D rendering, animation & walkthroughs, virtual tours, interior design, 3D modeling & BIM, 2D drafting and product modeling (STRATEGY.md §4). Each needs real deliverables, a process and portfolio proof, not a doorway page.

**T12 · Legacy redirects are 307.** `/about`, `/home`, `/contacts` and `/portfolio` 307 to a language-dependent URL. A 307 is correct while the destination depends on the visitor's language. After years, Google has consolidated anyway. **Decision:** leave as is. Revisit only if GSC still shows the old Wix URLs as indexed.

**T13 · Sitemap.**
- `lastModified = new Date()` for static pages on every build trains Google to ignore it. Use real update dates (CMS `updated_at`).
- Add `<image:image>` entries for the portfolio. Image search is a real discovery channel for a visual studio.

**T14 · Hard-coded languages** (ARCHITECTURE.md §9):
- `lib/blog-html.ts` only treats `/(en|de|es)/` as already localized. A `/tr/` link would get a second prefix.
- The DeepL route only accepts DE and ES.
- `RESERVED_SLUGS` lacks `tr`.

Fix all three before Turkish or Arabic is enabled.

**T15 · Check in Search Console and Bing, once:**
- Pages → "Crawled/Discovered – currently not indexed"
- Core Web Vitals (field)
- Manual actions
- Links report (referring domains)
- Bing Webmaster: import from GSC, submit the sitemap

---

## Implementation order

| Sprint | Items | Expected effect |
| --- | --- | --- |
| 1 (1–2 days, dev) | T2, T6, T8, T7 (`priority`), T9 code part | Crawlable portfolio, clean titles, working share previews |
| 1 (owner, 1 hour) | T5 copy, T3 footer links in Panel → Menus, T15 checks | Money pages discovered |
| 2 | T1 German: proofread → enable → resubmit sitemap; T14 | Germany becomes reachable |
| 3 | T4 case-study template + first 6 projects (with VARI input); T10 | Proof pages rank, articles get evidence |
| 4+ | T11 service pages, T13, Spanish | Topical breadth |
