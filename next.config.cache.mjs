// Next.js Build Cache Configuration
// This configuration enables aggressive caching for faster builds

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable build caching
  experimental: {
    // Enable Turbopack for faster builds
    turbo: true,
    
    // Enable build stability for better caching
    buildStability: true,
    
    // Enable granular chunking for better caching
    granularChunks: true,
    
    // Optimize package imports for faster resolution
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip',
      // Add other frequently used packages
    ],
  },
  
  // Webpack caching configuration
  webpack: (config, { dev, isServer }) => {
    // Only enable caching in production builds
    if (!dev) {
      // Enable persistent caching
      config.cache = {
        type: 'filesystem',
        version: 'v1.0',
        cacheDirectory: '.next/cache/webpack',
        buildDependencies: {
          config: [__filename],
        },
        // Cache compression for smaller cache size
        compression: 'gzip',
        // Idle garbage collection
        idleTimeout: 30000,
        idleTimeoutForInitialStore: 0,
      };
      
      // Enable persistent build dependencies tracking
      config.snapshot = {
        managedPaths: [/node_modules/],
        immutablePaths: [],
        resolveBuildDependencies: {
          timestamp: true,
          hash: true,
        },
        buildDependencies: {
          timestamp: true,
          hash: true,
        },
        module: {
          timestamp: true,
          hash: true,
        },
        resolve: {
          timestamp: true,
          hash: true,
        },
      };
    }
    
    return config;
  },
  
  // Compiler settings for faster builds
  compiler: {
    // Enable react component caching
    reactRemoveProperties: { properties: ['^data-testid$'] },
    // Enable minification caching
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  
  // Image optimization caching
  images: {
    unoptimized: true,
  },
}

export default nextConfig