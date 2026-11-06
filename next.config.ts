import type { NextConfig } from 'next';

const isMobileExport = process.env.MOBILE_EXPORT === '1';

const nextConfig: NextConfig = {
  env: {
    VITE_MOYASAR_PUBLISHABLE_KEY:
      process.env.VITE_MOYASAR_PUBLISHABLE_KEY?.trim() ||
      process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY?.trim() ||
      '',
  },
  ...(isMobileExport
    ? {
        output: 'export',
        // Capacitor serves files from `out/` — no Next image optimizer server.
        images: { unoptimized: true },
      }
    : {
        serverExternalPackages: ['firebase-admin'],
        images: {
          remotePatterns: [{ protocol: 'https', hostname: 'firebasestorage.googleapis.com' }],
        },
      }),
  allowedDevOrigins: ['172.20.10.3'],
  async headers() {
    if (isMobileExport) return [];

    const securityHeaders = [
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(self), microphone=(), geolocation=(), payment=(self)',
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
    ];

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/libs/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
