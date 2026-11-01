// SEO landing pages built from page-builder blocks (see generate.mjs). All claims are
// limited to what VARI's portfolio and services show.
const IMG = {
  urbanNest: 'b80319_425c2f36f32b420da9c91cbd856c607d~mv2.jpg',
  hne: '8b4d4f_52780c64f74a4a3dac703141b59358c2~mv2.png',
  lightDark: '8b4d4f_df3765a13fea45d5ba0da2dc00f8b694~mv2.png',
  blackHome: '8b4d4f_525775bc11554914a009fed0206e2afc~mv2.png',
  hearth1: 'b80319_962a6cc04617409f94ea031705d4ee66~mv2.png',
  elysian: '8b4d4f_ecc4d5d2e2734e05be4233cb2cb30abe~mv2.png',
  minimalWood: '8b4d4f_1bfd140a3aec4e58898b8812dfebcdec~mv2.png',
  penthouse: '8b4d4f_2762a08d2c794d689b134249fc6cabac~mv2.png',
  roofGarden: '8b4d4f_d8c978fb79044dd5b22cf9f8edca55b7~mv2.png',
};
let n = 0;
const id = () => `lp${(++n).toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const b = (type, props, style = {}) => ({ id: id(), type, props, style });
import TR from './tr.mjs';
const t = (en, de, es) => (TR[en] ? { en, de, es, tr: TR[en] } : { en, de, es });
const link = (label, href) => ({ label, href });
const contactBtn = link(t('Request a quote', 'Angebot anfragen', 'Pedir presupuesto'), '/contact');
const workBtn = link(t('See our work', 'Unsere Projekte', 'Ver proyectos'), '/work');

export default [
  {
    slug: '3d-rendering-services-for-developers',
    title: t('3D rendering services for developers', '3D-Visualisierung für Bauträger', 'Render 3D para promotoras'),
    seo: {
      title: t('3D Rendering Services for Real Estate Developers | VARI', 'Visualisierung für Bauträger und Projektentwickler', 'Render 3D para promotoras inmobiliarias | VARI'),
      description: t(
        'Photorealistic 3D rendering for real estate developers: exteriors, interiors, animations and virtual tours to sell off-plan and win investors.',
        'Fotorealistische 3D-Visualisierung für Bauträger: Außen- und Innenansichten, Animationen und Rundgänge für Vertriebsstart, Investoren und Bauantrag.',
        'Render 3D fotorrealista para promotoras: exteriores, interiores, animaciones y tours virtuales para vender sobre plano y convencer a inversores.',
      ),
      image: IMG.urbanNest,
    },
    blocks: [
      b('hero', {
        eyebrow: t('For real estate developers', 'Für Bauträger', 'Para promotoras'),
        title: t('Sell your project *before* it is built', 'Verkaufen Sie Ihr Projekt, *bevor* es gebaut ist', 'Venda su promoción *antes* de construirla'),
        subtitle: t(
          'Photorealistic exteriors, interiors, animations and virtual tours that carry your development from planning application to the last sale.',
          'Fotorealistische Außen- und Innenansichten, Animationen und virtuelle Rundgänge, die Ihr Projekt vom Bauantrag bis zum letzten Verkauf tragen.',
          'Exteriores, interiores, animaciones y tours virtuales fotorrealistas que acompañan su promoción desde la licencia hasta la última venta.',
        ),
        image: IMG.urbanNest,
        buttons: [{ link: contactBtn }, { link: workBtn }],
        height: 'large',
        overlay: 45,
        align: 'left',
      }),
      b('text', {
        body: t(
          '## 3D rendering services built for developers\n\nBuyers, banks and planning authorities decide long before the first stone is laid. Our **3D rendering services for real estate developers** turn drawings into images people trust — consistent across your website, property portals, brochures, site hoarding and social media.\n\nWe build one detailed 3D model of your project and use it for every format you need, so later views, animations and tours build on work already done.',
          '## Visualisierung, die für Bauträger gemacht ist\n\nKäufer, Banken und Behörden entscheiden lange vor dem ersten Spatenstich. Unsere **Visualisierung für Bauträger** macht aus Plänen Bilder, denen man vertraut – einheitlich auf Website, Portalen, im Exposé, auf dem Bauschild und in Social Media.\n\nWir bauen ein detailliertes 3D-Modell Ihres Projekts und nutzen es für jedes Format, das Sie brauchen. So bauen spätere Ansichten, Animationen und Rundgänge auf vorhandener Arbeit auf.',
          '## Render 3D pensado para promotoras\n\nCompradores, bancos y administraciones deciden mucho antes de poner la primera piedra. Nuestro **render 3D para promotoras** convierte planos en imágenes creíbles, coherentes en su web, portales, folletos, valla de obra y redes sociales.\n\nConstruimos un modelo 3D detallado de su promoción y lo usamos para cada formato que necesite, de modo que las vistas, animaciones y tours posteriores parten del trabajo ya hecho.',
        ),
        columns: '1',
        large: true,
      }, { width: 'narrow' }),
      b('cards', {
        eyebrow: t('What we deliver', 'Was wir liefern', 'Qué entregamos'),
        title: t('One model, *every* channel', 'Ein Modell, *alle* Kanäle', 'Un modelo, *todos* los canales'),
        items: [
          { title: t('Exterior renderings', 'Außenvisualisierungen', 'Renders de exteriores'), body: t('Hero views, street and garden perspectives, dusk scenes and aerials in context.', 'Hauptansichten, Straßen- und Gartenperspektiven, Dämmerungsbilder und Luftbilder im Kontext.', 'Vistas principales, perspectivas de calle y jardín, escenas al atardecer y vistas aéreas en su entorno.'), image: IMG.lightDark, link: {} },
          { title: t('Interior renderings', 'Innenraumvisualisierungen', 'Renders de interiores'), body: t('Show apartments furnished for your target buyer, with the specification they will receive.', 'Wohnungen, eingerichtet für Ihre Zielgruppe – in der Ausstattung, die Käufer erhalten.', 'Viviendas amuebladas para su comprador objetivo, con las calidades que recibirá.'), image: IMG.hearth1, link: {} },
          { title: t('Animation & virtual tours', 'Animation & virtuelle Rundgänge', 'Animación y tours virtuales'), body: t('Walk-throughs for launch events and immersive tours for buyers who cannot visit.', 'Kamerafahrten für den Vertriebsstart und immersive Rundgänge für Käufer aus der Ferne.', 'Recorridos para el lanzamiento y tours inmersivos para compradores que no pueden visitar.'), image: IMG.roofGarden, link: {} },
        ],
        columns: '3',
        numbered: true,
      }),
      b('projects', { eyebrow: {}, title: t('Selected *exteriors*', 'Ausgewählte *Außenprojekte*', 'Exteriores *seleccionados*'), source: 'exterior', slugs: [], limit: 3, layout: 'grid' }, { width: 'wide' }),
      b('text', {
        body: t(
          '## How a developer project runs with us\n\n1. **Brief and file check** — plans, elevations, materials and your target buyer.\n2. **Draft cameras** — we agree the views before detailed work starts.\n3. **Materials and light** — the stage that makes images believable.\n4. **Final images** — in the formats you need for print, portals and social media.\n5. **Next formats** — animation or a virtual tour from the same model.\n\nPlanning the budget? Read our [rendering cost guide](/blog/architectural-rendering-cost) and how to [use visuals to sell off-plan](/blog/3d-rendering-for-real-estate-developers).',
          '## So läuft ein Bauträgerprojekt mit uns\n\n1. **Briefing und Datenprüfung** – Pläne, Ansichten, Materialien und Ihre Zielgruppe.\n2. **Entwurfskameras** – wir stimmen die Ansichten ab, bevor die Detailarbeit beginnt.\n3. **Material und Licht** – die Phase, die Bilder glaubwürdig macht.\n4. **Finale Bilder** – in den Formaten für Druck, Portale und Social Media.\n5. **Weitere Formate** – Animation oder virtueller Rundgang aus demselben Modell.\n\nSie planen das Budget? Lesen Sie unseren Ratgeber zu den [Kosten einer Architekturvisualisierung](/blog/architekturvisualisierung-kosten) und wie Sie mit [Visualisierungen vor Baubeginn verkaufen](/blog/visualisierung-fuer-bautraeger).',
          '## Cómo trabajamos una promoción\n\n1. **Briefing y revisión de archivos**: planos, alzados, materiales y su comprador objetivo.\n2. **Cámaras en borrador**: acordamos las vistas antes del trabajo de detalle.\n3. **Materiales y luz**: la fase que hace creíbles las imágenes.\n4. **Imágenes finales**: en los formatos para impresión, portales y redes.\n5. **Siguientes formatos**: animación o tour virtual con el mismo modelo.\n\n¿Está preparando el presupuesto? Lea nuestra guía de [precios del render arquitectónico](/blog/precio-render-arquitectonico) y cómo [vender sobre plano con render inmobiliario](/blog/render-inmobiliario-para-promotoras).',
        ),
        columns: '1',
        large: false,
      }, { width: 'narrow' }),
      b('faq', {
        title: t('Developer *questions*', 'Fragen von *Bauträgern*', 'Preguntas de *promotoras*'),
        items: [
          { q: t('When should we order renderings?', 'Wann sollten wir Visualisierungen beauftragen?', '¿Cuándo debemos encargar los renders?'), a: t('As soon as façades and layouts are stable — usually around the planning application — so the same images serve financing, approvals and the sales launch.', 'Sobald Fassaden und Grundrisse stehen – meist rund um den Bauantrag –, damit dieselben Bilder für Finanzierung, Genehmigung und Vertriebsstart dienen.', 'En cuanto fachadas y distribuciones estén cerradas, normalmente en torno a la licencia, para que las mismas imágenes sirvan para financiación, aprobaciones y lanzamiento.') },
          { q: t('Which files do you need?', 'Welche Unterlagen brauchen Sie?', '¿Qué archivos necesitan?'), a: t('Plans, elevations and sections (DWG, RVT, SKP or PDF), a materials list and a few reference images. A 3D model speeds things up but is not required.', 'Grundrisse, Ansichten und Schnitte (DWG, RVT, SKP oder PDF), eine Materialliste und einige Referenzbilder. Ein 3D-Modell beschleunigt, ist aber keine Voraussetzung.', 'Plantas, alzados y secciones (DWG, RVT, SKP o PDF), una lista de materiales y algunas referencias. Un modelo 3D acelera el trabajo, pero no es imprescindible.') },
          { q: t('Can you work with our international team?', 'Arbeiten Sie mit internationalen Teams?', '¿Pueden trabajar con nuestro equipo internacional?'), a: t('Yes. We work remotely with clients in Europe and North America, with clear milestones and online reviews.', 'Ja. Wir arbeiten remote mit Kunden in Europa und Nordamerika – mit klaren Meilensteinen und Online-Abstimmungen.', 'Sí. Trabajamos en remoto con clientes de Europa y Norteamérica, con hitos claros y revisiones online.') },
        ],
      }, { width: 'narrow' }),
      b('cta', { title: t('Tell us about your *development*', 'Erzählen Sie uns von Ihrem *Projekt*', 'Cuéntenos su *promoción*'), body: {}, primary: contactBtn, secondary: workBtn }, { bg: 'charcoal', align: 'center' }),
    ],
  },
  {
    slug: 'interior-visualization-services',
    title: t('Interior visualization services', 'Innenraumvisualisierung', 'Visualización de interiores'),
    seo: {
      title: t('Interior Rendering & Visualization Services | VARI Studio', 'Innenraumvisualisierung – fotorealistische Renderings', 'Render de interiores fotorrealista | VARI Studio'),
      description: t(
        'Photorealistic interior rendering services for interior designers, developers and homeowners: living spaces, kitchens, bathrooms and commercial interiors.',
        'Fotorealistische Innenraumvisualisierung für Innenarchitekten, Bauträger und Bauherren: Wohnräume, Küchen, Bäder und gewerbliche Innenräume.',
        'Render de interiores fotorrealista para interioristas, promotoras y particulares: salones, cocinas, baños e interiores comerciales.',
      ),
      image: IMG.elysian,
    },
    blocks: [
      b('hero', {
        eyebrow: t('Interior visualization', 'Innenraumvisualisierung', 'Visualización de interiores'),
        title: t('Rooms you can *feel* before they exist', 'Räume, die man *spürt*, bevor es sie gibt', 'Espacios que se *sienten* antes de existir'),
        subtitle: t('Light, materials and mood rendered with the care of an interior photograph.', 'Licht, Materialien und Stimmung – mit der Sorgfalt einer Interieurfotografie gerendert.', 'Luz, materiales y ambiente renderizados con el cuidado de una fotografía de interiores.'),
        image: IMG.elysian,
        buttons: [{ link: contactBtn }, { link: workBtn }],
        height: 'large',
        overlay: 40,
        align: 'left',
      }),
      b('text', {
        body: t(
          '## Interior rendering for every kind of space\n\nOur **interior rendering services** help interior designers win approval faster, developers show finished apartments while they are still a shell, and homeowners decide on materials before anything is ordered. We render living rooms, kitchens, bathrooms, bedrooms, offices, hospitality and retail interiors — and can also develop the interior concept itself.',
          '## Innenraumvisualisierung für jeden Raum\n\nUnsere **Innenraumvisualisierung** hilft Innenarchitekten, schneller Freigaben zu erhalten, Bauträgern, fertige Wohnungen im Rohbau zu zeigen, und Bauherren, Materialien vor der Bestellung zu entscheiden. Wir visualisieren Wohnräume, Küchen, Bäder, Schlafzimmer, Büros, Hotellerie und Läden – und entwickeln auf Wunsch auch das Innenraumkonzept selbst.',
          '## Render de interiores para cualquier espacio\n\nNuestro **render de interiores** ayuda a los interioristas a obtener aprobaciones antes, a las promotoras a mostrar viviendas terminadas cuando aún están en obra y a los particulares a decidir materiales antes de comprar. Renderizamos salones, cocinas, baños, dormitorios, oficinas, hostelería y comercios, y también podemos desarrollar el propio concepto de interiorismo.',
        ),
        columns: '1',
        large: true,
      }, { width: 'narrow' }),
      b('gallery', { images: [IMG.hearth1, IMG.minimalWood, IMG.penthouse, IMG.elysian], layout: 'masonry', columns: '2', lightbox: true }, { width: 'wide' }),
      b('cards', {
        eyebrow: t('Who it is for', 'Für wen', 'Para quién'),
        title: t('Made for *decisions*', 'Gemacht für *Entscheidungen*', 'Pensado para *decidir*'),
        items: [
          { title: t('Interior designers', 'Innenarchitekten', 'Interioristas'), body: t('Present concepts and material options that clients approve with confidence.', 'Konzepte und Materialvarianten präsentieren, die Kunden sicher freigeben.', 'Presente conceptos y opciones de materiales que el cliente aprueba con seguridad.'), image: '', link: {} },
          { title: t('Developers', 'Bauträger', 'Promotoras'), body: t('Show the finished apartment and amenities long before handover.', 'Die fertige Wohnung und Gemeinschaftsflächen lange vor der Übergabe zeigen.', 'Muestre la vivienda terminada y las zonas comunes mucho antes de la entrega.'), image: '', link: {} },
          { title: t('Homeowners', 'Bauherren', 'Particulares'), body: t('Compare layouts, colours and finishes before spending a cent.', 'Grundrisse, Farben und Oberflächen vergleichen, bevor ein Cent ausgegeben ist.', 'Compare distribuciones, colores y acabados antes de gastar un euro.'), image: '', link: {} },
        ],
        columns: '3',
        numbered: true,
      }),
      b('text', {
        body: t(
          '## What to send us\n\n- Floor plan with dimensions and ceiling heights\n- Elevations of kitchens, built-ins and feature walls\n- Materials, finishes, furniture and lighting choices\n- Two or three reference images for the mood you want\n\nOur [interior rendering guide](/blog/interior-rendering-guide) explains the process step by step.',
          '## Was Sie uns schicken\n\n- Bemaßter Grundriss mit Raumhöhen\n- Ansichten von Küche, Einbauten und Gestaltungswänden\n- Materialien, Oberflächen, Möbel und Leuchten\n- Zwei bis drei Referenzbilder für die gewünschte Stimmung\n\nUnser [Ratgeber zur Innenraumvisualisierung](/blog/innenraumvisualisierung-ratgeber) erklärt den Ablauf Schritt für Schritt.',
          '## Qué enviarnos\n\n- Planta acotada con alturas de techo\n- Alzados de cocina, mobiliario a medida y paredes principales\n- Materiales, acabados, mobiliario e iluminación\n- Dos o tres referencias del ambiente que busca\n\nNuestra [guía de render de interiores](/blog/render-de-interiores-guia) explica el proceso paso a paso.',
        ),
        columns: '1',
        large: false,
      }, { width: 'narrow' }),
      b('projects', { eyebrow: {}, title: t('Interior *projects*', 'Innenraum-*Projekte*', 'Proyectos de *interiores*'), source: 'interior', slugs: [], limit: 6, layout: 'grid' }, { width: 'wide' }),
      b('cta', { title: t('Let’s visualize your *interior*', 'Visualisieren wir Ihren *Innenraum*', 'Visualicemos su *interior*'), body: {}, primary: contactBtn, secondary: workBtn }, { bg: 'charcoal', align: 'center' }),
    ],
  },
  {
    slug: 'architectural-visualization-germany',
    title: t('Architectural visualization for Germany', 'Architekturvisualisierung für Deutschland', 'Visualización arquitectónica para Alemania'),
    seo: {
      title: t('Architectural Visualization for Projects in Germany | VARI', 'Architekturvisualisierung für Projekte in Deutschland', 'Visualización arquitectónica para Alemania | VARI'),
      description: t(
        'Photorealistic architectural visualization for architects and developers in Germany: exteriors, interiors and animation, with clear milestones.',
        'Fotorealistische Architekturvisualisierung für Architekten und Bauträger in Deutschland: Außen- und Innenansichten, Animationen, klare Meilensteine.',
        'Visualización arquitectónica fotorrealista para arquitectos y promotoras en Alemania: exteriores, interiores y animación, con hitos claros.',
      ),
      image: IMG.hne,
    },
    blocks: [
      b('hero', {
        eyebrow: t('Germany', 'Deutschland', 'Alemania'),
        title: t('Architectural visualization for *Germany*', 'Architekturvisualisierung für *Deutschland*', 'Visualización arquitectónica para *Alemania*'),
        subtitle: t(
          'For architects, developers and housing companies who need precise, photorealistic images for competitions, planning and marketing.',
          'Für Architekten, Bauträger und Wohnungsunternehmen, die präzise, fotorealistische Bilder für Wettbewerb, Bauantrag und Vermarktung brauchen.',
          'Para arquitectos, promotoras y empresas de vivienda que necesitan imágenes precisas y fotorrealistas para concursos, licencias y marketing.',
        ),
        image: IMG.hne,
        buttons: [{ link: link(t('Request a quote', 'Angebot anfragen', 'Pedir presupuesto'), '/contact') }],
        height: 'large',
        overlay: 45,
        align: 'left',
      }),
      b('text', {
        body: t(
          '## Precise architectural visualization for German projects\n\nGerman planning culture values precision: correct proportions, real materials and images that match the plans. Our **architectural visualization for Germany** is built on your drawings — Grundrisse, Ansichten and Schnitte — and on clear approval stages, so every image can stand in front of a planning committee, a jury or a buyer. One example is the [HNE Laboratory](/work/hne-laboratory) exterior for a project in Germany.\n\nWe work remotely with structured milestones: file check, draft cameras, materials and light, final images.',
          '## Präzise Architekturvisualisierung für Projekte in Deutschland\n\nDie deutsche Planungskultur schätzt Präzision: richtige Proportionen, echte Materialien und Bilder, die zu den Plänen passen. Unsere **Architekturvisualisierung für Deutschland** baut auf Ihren Unterlagen auf – Grundrisse, Ansichten und Schnitte – und auf klaren Freigabeschritten, damit jedes Bild vor Bauausschuss, Jury oder Käufer bestehen kann. Ein Beispiel ist die Außenvisualisierung des [HNE Laboratory](/work/hne-laboratory) für ein Projekt in Deutschland.\n\nWir arbeiten remote mit strukturierten Meilensteinen: Datenprüfung, Entwurfskameras, Material und Licht, finale Bilder.',
          '## Visualización arquitectónica precisa para proyectos en Alemania\n\nLa cultura de proyecto alemana valora la precisión: proporciones correctas, materiales reales e imágenes fieles a los planos. Nuestra **visualización arquitectónica para Alemania** parte de sus planos —plantas, alzados y secciones— y de fases de aprobación claras, para que cada imagen convenza a una comisión, un jurado o un comprador. Un ejemplo es el exterior del [HNE Laboratory](/work/hne-laboratory), un proyecto en Alemania.\n\nTrabajamos en remoto con hitos estructurados: revisión de archivos, cámaras en borrador, materiales y luz, imágenes finales.',
        ),
        columns: '1',
        large: true,
      }, { width: 'narrow' }),
      b('services', { title: t('Our *services*', 'Unsere *Leistungen*', 'Nuestros *servicios*'), link: link(t('All services', 'Alle Leistungen', 'Todos los servicios'), '/services') }),
      b('faq', {
        title: t('Frequently asked *questions*', 'Häufige *Fragen*', 'Preguntas *frecuentes*'),
        items: [
          { q: t('Do you work with German planning documents?', 'Arbeiten Sie mit deutschen Planunterlagen?', '¿Trabajan con documentación de proyecto alemana?'), a: t('Yes — DWG, RVT, SKP or PDF plans, elevations and sections, as well as material schedules.', 'Ja – mit Grundrissen, Ansichten und Schnitten als DWG, RVT, SKP oder PDF sowie mit Material- und Ausstattungslisten.', 'Sí: plantas, alzados y secciones en DWG, RVT, SKP o PDF, además de listas de materiales.') },
          { q: t('What does a visualization cost?', 'Was kostet eine Visualisierung?', '¿Cuánto cuesta una visualización?'), a: t('Each project is quoted individually after we see the drawings. Our cost guide explains typical market ranges in Germany.', 'Jedes Projekt wird nach Sichtung der Pläne individuell kalkuliert. Übliche Preisspannen in Deutschland erklärt unser Ratgeber „Was kostet eine Architekturvisualisierung?“.', 'Cada proyecto se presupuesta tras ver los planos. Nuestra guía de precios explica los rangos habituales.') },
        ],
      }, { width: 'narrow' }),
      b('cta', { title: t('Start your project in *Germany*', 'Starten Sie Ihr Projekt mit *uns*', 'Empiece su proyecto en *Alemania*'), body: {}, primary: link(t('Request a quote', 'Angebot anfragen', 'Pedir presupuesto'), '/contact'), secondary: link(t('See our work', 'Unsere Projekte', 'Ver proyectos'), '/work') }, { bg: 'charcoal', align: 'center' }),
    ],
  },
  {
    slug: 'architectural-rendering-spain',
    title: t('Architectural rendering for Spain', 'Architekturvisualisierung für Spanien', 'Render arquitectónico para España'),
    seo: {
      title: t('Architectural Rendering for Projects in Spain | VARI Studio', 'Architekturvisualisierung für Projekte in Spanien', 'Render arquitectónico para proyectos en España | VARI'),
      description: t(
        'Photorealistic architectural rendering for developers, architects and interior designers in Spain: exteriors, interiors, animation and virtual tours.',
        'Fotorealistische Architekturvisualisierung für Bauträger, Architekten und Innenarchitekten in Spanien: Außen- und Innenansichten und Animationen.',
        'Render arquitectónico fotorrealista para promotoras, arquitectos e interioristas en España: exteriores, interiores, animación y tours virtuales.',
      ),
      image: IMG.blackHome,
    },
    blocks: [
      b('hero', {
        eyebrow: t('Spain', 'Spanien', 'España'),
        title: t('Architectural rendering for *Spain*', 'Architekturvisualisierung für *Spanien*', 'Render arquitectónico para *España*'),
        subtitle: t(
          'Photorealistic visuals for off-plan sales, coastal villas, urban apartments and interior design projects — with project communication in Spanish.',
          'Fotorealistische Bilder für den Vorabverkauf, Küstenvillen, Stadtwohnungen und Innenräume – mit Projektkommunikation auf Spanisch.',
          'Imágenes fotorrealistas para venta sobre plano, villas de costa, viviendas urbanas y proyectos de interiorismo, con comunicación en español.',
        ),
        image: IMG.blackHome,
        buttons: [{ link: link(t('Request a quote', 'Angebot anfragen', 'Pedir presupuesto'), '/contact') }],
        height: 'large',
        overlay: 45,
        align: 'left',
      }),
      b('text', {
        body: t(
          '## Architectural rendering for promotions in Spain\n\nOff-plan sales are central to new residential development in Spain, and buyers — local and international — decide from images. Our **architectural rendering for Spain** covers exteriors in natural light, furnished interiors with the specification buyers receive, amenities such as pools and gardens, and animations or virtual tours for buyers who cannot visit.\n\nWe work remotely, with milestones and reviews online. Planning your budget? See our guide to [rendering cost](/blog/architectural-rendering-cost).',
          '## Visualisierung für Bauprojekte in Spanien\n\nDer Vorabverkauf ist im spanischen Wohnungsneubau zentral, und Käufer – lokal wie international – entscheiden anhand von Bildern. Unsere **Architekturvisualisierung für Spanien** umfasst Außenansichten im natürlichen Licht, möblierte Innenräume in der tatsächlichen Ausstattung, Gemeinschaftsflächen wie Pools und Gärten sowie Animationen oder Rundgänge für Käufer aus der Ferne.\n\nWir arbeiten remote, mit Meilensteinen und Online-Abstimmung. Zum Budget hilft unser Ratgeber [Was kostet eine Architekturvisualisierung?](/blog/architekturvisualisierung-kosten)',
          '## Render arquitectónico para promociones en España\n\nLa venta sobre plano es clave en la obra nueva residencial en España, y los compradores —nacionales e internacionales— deciden a partir de imágenes. Nuestro **render arquitectónico para España** incluye exteriores con luz natural, interiores amueblados con las calidades reales, zonas comunes como piscinas y jardines, y animaciones o tours virtuales para compradores que no pueden visitar.\n\nTrabajamos en remoto, con hitos y revisiones online. ¿Preparando el presupuesto? Consulte nuestra guía [¿Cuánto cuesta un render arquitectónico?](/blog/precio-render-arquitectonico)',
        ),
        columns: '1',
        large: true,
      }, { width: 'narrow' }),
      b('projects', { eyebrow: {}, title: t('Selected *work*', 'Ausgewählte *Projekte*', 'Proyectos *seleccionados*'), source: 'featured', slugs: [], limit: 3, layout: 'grid' }, { width: 'wide' }),
      b('faq', {
        title: t('Frequently asked *questions*', 'Häufige *Fragen*', 'Preguntas *frecuentes*'),
        items: [
          { q: t('Can we work in Spanish?', 'Ist die Zusammenarbeit auf Spanisch möglich?', '¿Podemos trabajar en español?'), a: t('Yes — the website, our communication and the project reviews are available in Spanish, English and German.', 'Ja – Website, Kommunikation und Projektabstimmungen sind auf Spanisch, Englisch und Deutsch möglich.', 'Sí: la web, la comunicación y las revisiones del proyecto están disponibles en español, inglés y alemán.') },
          { q: t('Which format suits an off-plan launch?', 'Welches Format passt zum Vertriebsstart?', '¿Qué formato encaja con un lanzamiento sobre plano?'), a: t('Usually a set of still renderings first, then an animation for the launch and a virtual tour for remote buyers.', 'Meist zuerst eine Serie Standbilder, dann eine Animation zum Start und ein virtueller Rundgang für Käufer aus der Ferne.', 'Normalmente primero una serie de renders, después una animación para el lanzamiento y un tour virtual para compradores a distancia.') },
        ],
      }, { width: 'narrow' }),
      b('cta', { title: t('Plan the visuals for your *project*', 'Planen Sie Ihre *Visualisierungen*', 'Planifique los renders de su *proyecto*'), body: {}, primary: link(t('Request a quote', 'Angebot anfragen', 'Pedir presupuesto'), '/contact'), secondary: link(t('See our work', 'Unsere Projekte', 'Ver proyectos'), '/work') }, { bg: 'charcoal', align: 'center' }),
    ],
  },
];
