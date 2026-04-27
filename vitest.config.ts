import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./jest.setup.ts'],
    include: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    alias: {
      '@src': path.resolve(rootDir, 'src'),
      '@tests': path.resolve(rootDir, 'tests'),
    },
  },
})
