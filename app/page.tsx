// app/page.tsx  (Sponsor-Bereich heller)
import SponsorGrid from '@/components/SponsorGrid'
import Hero from '@/components/Hero'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getTournaments } from '@/utils/tournaments'

export const metadata: Metadata = {
  title: 'Startseite',
  description: 'Das Meier Open mit Turnier-Historie, Sponsoren und Beer Pong Training im Browser.',
}

export default async function Home() {
  const tournaments = await getTournaments()
  const latestYear = tournaments[0]?.year ?? null
  const archiveYears = tournaments.length

  return (
    <div className="space-y-14 pb-16">
      <Hero archiveYears={archiveYears} latestYear={latestYear} />
      <section className="container grid gap-6 md:grid-cols-3">
        <article className="surface-card p-6">
          <p className="label-kicker">Historie</p>
          <h2 className="mt-2 font-display text-2xl">Alle Jahre, ein Blick</h2>
          <p className="mt-2 text-sm text-slate-600">Schneller Zugriff auf Sieger, Galerien und Turnierbaume.</p>
          <Link href="/turniere" className="inline-block mt-5 text-sm font-semibold text-slate-900">Zur Ubersicht</Link>
        </article>
        <article className="surface-card p-6">
          <p className="label-kicker">Community</p>
          <h2 className="mt-2 font-display text-2xl">Partner im Spotlight</h2>
          <p className="mt-2 text-sm text-slate-600">Unsere Sponsoren sichtbar, einheitlich und mobil optimiert.</p>
          <Link href="/sponsoren" className="inline-block mt-5 text-sm font-semibold text-slate-900">Sponsoren ansehen</Link>
        </article>
        <article className="surface-card p-6">
          <p className="label-kicker">Skill-Mode</p>
          <h2 className="mt-2 font-display text-2xl">Training direkt im Browser</h2>
          <p className="mt-2 text-sm text-slate-600">Physikbasiertes Mini-Game fur kurze Sessions.</p>
          <Link href="/ueben" className="inline-block mt-5 text-sm font-semibold text-slate-900">Jetzt trainieren</Link>
        </article>
      </section>

      <section className="container">
        <div className="section-head">
          <p className="label-kicker">Support</p>
          <h2 className="font-display text-4xl text-slate-900">Vielen Dank an unsere Sponsoren</h2>
        </div>
        <div className="mt-7">
          <SponsorGrid />
        </div>
      </section>
    </div>
  )
}
