import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase/config';
import { isMailConfigured, sendMail } from '@/lib/mail';
import { panelLinkEmail } from '@/lib/emails';

type Admin = SupabaseClient<Database>;
type Kind = 'invite' | 'recovery';

const COPY: Record<Kind, { subject: string; heading: string; body: string; button: string; footnote: string }> = {
  invite: {
    subject: 'Your invitation to the VARI Studio control panel',
    heading: 'You have been invited to the VARI control panel',
    body: 'Open the link below to choose your password and start managing the VARI Studio website.',
    button: 'Accept invitation',
    footnote: 'If you were not expecting this invitation, you can ignore this email.',
  },
  recovery: {
    subject: 'Reset your VARI control panel password',
    heading: 'Choose a new password',
    body: 'Someone asked to reset the password for this account. Open the link below to choose a new one.',
    button: 'Choose new password',
    footnote: 'If you did not ask for this, ignore this email — your password stays the same.',
  },
};

/**
 * Create (if needed) and email a control-panel access link.
 * With Resend configured we send our own branded email using a token-hash link;
 * otherwise Supabase Auth sends its default email. Returns the auth user id.
 */
export async function sendAccessLink(admin: Admin, email: string, kind: Kind, origin: string): Promise<{ userId: string } | { error: string }> {
  const redirectTo = `${origin}/admin/accept`;

  if (isMailConfigured()) {
    let link = await admin.auth.admin.generateLink({ type: kind === 'invite' ? 'invite' : 'recovery', email, options: { redirectTo } });
    // Already registered → an invite cannot be generated; a magic link signs them in instead.
    if (link.error && kind === 'invite') link = await admin.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo } });
    if (link.error || !link.data.user) return { error: link.error?.message || 'link_failed' };
    const p = link.data.properties;
    const url = `${redirectTo}?token_hash=${encodeURIComponent(p.hashed_token)}&type=${encodeURIComponent(p.verification_type)}`;
    const c = COPY[kind];
    const mail = panelLinkEmail({ heading: c.heading, body: c.body, button: c.button, url, footnote: c.footnote });
    const sent = await sendMail({ to: email, subject: c.subject, text: mail.text, html: mail.html });
    return sent ? { userId: link.data.user.id } : { error: 'mail_failed' };
  }

  // Supabase's own email (default SMTP — fine for the project owner; add custom SMTP for others).
  if (kind === 'invite') {
    const inv = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (!inv.error && inv.data.user) return { userId: inv.data.user.id };
  }
  // Recovery, or an invite for an address that already has an account. Find the user without
  // generateLink: that call counts as a recovery request itself and would trip Supabase's
  // one-email-per-minute limit for the reset sent next.
  const userId = await findUserId(admin, email);
  if (!userId) return { error: 'user_not_found' };
  const anon = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, flowType: 'implicit' } });
  const reset = await anon.auth.resetPasswordForEmail(email, { redirectTo });
  if (reset.error) return { error: reset.error.message };
  return { userId };
}

async function findUserId(admin: Admin, email: string) {
  const { data: profile } = await admin.from('profiles').select('id').eq('email', email.toLowerCase()).maybeSingle();
  if (profile) return profile.id;
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return null;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit.id;
    if (data.users.length < 1000) return null;
  }
  return null;
}

/** "k••••••s@gmail.com" */
export function maskEmail(email: string) {
  const [user, domain] = email.split('@');
  if (!domain) return '••••';
  return `${user[0]}${'•'.repeat(Math.max(2, user.length - 2))}${user.length > 1 ? user[user.length - 1] : ''}@${domain}`;
}
