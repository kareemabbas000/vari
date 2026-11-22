import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import NoAccess from '@/components/admin/NoAccess';
import { currentMember } from '@/lib/supabase/server';
import { toLanguage } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

/** Every panel page: signed in (middleware) + invited team member (profile) — else no access. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const member = await currentMember();
  if (!member) redirect('/admin/login');
  if (!member.profile) return <NoAccess email={member.user.email ?? ''} />;

  // Two head-only counts (no rows transferred) for the inbox badges.
  const [{ count }, consultations, langs] = await Promise.all([
    member.supabase.from('contact_submissions').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    member.supabase.from('consultation_requests').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    member.supabase.from('languages').select('*').order('sort'),
  ]);
  const languages = (langs.data ?? []).map(toLanguage);
  return (
    <AdminShell member={{ email: member.profile.email, name: member.profile.full_name, role: member.profile.role }} newEnquiries={count ?? 0} newConsultations={consultations.count ?? 0} languages={languages}>
      {children}
    </AdminShell>
  );
}
