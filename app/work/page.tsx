import type { Metadata } from 'next';
import { Suspense } from 'react';
import WorkIndex from '@/components/work/WorkIndex';
import { projects } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Work',
  description: `Architectural and interior visualization by VARI Studio — ${projects.length} projects across exteriors and interiors.`,
  alternates: { canonical: '/work' },
};

export default function WorkPage() {
  return (
    <div className="wrap pb-32 pt-[calc(var(--header-h)+8vh)]">
      <p className="label text-gold">Portfolio</p>
      <h1 className="display h-hero mt-6">
        Selected <span className="display-italic text-gold">work</span>
      </h1>
      <p className="mt-8 max-w-xl text-bone/70">
        Exteriors With Nature Connect, and Interiors With Soul Connect — every project visualized by VARI Studio.
      </p>
      <div className="mt-16">
        <Suspense>
          <WorkIndex />
        </Suspense>
      </div>
    </div>
  );
}
