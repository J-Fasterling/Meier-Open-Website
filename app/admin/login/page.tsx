import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { createAdminSession, isAdminAuthenticated, isAdminConfigured, validateAdminCredentials } from '@/utils/adminAuth'
import {
  clearLoginRateLimit,
  createLoginRateLimitKey,
  getLoginRateLimitStatus,
  recordFailedLoginAttempt,
} from '@/utils/loginRateLimit'

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Admin Login',
  robots: {
    index: false,
    follow: false,
  },
}

async function loginAction(formData: FormData) {
  'use server'

  if (!isAdminConfigured()) {
    redirect('/admin/login?error=config')
  }

  const username = String(formData.get('username') || '').trim()
  const password = String(formData.get('password') || '')
  const headerStore = await headers()
  const rateLimitKey = createLoginRateLimitKey({
    forwardedFor: headerStore.get('x-forwarded-for'),
    realIp: headerStore.get('x-real-ip'),
    username,
  })
  const rateLimitStatus = getLoginRateLimitStatus(rateLimitKey)

  if (!rateLimitStatus.allowed) {
    redirect(`/admin/login?error=rate&retry=${rateLimitStatus.retryAfterSec}`)
  }

  if (!validateAdminCredentials(username, password)) {
    recordFailedLoginAttempt(rateLimitKey)
    const nextStatus = getLoginRateLimitStatus(rateLimitKey)
    if (!nextStatus.allowed) {
      redirect(`/admin/login?error=rate&retry=${nextStatus.retryAfterSec}`)
    }
    redirect('/admin/login?error=1')
  }

  clearLoginRateLimit(rateLimitKey)
  await createAdminSession()
  redirect('/admin')
}

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  if (await isAdminAuthenticated()) {
    redirect('/admin')
  }

  const params = await searchParams
  const hasError = params.error === '1'
  const hasConfigError = params.error === 'config'
  const hasRateError = params.error === 'rate'
  const retryAfter = Number(params.retry)
  const retryAfterMinutes = Number.isFinite(retryAfter)
    ? Math.max(1, Math.ceil(retryAfter / 60))
    : 15
  const configured = isAdminConfigured()

  return (
    <section className="container py-14">
      <div className="mx-auto w-full max-w-md surface-card p-6 md:p-8">
        <p className="label-kicker">Admin</p>
        <h1 className="mt-2 font-display text-3xl text-slate-950">Login</h1>
        <p className="mt-2 text-sm text-slate-600">
          Melde dich an, um Turniere inkl. Bilder und Gewinner zu pflegen.
        </p>

        {hasConfigError ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Admin-Zugang ist nicht konfiguriert. Bitte setze `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` und `ADMIN_SESSION_SECRET`.
          </p>
        ) : null}

        {hasError ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Login fehlgeschlagen. Bitte Zugangsdaten pruefen.
          </p>
        ) : null}
        {hasRateError ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Zu viele Fehlversuche. Bitte in etwa {retryAfterMinutes} Minute(n) erneut versuchen.
          </p>
        ) : null}

        {configured ? (
          <form action={loginAction} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Benutzername
              <input
                name="username"
                required
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Passwort
              <input
                name="password"
                type="password"
                required
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Einloggen
            </button>
          </form>
        ) : null}

        <Link href="/" className="mt-5 inline-block text-sm font-semibold text-slate-700 hover:text-slate-950">
          Zur Startseite
        </Link>
      </div>
    </section>
  )
}
