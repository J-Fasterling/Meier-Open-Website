import Image from 'next/image'
import Link from 'next/link'
import SponsorGrid from '@/components/SponsorGrid'

type TournamentRecapProps = {
  year: number
  winnerName: string
  winnerImage: string
  winnerAlt: string
  bracketImage: string
  bracketAlt: string
  gallery: { src: string; alt: string }[]
}

function shouldBypassImageOptimization(src: string) {
  return /^https?:\/\//i.test(src)
}

export default function TournamentRecap({
  year,
  winnerName,
  winnerImage,
  winnerAlt,
  bracketImage,
  bracketAlt,
  gallery,
}: TournamentRecapProps) {
  return (
    <section className="container space-y-10 pb-16 pt-10">
      <Link href="/turniere" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950">
        <span aria-hidden>←</span>
        Zuruck zur Ubersicht
      </Link>

      <div className="section-head">
        <p className="label-kicker">Ruckblick</p>
        <h1 className="font-display text-5xl text-slate-950">{year}</h1>
      </div>

      <article className="surface-card p-4 md:p-6">
        <h2 className="font-display text-2xl text-slate-950">Siegerteam</h2>
        <p className="mt-2 text-sm font-semibold text-slate-600">{winnerName}</p>
        <Image
          src={winnerImage}
          alt={winnerAlt}
          width={1200}
          height={750}
          unoptimized={shouldBypassImageOptimization(winnerImage)}
          priority
          sizes="(max-width: 1024px) 100vw, 980px"
          className="mt-4 w-full rounded-2xl object-cover"
        />
      </article>

      <article className="surface-card p-4 md:p-6">
        <h2 className="font-display text-2xl text-slate-950">Turnierbaum</h2>
        <Image
          src={bracketImage}
          alt={bracketAlt}
          width={1200}
          height={900}
          unoptimized={shouldBypassImageOptimization(bracketImage)}
          sizes="(max-width: 1024px) 100vw, 980px"
          className="mt-4 w-full rounded-2xl object-cover"
        />
      </article>

      <article className="surface-card p-4 md:p-6">
        <h2 className="font-display text-2xl text-slate-950">Galerie</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {gallery.map((item) => (
            <Image
              key={`${item.src}-${item.alt}`}
              src={item.src}
              alt={item.alt}
              width={480}
              height={360}
              unoptimized={shouldBypassImageOptimization(item.src)}
              sizes="(max-width: 1024px) 48vw, 240px"
              className="h-full w-full rounded-xl object-cover"
            />
          ))}
        </div>
      </article>

      <section className="pt-2">
        <h2 className="font-display text-3xl text-slate-950">Sponsoren</h2>
        <div className="mt-5">
          <SponsorGrid />
        </div>
      </section>
    </section>
  )
}
