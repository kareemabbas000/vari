import Preloader from '@/components/Preloader';
import Hero from '@/components/home/Hero';
import Welcome from '@/components/home/Welcome';
import ExteriorReel from '@/components/home/ExteriorReel';
import InteriorRooms from '@/components/home/InteriorRooms';
import Services from '@/components/home/Services';
import Story from '@/components/home/Story';
import Experience from '@/components/home/Experience';
import ContactSection from '@/components/home/ContactSection';

export default function Home() {
  return (
    <>
      <Preloader />
      <Hero />
      <Welcome />
      <ExteriorReel />
      <InteriorRooms />
      <Services />
      <Story />
      <Experience />
      <ContactSection />
    </>
  );
}
