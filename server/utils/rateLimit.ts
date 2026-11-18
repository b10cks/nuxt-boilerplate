import type { H3Event } from 'h3'
import { getRequestHeader } from 'h3'

const MAX_TRACKED_KEYS = 10_000
const PRIVATE_ADDRESS = /^(::ffff:)?(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)|^::1$|^f[cd]/i

const windows = new Map<string, { count: number; resetAt: number }>()

/**
 * Fixed-window limit held in memory, per server instance. Returns true while
 * the request is allowed. When too many keys are live it refuses new ones, so
 * a visitor rotating addresses cannot grow the map without bound.
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  let entry = windows.get(key)

  if (!entry || entry.resetAt <= now) {
    if (windows.size >= MAX_TRACKED_KEYS) {
      for (const [tracked, { resetAt }] of windows) {
        if (resetAt <= now) windows.delete(tracked)
      }
      if (windows.size >= MAX_TRACKED_KEYS) return false
    }
    entry = { count: 0, resetAt: now + windowMs }
    windows.set(key, entry)
  }

  entry.count++
  return entry.count <= max
}

/**
 * The address to rate limit a request by. A visitor can send any
 * `X-Forwarded-For`, and a proxy appends the peer it saw, so only the last
 * value can be trusted, and only when the request came through a proxy: a
 * private peer, or no socket at all on a serverless host. A public peer talked
 * to this server directly and is the client itself.
 */
export function rateLimitAddress(event: H3Event): string {
  const peer = event.node.req.socket?.remoteAddress
  if (peer && !PRIVATE_ADDRESS.test(peer)) return peer

  const forwarded = getRequestHeader(event, 'x-forwarded-for')?.split(',').at(-1)?.trim()
  return forwarded || peer || 'unknown'
}
