// components/Hero.tsx
import Image from 'next/image'
import Link from 'next/link'
import CupDividerSvg from '@/components/CupDividerSvg'
import BeerPongEasterEgg from '@/components/BeerPongEasterEgg'

type HeroProps = {
  archiveYears: number
  latestYear: number | null
}

export default function Hero({ archiveYears, latestYear }: HeroProps) {
  const latestRecapHref = latestYear ? `/turniere/${latestYear}` : '/turniere'
  const latestRecapLabel = latestYear ? `Ruckblick ${latestYear}` : 'Turnier-Ruckblick'

  return (
    <section className="hero relative overflow-visible">
      <Image
        src="/hero.jpg"
        alt="Gruppenbild Meier Open"
        fill
        sizes="(max-width: 1024px) 100vw, 1200px"
        priority
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,13,20,0.12)_0%,rgba(8,13,20,0.8)_68%,rgba(8,13,20,0.96)_100%)]" />
      <div className="container relative z-20 flex min-h-[78vh] flex-col items-center justify-center text-center text-white">
        <p className="badge-chip animate-[fadeUp_520ms_ease-out_both]">Bierpong trifft Festival-Vibe</p>
        <h1 className="mt-5 font-display text-5xl md:text-7xl drop-shadow-lg animate-[fadeUp_760ms_ease-out_both]">
          Meier Open 2026
        </h1>
        <p className="mt-6 max-w-2xl text-base text-white/85 md:text-lg animate-[fadeUp_950ms_ease-out_both]">
          Ergebnisse, Highlights und Training an einem Ort. Schnell, klar und gemacht fur alle, die den Cup nie aus den Augen lassen.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4 animate-[fadeUp_1150ms_ease-out_both]">
          <Link href={latestRecapHref} className="btn-cta">{latestRecapLabel}</Link>
          <Link href="/turniere" className="btn-secondary">Alle Turniere</Link>
          <Link href="/ueben" className="btn-secondary">Jetzt trainieren</Link>
        </div>
        <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-3 animate-[fadeUp_1300ms_ease-out_both]">
          <article className="glass-card p-4">
            <p className="text-2xl font-display">{archiveYears}</p>
            <p className="text-sm text-white/75">Jahrgange im Archiv</p>
          </article>
          <article className="glass-card p-4">
            <p className="text-2xl font-display">10</p>
            <p className="text-sm text-white/75">Cups im Zielmodus</p>
          </article>
          <article className="glass-card p-4">
            <p className="text-2xl font-display">100%</p>
            <p className="text-sm text-white/75">Fokus auf Spielspass</p>
          </article>
        </div>
      </div>
      <div id="beer-egg-wrap" className="absolute bottom-0 left-0 z-30 h-[104px] w-full" aria-hidden>
        <div className="mx-auto max-w-[900px] h-full opacity-0 pointer-events-none select-none">
          <CupDividerSvg />
        </div>
        <BeerPongEasterEgg durationSec={2.1} gravity={1950} />
      </div>
    </section>
  )
}
