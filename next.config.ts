import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Metadata base URL for absolute URLs in OpenGraph and metadata
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://eweeha.com',
  },

  // Performance optimizations
  output: 'standalone', // Reduces Docker image size by 80%

  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['@heroicons/react', 'react-hot-toast'],
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'], // Modern formats for better compression
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Optimized breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Icon sizes
    qualities: [60, 70, 75], // Allowed quality values (required as of Next.js 16)
    minimumCacheTTL: 31536000, // 1 year cache for optimized images
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Keep errors and warnings
    } : false,
  },

  // Old cortège URLs → new convoy URLs
  async redirects() {
    return [
      {
        source: '/services/wedding-cortege',
        destination: '/services/wedding-convoy',
        permanent: true,
      },
      {
        source: '/routes/convertible-cortege',
        destination: '/routes/convertible-convoy',
        permanent: true,
      },
    ];
  },

  // Headers for better caching and security
  async headers() {
    return [
      {
        source: '/api/vehicles',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=180, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/api/config',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        ],
      },
      {
        source: '/api/content',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=600, stale-while-revalidate=1200',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
