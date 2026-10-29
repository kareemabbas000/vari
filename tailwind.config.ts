import type { Config } from 'tailwindcss';

/**
 * Palette: the four gold values and the neutrals are extracted from the original Wix theme
 * (color_16–color_20, color_41, #1A1A1A, #242323, #282626, #555555). `night` and `bone`
 * are creative extensions for the new dark gallery direction — see docs/BRAND_REFERENCE.md.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E2CF8F',
          pale: '#F1E3B5',
          deep: '#8D7525',
          ink: '#473A12',
        },
        ink: '#1A1A1A',
        charcoal: '#242323',
        graphite: '#282626',
        stone: '#555555',
        night: '#0C0B0A',
        bone: '#F3EEE4',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      letterSpacing: {
        label: '0.28em',
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
        arch: 'cubic-bezier(0.83, 0, 0.17, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
