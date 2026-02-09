import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Meier Open',
    short_name: 'Meier Open',
    description: 'Offizielle Website des Meier Open Bierpong-Turniers',
    start_url: '/',
    display: 'standalone',
    background_color: '#eef2f7',
    theme_color: '#dd3b2a',
    lang: 'de',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
