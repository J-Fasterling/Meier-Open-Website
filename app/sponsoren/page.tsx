import SponsorGrid from '@/components/SponsorGrid'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sponsoren',
  description: 'Partner und Sponsoren des Meier Open Bierpong-Turniers.',
}

export default function Sponsoren() {
  return (
    <section className="container pb-16 pt-12">
      <div className="section-head">
        <p className="label-kicker">Partner</p>
        <h1 className="font-display text-5xl text-slate-950">Unsere Sponsoren</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Marken, die das Turnier moglich machen. Danke fur Support, Reichweite und gute Energie.</p>
      </div>

      <div className="mt-8">
        <SponsorGrid />
      </div>
    </section>
  )
}
