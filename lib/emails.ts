import { getDictionary, fmt } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/config';
import { contact } from '@/lib/content';

/** Transactional emails in the visitor's language (plain text + simple branded HTML). */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function shell(locale: Locale, inner: string, footer = '') {
  return `<!doctype html><html lang="${locale}"><body style="margin:0;background:#0c0b0a;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;color:#f3eee4">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;border:1px solid #473a12;background:#141312">
<tr><td style="padding:28px 32px;border-bottom:1px solid #473a12;letter-spacing:6px;font-size:13px;color:#d4af37">VARI&nbsp;STUDIO</td></tr>
<tr><td style="padding:32px;font-size:15px;line-height:1.65;color:#f3eee4">${inner}</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #2a2618;font-size:12px;line-height:1.6;color:#8c8578">${esc(contact.address)}<br/>${esc(contact.email)}${footer}</td></tr>
</table></td></tr></table></body></html>`;
}

const para = (s: string) => `<p style="margin:0 0 16px">${esc(s).replace(/\n/g, '<br/>')}</p>`;

export function contactAcknowledgement(locale: Locale, name: string, message: string) {
  const e = getDictionary(locale).emails;
  const greeting = name ? fmt(e.ackGreeting, { name }) : e.ackGreetingNoName;
  const quoted = message ? `\n\n${e.ackCopy}\n> ${message.replace(/\n/g, '\n> ')}` : '';
  const text = `${greeting}\n\n${e.ackBody}${quoted}\n\n${e.signoff}`;
  const html = shell(
    locale,
    para(greeting) +
      para(e.ackBody) +
      (message
        ? `<p style="margin:24px 0 8px;color:#d4af37;font-size:12px;letter-spacing:2px;text-transform:uppercase">${esc(e.ackCopy)}</p><blockquote style="margin:0 0 24px;padding:12px 16px;border-left:2px solid #d4af37;color:#cfc8bb">${esc(message).replace(/\n/g, '<br/>')}</blockquote>`
        : '') +
      para(e.signoff),
  );
  return { subject: e.ackSubject, text, html };
}

export function newsletterConfirmation(locale: Locale, confirmUrl: string, unsubscribeUrl: string) {
  const e = getDictionary(locale).emails;
  const text = `${e.confirmBody}\n${confirmUrl}\n\n${e.confirmIgnore}\n\n${e.signoff}\n\n${e.unsubscribe}: ${unsubscribeUrl}`;
  const html = shell(
    locale,
    para(e.confirmBody) +
      `<p style="margin:24px 0 28px"><a href="${esc(confirmUrl)}" style="display:inline-block;background:#d4af37;color:#0c0b0a;text-decoration:none;padding:14px 28px;letter-spacing:2px;font-size:12px;text-transform:uppercase">${esc(e.confirmButton)}</a></p>` +
      para(e.confirmIgnore) +
      para(e.signoff),
    `<br/><a href="${esc(unsubscribeUrl)}" style="color:#8c8578">${esc(e.unsubscribe)}</a>`,
  );
  return { subject: e.confirmSubject, text, html };
}

export function studioNotification(fields: { firstName: string; lastName: string; email: string; message: string; intent: string; locale: Locale; id?: string }) {
  const name = [fields.firstName, fields.lastName].filter(Boolean).join(' ');
  const subject = `New ${fields.intent ? `${fields.intent} ` : ''}enquiry from ${name || fields.email}`;
  const text = [
    `Name: ${name || '—'}`,
    `Email: ${fields.email}`,
    `Enquiry: ${fields.intent || 'general'}`,
    `Language: ${fields.locale.toUpperCase()}`,
    fields.id ? `Reference: ${fields.id}` : '',
    '',
    fields.message || '(no message)',
  ]
    .filter((l) => l !== '')
    .join('\n');
  return { subject, text };
}
