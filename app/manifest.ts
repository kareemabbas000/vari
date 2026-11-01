import type { MetadataRoute } from 'next';

/** Web app manifest: name, colours and the V-monogram icons (scripts/brand/build-favicon.py). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VARI Studio — Architecture, Interiors & 3D Visualization',
    short_name: 'VARI Studio',
    start_url: '/',
    display: 'browser',
    background_color: '#0C0B0A',
    theme_color: '#0C0B0A',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
