# VARI control panel — setup & verification

The panel lives at **`/admin`**. Content is stored in the Supabase project **VARI**
(`wdejuqvggvayxtrvkqye`, EU / Paris); the public site reads it and falls back to the built-in
content if the database is unreachable.

## 1. One-time setup (owner of the Supabase + Vercel accounts)

### Vercel → Project → Settings → Environment Variables (Production + Preview)

| Variable | Required | Value |
| --- | --- | --- |
| `SUPABASE_SECRET_KEY` | **yes** | Supabase → Project Settings → API Keys → secret key (`sb_secret_…`). Server only. |
| `IP_HASH_SALT` | recommended | Any long random string (spam throttling). |
| `RESEND_API_KEY` | recommended | Enables branded emails: enquiry notifications, visitor acknowledgements, newsletter confirmations, panel invitations. |
| `CONTACT_FROM_EMAIL` | with Resend | e.g. `VARI Studio <website@vari-studio.com>` on a domain verified in Resend. |
| `DEEPL_API_KEY` | optional | Adds “Draft with DeepL” to the blog editor (machine draft of German/Spanish translations, always reviewed by a person). |
| `ADMIN_OWNER_EMAIL` | optional | Who may claim the first Owner account. Default: `kareemaitools@gmail.com`. |

Redeploy after adding them.

### Supabase → Authentication

1. **Sign In / Providers → Email:** turn **off** “Allow new users to sign up”. Team members join by
   invitation only. (Even if left on, an uninvited account has no access — but off is cleaner.)
2. **URL Configuration:**
   - Site URL: the production address (e.g. `https://www.vari-studio.com`).
   - Redirect URLs: add `https://<production-domain>/admin/accept` and, for previews,
     `https://*.vercel.app/admin/accept`.
3. **Emails → SMTP (recommended):** without Resend in Vercel, invitations use Supabase's built-in
   email, which only delivers to addresses of the Supabase organisation's members. Configure custom
   SMTP (Resend SMTP works) or add `RESEND_API_KEY` in Vercel so invitations reach anyone.

### Optional: data retention job

`supabase/migrations/20261031091000_retention.sql` schedules a nightly purge that enforces the
privacy notice (enquiries after 24 months, unconfirmed/unsubscribed newsletter rows after 30 days).
Run it once in Supabase → SQL Editor (or `supabase db push`).

## 2. What the panel manages

- **Pages & builder** — visual block editor with live desktop / tablet / phone preview in all three
  languages: 20 blocks (hero, text, image, gallery, cards, numbers, quote, call to action, video,
  FAQ with Google rich results, projects, services, moving text, logos, contact form, newsletter,
  map, spacer…), drag to reorder, undo/redo (⌘/Ctrl Z), auto-saved drafts, publish, version history,
  page SEO with a Google preview. New pages start from templates and live at `/{lang}/{address}`.
  The built-in pages (home, work, services, studio, contact) open in the same builder: their
  designed sections stay intact and new blocks can be placed around them.
- **Blog** — rich article editor (headings, images with captions and sizes, tip/note/warning
  boxes, quotes, tables, YouTube/Vimeo, call-to-action buttons), per-language title, address, excerpt,
  key takeaways, SEO title/description and focus keyword with a live SEO score, FAQ (Google rich
  results), categories, tags and author profiles, featured posts and scheduling (a future publish date
  goes live on its own within about five minutes). Translation workflow: English is the source;
  German and Spanish start from the English structure, can be compared side by side, and are flagged
  when the English text changes later. Only languages marked “ready” are published, each with its own
  address and hreflang. Public pages: `/{lang}/blog`, articles, category and author pages, RSS feed
  (`/{lang}/blog/rss.xml`), articles in the sitemap with structured data (BlogPosting, Breadcrumb, FAQ).
- **Menus & announcement** — main menu and footer links (including builder pages) and a gold
  announcement bar.
- **Analytics & tracking** — GA4, Google Tag Manager, Google Ads, Meta Pixel + Conversions API,
  Microsoft Clarity, LinkedIn, TikTok, search-engine verification codes and custom code. Trackers load
  only after consent (banner in EN/DE/ES, Consent Mode v2); the privacy notice adapts automatically.
  Enquiries are reported as `generate_lead` / `Lead`, newsletter sign-ups as `sign_up` /
  `CompleteRegistration`.

## 3. First sign-in

1. Open `/admin/login`. While no owner exists, a **First-time setup** box offers to send the owner
   invitation — it can only ever email `ADMIN_OWNER_EMAIL`.
2. Open the email → choose a password (10+ characters) → you land on the dashboard as **Owner**.
3. Team → **Invite member** for the client (e.g. as Admin).

## 4. Roles

| Role | Can |
| --- | --- |
| Owner | Everything, including managing admins. The last owner can never be removed or demoted. |
| Admin | All content, site settings, home layout, deleting enquiries/subscribers, managing editors & viewers. |
| Editor | Projects, categories, services, texts & translations, media, enquiry statuses and notes. |
| Viewer | Read-only panel and inbox. |

Enforced three times: the panel UI, the server routes, and the database (Row Level Security).
Removing a member hard-deletes their Supabase Auth user; their profile cascades away and their
email is scrubbed from the activity log.

## 5. End-to-end checklist (run in a session that can reach `*.supabase.co`)

- [ ] `/admin/login` → First-time setup → invitation email arrives → accept → set password → dashboard.
- [ ] Dashboard counts match Supabase (19 projects, 0 enquiries).
- [ ] Projects → edit *Black Home* German title → Save & publish → `/de/work/black-home` shows it.
- [ ] Projects → New project → upload 2 images → publish → appears on `/en/work` and gets a page.
- [ ] Hide a project → disappears from the site; unhide → returns.
- [ ] Categories → add “Commercial” → move a project into it → new filter on `/en/work`.
- [ ] Services → hide one → disappears from the home page services list.
- [ ] Home page → hide “Experience”, move “Story” up → home page reflects it.
- [ ] Texts → Hero → change the Spanish headline → `/es` shows it; “Reset to original” restores it.
- [ ] Media → upload, add alt texts, try deleting an image in use (blocked) and an unused one (works).
- [ ] Settings → replace the light logo → header, footer, intro sweep use it; restore original.
- [ ] Send the contact form on the site → enquiry appears in Inbox → open (marks read) → notes → reply.
- [ ] Team → invite an editor → they can edit content but not Settings/Team; a viewer cannot save.
- [ ] Team → remove the editor (type-to-confirm) → their auth user no longer exists in Supabase.
- [ ] Activity log lists the changes with names; removed member shows as “former member”.
- [ ] Repeat key screens on a phone (drawer navigation, tabs in translation fields, bottom sheets).
