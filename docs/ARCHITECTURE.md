# VARI Studio — Architecture

The VARI Studio website (www.vari-studio.com) is a multilingual portfolio site for an
architectural-visualization and interior-design studio, with its own control panel (CMS).
It replaced an earlier Wix site. This document covers how the parts fit together. For the
database see [DATA-MODEL.md](DATA-MODEL.md). For how content gets from the panel onto a
page (CMS, languages, page builder, blog) see [CONTENT-PIPELINE.md](CONTENT-PIPELINE.md).
For panel setup and roles see [CONTROL_PANEL.md](CONTROL_PANEL.md).

---

## 1. Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 3 + `app/globals.css` (design tokens: `night`, `ink`, `charcoal`, `bone`, `gold`) |
| Motion / 3D | GSAP, Lenis (smooth scroll), three.js via `@react-three/fiber` + `drei` |
| Rich text | Tiptap 3 (blog editor), `sanitize-html` (rendering) |
| Data | Supabase (Postgres, Auth, Storage, `pg_cron`). Project **VARI** `wdejuqvggvayxtrvkqye`, EU / Paris |
| Email | Resend HTTP API (no SDK) |
| Hosting | Vercel |
| Media | Original renders on the Wix media CDN (`static.wixstatic.com`); uploads in the Supabase Storage bucket `media` |
| Optional | DeepL (blog translation drafts), Meta Conversions API |

There is no test suite. The checks are `npm run typecheck`, `npm run lint` and `npm run build`.

---

## 2. System overview

```
                         ┌─────────────────────────── Vercel ───────────────────────────┐
 Visitor ──► middleware.ts ──► app/[locale]/…   (public site, static + ISR, tag "cms")   │
   │          │  • locale redirect           │  reads lib/cms.ts, lib/pages.ts, lib/blog.ts │
   │          │  • legacy Wix URLs           │  via PostgREST + publishable key (RLS)      │
   │          │  • /admin session gate       ▼                                            │
   │          │                         Supabase REST ◄── fallback: lib/content.ts +       │
   │          │                                            lib/i18n/dictionaries/*        │
   │          └──► app/admin/(panel)/…  (client components, supabaseBrowser, RLS writes)   │
   │                     │  publish ──► POST /api/admin/revalidate ──► revalidateTag('cms')│
   │                     └► /api/admin/team|bootstrap|password-reset|translate (secret key)│
   └──► POST /api/contact, /api/newsletter ──► rpc() with secret key ──► SQL functions    │
                                             └► Resend (notify + acknowledge)             │
                                             └► Meta CAPI (only with marketing consent)   │
                         └───────────────────────────────────────────────────────────────┘
```

There are three Supabase access paths, and each has its own trust level:

| Path | Key | Where | What it can do |
| --- | --- | --- | --- |
| Public read | publishable (`sb_publishable_…`, committed in `lib/supabase/config.ts`) | `lib/cms.ts`, `lib/pages.ts`, `lib/blog.ts`, `lib/i18n/languages.ts`, `middleware.ts` | Only what RLS shows `anon`: published content |
| Panel user | publishable + the user's session cookie | `lib/supabase/browser.ts` (client), `lib/supabase/server.ts` (server) | Whatever the user's role allows under RLS |
| Server privileged | secret (`SUPABASE_SECRET_KEY`, or legacy `SUPABASE_SERVICE_ROLE_KEY`) | `lib/supabase.ts` (`rpc`), `lib/supabase/admin.ts` | Form functions, Auth admin (invite or delete users), `integrations_private` |

The browser never gets the secret key. Form tables can't be reached from the browser at all,
because RLS is enabled with no policies for `anon`.

---

## 3. Directory map

```
middleware.ts            Locale routing, legacy redirects, /admin session gate
next.config.mjs          Security headers, custom image loader, no-store on /api
app/
  [locale]/              Public site: one tree per language
    layout.tsx           <html lang dir>, metadata, JSON-LD, Header/Footer, Tracking
    page.tsx             Home (builder page "home" or settings.home.sections)
    work/ services/ studio/ contact/ privacy/ newsletter/
    work/[slug]/         Project page (wrapped by builder page "project-template")
    blog/ …              Index, article, category, author, rss.xml
    [...rest]/           Custom builder pages (kind = 'custom')
    builder-preview/     Iframe canvas for the panel's page builder (postMessage)
  admin/
    (auth)/              login, forgot, accept (invite or recovery landing)
    (panel)/             Every panel screen (client components)
  api/
    contact, newsletter(/confirm|/unsubscribe)       Public forms
    admin/{bootstrap,team,team/[id],team/[id]/resend,password-reset,revalidate,translate}
  sitemap.ts robots.ts
components/
  home/                  Signature sections (Hero, Welcome, ExteriorReel, InteriorRooms, Services, Story, Experience, ContactSection)
  blocks/                Builder renderer: Blocks.tsx (20 block types), PageBlocks/Interleave, modules registry, Rich text
  three/                 WebGL scenes (PreloaderScene, HeroTiles, ServicesModel), always dynamic(ssr:false)
  work/ blog/            Portfolio and blog UI
  admin/                 Panel shell, UI kit, I18nInput, MediaLibrary, builder/, blog/ (Tiptap)
  Header Footer Preloader Tracking LanguageSwitcher I18nProvider …
lib/
  cms.ts                 getSiteContent(locale): CMS read + static fallback + text merge
  content.ts             Built-in content (projects, services, brand assets) from the Wix site
  i18n/                  config (Locale, FALLBACK_LANGUAGES), languages registry, dictionaries/{en,de,es,tr}
  blocks/schema.ts       Block library: one definition drives the renderer and the panel forms
  pages.ts blog.ts blog-html.ts seo-check.ts
  supabase.ts supabase/{config,browser,server,admin}.ts
  panel-auth.ts team.ts  Invites, recovery links, role checks for team APIs
  mail.ts emails.ts      Resend delivery and templates
  tracking.ts analytics.ts meta-capi.ts   Consent-gated trackers
  image-loader.ts media.ts device.ts merge.ts request.ts
  database.types.ts      Generated Supabase types
supabase/migrations/     Schema history (apply in order)
scripts/                 Seed generators (blog, landing pages, Turkish), DB maintenance SQL
```

---

## 4. Request lifecycle

### 4.1 Public page

1. **`middleware.ts`** loads the language registry (`languages` table over REST, cached in
   memory for 60 s per instance, with `FALLBACK_LANGUAGES` used if the table can't be reached).
   - If the first path segment is an enabled locale, the request passes through.
   - Otherwise it strips a known or disabled locale, maps legacy Wix paths
     (`/home`, `/about`, `/contacts`, `/portfolio`), and returns a **307** to
     `/{preferred}{path}`. The preferred language comes from the `VARI_LOCALE` cookie, then
     `Accept-Language`, then the default language.
2. **`app/[locale]/layout.tsx`** calls `notFound()` for a disabled locale. It calls
   `getSiteContent(locale)` and puts the result in `I18nProvider`, so client components read
   texts, settings and projects from context.
3. The page reads `getSiteContent`, `getPage(slug)` and `getPost(...)`. Every one of these is
   a `fetch` tagged **`cms`** with `revalidate: 300`.
4. Pages are statically generated for every enabled locale (`generateStaticParams`).
   `dynamicParams = true` lets a project or language added later render on its first request
   and then stay cached.

### 4.2 Publish (panel → live site)

The panel writes directly to Supabase through the browser client. After saving, it calls
`usePublish()`, which runs `POST /api/admin/revalidate` (editor or higher) and then
`revalidateTag('cms')`. That refreshes every CMS-backed page at once. If that call fails, the
5-minute `revalidate` catches up on its own.

### 4.3 Forms

```
ContactForm ──POST /api/contact──► honeypot → validate → rpc('submit_contact')   (stored first)
                                   → Resend: studio notification (+ mark_contact_notified)
                                   → Resend: visitor acknowledgement in their language
                                   → Meta CAPI Lead (only if marketingConsent === true)
                                   → if neither DB nor mail worked: { fallback: 'mailto' }
Newsletter  ──POST /api/newsletter─► rpc('subscribe_newsletter') → pending
                                   → email confirm + unsubscribe links (List-Unsubscribe)
            GET /api/newsletter/confirm?token / unsubscribe?token → SQL functions
```

Throttling happens inside SQL, using a salted SHA-256 of the client IP (`lib/request.ts`).
The raw IP is never stored.

### 4.4 Control panel

- `middleware.ts` refreshes the Supabase session cookie on every `/admin` request and sends
  anyone without a session to `/admin/login?next=…`. It also sets `X-Robots-Tag: noindex` and
  `Cache-Control: no-store`.
- Roles are checked **three times**:
  1. UI: `AdminShell` filters the navigation by `min` role, and screens render `NoAccess`.
  2. Server: `requireTeamAdmin()` and `roleAtLeast()` in the API routes.
  3. Database: RLS via `has_role()`.
- `guardedFetch` in `lib/supabase/browser.ts` exists because RLS reports a blocked
  single-row PATCH or DELETE as **success with 0 rows**. The wrapper turns that into a 403
  with a clear message. Keep it.
- Team management (invite, change role, remove) needs Auth admin rights, so it goes through
  `/api/admin/team*` with the secret key. Those routes log to `audit_log` explicitly
  (`logTeam`) because the `audit_row` trigger skips writes made without a user session.
- Owner bootstrap: `/api/admin/bootstrap` works only while no owner exists, and can only
  email `ADMIN_OWNER_EMAIL`.
- Sign-in links: `lib/panel-auth.ts` sends branded Resend emails with token-hash links when
  Resend is configured. Otherwise Supabase's built-in email is used. When neither can send,
  admins get a one-time link they can hand over themselves. If Supabase drops a link on the
  Site URL, `AUTH_LINK_FORWARD` in the locale layout forwards it to `/admin/accept`.

---

## 5. Resilience: the site never goes blank

This is a core design rule. Every read path has a fallback:

| Failure | Behaviour |
| --- | --- |
| Supabase unreachable or erroring | `lib/cms.ts` serves `lib/content.ts` + dictionaries and skips the DB for 60 s (`unavailableUntil`) |
| CMS returns 0 projects | Treated as unavailable, so an empty CMS can't blank the portfolio |
| `languages` table unreachable | `FALLBACK_LANGUAGES` (en, de, es enabled; tr disabled) |
| No builder row for a system page | `Interleave` renders the page's original content |
| Builder layout leaves out the `page` module | Added back automatically, so original content can be moved but never lost |
| Custom page and DB down | 404 |
| No secret key or Resend key | Forms return `fallback: 'mailto'` and the client hands off to the visitor's mail app |
| No WebGL or reduced motion | `lib/device.ts` tier `none` shows static compositions instead of 3D |

---

## 6. Front-end experience

- **Preloader** (`components/Preloader.tsx`): an intro sweep with a 3D scene. On a first
  visit it ends at a language gate ("Welcome · Willkommen · Bienvenidos"), which can be
  switched off in settings (`intro.enabled`, `intro.languageGate`).
- **3D**: `components/three/*` always load through `next/dynamic` with `ssr:false`. The device
  tier (`high` / `low` / `none`) only lightens a scene. Hardware hints never turn 3D off on
  their own (see the comment in `lib/device.ts`).
- **Smooth scroll**: Lenis + GSAP ScrollTrigger (`SmoothScroll.tsx`, `lib/gsap.ts`).
- **Images**: a custom `next/image` loader (`lib/image-loader.ts`). Wix media ids go to the
  Wix CDN (`fit/w_…, enc_avif`), or to `/media/` when `NEXT_PUBLIC_MEDIA_SOURCE=local`.
  Storage uploads are public bucket URLs.
- **Tracking** (`components/Tracking.tsx`): GA4, GTM, Google Ads, Meta Pixel, Clarity,
  LinkedIn, TikTok and custom snippets. Each loads only after consent (cookie `vari_consent`,
  Consent Mode v2). IDs are regex-checked in `lib/tracking.ts` before they reach markup.
  Conversions are reported by `lib/analytics.ts` (`generate_lead`/`Lead`,
  `sign_up`/`CompleteRegistration`) with a shared event id, so the server-side CAPI event
  deduplicates with the pixel.

---

## 7. Security posture

- Security headers in `next.config.mjs`: HSTS preload, `nosniff`, `SAMEORIGIN`, strict
  referrer, restrictive `Permissions-Policy`, COOP. `/api/*` responses are `no-store`.
- Every table has RLS. `anon` gets column-level grants on `pages` and
  `blog_post_translations`, so drafts and the editor's JSON never reach visitors.
- Every `security definer` function sets `search_path = ''`. Trigger functions have
  EXECUTE revoked from `public`, `anon` and `authenticated`.
- `profiles_guard` allows role and email changes only from `service_role`, and protects the
  last owner from being demoted or deleted.
- Article HTML is sanitized again on render (`lib/blog-html.ts`). Iframes are limited to
  YouTube and Vimeo.
- Builder preview messages are checked for same origin and parent source.
- The publishable key and project URL are hard-coded fallbacks. That is safe because RLS
  decides what they can do.

---

## 8. Environment variables

| Variable | Needed for |
| --- | --- |
| `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) | Forms, team management, owner bootstrap, Meta CAPI token read |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Override the built-in VARI project coordinates |
| `IP_HASH_SALT` | Spam throttling hash |
| `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL` | All email |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap, Open Graph |
| `NEXT_PUBLIC_MEDIA_SOURCE` | `wix` (default) or `local` |
| `ADMIN_OWNER_EMAIL` | Who may claim the first owner account |
| `DEEPL_API_KEY` | "Draft with DeepL" in the blog editor |

`serverKeyProblem()` catches common paste mistakes (a personal `sbp_` token, the publishable
key, stray quotes) so the panel can say exactly what is wrong.

---

## 9. Known gaps and risks (as of 2026-11-01)

These were found while writing this document and have not been fixed.

1. **Leftover hard-coded `en|de|es`.** Languages are now data, but a few places still assume
   the original three:
   - `lib/blog-html.ts` only treats `/(en|de|es)/` as already localized. A `/tr/...` link
     inside an article would get a second prefix.
   - `app/api/admin/translate/route.ts` (DeepL) only accepts `de` and `es` as targets.
   - `lib/blocks/schema.ts` `RESERVED_SLUGS` lists `en`, `de` and `es` but not `tr` or
     languages added later.
   - `lib/blog.ts` `formatDate` has a fixed locale map (it falls back to the code, which is
     fine).
2. **Two language caches.** Middleware caches the registry in memory for 60 s per instance,
   while pages use the `cms` tag. Right after a language is switched, middleware and pages
   can briefly disagree.
3. **Media depends on the Wix CDN.** The portfolio images still load from
   `static.wixstatic.com`. If that account closes, set `NEXT_PUBLIC_MEDIA_SOURCE=local` after
   copying the originals into `/public/media`.
4. **No automated tests.** The invariants above are protected only by comments and DB
   constraints.
5. **Large binaries in git.** A numpy wheel (16 MB) and `potracer` wheel at the repo root
   support `scripts/logo-variants.py`. They don't belong in the app repo.
6. **The retention cron must be applied manually.** `20261031091000_retention.sql` needs
   `pg_cron`. See CONTROL_PANEL.md §1.
