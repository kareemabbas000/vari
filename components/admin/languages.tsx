'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { FALLBACK_LANGUAGES, type Language, type Locale } from '@/lib/i18n/config';

/**
 * Languages inside the control panel. Translation fields show every language — including
 * disabled ones, so translations can be prepared before a language goes live.
 */
type Ctx = { all: Language[]; enabled: Language[]; codes: Locale[]; meta: (code: Locale) => Language };

const LanguagesContext = createContext<Language[]>(FALLBACK_LANGUAGES);

export function LanguagesProvider({ languages, children }: { languages: Language[]; children: ReactNode }) {
  return <LanguagesContext.Provider value={languages.length ? languages : FALLBACK_LANGUAGES}>{children}</LanguagesContext.Provider>;
}

export function useLanguages(): Ctx {
  const all = useContext(LanguagesContext);
  return useMemo(() => {
    const sorted = [...all].sort((a, b) => a.sort - b.sort);
    const byCode = new Map(sorted.map((l) => [l.code, l]));
    return {
      all: sorted,
      enabled: sorted.filter((l) => l.enabled),
      codes: sorted.map((l) => l.code),
      meta: (code: Locale) => byCode.get(code) ?? { ...FALLBACK_LANGUAGES[0], code, name: code.toUpperCase(), englishName: code, short: code.toUpperCase(), hreflang: code },
    };
  }, [all]);
}
