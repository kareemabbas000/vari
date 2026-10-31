'use client';

import { useParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Spinner } from '@/components/admin/ui';
import { must, useLoad } from '@/components/admin/hooks';
import Builder, { type PageRow } from '@/components/admin/builder/Builder';

export default function BuilderPage() {
  const { id } = useParams<{ id: string }>();
  const db = supabaseBrowser();
  const { data, loading, error, reload } = useLoad(
    async () => must(await db.from('pages').select('id,slug,kind,title,seo,blocks,draft,published,published_at,updated_at').eq('id', id).single()) as unknown as PageRow,
    [id],
  );
  if (loading) return <Spinner />;
  if (error || !data) return <p className="text-[#E8A598]">{error || 'Page not found.'}</p>;
  return <Builder key={data.updated_at} initial={data} onReload={reload} />;
}
