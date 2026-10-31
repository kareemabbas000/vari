'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Project } from '@/lib/content';
import { type Language, type Locale, localizePath } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n';
import type { CategoryItem, ServiceItem, SiteContent, SiteSettings } from '@/lib/cms';

type I18n = {
  locale: Locale;
  t: Dictionary;
  /** Prefix an internal path with the current locale. */
  href: (path: string) => string;
  projects: Project[];
  categories: CategoryItem[];
  services: ServiceItem[];
  settings: SiteSettings;
  /** Enabled languages, in the order set in the panel. */
  languages: Language[];
  defaultLocale: Locale;
};

const I18nContext = createContext<I18n | null>(null);

/** Receives the page's content (CMS or built-in fallback) from the server layout. */
export function I18nProvider({ content, children }: { content: SiteContent; children: ReactNode }) {
  const value = useMemo<I18n>(
    () => ({
      locale: content.locale,
      t: content.t,
      href: (p) => localizePath(content.locale, p),
      projects: content.projects,
      categories: content.categories,
      services: content.services,
      settings: content.settings,
      languages: content.languages,
      defaultLocale: content.defaultLocale,
    }),
    [content],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Site settings when inside the public site (null in the control panel). */
export function useSiteSettingsOptional() {
  return useContext(I18nContext)?.settings ?? null;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
