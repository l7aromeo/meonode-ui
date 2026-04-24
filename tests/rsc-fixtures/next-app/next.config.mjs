import { URL } from 'node:url'

// Widen Turbopack's compile scope to the repo root so files under ../../../src are
// reachable (the webpack equivalent was `experimental.externalDir`).
const workspaceRoot = new URL('../../..', import.meta.url).pathname

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  turbopack: {
    root: workspaceRoot,
    // Point at the built dist so Turbopack never has to rewrite `.js` → `.ts`
    // (it has no webpack-style `extensionAlias`). `globalSetup.rsc.ts` runs
    // `bun run build` before the suite, so dist/esm is always current.
    resolveAlias: {
      '@meonode/ui': '../../../dist/esm/main.js',
      '@meonode/ui/nextjs-registry': '../../../dist/esm/nextjs-registry/index.js',
    },
  },
}

export default nextConfig
