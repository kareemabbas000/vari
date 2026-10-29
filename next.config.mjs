/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
  },
  // Preserve the original Wix URLs so existing links and search results keep working.
  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      { source: '/about', destination: '/studio', permanent: true },
      { source: '/contacts', destination: '/contact', permanent: true },
      { source: '/portfolio', destination: '/work', permanent: true },
    ];
  },
};

export default nextConfig;
