# VARI Studio — Data model (Supabase)

Project **VARI** (`wdejuqvggvayxtrvkqye`, EU / Paris). The schema is defined only by
`supabase/migrations/`, applied in filename order. Types for the app are in
`lib/database.types.ts` (regenerate them after a schema change).

## 1. Migrations

| File | Adds |
| --- | --- |
| `20261031090000_forms.sql` | `contact_submissions`, `newsletter_subscribers`, form functions (service_role only) |
| `20261031091000_retention.sql` | `purge_expired_form_data()` + nightly `pg_cron` job (03:17 UTC). **Apply manually** |
| `20261031100000_cms.sql` | Roles, `profiles`, `audit_log`, content tables, RLS, Storage bucket `media` |
| `20261031101000_seed_content.sql` | Initial content (19 projects, categories, services) from the Wix site |
| `20261031102000_profiles_guard_fix.sql` | Fixes `profiles_guard` |
| `20261031103000_revoke_trigger_fns.sql` | Revokes EXECUTE on trigger functions |
| `20261031110000_pages_builder.sql` | `pages`, `page_revisions`, `integrations_private`, `pages_guard` |
| `20261031120000_blog.sql` | Blog tables, `blog_post_is_live()`, seed categories and author |
| `20261101090000_languages.sql` | `languages` table. Locale columns change from enum to text + FK. `resolve_locale()`, `set_default_language()` |

Scripts that are not migrations (run by hand in the SQL editor): `scripts/db/turkish-content.sql`
(Turkish texts, run before enabling `tr`), `scripts/db/pending-cleanup.sql`, and the SQL
printed by `scripts/blog-seed/*` and `scripts/landing-seed/*`.

## 2. Translatable fields

Any text a visitor sees is stored as **`jsonb` keyed by language code**:
`{"en": "…", "de": "…", "es": "…"}`. English (`SOURCE_LOCALE`) is the fallback.
`pick(value, locale)` in `lib/cms.ts` resolves it. A new language therefore needs **no schema
change**. The one exception is the blog, which has one translation row per language
(`blog_post_translations`) so each language can have its own slug, SEO fields and readiness.

## 3. Tables

### Team and audit
| Table | Purpose | Key points |
| --- | --- | --- |
| `profiles` | One row per panel member (`id` = `auth.users.id`) | `role app_role` (`viewer < editor < admin < owner`). Email is unique case-insensitively |
| `audit_log` | Who changed what (never the values) | Filled by the `audit_row()` trigger on content tables and by `logTeam()` for team actions. Readable by admins |

### Site content
| Table | Purpose |
| --- | --- |
| `site_settings` | **Single row (`id = 1`)**, `data jsonb`: brand, contact, home sections, intro, SEO, tracking, verification, navigation, announcement, layout. Shape: `SiteSettings` in `lib/cms.ts` |
| `categories` | Portfolio categories (`slug`, `name` i18n, `sort`) |
| `projects` | Portfolio projects: i18n `title`/`label`/`location`/`description`/`seo`, `category_id` (restrict), `featured`, `published`, `sort` |
| `media` | Image records: `source` is `storage` or `wix`, plus `path`, size and i18n `alt`. `(source, path)` is unique |
| `project_media` | Ordered gallery (project ↔ media), cascades on both sides |
| `services` | Service list (`key`, i18n `title`/`body`/`note`, `visible`) |
| `content_blocks` | Text overrides **per dictionary section** (`key` = top-level key of `Dictionary`, `value` = `{locale: partial section}`), deep-merged over the built-in dictionary |
| `languages` | Language registry: `code` PK, names, `og_locale`, `hreflang`, `welcome`, `dir`, `enabled`, `is_default`, `sort` |

### Page builder
| Table | Purpose |
| --- | --- |
| `pages` | `slug` (unique, can be nested `a/b`), `kind` (`system` or `custom`), i18n `title`, `seo`, **`blocks`** (live), **`draft`** (unpublished `{title, seo, blocks}` or null), `published`, `sort` |
| `page_revisions` | A snapshot on every publish. `trim_page_revisions` keeps the latest 30 per page |
| `integrations_private` | Single row of secrets that must never reach the browser (Meta CAPI token, test event code). Readable and writable by admins only. The server reads it with the secret key |

### Blog
| Table | Purpose |
| --- | --- |
| `blog_posts` | Language-independent fields: `status` (`draft`/`published`), `publish_at`, category, author, cover, `faq` (i18n array), `featured` |
| `blog_post_translations` | PK `(post_id, locale)`, unique `(locale, slug)`. `content` (Tiptap JSON, panel only), `html` (public), excerpt, takeaways, SEO fields, `focus_keyword`, **`ready`**, `source_hash` (flags translations made from older English text), `word_count` |
| `blog_categories`, `blog_tags`, `blog_post_tags`, `blog_authors` | Taxonomy and author profiles (i18n `name`, `role`, `bio`) |

### Forms
| Table | Purpose |
| --- | --- |
| `contact_submissions` | Enquiries: names, email, message, `intent` (`design`/`visualize`/`general`), `locale` → `languages`, `source_path`, `ip_hash`, `user_agent`, `status` (`new`/`read`/`replied`/`archived`/`spam`), `notified_at`, plus `notes`, `handled_by`, `updated_at` (added by the CMS migration) |
| `newsletter_subscribers` | `email` unique, `locale`, `status` (`pending`/`confirmed`/`unsubscribed`), single-use `confirm_token` / `unsubscribe_token`, timestamps |

### Storage
Bucket `media`: public read, 15 MB limit, JPEG, PNG, WebP, AVIF and SVG only. Editors can
upload, update and delete. Viewers can list.

## 4. Access rules (RLS)

`has_role(min)` and `my_role()` are `security definer` helpers that read `profiles` for
`auth.uid()`. Every policy uses them.

| Data | anon (visitors) | viewer | editor | admin | owner |
| --- | --- | --- | --- | --- | --- |
| settings | read | read | read | **write** | write |
| categories, media, services, content_blocks, projects, project_media | read (published or visible only) | read all | **write** | write | write |
| pages | read published, **limited columns** (no `draft`) | read all | create custom, edit any | + delete custom | same |
| page_revisions | — | read | insert | insert | insert |
| blog tables | live posts, `ready` translations (no `content`/`focus_keyword`/`source_hash` columns) | read all | write | write | write |
| languages | read | read | read | add and edit (never delete) | same |
| contact_submissions | — (function only) | read | update status and notes | + delete | same |
| newsletter_subscribers | — (function only) | read | read | + delete | same |
| audit_log | — | — | — | read | read |
| integrations_private | — | — | — | read and update | same |
| profiles | — | read team | edit own name | role changes via server API only | same |

## 5. Functions

| Function | Who can call | Purpose |
| --- | --- | --- |
| `submit_contact(...)` | service_role | Validate, throttle (max 3 per email per 10 min, 10 per IP hash per hour), insert, return id. Raises `rate_limited` / `invalid_email` |
| `mark_contact_notified(id)` | service_role | Set `notified_at` |
| `subscribe_newsletter(email, locale, ip_hash)` | service_role | Create or restart a pending sign-up (new tokens; max 10 per IP hash per hour, one request per address per 2 min). A confirmed address never gets new tokens. Returns status + tokens |
| `confirm_newsletter(token)` / `unsubscribe_newsletter(token)` | service_role | Double opt-in and one-click unsubscribe |
| `purge_expired_form_data()` | service_role (cron) | Delete enquiries older than 24 months, and pending or unsubscribed newsletter rows older than 30 days |
| `resolve_locale(text)` | any | Requested code → enabled code, or the default language |
| `set_default_language(code)` | authenticated (RLS: admin) | Changes the default in one statement, so the statement-level guard sees a consistent state |
| `blog_post_is_live(id)` | anon, authenticated | Used by translation and tag policies |
| `has_role`, `my_role` | anon, authenticated | Role helpers for RLS |

## 6. Triggers and guards (invariants enforced by the database)

| Trigger | Invariant |
| --- | --- |
| `profiles_guard` | Role and email change only as `service_role`. **The last owner can't be demoted or deleted.** Deleting a profile clears that member's email from `audit_log` |
| `pages_guard` | A system page keeps its `kind` and `slug`. A custom page can't become a system page |
| `languages_guard` (statement level) | Exactly one default, and at least one enabled language. Also `check (not is_default or enabled)` |
| `audit_row` | Logs insert, update and delete by a signed-in user. Skips writes made without a session (the server logs those itself) |
| `set_updated_at` | Keeps `updated_at` current |
| `trim_page_revisions` | Keeps at most 30 revisions per page |

Conventions: every function sets `search_path = ''`. Trigger and maintenance functions have
EXECUTE revoked from `public`, `anon` and `authenticated`. Languages are **disabled, never
deleted**, because enquiries and articles keep referencing them through foreign keys
(`on update cascade`).

## 7. Writing a new migration

- Name it `supabase/migrations/YYYYMMDDHHMMSS_name.sql`, after the latest file.
- Enable RLS on every new table, and write the policies with `(select public.has_role('…'))`.
- Store visitor-facing text as `jsonb` keyed by language. Never add a locale enum.
- Add `set_updated_at` and `audit_row` triggers to content tables.
- If a column must stay private (drafts, editor JSON), use column-level grants for `anon`.
- Regenerate `lib/database.types.ts`, and update the fallback content if the public site
  reads the new data (see ARCHITECTURE.md §5).
