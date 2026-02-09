import Link from 'next/link'
import type { Metadata } from 'next'
import { getTournaments } from '@/utils/tournaments'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Turniere',
  description: 'Alle Meier Open Jahrgaenge mit Siegerteam, Galerie und Turnierbaum.',
}

export default async function Turniere() {
  const tournaments = await getTournaments()
  return (
    <section className="container pb-16 pt-12">
      <div className="section-head">
        <p className="label-kicker">Archiv</p>
        <h1 className="font-display text-5xl text-slate-950">Turnier-Historie</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Alle Jahrgange als schnelle Kartenansicht. Klick auf ein Jahr fur Ergebnisse, Galerie und Turnierbaum.</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {tournaments.map((tournament, index) => (
          <Link
            key={tournament.year}
            href={`/turniere/${tournament.year}`}
            className="surface-card group p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(8,13,20,0.12)]"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Season {index + 1}</p>
            <p className="mt-2 font-display text-4xl text-slate-950">{tournament.year}</p>
            <p className="mt-4 text-sm text-slate-600">{tournament.winnerName || 'Ergebnisse, Bilder und Storys'}</p>
            <p className="mt-6 text-sm font-semibold text-slate-900">Ansehen</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
