# VARI Question Map

The inventory of real questions people ask about **architectural visualization, interior design
and architecture**, grouped into clusters, where each cluster gets **one owner page**. The system
that turns this map into pages is in [KNOWLEDGE-ECOSYSTEM.md](KNOWLEDGE-ECOSYSTEM.md).

Version 1, researched 2026-11-01. This is a living document. When the proposed schema is
applied, the map moves into the `answers` and `question_signals` tables, and this file
becomes the seed.

## How to read it

- **ID**: `Domain.Topic.Cluster`. IDs are stable, so link to them from tickets and the panel.
- **Canonical question**: the H1 of the owner page, in the words people use.
- **Also asked as**: other phrasings seen in search (these become the visible "People also
  ask it as" list).
- **Aud** (audience):
  - HO = homeowner / buyer
  - DEV = developer
  - ARC = architect or designer outsourcing
  - MKT = marketer or agent
  - BIZ = business owner (shop, café, office)
  - STU = student or learner
- **Intent**: L = learn · C = cost · CMP = compare · CH = choose a provider · HT = how-to ·
  T = trust / risk · LOC = local.
- **Type**: answer · cost-guide · comparison · hub · glossary · service · location · blog.
- **P**: P1 = high commercial value with strong evidence, built first · P2 · P3.
- **Ev** (evidence, where the cluster was observed):
  - V = vendor FAQs and People Also Ask patterns in search results
  - C = consumer checklists (home and design magazines)
  - F = practitioner forums (CGArchitect etc.)
  - D = German search results
  - E = Spanish search results
  - H = hypothesis to validate with Search Console or AlsoAsked
- **Owner** means a page already exists for the cluster. Extend it; don't duplicate it.

> Research limits: Reddit wasn't reachable by automated research, and no keyword-volume tool was
> used. Validate H-rated and P2/P3 clusters with Google Search Console, Bing Webmaster,
> AlsoAsked/AnswerThePublic and a manual Reddit/Houzz search before writing (KNOWLEDGE-ECOSYSTEM.md §8).

---

## V — Architectural visualization

### V1 · Costs & pricing
| ID | Canonical question | Also asked as | Aud | Intent | Type | P | Ev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| V1.1 | How much does architectural rendering cost? | price per render · how much does a 3D rendering cost · how much do renderers charge per image · average cost of an exterior render · is $800 for a render fair | DEV ARC HO | C | cost-guide | P1 | V D E — **Owner: blog `architectural-rendering-cost`** |
| V1.2 | How much does an interior rendering cost? | price of interior 3D render · kitchen render cost · bedroom visualization price · interior CGI price per image | HO ARC | C | cost-guide | P1 | V D |
| V1.3 | How much does a 3D architectural animation cost? | walkthrough video price per minute · flythrough cost · 3D animation for real estate price | DEV MKT | C | cost-guide | P1 | V |
| V1.4 | How much does a virtual tour of an unbuilt property cost? | 360 render price · CGI virtual tour cost · VR tour for off-plan price | DEV MKT | C | cost-guide | P2 | V |
| V1.5 | Why are architectural renderings so expensive? | what affects rendering price · cost drivers for 3D visualization · why do render quotes vary so much | ARC DEV | L C | answer | P1 | V |
| V1.6 | Freelancer, rendering studio or in-house renderer: which is better? | outsource rendering vs hire in-house · freelance archviz vs agency · is a rendering studio worth it | ARC DEV | CMP | comparison | P1 | V F |
| V1.7 | How much does rendering cost in different countries? | outsourcing rendering to Egypt / India / Eastern Europe price · cheapest country for archviz · rendering prices Europe vs Asia | ARC DEV | C CMP | cost-guide | P2 | V H |
| V1.8 | Are additional views, rush delivery and formats charged extra? | discount for multiple renders · rush render fee · same scene different angle price · render package pricing | DEV ARC | C | answer | P2 | V E |

### V2 · Process & deliverables
| ID | Canonical question | Also asked as | Aud | Intent | Type | P | Ev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| V2.1 | What do I need to send a rendering studio to get started? | files for 3D rendering · can you render from SketchUp / Revit / AutoCAD / ArchiCAD · rendering brief template | ARC DEV | HT | answer | P1 | V F |
| V2.2 | How long does an architectural rendering take? | render turnaround time · how fast can I get a 3D render · how long does an animation take | ARC DEV | L | answer | P1 | V D |
| V2.3 | How many revisions are included in a rendering project? | revision rounds rendering · what counts as a revision · cost of extra changes | ARC DEV | L T | answer | P1 | V E |
| V2.4 | Can you make a 3D render from a sketch or 2D floor plan? | render from hand drawing · floor plan to 3D · photo to render · napkin sketch to visualization | HO ARC | L HT | answer | P1 | V H |
| V2.5 | What resolution do renders need for print, billboards, web and social? | render size for brochure · billboard render resolution · 4K vs 8K render · Instagram render format | MKT DEV | HT | answer | P2 | V E |
| V2.6 | Who owns the copyright of architectural renderings? | can I use renders in marketing · render usage rights · can the studio post my project | DEV ARC | T | answer | P2 | H |
| V2.7 | Which render views and moods sell a project best? | best camera angles for renders · day vs dusk render · aerial vs eye-level · how many renders do I need | DEV MKT | HT | answer | P3 | V |

### V3 · Choosing a provider
| ID | Canonical question | Also asked as | Aud | Intent | Type | P | Ev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| V3.1 | How do I choose a 3D rendering studio? | how to find a good archviz company · rendering studio checklist · what to look for in a visualization studio | ARC DEV | CH | answer | P1 | V F D — **Owner: blog `how-to-choose-a-3d-rendering-studio`** |
| V3.2 | What questions should I ask a rendering company before hiring? | questions for archviz studio · rendering brief questions · what to ask a 3D visualizer | ARC DEV | CH | answer | P1 | V F |
| V3.3 | How can I tell a good architectural render from a bad one? | what makes a render photorealistic · signs of a cheap render · render quality checklist | ARC DEV MKT | CH L | answer | P1 | V F |
| V3.4 | Do rendering studios offer a test image or sample? | archviz trial project · paid test render · free sample render | ARC | CH T | answer | P2 | V |
| V3.5 | What are the best architectural visualization studios? | top archviz studios 2026 · best rendering company in the Middle East / Egypt / Europe | ARC DEV | CH CMP | comparison | P1 | V H — honest list, VARI's row labelled "us" |
| V3.6 | Is it safe to outsource rendering to a studio abroad? | NDA rendering outsourcing · time zones and communication · paying an overseas studio | ARC DEV | T | answer | P2 | V |

### V4 · Formats & uses
| ID | Canonical question | Also asked as | Aud | Intent | Type | P | Ev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| V4.1 | 3D rendering, animation or virtual tour: which does my project need? | render vs walkthrough · 360 tour vs video · best visual for off-plan | DEV MKT | CMP | comparison | P1 | V — **Owner: blog `3d-rendering-vs-animation-vs-virtual-tour`** |
| V4.2 | What is architectural visualization? | what is archviz · what is CGI in architecture · what does a 3D visualizer do | ALL | L | hub + glossary | P1 | V |
| V4.3 | Still renders, 360° panoramas or real-time (Unreal, VR): what's the difference? | real-time rendering vs offline · interactive 3D for real estate · VR walkthrough | DEV ARC | CMP | comparison | P2 | V |
| V4.4 | What is the difference between virtual staging and 3D rendering? | virtual staging vs CGI · furnish an empty listing digitally | MKT HO | CMP | comparison | P2 | V |
| V4.5 | 2D vs 3D floor plans: which is better for marketing? | 3D floor plan price · rendered floor plan · floor plan for brochure | MKT DEV | CMP C | answer | P2 | V |
| V4.6 | How much does 3D product and furniture modeling cost for e-commerce? | furniture rendering for website · product CGI vs photography · 3D model for configurator | BIZ | C CMP | cost-guide | P2 | H — VARI service "Product Modeling" |
| V4.7 | Do renderings help with planning approval or design competitions? | renders for planning application · competition visualization | ARC | L | answer | P3 | H |

---

## R — Real-estate marketing (developers & agents)

| ID | Canonical question | Also asked as | Aud | Intent | Type | P | Ev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R1.1 | How do developers sell off-plan property with 3D visuals? | off-plan marketing strategy · sell before construction · pre-launch visuals | DEV MKT | HT | answer | P1 | V — **Owner: blog `3d-rendering-for-real-estate-developers`** |
| R1.2 | Do 3D renders and virtual tours really increase property sales? | ROI of architectural visualization · do renders sell homes faster · virtual tour statistics | DEV MKT | L T | answer | P1 | V — **only cite figures with a verifiable primary source** |
| R1.3 | What visuals does a developer need for a project launch? | launch marketing package · brochure, billboard, website, tour checklist · how many renders for a launch | DEV MKT | HT | answer | P1 | V E |
| R1.4 | When should a developer order renders before launch? | rendering timeline for sales launch · lead time for CGI package | DEV | HT | answer | P2 | H |
| R1.5 | Are renders allowed in property ads, and what disclaimers are needed? | "artist's impression" disclaimer · misleading render advertising · do renders have to match the final building | DEV MKT | T | answer | P2 | H — general guidance; state that rules vary by country |
| R1.6 | How do I market compound and coastal projects in Egypt with 3D? | New Cairo launch visuals · North Coast chalet renders · developer marketing Egypt | DEV MKT | LOC HT | location | P2 | H |

---

## I — Interior design

### I1 · Hiring & cost
| ID | Canonical question | Also asked as | Aud | Intent | Type | P | Ev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| I1.1 | How much does an interior designer cost? | interior design fees · hourly vs flat fee vs percentage · interior designer price per m² | HO BIZ | C | cost-guide | P1 | V C |
| I1.2 | How much does interior design cost per square meter in Egypt? | interior design price Cairo · New Cairo finishing and design cost · تكلفة التصميم الداخلي للمتر | HO | C LOC | cost-guide | P1 | H — **gap: no reliable public figure exists, so VARI's own data can own it** |
| I1.3 | Is hiring an interior designer worth it? | do I need an interior designer · interior designer vs doing it myself | HO | L T | answer | P1 | C |
| I1.4 | What questions should I ask before hiring an interior designer? | how to interview an interior designer · interior designer checklist | HO BIZ | CH | answer | P1 | C |
| I1.5 | Interior designer, interior architect or decorator: who do I need? | difference between interior design and interior architecture · decorator vs designer | HO | CMP | comparison | P1 | V C |
| I1.6 | What does an interior designer do, step by step? | interior design process · phases of an interior design project · how long does interior design take | HO BIZ | L | answer | P1 | C |
| I1.7 | What are the red flags when hiring an interior designer? | bad interior designer signs · interior design contract problems | HO | T | answer | P2 | C |
| I1.8 | Online e-design or full-service interior design: which is better? | virtual interior design service · remote interior designer | HO | CMP | comparison | P2 | H |

### I2 · Design decisions
| ID | Canonical question | Also asked as | Aud | Intent | Type | P | Ev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| I2.1 | How do I choose an interior design style for my home? | interior styles explained · find my design style | HO | L | hub | P2 | C |
| I2.2 | What is the difference between modern, contemporary and minimalist interiors? | modern vs contemporary design · minimalism vs Japandi | HO | CMP | comparison | P2 | H |
| I2.3 | What is neoclassical interior design, and how do you do it well? | neoclassic apartment design · classic vs neoclassic | HO | L | answer | P2 | H — very popular in Egypt and the Gulf |
| I2.4 | How do I make a small apartment feel bigger? | small space layout · space-saving interior ideas | HO | HT | answer | P2 | H |
| I2.5 | What are the best kitchen layouts and dimensions? | L vs U vs island kitchen · kitchen work triangle | HO | HT CMP | answer | P2 | H |
| I2.6 | How do I choose flooring and finishes? | marble vs porcelain · flooring for hot climates · finishing materials guide | HO | CMP | answer | P2 | H |
| I2.7 | How do I plan interior lighting? | lighting layers · warm vs cool light · how many downlights | HO | HT | answer | P2 | H |
| I2.8 | What should I spend on first in a renovation budget? | renovation budget breakdown · where to save and splurge | HO | C HT | answer | P2 | H |

### I3 · Seeing it before building it (bridge to visualization)
| ID | Canonical question | Also asked as | Aud | Intent | Type | P | Ev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| I3.1 | Can I see my interior design in 3D before renovating? | 3D interior design service · visualize my room before buying furniture | HO | L CH | service | P1 | V |
| I3.2 | Moodboard, 3D render or material samples: what do I need to decide? | how designers present concepts · interior moodboard vs render | HO | CMP | answer | P2 | V — **Owner (part): blog `interior-rendering-guide`** |
| I3.3 | Room-design apps and AI tools vs hiring a professional: what's the difference? | Planner 5D / Homestyler vs designer · AI interior design accuracy | HO | CMP | comparison | P2 | H |

### I4 · Commercial & hospitality
| ID | Canonical question | Also asked as | Aud | Intent | Type | P | Ev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| I4.1 | How much does restaurant or café interior design cost? | coffee shop design cost · restaurant fit-out design process | BIZ | C | cost-guide | P2 | H |
| I4.2 | How do I design an office that people want to work in? | office interior design cost · office layout trends | BIZ | HT | answer | P3 | H |
| I4.3 | What is FF&E, and who handles it in a hotel project? | FF&E meaning · hospitality interior design process | BIZ ARC | L | glossary + answer | P3 | H |

---

## A — Architecture

| ID | Canonical question | Also asked as | Aud | Intent | Type | P | Ev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A1.1 | Architect or interior designer: who do I need for my project? | when to hire an architect · do I need an architect for a renovation | HO | CMP | comparison | P1 | V C |
| A1.2 | How much does an architect cost? | architect fees percentage of construction · architect fixed fee · villa design cost | HO DEV | C | cost-guide | P1 | V |
| A1.3 | What does an architect do, and what are the design phases? | concept, schematic, design development, construction documents · architectural design process | HO | L | answer | P1 | V |
| A1.4 | Do I need an architect and a permit to build a villa in Egypt? | building permit Egypt villa · licensed engineer requirement | HO | LOC T | answer | P2 | H — general guidance, link official sources only |
| A1.5 | How long does it take to design a house? | villa design timeline · from sketch to permit drawings | HO | L | answer | P2 | H |
| A2.1 | What makes a modern villa facade work? | modern villa design ideas · facade materials for hot climates | HO DEV | L | answer | P2 | H — VARI's exterior portfolio is the proof |
| A2.2 | Architectural styles explained | modern vs contemporary architecture · Mediterranean, minimalist, neoclassic villa | HO STU | L | hub | P3 | H |
| A2.3 | What is BIM, and do I need it? | BIM vs CAD · LOD 100–500 explained · 3D modeling & BIM service | ARC DEV | L | answer + glossary | P2 | V — VARI service "3D Modeling & BIM" |
| A2.4 | Which drawings does a building project need? | 2D drafting for permits · construction drawings list | HO ARC | L | answer | P3 | H — VARI service "2D Drafting" |
| A2.5 | How do you design for a hot climate? | passive cooling design · shading and orientation Egypt | HO ARC | L | answer | P3 | H |

---

## T — Tools, AI & learning (authority; mostly top of funnel)

| ID | Canonical question | Also asked as | Aud | Intent | Type | P | Ev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T1.1 | Will AI replace architectural visualization? | can AI make my renders · Midjourney for architecture · is archviz dying | ARC STU DEV | L T | answer | P1 | V F |
| T1.2 | AI render vs professional render: what's the difference? | are AI renders accurate · AI rendering for marketing · when is AI good enough | ARC DEV | CMP | comparison | P1 | V F |
| T1.3 | What is the best architectural rendering software? | V-Ray vs Corona vs D5 vs Lumion vs Enscape vs Twinmotion vs Unreal | ARC STU | CMP | comparison | P2 | V |
| T1.4 | How do you make renders look realistic? | photorealistic rendering tips · lighting and materials for archviz | STU ARC | HT | answer | P2 | F |
| T1.5 | How do I become an architectural visualization artist? | archviz career · 3D visualizer salary · skills for archviz | STU | L | answer | P3 | F |
| T1.6 | What computer do I need for rendering? | best GPU for rendering · CPU vs GPU rendering | STU ARC | HT | answer | P3 | F |

---

## L — Regional (localized phrasing, prices and proof)

| ID | Canonical question (in the market's language) | Also asked as | Aud | Intent | Type | P | Ev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| L1.1 | 3D rendering studio in Egypt (Cairo) | archviz company Cairo · شركة تصميم ثلاثي الأبعاد · outsource rendering to Egypt | DEV ARC | LOC CH | location | P1 | H |
| L1.2 | Interior design company in New Cairo / Sheikh Zayed / Al Shorouk | best interior designers Cairo · interior design and finishing company | HO | LOC CH | location | P1 | H |
| L2.1 | Architekturvisualisierung: Kosten pro Bild und wie finde ich ein Visualisierungsbüro? | Visualisierung Kosten · 3D-Visualisierung Preis · Visualisierungsbüro Bauträger | DEV ARC | LOC C CH | location | P1 | D — **Owner: landing `architectural-visualization-germany` + blog `architekturvisualisierung-kosten`** |
| L3.1 | Render arquitectónico: ¿cuánto cuesta y cómo elegir un estudio? | precio render por imagen · render inmobiliario promotoras · infografía 3D precio | DEV ARC | LOC C CH | location | P1 | E — **Owner: landing `architectural-rendering-spain`** |
| L4.1 | 3D rendering company for off-plan projects in Dubai / Riyadh | archviz UAE · rendering studio Saudi Arabia | DEV | LOC CH | location | P2 | H — owner decision: target the Gulf? |
| L5.1 | Mimari görselleştirme fiyatları / 3D render ofisi | render fiyatı · iç mekan görselleştirme | DEV ARC | LOC C | location | P3 | H — once Turkish is enabled |

---

## Glossary seed (first 40 terms, as `DefinedTerm` pages)

Architectural visualization (archviz) · CGI · Photorealistic rendering · Real-time rendering ·
Ray tracing · Path tracing · Global illumination · HDRI · PBR materials · Post-production ·
Clay render · Wireframe · Camera match / photomontage · Aerial render · Eye-level render ·
360° panorama · Virtual tour · Walkthrough / flythrough · Virtual staging · 3D floor plan ·
BIM · LOD (level of development) · CAD · SketchUp / Revit / ArchiCAD / 3ds Max ·
V-Ray / Corona / D5 / Lumion / Unreal · Moodboard · Concept design · Schematic design ·
Design development · Construction documents · Space planning · FF&E · Joinery · Fit-out ·
Finishing (Egypt: core & shell vs fully finished) · Off-plan · Artist's impression · Facade ·
Mood (day / dusk / night) · Render farm

---

## Facts VARI must supply before P1 pages are written

From the fact layer (KNOWLEDGE-ECOSYSTEM.md §3). Without these, pages can only quote market
ranges:

1. VARI's own price ranges (or a "from" price) for: exterior still, interior still, animation
   per minute, 360° tour, product model, interior design per m² (Egypt), and design packages.
2. Typical turnaround per deliverable and the included revision rounds.
3. Accepted input files, and the output resolutions and formats.
4. Copyright and usage terms, and the NDA policy.
5. Markets served (confirm Gulf and Turkey), plus project counts by type and country.
6. Two or three named reviewers with real credentials and short bios.
7. Permission to publish named case studies (client name, or anonymized).

---

## Prompt bank (monthly visibility test)

Run in ChatGPT, Perplexity, Gemini, Google AI Mode and Copilot, in EN, plus DE/ES where
marked. Record: mentioned (y/n), position, cited URL.

1. How much does an architectural rendering cost per image? (DE, ES)
2. What is the best 3D rendering studio for real estate developers?
3. How do I choose an architectural visualization company? (DE)
4. Rendering vs animation vs virtual tour for an off-plan project
5. How long does a 3D render take and how many revisions are normal?
6. What files do I need to send to a rendering studio?
7. Freelancer or rendering studio for architectural visualization?
8. Will AI replace architectural visualization?
9. AI render vs professional render for property marketing
10. How much does an interior designer cost?
11. Interior design cost per square meter in Cairo
12. Is it worth hiring an interior designer?
13. Interior designer vs interior architect vs architect: who do I need?
14. Can I see my apartment interior in 3D before renovating?
15. Best interior design company in New Cairo
16. 3D rendering company in Egypt
17. How do developers sell off-plan apartments with 3D visuals?
18. What visuals do I need for a real estate project launch?
19. How much does a 3D architectural animation cost per minute? (ES)
20. Architekturvisualisierung Bauträger Kosten (DE) · Render inmobiliario para promotoras precio (ES)

---

### Sources consulted (2026-11-01)

Market prices and checklists, used for clusters, not as facts to publish without re-checking:
[myarchitectai rendering cost](https://myarchitectai.com/blog/3d-architectural-rendering-cost) ·
[framesixty](https://framesixty.com/how-much-does-3d-rendering-cost/) ·
[render3dquick](https://render3dquick.com/blog/how-much-does-3d-rendering-cost) ·
[fotober](https://fotober.com/3d-rendering-pricing) ·
[maverickframe DE](https://maverickframe.com/de/blog/was-kostet-eine-3d-visualisierung/) ·
[maverickframe ES](https://maverickframe.com/es/blog/precio-render-3d/) ·
[ArchiCGI 9 questions](https://archicgi.com/9-questions-architectural-visualization-firms/) ·
[CGArchitect forum](https://forums.cgarchitect.com/tags/questionnaire) ·
[Homes & Gardens: 15 questions](https://www.homesandgardens.com/interior-design/questions-to-ask-before-hiring-an-interior-designer) ·
[Design Cafe](https://www.designcafe.com/blog/home-interiors/10-questions-to-ask-an-interior-designer) ·
[HomeAdvisor architect vs designer](https://www.homeadvisor.com/r/interior-designer-vs-architect) ·
[architecturelab](https://www.architecturelab.net/architect/vs-interior-designer/) ·
[CGArchitect: AI and archviz](https://cgarchitect.com/features/articles/5eff6d78-how-ai-could-change-the-fabric-of-architectural-visualization) ·
[The Nation: AI is not disrupting architecture](https://www.thenation.com/article/culture/ai-architecture-midjourney-dall-e) ·
[Designing Buildings: real-estate visualisation](https://www.designingbuildings.co.uk/wiki/3D%20real%20estate%20visualisation%20and%20virtual%20property%20walkthroughs)
