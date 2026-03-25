import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Skip type checking during build (check separately in CI)
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
  },

  // Headers for static asset caching
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=43200',
          },
        ],
      },
    ]
  },
}

export default nextConfig
