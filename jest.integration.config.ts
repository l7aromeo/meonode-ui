import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/rsc-integration.test.ts', '<rootDir>/tests/build-output.test.ts'],
  globalSetup: '<rootDir>/tests/globalSetup.rsc.ts',
  globalTeardown: '<rootDir>/tests/globalTeardown.rsc.ts',
  testTimeout: 120_000,
  moduleNameMapper: {
    '^@src/(.*)\\.js$': '<rootDir>/src/$1.ts',
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)\\.js$': '<rootDir>/tests/$1.ts',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: './tsconfig.jest.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  injectGlobals: true,
}

export default config
