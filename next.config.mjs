/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Enable build caching for faster builds
  webpack: (config, { dev, isServer }) => {
    // Enable persistent caching for production builds
    if (!dev) {
      config.cache = {
        type: 'filesystem',
        version: 'nextjs-build-cache',
        cacheDirectory: process.cwd() + '/.next/cache/webpack',
      };
    }
    
    return config;
  },
}

export default nextConfig