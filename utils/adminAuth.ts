import { createHash, scryptSync, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const ADMIN_COOKIE_NAME = 'meier_admin_session'

type AdminConfig = {
  username: string
  passwordHash: string
  sessionSecret: string
}

function getEnvValue(name: 'ADMIN_USERNAME' | 'ADMIN_PASSWORD_HASH' | 'ADMIN_SESSION_SECRET') {
  const value = process.env[name]
  if (!value) {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function getAdminConfig(): AdminConfig | null {
  const username = getEnvValue('ADMIN_USERNAME')
  const passwordHash = getEnvValue('ADMIN_PASSWORD_HASH')
  const sessionSecret = getEnvValue('ADMIN_SESSION_SECRET')

  if (!username || !passwordHash || !sessionSecret) {
    return null
  }

  return { username, passwordHash, sessionSecret }
}

export function isAdminConfigured() {
  return getAdminConfig() !== null
}

function hashValue(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function getExpectedSessionToken() {
  const config = getAdminConfig()
  if (!config) {
    return null
  }

  return hashValue(`${config.username}:${config.passwordHash}:${config.sessionSecret}`)
}

function verifyScryptPassword(password: string, encodedHash: string) {
  const parts = encodedHash.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    return false
  }

  const n = Number(parts[1])
  const r = Number(parts[2])
  const p = Number(parts[3])
  const saltHex = parts[4]
  const keyHex = parts[5]

  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return false
  }

  if (!saltHex || !keyHex || keyHex.length % 2 !== 0 || saltHex.length % 2 !== 0) {
    return false
  }

  try {
    const expectedKey = Buffer.from(keyHex, 'hex')
    const derivedKey = scryptSync(password, Buffer.from(saltHex, 'hex'), expectedKey.length, {
      N: n,
      r,
      p,
    })
    return derivedKey.length === expectedKey.length && timingSafeEqual(derivedKey, expectedKey)
  } catch {
    return false
  }
}

export function validateAdminCredentials(username: string, password: string) {
  const config = getAdminConfig()
  if (!config) {
    return false
  }

  const expectedUser = Buffer.from(config.username)
  const givenUser = Buffer.from(username)
  if (expectedUser.length !== givenUser.length || !timingSafeEqual(expectedUser, givenUser)) {
    return false
  }

  if (!verifyScryptPassword(password, config.passwordHash)) {
    return false
  }

  return true
}

export async function isAdminAuthenticated() {
  const store = await cookies()
  const token = store.get(ADMIN_COOKIE_NAME)?.value

  if (!token) {
    return false
  }

  const expected = getExpectedSessionToken()
  if (!expected) {
    return false
  }

  const expectedBuffer = Buffer.from(expected)
  const tokenBuffer = Buffer.from(token)

  return expectedBuffer.length === tokenBuffer.length && timingSafeEqual(expectedBuffer, tokenBuffer)
}

export async function createAdminSession() {
  const expectedToken = getExpectedSessionToken()
  if (!expectedToken) {
    throw new Error('admin_not_configured')
  }

  const store = await cookies()
  store.set(ADMIN_COOKIE_NAME, expectedToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  })
}

export async function clearAdminSession() {
  const store = await cookies()
  store.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}
