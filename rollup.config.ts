import { defineConfig, type Plugin } from 'rollup'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import preserveDirectives from 'rollup-plugin-preserve-directives'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))
const externalDeps = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {}), ...Object.keys(pkg.devDependencies || {})]

const entries = {
  main: 'src/main.ts',
  client: 'src/client.ts',
  'nextjs-registry/index': 'src/nextjs-registry/index.ts',
}

const plugins: Plugin[] = [
  resolve(),
  commonjs(),
  preserveDirectives(),
  typescript({
    tsconfig: './tsconfig.build.json',
    declaration: false,
    declarationMap: false,
    outDir: undefined,
  }),
  terser({
    compress: true,
    mangle: true,
  }),
]

export default defineConfig({
  input: entries,
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
