export const metadata = { title: 'Training – Beer Pong' }

export default function UebenPage() {
  return (
    <section className="container pb-16 pt-12">
      <section className="section-head">
        <p className="label-kicker">Training</p>
        <h1 className="font-display text-5xl text-slate-950">Wurf-Session im Browser</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Ziehe vom Ball in Zielrichtung, halte fur mehr Power und lass los. Das Spiel bleibt responsiv auf Desktop und Mobile.</p>
      </section>

      <section className="mt-8 surface-card p-3 md:p-5">
        <div className="relative w-full overflow-hidden rounded-2xl h-[68vh] min-h-[420px] max-h-[820px] md:h-[72vh]">
          <iframe
            title="Beer Pong – Ubungsmodus"
            src="/beer-pong/index.html"
            className="absolute inset-0 h-full w-full border-0"
            allow="fullscreen; autoplay; gamepad; accelerometer"
            allowFullScreen
          />
        </div>
      </section>
    </section>
  )
}
