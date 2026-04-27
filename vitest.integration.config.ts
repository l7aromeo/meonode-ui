import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['./tests/rsc-integration.test.ts', './tests/build-output.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    globalSetup: ['./tests/globalSetup.rsc.ts'],
    teardownTimeout: 120_000,
    testTimeout: 120_000,
    alias: {
      '@src': path.resolve(rootDir, 'src'),
      '@tests': path.resolve(rootDir, 'tests'),
    },
  },
})
