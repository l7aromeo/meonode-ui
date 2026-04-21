import { URL } from 'node:url'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    externalDir: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@meonode/ui': new URL('../../../src/main.ts', import.meta.url).pathname,
      '@meonode/ui/nextjs-registry': new URL('../../../src/nextjs-registry/index.ts', import.meta.url).pathname,
      '@src': new URL('../../../src', import.meta.url).pathname,
    }
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias || {}),
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs'],
    }
    return config
  },
}

export default nextConfig
