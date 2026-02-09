import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/utils/site'
import { getTournaments } from '@/utils/tournaments'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const now = new Date()

  const staticRoutes = ['/', '/turniere', '/sponsoren', '/ueben']
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: new URL(route, siteUrl).toString(),
    lastModified: now,
  }))

  const tournaments = await getTournaments()
  const tournamentEntries: MetadataRoute.Sitemap = tournaments.map((tournament) => ({
    url: new URL(`/turniere/${tournament.year}`, siteUrl).toString(),
    lastModified: now,
  }))

  return [...staticEntries, ...tournamentEntries]
}
