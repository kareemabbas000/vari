import { Fraunces, Jost } from 'next/font/google';

// Fraunces is the display face of the original site (fraunces_120pt light / semibold).
export const display = Fraunces({
  subsets: ['latin', 'latin-ext'],
  style: ['normal', 'italic'],
  axes: ['opsz', 'SOFT', 'WONK'],
  variable: '--font-display',
  display: 'swap',
});

// The original used licensed Futura / DIN Next / Avenir. Jost is a free geometric
// sans in the Futura family of forms — a stand-in.
export const sans = Jost({ subsets: ['latin', 'latin-ext'], variable: '--font-sans', display: 'swap' });
