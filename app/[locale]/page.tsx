import type { ReactNode } from 'react';
import Preloader from '@/components/Preloader';
import Hero from '@/components/home/Hero';
import Welcome from '@/components/home/Welcome';
import ExteriorReel from '@/components/home/ExteriorReel';
import InteriorRooms from '@/components/home/InteriorRooms';
import Services from '@/components/home/Services';
import Story from '@/components/home/Story';
import Experience from '@/components/home/Experience';
import ContactSection from '@/components/home/ContactSection';
import { getSiteContent } from '@/lib/cms';
import { getPage } from '@/lib/pages';
import { Interleave } from '@/components/blocks/PageBlocks';
import type { Block } from '@/lib/blocks/schema';
import type { Locale } from '@/lib/i18n/config';

/** Home sections by id — their order and visibility are set in the control panel. */
const SECTIONS: Record<string, () => ReactNode> = {
  hero: () => <Hero />,
  welcome: () => <Welcome />,
  exteriors: () => <ExteriorReel />,
  interiors: () => <InteriorRooms />,
  services: () => <Services />,
  story: () => <Story />,
  experience: () => <Experience />,
  contact: () => <ContactSection />,
};

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [{ settings }, page] = await Promise.all([getSiteContent(locale as Locale), getPage('home')]);
  // The page builder's layout; before it exists (or offline), the section order from settings.
  const blocks: Block[] =
    page?.blocks ?? settings.home.sections.map((s) => ({ id: `m-${s.id}`, type: 'module', hidden: !s.visible, props: { module: s.id } }));
  const used = new Set(blocks.filter((b) => b.type === 'module' && !b.hidden).map((b) => String(b.props.module)));
  const modules = Object.fromEntries(Object.entries(SECTIONS).filter(([id]) => used.has(id)).map(([id, render]) => [id, render()]));

  return (
    <>
      <Preloader enabled={settings.intro.enabled} languageGate={settings.intro.languageGate} />
      <Interleave blocks={blocks} modules={modules} />
    </>
  );
}
