/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
  },
  // Legacy Wix URLs (/home, /about, /contacts, /portfolio) are mapped in middleware.ts,
  // together with locale detection.
};

export default nextConfig;
