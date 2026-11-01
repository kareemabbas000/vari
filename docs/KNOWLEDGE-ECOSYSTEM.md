# VARI Knowledge Ecosystem — architecture

**Goal.** Make VARI Studio the source that search engines and AI assistants (ChatGPT, Perplexity,
Gemini, Google AI Overviews / AI Mode, Copilot) use, and recommend, when people ask about
**architecture, interior design and architectural visualization**. That covers learning,
costs, comparisons, choosing a provider, and hiring.

This document is the system design. The question inventory it serves is
[QUESTION-MAP.md](QUESTION-MAP.md). The proposed database schema is
`scripts/db/answers-schema.proposed.sql` (not applied yet). Read with
[ARCHITECTURE.md](ARCHITECTURE.md) and [CONTENT-PIPELINE.md](CONTENT-PIPELINE.md). Every rule
there still applies: fallbacks, i18n `jsonb`, RLS, the `cms` cache tag, and no hard-coded
language lists.

---

## 1. How answer engines choose sources, and what follows for us

What the evidence says (2025–2026; most datasets come from GEO-tool vendors, so treat the
numbers as directional):

| Finding | Consequence for VARI |
| --- | --- |
| Assistants split a prompt into several sub-searches (**query fan-out**), most of which have no measurable keyword volume | One page per **precise question cluster** beats one broad page. Long-tail questions are worth answering even with "zero volume" |
| Most ChatGPT citations come from its ordinary web-search retrieval (Ahrefs, 1.4 M prompts: ~88 %). ChatGPT search leans on **Bing** | Classic indexability still decides it: Bing Webmaster Tools + IndexNow, fast static HTML, clean sitemap |
| Perplexity and Google cite many sources per answer. ChatGPT cites fewer, but each citation has more influence (arXiv 2604.25707) | Aim to be the **one source that answers the sub-question best**: answer first, specific, verifiable |
| Pages with **sources, quotes and statistics** are cited more (GEO paper, KDD 2024: up to ~40 %). Keyword stuffing doesn't help | Each answer cites its sources, and shows VARI's **first-hand data** (turnaround, revision rounds, project facts) |
| A small set of domains takes most citations. **Third-party mentions** (forums, directories, press, YouTube) outweigh self-description | Off-site presence is about half the work (§7). The site alone isn't enough |
| "Best X" and comparison pages are the most cited format, and fresh ones win | Honest comparison and choosing pages, refreshed when facts change, never with fake date bumps |
| Schema.org and `llms.txt` are hygiene, not ranking levers | Keep them accurate and complete, without expecting much lift from them |

**VARI's unfair advantages:**
- original photoreal imagery (unique, citable, image-search traffic)
- four languages already live, with Turkish ready
- a real project portfolio to use as proof
- based in Cairo, serving clients worldwide
- three domains in one studio (architecture + interior + visualization), while most competitors cover one

---

## 2. System overview (six layers)

```
 L5  MEASURE & LEARN   prompt bank × engines monthly · GSC/Bing queries · AI-referrer analytics
        ▲                    │ new questions
        │                    ▼
 L4  DISTRIBUTE        Houzz · Behance · ArchDaily/Archilovers · CGArchitect · Clutch/DesignRush ·
        ▲              Google Business Profile · LinkedIn · YouTube · forums (as VARI, disclosed) · Wikidata
        │
 L3  MACHINE LAYER     JSON-LD graph · llms.txt + llms-full.txt · sitemap + hreflang · IndexNow · RSS
        ▲
 L2  SURFACES          Answer pages · Topic hubs · Glossary · Comparisons · Cost guides ·
        ▲              Service & location pages · Blog (long-form) · Project case studies
        │
 L1  QUESTION GRAPH    Domain → Topic → Cluster → Question (+ phrasings per language)
        ▲              each cluster has ONE owner page; signals feed new clusters
        │
 L0  FACT LAYER        Studio entity · Services · Projects (proof) · VARI numbers · Glossary ·
                       Sources registry (url + checked date) · People (named reviewers)
```

Everything above L0 **reads facts from L0** and never restates them by hand. When a fact
changes (a turnaround time, a service, a price range), it changes in one place and every
surface stays consistent. Answer engines punish contradictions between pages.

---

## 3. L0 — Fact layer (single source of truth)

| Fact set | Lives in | Status |
| --- | --- | --- |
| Studio entity: legal name, founding year, address (Al Shorouk City, Cairo), languages, contact, social profiles, `sameAs` | `site_settings.data` + `lib/content.ts` | Exists. Add founding year, team size and service area |
| Services: name, what's included, deliverables, typical turnaround, revision rounds | `services` table | Exists (title/body/note). **Add structured fields** (`deliverables`, `turnaround`, `revisions`, `from_price`) |
| Projects: proof for claims (type, location, scope, images) | `projects` | Exists. Add `discipline`, `building_type` and `year` for filtering and citation |
| **VARI numbers**: first-hand, aggregate figures (median turnaround per image type, revision rounds used, # projects by type, countries served) | New: `site_settings.data.facts` (i18n-free numbers + `as_of` date) | **Owner must supply.** Never invent or estimate |
| Glossary: ~120 terms (FF&E, BIM, LOD, PBR, HDRI, ray tracing, …) | New: `glossary_terms` | Proposed |
| Sources registry: every external number cites `{label, url, checked}` | New: `answers.sources` (+ shared list) | Proposed |
| People: named reviewers with real credentials (architect, interior designer, lead 3D artist) | New: reuse `blog_authors` (role, bio, links) | Exists for the blog. Add real people |

**Rule:** an answer may only state a VARI price, time or statistic that exists in L0, and an
external figure only with a source that was opened and checked (with the `checked` date shown).

---

## 4. L1 — Question graph

```
Domain (6)          visualization · interior · architecture · real-estate marketing · tools & AI · regional
  └ Topic (~25)     e.g. "Rendering costs", "Hiring an interior designer", "Off-plan marketing"
      └ Cluster     ONE search intent = ONE owner page (canonical question + 5–15 phrasings)
          └ Question phrasings per language (EN source; DE/ES/TR localized, not translated)
```

Each cluster carries:

| Attribute | Values | Used for |
| --- | --- | --- |
| `audience` | homeowner · developer · architect/designer (B2B outsourcing) · marketer/agent · student | Tone, examples, CTA |
| `intent` | learn · cost · compare · choose-provider · how-to · trust/risk · local | Page template |
| `stage` | aware → considering → deciding → hiring | Internal links, CTA strength |
| `page_type` | answer · hub · glossary · comparison · cost-guide · service · location · blog | Template + schema |
| `owner` | slug of the one page that owns the cluster | Prevents cannibalization |
| `proof` | services / projects / VARI numbers that support the answer | E-E-A-T, conversions |
| `priority` | P1 (commercial + evidence) · P2 · P3 | Production order |
| `evidence` | where the question was observed (§8) + date | Honesty, re-validation |

**Cannibalization rule:** before creating a page, search the map for the cluster. If a page
already owns it, extend that page or take a clearly different angle and link to the owner.
The five live launch articles already own five clusters (marked in the map).

**Localization rule:** German, Spanish and Turkish have their own search results and their
own phrasing and price expectations. For example, DE "Visualisierung Kosten pro Bild" sits
around €250–3,000, while ES "render arquitectónico precio por imagen" sits around €150–500.
Phrasings and examples are researched per language. They are never machine-translated from
English. Slugs are per language, as in the blog.

---

## 5. L2 — Surfaces (page types)

All pages live under `/{locale}/…`, are statically generated, use the `cms` tag, and show the
byline, reviewer and "updated" date. An answer page follows this structure (proven in the
sister project's `/answers`):

1. **H1 = the question** as people type it.
2. **Short answer**: 40–80 words, standalone, answer-first. This is the quotable unit, the
   chunk an assistant lifts.
3. **Key takeaways**: 3–5 bullets.
4. **Sections whose H2s are the follow-up questions** (fan-out sub-questions). Short
   paragraphs, lists, one idea per paragraph, stable `#anchors`.
5. Depending on intent:
   - **cost** → price table with ranges by type and region, the cost drivers, and "what VARI
     charges" from L0
   - **compare** → comparison table, plus "choose X when…"
   - **how-to** → numbered steps (HowTo)
   - **choose-provider** → checklist + red flags
6. **Proof block**: 1–3 relevant VARI projects with images, plus the matching service.
7. **"People also ask it as"**: the visible phrasings (honest breadth, never hidden text).
8. **FAQ**: 4–8 adjacent questions. **Sources** list with checked dates.
9. **Read next**: hub + 3 related answers + service CTA (enquiry form; `generate_lead`).

| Page type | Route (proposed) | Schema.org |
| --- | --- | --- |
| Answer | `/{l}/answers/{slug}` | `Article` + `FAQPage` (+ `HowTo`), `BreadcrumbList` |
| Topic hub | `/{l}/answers/topic/{slug}` | `CollectionPage` + `ItemList` |
| Glossary index / term | `/{l}/glossary`, `/{l}/glossary/{slug}` | `DefinedTermSet` / `DefinedTerm` |
| Comparison | answer page with `page_type = comparison` | `Article` + `ItemList`/table |
| Cost guide | answer page with `page_type = cost-guide` | `Article` + `FAQPage`, `Offer` ranges only from L0 |
| Service | existing `/services` + builder pages | `Service` (provider = VARI `ProfessionalService`) |
| Location | builder pages (exist: Germany, Spain) + Cairo/Egypt, UAE, KSA, Turkey | `Service` + `areaServed` |
| Project case study | `/work/{slug}` (add a 3-question "answer block": brief → challenge → result) | `CreativeWork` |
| Blog | `/blog/…` (long-form, opinion, news) | `BlogPosting` |

**Division of labour:** the blog holds narrative and opinion and dates. Answers hold
evergreen, precise answers that are updated in place. They link to each other and never
compete for the same cluster.

---

## 6. L3 — Machine layer

- **One JSON-LD graph per page**, linked by `@id`:
  - `Organization`/`ProfessionalService` (`#org`, with `sameAs` → all profiles + Wikidata)
  - `WebSite`
  - `Person` reviewers
  - `Service` items
  - the page entity

  Everything in schema must also be visible on the page.
- **`/llms.txt`** (generated, cached with `cms`): who VARI is, services, locations, and links
  to hubs, top answers and the glossary in every enabled language. **`/llms-full.txt`**:
  short answers + takeaways of every ready answer (plain text). Both come from the DB, so they
  never drift from the pages.
- **Sitemap**: add answers, hubs and glossary, with real `lastModified` and per-translation
  hreflang (same pattern as blog articles).
- **IndexNow** ping on publish (Bing, Yandex, Seznam). Submit in Bing Webmaster Tools.
- **robots**: allow `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Google-Extended`
  (owner decision: training crawlers like `GPTBot` and `CCBot` can be allowed or blocked
  separately without affecting search citations).
- **Speed and HTML**: answers render as static HTML with no client JS needed to read them,
  and images carry descriptive alt text in each language.

---

## 7. L4 — Distribution (off-site; often most of the citations)

| Channel | Action | Why |
| --- | --- | --- |
| Google Business Profile | Complete it, add categories (architectural designer, interior designer, 3D visualization), photos, collect reviews | Local + AI Overviews + Maps |
| Houzz (pro profile), Behance, ArchDaily/Archilovers, Pinterest | Projects with descriptions that link to `/work/{slug}` | Visual platforms assistants and Google cite |
| Clutch, DesignRush, Sortlist, GoodFirms | Verified reviews from real clients | "Best rendering studio" lists draw on these |
| CGArchitect, r/archviz, r/InteriorDesign, Houzz forums, Quora | Answer real threads **as VARI, disclosed**. Link an answer page only when it truly answers | Forums are among the most-cited sources |
| YouTube + LinkedIn | Short videos and articles titled like the questions, linking to the answer page | Cited by AI Overviews; LinkedIn for the B2B audience |
| Press and design media | Pitch first-party data (yearly "Visualization price & turnaround report" from VARI's own projects) | Earns links and the statistics engines quote |
| Wikidata | An entity for VARI Studio (only if it meets notability, with sources) | Entity disambiguation |

---

## 8. L5 — Question sourcing & measurement loop

**Sourcing (continuous, logged as `question_signals`):**

| Source | How | Notes |
| --- | --- | --- |
| Google Search Console + Bing Webmaster | Export queries that contain who/what/how/why/cost/vs/best, monthly | **Best signal**, because it's the real queries VARI already shows for |
| People Also Ask / AlsoAsked / AnswerThePublic | Seed with each topic, per language | Free tiers are enough to start |
| Reddit, Houzz, Quora, CGArchitect | Manual search by the team: `site:reddit.com/r/archviz price`, … | Not reachable by automated research here |
| AI assistants | Ask each engine "what do people ask about X"; record follow-up suggestions | Shows the fan-out sub-questions |
| Enquiry inbox | Tag recurring questions from `contact_submissions` | Most commercially valuable; already stored |
| Competitor FAQs and studio blogs | Note gaps and where they're thin | Never copy them |

**Measurement (monthly, logged-out browser):** run the prompt bank (each canonical question
+ 2 phrasings, in EN/DE/ES) in ChatGPT, Perplexity, Gemini, Google AI Mode and Copilot.
Record for each prompt: VARI mentioned (y/n), position, cited URL, competitor cited. Track
"visible in X / N prompts" per engine and language.

Also track:
- AI referrers in analytics (`chatgpt.com`, `perplexity.ai`, `gemini.google.com`,
  `copilot.microsoft.com`) as a Clarity/GA4 segment
- enquiries whose `source_path` starts with `/answers`

Expect movement after 4–12 weeks.

---

## 9. Data model (proposed, see the SQL file)

Same pattern as the blog: one language-independent row + one translation row per language,
RLS, the `audit_row` and `set_updated_at` triggers, column grants that hide working copies,
and the `languages` FK. Nothing hard-codes en/de/es.

```
answer_topics ──< answers ──< answer_translations      (locale → languages)
                    │  └─< answer_links (service key, project slug, related answer, blog post)
glossary_terms ──< glossary_translations
question_signals                                        (panel-only intake / backlog)
```

- `answers`: topic, `page_type`, `intent`, `audience[]`, `stage`, `priority`, `status`,
  `publish_at`, `reviewer_id` (→ `blog_authors`), `reviewed_at`, `sources jsonb`,
  `faq jsonb` (i18n).
- `answer_translations`:
  - `slug`, `question` (H1), `short_answer`, `takeaways`, `html`, `variants text[]`
  - `seo_title`, `seo_description`, `ready`, `source_hash` (outdated-translation flag, as
    in the blog), `word_count`
- `question_signals`: `text`, `locale`, `source`, `url`, `observed_at`, `volume`, `status`
  (new · mapped · rejected), `answer_id`. Never public.

Code (when approved):
- `lib/answers.ts` (reader, like `lib/blog.ts`)
- `app/[locale]/answers/…` and `app/[locale]/glossary/…`
- panel screens `admin/(panel)/answers`, `glossary`, `signals`
- add `answers` and `glossary` to `RESERVED_SLUGS`, the sitemap, `llms.txt` and the help text

---

## 10. Quality bar & the never-list

**Each answer must:**
- answer in the first 80 words
- be specific (numbers with ranges and conditions)
- separate a general market range from VARI's own price
- say when VARI is *not* the right choice
- name a real reviewer
- show the date and sources

**Never** (each of these is penalized or misleading, and would undo the rest):
- hidden text or instructions aimed at AI models
- cloaking (different content for bots)
- invented statistics or prices
- fake or undisclosed incentivized reviews
- sock-puppet forum accounts
- schema that claims what the page doesn't show
- date bumps without real changes
- mass-generated thin pages (Google's scaled-content-abuse policy)
- machine translation published without human review

---

## 11. Roll-out

| Phase | Scope | Output |
| --- | --- | --- |
| **0. Facts** (owner, 1 week) | Fill L0: VARI numbers, structured service facts, 2–3 named reviewers, GBP, Bing Webmaster | Facts the answers can quote |
| **1. Foundation** (dev) | Apply schema, `lib/answers.ts`, answer/hub/glossary routes, panel screens, JSON-LD graph, `llms.txt`, sitemap, IndexNow | Empty but complete system |
| **2. P1 content** | ~25 P1 clusters in EN, then DE + ES (localized), 40 glossary terms | First measurable surface |
| **3. Distribution** | Directories, Houzz/Behance, first forum answers, 5 videos | Third-party citations |
| **4. Loop** | Monthly prompt-bank run + GSC review → P2/P3 clusters, refresh pages | Compounding coverage |

Production rate that keeps quality: 3–5 answer pages per week per language, each reviewed by
a named expert.

---

### Sources

- Ahrefs ChatGPT-citation analysis, via [elitecontentmarketer.com GEO statistics](https://www.elitecontentmarketer.com/geo-aeo-statistics)
- [GEO measurement paper, arXiv 2604.25707](https://arxiv.org/html/2604.25707)
- [Everything-PR, six studies behind AI citations](https://everything-pr.com/how-ai-engines-cite-the-web-the-six-studies-that-define-the-2026-evidence-base)
- GEO paper (Aggarwal et al., KDD 2024)
- Market price ranges for rendering: see the sources in QUESTION-MAP.md
