import Preloader from '@/components/Preloader';
import { getSiteContent } from '@/lib/cms';
import { getPage } from '@/lib/pages';
import { Interleave } from '@/components/blocks/PageBlocks';
import type { Block } from '@/lib/blocks/schema';
import type { Locale } from '@/lib/i18n/config';


export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [{ settings }, page] = await Promise.all([getSiteContent(locale as Locale), getPage('home')]);
  // The page builder's layout; before it exists (or offline), the section order from settings.
  const blocks: Block[] =
    page?.blocks ?? settings.home.sections.map((s) => ({ id: `m-${s.id}`, type: 'module', hidden: !s.visible, props: { module: s.id } }));

  return (
    <>
      <Preloader enabled={settings.intro.enabled} languageGate={settings.intro.languageGate} />
      <Interleave blocks={blocks} modules={{}} />
    </>
  );
}
