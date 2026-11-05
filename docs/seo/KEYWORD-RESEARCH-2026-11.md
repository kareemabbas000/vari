# Keyword gap research — November 2026

Researched 2026-11-05. On-page and content only (no off-page plan, per the owner).

## Method

1. **Demand.** Google autocomplete for 94 seed phrases in four markets (EN/US, DE/DE, ES/ES, TR/TR), each expanded with 26 modifiers (a–w, "best", "top", "how much", "cost"): **2,538 queries, 9,642 suggestions**. Raw data: `docs/seo/data/autocomplete-2026-11-05.json`, script: `docs/seo/data/autocomplete-mine.py`. Autocomplete shows what people actually type; the number of distinct suggestions in a cluster ("depth") is our demand signal. It is not a search volume: no paid keyword tool was used, so no monthly volumes are claimed.
2. **Competition.** For each candidate, we read who ranks today (web search, 2026-11-05) and judged whether a sourced, honest page could beat them.
3. **Fit.** Would the searcher be a prospect for VARI (interior design, 3D visualization, real estate marketing)?
4. **Owner rule.** No candidate may compete with a page in `KEYWORD-MAP.md`.

## Demand by cluster (autocomplete depth)

| Cluster | Language | Distinct suggestions | Examples |
| --- | --- | --- | --- |
| Interior designer cost | EN | 355 | how much does it cost to hire an interior designer · interior designer cost uk · how much does an interior designer cost |
| Off-plan marketing | EN | 217 | best off plan projects in dubai · off plan vs ready property |
| 3D floor plans | EN | 214 | 3d floor plan cost · how much does a 3d floor plan cost |
| Virtual staging | EN (+196 in the DE market) | 171 | how much does virtual staging cost · virtual staging vs real staging · virtual staging uk |
| Interior design studios | ES | 169 | estudio de interiorismo madrid · mejores empresas de interiorismo en madrid |
| Interior design firms, Dubai/UAE | EN | 146 | best interior design companies in dubai |
| Interior design firms | TR | 138 | iç mimarlık firmaları istanbul · dekorasyon firmaları |
| Interior design firms, UK/London | EN | 66 | best interior design firms london |
| Top interior architects | DE | 63 | top innenarchitekten deutschland · innenarchitekt berlin |
| Home staging (virtual) | ES | 41 | home staging virtual idealista precio |
| Interior designer fees | TR | 37 | iç mimar fiyatları 2026 · iç mimar metrekare fiyatları |
| Interior design firms, world | EN | 35 | best interior design firms in the world · biggest interior design firms in the world |
| Interior architect fees | DE | 24 | innenarchitekt kosten · innenarchitekt kosten pro qm · innenarchitekt kosten pro stunde |
| Interior design firms, Europe | EN | 13 | best interior design firms in europe · best interior design company in germany |

## What ranks today (the gaps)

| Query | Who ranks | Gap |
| --- | --- | --- |
| best interior design firms in europe | Furniture-brand blogs (Luxxu, Brabbu, Essential Home, one group) listing their own customers; illustrarch | **Large.** No sourced, award-based guide |
| best interior design firms in the world | Firm press releases, thin listicles | **Large.** No page explains the Interior Design Giants data in plain words |
| top innenarchitekten deutschland | listenchampion.de (paid address lists), directories | **Very large.** No editorial guide in German |
| innenarchitekt kosten | Forums, portals; no page uses the actual HOAI tables | **Large.** HOAI §34/§35 numbers are public and nobody explains them |
| iç mimar fiyatları 2026 | Salary sites, portals | **Large.** No page explains the İçmimarlar Odası formula with 2026 unit costs |
| precio interiorista | Portals (Habitissimo, Cronoshare), AI-written blogs | Medium. A clear comparison of both portals plus fee models wins on quality |
| virtual staging cost | Vendor blogs only | Medium. A neutral page with NAR data and the 2026 disclosure laws (California AB 723, CRMLS, DMCC Act, EU AI Act) is unique |
| 3d visualization company in dubai | Spam wikis, directories, one competitor | Large, but **verification is hard** (few Dubai studios have independent awards). Next wave |

## What we published (2026-11-05)

| # | EN focus | DE | ES | TR | Why |
| --- | --- | --- | --- | --- | --- |
| 15 | best interior design firms in the world | innenarchitekturbüros weltweit | mejores estudios de interiorismo del mundo | dünyanın en iyi iç mimarlık firmaları | Weak SERP; real data (Giants 2026) |
| 16 | best interior design firms in europe | top innenarchitekten deutschland | estudios de interiorismo europa | avrupa iç mimarlık firmaları | Weakest SERP; German prospects |
| 17 | virtual staging | virtual staging kosten | home staging virtual | virtual staging | Agents and developers = prospects; new 2026 laws |
| 18 | how much does an interior designer cost | innenarchitekt kosten | precio interiorista | iç mimar fiyatları | Deepest cluster; **localized per market**, not translated |

Article 18 is deliberately localized: each language version answers the question for its own market (US/UK, Germany's HOAI, Spain's market prices, Turkey's chamber formula). Same topic, same hreflang group, different local facts. That is what a German or Turkish searcher actually needs.

## Next wave (ranked)

1. **3D floor plans: cost and uses** (EN 214 suggestions; DE "3d grundriss" is mostly DIY-tool intent, so EN first). Good fit for agents and developers.
2. **Interior design firms in Dubai / UAE** (146) and **3D visualization companies in Dubai** — only with verifiable studios (trade licence, independent award or press); otherwise skip.
3. **Interior design firms in London / UK** (66). The UK has many Dezeen and FRAME winners, so it can be done to the same standard as article 16.
4. **Off-plan vs ready property and off-plan marketing visuals** (217, mostly Dubai investors) — informational, links to the developer service page.
5. **City pages** ("innenarchitekt berlin", "iç mimarlık firmaları istanbul", "estudio de interiorismo madrid") are large but local. VARI is not in those cities, so a city list would be weak and could look manipulative. Do not write them unless a city-specific angle exists (for example, "remote interior design for Berlin apartments").

## Rules kept

- Lists include only firms with an independent signal and a source; self-reported awards are labelled as such.
- VARI is never ranked; each list has a separate "Where VARI fits".
- Vendor price data is labelled as vendor data; no invented statistics.
- One owner page per intent (`KEYWORD-MAP.md`).
