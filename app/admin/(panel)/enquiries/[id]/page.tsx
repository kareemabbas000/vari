'use client';

import { getDictionary } from '@/lib/i18n';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Badge, Button, Card, ConfirmDialog, Field, LinkButton, PageHeader, Select, Spinner, Textarea, useToast } from '@/components/admin/ui';
import { formatDate, must, useLoad } from '@/components/admin/hooks';
import { useMember } from '@/components/admin/AdminShell';
import type { Database } from '@/lib/database.types';

type Status = Database['public']['Enums']['enquiry_status'];
const STATUSES: Status[] = ['new', 'read', 'replied', 'archived', 'spam'];

export default function EnquiryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { can } = useMember();
  const db = supabaseBrowser();
  const { data: e, setData, loading, error } = useLoad(async () => must(await db.from('contact_submissions').select('id,created_at,first_name,last_name,email,message,intent,locale,status,notes,source_path').eq('id', id).single()), [id]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!e) return;
    setNotes(e.notes ?? '');
    // Opening a new enquiry marks it as read.
    if (e.status === 'new' && can('editor')) {
      db.from('contact_submissions')
        .update({ status: 'read' })
        .eq('id', e.id)
        .then(({ error: err }) => !err && setData({ ...e, status: 'read' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e?.id]);

  async function save(patch: { status?: Status; notes?: string }) {
    if (!e) return;
    setSaving(true);
    const { error: err } = await db.from('contact_submissions').update(patch).eq('id', e.id);
    setSaving(false);
    if (err) return toast('error', err.message);
    setData({ ...e, ...patch });
    toast('success', 'Saved.');
  }

  async function remove() {
    if (!e) return;
    const { error: err } = await db.from('contact_submissions').delete().eq('id', e.id);
    if (err) return toast('error', err.message);
    toast('success', 'Enquiry deleted.');
    router.replace('/admin/enquiries');
  }

  if (loading) return <Spinner />;
  if (error || !e) return <p className="text-[#E8A598]">{error || 'Not found.'}</p>;

  const name = [e.first_name, e.last_name].filter(Boolean).join(' ');
  const mailto = `mailto:${e.email}?subject=${encodeURIComponent(getDictionary(e.locale).emails.replySubject)}&body=${encodeURIComponent(`\n\n— \n> ${(e.message || '').replace(/\n/g, '\n> ')}`)}`;

  return (
    <>
      <Link href="/admin/enquiries" className="mb-4 inline-block text-sm text-bone/50 hover:text-gold">
        ← Enquiries
      </Link>
      <PageHeader
        title={name || e.email}
        description={`${formatDate(e.created_at, true)} · ${e.locale.toUpperCase()} · ${e.intent}`}
        actions={
          <>
            <LinkButton href={mailto} variant="primary">
              Reply by email
            </LinkButton>
            {can('editor') && e.status !== 'replied' && (
              <Button variant="secondary" onClick={() => save({ status: 'replied' })} busy={saving}>
                Mark replied
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Message" className="lg:col-span-2">
          <p className="whitespace-pre-wrap text-[0.98rem] leading-relaxed text-bone/85">{e.message || '(no message)'}</p>
        </Card>

        <div className="space-y-6">
          <Card title="Details">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-bone/45">Email</dt>
                <dd>
                  <a href={`mailto:${e.email}`} className="break-all text-gold hover:underline">
                    {e.email}
                  </a>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-bone/45">Status</dt>
                <dd>
                  <Badge tone={e.status === 'new' ? 'gold' : e.status === 'replied' ? 'green' : e.status === 'spam' ? 'red' : 'grey'}>{e.status}</Badge>
                </dd>
              </div>
              {e.source_path && (
                <div>
                  <dt className="text-bone/45">Sent from</dt>
                  <dd className="break-all text-bone/70">{e.source_path}</dd>
                </div>
              )}
            </dl>
          </Card>

          {can('editor') && (
            <Card title="Handling">
              <div className="space-y-4">
                <Field label="Status" htmlFor="status">
                  <Select id="status" value={e.status} onChange={(ev) => save({ status: ev.target.value as Status })}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Internal notes" htmlFor="notes" hint="Only visible to the team.">
                  <Textarea id="notes" value={notes} onChange={(ev) => setNotes(ev.target.value)} maxLength={4000} rows={4} />
                </Field>
                <Button variant="secondary" size="sm" onClick={() => save({ notes })} busy={saving} disabled={notes === (e.notes ?? '')}>
                  Save notes
                </Button>
              </div>
            </Card>
          )}

          {can('admin') && (
            <Button variant="danger" className="w-full" onClick={() => setConfirm(true)}>
              Delete enquiry
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        title="Delete this enquiry?"
        body="It is removed from the database permanently. Use this for spam or when the sender asks for their data to be erased."
        confirmLabel="Delete permanently"
        onConfirm={remove}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}
