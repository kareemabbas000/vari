'use client';

import { PageHeader } from '@/components/admin/ui';
import MediaLibrary from '@/components/admin/MediaLibrary';

export default function MediaPage() {
  return (
    <>
      <PageHeader eyebrow="Content" title="Media library" description="Every image on the website. Add alt texts in all three languages — they help SEO and visitors using screen readers." />
      <MediaLibrary />
    </>
  );
}
