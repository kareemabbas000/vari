import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { display, sans } from '@/lib/fonts';
import { ToastProvider } from '@/components/admin/ui';

export const metadata: Metadata = {
  title: { default: 'VARI Control Panel', template: '%s — VARI Panel' },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#0C0B0A', width: 'device-width', initialScale: 1 };

/** Root layout of the control panel (separate from the public site's localized layout). */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-[100svh] bg-night font-sans text-bone antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
