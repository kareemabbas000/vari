import type { ReactNode } from 'react';
import Hero from '@/components/home/Hero';
import Welcome from '@/components/home/Welcome';
import ExteriorReel from '@/components/home/ExteriorReel';
import InteriorRooms from '@/components/home/InteriorRooms';
import Services from '@/components/home/Services';
import Story from '@/components/home/Story';
import Experience from '@/components/home/Experience';
import ContactSection from '@/components/home/ContactSection';

/**
 * The site's signature sections. Each can be placed on any page from the page builder
 * (as a "module" block); their texts live under Texts & translations.
 */
export const MODULE_RENDER: Record<string, () => ReactNode> = {
  hero: () => <Hero />,
  welcome: () => <Welcome />,
  exteriors: () => <ExteriorReel />,
  interiors: () => <InteriorRooms />,
  services: () => <Services />,
  story: () => <Story />,
  experience: () => <Experience />,
  contact: () => <ContactSection />,
};
