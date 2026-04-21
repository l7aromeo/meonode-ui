import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const CLIENT_FILES = [
  'dist/esm/components/theme-provider.client.js',
  'dist/esm/components/portal-provider.client.js',
  'dist/esm/components/portal-host.client.js',
  'dist/esm/components/style-registry.client.js',
  'dist/esm/components/styled-renderer.client.js',
  'dist/esm/components/meonode-unmounter.client.js',
  'dist/esm/hook/useDataChannel.js',
  'dist/esm/hook/usePortal.js',
  'dist/esm/hook/useTheme.js',
  'dist/cjs/components/theme-provider.client.cjs',
  'dist/cjs/components/portal-provider.client.cjs',
  'dist/cjs/components/portal-host.client.cjs',
  'dist/cjs/components/style-registry.client.cjs',
  'dist/cjs/components/styled-renderer.client.cjs',
  'dist/cjs/components/meonode-unmounter.client.cjs',
  'dist/cjs/hook/useDataChannel.cjs',
  'dist/cjs/hook/usePortal.cjs',
  'dist/cjs/hook/useTheme.cjs',
]

describe('build output: "use client" directive preservation', () => {
  beforeAll(() => {
    const distExists = existsSync(path.join(ROOT, 'dist/esm/main.js'))
    if (!distExists) {
      execSync('bun run build', { cwd: ROOT, stdio: 'inherit' })
    }
  }, 300_000)

  it.each(CLIENT_FILES)('%s starts with "use client"', rel => {
    const abs = path.join(ROOT, rel)
    expect(existsSync(abs)).toBe(true)
    const contents = readFileSync(abs, 'utf8')
    // Directive must be the first non-whitespace token. Match both quote styles
    // and allow the minified output to compress whitespace.
    expect(contents.trimStart()).toMatch(/^['"]use client['"]/)
  })
})
