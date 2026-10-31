'use client';

import { Node, NodeViewWrapper, ReactNodeViewRenderer, mergeAttributes, type NodeViewProps } from '@tiptap/react';

/**
 * Custom article elements. Each renders to plain, sanitizable HTML marked with data-*
 * attributes; the public article styles them (see lib/blog-html.ts).
 */

declare module '@tiptap/react' {
  interface Commands<ReturnType> {
    figure: { insertFigure: (attrs: { src: string; alt?: string; caption?: string; size?: string }) => ReturnType };
    callout: { toggleCallout: (tone: string) => ReturnType };
    cta: { insertCta: (attrs: { label: string; href: string }) => ReturnType };
    video: { insertVideo: (attrs: { provider: 'youtube' | 'vimeo'; vid: string; title?: string }) => ReturnType };
  }
}

const field = 'w-full rounded-sm border border-bone/15 bg-night/60 px-2.5 py-1.5 text-sm text-bone outline-none focus:border-gold';

function FigureView({ node, updateAttributes, deleteNode, selected, editor }: NodeViewProps) {
  const { src, alt, caption, size } = node.attrs as { src: string; alt: string; caption: string; size: string };
  const editable = editor.isEditable;
  return (
    <NodeViewWrapper as="figure" data-figure="" data-size={size} className={`not-prose my-8 ${selected ? 'outline outline-2 outline-gold' : ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-full rounded-sm" draggable={false} data-drag-handle />
      {editable ? (
        <div className="mt-2 grid gap-2 rounded-sm bg-bone/[0.04] p-2" contentEditable={false}>
          <input className={field} placeholder="Caption (optional, shown under the image)" value={caption || ''} onChange={(e) => updateAttributes({ caption: e.target.value })} />
          <div className="flex flex-wrap items-center gap-2">
            <input className={`${field} flex-1`} placeholder="Alt text — describe the image (important for SEO)" value={alt || ''} onChange={(e) => updateAttributes({ alt: e.target.value })} />
            {(['normal', 'wide', 'full'] as const).map((s) => (
              <button key={s} type="button" onClick={() => updateAttributes({ size: s })} className={`rounded-sm px-2 py-1 text-xs ${size === s ? 'bg-gold text-night' : 'text-bone/60 hover:text-bone'}`}>
                {s}
              </button>
            ))}
            <button type="button" onClick={deleteNode} className="rounded-sm px-2 py-1 text-xs text-[#E8A598] hover:bg-[#E8A598]/10">Remove</button>
          </div>
          {!alt && <p className="text-[0.7rem] text-gold">Add alt text so search engines and screen readers understand the image.</p>}
        </div>
      ) : (
        caption && <figcaption>{caption}</figcaption>
      )}
    </NodeViewWrapper>
  );
}

export const Figure = Node.create({
  name: 'figure',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: '' }, alt: { default: '' }, caption: { default: '' }, size: { default: 'normal' } };
  },
  parseHTML() {
    return [
      {
        tag: 'figure[data-figure]',
        priority: 1000,
        getAttrs: (el) => {
          const e = el as HTMLElement;
          const img = e.querySelector('img');
          return { src: img?.getAttribute('src') || '', alt: img?.getAttribute('alt') || '', caption: e.querySelector('figcaption')?.textContent || '', size: e.getAttribute('data-size') || 'normal' };
        },
      },
    ];
  },
  renderHTML({ node }) {
    const { src, alt, caption, size } = node.attrs;
    return ['figure', { 'data-figure': '', 'data-size': size }, ['img', { src, alt, loading: 'lazy' }], ...(caption ? [['figcaption', {}, caption]] : [])] as never;
  },
  addNodeView() {
    return ReactNodeViewRenderer(FigureView);
  },
  addCommands() {
    return { insertFigure: (attrs) => ({ commands }) => commands.insertContent({ type: this.name, attrs }) };
  },
});

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return { tone: { default: 'info', parseHTML: (el) => (el as HTMLElement).getAttribute('data-callout') || 'info' } };
  },
  parseHTML() {
    return [{ tag: 'div[data-callout]', priority: 1000 }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-callout': node.attrs.tone, tone: undefined }), 0];
  },
  addCommands() {
    return {
      toggleCallout:
        (tone) =>
        ({ commands, editor }) =>
          editor.isActive('callout') ? commands.lift(this.name) : commands.wrapIn(this.name, { tone }),
    };
  },
});

function CtaView({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  const { label, href } = node.attrs as { label: string; href: string };
  return (
    <NodeViewWrapper data-cta="" className="not-prose my-8">
      <span className="inline-block bg-gold px-6 py-3 text-xs uppercase tracking-[0.2em] text-night">{label || 'Button'}</span>
      {editor.isEditable && (
        <div className="mt-2 flex flex-wrap gap-2" contentEditable={false}>
          <input className={`${field} w-48`} placeholder="Button text" value={label} onChange={(e) => updateAttributes({ label: e.target.value })} />
          <input className={`${field} flex-1`} placeholder="/contact or https://…" value={href} onChange={(e) => updateAttributes({ href: e.target.value.trim() })} />
          <button type="button" onClick={deleteNode} className="rounded-sm px-2 py-1 text-xs text-[#E8A598] hover:bg-[#E8A598]/10">Remove</button>
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const Cta = Node.create({
  name: 'cta',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return { label: { default: '' }, href: { default: '/contact' } };
  },
  parseHTML() {
    return [{ tag: 'p[data-cta]', priority: 1000, getAttrs: (el) => ({ label: (el as HTMLElement).textContent?.trim() || '', href: (el as HTMLElement).querySelector('a')?.getAttribute('href') || '/contact' }) }];
  },
  renderHTML({ node }) {
    return ['p', { 'data-cta': '' }, ['a', { href: node.attrs.href }, node.attrs.label]];
  },
  addNodeView() {
    return ReactNodeViewRenderer(CtaView);
  },
  addCommands() {
    return { insertCta: (attrs) => ({ commands }) => commands.insertContent({ type: this.name, attrs }) };
  },
});

export function parseVideoUrl(url: string): { provider: 'youtube' | 'vimeo'; vid: string } | null {
  let m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (m) return { provider: 'youtube', vid: m[1] };
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return { provider: 'vimeo', vid: m[1] };
  return null;
}

export const videoSrc = (provider: string, vid: string) => (provider === 'vimeo' ? `https://player.vimeo.com/video/${vid}?dnt=1` : `https://www.youtube-nocookie.com/embed/${vid}?rel=0`);

export const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return { provider: { default: 'youtube' }, vid: { default: '' }, title: { default: '' } };
  },
  parseHTML() {
    return [{ tag: 'div[data-video]', priority: 1000, getAttrs: (el) => ({ provider: (el as HTMLElement).getAttribute('data-video'), vid: (el as HTMLElement).getAttribute('data-id'), title: (el as HTMLElement).querySelector('iframe')?.getAttribute('title') || '' }) }];
  },
  renderHTML({ node }) {
    const { provider, vid, title } = node.attrs;
    return ['div', { 'data-video': provider, 'data-id': vid }, ['iframe', { src: videoSrc(provider, vid), title: title || 'Video', allowfullscreen: 'true', loading: 'lazy' }]];
  },
  addCommands() {
    return { insertVideo: (attrs) => ({ commands }) => commands.insertContent({ type: this.name, attrs }) };
  },
});
