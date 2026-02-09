import Image from 'next/image'

const sponsors = [
  { file: 'Wolters_Logo.png', alt: 'Wolters Brauerei' },
  { file: 'Redcupshop.png', alt: 'RedCupShop' },
  { file: 'MEGA.png', alt: 'MEGA' }
  // weitere Sponsoren hier ergänzen …
]

export default function SponsorGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {sponsors.map((s) => (
        <article key={s.file} className="surface-card flex min-h-[150px] items-center justify-center p-6 transition-transform duration-300 hover:-translate-y-1">
          <Image
            src={`/sponsors/${s.file}`}
            alt={s.alt}
            width={220}
            height={110}
            sizes="(max-width: 1024px) 45vw, 220px"
            className="h-auto w-auto max-h-[84px] object-contain"
          />
        </article>
      ))}
    </div>
  )
}
