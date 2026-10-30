'use client';

import { useId, useState } from 'react';
import { locales, localeMeta, type Locale } from '@/lib/i18n/config';
import { Input, Textarea } from './ui';

export type I18nValue = Partial<Record<Locale, string>>;

/**
 * One text in three languages. Side by side on wide screens, tabs on phones.
 * Missing translations are flagged; German/Spanish can start from a copy of English.
 */
export default function I18nInput({
  label,
  value,
  onChange,
  multiline = false,
  rows = 4,
  hint,
  required = false,
  maxLength,
}: {
  label: string;
  value: I18nValue;
  onChange: (v: I18nValue) => void;
  multiline?: boolean;
  rows?: number;
  hint?: string;
  required?: boolean;
  maxLength?: number;
}) {
  const [tab, setTab] = useState<Locale>('en');
  const id = useId();
  const v = value || {};
  const missing = (l: Locale) => !!v.en?.trim() && !v[l]?.trim();
  const set = (l: Locale, text: string) => onChange({ ...v, [l]: text });

  const editor = (l: Locale) => {
    const common = {
      id: `${id}-${l}`,
      value: v[l] ?? '',
      lang: l,
      maxLength,
      'aria-label': `${label} (${localeMeta[l].name})`,
      placeholder: l === 'en' ? '' : v.en ? `${localeMeta[l].name} translation…` : '',
    };
    return multiline ? (
      <Textarea {...common} rows={rows} onChange={(e) => set(l, e.target.value)} />
    ) : (
      <Input {...common} onChange={(e) => set(l, e.target.value)} />
    );
  };

  const header = (l: Locale) => (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 font-sans text-[0.68rem] uppercase tracking-[0.16em] text-bone/45">
        {localeMeta[l].short}
        {missing(l) && <span className="h-1.5 w-1.5 rounded-full bg-gold" title="Missing translation" />}
      </span>
      {l !== 'en' && missing(l) && (
        <button type="button" onClick={() => set(l, v.en ?? '')} className="text-[0.7rem] text-gold/80 hover:text-gold hover:underline">
          Copy English
        </button>
      )}
    </div>
  );

  return (
    <fieldset className="space-y-2">
      <legend className="flex w-full items-baseline justify-between gap-3">
        <span className="font-sans text-[0.72rem] font-medium uppercase tracking-[0.16em] text-bone/60">
          {label}
          {required && <span className="text-gold"> *</span>}
        </span>
        {locales.some(missing) && <span className="text-[0.7rem] text-gold/80">Translation missing</span>}
      </legend>

      {/* Phones / tablets: tabs */}
      <div className="lg:hidden">
        <div role="tablist" aria-label={`${label} language`} className="mb-2 flex gap-1">
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={tab === l}
              onClick={() => setTab(l)}
              className={`relative min-h-[36px] flex-1 rounded-sm border text-[0.75rem] font-medium uppercase tracking-[0.14em] transition-colors ${
                tab === l ? 'border-gold bg-gold/10 text-gold' : 'border-bone/15 text-bone/55'
              }`}
            >
              {localeMeta[l].short}
              {missing(l) && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-gold" aria-label="missing" />}
            </button>
          ))}
        </div>
        {tab !== 'en' && missing(tab) && (
          <button type="button" onClick={() => set(tab, v.en ?? '')} className="mb-2 text-xs text-gold/80 hover:underline">
            Start from the English text
          </button>
        )}
        {editor(tab)}
      </div>

      {/* Desktop: side by side */}
      <div className="hidden gap-3 lg:grid lg:grid-cols-3">
        {locales.map((l) => (
          <div key={l}>
            {header(l)}
            {editor(l)}
          </div>
        ))}
      </div>
      {hint && <p className="text-xs text-bone/40">{hint}</p>}
    </fieldset>
  );
}
