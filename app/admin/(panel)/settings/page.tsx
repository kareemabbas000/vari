'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { mediaSrc } from '@/lib/media';
import { Button, Card, Field, Input, PageHeader, Spinner, Textarea, useToast } from '@/components/admin/ui';
import I18nInput, { type I18nValue } from '@/components/admin/I18nInput';
import MediaLibrary from '@/components/admin/MediaLibrary';
import Modal from '@/components/admin/Modal';
import { must, usePublish, useLoad } from '@/components/admin/hooks';
import { useMember } from '@/components/admin/AdminShell';
import type { Json } from '@/lib/database.types';

type Social = { label: string; href: string };
type Settings = {
  brand: { logoLight: string; logoDark: string };
  contact: { email: string; marketingEmail: string; address: string; social: Social[] };
  seo: { title?: I18nValue; description?: I18nValue };
  [k: string]: unknown;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,63}$/;
const DEFAULT_LOGOS = { logoLight: '/brand/vari-logo-light.png', logoDark: '/brand/vari-logo-dark.png' };

export default function SettingsPage() {
  const db = supabaseBrowser();
  const toast = useToast();
  const publish = usePublish();
  const { can } = useMember();
  const [s, setS] = useState<Settings | null>(null);
  const [pick, setPick] = useState<'logoLight' | 'logoDark' | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, loading, error } = useLoad(async () => must(await db.from('site_settings').select('data').eq('id', 1).single()).data as unknown as Settings);

  useEffect(() => {
    if (!data) return;
    setS({
      ...data,
      brand: { ...DEFAULT_LOGOS, ...(data.brand || {}) },
      contact: { email: '', marketingEmail: '', address: '', social: [], ...((data.contact || {}) as Partial<Settings['contact']>) },
      seo: data.seo || {},
    });
  }, [data]);

  if (loading || !s) return error ? <p className="text-[#E8A598]">{error}</p> : <Spinner />;
  if (!can('admin')) return <p className="text-bone/60">Only admins can change site settings.</p>;

  const setContact = (patch: Partial<Settings['contact']>) => setS({ ...s, contact: { ...s.contact, ...patch } });
  const setSocial = (i: number, patch: Partial<Social>) => setContact({ social: s.contact.social.map((x, k) => (k === i ? { ...x, ...patch } : x)) });

  async function save() {
    if (!s) return;
    const e: Record<string, string> = {};
    if (!EMAIL_RE.test(s.contact.email)) e.email = 'Enter a valid email address.';
    if (s.contact.marketingEmail && !EMAIL_RE.test(s.contact.marketingEmail)) e.marketingEmail = 'Enter a valid email address.';
    s.contact.social.forEach((x, i) => {
      if (!/^https:\/\/\S+$/.test(x.href)) e[`social${i}`] = 'Use a full https:// link.';
    });
    setErrors(e);
    if (Object.keys(e).length) return toast('error', 'Please check the highlighted fields.');
    setSaving(true);
    const { error: err } = await db.from('site_settings').update({ data: s as unknown as Json }).eq('id', 1);
    setSaving(false);
    if (err) return toast('error', err.message);
    publish('Settings');
  }

  const logo = (key: 'logoLight' | 'logoDark', label: string, bg: string) => (
    <div>
      <p className="mb-2 font-sans text-[0.72rem] uppercase tracking-[0.16em] text-bone/60">{label}</p>
      <div className={`relative flex h-28 items-center justify-center rounded-sm border border-bone/15 p-4 ${bg}`}>
        <Image src={s.brand[key]} alt="" width={240} height={120} unoptimized className="h-auto max-h-20 w-auto max-w-full" />
      </div>
      <div className="mt-2 flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setPick(key)}>
          Replace
        </Button>
        {s.brand[key] !== DEFAULT_LOGOS[key] && (
          <Button size="sm" variant="ghost" onClick={() => setS({ ...s, brand: { ...s.brand, [key]: DEFAULT_LOGOS[key] } })}>
            Restore original
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <PageHeader eyebrow="Site" title="Brand & settings" description="Logo, contact details, social links and search-engine defaults used across the whole website." actions={<Button onClick={save} busy={saving}>Save & publish</Button>} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Logo">
          <div className="grid gap-5 sm:grid-cols-2">
            {logo('logoLight', 'On dark backgrounds', 'bg-night')}
            {logo('logoDark', 'On light backgrounds', 'bg-bone')}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-bone/40">Use a transparent PNG or SVG, about 2:1, at least 1200 px wide. The light version is used everywhere on the current dark design.</p>
        </Card>

        <Card title="Contact details">
          <div className="space-y-4">
            <Field label="Main email" htmlFor="email" error={errors.email} hint="Shown on the site and used as the reply address for enquiries.">
              <Input id="email" type="email" value={s.contact.email} onChange={(e) => setContact({ email: e.target.value })} />
            </Field>
            <Field label="Marketing email" htmlFor="memail" error={errors.marketingEmail}>
              <Input id="memail" type="email" value={s.contact.marketingEmail} onChange={(e) => setContact({ marketingEmail: e.target.value })} />
            </Field>
            <Field label="Studio address" htmlFor="address">
              <Textarea id="address" rows={2} value={s.contact.address} onChange={(e) => setContact({ address: e.target.value })} />
            </Field>
          </div>
        </Card>

        <Card title="Social links" actions={<Button size="sm" variant="secondary" onClick={() => setContact({ social: [...s.contact.social, { label: '', href: 'https://' }] })}>Add link</Button>}>
          <ul className="space-y-3">
            {s.contact.social.map((x, i) => (
              <li key={i} className="grid gap-2 sm:grid-cols-[9rem_1fr_auto] sm:items-start">
                <Input aria-label="Network name" placeholder="Instagram" value={x.label} onChange={(e) => setSocial(i, { label: e.target.value })} />
                <div>
                  <Input aria-label="Link" placeholder="https://…" value={x.href} onChange={(e) => setSocial(i, { href: e.target.value.trim() })} />
                  {errors[`social${i}`] && <p className="mt-1 text-sm text-[#E8A598]">{errors[`social${i}`]}</p>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setContact({ social: s.contact.social.filter((_, k) => k !== i) })}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Search engines (defaults)">
          <div className="space-y-5">
            <I18nInput label="Site title" value={s.seo.title || {}} onChange={(v) => setS({ ...s, seo: { ...s.seo, title: v } })} maxLength={70} hint="Leave empty to use the built-in titles." />
            <I18nInput label="Site description" value={s.seo.description || {}} onChange={(v) => setS({ ...s, seo: { ...s.seo, description: v } })} multiline rows={3} maxLength={170} />
          </div>
        </Card>
      </div>

      <Modal open={!!pick} title="Choose logo" onClose={() => setPick(null)} wide>
        <MediaLibrary
          mode="pick"
          onPick={(rows) => {
            const m = rows[0];
            if (m && pick) setS({ ...s, brand: { ...s.brand, [pick]: mediaSrc(m.source, m.path) } });
            setPick(null);
          }}
        />
      </Modal>
    </>
  );
}
