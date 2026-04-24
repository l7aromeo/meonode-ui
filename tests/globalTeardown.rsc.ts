import { existsSync, readFileSync, unlinkSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const PID_FILE = path.resolve(ROOT, 'tests/rsc-fixtures/.rsc-server-pid')
const PORT_FILE = path.resolve(ROOT, 'tests/rsc-fixtures/.rsc-server-port')

async function wait(ms: number) {
  await new Promise(r => setTimeout(r, ms))
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

export default async function globalTeardown() {
  if (!existsSync(PID_FILE)) return
  const pid = parseInt(readFileSync(PID_FILE, 'utf8').trim(), 10)
  if (!Number.isFinite(pid)) {
    unlinkSync(PID_FILE)
    return
  }

  // Try SIGTERM, then SIGKILL. Also kill process group for spawned children.
  try {
    process.kill(-pid, 'SIGTERM')
  } catch {
    try {
      process.kill(pid, 'SIGTERM')
    } catch {
      // already gone
    }
  }

  for (let i = 0; i < 10 && isAlive(pid); i++) {
    await wait(200)
  }

  if (isAlive(pid)) {
    try {
      process.kill(-pid, 'SIGKILL')
    } catch {
      try {
        process.kill(pid, 'SIGKILL')
      } catch {
        // already gone
      }
    }
  }

  try {
    unlinkSync(PID_FILE)
  } catch {
    /* ignore */
  }
  try {
    unlinkSync(PORT_FILE)
  } catch {
    /* ignore */
  }
}
