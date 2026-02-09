# Meier Open – Modernes Next.js-Projekt

## Setup

```bash
pnpm install
pnpm dev
pnpm lint
pnpm build
```

- Node ≥ 20, pnpm ≥ 8 erforderlich.
- `NEXT_PUBLIC_IG_TOKEN` in `.env.local` setzen, wenn der Instagram‑Feed live geladen werden soll.
- Fur den Admin-Bereich zwingend setzen:
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD_HASH`
  - `ADMIN_SESSION_SECRET`
- Optional fur SEO/Canonical/Sitemap:
  - `NEXT_PUBLIC_SITE_URL`

### Passwort-Hash erzeugen (scrypt)

```bash
node -e "const c=require('node:crypto');const pw=process.argv[1];if(!pw){console.error('Passwort fehlt');process.exit(1)};const N=16384,r=8,p=1;const salt=c.randomBytes(16);const key=c.scryptSync(pw,salt,64,{N,r,p});console.log(`scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${key.toString('hex')}`)" "DEIN_STARKES_PASSWORT"
```

## Struktur

```
app/                # Seiten (App Router)
components/         # Wiederverwendbare UI-Komponenten
public/             # Statische Assets (Bilder, Logos)
tailwind.config.js  # Designsystem / Farbpalette
```

## Features

- Hero‑Sektion mit Gruppenfoto
- Dynamische Turnierseiten aus `data/tournaments.json`
- Admin-Bereich mit Login unter `/admin/login`
- Manuelles Erstellen/Bearbeiten/Loeschen von Turnieren inkl. Gewinner und Bildern
- Sponsoren‑Grid (Graustufen → Farbe bei Hover)
- Konami‑Code Easter Egg (Konfetti)
