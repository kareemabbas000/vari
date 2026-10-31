import { IMG, cta, ext, fig, tip } from './helpers.mjs';

const BRIEF = 'https://archicgi.com/cgi-services/interior-renderings-project-brief/';

export default {
  key: 'interior',
  category: 'interior-design',
  cover: IMG.elysian,
  coverAlt: { en: 'Elegant interior rendering with soft light and refined materials', de: 'Elegante Innenraumvisualisierung mit weichem Licht und edlen Materialien', es: 'Render de interior elegante con luz suave y materiales refinados' },
  featured: false,
  daysAgo: 3,
  tags: ['interior-design', 'brief', 'process'],
  faq: [
    {
      q: { en: 'What files do I need for an interior rendering?', de: 'Welche Unterlagen braucht man für eine Innenraumvisualisierung?', es: '¿Qué archivos necesito para un render de interiores?' },
      a: {
        en: 'A floor plan with dimensions, ceiling heights, elevations of key walls (kitchen, built-ins), a materials and finishes list, furniture choices or links, lighting ideas and two or three reference images of the mood you want.',
        de: 'Einen bemaßten Grundriss, Raumhöhen, Ansichten wichtiger Wände (Küche, Einbauten), eine Material- und Oberflächenliste, Möbelauswahl oder Links, Lichtideen und zwei, drei Referenzbilder der gewünschten Stimmung.',
        es: 'Una planta acotada, alturas de techo, alzados de las paredes clave (cocina, mobiliario a medida), una lista de materiales y acabados, el mobiliario elegido o enlaces, ideas de iluminación y dos o tres referencias del ambiente buscado.',
      },
    },
    {
      q: { en: 'Can you render real furniture and materials from manufacturers?', de: 'Lassen sich echte Möbel und Materialien von Herstellern darstellen?', es: '¿Se pueden representar muebles y materiales reales de fabricantes?' },
      a: {
        en: 'Yes. Many manufacturers provide 3D models and texture files; otherwise pieces can be modelled from product photos and dimensions so that the rendering shows exactly what will be ordered.',
        de: 'Ja. Viele Hersteller stellen 3D-Modelle und Texturen bereit; andernfalls werden Möbel anhand von Produktfotos und Maßen modelliert, damit das Bild genau das zeigt, was bestellt wird.',
        es: 'Sí. Muchos fabricantes ofrecen modelos 3D y texturas; si no, las piezas se modelan a partir de fotos y medidas, para que el render muestre exactamente lo que se va a encargar.',
      },
    },
    {
      q: { en: 'How long does an interior rendering take?', de: 'Wie lange dauert eine Innenraumvisualisierung?', es: '¿Cuánto tarda un render de interiores?' },
      a: {
        en: 'It depends on the room and the level of custom detail. A single furnished room with a complete brief usually takes days rather than weeks; series with many custom pieces take longer. Ask for a schedule with draft and final stages.',
        de: 'Das hängt vom Raum und vom Anteil an Sonderanfertigungen ab. Ein einzelner möblierter Raum mit vollständigem Briefing dauert meist Tage statt Wochen; Serien mit vielen Einzelstücken länger. Fragen Sie nach einem Zeitplan mit Entwurfs- und Finalstand.',
        es: 'Depende de la estancia y del nivel de piezas a medida. Una sola estancia amueblada con un briefing completo suele llevar días, no semanas; las series con muchas piezas únicas tardan más. Pida un calendario con fase de borrador y fase final.',
      },
    },
  ],
  tr: {
    en: {
      slug: 'interior-rendering-guide',
      title: 'Interior Rendering: From Moodboard to Photorealistic Image',
      excerpt: 'How a photorealistic interior rendering is made, what you should prepare, and how to give feedback that turns a good image into one that sells the design.',
      focus: 'interior rendering',
      seoTitle: 'Interior Rendering Guide: Process, Brief and Feedback Tips',
      seoDesc: 'Interior rendering explained: the step-by-step process, what to include in your brief, how to give feedback and how to get photorealistic results.',
      takeaways: [
        'A strong brief — plan, heights, materials, furniture, light and references — is half the result.',
        'Approve cameras on draft renders before materials and lighting are refined.',
        'Light and materials make an interior believable; give feedback on them separately.',
        'Interior renderings help clients decide before anything is ordered or built.',
      ],
      html: `
<p>An <strong>interior rendering</strong> lets clients stand in a room before the first wall is painted. It is where design ideas become decisions: the stone for the kitchen island, the colour of the sofa, the warmth of the light at night. Done well, it removes doubt; done poorly, it creates it.</p>
<p>This guide walks through the process we follow at VARI and what you can prepare to get photorealistic results quickly.</p>
${fig(IMG.elysian, 'Interior rendering of an elegant living room with soft light', 'Elysian Aura — interior visualization.', 'wide')}
<h2>Why interior rendering matters</h2>
<ul>
<li><strong>For interior designers:</strong> clients approve concepts faster when they see them, not imagine them.</li>
<li><strong>For developers:</strong> show buyers the finished apartment while it is still a concrete shell.</li>
<li><strong>For homeowners:</strong> test materials, colours and layouts before money is spent.</li>
<li><strong>For brands and manufacturers:</strong> place products in beautiful, believable rooms without a photo shoot.</li>
</ul>
<h2>The interior rendering process, step by step</h2>
<h3>1. Brief and file check</h3>
<p>Everything starts with information. We check plans, heights, materials and references, and ask questions before modelling begins. A detailed brief is the most reliable way to avoid revision rounds — studio guides on ${ext(BRIEF, 'preparing an interior rendering brief')} make the same point.</p>
<h3>2. Modelling the space</h3>
<p>Walls, openings, ceilings, built-in joinery and the kitchen are built to the plan. Custom furniture is modelled from drawings or product data; catalogue pieces come from manufacturer models where available.</p>
<h3>3. Draft cameras</h3>
<p>Simple grey or lightly textured drafts show the camera angles. This is the moment to change viewpoints: moving a camera later means re-lighting and re-composing.</p>
<h3>4. Materials and lighting</h3>
<p>Wood grain direction, stone veining, fabric softness, reflections on metal — and above all light: daylight from the windows, artificial light at night, and how they mix. This stage decides whether an interior feels real.</p>
<h3>5. Styling</h3>
<p>Books, plants, textiles, artwork and small objects tell the story of who lives here. Styling should match the target client — calm and minimal, warm and layered, or bold and dramatic.</p>
<h3>6. Final render and post-production</h3>
<p>High-resolution rendering, colour grading and careful retouching produce the final image, delivered in the formats you need for presentations, print or web.</p>
${fig(IMG.minimalWood, 'Minimal interior rendering with warm wood surfaces', 'Material honesty: wood, light and proportion carry this minimal interior.')}
<h2>Your interior brief checklist</h2>
<ol>
<li>Floor plan with dimensions and ceiling heights (DWG, PDF or a model).</li>
<li>Elevations of feature walls, kitchen and built-in furniture.</li>
<li>Materials and finishes list — ideally with manufacturer names or samples.</li>
<li>Furniture and lighting choices, with links or product sheets.</li>
<li>Two or three reference images for mood, light and styling.</li>
<li>Camera wishes: which views matter most, and for which use (presentation, brochure, social media).</li>
</ol>
${tip('<p><strong>Tip:</strong> mark what is fixed and what is open. “Floor fixed, sofa fabric still open” helps us prepare variants without extra rounds.</p>')}
<h2>How to give feedback that works</h2>
<ul>
<li><strong>Collect feedback in one round</strong> from all decision-makers, instead of several partial rounds.</li>
<li><strong>Be specific:</strong> “warmer light near the window” beats “make it nicer”.</li>
<li><strong>Separate design changes from image changes:</strong> a different sofa is a design change; brighter light is an image change.</li>
<li><strong>Mark up images</strong> with arrows and short notes rather than long emails.</li>
</ul>
<h2>Interior rendering at VARI</h2>
<p>Interior visualization is at the heart of our work — from the layered warmth of <a href="/work/hearthstone-haven">Hearthstone Haven</a> to the calm of <a href="/work/minimal-wood">Minimal Wood</a> and the drama of <a href="/work/penthouse-in-dark-mood">Penthouse in Dark Mood</a>. Beyond rendering, our <a href="/services">services</a> include conceptual interior design, so we can also develop the design itself with you. Wondering what it costs? See our <a href="/blog/architectural-rendering-cost">rendering price guide</a>.</p>
${cta('Start your interior project')}
<h2>Conclusion</h2>
<p>A convincing interior rendering is built from good information, clear decisions and patient work on light and materials. Prepare a complete brief, approve cameras early and give focused feedback — and the image will do what it should: help everyone say yes to the design.</p>`,
    },
    de: {
      slug: 'innenraumvisualisierung-ratgeber',
      title: 'Innenraumvisualisierung: Vom Moodboard zum fotorealistischen Bild',
      excerpt: 'Wie eine fotorealistische Innenraumvisualisierung entsteht, was Sie vorbereiten sollten und wie Feedback aus einem guten Bild eines macht, das den Entwurf verkauft.',
      focus: 'Innenraumvisualisierung',
      seoTitle: 'Innenraumvisualisierung: Ablauf, Briefing und Feedback-Tipps',
      seoDesc: 'Innenraumvisualisierung erklärt: der Ablauf Schritt für Schritt, was ins Briefing gehört, wie Sie gutes Feedback geben und fotorealistische Ergebnisse erhalten.',
      takeaways: [
        'Ein starkes Briefing – Grundriss, Höhen, Materialien, Möbel, Licht und Referenzen – ist das halbe Ergebnis.',
        'Geben Sie Kameras anhand von Entwurfsbildern frei, bevor Material und Licht verfeinert werden.',
        'Licht und Materialien machen einen Innenraum glaubwürdig – geben Sie dazu getrennt Feedback.',
        'Innenraumvisualisierungen helfen, zu entscheiden, bevor etwas bestellt oder gebaut wird.',
      ],
      html: `
<p>Eine <strong>Innenraumvisualisierung</strong> lässt Kunden im Raum stehen, bevor die erste Wand gestrichen ist. Hier werden Ideen zu Entscheidungen: der Stein der Kücheninsel, die Farbe des Sofas, die Wärme des Lichts am Abend. Gut gemacht, nimmt sie Zweifel; schlecht gemacht, erzeugt sie welche.</p>
<p>Dieser Ratgeber zeigt den Ablauf, dem wir bei VARI folgen, und was Sie vorbereiten können, um schnell zu fotorealistischen Ergebnissen zu kommen.</p>
${fig(IMG.elysian, 'Innenraumvisualisierung eines eleganten Wohnzimmers mit weichem Licht', 'Elysian Aura – Innenraumvisualisierung.', 'wide')}
<h2>Wofür Innenraumvisualisierung wichtig ist</h2>
<ul>
<li><strong>Für Innenarchitekten:</strong> Kunden geben Konzepte schneller frei, wenn sie sie sehen statt sie sich vorzustellen.</li>
<li><strong>Für Bauträger:</strong> Käufern die fertige Wohnung zeigen, solange sie noch Rohbau ist.</li>
<li><strong>Für Bauherren:</strong> Materialien, Farben und Grundrisse testen, bevor Geld ausgegeben wird.</li>
<li><strong>Für Marken und Hersteller:</strong> Produkte in schönen, glaubwürdigen Räumen zeigen – ohne Fotoshooting.</li>
</ul>
<h2>Der Ablauf Schritt für Schritt</h2>
<h3>1. Briefing und Datenprüfung</h3>
<p>Alles beginnt mit Informationen. Wir prüfen Pläne, Höhen, Materialien und Referenzen und stellen Fragen, bevor die Modellierung beginnt. Ein detailliertes Briefing ist der verlässlichste Weg, Korrekturschleifen zu vermeiden – das betonen auch Leitfäden zum ${ext(BRIEF, 'Briefing für Innenraum-Renderings')}.</p>
<h3>2. Modellierung des Raums</h3>
<p>Wände, Öffnungen, Decken, Einbaumöbel und Küche entstehen nach Plan. Sondermöbel werden nach Zeichnungen oder Produktdaten modelliert; Katalogmöbel stammen, wo verfügbar, aus Herstellermodellen.</p>
<h3>3. Entwurfskameras</h3>
<p>Einfache graue oder leicht texturierte Entwürfe zeigen die Blickwinkel. Jetzt ist der Moment, Perspektiven zu ändern – eine spätere Kameraänderung bedeutet neues Licht und neuen Bildaufbau.</p>
<h3>4. Materialien und Licht</h3>
<p>Maserrichtung des Holzes, Äderung des Steins, Weichheit von Stoffen, Spiegelungen auf Metall – und vor allem Licht: Tageslicht durch die Fenster, Kunstlicht am Abend und ihr Zusammenspiel. Diese Phase entscheidet, ob ein Raum echt wirkt.</p>
<h3>5. Styling</h3>
<p>Bücher, Pflanzen, Textilien, Kunst und kleine Objekte erzählen, wer hier lebt. Das Styling sollte zur Zielgruppe passen – ruhig und minimal, warm und vielschichtig oder kraftvoll und dramatisch.</p>
<h3>6. Finales Rendering und Nachbearbeitung</h3>
<p>Hochauflösendes Rendern, Farbabstimmung und sorgfältige Retusche ergeben das finale Bild – in den Formaten, die Sie für Präsentation, Druck oder Web brauchen.</p>
${fig(IMG.minimalWood, 'Minimalistische Innenraumvisualisierung mit warmen Holzoberflächen', 'Ehrliche Materialien: Holz, Licht und Proportion tragen diesen minimalistischen Raum.')}
<h2>Checkliste für Ihr Briefing</h2>
<ol>
<li>Bemaßter Grundriss mit Raumhöhen (DWG, PDF oder Modell).</li>
<li>Ansichten von Gestaltungswänden, Küche und Einbaumöbeln.</li>
<li>Material- und Oberflächenliste – idealerweise mit Herstellern oder Mustern.</li>
<li>Möbel- und Leuchtenauswahl mit Links oder Datenblättern.</li>
<li>Zwei bis drei Referenzbilder für Stimmung, Licht und Styling.</li>
<li>Kamerawünsche: welche Ansichten am wichtigsten sind und wofür (Präsentation, Exposé, Social Media).</li>
</ol>
${tip('<p><strong>Tipp:</strong> Markieren Sie, was feststeht und was offen ist. „Boden steht fest, Sofastoff noch offen“ hilft uns, Varianten ohne zusätzliche Runden vorzubereiten.</p>')}
<h2>Feedback, das wirkt</h2>
<ul>
<li><strong>Feedback in einer Runde sammeln</strong> – von allen Entscheidern statt in mehreren Teilrunden.</li>
<li><strong>Konkret sein:</strong> „wärmeres Licht am Fenster“ statt „schöner machen“.</li>
<li><strong>Entwurfs- von Bildänderungen trennen:</strong> ein anderes Sofa ist eine Entwurfsänderung, helleres Licht eine Bildänderung.</li>
<li><strong>Bilder markieren</strong> mit Pfeilen und kurzen Notizen statt langer E-Mails.</li>
</ul>
<h2>Innenraumvisualisierung bei VARI</h2>
<p>Innenräume sind das Herz unserer Arbeit – von der vielschichtigen Wärme von <a href="/work/hearthstone-haven">Hearthstone Haven</a> über die Ruhe von <a href="/work/minimal-wood">Minimal Wood</a> bis zur Dramatik von <a href="/work/penthouse-in-dark-mood">Penthouse in Dark Mood</a>. Neben der Visualisierung umfassen unsere <a href="/services">Leistungen</a> auch konzeptionelle Innenarchitektur – wir können den Entwurf also gemeinsam mit Ihnen entwickeln. Zu den Kosten informiert unser Ratgeber <a href="/blog/architekturvisualisierung-kosten">Was kostet eine Architekturvisualisierung?</a></p>
${cta('Ihr Innenraumprojekt starten')}
<h2>Fazit</h2>
<p>Eine überzeugende Innenraumvisualisierung entsteht aus guten Informationen, klaren Entscheidungen und geduldiger Arbeit an Licht und Material. Bereiten Sie ein vollständiges Briefing vor, geben Sie Kameras früh frei und geben Sie gezieltes Feedback – dann leistet das Bild, was es soll: Allen hilft es, Ja zum Entwurf zu sagen.</p>`,
    },
    es: {
      slug: 'render-de-interiores-guia',
      title: 'Render de interiores: del moodboard a la imagen fotorrealista',
      excerpt: 'Cómo se crea un render de interiores fotorrealista, qué debe preparar y cómo dar un feedback que convierta una buena imagen en una que venda el diseño.',
      focus: 'render de interiores',
      seoTitle: 'Render de interiores: proceso, briefing y feedback',
      seoDesc: 'Render de interiores explicado: el proceso paso a paso, qué incluir en el briefing, cómo dar feedback eficaz y cómo lograr resultados fotorrealistas.',
      takeaways: [
        'Un buen briefing —planta, alturas, materiales, mobiliario, luz y referencias— es la mitad del resultado.',
        'Apruebe las cámaras en los borradores antes de afinar materiales e iluminación.',
        'La luz y los materiales hacen creíble un interior: comente cada aspecto por separado.',
        'Los renders de interiores ayudan a decidir antes de comprar o construir nada.',
      ],
      html: `
<p>Un <strong>render de interiores</strong> permite al cliente estar en una estancia antes de pintar la primera pared. Es donde las ideas se convierten en decisiones: la piedra de la isla, el color del sofá, la calidez de la luz por la noche. Bien hecho, elimina dudas; mal hecho, las crea.</p>
<p>Esta guía recorre el proceso que seguimos en VARI y lo que puede preparar para obtener resultados fotorrealistas con rapidez.</p>
${fig(IMG.elysian, 'Render de interior de un salón elegante con luz suave', 'Elysian Aura: visualización de interiores.', 'wide')}
<h2>Por qué importa el render de interiores</h2>
<ul>
<li><strong>Para interioristas:</strong> los clientes aprueban antes un concepto que ven que uno que imaginan.</li>
<li><strong>Para promotoras:</strong> mostrar la vivienda terminada cuando aún está en estructura.</li>
<li><strong>Para propietarios:</strong> probar materiales, colores y distribuciones antes de gastar.</li>
<li><strong>Para marcas y fabricantes:</strong> presentar productos en estancias bonitas y creíbles sin sesión de fotos.</li>
</ul>
<h2>El proceso paso a paso</h2>
<h3>1. Briefing y revisión de archivos</h3>
<p>Todo empieza con información. Revisamos planos, alturas, materiales y referencias, y preguntamos antes de modelar. Un briefing detallado es la forma más fiable de evitar rondas de revisión, como también señalan las guías sobre ${ext(BRIEF, 'cómo preparar el briefing de un render de interiores')}.</p>
<h3>2. Modelado del espacio</h3>
<p>Paredes, huecos, techos, carpintería a medida y cocina se construyen según el plano. El mobiliario a medida se modela a partir de dibujos o datos del producto; las piezas de catálogo, cuando existen, salen de los modelos del fabricante.</p>
<h3>3. Cámaras en borrador</h3>
<p>Borradores sencillos en gris o con texturas básicas muestran los encuadres. Es el momento de cambiar puntos de vista: mover una cámara más tarde implica volver a iluminar y componer.</p>
<h3>4. Materiales e iluminación</h3>
<p>La veta de la madera, el veteado de la piedra, la suavidad de los tejidos, los reflejos del metal y, sobre todo, la luz: natural por las ventanas, artificial por la noche y cómo se mezclan. Esta fase decide si un interior parece real.</p>
<h3>5. Estilismo</h3>
<p>Libros, plantas, textiles, arte y pequeños objetos cuentan quién vive allí. El estilismo debe encajar con el cliente objetivo: sereno y minimalista, cálido y por capas, o intenso y dramático.</p>
<h3>6. Render final y posproducción</h3>
<p>El render en alta resolución, el etalonaje y un retoque cuidadoso dan como resultado la imagen final, en los formatos que necesite para presentaciones, impresión o web.</p>
${fig(IMG.minimalWood, 'Render de interior minimalista con superficies de madera cálidas', 'Honestidad material: madera, luz y proporción sostienen este interior minimalista.')}
<h2>Checklist para su briefing</h2>
<ol>
<li>Planta acotada con alturas de techo (DWG, PDF o modelo).</li>
<li>Alzados de paredes principales, cocina y mobiliario a medida.</li>
<li>Lista de materiales y acabados, a ser posible con fabricante o muestras.</li>
<li>Mobiliario e iluminación elegidos, con enlaces o fichas técnicas.</li>
<li>Dos o tres referencias de ambiente, luz y estilismo.</li>
<li>Cámaras deseadas: qué vistas importan más y para qué uso (presentación, folleto, redes sociales).</li>
</ol>
${tip('<p><strong>Consejo:</strong> indique qué está decidido y qué sigue abierto. «Suelo cerrado, tela del sofá pendiente» nos permite preparar variantes sin rondas adicionales.</p>')}
<h2>Cómo dar un feedback eficaz</h2>
<ul>
<li><strong>Reúna el feedback en una sola ronda</strong> de todos los que deciden, en lugar de varias rondas parciales.</li>
<li><strong>Sea concreto:</strong> «luz más cálida junto a la ventana» funciona mejor que «hazlo más bonito».</li>
<li><strong>Separe cambios de diseño y de imagen:</strong> otro sofá es un cambio de diseño; más luz, un cambio de imagen.</li>
<li><strong>Marque las imágenes</strong> con flechas y notas breves en lugar de correos largos.</li>
</ul>
<h2>Render de interiores en VARI</h2>
<p>Los interiores son el corazón de nuestro trabajo: desde la calidez por capas de <a href="/work/hearthstone-haven">Hearthstone Haven</a> hasta la calma de <a href="/work/minimal-wood">Minimal Wood</a> y el dramatismo de <a href="/work/penthouse-in-dark-mood">Penthouse in Dark Mood</a>. Además del render, nuestros <a href="/services">servicios</a> incluyen diseño de interiores conceptual, así que también podemos desarrollar el diseño con usted. ¿Se pregunta cuánto cuesta? Consulte nuestra <a href="/blog/precio-render-arquitectonico">guía de precios</a>.</p>
${cta('Empiece su proyecto de interiores')}
<h2>Conclusión</h2>
<p>Un render de interiores convincente nace de buena información, decisiones claras y un trabajo paciente sobre luz y materiales. Prepare un briefing completo, apruebe las cámaras pronto y dé un feedback concreto: así la imagen hará lo que debe, ayudar a todos a decir sí al diseño.</p>`,
    },
  },
};
