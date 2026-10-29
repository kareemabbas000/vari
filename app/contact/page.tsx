import type { Metadata } from 'next';
import Image from 'next/image';
import ContactForm from '@/components/ContactForm';
import { contact, copy, getProject } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: copy.contact.body,
  alternates: { canonical: '/contact' },
};

const still = getProject('elysian-aura')!.media[0];

export default function ContactPage() {
  return (
    <section className="relative min-h-[100svh] pt-[var(--header-h)]">
      <div className="absolute inset-0 -z-10">
        <Image src={still.id} alt="" fill priority sizes="100vw" className="object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-night/40 via-night/80 to-night" />
      </div>
      <div className="wrap grid gap-16 py-20 md:grid-cols-12 md:py-28">
        <div className="md:col-span-5">
          <p className="label text-gold">Contact Us</p>
          <h1 className="display h-xl mt-6">
            Begin Your <span className="display-italic text-gold">Exceptional</span> Design Journey Now
          </h1>
          <p className="body-lg mt-8 text-bone/75">{copy.contact.body}</p>

          <dl className="mt-14 space-y-8">
            <div>
              <dt className="label text-bone/40">Email</dt>
              <dd className="mt-2 space-y-1 text-lg">
                <a href={`mailto:${contact.email}`} className="link-line block w-fit text-gold">
                  {contact.email}
                </a>
                <a href={`mailto:${contact.marketingEmail}`} className="link-line block w-fit">
                  {contact.marketingEmail}
                </a>
              </dd>
            </div>
            <div>
              <dt className="label text-bone/40">Studio</dt>
              <dd className="mt-2 text-lg">{contact.address}</dd>
            </div>
            <div>
              <dt className="label text-bone/40">Social</dt>
              <dd className="mt-3 flex flex-wrap gap-6">
                {contact.social.map((s) => (
                  <a key={s.href} href={s.href} target="_blank" rel="noreferrer noopener" className="label link-line">
                    {s.label}
                  </a>
                ))}
              </dd>
            </div>
          </dl>
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <div className="border border-gold/30 bg-night/70 p-6 backdrop-blur-md sm:p-10">
            <h2 className="display text-3xl">{copy.contact.cta}</h2>
            <div className="mt-10">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
