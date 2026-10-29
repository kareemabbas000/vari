import type { Metadata } from 'next';
import Logo from '@/components/Logo';
import Link from 'next/link';
import RevealText from '@/components/RevealText';
import Story from '@/components/home/Story';
import { copy, services } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Our Concept',
  description: copy.pillars[0].body,
  alternates: { canonical: '/studio' },
};

export default function StudioPage() {
  return (
    <>
      <section className="wrap grid min-h-[100svh] items-end gap-12 pb-20 pt-[calc(var(--header-h)+10vh)] md:grid-cols-12">
        <div className="md:col-span-8">
          <p className="label text-gold">Our Concept</p>
          <RevealText as="h1" trigger="mount" text={copy.pillars[0].title} className="display h-xl mt-6 max-w-[16ch]" italic={['Vision', 'Imagination']} />
          <p className="body-lg mt-10 max-w-2xl text-bone/75">{copy.pillars[0].body}</p>
        </div>
        <div className="blueprint relative mx-auto flex aspect-square w-full max-w-[380px] items-center justify-center border border-gold/25 md:col-span-4">
          <span aria-hidden className="absolute left-3 top-3 h-4 w-4 border-l border-t border-gold/70" />
          <span aria-hidden className="absolute right-3 top-3 h-4 w-4 border-r border-t border-gold/70" />
          <span aria-hidden className="absolute bottom-3 left-3 h-4 w-4 border-b border-l border-gold/70" />
          <span aria-hidden className="absolute bottom-3 right-3 h-4 w-4 border-b border-r border-gold/70" />
          <Logo className="h-auto w-[72%]" priority sizes="280px" />
          <span className="label absolute bottom-6 text-[0.6rem] text-gold/70">VARI Design Studio · Cairo</span>
        </div>
      </section>

      <Story />

      <section className="blueprint border-y border-gold/10 py-28">
        <div className="wrap">
          <h2 className="display h-lg max-w-[18ch]">{copy.servicesTitle}</h2>
          <ul className="mt-16 grid gap-px bg-bone/10 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s, i) => (
              <li key={s.title} className="bg-night p-8">
                <span className="label text-gold">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="display mt-6 text-2xl">{s.title}</h3>
                <p className="mt-4 text-bone/65">{s.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wrap py-32 text-center">
        <p className="label text-gold">{copy.contact.cta}</p>
        <h2 className="display h-xl mx-auto mt-6 max-w-[18ch]">{copy.contact.title}</h2>
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Link href="/contact" className="btn btn-solid">
            <span>{copy.hero.ctaDesign}</span>
          </Link>
          <Link href="/work" className="btn">
            <span>View the work</span>
          </Link>
        </div>
      </section>
    </>
  );
}
