import { IMG, cta, ext, fig, tip } from './helpers.mjs';

const ES_DIFF = 'https://www.moncloa.com/2022/12/17/visual-re-y-las-principales-diferencias-entre-tour-virtual-360-renders-3d-e-imagenes-360o-1760799/';
const COST = 'https://www.myarchitectai.com/blog/3d-architectural-rendering-cost';

export default {
  key: 'formats',
  category: '3d-visualization',
  cover: IMG.lightDark,
  coverAlt: { en: 'Night exterior rendering of a modern house glowing from within', de: 'Nächtliche Außenvisualisierung eines modernen, von innen beleuchteten Hauses', es: 'Render exterior nocturno de una casa moderna iluminada desde dentro' },
  featured: false,
  daysAgo: 1,
  tags: ['animation', 'virtual-tour', 'architectural-rendering'],
  faq: [
    {
      q: { en: 'What is the difference between a 360° image and a virtual tour?', de: 'Was ist der Unterschied zwischen 360°-Bild und virtuellem Rundgang?', es: '¿Qué diferencia hay entre una imagen 360° y un tour virtual?' },
      a: {
        en: 'A 360° image lets you look around from one point. A virtual tour connects several 360° points, so viewers can move from room to room — often with a floor plan, hotspots and information.',
        de: 'Ein 360°-Bild erlaubt das Umsehen von einem Standpunkt aus. Ein virtueller Rundgang verbindet mehrere 360°-Punkte, sodass man von Raum zu Raum wechseln kann – oft mit Grundriss, Hotspots und Informationen.',
        es: 'Una imagen 360° permite mirar alrededor desde un punto. Un tour virtual conecta varios puntos 360°, de modo que se puede pasar de una estancia a otra, a menudo con plano, puntos de interés e información.',
      },
    },
    {
      q: { en: 'Can one 3D model be used for stills, animation and a tour?', de: 'Kann ein 3D-Modell für Standbilder, Animation und Rundgang genutzt werden?', es: '¿Un mismo modelo 3D sirve para imágenes, animación y tour?' },
      a: {
        en: 'Yes — that is the most efficient way to work. The model and materials are built once; each format then adds its own cameras, lighting passes and output.',
        de: 'Ja – das ist der wirtschaftlichste Weg. Modell und Materialien entstehen einmal; jedes Format ergänzt dann eigene Kameras, Lichtdurchgänge und Ausgaben.',
        es: 'Sí, y es la forma más eficiente de trabajar. El modelo y los materiales se crean una vez; cada formato añade después sus propias cámaras, iluminación y salidas.',
      },
    },
    {
      q: { en: 'How long should an architectural animation be?', de: 'Wie lang sollte eine Architekturanimation sein?', es: '¿Cuánto debe durar una animación arquitectónica?' },
      a: {
        en: 'For websites and social media, 30–90 seconds usually works best. Longer films suit launch events and investor presentations, where viewers are already engaged.',
        de: 'Für Website und Social Media funktionieren meist 30–90 Sekunden am besten. Längere Filme eignen sich für Vertriebsstart-Events und Investorenpräsentationen, wo die Aufmerksamkeit bereits da ist.',
        es: 'Para web y redes sociales suelen funcionar mejor 30–90 segundos. Las piezas más largas encajan en eventos de lanzamiento y presentaciones a inversores, donde la atención ya está ganada.',
      },
    },
  ],
  tr: {
    en: {
      slug: '3d-rendering-vs-animation-vs-virtual-tour',
      title: '3D Rendering vs Animation vs Virtual Tour: Which Does Your Project Need?',
      excerpt: 'Still images, films and interactive tours each do a different job. A clear comparison of what each format is best at, what it costs in effort, and how to combine them.',
      focus: '3D rendering vs virtual tour',
      seoTitle: '3D Rendering vs Virtual Tour vs Animation: How to Choose',
      seoDesc: '3D rendering vs virtual tour vs animation: what each format does best, typical uses, effort and cost — and how to combine them in one project.',
      takeaways: [
        'Still renderings are the most versatile: portals, print, ads and approvals.',
        'Animation tells a story with movement, scale and sequence — ideal for launches.',
        'Virtual tours let buyers explore freely and work well without a show flat.',
        'Build one model and add formats as the project and budget grow.',
      ],
      html: `
<p>Once a project needs visuals, the next question is which kind. The <strong>3D rendering vs virtual tour</strong> decision — with animation as a third option — depends on what you want people to understand, where they will see it and how much time they will give it.</p>
${fig(IMG.lightDark, 'Night exterior rendering of a modern house with warm interior light', 'Light in the Dark — exterior at night.', 'wide')}
<h2>The three formats in one sentence each</h2>
<ul>
<li><strong>3D rendering (still image):</strong> one perfectly composed view, like an architectural photograph.</li>
<li><strong>Animation (walk-through or fly-through):</strong> a directed film that guides the viewer through spaces and context.</li>
<li><strong>Virtual tour (360°):</strong> an interactive experience where viewers look around and move at their own pace.</li>
</ul>
<h2>Side-by-side comparison</h2>
<table><thead><tr><th></th><th>Still rendering</th><th>Animation</th><th>Virtual tour</th></tr></thead><tbody>
<tr><td>Best for</td><td>Portals, brochures, ads, approvals</td><td>Launches, presentations, social media</td><td>Websites, remote buyers, sales suites</td></tr>
<tr><td>Viewer control</td><td>None — fixed view</td><td>None — directed story</td><td>Full — look and move freely</td></tr>
<tr><td>Shows scale and flow</td><td>Partly</td><td>Very well</td><td>Well</td></tr>
<tr><td>Effort</td><td>Lowest per view</td><td>Highest</td><td>Medium to high</td></tr>
<tr><td>Typical price reference</td><td>Per image</td><td>Per second or minute</td><td>Per scene or package</td></tr>
</tbody></table>
<p>Published guides quote animation in the range of thousands per finished minute, while still images are priced individually — see the ${ext(COST, '2026 rendering cost breakdown')} and our own <a href="/blog/architectural-rendering-cost">price guide</a>.</p>
<h2>When still renderings are the right choice</h2>
<p>Stills are the workhorse of architectural marketing. They load fast, print well, fit every portal and can be crafted to perfection — light, composition and mood exactly as intended. Choose them when you need volume across channels, for planning applications, and whenever one strong image must carry the message.</p>
${fig(IMG.sylvan, 'Interior rendering with soft daylight and natural textures', 'A single still can carry the whole mood of a space.')}
<h2>When animation earns its budget</h2>
<p>Animation shows what stills cannot: arriving at the building, moving through the entrance, the sequence of rooms, the view opening up from the terrace. It is the strongest format for launch events, investor presentations and short social media edits — especially for larger projects where scale and context matter.</p>
<h2>When a virtual tour is worth it</h2>
<p>A tour lets each viewer explore what interests them. It is ideal when there is no show flat yet, for international buyers who cannot visit, and for complex layouts where people want to check how rooms connect. Overviews of the ${ext(ES_DIFF, 'differences between 360° images, tours and renders')} make the same distinction: a tour lets people move freely; a render presents a chosen view.</p>
${tip('<p><strong>Good to know:</strong> a 360° image shows one point of view; a virtual tour links several 360° points so viewers can move between rooms.</p>', 'info')}
<h2>How to decide: three questions</h2>
<ol>
<li><strong>Where will people see it?</strong> Portals and print → stills. Events and social → animation. Website and remote sales → tour.</li>
<li><strong>What must they understand?</strong> Atmosphere → stills. Sequence and scale → animation. Layout and freedom → tour.</li>
<li><strong>How much time will they give it?</strong> Seconds → stills. One minute → animation. Several minutes → tour.</li>
</ol>
<h2>The smart approach: one model, growing formats</h2>
<p>Most successful campaigns combine formats over time: start with a set of stills for the pre-launch, add an animation for the launch event, and a tour once buyers want to explore. Because the 3D model is shared, each new format builds on work already done. Developers can find a phase-by-phase plan in our article on <a href="/blog/3d-rendering-for-real-estate-developers">3D rendering for real estate developers</a>.</p>
<p>At VARI, our <a href="/services">services</a> include 3D rendering, animation and walk-throughs, and immersive virtual tours, all built from the same model. Explore our <a href="/work">projects</a> to see the quality we bring to each.</p>
${cta('Ask which format fits your project')}
<h2>Conclusion</h2>
<p>There is no single best format — only the best one for each audience and channel. Use stills for reach and precision, animation for story and scale, and virtual tours for freedom and trust. Planned together, they turn one model into a complete visual campaign.</p>`,
    },
    de: {
      slug: 'rendering-animation-oder-virtueller-rundgang',
      title: 'Rendering, Animation oder virtueller Rundgang: Was braucht Ihr Projekt?',
      excerpt: 'Standbilder, Filme und interaktive Rundgänge leisten jeweils etwas anderes. Ein klarer Vergleich: wofür jedes Format am besten ist, welcher Aufwand dahintersteht und wie man sie kombiniert.',
      focus: 'virtueller Rundgang',
      seoTitle: 'Rendering, Animation oder virtueller Rundgang? Der Vergleich',
      seoDesc: 'Rendering, Animation oder virtueller Rundgang: was jedes Format am besten kann, typische Einsätze, Aufwand und Kosten – und wie Sie sie kombinieren.',
      takeaways: [
        'Standbilder sind am vielseitigsten: Portale, Druck, Anzeigen und Genehmigungen.',
        'Animationen erzählen mit Bewegung, Maßstab und Abfolge – ideal zum Vertriebsstart.',
        'Ein virtueller Rundgang lässt Käufer frei erkunden und ersetzt oft die Musterwohnung.',
        'Ein Modell bauen und Formate ergänzen, wenn Projekt und Budget wachsen.',
      ],
      html: `
<p>Sobald ein Projekt Bilder braucht, stellt sich die Frage nach der Form: Standbild, Animation oder <strong>virtueller Rundgang</strong>? Die Antwort hängt davon ab, was Menschen verstehen sollen, wo sie es sehen und wie viel Zeit sie sich nehmen.</p>
${fig(IMG.lightDark, 'Nächtliche Außenvisualisierung eines modernen Hauses mit warmem Innenlicht', 'Light in the Dark – Außenansicht bei Nacht.', 'wide')}
<h2>Die drei Formate in je einem Satz</h2>
<ul>
<li><strong>3D-Rendering (Standbild):</strong> eine perfekt komponierte Ansicht, wie eine Architekturfotografie.</li>
<li><strong>Animation (Walk-through oder Kameraflug):</strong> ein inszenierter Film, der durch Räume und Umgebung führt.</li>
<li><strong>Virtueller Rundgang (360°):</strong> ein interaktives Erlebnis, bei dem man sich umsieht und im eigenen Tempo bewegt.</li>
</ul>
<h2>Der direkte Vergleich</h2>
<table><thead><tr><th></th><th>Standbild</th><th>Animation</th><th>Virtueller Rundgang</th></tr></thead><tbody>
<tr><td>Ideal für</td><td>Portale, Exposé, Anzeigen, Bauantrag</td><td>Vertriebsstart, Präsentationen, Social Media</td><td>Website, Käufer aus der Ferne, Verkaufsbüro</td></tr>
<tr><td>Steuerung durch Betrachter</td><td>Keine – feste Ansicht</td><td>Keine – inszenierte Geschichte</td><td>Vollständig – frei umsehen und bewegen</td></tr>
<tr><td>Zeigt Maßstab und Abfolge</td><td>Teilweise</td><td>Sehr gut</td><td>Gut</td></tr>
<tr><td>Aufwand</td><td>Am geringsten pro Ansicht</td><td>Am höchsten</td><td>Mittel bis hoch</td></tr>
<tr><td>Übliche Preisbasis</td><td>Pro Bild</td><td>Pro Sekunde oder Minute</td><td>Pro Szene oder Paket</td></tr>
</tbody></table>
<p>Veröffentlichte Übersichten nennen für Animationen Beträge im Tausenderbereich pro fertiger Minute, Standbilder werden einzeln kalkuliert – siehe die ${ext(COST, 'Kostenaufschlüsselung 2026')} und unseren <a href="/blog/architekturvisualisierung-kosten">Preisratgeber</a>.</p>
<h2>Wann Standbilder die richtige Wahl sind</h2>
<p>Standbilder sind das Arbeitspferd der Architekturvermarktung. Sie laden schnell, drucken gut, passen auf jedes Portal und lassen sich bis ins Detail perfektionieren – Licht, Bildaufbau und Stimmung genau wie gewünscht. Wählen Sie sie, wenn Sie Menge über viele Kanäle brauchen, für den Bauantrag und immer dann, wenn ein starkes Bild die Botschaft tragen muss.</p>
${fig(IMG.sylvan, 'Innenraumvisualisierung mit weichem Tageslicht und natürlichen Texturen', 'Ein einzelnes Standbild kann die ganze Stimmung eines Raums tragen.')}
<h2>Wann sich eine Animation lohnt</h2>
<p>Eine Animation zeigt, was Standbilder nicht können: das Ankommen am Gebäude, den Weg durch den Eingang, die Abfolge der Räume, den Ausblick, der sich auf der Terrasse öffnet. Sie ist das stärkste Format für Vertriebsstart-Events, Investorenpräsentationen und kurze Social-Media-Clips – besonders bei größeren Projekten, bei denen Maßstab und Umgebung zählen.</p>
<h2>Wann ein virtueller Rundgang sinnvoll ist</h2>
<p>Ein virtueller Rundgang lässt jeden Betrachter das erkunden, was ihn interessiert. Er ist ideal, wenn es noch keine Musterwohnung gibt, für internationale Käufer, die nicht anreisen können, und für komplexe Grundrisse, bei denen Menschen prüfen wollen, wie Räume zusammenhängen.</p>
${tip('<p><strong>Gut zu wissen:</strong> Ein 360°-Bild zeigt einen Standpunkt; ein virtueller Rundgang verbindet mehrere 360°-Punkte, zwischen denen man sich bewegen kann.</p>', 'info')}
<h2>So entscheiden Sie: drei Fragen</h2>
<ol>
<li><strong>Wo sehen Menschen es?</strong> Portale und Druck → Standbilder. Events und Social Media → Animation. Website und Fernvertrieb → Rundgang.</li>
<li><strong>Was sollen sie verstehen?</strong> Atmosphäre → Standbilder. Abfolge und Maßstab → Animation. Grundriss und Freiheit → Rundgang.</li>
<li><strong>Wie viel Zeit nehmen sie sich?</strong> Sekunden → Standbilder. Eine Minute → Animation. Mehrere Minuten → Rundgang.</li>
</ol>
<h2>Der kluge Weg: ein Modell, wachsende Formate</h2>
<p>Die erfolgreichsten Kampagnen kombinieren Formate über die Zeit: zuerst eine Serie Standbilder für die Vorvermarktung, dann eine Animation zum Vertriebsstart und einen Rundgang, sobald Käufer selbst erkunden wollen. Weil das 3D-Modell geteilt wird, baut jedes neue Format auf vorhandener Arbeit auf. Einen Phasenplan für Bauträger finden Sie in unserem Artikel <a href="/blog/visualisierung-fuer-bautraeger">Visualisierung für Bauträger</a>.</p>
<p>Unsere <a href="/services">Leistungen</a> bei VARI umfassen 3D-Renderings, Animationen und Walk-throughs sowie immersive virtuelle Rundgänge – alle aus demselben Modell. In unseren <a href="/work">Projekten</a> sehen Sie die Qualität, mit der wir arbeiten.</p>
${cta('Fragen Sie, welches Format zu Ihrem Projekt passt')}
<h2>Fazit</h2>
<p>Es gibt nicht das eine beste Format – nur das beste für jedes Publikum und jeden Kanal. Standbilder für Reichweite und Präzision, Animationen für Geschichte und Maßstab, virtuelle Rundgänge für Freiheit und Vertrauen. Gemeinsam geplant, wird aus einem Modell eine komplette Bildkampagne.</p>`,
    },
    es: {
      slug: 'render-animacion-o-tour-virtual',
      title: 'Render, animación o tour virtual: ¿qué necesita su proyecto?',
      excerpt: 'Imágenes fijas, vídeos y recorridos interactivos cumplen funciones distintas. Una comparativa clara de para qué sirve cada formato, qué esfuerzo exige y cómo combinarlos.',
      focus: 'tour virtual',
      seoTitle: 'Render vs animación vs tour virtual 360: cómo elegir',
      seoDesc: 'Render, animación o tour virtual 360: qué hace mejor cada formato, usos habituales, esfuerzo y coste, y cómo combinarlos en un mismo proyecto.',
      takeaways: [
        'El render fijo es el más versátil: portales, impresión, anuncios y licencias.',
        'La animación cuenta una historia con movimiento, escala y secuencia: ideal para lanzamientos.',
        'El tour virtual deja explorar libremente y funciona muy bien sin piso piloto.',
        'Construya un modelo y añada formatos a medida que crecen el proyecto y el presupuesto.',
      ],
      html: `
<p>Cuando un proyecto necesita imágenes, la siguiente pregunta es de qué tipo: render, animación o <strong>tour virtual</strong>. La respuesta depende de qué debe entender la gente, dónde lo verá y cuánto tiempo le dedicará.</p>
${fig(IMG.lightDark, 'Render exterior nocturno de una casa moderna con luz interior cálida', 'Light in the Dark: exterior de noche.', 'wide')}
<h2>Los tres formatos en una frase</h2>
<ul>
<li><strong>Render 3D (imagen fija):</strong> una vista perfectamente compuesta, como una fotografía de arquitectura.</li>
<li><strong>Animación (recorrido o vuelo de cámara):</strong> una pieza dirigida que guía al espectador por los espacios y el entorno.</li>
<li><strong>Tour virtual (360°):</strong> una experiencia interactiva en la que se mira alrededor y se avanza al propio ritmo.</li>
</ul>
<h2>Comparativa directa</h2>
<table><thead><tr><th></th><th>Render fijo</th><th>Animación</th><th>Tour virtual</th></tr></thead><tbody>
<tr><td>Ideal para</td><td>Portales, folletos, anuncios, licencias</td><td>Lanzamientos, presentaciones, redes</td><td>Web, compradores a distancia, oficina de ventas</td></tr>
<tr><td>Control del usuario</td><td>Ninguno: vista fija</td><td>Ninguno: relato dirigido</td><td>Total: mirar y moverse libremente</td></tr>
<tr><td>Muestra escala y recorrido</td><td>En parte</td><td>Muy bien</td><td>Bien</td></tr>
<tr><td>Esfuerzo</td><td>El menor por vista</td><td>El mayor</td><td>Medio a alto</td></tr>
<tr><td>Base de precio habitual</td><td>Por imagen</td><td>Por segundo o minuto</td><td>Por escena o paquete</td></tr>
</tbody></table>
<p>Las guías publicadas sitúan la animación en miles por minuto terminado, mientras que las imágenes fijas se presupuestan una a una: vea el ${ext(COST, 'desglose de costes 2026')} y nuestra <a href="/blog/precio-render-arquitectonico">guía de precios</a>.</p>
<h2>Cuándo elegir imágenes fijas</h2>
<p>El render fijo es el caballo de batalla del marketing arquitectónico. Carga rápido, se imprime bien, encaja en cualquier portal y puede perfeccionarse al detalle: luz, encuadre y ambiente exactamente como se desea. Elíjalo cuando necesite volumen en muchos canales, para licencias y siempre que una imagen potente deba llevar el mensaje.</p>
${fig(IMG.sylvan, 'Render de interior con luz natural suave y texturas naturales', 'Una sola imagen puede transmitir todo el ambiente de un espacio.')}
<h2>Cuándo compensa una animación</h2>
<p>La animación muestra lo que una imagen fija no puede: la llegada al edificio, el paso por el acceso, la secuencia de estancias, la vista que se abre desde la terraza. Es el formato más potente para eventos de lanzamiento, presentaciones a inversores y piezas cortas para redes, sobre todo en proyectos grandes donde importan la escala y el entorno.</p>
<h2>Cuándo merece la pena un tour virtual</h2>
<p>Un tour virtual permite a cada persona explorar lo que le interesa. Es ideal cuando aún no hay piso piloto, para compradores internacionales que no pueden visitar la obra y para distribuciones complejas donde se quiere entender cómo se conectan las estancias. Los análisis sobre las ${ext(ES_DIFF, 'diferencias entre tour virtual 360, renders e imágenes 360º')} coinciden: el tour permite moverse libremente; el render presenta una vista elegida.</p>
${tip('<p><strong>Conviene saber:</strong> una imagen 360° muestra un único punto de vista; un tour virtual enlaza varios puntos 360° para moverse entre estancias.</p>', 'info')}
<h2>Cómo decidir: tres preguntas</h2>
<ol>
<li><strong>¿Dónde lo verán?</strong> Portales e impresión → render. Eventos y redes → animación. Web y venta a distancia → tour.</li>
<li><strong>¿Qué deben entender?</strong> Ambiente → render. Secuencia y escala → animación. Distribución y libertad → tour.</li>
<li><strong>¿Cuánto tiempo le dedicarán?</strong> Segundos → render. Un minuto → animación. Varios minutos → tour.</li>
</ol>
<h2>La estrategia inteligente: un modelo, formatos que crecen</h2>
<p>Las campañas con más éxito combinan formatos a lo largo del tiempo: primero una serie de renders para la preventa, después una animación para el lanzamiento y un tour cuando los compradores quieren explorar. Como el modelo 3D se comparte, cada nuevo formato se apoya en el trabajo ya hecho. Las promotoras encontrarán un plan por fases en nuestro artículo sobre <a href="/blog/render-inmobiliario-para-promotoras">render inmobiliario para promotoras</a>.</p>
<p>En VARI, nuestros <a href="/services">servicios</a> incluyen render 3D, animaciones y recorridos, y tours virtuales inmersivos, todos a partir del mismo modelo. Explore nuestros <a href="/work">proyectos</a> para ver la calidad que aportamos.</p>
${cta('Pregúntenos qué formato encaja con su proyecto')}
<h2>Conclusión</h2>
<p>No existe un único formato ideal, sino el mejor para cada público y canal. Imágenes fijas para alcance y precisión, animación para relato y escala, y tour virtual para libertad y confianza. Planificados juntos, convierten un solo modelo en una campaña visual completa.</p>`,
    },
  },
};
