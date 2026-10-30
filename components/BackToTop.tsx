'use client';

import { useLenis } from './SmoothScroll';
import { useI18n } from './I18nProvider';

export default function BackToTop() {
  const lenis = useLenis();
  const { t } = useI18n();
  return (
    <button
      type="button"
      className="label flex items-center gap-3 text-gold"
      onClick={() => (lenis ? lenis.scrollTo(0, { duration: 2 }) : window.scrollTo({ top: 0, behavior: 'smooth' }))}
    >
      {t.common.goUp}
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden fill="none" stroke="currentColor">
        <path d="M6 11V1M1 6l5-5 5 5" />
      </svg>
    </button>
  );
}
