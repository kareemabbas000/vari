import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import RevealText from '@/components/RevealText';
import Services from '@/components/home/Services';
import { copy, getProject, services } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Services',
  description: `${copy.servicesTitle}. ${services.map((s) => s.title).join(', ')}.`,
  alternates: { canonical: '/services' },
};

const proofs = ['black-home', 'elysian-aura', 'hne-laboratory'].map((s) => getProject(s)!);

export default function ServicesPage() {
  return (
    <>
      <section className="wrap pb-16 pt-[calc(var(--header-h)+12vh)] md:pb-24">
        <p className="label text-gold">Services</p>
        <RevealText as="h1" trigger="mount" text={copy.experienceTitle} className="display h-xl mt-6 max-w-[16ch]" italic={['Exceptional']} />
        <p className="body-lg mt-10 max-w-2xl text-bone/75">
          {services.length} disciplines, one studio — from the first 2D line to the final walk-through. Choose a sheet to see how the model
          changes with each service.
        </p>
      </section>

      <Services standalone />

      <section className="wrap py-24 md:py-36">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 className="display h-lg max-w-[16ch]">
            Seen in <span className="display-italic text-gold">the work</span>
          </h2>
          <Link href="/work" className="label link-line self-start text-gold md:self-auto">
            All projects →
          </Link>
        </div>
        <ul className="grid gap-6 md:grid-cols-3">
          {proofs.map((p) => (
            <li key={p.slug}>
              <Link href={`/work/${p.slug}`} className="group block">
                <div className="frame aspect-[4/5]">
                  <Image src={p.media[0].id} alt={p.media[0].alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-[1.6s] ease-expo group-hover:scale-105" />
                </div>
                <p className="label mt-4 text-gold">{p.discipline}{p.location ? ` · ${p.location}` : ''}</p>
                <h3 className="display mt-2 text-2xl">{p.title}</h3>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="wrap border-t border-gold/15 py-24 text-center md:py-32">
        <p className="label text-gold">{copy.contact.cta}</p>
        <h2 className="display h-xl mx-auto mt-6 max-w-[18ch]">{copy.contact.title}</h2>
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Link href="/contact?intent=design" className="btn btn-solid">
            <span>{copy.hero.ctaDesign}</span>
          </Link>
          <Link href="/contact?intent=visualize" className="btn">
            <span>{copy.hero.ctaVisualize}</span>
          </Link>
        </div>
      </section>
    </>
  );
}
