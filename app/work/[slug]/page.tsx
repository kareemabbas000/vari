import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProjectExhibition from '@/components/work/ProjectExhibition';
import { adjacentProjects, getProject, projects } from '@/lib/content';
import { mediaUrl } from '@/lib/image-loader';

type Params = { slug: string };

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  const description = p.description.join(' ').slice(0, 300);
  return {
    title: p.title,
    description,
    alternates: { canonical: `/work/${p.slug}` },
    openGraph: { title: `${p.title} — VARI Studio`, description, images: [{ url: mediaUrl(p.media[0].id, 1200), alt: p.media[0].alt }] },
  };
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const { prev, next } = adjacentProjects(slug);
  return <ProjectExhibition project={project} prev={prev} next={next} index={projects.indexOf(project)} total={projects.length} />;
}
