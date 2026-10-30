'use client';

import { useEffect, useState } from 'react';

export type Tier = 'high' | 'low' | 'none';

/**
 * Decides how much real-time 3D a device should get.
 * - none: no WebGL or the visitor prefers reduced motion → static compositions
 * - low:  phones / few cores / little memory / save-data → lighter scene, capped DPR
 *         (hardware hints never disable 3D on their own)
 * - high: everything else
 */
export function detectTier(): Tier {
  if (typeof window === 'undefined') return 'none';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'none';

  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return 'none';
  } catch {
    return 'none';
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  const cores = nav.hardwareConcurrency || 4;
  const memory = nav.deviceMemory || 4;
  const saveData = !!nav.connection?.saveData;
  const small = window.matchMedia('(max-width: 767px)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  // Hardware hints only ever lighten the scene; they never switch 3D off. Browsers report
  // these values inconsistently (capped, rounded or missing), so treating them as a hard
  // gate wrongly sent capable desktops to the static fallback.
  if (saveData || small || coarse || cores <= 4 || memory <= 4) return 'low';
  return 'high';
}

export function useDeviceTier() {
  const [tier, setTier] = useState<Tier | null>(null);
  useEffect(() => setTier(detectTier()), []);
  return tier;
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

export function useIsMobile(query = '(max-width: 767px)') {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setM(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return m;
}
