'use client';

import dynamic from 'next/dynamic';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * The free 30-minute project call. Any button on the site can open it (useConsult().open); the
 * form appears over the page, so the visitor never leaves what they were reading. The form's
 * code loads only when someone shows interest (hover, the reminder appearing, or the click), so
 * pages stay as light as before.
 */
export type ProjectType = 'interior' | 'visualization' | 'architecture' | 'unsure';
export type ConsultOpen = { trigger: string; title?: string; projectType?: ProjectType };

const loadDialog = () => import('./ConsultDialog');
const ConsultDialog = dynamic(loadDialog, { ssr: false });

const Ctx = createContext<{ open: (o: ConsultOpen) => void; preload: () => void; isOpen: boolean }>({ open: () => {}, preload: () => {}, isOpen: false });
export const useConsult = () => useContext(Ctx);

const HASH = '#free-call';

export default function ConsultProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ConsultOpen | null>(null);
  const pushed = useRef(false);
  const preload = useCallback(() => {
    loadDialog().catch(() => {});
  }, []);

  const open = useCallback((o: ConsultOpen) => {
    setCurrent(o);
    // A history entry for the open form: the phone's back button closes it instead of leaving
    // the article. The address stays the same page (only #free-call is added).
    if (!pushed.current && typeof window !== 'undefined') {
      try {
        history.pushState({ consult: true }, '', `${location.pathname}${location.search}${HASH}`);
        pushed.current = true;
      } catch {}
    }
  }, []);

  const close = useCallback(() => {
    setCurrent(null);
    if (pushed.current) {
      pushed.current = false;
      if (location.hash === HASH) history.back();
    }
  }, []);

  useEffect(() => {
    const onPop = () => {
      if (pushed.current && location.hash !== HASH) {
        pushed.current = false;
        setCurrent(null);
      }
    };
    window.addEventListener('popstate', onPop);
    // A shared or reloaded #free-call link opens the form.
    if (location.hash === HASH) {
      history.replaceState(null, '', `${location.pathname}${location.search}`);
      setCurrent({ trigger: 'link' });
    }
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <Ctx.Provider value={{ open, preload, isOpen: !!current }}>
      {children}
      {current && <ConsultDialog {...current} onClose={close} />}
    </Ctx.Provider>
  );
}
