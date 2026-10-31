'use client';

import { useEffect, useState } from 'react';
import { useI18n } from './I18nProvider';
import { pick } from '@/lib/cms';
import { resolveHref } from '@/lib/blocks/schema';
import { SmartLink } from './blocks/Rich';

/** Slim bar above the menu (panel → Menus & announcement). Dismissal is remembered per version. */
export default function Announcement() {
  const { settings, locale, href } = useI18n();
  const a = settings.announcement;
  const text = pick(a.text, locale);
  const key = `vari-announce-${a.version}`;
  const [show, setShow] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = a.dismissible && localStorage.getItem(key) === '1';
    } catch {}
    setShow(a.enabled && !!text && !dismissed);
  }, [a.enabled, a.dismissible, text, key]);

  useEffect(() => {
    document.documentElement.style.setProperty('--announce-h', show ? '40px' : '0px');
    return () => {
      document.documentElement.style.removeProperty('--announce-h');
    };
  }, [show]);

  if (!show) return null;
  const linkLabel = pick(a.link?.label, locale);
  const to = resolveHref(a.link?.href, href);
  return (
    <div className="relative flex h-10 items-center justify-center gap-3 bg-gold px-12 text-center text-[0.78rem] text-night">
      <p className="line-clamp-1">
        {text}
        {linkLabel && to && (
          <>
            {' '}
            <SmartLink href={to} localize={(p) => p} className="font-medium underline underline-offset-2">
              {linkLabel} →
            </SmartLink>
          </>
        )}
      </p>
      {a.dismissible && (
        <button
          type="button"
          aria-label="Close"
          onClick={() => {
            try {
              localStorage.setItem(key, '1');
            } catch {}
            setShow(false);
          }}
          className="absolute right-2 grid h-8 w-8 place-items-center text-night/70 hover:text-night"
        >
          ✕
        </button>
      )}
    </div>
  );
}
