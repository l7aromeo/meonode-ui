const config = {
  preset: 'ts-jest/presets/default-esm', // ✅ works if you’re on ts-jest >=29
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/test/**/*.test.ts', '<rootDir>/test/**/*.spec.ts'],
  moduleNameMapper: { '^@src/(.*)\\.js$': '<rootDir>/src/$1.ts' },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  fakeTimers: {
    enableGlobally: true,
  },
  verbose: true,
  snapshotSerializers: [
    '@emotion/jest/serializer'
  ]
}

export default config
