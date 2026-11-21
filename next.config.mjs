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
  async headers() {
    return [
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
