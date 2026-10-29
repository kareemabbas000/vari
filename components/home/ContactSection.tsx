import Image from 'next/image';
import ContactForm from '../ContactForm';
import { contact, copy, getProject } from '@/lib/content';

const office = getProject('sophisticated-home-office')!.media[0];

/** Mirrors the original closing section: details on a render, the enquiry form beside it. */
export default function ContactSection() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative grid min-h-[100svh] md:grid-cols-2">
      <div className="relative min-h-[60svh] overflow-hidden">
        <Image src={office.id} alt={office.alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        <div className="absolute inset-0 bg-night/55" />
        <div className="relative flex h-full flex-col justify-end p-[var(--gutter)] pb-14">
          <div className="max-w-md border border-gold/60 bg-night/60 p-8 backdrop-blur-md md:p-10">
            <h2 className="display text-3xl md:text-4xl">{copy.contact.title}</h2>
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
        <p className="label text-gold">Chapter IV — Contact</p>
        <h2 id="contact-title" className="display h-lg mt-6 max-w-[12ch]">
          Unlock Your <span className="display-italic text-gold">Dream Space</span> Today
        </h2>
        <p className="mt-6 max-w-md text-bone/70">{copy.contact.body}</p>
        <div className="mt-12">
          <ContactForm compact />
        </div>
      </div>
    </section>
  );
}
