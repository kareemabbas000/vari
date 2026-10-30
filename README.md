
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
