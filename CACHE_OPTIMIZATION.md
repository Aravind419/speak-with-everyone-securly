# Build Cache Optimization Guide

This document explains the build cache optimizations implemented for faster builds.

## Optimizations Implemented

### 1. Next.js Configuration
- Enabled experimental build caching features
- Configured webpack persistent caching
- Enabled Turbopack for faster builds
- Optimized package imports for frequently used libraries

### 2. pnpm Configuration
- Created workspace configuration for better dependency management
- Enabled consistent installs for better caching

### 3. Build Scripts
- Added cache-aware build scripts
- Added cache cleaning utilities
- Added Turbopack-enabled development mode

## Usage

### Development with Cache
```bash
# Regular development
pnpm dev

# Development with Turbopack (faster builds)
pnpm dev:turbo

# Development with HTTPS and caching
pnpm dev:https
```

### Production Builds with Cache
```bash
# Regular build
pnpm build

# Build with experimental cache features
pnpm build:cache

# Build with Turbopack
pnpm build:turbo
```

### Cache Management
```bash
# Clean all cache
pnpm clean

# Clean only build cache
pnpm clean:cache

# View pnpm store path
pnpm cache:info
```

## Cache Locations

1. **Next.js Webpack Cache**: `.next/cache/webpack/`
2. **Next.js Turbopack Cache**: `.next/cache/turbo/`
3. **pnpm Store**: Global pnpm store (view with `pnpm store path`)

## Benefits

1. **Faster Development Restarts**: Incremental compilation caches previous builds
2. **Faster Production Builds**: Persistent caching avoids rebuilding unchanged modules
3. **Reduced CI/CD Build Times**: Cache can be persisted between builds
4. **Improved Developer Experience**: Faster feedback loops during development

## CI/CD Integration

To leverage caching in CI/CD environments:

1. Cache the following directories between builds:
   - `.next/cache/`
   - `node_modules/.cache/`
   - Global pnpm store (from `pnpm store path`)

2. Example GitHub Actions cache configuration:
   ```yaml
   - name: Cache pnpm modules
     uses: actions/cache@v3
     with:
       path: |
         ~/.pnpm-store
         **/node_modules/.cache
         .next/cache
       key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
   ```

## Troubleshooting

If you encounter caching issues:

1. **Clean all caches**:
   ```bash
   pnpm clean
   ```

2. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules
   pnpm install
   ```

3. **Check cache status**:
   ```bash
   pnpm cache:info
   ```