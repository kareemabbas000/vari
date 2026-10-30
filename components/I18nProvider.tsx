'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Project } from '@/lib/content';
import { type Locale, localizePath } from '@/lib/i18n/config';
import { getDictionary, localizeProjects, type Dictionary } from '@/lib/i18n';

type I18n = {
  locale: Locale;
  t: Dictionary;
  /** Prefix an internal path with the current locale. */
  href: (path: string) => string;
  projects: Project[];
};

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<I18n>(() => {
    const t = getDictionary(locale);
    return { locale, t, href: (p) => localizePath(locale, p), projects: localizeProjects(t) };
  }, [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
