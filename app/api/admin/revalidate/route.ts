import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { CMS_TAG } from '@/lib/cms';
import { currentMember, roleAtLeast } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Publish: refresh every cached page that reads CMS content (editors and above). */
export async function POST() {
  const member = await currentMember();
  if (!member?.profile || !roleAtLeast(member.profile.role, 'editor')) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  revalidateTag(CMS_TAG);
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
