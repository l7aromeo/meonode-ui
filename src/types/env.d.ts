export {}

declare global {
  const process: {
    env: {
      NODE_ENV: 'development' | 'production' | 'test'
    }
  }
}
