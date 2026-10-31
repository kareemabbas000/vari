'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Badge, Button, Card, Field, Input, PageHeader, Select, Spinner, Switch, Textarea, useToast } from '@/components/admin/ui';
import { must, usePublish, useLoad } from '@/components/admin/hooks';
import { useMember } from '@/components/admin/AdminShell';
import { ID_PATTERNS, VERIFY_PATTERN, type CodeSnippet, type TrackingSettings, type Verification } from '@/lib/tracking';
import type { Json } from '@/lib/database.types';

type Data = { tracking?: TrackingSettings; verification?: Verification; [k: string]: unknown };
type Private = { metaCapiToken?: string; metaTestEventCode?: string };
type IdKey = keyof typeof ID_PATTERNS;

const GROUPS: { title: string; intro: string; keys: IdKey[] }[] = [
  { title: 'Google', intro: 'Measure visits and conversions. GA4 tracks page views automatically; enquiries are sent as “generate_lead” and newsletter sign-ups as “sign_up”.', keys: ['ga4', 'gtm', 'googleAds'] },
  { title: 'Meta (Facebook & Instagram)', intro: 'Enquiries are reported as “Lead”, sign-ups as “CompleteRegistration” — ready for campaign optimisation and retargeting audiences.', keys: ['metaPixel'] },
  { title: 'More platforms', intro: 'Optional tools — leave empty if you don’t use them.', keys: ['clarity', 'linkedin', 'tiktok'] },
];

const VERIFY: { key: keyof Verification; label: string; help: string }[] = [
  { key: 'google', label: 'Google Search Console', help: 'Search Console → Add property → URL prefix → HTML tag → copy only the content="…" value.' },
  { key: 'bing', label: 'Bing Webmaster Tools', help: 'Bing Webmaster → Add site → HTML meta tag → the content value of msvalidate.01.' },
  { key: 'facebook', label: 'Meta domain verification', help: 'Meta Business Settings → Brand safety → Domains → Meta-tag option.' },
  { key: 'pinterest', label: 'Pinterest', help: 'Pinterest business → Claim website → HTML tag content value.' },
  { key: 'yandex', label: 'Yandex Webmaster', help: 'Only if you target Russian-speaking markets.' },
];

const mask = (v?: string) => (v ? `••••••${v.slice(-4)}` : '');

export default function TrackingPage() {
  const db = supabaseBrowser();
  const toast = useToast();
  const publish = usePublish();
  const { can, role } = useMember();
  const [t, setT] = useState<TrackingSettings>({});
  const [v, setV] = useState<Verification>({});
  const [priv, setPriv] = useState<Private>({});
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);
  const isOwner = role === 'owner';

  const { data, loading, error } = useLoad(async () => {
    const [s, p] = await Promise.all([db.from('site_settings').select('data').eq('id', 1).single(), db.from('integrations_private').select('data').eq('id', 1).maybeSingle()]);
    return { settings: must(s).data as Data, priv: (p.data?.data || {}) as Private };
  });

  useEffect(() => {
    if (!data) return;
    setT(data.settings.tracking || {});
    setV(data.settings.verification || {});
    setPriv(data.priv);
  }, [data]);

  if (loading) return <Spinner />;
  if (error) return <p className="text-[#E8A598]">{error}</p>;
  if (!can('admin')) return <p className="text-bone/60">Only admins can change analytics and tracking.</p>;

  const invalid = (k: IdKey) => !!t[k] && !ID_PATTERNS[k].re.test(String(t[k]).trim());
  const invalidVerify = (k: keyof Verification) => !!v[k] && !VERIFY_PATTERN.test(String(v[k]).trim());
  const active = (Object.keys(ID_PATTERNS) as IdKey[]).filter((k) => t[k] && !invalid(k));
  const snippets = t.snippets || [];
  const setSnippet = (i: number, patch: Partial<CodeSnippet>) => setT({ ...t, snippets: snippets.map((s, k) => (k === i ? { ...s, ...patch } : s)) });

  async function save() {
    const bad = (Object.keys(ID_PATTERNS) as IdKey[]).find(invalid) || VERIFY.find((x) => invalidVerify(x.key))?.key;
    if (bad) return toast('error', 'Please check the highlighted IDs.');
    if (!data) return;
    setSaving(true);
    const trimmed: TrackingSettings = Object.fromEntries(Object.entries(t).map(([k, val]) => [k, typeof val === 'string' ? val.trim() : val]));
    const next = { ...data.settings, tracking: trimmed, verification: Object.fromEntries(Object.entries(v).map(([k, val]) => [k, (val || '').trim()])) };
    const res = await db.from('site_settings').update({ data: next as unknown as Json }).eq('id', 1).select('id');
    let ok = !res.error && !!res.data?.length;
    if (ok && (token || priv.metaTestEventCode !== data.priv.metaTestEventCode)) {
      const p2 = { ...priv, ...(token ? { metaCapiToken: token.trim() } : {}) };
      const r2 = await db.from('integrations_private').update({ data: p2 as unknown as Json }).eq('id', 1).select('id');
      ok = !r2.error && !!r2.data?.length;
      if (ok) {
        setPriv(p2);
        setToken('');
      }
    }
    setSaving(false);
    if (!ok) return toast('error', res.error?.message || 'Not saved — sign in again.');
    publish('Tracking settings');
  }

  return (
    <>
      <PageHeader
        eyebrow="Site"
        title="Analytics & tracking"
        description="Connect Google Analytics, Tag Manager, Meta and other tools, verify the site with search engines, and add custom code — without touching the code."
        actions={<Button onClick={save} busy={saving}>Save & publish</Button>}
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="font-sans text-[0.72rem] uppercase tracking-[0.16em] text-bone/50">Active now</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {active.length ? active.map((k) => <Badge key={k} tone="green">{ID_PATTERNS[k].label.split(' — ')[0]}</Badge>) : <span className="text-sm text-bone/50">No tracking yet — visitors see no cookie banner.</span>}
            {t.metaCapi && t.metaPixel && priv.metaCapiToken && <Badge tone="blue">Meta Conversions API</Badge>}
          </div>
        </Card>
        <Card>
          <p className="text-sm leading-relaxed text-bone/65">
            <strong className="text-bone">GDPR-ready.</strong> As soon as a tool is set, visitors see a consent banner in their language; trackers load only after they agree, and the privacy notice updates itself.
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {GROUPS.map((g) => (
          <Card key={g.title} title={g.title}>
            <p className="-mt-1 mb-5 text-sm leading-relaxed text-bone/55">{g.intro}</p>
            <div className="space-y-5">
              {g.keys.map((k) => (
                <Field key={k} label={ID_PATTERNS[k].label} htmlFor={`id-${k}`} error={invalid(k) ? `Expected a value like ${ID_PATTERNS[k].example}.` : undefined} hint={ID_PATTERNS[k].help}>
                  <Input id={`id-${k}`} value={(t[k] as string) || ''} placeholder={ID_PATTERNS[k].example} onChange={(e) => setT({ ...t, [k]: e.target.value })} spellCheck={false} autoComplete="off" />
                </Field>
              ))}
              {g.keys.includes('metaPixel') && (
                <div className="space-y-4 rounded-sm border border-bone/10 p-4">
                  <Switch
                    checked={!!t.metaCapi}
                    onChange={(metaCapi) => setT({ ...t, metaCapi })}
                    label="Conversions API (server-side)"
                    description="Also reports enquiries from the server, so ad blockers and iOS privacy don’t hide your leads. Deduplicated with the pixel."
                  />
                  {t.metaCapi && (
                    <>
                      <Field label="Access token" htmlFor="capi-token" hint={priv.metaCapiToken ? `Saved (${mask(priv.metaCapiToken)}). Paste a new one only to replace it. Stored privately — never sent to visitors.` : 'Events Manager → your dataset → Settings → Conversions API → Generate access token.'}>
                        <Input id="capi-token" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder={priv.metaCapiToken ? mask(priv.metaCapiToken) : 'EAAB…'} autoComplete="off" />
                      </Field>
                      <Field label="Test event code (optional)" htmlFor="capi-test" hint="While testing in Events Manager → Test events. Remove it afterwards.">
                        <Input id="capi-test" value={priv.metaTestEventCode || ''} onChange={(e) => setPriv({ ...priv, metaTestEventCode: e.target.value.trim() })} placeholder="TEST12345" />
                      </Field>
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}

        <Card title="Search engine verification">
          <p className="-mt-1 mb-5 text-sm leading-relaxed text-bone/55">
            Prove you own the site to unlock search data. Then submit your sitemap: <code className="rounded bg-bone/10 px-1.5 py-0.5 text-gold">https://www.vari-studio.com/sitemap.xml</code>
          </p>
          <div className="space-y-5">
            {VERIFY.map((x) => (
              <Field key={x.key} label={x.label} htmlFor={`v-${x.key}`} hint={x.help} error={invalidVerify(x.key) ? 'Paste only the code (letters, numbers, - _ =).' : undefined}>
                <Input id={`v-${x.key}`} value={v[x.key] || ''} onChange={(e) => setV({ ...v, [x.key]: e.target.value })} spellCheck={false} />
              </Field>
            ))}
          </div>
        </Card>

        <Card
          title="Custom code"
          className="lg:col-span-2"
          actions={
            isOwner && snippets.length < 20 ? (
              <Button size="sm" variant="secondary" onClick={() => setT({ ...t, snippets: [...snippets, { id: Math.random().toString(36).slice(2, 10), name: '', placement: 'head', category: 'analytics', code: '', enabled: true }] })}>
                Add code
              </Button>
            ) : undefined
          }
        >
          <p className="-mt-1 mb-5 text-sm leading-relaxed text-bone/55">
            For any other tool that gives you a snippet (chat widgets, other ad platforms…). Choose its cookie category so it only runs with the visitor’s consent.
            {!isOwner && ' Only the owner can add or change custom code.'}
          </p>
          {!snippets.length && <p className="text-sm text-bone/40">No custom code.</p>}
          <fieldset disabled={!isOwner} className="space-y-4">
            {snippets.map((s, i) => (
              <div key={s.id} className="space-y-4 rounded-sm border border-bone/10 p-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_10rem_11rem]">
                  <Input aria-label="Name" placeholder="Name, e.g. Live chat" value={s.name} onChange={(e) => setSnippet(i, { name: e.target.value })} />
                  <Select aria-label="Placement" value={s.placement} onChange={(e) => setSnippet(i, { placement: e.target.value as CodeSnippet['placement'] })}>
                    <option value="head">In &lt;head&gt;</option>
                    <option value="body">End of &lt;body&gt;</option>
                  </Select>
                  <Select aria-label="Cookie category" value={s.category} onChange={(e) => setSnippet(i, { category: e.target.value as CodeSnippet['category'] })}>
                    <option value="necessary">Necessary (always)</option>
                    <option value="analytics">Statistics (consent)</option>
                    <option value="marketing">Marketing (consent)</option>
                  </Select>
                </div>
                <Textarea aria-label="Code" rows={5} value={s.code} onChange={(e) => setSnippet(i, { code: e.target.value })} className="font-mono text-xs" placeholder="<script>…</script>" spellCheck={false} />
                <div className="flex items-center justify-between gap-4">
                  <div className="w-56"><Switch checked={s.enabled} onChange={(enabled) => setSnippet(i, { enabled })} label="Enabled" /></div>
                  <Button size="sm" variant="ghost" onClick={() => setT({ ...t, snippets: snippets.filter((_, k) => k !== i) })}>Remove</Button>
                </div>
              </div>
            ))}
          </fieldset>
        </Card>
      </div>
    </>
  );
}
