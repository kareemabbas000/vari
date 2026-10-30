import type { Metadata } from 'next';
import Link from 'next/link';
import { contact } from '@/lib/content';
import { isLocale, localizePath, type Locale } from '@/lib/i18n/config';
import { fmt, getDictionary } from '@/lib/i18n';

type Params = { locale: string };
type Search = { status?: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).newsletterStatus.title, robots: { index: false, follow: false } };
}

/** Landing page for the emailed confirm / unsubscribe links. */
export default async function NewsletterStatusPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Search> }) {
  const { locale } = await params;
  const { status } = await searchParams;
  const t = getDictionary(locale as Locale).newsletterStatus;
  const view =
    status === 'confirmed'
      ? { title: t.confirmedTitle, body: t.confirmedBody, ok: true }
      : status === 'unsubscribed'
        ? { title: t.unsubscribedTitle, body: t.unsubscribedBody, ok: true }
        : status === 'error'
          ? { title: t.errorTitle, body: fmt(t.errorBody, { email: contact.email }), ok: false }
          : { title: t.invalidTitle, body: t.invalidBody, ok: false };

  return (
    <section className="wrap flex min-h-[100svh] flex-col items-start justify-center pb-20 pt-[calc(var(--header-h)+6vh)]">
      <p className="label text-gold">{t.title}</p>
      <span aria-hidden className={`mt-8 flex h-14 w-14 items-center justify-center rounded-full border ${view.ok ? 'border-gold text-gold' : 'border-bone/30 text-bone/60'}`}>
        {view.ok ? (
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 10.5l4 4 8-9" /></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 5v6M10 14.5v.5" /></svg>
        )}
      </span>
      <h1 className="display h-lg mt-8 max-w-[18ch]">{view.title}</h1>
      <p className="body-lg mt-6 max-w-xl text-bone/70">{view.body}</p>
      <Link href={localizePath(locale as Locale, '/')} className="btn mt-12">
        <span>{t.home}</span>
      </Link>
    </section>
  );
}
