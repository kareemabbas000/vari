'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { mediaSrc } from '@/lib/media';
import { Button, Card, LinkButton, PageHeader, Spinner, Switch, useToast } from '@/components/admin/ui';
import MediaLibrary from '@/components/admin/MediaLibrary';
import Modal from '@/components/admin/Modal';
import { must, usePublish, useLoad } from '@/components/admin/hooks';
import { useMember } from '@/components/admin/AdminShell';
import type { Json } from '@/lib/database.types';

const LABELS: Record<string, { name: string; about: string }> = {
  hero: { name: 'Hero', about: 'Opening façade with the headline and the two calls to action' },
  welcome: { name: 'Welcome', about: 'Studio introduction with the layered renders' },
  exteriors: { name: 'Exteriors', about: 'Horizontal gallery of the exterior projects' },
  interiors: { name: 'Interiors', about: 'Featured rooms and the enfilade of interiors' },
  services: { name: 'Services', about: 'Services list with the live 3D model' },
  story: { name: 'Story', about: 'The five studio chapters with images' },
  experience: { name: 'Experience', about: 'Moving bands of text' },
  contact: { name: 'Contact', about: 'Contact details and the enquiry form' },
};
const DEFAULT_ORDER = Object.keys(LABELS);

type Section = { id: string; visible: boolean };
type Data = { home?: { sections?: Section[]; storyImages?: string[] }; intro?: { enabled?: boolean; languageGate?: boolean }; [k: string]: unknown };

export default function HomeLayoutPage() {
  const db = supabaseBrowser();
  const toast = useToast();
  const publish = usePublish();
  const { can } = useMember();
  const canSave = can('admin');
  const [sections, setSections] = useState<Section[]>([]);
  const [intro, setIntro] = useState({ enabled: true, languageGate: true });
  const [story, setStory] = useState<string[]>([]);
  const [slot, setSlot] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [homeId, setHomeId] = useState<string | null>(null);
  useEffect(() => {
    db.from('pages').select('id').eq('slug', 'home').maybeSingle().then(({ data: p }) => setHomeId(p?.id ?? null));
  }, [db]);

  const { data, loading, error } = useLoad(async () => must(await db.from('site_settings').select('data').eq('id', 1).single()).data as Data);

  useEffect(() => {
    if (!data) return;
    const saved = data.home?.sections ?? [];
    // Keep saved order; append any section the site gained since.
    setSections([...saved.filter((s) => LABELS[s.id]), ...DEFAULT_ORDER.filter((id) => !saved.some((s) => s.id === id)).map((id) => ({ id, visible: true }))]);
    setIntro({ enabled: data.intro?.enabled ?? true, languageGate: data.intro?.languageGate ?? true });
    setStory(data.home?.storyImages ?? []);
  }, [data]);

  async function save() {
    if (!data) return;
    setSaving(true);
    const next = { ...data, home: { ...(data.home || {}), sections, storyImages: story }, intro };
    const { error: err } = await db.from('site_settings').update({ data: next as unknown as Json }).eq('id', 1);
    setSaving(false);
    if (err) return toast('error', err.message);
    publish('Home page');
  }

  if (loading) return <Spinner />;
  if (error) return <p className="text-[#E8A598]">{error}</p>;

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Home & intro"
        description="The 3D intro, the language choice and the story images. The layout is edited in the page builder."
        actions={canSave ? <Button onClick={save} busy={saving}>Save & publish</Button> : undefined}
      />
      {!canSave && <p className="mb-4 text-sm text-bone/50">Only admins can change the home page layout.</p>}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="Layout" className="lg:col-span-3">
          <p className="text-sm leading-relaxed text-bone/65">
            The order of the home page sections, hiding sections and adding new blocks between them now happens in the visual page builder — with a live preview on desktop, tablet and phone.
          </p>
          {homeId ? (
            <LinkButton href={`/admin/pages/${homeId}`} variant="primary" className="mt-6">
              Open the home page in the builder
            </LinkButton>
          ) : (
            <p className="mt-4 text-sm text-bone/45">Loading…</p>
          )}
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Intro">
            <div className="space-y-5">
              <Switch disabled={!canSave} checked={intro.enabled} onChange={(v) => setIntro({ ...intro, enabled: v })} label="3D intro" description="The villa that builds itself with the project renders (plays once per visit)." />
              <Switch
                disabled={!canSave || !intro.enabled}
                checked={intro.languageGate}
                onChange={(v) => setIntro({ ...intro, languageGate: v })}
                label="Language choice"
                description="First-time visitors choose English, Deutsch or Español at the end of the intro."
              />
            </div>
          </Card>

          <Card title="Story images">
            <p className="mb-3 text-xs text-bone/45">One image per chapter of the studio story, in order.</p>
            <ul className="grid grid-cols-5 gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <li key={i}>
                  <button
                    type="button"
                    disabled={!canSave}
                    onClick={() => setSlot(i)}
                    className="relative block aspect-[4/5] w-full overflow-hidden rounded-sm border border-bone/15 bg-[#1a1917] hover:border-gold"
                    aria-label={`Change image ${i + 1}`}
                  >
                    {story[i] && <Image src={story[i]} alt="" fill sizes="90px" className="object-cover" />}
                    <span className="absolute bottom-1 left-1 rounded-sm bg-night/70 px-1 text-[0.65rem]">{i + 1}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Modal open={slot !== null} title={`Story image ${slot !== null ? slot + 1 : ''}`} onClose={() => setSlot(null)} wide>
        <MediaLibrary
          mode="pick"
          onPick={(rows) => {
            const m = rows[0];
            if (m && slot !== null) setStory((s) => Object.assign([...s], { [slot]: mediaSrc(m.source, m.path) }));
            setSlot(null);
          }}
        />
      </Modal>
    </>
  );
}
