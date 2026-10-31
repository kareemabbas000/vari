import type { ReactNode } from 'react';
import BlockRenderer from './Blocks';
import { getPage } from '@/lib/pages';
import type { Block } from '@/lib/blocks/schema';

/**
 * A system page's layout from the builder: runs of custom blocks interleaved with the
 * page's built-in sections. `modules` maps a module name to its server-rendered section;
 * `children` is the page's original content (the "page" module).
 */
export async function PageBlocks({ slug, modules = {}, children }: { slug: string; modules?: Record<string, ReactNode>; children?: ReactNode }) {
  const page = await getPage(slug);
  return <Interleave blocks={page?.blocks ?? null} modules={{ ...modules, page: children }} />;
}

export function Interleave({ blocks, modules }: { blocks: Block[] | null; modules: Record<string, ReactNode> }) {
  // No builder data (or the database is unreachable): the original page.
  if (!blocks) return <>{modules.page ?? Object.values(modules)}</>;
  const visible = blocks.filter((b) => !b.hidden);
  // The original content can be moved but never lost.
  if (modules.page !== undefined && !visible.some((b) => b.type === 'module' && b.props?.module === 'page')) {
    visible.unshift({ id: 'm-page', type: 'module', props: { module: 'page' } });
  }
  const out: ReactNode[] = [];
  let run: Block[] = [];
  const flush = () => {
    if (run.length) out.push(<BlockRenderer key={`run-${run[0].id}`} blocks={run} />);
    run = [];
  };
  for (const b of visible) {
    if (b.type === 'module') {
      flush();
      const node = modules[String(b.props?.module)];
      if (node !== undefined) out.push(<div key={b.id} className="contents">{node}</div>);
    } else run.push(b);
  }
  flush();
  return <>{out}</>;
}
