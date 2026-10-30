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
  const { settings } = await getSiteContent(locale as Locale);
  const order = settings.home.sections.filter((s) => s.visible && SECTIONS[s.id]);

  return (
    <>
      <Preloader enabled={settings.intro.enabled} languageGate={settings.intro.languageGate} />
      {order.map((s) => (
        <div key={s.id} className="contents">
          {SECTIONS[s.id]()}
        </div>
      ))}
    </>
  );
}
