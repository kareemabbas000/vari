'use client';

import { useState } from 'react';
import { Button, Card, useToast } from './ui';

/**
 * Panel button: refresh every cached page. The website is cached until something is published
 * in the panel, so changes made elsewhere (SQL run in Supabase) need this, unless the database
 * hook in scripts/db/cache-hooks.sql is installed, which does it automatically.
 */
export default function RefreshSiteCard() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    const res = await fetch('/api/admin/revalidate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scope: 'all' }) }).catch(() => null);
    setBusy(false);
    if (res?.ok) toast('success', 'The website was refreshed. Pages rebuild on their next visit.');
    else toast('error', 'The website could not be refreshed. Please try again.');
  }
  return (
    <Card title="Refresh the website">
      <div className="space-y-4 text-sm text-bone/70">
        <p>
          The website is stored on Vercel&apos;s network and only rebuilt when you publish here, which keeps it fast and free of charge. Changes saved in the panel go live
          by themselves. Use this button only after changing content outside the panel, for example by running SQL in Supabase.
        </p>
        <Button size="sm" onClick={run} busy={busy}>Refresh now</Button>
      </div>
    </Card>
  );
}
