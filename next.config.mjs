/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/static/uploads/**',
      },
    ],
  },
  // NOTE: 'standalone' output is for self-hosted Docker only.
  // Vercel manages its own output — do NOT set output:'standalone' for Vercel.
  // output: 'standalone',
  // Enable compression
  compress: true,
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=self, geolocation=self, microphone=()',
          },
        ],
      },
    ]
  },
  // Rewrites to proxy API in production (optional — comment out if using direct API URL)
  // async rewrites() {
  //   return [
  //     { source: '/api/:path*', destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/:path*` },
  //   ]
  // },
}

export default nextConfig
