import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type TournamentGalleryImage = {
  src: string
  alt: string
}

export type Tournament = {
  year: number
  winnerName: string
  winnerImage: string
  winnerAlt: string
  bracketImage: string
  bracketAlt: string
  gallery: TournamentGalleryImage[]
}

const DATA_DIR = path.join(process.cwd(), 'data')
const TOURNAMENTS_FILE = path.join(DATA_DIR, 'tournaments.json')
const MIN_YEAR = 1900
const MAX_YEAR = 9999

function sortByYearDesc(tournaments: Tournament[]) {
  return [...tournaments].sort((a, b) => b.year - a.year)
}

function sanitizeTournament(input: Tournament): Tournament | null {
  const year = Number(input.year)
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    return null
  }

  const winnerName = String(input.winnerName || '').trim() || `Siegerteam ${year}`
  const winnerImage = String(input.winnerImage || '').trim()
  const bracketImage = String(input.bracketImage || '').trim()
  if (!winnerImage || !bracketImage) {
    return null
  }

  const winnerAlt = String(input.winnerAlt || '').trim() || `Sieger ${year}`
  const bracketAlt = String(input.bracketAlt || '').trim() || `Turnierbaum ${year}`
  const gallery = (Array.isArray(input.gallery) ? input.gallery : [])
    .map((item) => ({
      src: String(item.src || '').trim(),
      alt: String(item.alt || '').trim(),
    }))
    .filter((item) => item.src.length > 0)

  return {
    year,
    winnerName,
    winnerImage,
    winnerAlt,
    bracketImage,
    bracketAlt,
    gallery,
  }
}

function sanitizeTournamentList(inputs: Tournament[]) {
  const seenYears = new Set<number>()
  const clean: Tournament[] = []

  for (const entry of sortByYearDesc(inputs)) {
    const sanitized = sanitizeTournament(entry)
    if (!sanitized || seenYears.has(sanitized.year)) {
      continue
    }
    seenYears.add(sanitized.year)
    clean.push(sanitized)
  }

  return clean
}

export async function getTournaments(): Promise<Tournament[]> {
  await mkdir(DATA_DIR, { recursive: true })

  let raw: string
  try {
    raw = await readFile(TOURNAMENTS_FILE, 'utf8')
  } catch {
    await writeFile(TOURNAMENTS_FILE, '[]\n', 'utf8')
    raw = '[]'
  }

  try {
    const parsed = JSON.parse(raw) as Tournament[]
    if (!Array.isArray(parsed)) {
      return []
    }
    return sanitizeTournamentList(parsed)
  } catch {
    return []
  }
}

export async function getTournamentByYear(year: number): Promise<Tournament | null> {
  const tournaments = await getTournaments()
  return tournaments.find((entry) => entry.year === year) ?? null
}

export async function saveTournaments(tournaments: Tournament[]) {
  await mkdir(DATA_DIR, { recursive: true })
  const clean = sanitizeTournamentList(tournaments)
  await writeFile(TOURNAMENTS_FILE, `${JSON.stringify(clean, null, 2)}\n`, 'utf8')
}
