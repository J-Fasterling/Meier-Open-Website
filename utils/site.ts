const FALLBACK_SITE_URL = 'http://localhost:3000'

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim()
  if (!raw) {
    return FALLBACK_SITE_URL
  }

  try {
    return new URL(raw).origin
  } catch {
    return FALLBACK_SITE_URL
  }
}
