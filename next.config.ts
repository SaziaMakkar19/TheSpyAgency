import type { NextConfig } from "next";

const nextConfig = {
  // Forces Next.js to correctly resolve and compile rizzui
  transpilePackages: ['rizzui'],
  // Native/render deps must be loaded from node_modules, not bundled
  // (resvg ships .node binaries; sharp likewise).
  serverExternalPackages: ['@resvg/resvg-js', 'sharp', 'satori'],
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
