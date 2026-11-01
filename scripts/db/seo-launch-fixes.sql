-- SEO launch fixes (docs/seo/TECHNICAL-AUDIT.md). Run in Supabase → SQL Editor.
-- Each part is independent and safe to re-run. The site picks the changes up within 5 minutes
-- (or immediately after any "Publish" in the panel).

-- ---------------------------------------------------------------------------
-- 1. Landing-page meta descriptions over 155 characters (Google truncates them)
-- ---------------------------------------------------------------------------
update public.pages set seo = jsonb_set(seo, '{description,en}', to_jsonb($d$Photorealistic 3D rendering for real estate developers: exteriors, interiors, animations and virtual tours to sell off-plan and win investors.$d$::text), true) where slug = '3d-rendering-services-for-developers';
update public.pages set seo = jsonb_set(seo, '{description,de}', to_jsonb($d$Fotorealistische 3D-Visualisierung für Bauträger: Außen- und Innenansichten, Animationen und Rundgänge für Vertriebsstart, Investoren und Bauantrag.$d$::text), true) where slug = '3d-rendering-services-for-developers';
update public.pages set seo = jsonb_set(seo, '{description,es}', to_jsonb($d$Render 3D fotorrealista para promotoras: exteriores, interiores, animaciones y tours virtuales para vender sobre plano y convencer a inversores.$d$::text), true) where slug = '3d-rendering-services-for-developers';
update public.pages set seo = jsonb_set(seo, '{description,en}', to_jsonb($d$Photorealistic architectural visualization for architects and developers in Germany: exteriors, interiors and animation, with clear milestones.$d$::text), true) where slug = 'architectural-visualization-germany';
update public.pages set seo = jsonb_set(seo, '{description,de}', to_jsonb($d$Fotorealistische Architekturvisualisierung für Architekten und Bauträger in Deutschland: Außen- und Innenansichten, Animationen, klare Meilensteine.$d$::text), true) where slug = 'architectural-visualization-germany';
update public.pages set seo = jsonb_set(seo, '{description,es}', to_jsonb($d$Visualización arquitectónica fotorrealista para arquitectos y promotoras en Alemania: exteriores, interiores y animación, con hitos claros.$d$::text), true) where slug = 'architectural-visualization-germany';
update public.pages set seo = jsonb_set(seo, '{description,de}', to_jsonb($d$Fotorealistische Architekturvisualisierung für Bauträger, Architekten und Innenarchitekten in Spanien: Außen- und Innenansichten und Animationen.$d$::text), true) where slug = 'architectural-rendering-spain';

-- ---------------------------------------------------------------------------
-- 2. German articles: VARI's own service is "Interior Design", not "Innenarchitektur"
--    ("Innenarchitekt" is a protected professional title in Germany).
--    Mentions of Innenarchitekten as an audience ("für Innenarchitekten") stay unchanged.
-- ---------------------------------------------------------------------------
update public.blog_post_translations
   set html = replace(replace(html, 'Innenarchitektur-Konzepte', 'Interior-Design-Konzepte'), '<h3>Innenarchitektur-Projekt</h3>', '<h3>Interior-Design-Projekt</h3>')
 where locale = 'de' and (html like '%Innenarchitektur-Konzepte%' or html like '%<h3>Innenarchitektur-Projekt</h3>%');


-- ---------------------------------------------------------------------------
-- 5. German proofread fixes (full review of the 5 German articles and 4 landing pages)
-- ---------------------------------------------------------------------------
-- VARI's service is "Interior Design" (protected title), comma before "statt", smoother closing line,
-- and the US-dollar rows of the German cost table are labelled as US sources.
update public.blog_post_translations set html =
  replace(replace(replace(replace(replace(html,
    'konzeptionelle Innenarchitektur', 'konzeptionelles Interior Design'),
    'wenn sie sie sehen statt sie sich vorzustellen', 'wenn sie sie sehen, statt sie sich vorzustellen'),
    'Allen hilft es, Ja zum Entwurf zu sagen.', 'Es hilft allen Beteiligten, Ja zum Entwurf zu sagen.'),
    '<td>ca. 800–2.000 $</td>', '<td>ca. 800–2.000 $ (US-Quelle)</td>'),
    '<td>ca. 2.500–20.000 $</td>', '<td>ca. 2.500–20.000 $ (US-Quelle)</td>')
 where locale = 'de';

update public.pages
   set blocks = replace(blocks::text, 'Stadtwohnungen und Innenarchitektur', 'Stadtwohnungen und Innenräume')::jsonb
 where slug = 'architectural-rendering-spain' and blocks::text like '%Stadtwohnungen und Innenarchitektur%';

-- ---------------------------------------------------------------------------
-- 3. Before the German launch: check that the German articles are ready
-- ---------------------------------------------------------------------------
select t.slug, t.ready, p.status, p.publish_at
  from public.blog_post_translations t join public.blog_posts p on p.id = t.post_id
 where t.locale = 'de' order by p.publish_at;

-- ---------------------------------------------------------------------------
-- 4. GERMAN LAUNCH: only after a native proofread (docs/seo/STRATEGY.md §5).
--    Same effect as Panel → Languages → German → on. Undo with enabled = false.
-- ---------------------------------------------------------------------------
-- update public.languages set enabled = true where code = 'de';
