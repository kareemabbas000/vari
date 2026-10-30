import { handleNewsletterLink } from '@/lib/newsletter-link';

export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  return handleNewsletterLink(req, 'confirm_newsletter');
}
