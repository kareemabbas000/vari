## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): stack, system overview, request lifecycle, resilience, security, env vars, known gaps
- [docs/DATA-MODEL.md](docs/DATA-MODEL.md): Supabase tables, RLS matrix, functions, triggers and invariants
- [docs/CONTENT-PIPELINE.md](docs/CONTENT-PIPELINE.md): CMS read path, languages, page builder, blog, media, caching
- [docs/KNOWLEDGE-ECOSYSTEM.md](docs/KNOWLEDGE-ECOSYSTEM.md): LLM / answer-engine knowledge ecosystem: architecture, page types, measurement
- [docs/QUESTION-MAP.md](docs/QUESTION-MAP.md): real questions people ask, clustered by domain, with priorities and the monthly prompt bank
- [docs/seo/STRATEGY.md](docs/seo/STRATEGY.md): organic growth master strategy (research, 10 articles, multilingual, off-page, measurement, roadmap)
- [docs/seo/TECHNICAL-AUDIT.md](docs/seo/TECHNICAL-AUDIT.md): live-site technical SEO audit with evidence and fixes
- [docs/CONTROL_PANEL.md](docs/CONTROL_PANEL.md): control panel setup, roles and verification checklist


## Languages (EN · DE · ES)

Every page exists in English, German and Spanish under `/en`, `/de` and `/es`, statically
generated (`generateStaticParams`), so search engines read the full text without JavaScript.

- **Routing:** `middleware.ts` redirects paths without a language prefix to the visitor's saved
  choice (`VARI_LOCALE` cookie) or their browser language (`Accept-Language`), falling back to English.
  Legacy Wix URLs (`/about`, `/home`, `/contacts`, `/portfolio`) are mapped there too.
- **SEO:** each page sets `<html lang>`, a canonical URL, `hreflang` alternates (+ `x-default`) and
  `og:locale`; `sitemap.xml` lists every page in every language with its alternates.
- **Text:** `lib/i18n/dictionaries/{en,de,es}.ts`. English is the source; German and Spanish are typed
  against it (`Dictionary`), so a missing key fails the build. Project images and structure live in
  `lib/content.ts`; project text is per language.
- **Choosing a language:** first-time visitors pick one at the end of the intro; everyone can switch
  from the header (desktop) or the menu (mobile).

## Database & forms (Supabase)

Contact enquiries and newsletter sign-ups are stored in the **VARI** Supabase project
(`wdejuqvggvayxtrvkqye`, EU / Paris). Schema lives in `supabase/migrations/`.

- **Security:** Row Level Security on every table with no policies — browser keys can neither read
  nor write. The API routes call validated, throttled Postgres functions with the server-only
  secret key (`lib/supabase.ts`).
- **Contact flow:** store in `contact_submissions` → notify the studio → acknowledge the visitor in
  their language. Nothing is lost if email delivery fails.
- **Newsletter:** double opt-in (`pending` → `confirmed` via the emailed link), single-use links
  valid 7 days, one-click unsubscribe (`List-Unsubscribe`).
- **Retention:** `20261031091000_retention.sql` schedules a nightly purge (enquiries after
  24 months, unconfirmed/unsubscribed newsletter rows after 30 days) — apply it in the Supabase
  SQL editor or with `supabase db push`.
- **Vercel environment variables:** `SUPABASE_SECRET_KEY`, `IP_HASH_SALT`, `RESEND_API_KEY`,
  `CONTACT_FROM_EMAIL` (see `.env.example`). Without them the forms fall back gracefully.

## Control panel (CMS)

`/admin` — manage projects, categories, services, home-page layout, every text in EN/DE/ES, the
media library, brand & contact settings, the enquiry inbox, newsletter subscribers, team members,
roles and the activity log. Mobile-first. Setup, roles and the verification checklist:
**[docs/CONTROL_PANEL.md](docs/CONTROL_PANEL.md)**.
