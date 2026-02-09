import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { clearAdminSession, isAdminAuthenticated, isAdminConfigured } from '@/utils/adminAuth'
import { getTournaments, saveTournaments, Tournament, TournamentGalleryImage } from '@/utils/tournaments'

type AdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Admin',
  robots: {
    index: false,
    follow: false,
  },
}

const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024
const MAX_GALLERY_UPLOADS = 20
const ALLOWED_UPLOAD_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const ALLOWED_UPLOAD_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function toText(input: FormDataEntryValue | null) {
  return String(input || '').trim()
}

function toYear(input: FormDataEntryValue | null) {
  return Number(String(input || '').trim())
}

function parseGalleryText(raw: string): TournamentGalleryImage[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [srcPart, ...altParts] = line.split('|')
      const src = (srcPart || '').trim()
      const alt = altParts.join('|').trim() || `Galerie Bild ${index + 1}`
      return { src, alt }
    })
    .filter((item) => item.src.length > 0)
}

function getUploadFileExtension(name: string) {
  return path.extname(name || '').toLowerCase()
}

function validateUpload(file: File) {
  if (file.size <= 0) {
    throw new Error('upload_empty')
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error('upload_size')
  }

  const extension = getUploadFileExtension(file.name || '')
  const mimeType = String(file.type || '').toLowerCase()

  if (!ALLOWED_UPLOAD_EXTENSIONS.has(extension) || !ALLOWED_UPLOAD_MIME_TYPES.has(mimeType)) {
    throw new Error('upload_type')
  }
}

async function storeUpload(file: File, year: number, prefix: string): Promise<string> {
  validateUpload(file)

  const ext = getUploadFileExtension(file.name || '') || '.jpg'
  const safeExt = ALLOWED_UPLOAD_EXTENSIONS.has(ext) ? ext : '.jpg'
  const safePrefix = prefix.replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'image'
  const filename = `${safePrefix}-${Date.now()}-${randomUUID().slice(0, 8)}${safeExt}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', String(year))

  await mkdir(uploadDir, { recursive: true })
  const arrayBuffer = await file.arrayBuffer()
  await writeFile(path.join(uploadDir, filename), Buffer.from(arrayBuffer))

  return `/uploads/${year}/${filename}`
}

async function uploadSingleImage(entry: FormDataEntryValue | null, year: number, prefix: string) {
  if (!(entry instanceof File) || entry.size === 0) {
    return null
  }
  return storeUpload(entry, year, prefix)
}

async function uploadGalleryImages(entries: FormDataEntryValue[], year: number) {
  if (entries.length > MAX_GALLERY_UPLOADS) {
    throw new Error('gallery_limit')
  }

  const uploaded: TournamentGalleryImage[] = []

  for (const entry of entries) {
    if (!(entry instanceof File) || entry.size === 0) {
      continue
    }

    const src = await storeUpload(entry, year, 'gallery')
    const baseName = entry.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
    uploaded.push({ src, alt: baseName || 'Galerie Bild' })
  }

  return uploaded
}

async function requireAuth() {
  if (!isAdminConfigured()) {
    redirect('/admin/login?error=config')
  }

  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login')
  }
}

async function logoutAction() {
  'use server'
  await clearAdminSession()
  redirect('/admin/login')
}

async function saveTournamentAction(formData: FormData) {
  'use server'

  await requireAuth()

  const originalYear = toYear(formData.get('originalYear'))
  const year = toYear(formData.get('year'))

  if (!Number.isInteger(year) || year < 1900 || year > 9999) {
    redirect('/admin?error=year')
  }

  const tournaments = await getTournaments()
  const existingIndex = Number.isInteger(originalYear)
    ? tournaments.findIndex((item) => item.year === originalYear)
    : tournaments.findIndex((item) => item.year === year)
  const existing = existingIndex >= 0 ? tournaments[existingIndex] : null
  const conflict = tournaments.find((item) => item.year === year && item.year !== originalYear)

  if (conflict) {
    redirect('/admin?error=duplicate')
  }

  let uploadedWinner: string | null = null
  let uploadedBracket: string | null = null
  let uploadedGallery: TournamentGalleryImage[] = []

  try {
    uploadedWinner = await uploadSingleImage(formData.get('winnerImageFile'), year, 'winner')
    uploadedBracket = await uploadSingleImage(formData.get('bracketImageFile'), year, 'bracket')
    uploadedGallery = await uploadGalleryImages(formData.getAll('galleryFiles'), year)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'upload'
    if (message === 'upload_size') {
      redirect('/admin?error=upload_size')
    }
    if (message === 'upload_type') {
      redirect('/admin?error=upload_type')
    }
    if (message === 'gallery_limit') {
      redirect('/admin?error=gallery_limit')
    }
    redirect('/admin?error=upload')
  }

  const galleryText = toText(formData.get('gallery'))
  const clearGallery = formData.get('clearGallery') === 'on'
  const parsedGallery = parseGalleryText(galleryText)

  let gallery: TournamentGalleryImage[] = clearGallery ? [] : existing?.gallery || []
  if (parsedGallery.length > 0) {
    gallery = parsedGallery
  }
  if (uploadedGallery.length > 0) {
    gallery = [...gallery, ...uploadedGallery]
  }

  const winnerImage = uploadedWinner || toText(formData.get('winnerImage')) || existing?.winnerImage || ''
  const bracketImage = uploadedBracket || toText(formData.get('bracketImage')) || existing?.bracketImage || ''

  if (!winnerImage || !bracketImage) {
    redirect('/admin?error=images')
  }

  const payload: Tournament = {
    year,
    winnerName: toText(formData.get('winnerName')) || existing?.winnerName || `Siegerteam ${year}`,
    winnerImage,
    winnerAlt: toText(formData.get('winnerAlt')) || existing?.winnerAlt || `Sieger ${year}`,
    bracketImage,
    bracketAlt: toText(formData.get('bracketAlt')) || existing?.bracketAlt || `Turnierbaum ${year}`,
    gallery,
  }

  if (existingIndex >= 0) {
    tournaments[existingIndex] = payload
  } else {
    tournaments.push(payload)
  }

  await saveTournaments(tournaments)

  revalidatePath('/turniere')
  revalidatePath(`/turniere/${year}`)
  revalidatePath('/admin')
  redirect('/admin?saved=1')
}

async function deleteTournamentAction(formData: FormData) {
  'use server'

  await requireAuth()

  const year = toYear(formData.get('year'))
  if (!Number.isInteger(year)) {
    redirect('/admin?error=year')
  }

  const tournaments = await getTournaments()
  const remaining = tournaments.filter((item) => item.year !== year)
  await saveTournaments(remaining)

  revalidatePath('/turniere')
  revalidatePath(`/turniere/${year}`)
  revalidatePath('/admin')
  redirect('/admin?deleted=1')
}

function statusText(params: Record<string, string | string[] | undefined>) {
  if (params.saved === '1') {
    return { tone: 'ok', text: 'Turnier gespeichert.' }
  }
  if (params.deleted === '1') {
    return { tone: 'ok', text: 'Turnier geloescht.' }
  }
  if (params.error === 'duplicate') {
    return { tone: 'error', text: 'Dieses Jahr existiert bereits.' }
  }
  if (params.error === 'year') {
    return { tone: 'error', text: 'Bitte ein gueltiges Jahr verwenden.' }
  }
  if (params.error === 'images') {
    return { tone: 'error', text: 'Siegerbild und Turnierbaum sind Pflichtfelder.' }
  }
  if (params.error === 'upload_size') {
    return { tone: 'error', text: `Datei zu gross. Maximal ${Math.round(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024))} MB pro Bild.` }
  }
  if (params.error === 'upload_type') {
    return { tone: 'error', text: 'Ungueltiger Dateityp. Erlaubt sind JPG, PNG, WEBP und GIF.' }
  }
  if (params.error === 'gallery_limit') {
    return { tone: 'error', text: `Zu viele Galerie-Uploads. Maximal ${MAX_GALLERY_UPLOADS} Dateien pro Speichern.` }
  }
  if (params.error === 'upload') {
    return { tone: 'error', text: 'Upload fehlgeschlagen. Bitte Datei und Typ pruefen.' }
  }
  return null
}

function galleryToTextarea(gallery: TournamentGalleryImage[]) {
  return gallery.map((item) => `${item.src}|${item.alt}`).join('\n')
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await requireAuth()

  const tournaments = await getTournaments()
  const params = await searchParams
  const status = statusText(params)

  return (
    <section className="container space-y-8 pb-16 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label-kicker">Verwaltung</p>
          <h1 className="font-display text-4xl text-slate-950">Admin Turniere</h1>
          <p className="mt-2 text-sm text-slate-600">
            Turniere manuell anlegen und bearbeiten, inklusive Gewinner und Bildpfade oder Uploads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/turniere" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
            Turniere ansehen
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              Logout
            </button>
          </form>
        </div>
      </div>

      {status ? (
        <p
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            status.tone === 'ok'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {status.text}
        </p>
      ) : null}

      <article className="surface-card p-5 md:p-6">
        <h2 className="font-display text-2xl text-slate-950">Neues Turnier anlegen</h2>
        <p className="mt-2 text-sm text-slate-600">
          Galerie-Feld Format: eine Zeile pro Bild im Stil <code>/images/pfad.jpg|Alt Text</code>
        </p>

        <form action={saveTournamentAction} encType="multipart/form-data" className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Jahr
            <input name="year" type="number" min={1900} max={9999} required className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Gewinner
            <input name="winnerName" required className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Gewinnerbild (Pfad oder URL)
            <input name="winnerImage" placeholder="/images/2026-sieger.jpg" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Gewinnerbild Alt-Text
            <input name="winnerAlt" placeholder="Sieger 2026" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Turnierbaum (Pfad oder URL)
            <input name="bracketImage" placeholder="/images/2026-bracket.png" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Turnierbaum Alt-Text
            <input name="bracketAlt" placeholder="Turnierbaum 2026" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" />
          </label>

          <label className="md:col-span-2 text-sm font-semibold text-slate-700">
            Galerie (Zeilenformat: pfad|alt)
            <textarea name="gallery" rows={5} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Gewinnerbild hochladen
            <input name="winnerImageFile" type="file" accept="image/*" className="mt-1 block w-full text-sm" />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Turnierbaum hochladen
            <input name="bracketImageFile" type="file" accept="image/*" className="mt-1 block w-full text-sm" />
          </label>

          <label className="md:col-span-2 text-sm font-semibold text-slate-700">
            Galerie-Bilder hochladen (mehrere moeglich)
            <input name="galleryFiles" type="file" accept="image/*" multiple className="mt-1 block w-full text-sm" />
          </label>

          <div className="md:col-span-2">
            <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              Turnier erstellen
            </button>
          </div>
        </form>
      </article>

      <section className="space-y-5">
        <h2 className="font-display text-3xl text-slate-950">Bestehende Turniere</h2>

        {tournaments.length === 0 ? (
          <p className="surface-card p-5 text-sm text-slate-600">Noch keine Turniere vorhanden.</p>
        ) : null}

        {tournaments.map((item) => (
          <article key={item.year} className="surface-card p-5 md:p-6">
            <h3 className="font-display text-2xl text-slate-900">{item.year}</h3>

            <form action={saveTournamentAction} encType="multipart/form-data" className="mt-4 grid gap-4 md:grid-cols-2">
              <input type="hidden" name="originalYear" value={item.year} />

              <label className="text-sm font-semibold text-slate-700">
                Jahr
                <input name="year" type="number" min={1900} max={9999} required defaultValue={item.year} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Gewinner
                <input name="winnerName" required defaultValue={item.winnerName} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Gewinnerbild (Pfad oder URL)
                <input name="winnerImage" defaultValue={item.winnerImage} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Gewinnerbild Alt-Text
                <input name="winnerAlt" defaultValue={item.winnerAlt} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Turnierbaum (Pfad oder URL)
                <input name="bracketImage" defaultValue={item.bracketImage} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Turnierbaum Alt-Text
                <input name="bracketAlt" defaultValue={item.bracketAlt} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" />
              </label>

              <label className="md:col-span-2 text-sm font-semibold text-slate-700">
                Galerie (Zeilenformat: pfad|alt)
                <textarea name="gallery" rows={5} defaultValue={galleryToTextarea(item.gallery)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Gewinnerbild hochladen
                <input name="winnerImageFile" type="file" accept="image/*" className="mt-1 block w-full text-sm" />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Turnierbaum hochladen
                <input name="bracketImageFile" type="file" accept="image/*" className="mt-1 block w-full text-sm" />
              </label>

              <label className="md:col-span-2 text-sm font-semibold text-slate-700">
                Galerie-Bilder hochladen (mehrere moeglich)
                <input name="galleryFiles" type="file" multiple accept="image/*" className="mt-1 block w-full text-sm" />
              </label>

              <label className="md:col-span-2 inline-flex items-center gap-2 text-sm text-slate-700">
                <input name="clearGallery" type="checkbox" className="h-4 w-4" />
                Galerie vor dem Speichern leeren
              </label>

              <div className="md:col-span-2 flex flex-wrap gap-2">
                <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                  Aenderungen speichern
                </button>
              </div>
            </form>

            <form action={deleteTournamentAction} className="mt-3">
              <input type="hidden" name="year" value={item.year} />
              <button
                type="submit"
                className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                Turnier loeschen
              </button>
            </form>
          </article>
        ))}
      </section>
    </section>
  )
}
