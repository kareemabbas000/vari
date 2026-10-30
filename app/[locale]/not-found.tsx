'use client';

import Link from 'next/link';
import { useI18n } from '@/components/I18nProvider';

export default function NotFound() {
  const { t, href } = useI18n();
  return (
    <section className="wrap flex min-h-[100svh] flex-col items-start justify-center pt-[var(--header-h)]">
      <p className="label text-gold">404</p>
      <h1 className="display h-xl mt-6 max-w-[14ch]">
        {t.notFound.a} <span className="display-italic text-gold">{t.notFound.italic}</span>
        {t.notFound.b}
      </h1>
      <Link href={href('/')} className="btn mt-12">
        <span>{t.notFound.home}</span>
      </Link>
    </section>
  );
}
