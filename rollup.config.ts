import { defineConfig, type Plugin } from 'rollup'
import alias from '@rollup/plugin-alias'
import nodeResolve from '@rollup/plugin-node-resolve'
import preserveDirectives from 'rollup-plugin-preserve-directives'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import esbuild from 'rollup-plugin-esbuild'
import { readFileSync } from 'fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))
const externalDeps = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {}), ...Object.keys(pkg.devDependencies || {})]

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SRC_DIR = path.resolve(__dirname, 'src')

const input = {
  main: 'src/main.ts',
  client: 'src/client.ts',
  'nextjs-registry/index': 'src/nextjs-registry/index.ts',
}

const plugins: Plugin[] = [
  alias({
    entries: [{ find: '@src', replacement: SRC_DIR }],
  }),
  preserveDirectives(),
  typescript({
    tsconfig: './tsconfig.build.json',
    declaration: false,
    declarationMap: false,
    outDir: undefined,
  }),
  nodeResolve({
    extensions: ['.mjs', '.js', '.json', '.ts', '.tsx'],
  }),
  commonjs(),
  esbuild({
    target: 'es2020',
    sourceMap: true,
    tsconfig: path.resolve(__dirname, 'tsconfig.build.json'),
  }),
  terser({
    compress: true,
    mangle: true,
  }),
]

export default defineConfig({
  input,
  output: [
    {
      dir: 'dist/esm',
      format: 'esm',
      preserveModules: true,
      preserveModulesRoot: 'src',
      entryFileNames: '[name].js',
      strict: true,
    },
    {
      dir: 'dist/cjs',
      format: 'cjs',
      preserveModules: true,
      preserveModulesRoot: 'src',
      entryFileNames: '[name].cjs',
      exports: 'named',
      strict: true,
    },
  ],
  plugins,
  external: (id: string) => {
    // Exclude dependencies and their subpaths
    return externalDeps.some(dep => id === dep || id.startsWith(`${dep}/`))
  },
  onwarn: warning => {
    if (warning.code === 'CIRCULAR_DEPENDENCY') return
    if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
  },
})
