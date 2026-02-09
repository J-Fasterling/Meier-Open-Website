type LoginRateLimitStatus = {
  allowed: boolean
  retryAfterSec: number
}

type AttemptEntry = {
  count: number
  firstFailedAt: number
  blockedUntil: number
}

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000
const BLOCK_MS = 15 * 60 * 1000
const attemptsByKey = new Map<string, AttemptEntry>()

function cleanupExpiredEntries(now: number) {
  if (attemptsByKey.size < 500) {
    return
  }

  for (const [key, entry] of attemptsByKey.entries()) {
    if (entry.blockedUntil <= now && now - entry.firstFailedAt > WINDOW_MS) {
      attemptsByKey.delete(key)
    }
  }
}

function normalizeClientIp(forwardedFor: string | null, realIp: string | null) {
  const candidate = (forwardedFor?.split(',')[0] || realIp || 'unknown').trim()
  return candidate || 'unknown'
}

export function createLoginRateLimitKey(input: {
  forwardedFor: string | null
  realIp: string | null
  username: string
}) {
  const ip = normalizeClientIp(input.forwardedFor, input.realIp)
  const normalizedUser = input.username.trim().toLowerCase() || 'unknown'
  return `${ip}:${normalizedUser}`
}

export function getLoginRateLimitStatus(key: string): LoginRateLimitStatus {
  const now = Date.now()
  cleanupExpiredEntries(now)

  const entry = attemptsByKey.get(key)
  if (!entry) {
    return { allowed: true, retryAfterSec: 0 }
  }

  if (entry.blockedUntil > now) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.blockedUntil - now) / 1000) }
  }

  return { allowed: true, retryAfterSec: 0 }
}

export function recordFailedLoginAttempt(key: string) {
  const now = Date.now()
  const current = attemptsByKey.get(key)

  if (!current || now - current.firstFailedAt > WINDOW_MS) {
    attemptsByKey.set(key, {
      count: 1,
      firstFailedAt: now,
      blockedUntil: 0,
    })
    return
  }

  const nextCount = current.count + 1
  const blockedUntil = nextCount >= MAX_ATTEMPTS ? now + BLOCK_MS : current.blockedUntil

  attemptsByKey.set(key, {
    count: nextCount,
    firstFailedAt: current.firstFailedAt,
    blockedUntil,
  })
}

export function clearLoginRateLimit(key: string) {
  attemptsByKey.delete(key)
}
