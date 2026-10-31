import { createBlock, type Block } from './schema';

/** Starting points for a new page. Every template is fully editable afterwards. */
export type Template = { id: string; name: string; description: string; build: () => Block[] };

const b = (type: string, props: Record<string, unknown> = {}, style: Block['style'] = {}): Block => {
  const block = createBlock(type);
  return { ...block, props: { ...block.props, ...props }, style: { ...block.style, ...style } };
};

export const TEMPLATES: Template[] = [
  { id: 'blank', name: 'Blank page', description: 'Start from an empty canvas.', build: () => [b('heading', { level: 'h1', size: 'xl' })] },
  {
    id: 'landing',
    name: 'Landing page',
    description: 'Hero, benefits, selected projects and a call to action.',
    build: () => [b('hero'), b('cards'), b('projects'), b('stats', {}, { bg: 'charcoal' }), b('faq'), b('cta')],
  },
  {
    id: 'about',
    name: 'Story / about',
    description: 'A narrative page with images, figures and a quote.',
    build: () => [b('hero', { height: 'medium' }), b('text', { large: true }), b('imageText'), b('stats'), b('quote', {}, { bg: 'charcoal' }), b('gallery'), b('cta')],
  },
  {
    id: 'service',
    name: 'Service page',
    description: 'Explain one service, show proof and collect enquiries.',
    build: () => [b('hero', { height: 'medium' }), b('text'), b('cards', { numbered: true }), b('gallery'), b('faq'), b('contactForm', {}, { bg: 'charcoal' })],
  },
  {
    id: 'seo',
    name: 'SEO landing page',
    description: 'A focused page for one search topic or location: H1, rich text, proof, FAQ.',
    build: () => [b('heading', { level: 'h1', size: 'xl' }), b('text', { columns: '1' }), b('imageText'), b('projects', { limit: 3 }), b('faq'), b('cta')],
  },
];
