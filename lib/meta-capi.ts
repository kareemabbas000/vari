import { createHash } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSiteContent } from '@/lib/cms';
import { cleanTracking } from '@/lib/tracking';
import { defaultLocale } from '@/lib/i18n/config';

/**
 * Meta Conversions API: reports an enquiry server-side, deduplicated with the browser
 * pixel through a shared event id. Only runs when the visitor accepted marketing cookies,
 * a pixel is configured with the Conversions API switched on, and the access token is
 * stored (privately) in the panel. Personal data is sent hashed. Never throws.
 */
const sha = (v: string) => createHash('sha256').update(v.trim().toLowerCase()).digest('hex');

function cookie(req: Request, name: string) {
  const m = (req.headers.get('cookie') || '').match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

export async function sendMetaLead(req: Request, opts: { email: string; firstName?: string; lastName?: string; eventId?: string; sourceUrl?: string }) {
  try {
    const { settings } = await getSiteContent(defaultLocale);
    const t = cleanTracking(settings.tracking);
    if (!t.metaPixel || !t.metaCapi) return;
    const admin = supabaseAdmin();
    if (!admin) return;
    const { data } = await admin.from('integrations_private').select('data').eq('id', 1).maybeSingle();
    const priv = (data?.data || {}) as { metaCapiToken?: string; metaTestEventCode?: string };
    if (!priv.metaCapiToken) return;

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || undefined;
    const body = {
      data: [
        {
          event_name: 'Lead',
          event_time: Math.floor(Date.now() / 1000),
          event_id: opts.eventId && /^[\w-]{8,64}$/.test(opts.eventId) ? opts.eventId : undefined,
          action_source: 'website',
          event_source_url: opts.sourceUrl,
          user_data: {
            em: [sha(opts.email)],
            ...(opts.firstName ? { fn: [sha(opts.firstName)] } : {}),
            ...(opts.lastName ? { ln: [sha(opts.lastName)] } : {}),
            client_ip_address: ip,
            client_user_agent: req.headers.get('user-agent') || undefined,
            fbp: cookie(req, '_fbp'),
            fbc: cookie(req, '_fbc'),
          },
        },
      ],
      ...(priv.metaTestEventCode ? { test_event_code: priv.metaTestEventCode } : {}),
    };
    const res = await fetch(`https://graph.facebook.com/v21.0/${t.metaPixel}/events?access_token=${encodeURIComponent(priv.metaCapiToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) console.warn('[meta-capi] rejected', res.status, (await res.text()).slice(0, 200));
  } catch (err) {
    console.warn('[meta-capi] failed', (err as Error).message);
  }
}
