import { handleNewsletterLink } from '@/lib/newsletter-link';

export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  return handleNewsletterLink(req, 'unsubscribe_newsletter');
}

/** One-click unsubscribe (RFC 8058) from mail clients that POST to the List-Unsubscribe URL. */
export function POST(req: Request) {
  return handleNewsletterLink(req, 'unsubscribe_newsletter');
}
