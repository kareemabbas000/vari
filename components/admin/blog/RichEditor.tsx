'use client';

import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Placeholder } from '@tiptap/extension-placeholder';
import { CharacterCount } from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import { TableKit } from '@tiptap/extension-table';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import MediaLibrary from '@/components/admin/MediaLibrary';
import Modal from '@/components/admin/Modal';
import { Button, Input } from '@/components/admin/ui';
import { mediaSrc } from '@/lib/media';
import { mediaUrl } from '@/lib/image-loader';
import { Callout, Cta, Figure, Video, parseVideoUrl } from './extensions';

export type EditorValue = { json: JSONContent | null; html: string; words: number };

/** Everything the editor understands — also used to convert stored JSON to HTML. */
export const extensions = (placeholder = 'Start writing…') => [
  StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false, autolink: true, defaultProtocol: 'https' } }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Highlight,
  Typography,
  TableKit.configure({ table: { resizable: false } }),
  Placeholder.configure({ placeholder }),
  CharacterCount,
  Figure,
  Callout,
  Cta,
  Video,
];

function Tool({ on, label, onClick, children, disabled }: { on?: boolean; label: string; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={on}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid h-9 min-w-9 place-items-center rounded-sm px-2 text-sm transition-colors disabled:opacity-30 ${on ? 'bg-gold text-night' : 'text-bone/70 hover:bg-bone/10 hover:text-bone'}`}
    >
      {children}
    </button>
  );
}
const Sep = () => <span className="mx-1 h-6 w-px shrink-0 bg-bone/10" />;

function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      block: e.isActive('heading', { level: 2 }) ? 'h2' : e.isActive('heading', { level: 3 }) ? 'h3' : e.isActive('heading', { level: 4 }) ? 'h4' : 'p',
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      mark: e.isActive('highlight'),
      link: e.isActive('link'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      callout: e.isActive('callout'),
      center: e.isActive({ textAlign: 'center' }),
      table: e.isActive('table'),
      undo: e.can().undo(),
      redo: e.can().redo(),
    }),
  });
  const [media, setMedia] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [href, setHref] = useState('');
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const c = () => editor.chain().focus();

  const openLink = () => {
    setHref((editor.getAttributes('link').href as string) || '');
    setLinkOpen(true);
  };
  const applyLink = () => {
    const h = href.trim();
    if (!h) c().extendMarkRange('link').unsetLink().run();
    else c().extendMarkRange('link').setLink({ href: /^(https?:|mailto:|tel:|\/|#)/.test(h) ? h : `https://${h}` }).run();
    setLinkOpen(false);
  };

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-0.5 border-b border-bone/10 bg-[#141312]/95 p-1.5 backdrop-blur">
      <select
        aria-label="Text style"
        value={s.block}
        onChange={(e) => {
          const v = e.target.value;
          if (v === 'p') c().setParagraph().run();
          else c().setHeading({ level: Number(v.slice(1)) as 2 | 3 | 4 }).run();
        }}
        className="h-9 rounded-sm border border-bone/15 bg-transparent px-2 text-sm text-bone outline-none"
      >
        <option value="p">Paragraph</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="h4">Heading 4</option>
      </select>
      <Sep />
      <Tool label="Bold (Ctrl B)" on={s.bold} onClick={() => c().toggleBold().run()}><b>B</b></Tool>
      <Tool label="Italic (Ctrl I)" on={s.italic} onClick={() => c().toggleItalic().run()}><i className="font-serif">I</i></Tool>
      <Tool label="Underline (Ctrl U)" on={s.underline} onClick={() => c().toggleUnderline().run()}><u>U</u></Tool>
      <Tool label="Strikethrough" on={s.strike} onClick={() => c().toggleStrike().run()}><s>S</s></Tool>
      <Tool label="Highlight" on={s.mark} onClick={() => c().toggleHighlight().run()}><span className="bg-gold/40 px-1">H</span></Tool>
      <Tool label="Link (Ctrl K)" on={s.link} onClick={openLink}>🔗</Tool>
      <Sep />
      <Tool label="Bulleted list" on={s.bullet} onClick={() => c().toggleBulletList().run()}>•≡</Tool>
      <Tool label="Numbered list" on={s.ordered} onClick={() => c().toggleOrderedList().run()}>1≡</Tool>
      <Tool label="Quote" on={s.quote} onClick={() => c().toggleBlockquote().run()}>❝</Tool>
      <Tool label="Centre" on={s.center} onClick={() => (s.center ? c().setTextAlign('left').run() : c().setTextAlign('center').run())}>≣</Tool>
      <Sep />
      <Tool label="Image" onClick={() => setMedia(true)}>🖼</Tool>
      <Tool label="Video (YouTube or Vimeo)" onClick={() => setVideoOpen(true)}>▶</Tool>
      <Tool label="Tip box" on={s.callout} onClick={() => c().toggleCallout('tip').run()}>💡</Tool>
      <Tool label="Note box" onClick={() => c().toggleCallout('info').run()}>ℹ</Tool>
      <Tool label="Warning box" onClick={() => c().toggleCallout('warning').run()}>⚠</Tool>
      <Tool label="Button (call to action)" onClick={() => c().insertCta({ label: 'Start your project', href: '/contact' }).run()}>⬚</Tool>
      <Tool label="Table" on={s.table} onClick={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>▦</Tool>
      <Tool label="Divider" onClick={() => c().setHorizontalRule().run()}>―</Tool>
      <Sep />
      <Tool label="Undo" disabled={!s.undo} onClick={() => c().undo().run()}>↶</Tool>
      <Tool label="Redo" disabled={!s.redo} onClick={() => c().redo().run()}>↷</Tool>
      {s.table && (
        <div className="flex w-full flex-wrap gap-1 border-t border-bone/10 pt-1.5 text-xs">
          {(
            [
              ['Row above', () => c().addRowBefore().run()],
              ['Row below', () => c().addRowAfter().run()],
              ['Column left', () => c().addColumnBefore().run()],
              ['Column right', () => c().addColumnAfter().run()],
              ['Delete row', () => c().deleteRow().run()],
              ['Delete column', () => c().deleteColumn().run()],
              ['Delete table', () => c().deleteTable().run()],
            ] as [string, () => void][]
          ).map(([l, fn]) => (
            <button key={l} type="button" onMouseDown={(e) => e.preventDefault()} onClick={fn} className="rounded-sm border border-bone/15 px-2 py-1 text-bone/70 hover:border-gold hover:text-gold">
              {l}
            </button>
          ))}
        </div>
      )}

      <Modal open={media} title="Insert image" onClose={() => setMedia(false)} wide>
        <MediaLibrary
          mode="pick"
          onPick={(rows) => {
            const m = rows[0];
            if (m) c().insertFigure({ src: mediaUrl(mediaSrc(m.source, m.path), 1800), alt: (m.alt as { en?: string } | null)?.en || '', size: 'normal' }).run();
            setMedia(false);
          }}
        />
      </Modal>
      <Modal open={linkOpen} title="Link" onClose={() => setLinkOpen(false)}>
        <div className="space-y-3 pb-6">
          <Input autoFocus value={href} placeholder="/work, /blog/… or https://…" onChange={(e) => setHref(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyLink()} />
          <p className="text-xs text-bone/45">Link to your own pages (internal links help SEO) or to sources. External links open in a new tab.</p>
          <div className="flex gap-2">
            <Button onClick={applyLink}>Apply</Button>
            {s.link && <Button variant="ghost" onClick={() => { c().extendMarkRange('link').unsetLink().run(); setLinkOpen(false); }}>Remove link</Button>}
          </div>
        </div>
      </Modal>
      <Modal open={videoOpen} title="Insert video" onClose={() => setVideoOpen(false)}>
        <div className="space-y-3 pb-6">
          <Input autoFocus value={videoUrl} placeholder="https://www.youtube.com/watch?v=… or https://vimeo.com/…" onChange={(e) => setVideoUrl(e.target.value)} />
          <Button
            onClick={() => {
              const v = parseVideoUrl(videoUrl);
              if (!v) return;
              c().insertVideo(v).run();
              setVideoUrl('');
              setVideoOpen(false);
            }}
            disabled={!parseVideoUrl(videoUrl)}
          >
            Insert
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/** The article editor. Emits JSON (for editing) and HTML (for the website) on every change. */
export default function RichEditor({ value, onChange, placeholder, editable = true, minHeight = 420 }: { value: JSONContent | string | null; onChange?: (v: EditorValue) => void; placeholder?: string; editable?: boolean; minHeight?: number }) {
  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: extensions(placeholder),
    content: value ?? '',
    editorProps: { attributes: { class: 'post-body admin-post-body outline-none', style: `min-height:${minHeight}px` } },
    onUpdate: ({ editor: e }) => onChange?.({ json: e.getJSON(), html: e.getHTML(), words: e.storage.characterCount.words() }),
  });

  // Replace the document when the value is swapped from outside (e.g. "Start from English").
  const initial = useRef(value);
  useEffect(() => {
    if (!editor || !value || value === initial.current) return;
    // HTML (e.g. a machine translation) is converted once and reported back as JSON.
    if (typeof value === 'string') editor.commands.setContent(value, { emitUpdate: true });
    else if (JSON.stringify(editor.getJSON()) !== JSON.stringify(value)) editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  if (!editor) return <div className="rounded-sm border border-bone/10" style={{ minHeight }} />;
  return (
    <div className="rounded-sm border border-bone/15 bg-bone/[0.02] focus-within:border-gold/50">
      {editable && <Toolbar editor={editor} />}
      <div className="px-4 py-5 sm:px-8">
        <EditorContent editor={editor} />
      </div>
      <div className="flex justify-end border-t border-bone/10 px-3 py-1.5 text-[0.7rem] text-bone/40">{editor.storage.characterCount.words()} words</div>
    </div>
  );
}
