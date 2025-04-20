/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["zwyhkqugtactltbiftio.supabase.co"], // Supabase storage domain
    unoptimized: true,
  },
  // Add Safari-specific configuration
  experimental: {
    optimizeCss: false, // Disable CSS optimization which can cause issues in Safari
  },
  // Fix for Safari preload issues
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

// Use module.exports format to match your existing config
module.exports = nextConfig;
