import type { Metadata } from 'next';
import Link from 'next/link';
import { currentMember, roleAtLeast } from '@/lib/supabase/server';
import { Badge, Card, EmptyState, LinkButton, PageHeader } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Dashboard' };

type I18n = Record<string, string | undefined>;
const missing = (v: unknown) => {
  const o = (v || {}) as I18n;
  return !!o.en && (!o.de?.trim() || !o.es?.trim());
};

function Stat({ label, value, href, tone }: { label: string; value: number | string; href?: string; tone?: 'gold' }) {
  const body = (
    <div className={`rounded-sm border p-4 transition-colors sm:p-5 ${tone === 'gold' ? 'border-gold/30 bg-gold/5 hover:border-gold' : 'border-bone/10 bg-[#141312] hover:border-bone/25'}`}>
      <p className="font-sans text-[0.68rem] uppercase tracking-[0.18em] text-bone/50">{label}</p>
      <p className={`mt-2 font-display text-[2.2rem] leading-none ${tone === 'gold' ? 'text-gold' : 'text-bone'}`}>{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function DashboardPage() {
  const member = (await currentMember())!;
  const db = member.supabase;
  const canEdit = roleAtLeast(member.profile?.role, 'editor');

  const [newEnq, subs, projects, recent] = await Promise.all([
    db.from('contact_submissions').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    db.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
    db.from('projects').select('id,slug,title,description,published'),
    db.from('contact_submissions').select('id,created_at,first_name,last_name,email,intent,locale,status,message').order('created_at', { ascending: false }).limit(5),
  ]);

  const list = projects.data ?? [];
  const published = list.filter((p) => p.published).length;
  const drafts = list.length - published;
  const needsTranslation = list.filter((p) => missing(p.title) || missing(p.description)).length;
  const name = member.profile?.full_name?.split(' ')[0];

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={name ? `Hello, ${name}` : 'Welcome'}
        description="Everything on the VARI Studio website is managed from here — in English, German and Spanish."
        actions={
          canEdit ? (
            <>
              <LinkButton href="/admin/projects/new" variant="primary">
                New project
              </LinkButton>
              <LinkButton href="/admin/texts">Edit texts</LinkButton>
            </>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="New enquiries" value={newEnq.count ?? 0} href="/admin/enquiries" tone={(newEnq.count ?? 0) > 0 ? 'gold' : undefined} />
        <Stat label="Subscribers" value={subs.count ?? 0} href="/admin/subscribers" />
        <Stat label="Published projects" value={published} href="/admin/projects" />
        <Stat label="Need translation" value={needsTranslation} href="/admin/projects?filter=translation" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Latest enquiries" className="lg:col-span-2" actions={<Link href="/admin/enquiries" className="text-xs uppercase tracking-[0.14em] text-gold hover:underline">All</Link>}>
          {recent.data?.length ? (
            <ul className="-my-2 divide-y divide-bone/10">
              {recent.data.map((e) => (
                <li key={e.id}>
                  <Link href={`/admin/enquiries/${e.id}`} className="flex items-start justify-between gap-4 py-3 hover:text-gold">
                    <div className="min-w-0">
                      <p className="truncate text-[0.95rem]">{[e.first_name, e.last_name].filter(Boolean).join(' ') || e.email}</p>
                      <p className="mt-0.5 truncate text-sm text-bone/45">{e.message || e.email}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {e.status === 'new' ? <Badge tone="gold">New</Badge> : <Badge>{e.status}</Badge>}
                      <span className="text-xs text-bone/35">{new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No enquiries yet" body="Messages sent through the website's contact forms appear here." />
          )}
        </Card>

        <Card title="Website">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-bone/50">Projects</dt>
              <dd>{list.length}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-bone/50">Drafts (hidden)</dt>
              <dd>{drafts}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-bone/50">Languages</dt>
              <dd>EN · DE · ES</dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-col gap-2">
            <a href="/" target="_blank" rel="noreferrer" className="text-sm text-gold hover:underline">
              Open the website ↗
            </a>
            <Link href="/admin/home" className="text-sm text-bone/60 hover:text-bone">
              Arrange the home page →
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
