import type { NextConfig } from 'next'

const nextConfig = {
    // Forces Next.js to correctly resolve and compile rizzui
    transpilePackages: ['rizzui'],
    serverExternalPackages: ['pdfkit'],
}

export default nextConfig
