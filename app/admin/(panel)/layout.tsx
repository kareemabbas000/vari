import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import NoAccess from '@/components/admin/NoAccess';
import { currentMember } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Every panel page: signed in (middleware) + invited team member (profile) — else no access. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const member = await currentMember();
  if (!member) redirect('/admin/login');
  if (!member.profile) return <NoAccess email={member.user.email ?? ''} />;

  const { count } = await member.supabase.from('contact_submissions').select('id', { count: 'exact', head: true }).eq('status', 'new');
  return (
    <AdminShell member={{ email: member.profile.email, name: member.profile.full_name, role: member.profile.role }} newEnquiries={count ?? 0}>
      {children}
    </AdminShell>
  );
}
