import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import TournamentRecap from '@/components/TournamentRecap'
import { getTournamentByYear, getTournaments } from '@/utils/tournaments'

type TournamentPageProps = {
  params: Promise<{ year: string }>
}

export const revalidate = 3600

export async function generateStaticParams() {
  const tournaments = await getTournaments()
  return tournaments.map((tournament) => ({ year: String(tournament.year) }))
}

export async function generateMetadata({ params }: TournamentPageProps): Promise<Metadata> {
  const { year } = await params
  const parsedYear = Number(year)
  const tournament = Number.isInteger(parsedYear) ? await getTournamentByYear(parsedYear) : null

  if (!tournament) {
    return {
      title: `Turnier ${year}`,
      description: `Ruckblick auf das Meier Open Jahr ${year}.`,
    }
  }

  return {
    title: `Turnier ${tournament.year}`,
    description: `Ruckblick ${tournament.year}: Siegerteam ${tournament.winnerName}, Galerie und Turnierbaum.`,
  }
}

export default async function TournamentPage({ params }: TournamentPageProps) {
  const { year } = await params
  const parsedYear = Number(year)

  if (!Number.isInteger(parsedYear)) {
    notFound()
  }

  const tournament = await getTournamentByYear(parsedYear)

  if (!tournament) {
    notFound()
  }

  return (
    <TournamentRecap
      year={tournament.year}
      winnerName={tournament.winnerName}
      winnerImage={tournament.winnerImage}
      winnerAlt={tournament.winnerAlt}
      bracketImage={tournament.bracketImage}
      bracketAlt={tournament.bracketAlt}
      gallery={tournament.gallery}
    />
  )
}
