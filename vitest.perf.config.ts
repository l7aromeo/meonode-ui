import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from './vitest.config'

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      pool: 'forks',
      maxWorkers: 1,
      isolate: true,
      testTimeout: 180_000,
      execArgv: ['--stack-size=10000', '--max-old-space-size=8192', '--expose-gc'],
    },
  }),
)
