import path from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig, type Plugin } from 'vitest/config'
import baseConfig from './vitest.config'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

/**
 * Where to find the compiler's wasm artifact.
 *
 * Prefers the published package, falls back to a sibling checkout so the
 * compiler can be exercised before release. Resolved lazily and reported
 * clearly, because a silently-missing plugin would make this whole config a
 * no-op that reports "all compiled tests pass" while compiling nothing.
 */
function resolveWasm(): string {
  const candidates = [
    path.resolve(rootDir, 'node_modules/@meonode/compiler/meonode_swc_plugin.wasm'),
    path.resolve(rootDir, '../compiler/npm/meonode_swc_plugin.wasm'),
  ]
  const found = candidates.find(existsSync)
  if (!found) {
    throw new Error(`Compiled test mode needs the @meonode/compiler wasm artifact. Looked in:\n  ${candidates.join('\n  ')}`)
  }
  return found
}

/**
 * Runs `@meonode/ui` sources and the test files themselves through the real
 * SWC plugin, so every existing suite — theming, memoization, portals, RSC —
 * runs a second time against *compiled* call sites.
 *
 * Both are transformed on purpose. Compiling only `src` would leave the tests
 * constructing nodes the uncompiled way, which is the shape already covered.
 * The point is to exercise the marker contract through the same assertions.
 */
function meonodeCompilerPlugin(): Plugin {
  const wasm = resolveWasm()
  let transformed = 0

  return {
    name: 'meonode-compiler',
    enforce: 'pre',
    async transform(code, id) {
      if (!/\.tsx?$/.test(id)) return null
      if (id.includes('/node_modules/')) return null
      if (!id.includes(`${path.sep}src${path.sep}`) && !id.includes(`${path.sep}tests${path.sep}`)) return null
      // Cheap prefilter: only files that actually construct nodes can compile.
      if (!code.includes('@meonode/ui') && !code.includes('@src/main.js')) return null

      const { transform } = await import('@swc/core')
      const result = await transform(code, {
        filename: id,
        sourceMaps: true,
        jsc: {
          target: 'es2022',
          parser: { syntax: 'typescript', tsx: id.endsWith('.tsx') },
          experimental: {
            // The suite imports factories from `@src/main.js`, not the literal
            // `@meonode/ui` specifier the plugin traces by default, so those
            // modules have to be named explicitly or almost nothing compiles.
            plugins: [[wasm, { factoryModules: ['@src/main.js', '@src/client.js', '@meonode/ui'] }]],
          },
        },
      })
      if (result.code.includes('__meo$')) transformed++
      return { code: result.code, map: result.map }
    },
    buildEnd() {
      // Non-vacuity guard. If the plugin silently compiled nothing, this mode
      // is just a slower copy of the default run and must not pass quietly.
      if (transformed === 0) {
        throw new Error('meonode-compiler transformed no call sites — compiled test mode would be vacuous.')
      }

      console.log(`[meonode-compiler] emitted markers into ${transformed} file(s)`)
    },
  }
}

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [meonodeCompilerPlugin()],
    test: {
      // The compiler rewrites `@meonode/ui` factory calls; aliasing `@src`
      // means the library's own sources compile too, not just the tests.
      alias: { '@src': path.resolve(rootDir, 'src') },
      // Lets a test tell which mode it is running under. A few assertions are
      // legitimately mode-specific: uncompiled keys are derived from props, so
      // structurally identical nodes share one, while compiled keys come from
      // source position and never do.
      env: { MEONODE_COMPILED: '1' },
    },
  }),
)
