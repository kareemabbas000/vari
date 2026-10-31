'use client';

import Image from 'next/image';
import { useState, type ReactNode } from 'react';
import { Input, Select, Switch } from '@/components/admin/ui';
import I18nInput, { type I18nValue } from '@/components/admin/I18nInput';
import MediaLibrary from '@/components/admin/MediaLibrary';
import Modal from '@/components/admin/Modal';
import { mediaSrc } from '@/lib/media';
import { DEFAULT_STYLE, type BlockStyle, type Field, type LinkValue } from '@/lib/blocks/schema';

/** Shared look for a labelled control in the narrow builder panel. */
export function Row({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="font-sans text-[0.68rem] font-medium uppercase tracking-[0.16em] text-bone/55">{label}</p>
      {children}
      {hint && <p className="text-[0.72rem] leading-relaxed text-bone/40">{hint}</p>}
    </div>
  );
}

/** Small segmented control for 2–5 options. */
export function Segmented({ value, options, onChange }: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-1 rounded-sm border border-bone/10 bg-bone/[0.03] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-[34px] flex-1 rounded-[2px] px-2 text-[0.74rem] transition-colors ${value === o.value ? 'bg-gold text-night' : 'text-bone/65 hover:bg-bone/5 hover:text-bone'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ImagePick({ value, onChange, multiple = false, values = [], onChangeMany }: { value?: string; onChange?: (v: string) => void; multiple?: boolean; values?: string[]; onChangeMany?: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const thumb = (src: string, i: number) => (
    <div key={`${src}-${i}`} className="group relative aspect-[4/3] overflow-hidden rounded-sm border border-bone/10 bg-bone/5">
      <Image src={src} alt="" fill sizes="160px" className="object-cover" />
      {multiple && (
        <div className="absolute inset-x-0 bottom-0 flex justify-between bg-night/80 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
          <button type="button" aria-label="Move earlier" className="h-8 w-8 hover:text-gold" onClick={() => i > 0 && onChangeMany?.(values.map((v, k) => (k === i - 1 ? values[i] : k === i ? values[i - 1] : v)))}>←</button>
          <button type="button" aria-label="Remove" className="h-8 w-8 hover:text-[#E8A598]" onClick={() => onChangeMany?.(values.filter((_, k) => k !== i))}>✕</button>
          <button type="button" aria-label="Move later" className="h-8 w-8 hover:text-gold" onClick={() => i < values.length - 1 && onChangeMany?.(values.map((v, k) => (k === i + 1 ? values[i] : k === i ? values[i + 1] : v)))}>→</button>
        </div>
      )}
    </div>
  );
  return (
    <>
      {multiple ? (
        <div className="grid grid-cols-3 gap-2">
          {values.map(thumb)}
          <button type="button" onClick={() => setOpen(true)} className="grid aspect-[4/3] place-items-center rounded-sm border border-dashed border-gold/40 text-[0.72rem] text-gold hover:bg-gold/5">
            + Add
          </button>
        </div>
      ) : value ? (
        <div className="space-y-2">
          {thumb(value, 0)}
          <div className="flex gap-3 text-[0.75rem]">
            <button type="button" className="text-gold hover:underline" onClick={() => setOpen(true)}>Replace</button>
            <button type="button" className="text-bone/50 hover:text-[#E8A598]" onClick={() => onChange?.('')}>Remove</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="grid aspect-[16/9] w-full place-items-center rounded-sm border border-dashed border-gold/40 text-[0.78rem] text-gold hover:bg-gold/5">
          Choose or upload an image
        </button>
      )}
      <Modal open={open} title={multiple ? 'Add images' : 'Choose image'} onClose={() => setOpen(false)} wide>
        <MediaLibrary
          mode="pick"
          multiple={multiple}
          onPick={(rows) => {
            const srcs = rows.map((m) => mediaSrc(m.source, m.path));
            if (multiple) onChangeMany?.([...values, ...srcs]);
            else if (srcs[0]) onChange?.(srcs[0]);
            setOpen(false);
          }}
        />
      </Modal>
    </>
  );
}

export type LinkTarget = { href: string; label: string };

function LinkEdit({ value, onChange, targets }: { value: LinkValue; onChange: (v: LinkValue) => void; targets: LinkTarget[] }) {
  const listId = 'builder-link-targets';
  return (
    <div className="space-y-3 rounded-sm border border-bone/10 p-3">
      <I18nInput compact label="Text" value={(value.label as I18nValue) || {}} onChange={(label) => onChange({ ...value, label })} maxLength={60} />
      <div>
        <p className="mb-1.5 font-sans text-[0.68rem] uppercase tracking-[0.16em] text-bone/45">Goes to</p>
        <Input list={listId} value={value.href || ''} placeholder="/contact or https://…" onChange={(e) => onChange({ ...value, href: e.target.value.trim() })} />
        <datalist id={listId}>
          {targets.map((t) => (
            <option key={t.href} value={t.href}>
              {t.label}
            </option>
          ))}
        </datalist>
      </div>
    </div>
  );
}

function ListEdit({ field, value, onChange, ctx }: { field: Extract<Field, { kind: 'list' }>; value: Record<string, unknown>[]; onChange: (v: Record<string, unknown>[]) => void; ctx: Ctx }) {
  const [open, setOpen] = useState<number | null>(value.length === 1 ? 0 : null);
  const items = value || [];
  const set = (i: number, item: Record<string, unknown>) => onChange(items.map((x, k) => (k === i ? item : x)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const n = [...items];
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
    setOpen(j);
  };
  const summary = (item: Record<string, unknown>, i: number) => {
    for (const f of field.fields) {
      const v = item[f.key];
      if (typeof v === 'string' && v) return v;
      if (v && typeof v === 'object' && 'en' in (v as object) && (v as I18nValue).en) return (v as I18nValue).en!;
      if (v && typeof v === 'object' && 'label' in (v as object)) return ((v as LinkValue).label as I18nValue)?.en || `${field.item} ${i + 1}`;
    }
    return `${field.item} ${i + 1}`;
  };
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-sm border border-bone/10 bg-bone/[0.02]">
          <div className="flex items-center gap-1 pr-1">
            <button type="button" onClick={() => setOpen(open === i ? null : i)} className="flex min-h-[44px] flex-1 items-center gap-3 px-3 text-left text-sm" aria-expanded={open === i}>
              <span className="label text-[0.6rem] text-gold">{String(i + 1).padStart(2, '0')}</span>
              <span className="line-clamp-1 flex-1">{summary(item, i)}</span>
              <span aria-hidden className={`text-bone/40 transition-transform ${open === i ? 'rotate-180' : ''}`}>⌄</span>
            </button>
            <button type="button" aria-label="Move up" className="h-9 w-8 text-bone/40 hover:text-gold" onClick={() => move(i, -1)}>↑</button>
            <button type="button" aria-label="Move down" className="h-9 w-8 text-bone/40 hover:text-gold" onClick={() => move(i, 1)}>↓</button>
            <button type="button" aria-label="Remove" className="h-9 w-8 text-bone/40 hover:text-[#E8A598]" onClick={() => onChange(items.filter((_, k) => k !== i))}>✕</button>
          </div>
          {open === i && (
            <div className="space-y-5 border-t border-bone/10 p-3">
              {field.fields.map((f) => (
                <FieldEditor key={f.key} field={f} value={item[f.key]} onChange={(v) => set(i, { ...item, [f.key]: v })} ctx={ctx} />
              ))}
            </div>
          )}
        </div>
      ))}
      {(!field.max || items.length < field.max) && (
        <button
          type="button"
          onClick={() => {
            onChange([...items, {}]);
            setOpen(items.length);
          }}
          className="flex min-h-[40px] w-full items-center justify-center rounded-sm border border-dashed border-gold/40 text-[0.78rem] text-gold hover:bg-gold/5"
        >
          + Add {field.item.toLowerCase()}
        </button>
      )}
    </div>
  );
}

export type Ctx = { targets: LinkTarget[]; projects: { slug: string; title: string }[] };

/** One field of a block, edited with the control that suits its kind. */
export function FieldEditor({ field, value, onChange, ctx }: { field: Field; value: unknown; onChange: (v: unknown) => void; ctx: Ctx }) {
  switch (field.kind) {
    case 'text':
      if (field.i18n)
        return <I18nInput compact label={field.label} value={(value as I18nValue) || {}} onChange={onChange} multiline={field.multiline} rows={field.rows} maxLength={field.max} hint={field.hint} />;
      return (
        <Row label={field.label} hint={field.hint}>
          <Input value={(value as string) || ''} maxLength={field.max} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
        </Row>
      );
    case 'richtext':
      return <I18nInput compact label={field.label} value={(value as I18nValue) || {}} onChange={onChange} multiline rows={7} hint={field.hint} />;
    case 'image':
      return (
        <Row label={field.label} hint={field.hint}>
          <ImagePick value={(value as string) || ''} onChange={onChange} />
        </Row>
      );
    case 'images':
      return (
        <Row label={field.label} hint={field.hint}>
          <ImagePick multiple values={Array.isArray(value) ? (value as string[]) : []} onChangeMany={onChange} />
        </Row>
      );
    case 'select':
      return (
        <Row label={field.label} hint={field.hint}>
          {field.options.length <= 3 && field.options.every((o) => o.label.length < 14) ? (
            <Segmented value={(value as string) ?? field.options[0].value} options={field.options} onChange={onChange} />
          ) : (
            <Select value={(value as string) ?? field.options[0].value} onChange={(e) => onChange(e.target.value)}>
              {field.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          )}
        </Row>
      );
    case 'toggle':
      return <Switch checked={!!value} onChange={onChange} label={field.label} description={field.hint} />;
    case 'number': {
      const n = typeof value === 'number' ? value : field.min;
      return (
        <Row label={`${field.label} · ${n}${field.unit ?? ''}`}>
          <input type="range" min={field.min} max={field.max} step={field.step ?? 1} value={n} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#D4AF37]" aria-label={field.label} />
        </Row>
      );
    }
    case 'link':
      return (
        <Row label={field.label}>
          <LinkEdit value={(value as LinkValue) || {}} onChange={onChange} targets={ctx.targets} />
        </Row>
      );
    case 'url':
      return (
        <Row label={field.label} hint={field.hint}>
          <Input type="url" value={(value as string) || ''} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value.trim())} />
        </Row>
      );
    case 'projects': {
      const chosen = Array.isArray(value) ? (value as string[]) : [];
      return (
        <Row label={field.label} hint={field.hint}>
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-sm border border-bone/10 p-2">
            {ctx.projects.map((p) => {
              const on = chosen.includes(p.slug);
              return (
                <label key={p.slug} className="flex min-h-[36px] cursor-pointer items-center gap-3 rounded-sm px-2 text-sm hover:bg-bone/5">
                  <input type="checkbox" checked={on} onChange={() => onChange(on ? chosen.filter((s) => s !== p.slug) : [...chosen, p.slug])} className="accent-[#D4AF37]" />
                  <span className="flex-1">{p.title}</span>
                  {on && <span className="label text-[0.6rem] text-gold">{chosen.indexOf(p.slug) + 1}</span>}
                </label>
              );
            })}
          </div>
        </Row>
      );
    }
    case 'list':
      return (
        <Row label={field.label}>
          <ListEdit field={field} value={Array.isArray(value) ? (value as Record<string, unknown>[]) : []} onChange={onChange} ctx={ctx} />
        </Row>
      );
  }
}

const SWATCHES: { value: NonNullable<BlockStyle['bg']>; label: string; cls: string }[] = [
  { value: 'night', label: 'Night', cls: 'bg-night' },
  { value: 'ink', label: 'Ink', cls: 'bg-ink' },
  { value: 'charcoal', label: 'Charcoal', cls: 'bg-charcoal' },
  { value: 'bone', label: 'Bone', cls: 'bg-bone' },
  { value: 'gold', label: 'Gold', cls: 'bg-gold' },
  { value: 'image', label: 'Image', cls: 'bg-[linear-gradient(135deg,#473A12,#0C0B0A)]' },
];

/** Design options every block shares. */
export function StyleEditor({ style, defaults, onChange, isHero }: { style: BlockStyle; defaults: BlockStyle; onChange: (s: BlockStyle) => void; isHero: boolean }) {
  const s = { ...DEFAULT_STYLE, ...defaults, ...style };
  const set = (patch: BlockStyle) => onChange({ ...style, ...patch });
  return (
    <div className="space-y-6">
      {!isHero && (
        <>
          <Row label="Background">
            <div className="grid grid-cols-6 gap-2">
              {SWATCHES.map((w) => (
                <button key={w.value} type="button" title={w.label} aria-label={w.label} aria-pressed={s.bg === w.value} onClick={() => set({ bg: w.value })} className={`aspect-square rounded-sm border ${w.cls} ${s.bg === w.value ? 'border-gold ring-2 ring-gold/50' : 'border-bone/20'}`} />
              ))}
            </div>
          </Row>
          {s.bg === 'image' && (
            <>
              <Row label="Background image">
                <ImagePick value={s.bgImage || ''} onChange={(bgImage) => set({ bgImage })} />
              </Row>
              <Row label={`Darken image · ${s.overlay}%`}>
                <input type="range" min={0} max={90} step={5} value={s.overlay} onChange={(e) => set({ overlay: Number(e.target.value) })} className="w-full accent-[#D4AF37]" aria-label="Darken image" />
              </Row>
            </>
          )}
          <Row label="Spacing">
            <Segmented value={s.pad} onChange={(v) => set({ pad: v as BlockStyle['pad'] })} options={[{ value: 'none', label: '0' }, { value: 'sm', label: 'S' }, { value: 'md', label: 'M' }, { value: 'lg', label: 'L' }, { value: 'xl', label: 'XL' }]} />
          </Row>
          <Row label="Content width">
            <Segmented value={s.width} onChange={(v) => set({ width: v as BlockStyle['width'] })} options={[{ value: 'narrow', label: 'Narrow' }, { value: 'normal', label: 'Normal' }, { value: 'wide', label: 'Wide' }, { value: 'full', label: 'Full' }]} />
          </Row>
          <Row label="Alignment">
            <Segmented value={s.align} onChange={(v) => set({ align: v as BlockStyle['align'] })} options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }]} />
          </Row>
          <Switch checked={s.reveal} onChange={(reveal) => set({ reveal })} label="Fade in on scroll" />
        </>
      )}
      <Row label="Show on">
        <Segmented value={s.hideOn} onChange={(v) => set({ hideOn: v as BlockStyle['hideOn'] })} options={[{ value: '', label: 'All screens' }, { value: 'mobile', label: 'Desktop only' }, { value: 'desktop', label: 'Mobile only' }]} />
      </Row>
      <Row label="Anchor name" hint={s.anchor ? `Link to it with #${s.anchor}` : 'Optional: lets buttons jump to this block, e.g. "pricing".'}>
        <Input value={s.anchor || ''} placeholder="pricing" onChange={(e) => set({ anchor: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 40) })} />
      </Row>
    </div>
  );
}
