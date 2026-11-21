/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
    // Fewer widths per image: every page lists each width in each image's srcset, so the default
    // 16 widths made a third of the HTML. These still cover phones to 2.5K screens (the CDN
    // serves the nearest larger width), and every cached page is smaller to store and send.
    deviceSizes: [640, 960, 1280, 1920, 2560],
    imageSizes: [128, 256, 384],
  },
  // Legacy Wix URLs (/home, /about, /contacts, /portfolio) are mapped in middleware.ts,
  // together with locale detection.
  poweredByHeader: false,
  // Self-hosted images (lib/image-loader.ts): /img/<id>/<width> is answered with the AVIF file
  // when the browser accepts AVIF, otherwise WebP. Decided by Vercel's router: no function runs.
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/img/:id/:w(\\d+)', has: [{ type: 'header', key: 'accept', value: '(?<accept>.*image/avif.*)' }], destination: '/media/:id/:w.avif' },
        { source: '/img/:id/:w(\\d+)', destination: '/media/:id/:w.webp' },
      ],
    };
  },
  async headers() {
    return [
      {
        // Files are named by their Wix media id and width and never change: browsers keep them
        // for a year and never ask again. Vary keeps the AVIF and WebP answers apart.
        source: '/img/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Vary', value: 'Accept' },
        ],
      },
      {
        source: '/media/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ];
  },
};

export default nextConfig;
