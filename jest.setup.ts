import '@testing-library/jest-dom/vitest'
import { TextEncoder, TextDecoder } from 'util'

// Polyfills for React Router
import 'whatwg-fetch'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as typeof global.TextDecoder
