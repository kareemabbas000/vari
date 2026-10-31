import type { Metadata } from 'next';
import Preview from './Preview';

/** Live canvas of the page builder (inside the panel's iframe). Never indexed. */
export const metadata: Metadata = { title: 'Preview', robots: { index: false, follow: false } };

export default function BuilderPreviewPage() {
  return <Preview />;
}
