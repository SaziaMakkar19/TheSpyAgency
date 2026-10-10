import type { NextConfig } from "next";

const nextConfig = {
  // Forces Next.js to correctly resolve and compile rizzui
  transpilePackages: ['rizzui'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Allow the hero map to request geolocation from the site's own origin
          { key: 'Permissions-Policy', value: 'geolocation=(self)' },
        ],
      },
    ];
  },
};

export default nextConfig;
