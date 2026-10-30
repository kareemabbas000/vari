'use client';

import Image from 'next/image';
import ContactForm from '../ContactForm';
import { useI18n } from '../I18nProvider';

/** Mirrors the original closing section: details on a render, the enquiry form beside it. */
export default function ContactSection() {
  const { t, projects, settings } = useI18n();
  const contact = settings.contact;
  // The home-office render, or the first interior if it has been removed in the panel.
  const office = (projects.find((p) => p.slug === 'sophisticated-home-office') ?? projects.find((p) => p.category === 'interior') ?? projects[0]).media[0];
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative grid min-h-[100svh] md:grid-cols-2">
      <div className="relative min-h-[60svh] overflow-hidden">
        <Image src={office.id} alt={office.alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        <div className="absolute inset-0 bg-night/55" />
        <div className="relative flex h-full flex-col justify-end p-[var(--gutter)] pb-14">
          <div className="max-w-md border border-gold/60 bg-night/60 p-8 backdrop-blur-md md:p-10">
            <h2 className="display text-3xl md:text-4xl">{t.contact.title}</h2>
            <p className="mt-6 text-bone/80">{contact.address}</p>
            <a href={`mailto:${contact.marketingEmail}`} className="link-line mt-3 inline-block text-gold">
              {contact.marketingEmail}
            </a>
            <div className="mt-8 flex gap-6">
              {contact.social.map((s) => (
                <a key={s.href} href={s.href} target="_blank" rel="noreferrer noopener" className="label link-line text-bone/80 hover:text-gold">
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center bg-ink px-[var(--gutter)] py-20 md:px-16">
        <p className="label text-gold">{t.contact.chapter}</p>
        <h2 id="contact-title" className="display h-lg mt-6 max-w-[14ch]">
          {t.contact.unlockA} <span className="display-italic text-gold">{t.contact.unlockItalic}</span>
          {t.contact.unlockB}
        </h2>
        <p className="mt-6 max-w-md text-bone/70">{t.contact.body}</p>
        <div className="mt-12">
          <ContactForm compact />
        </div>
      </div>
    </section>
  );
}
