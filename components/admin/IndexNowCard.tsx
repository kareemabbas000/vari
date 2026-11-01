'use client';

import { useState } from 'react';
import { Button, Card, useToast } from './ui';

/** Panel button for IndexNow (see app/api/admin/indexnow). */
export default function IndexNowCard() {
  const toast = useToast();
  const [busy, setBusy] = useState<'all' | 'recent' | null>(null);
  const [last, setLast] = useState<string | null>(null);

  async function run(scope: 'all' | 'recent') {
    setBusy(scope);
    const res = await fetch('/api/admin/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scope }) }).catch(() => null);
    const json = (await res?.json().catch(() => null)) as { ok?: boolean; submitted?: number; status?: number; note?: string; error?: string } | null;
    setBusy(null);
    if (!json) return toast('error', 'The request did not reach the server. Please try again.');
    if (json.note) {
      setLast(json.note);
      return toast('info', json.note);
    }
    if (!json.ok) return toast('error', `Search engines did not accept the list (status ${json.status ?? '—'}).`);
    const msg = `${json.submitted} address${json.submitted === 1 ? '' : 'es'} sent, accepted (status ${json.status}).`;
    setLast(`${msg} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`);
    toast('success', msg);
  }

  return (
    <Card title="Notify search engines (IndexNow)">
      <div className="space-y-4 text-sm text-bone/70">
        <p>
          Tells Bing (which also powers ChatGPT search), Yandex, Seznam and Naver which pages to crawl again. Publishing already sends recently changed
          articles automatically. Use <strong className="text-bone">All pages</strong> once after switching a language on or after larger changes, not every day.
        </p>
        <p className="text-bone/50">Google does not use IndexNow. For Google, submit the sitemap in Search Console: https://www.vari-studio.com/sitemap.xml</p>
        <div className="flex flex-wrap gap-3">
          <Button size="sm" onClick={() => run('all')} busy={busy === 'all'} disabled={!!busy}>All pages</Button>
          <Button size="sm" variant="secondary" onClick={() => run('recent')} busy={busy === 'recent'} disabled={!!busy}>Changed in the last 2 days</Button>
        </div>
        {last && <p className="text-bone/60">Last result: {last}</p>}
      </div>
    </Card>
  );
}
