import { execSync, spawn } from 'node:child_process'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { createServer } from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import globalTeardown from './globalTeardown.rsc.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const FIXTURE = path.resolve(ROOT, 'tests/rsc-fixtures/next-app')
const PID_FILE = path.resolve(ROOT, 'tests/rsc-fixtures/.rsc-server-pid')
const PORT_FILE = path.resolve(ROOT, 'tests/rsc-fixtures/.rsc-server-port')

async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer()
    srv.listen(0, () => {
      const addr = srv.address()
      if (typeof addr === 'object' && addr) {
        const port = addr.port
        srv.close(() => resolve(port))
      } else {
        srv.close(() => reject(new Error('Failed to get free port')))
      }
    })
    srv.on('error', reject)
  })
}

function killStaleServer() {
  if (!existsSync(PID_FILE)) return
  const pid = parseInt(readFileSync(PID_FILE, 'utf8').trim(), 10)
  if (!Number.isFinite(pid)) return
  try {
    process.kill(pid, 'SIGTERM')

    console.log(`[rsc-setup] killed stale next dev pid=${pid}`)
  } catch {
    // already dead
  }
}

async function waitForReady(port: number, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs
  let lastErr: unknown
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${port}/`)
      if (res.status >= 200 && res.status < 500) {
        return
      }
      lastErr = new Error(`status ${res.status}`)
    } catch (e) {
      lastErr = e
    }
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error(`next dev did not become ready on :${port} within ${timeoutMs}ms. Last error: ${lastErr}`)
}

export async function setup() {
  killStaleServer()

  console.log('[rsc-setup] building @meonode/ui dist (bun run build)…')
  // Avoid recursive test loop: `build` runs `prebuild`, and `prebuild` includes `test:rsc`.
  execSync('bun run build', { cwd: ROOT, stdio: 'inherit' })

  console.log('[rsc-setup] installing fixture deps…')
  // The linked workspace package can change after dist rebuild; keep fixture install fresh.
  execSync('bun install', { cwd: FIXTURE, stdio: 'inherit' })

  const port = await getFreePort()

  console.log(`[rsc-setup] spawning next dev on :${port}…`)

  const proc = spawn('bunx', ['next', 'dev', '-p', String(port)], {
    cwd: FIXTURE,
    stdio: ['ignore', 'inherit', 'inherit'],
    detached: true,
  })
  proc.unref()

  if (!proc.pid) throw new Error('failed to spawn next dev')
  writeFileSync(PID_FILE, String(proc.pid))
  writeFileSync(PORT_FILE, String(port))
  process.env.__RSC_FIXTURE_PORT__ = String(port)

  await waitForReady(port, 90_000)

  console.log('[rsc-setup] next dev ready')
}

export const teardown = globalTeardown
