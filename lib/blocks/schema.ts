/**
 * The page builder's block library — one definition per block type. The same definitions
 * drive the public renderer (components/blocks) and the panel's settings forms, so adding
 * a field here is all it takes to make it editable.
 *
 * Texts are stored per language ({ en, de, es }); everything else is plain values.
 * In titles, *words between asterisks* get the site's gold italic.
 */
import type { Locale } from '@/lib/i18n/config';

export type I18n = Partial<Record<Locale, string>>;
export type LinkValue = { label?: I18n; href?: string };

export type Field =
  | { key: string; kind: 'text'; label: string; i18n?: boolean; multiline?: boolean; rows?: number; max?: number; placeholder?: string; hint?: string }
  | { key: string; kind: 'richtext'; label: string; hint?: string }
  | { key: string; kind: 'image'; label: string; hint?: string }
  | { key: string; kind: 'images'; label: string; hint?: string }
  | { key: string; kind: 'select'; label: string; options: { value: string; label: string }[]; hint?: string }
  | { key: string; kind: 'toggle'; label: string; hint?: string }
  | { key: string; kind: 'number'; label: string; min: number; max: number; step?: number; unit?: string }
  | { key: string; kind: 'link'; label: string }
  | { key: string; kind: 'url'; label: string; placeholder?: string; hint?: string }
  | { key: string; kind: 'projects'; label: string; hint?: string }
  | { key: string; kind: 'list'; label: string; item: string; fields: Field[]; max?: number; min?: number };

export type BlockStyle = {
  bg?: 'night' | 'ink' | 'charcoal' | 'bone' | 'gold' | 'image';
  bgImage?: string;
  overlay?: number;
  pad?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  width?: 'narrow' | 'normal' | 'wide' | 'full';
  align?: 'left' | 'center';
  reveal?: boolean;
  hideOn?: '' | 'mobile' | 'desktop';
  anchor?: string;
};

export type Block = { id: string; type: string; props: Record<string, unknown>; style?: BlockStyle; hidden?: boolean };

export type BlockDef = {
  type: string;
  label: string;
  description: string;
  category: 'Layout' | 'Text' | 'Media' | 'Showcase' | 'Engage';
  /** SVG path, 24×24, stroked. */
  icon: string;
  fields: Field[];
  defaults: () => Record<string, unknown>;
  style?: BlockStyle;
};

/** Starter text for a new block in each built-in language; languages added later fall back to English. */
const t = (en: string, de: string, es: string, tr: string): I18n => ({ en, de, es, tr });
const opt = (pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }));

export const BLOCKS: BlockDef[] = [
  {
    type: 'hero',
    label: 'Hero banner',
    description: 'Full-width image with a big headline and buttons.',
    category: 'Layout',
    icon: 'M3 4h18v12H3zM7 20h10M7 9h7M7 12h4',
    fields: [
      { key: 'eyebrow', kind: 'text', label: 'Small label', i18n: true, max: 60 },
      { key: 'title', kind: 'text', label: 'Headline', i18n: true, multiline: true, rows: 2, max: 140, hint: 'Put *words* in asterisks for gold italic.' },
      { key: 'subtitle', kind: 'text', label: 'Intro text', i18n: true, multiline: true, rows: 3, max: 320 },
      { key: 'image', kind: 'image', label: 'Background image' },
      { key: 'buttons', kind: 'list', label: 'Buttons', item: 'Button', max: 2, fields: [{ key: 'link', kind: 'link', label: 'Button' }] },
      { key: 'height', kind: 'select', label: 'Height', options: opt([['screen', 'Full screen'], ['large', 'Large'], ['medium', 'Medium']]) },
      { key: 'overlay', kind: 'number', label: 'Image darkness', min: 0, max: 90, step: 5, unit: '%' },
      { key: 'align', kind: 'select', label: 'Text position', options: opt([['left', 'Left'], ['center', 'Centre']]) },
    ],
    defaults: () => ({
      eyebrow: t('VARI Studio', 'VARI Studio', 'VARI Studio', 'VARI Studio'),
      title: t('A new *chapter* begins', 'Ein neues *Kapitel* beginnt', 'Comienza un nuevo *capítulo*', 'Yeni bir *sayfa* açılıyor'),
      subtitle: {},
      buttons: [{ link: { label: t('Start a project', 'Projekt starten', 'Iniciar un proyecto', 'Projeye başlayın'), href: '/contact' } }],
      height: 'large',
      overlay: 45,
      align: 'left',
    }),
    style: { pad: 'none', width: 'full' },
  },
  {
    type: 'heading',
    label: 'Heading',
    description: 'Section title with a small label and an intro.',
    category: 'Text',
    icon: 'M5 5v14M15 5v14M5 12h10M19 9v10',
    fields: [
      { key: 'eyebrow', kind: 'text', label: 'Small label', i18n: true, max: 60 },
      { key: 'title', kind: 'text', label: 'Title', i18n: true, multiline: true, rows: 2, max: 160, hint: 'Put *words* in asterisks for gold italic.' },
      { key: 'intro', kind: 'text', label: 'Intro', i18n: true, multiline: true, rows: 3, max: 500 },
      { key: 'size', kind: 'select', label: 'Size', options: opt([['xl', 'Extra large'], ['lg', 'Large'], ['md', 'Medium']]) },
      { key: 'level', kind: 'select', label: 'Heading level (SEO)', options: opt([['h2', 'H2 — section'], ['h1', 'H1 — page title (use once)'], ['h3', 'H3 — sub-section']]) },
    ],
    defaults: () => ({ eyebrow: {}, title: t('Section *title*', 'Abschnitts*titel*', 'Título de *sección*', 'Bölüm *başlığı*'), intro: {}, size: 'lg', level: 'h2' }),
  },
  {
    type: 'text',
    label: 'Text',
    description: 'Paragraphs with bold, italic, links and lists.',
    category: 'Text',
    icon: 'M4 6h16M4 10h16M4 14h16M4 18h10',
    fields: [
      { key: 'body', kind: 'richtext', label: 'Text', hint: '**bold**, *italic*, [link](https://…), lines starting with "- " become a list, "## " a sub-heading.' },
      { key: 'columns', kind: 'select', label: 'Columns', options: opt([['1', 'One'], ['2', 'Two (desktop)']]) },
      { key: 'large', kind: 'toggle', label: 'Large text' },
    ],
    defaults: () => ({ body: t('Write something *memorable*.', 'Schreiben Sie etwas *Unvergessliches*.', 'Escriba algo *memorable*.', '*Akılda kalıcı* bir şey yazın.'), columns: '1', large: false }),
    style: { width: 'narrow' },
  },
  {
    type: 'image',
    label: 'Image',
    description: 'One image, contained or edge to edge.',
    category: 'Media',
    icon: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6',
    fields: [
      { key: 'image', kind: 'image', label: 'Image' },
      { key: 'alt', kind: 'text', label: 'Description for screen readers & SEO', i18n: true, max: 160 },
      { key: 'caption', kind: 'text', label: 'Caption', i18n: true, max: 200 },
      { key: 'aspect', kind: 'select', label: 'Shape', options: opt([['auto', 'Original'], ['21/9', 'Cinema 21:9'], ['16/9', 'Wide 16:9'], ['4/3', 'Classic 4:3'], ['1/1', 'Square'], ['4/5', 'Portrait 4:5']]) },
      { key: 'parallax', kind: 'toggle', label: 'Gentle parallax on scroll' },
    ],
    defaults: () => ({ image: '', alt: {}, caption: {}, aspect: '16/9', parallax: true }),
    style: { width: 'wide' },
  },
  {
    type: 'imageText',
    label: 'Image + text',
    description: 'Image beside a title, text and button.',
    category: 'Layout',
    icon: 'M3 5h8v14H3zM14 8h7M14 12h7M14 16h4',
    fields: [
      { key: 'image', kind: 'image', label: 'Image' },
      { key: 'eyebrow', kind: 'text', label: 'Small label', i18n: true, max: 60 },
      { key: 'title', kind: 'text', label: 'Title', i18n: true, multiline: true, rows: 2, max: 140 },
      { key: 'body', kind: 'richtext', label: 'Text' },
      { key: 'link', kind: 'link', label: 'Button' },
      { key: 'side', kind: 'select', label: 'Image side', options: opt([['left', 'Left'], ['right', 'Right']]) },
    ],
    defaults: () => ({ image: '', eyebrow: {}, title: t('Spaces with *character*', 'Räume mit *Charakter*', 'Espacios con *carácter*', '*Karakteri* olan mekânlar'), body: {}, link: {}, side: 'left' }),
  },
  {
    type: 'gallery',
    label: 'Gallery',
    description: 'Several images as a grid, mosaic or slider with full-screen view.',
    category: 'Media',
    icon: 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z',
    fields: [
      { key: 'images', kind: 'images', label: 'Images' },
      { key: 'layout', kind: 'select', label: 'Layout', options: opt([['grid', 'Grid'], ['masonry', 'Mosaic'], ['slider', 'Slider']]) },
      { key: 'columns', kind: 'select', label: 'Columns', options: opt([['2', 'Two'], ['3', 'Three'], ['4', 'Four']]) },
      { key: 'lightbox', kind: 'toggle', label: 'Open full screen on click' },
    ],
    defaults: () => ({ images: [], layout: 'masonry', columns: '3', lightbox: true }),
    style: { width: 'wide' },
  },
  {
    type: 'cards',
    label: 'Feature cards',
    description: 'Cards with an optional image, title and text.',
    category: 'Showcase',
    icon: 'M3 4h5v16H3zM10 4h5v16h-5zM17 4h4v16h-4z',
    fields: [
      { key: 'eyebrow', kind: 'text', label: 'Small label', i18n: true, max: 60 },
      { key: 'title', kind: 'text', label: 'Title', i18n: true, max: 140 },
      {
        key: 'items',
        kind: 'list',
        label: 'Cards',
        item: 'Card',
        max: 12,
        fields: [
          { key: 'image', kind: 'image', label: 'Image (optional)' },
          { key: 'title', kind: 'text', label: 'Title', i18n: true, max: 80 },
          { key: 'body', kind: 'text', label: 'Text', i18n: true, multiline: true, rows: 3, max: 400 },
          { key: 'link', kind: 'link', label: 'Link (optional)' },
        ],
      },
      { key: 'columns', kind: 'select', label: 'Columns', options: opt([['2', 'Two'], ['3', 'Three'], ['4', 'Four']]) },
      { key: 'numbered', kind: 'toggle', label: 'Number the cards (01, 02…)' },
    ],
    defaults: () => ({
      eyebrow: {},
      title: t('What we *offer*', 'Was wir *bieten*', 'Lo que *ofrecemos*', 'Neler *sunuyoruz*?'),
      items: [1, 2, 3].map((n) => ({ title: t(`Feature ${n}`, `Merkmal ${n}`, `Característica ${n}`, `Özellik ${n}`), body: {}, image: '', link: {} })),
      columns: '3',
      numbered: true,
    }),
  },
  {
    type: 'stats',
    label: 'Numbers',
    description: 'Key figures that count up when they appear.',
    category: 'Showcase',
    icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    fields: [
      { key: 'items', kind: 'list', label: 'Figures', item: 'Figure', max: 6, fields: [
        { key: 'value', kind: 'text', label: 'Number', max: 12, placeholder: '120+' },
        { key: 'label', kind: 'text', label: 'Label', i18n: true, max: 60 },
      ] },
    ],
    defaults: () => ({ items: [{ value: '19', label: t('Projects shown', 'Gezeigte Projekte', 'Proyectos', 'Sergilenen proje') }, { value: '8', label: t('Services', 'Leistungen', 'Servicios', 'Hizmet') }, { value: '3', label: t('Languages', 'Sprachen', 'Idiomas', 'Dil') }] }),
  },
  {
    type: 'quote',
    label: 'Quote',
    description: 'A large quotation or client testimonial.',
    category: 'Text',
    icon: 'M7 7h4v4H8l-1 4M15 7h4v4h-3l-1 4',
    fields: [
      { key: 'quote', kind: 'text', label: 'Quote', i18n: true, multiline: true, rows: 3, max: 400 },
      { key: 'author', kind: 'text', label: 'Name', max: 80 },
      { key: 'role', kind: 'text', label: 'Role / company', i18n: true, max: 80 },
      { key: 'image', kind: 'image', label: 'Portrait (optional)' },
    ],
    defaults: () => ({ quote: t('Design is the silent ambassador of your brand.', 'Design ist der stille Botschafter Ihrer Marke.', 'El diseño es el embajador silencioso de su marca.', 'Tasarım, markanızın sessiz elçisidir.'), author: '', role: {} }),
    style: { width: 'narrow', align: 'center' },
  },
  {
    type: 'cta',
    label: 'Call to action',
    description: 'A bold invitation with one or two buttons.',
    category: 'Engage',
    icon: 'M4 7h16v10H4zM9 12h6M13 10l2 2-2 2',
    fields: [
      { key: 'title', kind: 'text', label: 'Title', i18n: true, multiline: true, rows: 2, max: 140 },
      { key: 'body', kind: 'text', label: 'Text', i18n: true, multiline: true, rows: 2, max: 300 },
      { key: 'primary', kind: 'link', label: 'Main button' },
      { key: 'secondary', kind: 'link', label: 'Second button (optional)' },
    ],
    defaults: () => ({
      title: t('Ready to see it *before it exists*?', 'Bereit, es zu sehen, *bevor es existiert*?', '¿Listo para verlo *antes de que exista*?', 'Projenizi *var olmadan önce* görmeye hazır mısınız?'),
      body: {},
      primary: { label: t('Start a project', 'Projekt starten', 'Iniciar un proyecto', 'Projeye başlayın'), href: '/contact' },
      secondary: { label: t('See our work', 'Unsere Projekte', 'Ver proyectos', 'Projelerimizi görün'), href: '/work' },
    }),
    style: { bg: 'charcoal', align: 'center' },
  },
  {
    type: 'video',
    label: 'Video',
    description: 'YouTube, Vimeo or an MP4 file — loads only when played.',
    category: 'Media',
    icon: 'M3 5h18v14H3zM10 9l5 3-5 3z',
    fields: [
      { key: 'url', kind: 'url', label: 'Video link', placeholder: 'https://www.youtube.com/watch?v=…', hint: 'YouTube, Vimeo or a direct .mp4 link.' },
      { key: 'poster', kind: 'image', label: 'Cover image' },
      { key: 'title', kind: 'text', label: 'Title (for accessibility)', i18n: true, max: 120 },
      { key: 'caption', kind: 'text', label: 'Caption', i18n: true, max: 200 },
      { key: 'ambient', kind: 'toggle', label: 'MP4 only: play silently on loop like a moving image' },
    ],
    defaults: () => ({ url: '', poster: '', title: {}, caption: {}, ambient: false }),
    style: { width: 'wide' },
  },
  {
    type: 'faq',
    label: 'FAQ',
    description: 'Questions and answers — also shown in Google results.',
    category: 'Engage',
    icon: 'M9 9a3 3 0 115 2c-1 1-2 1-2 3M12 17h.01M12 21a9 9 0 110-18 9 9 0 010 18z',
    fields: [
      { key: 'title', kind: 'text', label: 'Title', i18n: true, max: 120 },
      { key: 'items', kind: 'list', label: 'Questions', item: 'Question', max: 20, fields: [
        { key: 'q', kind: 'text', label: 'Question', i18n: true, max: 200 },
        { key: 'a', kind: 'text', label: 'Answer', i18n: true, multiline: true, rows: 4, max: 1500 },
      ] },
    ],
    defaults: () => ({ title: t('Frequently asked *questions*', 'Häufige *Fragen*', 'Preguntas *frecuentes*', 'Sıkça sorulan *sorular*'), items: [{ q: t('How long does a rendering take?', 'Wie lange dauert ein Rendering?', '¿Cuánto tarda un render?', 'Bir render ne kadar sürede hazırlanır?'), a: {} }] }),
    style: { width: 'narrow' },
  },
  {
    type: 'projects',
    label: 'Projects',
    description: 'A selection of portfolio projects.',
    category: 'Showcase',
    icon: 'M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z',
    fields: [
      { key: 'eyebrow', kind: 'text', label: 'Small label', i18n: true, max: 60 },
      { key: 'title', kind: 'text', label: 'Title', i18n: true, max: 140 },
      { key: 'source', kind: 'select', label: 'Which projects', options: opt([['featured', 'Featured projects'], ['exterior', 'Exteriors'], ['interior', 'Interiors'], ['latest', 'All, in portfolio order'], ['manual', 'Choose by hand']]) },
      { key: 'slugs', kind: 'projects', label: 'Chosen projects', hint: 'Used when "Choose by hand" is selected.' },
      { key: 'limit', kind: 'number', label: 'How many', min: 1, max: 24 },
      { key: 'layout', kind: 'select', label: 'Layout', options: opt([['grid', 'Grid'], ['wide', 'Large alternating']]) },
    ],
    defaults: () => ({ eyebrow: {}, title: t('Selected *work*', 'Ausgewählte *Projekte*', 'Proyectos *seleccionados*', 'Seçili *projeler*'), source: 'featured', slugs: [], limit: 6, layout: 'grid' }),
    style: { width: 'wide' },
  },
  {
    type: 'services',
    label: 'Services list',
    description: 'The studio services, always in sync with Services.',
    category: 'Showcase',
    icon: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5',
    fields: [
      { key: 'title', kind: 'text', label: 'Title', i18n: true, max: 140 },
      { key: 'link', kind: 'link', label: 'Button (optional)' },
    ],
    defaults: () => ({ title: t('What we *do*', 'Was wir *tun*', 'Lo que *hacemos*', 'Ne *yapıyoruz*?'), link: {} }),
  },
  {
    type: 'marquee',
    label: 'Moving text',
    description: 'Large words gliding across the screen.',
    category: 'Layout',
    icon: 'M2 12h20M6 8l-4 4 4 4M18 8l4 4-4 4',
    fields: [
      { key: 'items', kind: 'list', label: 'Words', item: 'Word', max: 10, fields: [{ key: 'text', kind: 'text', label: 'Text', i18n: true, max: 40 }] },
      { key: 'speed', kind: 'select', label: 'Speed', options: opt([['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast']]) },
      { key: 'outline', kind: 'toggle', label: 'Outlined letters' },
    ],
    defaults: () => ({ items: [{ text: t('Visualize', 'Visualisieren', 'Visualizar', 'Görselleştir') }, { text: t('Design', 'Gestalten', 'Diseñar', 'Tasarla') }, { text: t('Inspire', 'Inspirieren', 'Inspirar', 'İlham ver') }], speed: 'normal', outline: false }),
    style: { pad: 'sm', width: 'full' },
  },
  {
    type: 'logos',
    label: 'Logo strip',
    description: 'Partner or client logos in a calm row.',
    category: 'Showcase',
    icon: 'M3 9h4v6H3zM10 9h4v6h-4zM17 9h4v6h-4z',
    fields: [
      { key: 'title', kind: 'text', label: 'Title', i18n: true, max: 100 },
      { key: 'images', kind: 'images', label: 'Logos', hint: 'Transparent PNG or SVG works best.' },
    ],
    defaults: () => ({ title: {}, images: [] }),
    style: { pad: 'md' },
  },
  {
    type: 'contactForm',
    label: 'Contact form',
    description: 'The enquiry form — messages arrive in the Inbox.',
    category: 'Engage',
    icon: 'M3 6h18v12H3zM3 7l9 7 9-7',
    fields: [
      { key: 'eyebrow', kind: 'text', label: 'Small label', i18n: true, max: 60 },
      { key: 'title', kind: 'text', label: 'Title', i18n: true, max: 140 },
      { key: 'intro', kind: 'text', label: 'Intro', i18n: true, multiline: true, rows: 3, max: 400 },
    ],
    defaults: () => ({ eyebrow: {}, title: t('Tell us about your *project*', 'Erzählen Sie uns von Ihrem *Projekt*', 'Cuéntenos su *proyecto*', 'Projenizi bize *anlatın*'), intro: {} }),
  },
  {
    type: 'newsletter',
    label: 'Newsletter signup',
    description: 'Email signup with double opt-in.',
    category: 'Engage',
    icon: 'M4 4h16v16H4zM4 4l8 8 8-8',
    fields: [],
    defaults: () => ({}),
    style: { width: 'narrow' },
  },
  {
    type: 'map',
    label: 'Map',
    description: 'A Google map of an address — loads after a click (privacy-friendly).',
    category: 'Media',
    icon: 'M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11zM12 12a2 2 0 100-4 2 2 0 000 4z',
    fields: [
      { key: 'address', kind: 'text', label: 'Address or place', max: 200 },
      { key: 'zoom', kind: 'number', label: 'Zoom', min: 3, max: 20 },
    ],
    defaults: () => ({ address: '', zoom: 14 }),
    style: { width: 'wide' },
  },
  {
    type: 'spacer',
    label: 'Spacer',
    description: 'Breathing room, with an optional gold line.',
    category: 'Layout',
    icon: 'M4 12h16M12 4v4M12 16v4',
    fields: [
      { key: 'size', kind: 'select', label: 'Height', options: opt([['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']]) },
      { key: 'line', kind: 'toggle', label: 'Show a gold line' },
    ],
    defaults: () => ({ size: 'md', line: true }),
    style: { pad: 'none' },
  },
];

/** Built-in sections that keep their own design; texts are edited under Texts & translations. */
export const MODULES: Record<string, { label: string; about: string; texts?: string }> = {
  hero: { label: 'Hero (3D)', about: 'Opening façade with the headline and the two calls to action', texts: 'hero' },
  welcome: { label: 'Welcome', about: 'Studio introduction with the layered renders', texts: 'welcome' },
  exteriors: { label: 'Exteriors reel', about: 'Horizontal gallery of the exterior projects', texts: 'exteriors' },
  interiors: { label: 'Interiors', about: 'Featured rooms and the enfilade of interiors', texts: 'interiors' },
  services: { label: 'Services (3D model)', about: 'Services list with the live 3D model', texts: 'services' },
  story: { label: 'Story', about: 'The five studio chapters with images', texts: 'story' },
  experience: { label: 'Experience', about: 'Moving bands of text', texts: 'experience' },
  contact: { label: 'Contact', about: 'Contact details and the enquiry form', texts: 'contact' },
  page: { label: 'Original page content', about: 'The designed content of this page. Add blocks above or below it.' },
};

export const BLOCK_MAP: Record<string, BlockDef> = Object.fromEntries(BLOCKS.map((b) => [b.type, b]));

export const DEFAULT_STYLE: Required<Omit<BlockStyle, 'bgImage' | 'anchor'>> & Pick<BlockStyle, 'bgImage' | 'anchor'> = {
  bg: 'night',
  overlay: 55,
  pad: 'lg',
  width: 'normal',
  align: 'left',
  reveal: true,
  hideOn: '',
};

export function styleOf(block: Block): typeof DEFAULT_STYLE {
  return { ...DEFAULT_STYLE, ...(BLOCK_MAP[block.type]?.style || {}), ...(block.style || {}) };
}

export function newBlockId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function createBlock(type: string): Block {
  const def = BLOCK_MAP[type];
  return { id: newBlockId(), type, props: def ? def.defaults() : {}, style: {} };
}

/** Deep copy with fresh ids (duplicate, templates). */
export function cloneBlock(b: Block): Block {
  return { ...structuredClone(b), id: newBlockId() };
}

/** Text in one language with English fallback. */
export function tx(v: unknown, locale: Locale): string {
  if (typeof v === 'string') return v;
  if (!v || typeof v !== 'object') return '';
  const o = v as I18n;
  return o[locale] || o.en || '';
}

/** Internal links get the language prefix; external ones stay as they are. */
export function resolveHref(href: string | undefined, localize: (p: string) => string): string {
  const h = (href || '').trim();
  if (!h) return '';
  if (/^(https?:|mailto:|tel:)/i.test(h)) return h;
  if (h.startsWith('#')) return h;
  return localize(h.startsWith('/') ? h : `/${h}`);
}

/** Route names that custom pages may not take. */
export const RESERVED_SLUGS = ['home', 'work', 'services', 'studio', 'contact', 'privacy', 'newsletter', 'blog', 'project-template', 'admin', 'api', 'builder-preview', 'en', 'de', 'es', 'sitemap', 'robots', 'feed'];
