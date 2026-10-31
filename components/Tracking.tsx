'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from './I18nProvider';
import { INTRO_EVENT } from './Preloader';
import { readConsent } from '@/lib/analytics';
import { CONSENT_COOKIE, CONSENT_VERSION, cleanTracking, hasTracking, type Consent, type TrackingSettings } from '@/lib/tracking';

export const OPEN_CONSENT = 'vari:consent-open';

type W = Window & Record<string, unknown> & { dataLayer: unknown[]; gtag: (...a: unknown[]) => void };

function addScript(src: string, attrs: Record<string, string> = {}) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
}

/** Insert a code snippet from the panel; <script> tags are re-created so they execute. */
function addSnippet(html: string, where: 'head' | 'body', id: string) {
  if (document.querySelector(`[data-vari-snippet="${id}"]`)) return;
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const target = where === 'head' ? document.head : document.body;
  tpl.content.childNodes.forEach((node) => {
    let el: Node = node.cloneNode(true);
    if (node.nodeName === 'SCRIPT') {
      const src = node as HTMLScriptElement;
      const s = document.createElement('script');
      Array.from(src.attributes).forEach((a) => s.setAttribute(a.name, a.value));
      s.text = src.text;
      el = s;
    }
    if (el instanceof Element) el.setAttribute('data-vari-snippet', id);
    target.appendChild(el);
  });
}

type ClarityFn = (...a: unknown[]) => void;
const clarity = (...a: unknown[]) => (window as unknown as { clarity?: ClarityFn }).clarity?.(...a);

/** What kind of page this is — lets Clarity filter recordings and heatmaps by page type. */
function pageType(rest: string) {
  if (rest === '/' || rest === '') return 'home';
  if (/^\/work\/[^/]+/.test(rest)) return 'project';
  if (/^\/blog\/(category|author)\//.test(rest)) return 'blog-list';
  if (/^\/blog\/[^/]+/.test(rest)) return 'article';
  const first = rest.split('/')[1];
  return ['work', 'services', 'studio', 'contact', 'blog', 'privacy'].includes(first) ? first : 'landing';
}

/** Custom tags for the current page (Clarity keeps the last value per key for the page). */
function tagClarityPage() {
  const [, locale = '', ...parts] = window.location.pathname.split('/');
  const rest = `/${parts.join('/')}`.replace(/\/$/, '') || '/';
  clarity('set', 'language', locale);
  clarity('set', 'page_type', pageType(rest));
  if (/^\/(work|blog)\/[^/]+$/.test(rest)) clarity('set', 'content', parts[parts.length - 1]);
}

/** Remove Clarity's first-party cookies when analytics consent is withdrawn. */
function clearClarityCookies() {
  const host = location.hostname.split('.').slice(-2).join('.');
  for (const name of ['_clck', '_clsk']) {
    for (const domain of ['', `; domain=${location.hostname}`, `; domain=.${host}`]) document.cookie = `${name}=; path=/; max-age=0${domain}`;
  }
}

function load(t: TrackingSettings, c: Consent) {
  const w = window as unknown as W;
  const anyGoogle = t.ga4 || t.gtm || t.googleAds;
  if (anyGoogle && !w.gtag) {
    w.dataLayer = w.dataLayer || [];
    // eslint-disable-next-line prefer-rest-params
    w.gtag = function gtag() { w.dataLayer.push(arguments); };
    w.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', wait_for_update: 500 });
  }
  if (anyGoogle) {
    const g = (b: boolean) => (b ? 'granted' : 'denied');
    w.gtag('consent', 'update', { analytics_storage: g(c.analytics), ad_storage: g(c.marketing), ad_user_data: g(c.marketing), ad_personalization: g(c.marketing) });
  }
  if (t.ga4 && c.analytics && !w.__variGa) {
    w.__variGa = true;
    addScript(`https://www.googletagmanager.com/gtag/js?id=${t.ga4}`);
    w.gtag('js', new Date());
    w.gtag('config', t.ga4, { anonymize_ip: true });
  }
  if (t.googleAds && c.marketing && !w.__variAds) {
    w.__variAds = true;
    addScript(`https://www.googletagmanager.com/gtag/js?id=${t.googleAds}`);
    if (!t.ga4) w.gtag('js', new Date());
    w.gtag('config', t.googleAds);
  }
  if (t.gtm && (c.analytics || c.marketing) && !w.__variGtm) {
    w.__variGtm = true;
    w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    addScript(`https://www.googletagmanager.com/gtm.js?id=${t.gtm}`);
  }
  if (t.metaPixel && c.marketing && !w.fbq) {
    /* Meta Pixel base code */
    const n = function fbq(...args: unknown[]) {
      const self = n as unknown as { callMethod?: (...a: unknown[]) => void; queue: unknown[] };
      if (self.callMethod) self.callMethod(...args);
      else self.queue.push(args);
    } as unknown as Record<string, unknown>;
    Object.assign(n, { push: n, loaded: true, version: '2.0', queue: [] });
    w.fbq = n;
    w._fbq = n;
    addScript('https://connect.facebook.net/en_US/fbevents.js');
    (w.fbq as (...a: unknown[]) => void)('init', t.metaPixel);
    (w.fbq as (...a: unknown[]) => void)('track', 'PageView');
  }
  if (t.clarity && c.analytics) {
    // Microsoft Clarity — official loader (queue first, async tag), then Consent API v2 so
    // Clarity knows it may set its cookies (_clck/_clsk) and link pages into one session.
    if (!w.clarity) {
      // eslint-disable-next-line prefer-rest-params
      w.clarity = function clarity() { ((w.clarity as { q?: unknown[] }).q = (w.clarity as { q?: unknown[] }).q || []).push(arguments); };
      addScript(`https://www.clarity.ms/tag/${t.clarity}`);
    }
    clarity('consentv2', { analytics_Storage: 'granted', ad_Storage: c.marketing ? 'granted' : 'denied' });
    tagClarityPage();
  }
  if (t.linkedin && c.marketing && !w._linkedin_partner_id) {
    w._linkedin_partner_id = t.linkedin;
    w._linkedin_data_partner_ids = [t.linkedin];
    addScript('https://snap.licdn.com/li.lms-analytics/insight.min.js');
  }
  if (t.tiktok && c.marketing && !w.ttq) {
    const q: unknown[] = [];
    const ttq: Record<string, unknown> = { _i: {}, _q: q };
    ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'].forEach((m) => {
      ttq[m] = (...a: unknown[]) => q.push([m, ...a]);
    });
    w.ttq = ttq;
    addScript(`https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${t.tiktok}&lib=ttq`);
    (ttq.page as () => void)();
  }
  for (const s of t.snippets || []) {
    if (s.category === 'necessary' || (s.category === 'analytics' && c.analytics) || (s.category === 'marketing' && c.marketing)) addSnippet(s.code, s.placement, s.id);
  }
}

function saveConsent(c: Consent) {
  const v = encodeURIComponent(JSON.stringify({ a: c.analytics ? 1 : 0, m: c.marketing ? 1 : 0, v: CONSENT_VERSION, t: Date.now() }));
  document.cookie = `${CONSENT_COOKIE}=${v}; path=/; max-age=${60 * 60 * 24 * 180}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
}

/**
 * Loads the trackers configured in the panel — only after the visitor agrees — and shows
 * the consent banner (equal-weight Accept / Necessary only, per EU guidance).
 */
export default function Tracking() {
  const { settings, t } = useI18n();
  const config = cleanTracking(settings.tracking);
  const pathname = usePathname();
  // The page builder's live preview is an editor tool, not a visit: never track it.
  const preview = /\/builder-preview(\/|$)/.test(pathname || '');
  const active = hasTracking(settings.tracking) && !preview;
  const necessaryOnly = (config.snippets || []).filter((s) => s.category === 'necessary');
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [choice, setChoice] = useState<Consent>({ analytics: false, marketing: false });
  const first = useRef(true);
  const cfgKey = JSON.stringify(config);

  const apply = useCallback(
    (c: Consent) => {
      load(config, c);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cfgKey],
  );

  useEffect(() => {
    if (preview) return;
    if (necessaryOnly.length) load({ snippets: necessaryOnly }, { analytics: false, marketing: false });
    if (!active) return;
    const saved = readConsent();
    if (saved) {
      setChoice(saved);
      apply(saved);
      return;
    }
    // Let the intro (and its language choice) finish before asking.
    const show = () => setOpen(true);
    const onIntro = () => setTimeout(show, 600);
    const id = setTimeout(() => {
      if (document.querySelector('[data-preloader]')) window.addEventListener(INTRO_EVENT, onIntro, { once: true });
      else show();
    }, 1200);
    return () => {
      clearTimeout(id);
      window.removeEventListener(INTRO_EVENT, onIntro);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, apply]);

  useEffect(() => {
    const reopen = () => {
      setChoice(readConsent() || { analytics: false, marketing: false });
      setDetails(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_CONSENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT, reopen);
  }, []);

  // Page views on client-side navigation (GA4 tracks history changes itself).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const w = window as unknown as { fbq?: (...a: unknown[]) => void; ttq?: { page: () => void } };
    w.fbq?.('track', 'PageView');
    w.ttq?.page();
    // Clarity follows client-side navigation itself; refresh the page tags for the new page.
    tagClarityPage();
  }, [pathname]);

  const decide = (c: Consent) => {
    const before = readConsent();
    saveConsent(c);
    setChoice(c);
    setOpen(false);
    // Withdrawing consent: tell Clarity, drop its cookies and reload so loaded trackers are gone.
    if (before && ((before.analytics && !c.analytics) || (before.marketing && !c.marketing))) {
      if (!c.analytics) {
        clarity('consentv2', { analytics_Storage: 'denied', ad_Storage: 'denied' });
        clearClarityCookies();
      }
      window.location.reload();
    }
    else apply(c);
  };

  if (!active || !open) return null;
  const k = t.consent;
  return (
    <div role="dialog" aria-modal="false" aria-labelledby="consent-title" className="fixed inset-x-3 bottom-3 z-[70] max-w-[30rem] border border-gold/30 bg-[#11100e]/95 p-5 text-bone shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md sm:inset-x-auto sm:left-5 sm:bottom-5 sm:p-6">
      <p id="consent-title" className="display text-[1.6rem] leading-tight">{k.title}</p>
      <p className="mt-3 text-sm leading-relaxed text-bone/65">{k.body}</p>
      {details && (
        <div className="mt-5 space-y-3 border-t border-bone/10 pt-4">
          {(
            [
              ['necessary', k.necessary, k.necessaryBody],
              ['analytics', k.analytics, k.analyticsBody],
              ['marketing', k.marketing, k.marketingBody],
            ] as const
          ).map(([key, label, body]) => (
            <label key={key} className="flex cursor-pointer items-start justify-between gap-4">
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs leading-relaxed text-bone/50">{body}</span>
              </span>
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0 accent-[#D4AF37]"
                checked={key === 'necessary' ? true : choice[key]}
                disabled={key === 'necessary'}
                onChange={(e) => key !== 'necessary' && setChoice((c) => ({ ...c, [key]: e.target.checked }))}
              />
            </label>
          ))}
        </div>
      )}
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => decide({ analytics: false, marketing: false })} className="min-h-[46px] border border-bone/25 px-3 text-[0.72rem] uppercase tracking-[0.18em] hover:border-gold hover:text-gold">
          {k.reject}
        </button>
        <button type="button" onClick={() => decide({ analytics: true, marketing: true })} className="min-h-[46px] border border-bone/25 px-3 text-[0.72rem] uppercase tracking-[0.18em] hover:border-gold hover:text-gold">
          {k.accept}
        </button>
        <button type="button" onClick={() => (details ? decide(choice) : setDetails(true))} className="col-span-2 min-h-[42px] text-[0.72rem] uppercase tracking-[0.18em] text-gold hover:underline">
          {details ? k.save : k.customize}
        </button>
      </div>
    </div>
  );
}

/** Footer link that reopens the banner. */
export function ConsentLink({ className = '' }: { className?: string }) {
  const { t, settings } = useI18n();
  if (!hasTracking(settings.tracking)) return null;
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT))} className={className}>
      {t.consent.settings}
    </button>
  );
}
