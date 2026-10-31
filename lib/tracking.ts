/**
 * Analytics & marketing settings (Site → Analytics & tracking in the panel).
 * IDs are validated here before they ever reach a page, so a typo can't inject markup.
 */

export type Consent = { analytics: boolean; marketing: boolean };
export type CodeSnippet = { id: string; name: string; placement: 'head' | 'body'; category: 'necessary' | 'analytics' | 'marketing'; code: string; enabled: boolean };

export type TrackingSettings = {
  ga4?: string;
  gtm?: string;
  googleAds?: string;
  metaPixel?: string;
  clarity?: string;
  linkedin?: string;
  tiktok?: string;
  /** Meta Conversions API (server-side events); the token itself is stored privately. */
  metaCapi?: boolean;
  snippets?: CodeSnippet[];
};

export type Verification = { google?: string; bing?: string; facebook?: string; pinterest?: string; yandex?: string };

export const ID_PATTERNS: Record<keyof Omit<TrackingSettings, 'metaCapi' | 'snippets'>, { re: RegExp; example: string; label: string; help: string; category: keyof Consent }> = {
  ga4: { re: /^G-[A-Z0-9]{4,14}$/, example: 'G-XXXXXXXXXX', label: 'Google Analytics 4 — Measurement ID', help: 'Analytics → Admin → Data streams → your web stream → Measurement ID.', category: 'analytics' },
  gtm: { re: /^GTM-[A-Z0-9]{4,10}$/, example: 'GTM-XXXXXXX', label: 'Google Tag Manager — Container ID', help: 'Tag Manager → your container → the ID next to its name. Tags inside GTM follow the visitor’s consent (Consent Mode v2).', category: 'analytics' },
  googleAds: { re: /^AW-\d{6,14}$/, example: 'AW-123456789', label: 'Google Ads — Conversion ID', help: 'Google Ads → Goals → Conversions → Tag setup. Enquiries are reported as conversions.', category: 'marketing' },
  metaPixel: { re: /^\d{10,20}$/, example: '123456789012345', label: 'Meta (Facebook / Instagram) Pixel ID', help: 'Meta Events Manager → Data sources → your pixel → Dataset ID.', category: 'marketing' },
  clarity: { re: /^[a-z0-9]{8,12}$/, example: 'abcd1234ef', label: 'Microsoft Clarity — Project ID', help: 'Free heatmaps & session recordings. Clarity → Settings → Setup → Project ID.', category: 'analytics' },
  linkedin: { re: /^\d{5,10}$/, example: '1234567', label: 'LinkedIn Insight Tag — Partner ID', help: 'LinkedIn Campaign Manager → Analyze → Insight Tag → Partner ID.', category: 'marketing' },
  tiktok: { re: /^[A-Z0-9]{18,22}$/, example: 'C4XXXXXXXXXXXXXXXXXX', label: 'TikTok Pixel ID', help: 'TikTok Ads Manager → Assets → Events → Web events → Pixel ID.', category: 'marketing' },
};

export const VERIFY_PATTERN = /^[A-Za-z0-9_\-=.:]{6,128}$/;

/** Only well-formed IDs survive. */
export function cleanTracking(t: TrackingSettings | undefined): TrackingSettings {
  const out: TrackingSettings = {};
  if (!t) return out;
  for (const [k, spec] of Object.entries(ID_PATTERNS) as [keyof typeof ID_PATTERNS, (typeof ID_PATTERNS)[keyof typeof ID_PATTERNS]][]) {
    const v = typeof t[k] === 'string' ? (t[k] as string).trim() : '';
    if (v && spec.re.test(v)) out[k] = v;
  }
  out.metaCapi = !!t.metaCapi && !!out.metaPixel;
  out.snippets = (t.snippets || []).filter((s) => s && s.enabled && typeof s.code === 'string' && s.code.trim()).slice(0, 20);
  return out;
}

export function hasTracking(t: TrackingSettings | undefined): boolean {
  const c = cleanTracking(t);
  return !!(c.ga4 || c.gtm || c.googleAds || c.metaPixel || c.clarity || c.linkedin || c.tiktok || c.snippets?.some((s) => s.category !== 'necessary'));
}

export const CONSENT_COOKIE = 'vari_consent';
export const CONSENT_VERSION = 1;
