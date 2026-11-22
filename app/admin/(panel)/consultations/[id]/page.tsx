'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { getDictionary } from '@/lib/i18n';
import { isLocale } from '@/lib/i18n/config';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Badge, Button, Card, ConfirmDialog, Field, Input, LinkButton, PageHeader, Select, Spinner, Textarea, useToast } from '@/components/admin/ui';
import { formatDate, must, useLoad } from '@/components/admin/hooks';
import { useMember } from '@/components/admin/AdminShell';
import { CONSULT_STATUSES, PROJECT_LABEL, STATUS_LABEL, STATUS_TONE, TRIGGER_LABEL, type ConsultStatus } from '@/components/admin/consultations';

/** datetime-local value ↔ ISO, in the panel user's own time zone. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export default function ConsultationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { can } = useMember();
  const db = supabaseBrowser();
  const { data: r, setData, loading, error } = useLoad(
    async () =>
      must(
        await db
          .from('consultation_requests')
          .select('id,created_at,name,email,phone,preferred_time,timezone,project_type,message,locale,source_title,source_path,trigger,status,scheduled_at,notes')
          .eq('id', id)
          .single(),
      ),
    [id],
  );
  const [notes, setNotes] = useState('');
  const [when, setWhen] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!r) return;
    setNotes(r.notes ?? '');
    setWhen(toLocalInput(r.scheduled_at));
  }, [r]);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Their local time right now: call at a sensible hour.
  const theirTime = useMemo(() => {
    if (!r?.timezone) return '';
    try {
      return new Intl.DateTimeFormat('en-GB', { timeZone: r.timezone, weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(now);
    } catch {
      return '';
    }
  }, [r?.timezone, now]);

  async function save(patch: { status?: ConsultStatus; notes?: string; scheduled_at?: string | null }) {
    if (!r) return;
    setSaving(true);
    const { error: err } = await db.from('consultation_requests').update(patch).eq('id', r.id);
    setSaving(false);
    if (err) return toast('error', err.message);
    setData({ ...r, ...patch } as typeof r);
    toast('success', 'Saved.');
  }

  async function remove() {
    if (!r) return;
    const { error: err } = await db.from('consultation_requests').delete().eq('id', r.id);
    if (err) return toast('error', err.message);
    toast('success', 'Request deleted.');
    router.replace('/admin/consultations');
  }

  if (loading) return <Spinner />;
  if (error || !r) return <p className="text-[#E8A598]">{error || 'Not found.'}</p>;

  const locale = isLocale(r.locale) ? r.locale : 'en';
  const subject = getDictionary(locale).consult.ackSubject;
  const mailto = `mailto:${r.email}?subject=${encodeURIComponent(subject)}`;
  const digits = (r.phone ?? '').replace(/[^\d+]/g, '');
  const wa = digits.replace(/^\+/, '').replace(/^00/, '');

  return (
    <>
      <Link href="/admin/consultations" className="mb-4 inline-block text-sm text-bone/50 hover:text-gold">
        ← Free consultation calls
      </Link>
      <PageHeader
        title={r.name}
        description={`${formatDate(r.created_at, true)} · ${r.locale.toUpperCase()} · ${PROJECT_LABEL[r.project_type] ?? r.project_type}`}
        actions={
          <>
            <LinkButton href={mailto} variant="primary">
              Email to confirm a time
            </LinkButton>
            {digits && (
              <LinkButton href={`tel:${digits}`} variant="secondary">
                Call
              </LinkButton>
            )}
            {wa.length >= 8 && (
              <LinkButton href={`https://wa.me/${wa}`} variant="secondary">
                WhatsApp
              </LinkButton>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="When they would like the call">
            <p className="text-[1.05rem] text-bone/90">{r.preferred_time || 'No preference given.'}</p>
            {r.timezone && (
              <p className="mt-2 text-sm text-bone/55">
                Time zone: {r.timezone}
                {theirTime && <span className="text-gold"> · their time now: {theirTime}</span>}
              </p>
            )}
          </Card>
          <Card title="Their note">
            <p className="whitespace-pre-wrap text-[0.98rem] leading-relaxed text-bone/85">{r.message || '(no note)'}</p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Details">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-bone/45">Email</dt>
                <dd>
                  <a href={`mailto:${r.email}`} className="break-all text-gold hover:underline">
                    {r.email}
                  </a>
                </dd>
              </div>
              {r.phone && (
                <div>
                  <dt className="text-bone/45">Phone / WhatsApp</dt>
                  <dd>
                    <a href={`tel:${digits}`} className="text-gold hover:underline">
                      {r.phone}
                    </a>
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-bone/45">Status</dt>
                <dd>
                  <Badge tone={STATUS_TONE[r.status as ConsultStatus] ?? 'grey'}>{STATUS_LABEL[r.status as ConsultStatus] ?? r.status}</Badge>
                </dd>
              </div>
              {(r.source_title || r.source_path) && (
                <div>
                  <dt className="text-bone/45">Asked while reading</dt>
                  <dd className="text-bone/75">
                    {r.source_path ? (
                      <a href={r.source_path} target="_blank" rel="noopener" className="hover:text-gold hover:underline">
                        {r.source_title || r.source_path}
                      </a>
                    ) : (
                      r.source_title
                    )}
                  </dd>
                </div>
              )}
              {r.trigger && (
                <div className="flex justify-between gap-4">
                  <dt className="text-bone/45">Placement</dt>
                  <dd className="text-bone/75">{TRIGGER_LABEL[r.trigger] ?? r.trigger}</dd>
                </div>
              )}
            </dl>
          </Card>

          {can('editor') && (
            <Card title="Handling">
              <div className="space-y-4">
                <Field label="Status" htmlFor="status">
                  <Select id="status" value={r.status} onChange={(ev) => save({ status: ev.target.value as ConsultStatus })}>
                    {CONSULT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Call booked for" htmlFor="when" hint="In your own time zone.">
                  <Input id="when" type="datetime-local" value={when} onChange={(ev) => setWhen(ev.target.value)} />
                </Field>
                <Button
                  variant="secondary"
                  size="sm"
                  busy={saving}
                  disabled={when === toLocalInput(r.scheduled_at)}
                  onClick={() => save({ scheduled_at: when ? new Date(when).toISOString() : null, ...(when && r.status !== 'done' ? { status: 'scheduled' as const } : {}) })}
                >
                  Save the time
                </Button>
                <Field label="Internal notes" htmlFor="notes" hint="Only visible to the team.">
                  <Textarea id="notes" value={notes} onChange={(ev) => setNotes(ev.target.value)} maxLength={4000} rows={4} />
                </Field>
                <Button variant="secondary" size="sm" onClick={() => save({ notes })} busy={saving} disabled={notes === (r.notes ?? '')}>
                  Save notes
                </Button>
              </div>
            </Card>
          )}

          {can('admin') && (
            <Button variant="danger" className="w-full" onClick={() => setConfirm(true)}>
              Delete request
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        title="Delete this request?"
        body="It is removed from the database permanently. Use this for spam or when the person asks for their data to be erased."
        confirmLabel="Delete permanently"
        onConfirm={remove}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}
