import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  moduleNameMapper: {
    '^@src/(.*)\\.js$': '<rootDir>/src/$1.ts',
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)\\.js$': '<rootDir>/tests/$1.ts',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
  extensionsToTreatAsEsm: ['.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: './tsconfig.json',
      },
    ],
  },
  coveragePathIgnorePatterns: ['/node_modules/', '<rootDir>/dist/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  injectGlobals: true,
}

export default config
