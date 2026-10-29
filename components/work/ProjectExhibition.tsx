'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import type { Project } from '@/lib/content';

/**
 * A single project, staged like an exhibition room:
 * the render arrives full-bleed, settles into its frame, then the visitor walks
 * up to it — details are magnified views of the same render.
 */
export default function ProjectExhibition({ project, prev, next, index, total }: { project: Project; prev: Project; next: Project; index: number; total: number }) {
  const root = useRef<HTMLDivElement>(null);
  const hero = project.media[0];
  const landscape = hero.width >= hero.height;

  useEffect(() => {
    const el = root.current!;
    const mm = gsap.matchMedia(el);
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.fromTo('[data-hero-frame]', { clipPath: 'inset(12% 12% 12% 12%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut' })
        .fromTo('[data-hero-img]', { scale: 1.3 }, { scale: 1, duration: 2.2 }, 0)
        .fromTo('[data-title] .line-inner', { yPercent: 110 }, { yPercent: 0, duration: 1.4, stagger: 0.06 }, 0.6)
        .fromTo('[data-meta]', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.08, duration: 1 }, 0.9);

      gsap.to('[data-hero-img]', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '[data-hero-frame]', start: 'top top', end: 'bottom top', scrub: true } });

      gsap.utils.toArray<HTMLElement>('[data-detail]').forEach((d) => {
        gsap.fromTo(d, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, scrollTrigger: { trigger: d, start: 'top 85%', once: true } });
        const img = d.querySelector('img');
        if (img) gsap.fromTo(img, { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: d, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      gsap.fromTo('[data-para]', { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.12, duration: 1.2, scrollTrigger: { trigger: '[data-text]', start: 'top 80%', once: true } });
    });
    return () => mm.revert();
  }, [project.slug]);

  // Details: for single-image projects, magnified regions of the same render.
  const details =
    project.media.length > 1
      ? project.media.slice(1).map((m) => ({ m, pos: '50% 50%', zoom: 1 }))
      : [
          { m: hero, pos: '22% 35%', zoom: 1.9 },
          { m: hero, pos: '78% 62%', zoom: 2.2 },
        ];

  const facts = [
    { k: 'Discipline', v: `${project.discipline} visualization` },
    { k: 'Project', v: project.label },
    project.location ? { k: 'Location', v: project.location } : null,
    project.client ? { k: 'Client', v: project.client } : null,
    { k: 'Visualized by', v: 'VARI Studio' },
  ].filter(Boolean) as { k: string; v: string }[];

  return (
    <div ref={root}>
      {/* Arrival */}
      <section className="relative h-[100svh] min-h-[560px] overflow-hidden">
        <div data-hero-frame className="absolute inset-0 overflow-hidden">
          <div data-hero-img className="absolute inset-0">
            <Image src={hero.id} alt={hero.alt} fill priority sizes="100vw" className="object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-night via-night/30 to-night/40" />
        </div>
        <div className="wrap relative flex h-full flex-col justify-end pb-12 md:pb-16">
          <p data-meta className="label text-gold">
            {project.discipline} · {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </p>
          <h1 data-title className="display h-hero mt-5 max-w-[16ch]" aria-label={project.title}>
            {project.title.split(' ').map((w, i) => (
              <span key={i} className="line-mask mr-[0.22em] inline-block align-top" aria-hidden>
                <span className="line-inner">{w}</span>
              </span>
            ))}
          </h1>
          {project.location && (
            <p data-meta className="display-italic mt-4 text-2xl text-bone/80 md:text-3xl">
              {project.location}
            </p>
          )}
        </div>
      </section>

      {/* Statement */}
      <section className="wrap grid gap-14 py-24 md:grid-cols-12 md:py-36">
        <dl className="grid content-start gap-6 md:col-span-4">
          {facts.map((f) => (
            <div key={f.k} data-meta className="border-t border-bone/10 pt-4">
              <dt className="label text-bone/40">{f.k}</dt>
              <dd className="mt-2 text-lg">{f.v}</dd>
            </div>
          ))}
        </dl>
        <div data-text className="md:col-span-7 md:col-start-6">
          {project.description.map((d, i) => (
            <p key={i} data-para className={`${i === 0 ? 'display text-[clamp(1.6rem,2.8vw,2.6rem)] leading-[1.25]' : 'body-lg mt-8 text-bone/70'}`}>
              {d}
            </p>
          ))}
        </div>
      </section>

      {/* The full render, framed */}
      <section className="wrap pb-24 md:pb-36">
        <figure className={`frame grain mx-auto ${landscape ? 'w-full' : 'max-w-[900px]'}`} style={{ aspectRatio: `${hero.width} / ${hero.height}` }}>
          <Image src={hero.id} alt={hero.alt} fill sizes="(max-width: 1600px) 100vw, 1600px" className="object-contain" />
        </figure>
        <p className="label mt-4 text-center text-bone/40">{project.title} — full render</p>
      </section>

      {/* Details / additional views */}
      <section className="wrap grid gap-6 pb-28 md:grid-cols-2 md:gap-8 md:pb-40" aria-label={project.media.length > 1 ? 'Additional views' : 'Details'}>
        {details.map((d, i) => (
          <figure key={i} data-detail className={`frame ${i % 2 === 1 ? 'md:mt-32' : ''} aspect-[4/5]`}>
            <Image
              src={d.m.id}
              alt={d.m.alt + (d.zoom > 1 ? ' — detail' : '')}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              style={{ objectPosition: d.pos, transformOrigin: d.pos, scale: d.zoom > 1 ? `${d.zoom}` : undefined }}
            />
          </figure>
        ))}
      </section>

      {/* Next room */}
      <nav aria-label="More projects" className="border-t border-gold/15">
        <Link href={`/work/${next.slug}`} className="group relative block h-[70svh] overflow-hidden">
          <Image src={next.media[0].id} alt="" fill sizes="100vw" className="object-cover opacity-50 transition-[transform,opacity] duration-[1.6s] ease-expo group-hover:scale-105 group-hover:opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-night via-night/40 to-transparent" />
          <div className="wrap relative flex h-full flex-col justify-end pb-14">
            <p className="label text-gold">Next room</p>
            <p className="display h-xl mt-4 transition-transform duration-1000 ease-expo group-hover:translate-x-4">{next.title}</p>
          </div>
        </Link>
        <div className="wrap flex justify-between py-8">
          <Link href={`/work/${prev.slug}`} className="label link-line text-bone/70">
            ← {prev.title}
          </Link>
          <Link href="/work" className="label link-line text-gold">
            All work
          </Link>
        </div>
      </nav>
    </div>
  );
}
