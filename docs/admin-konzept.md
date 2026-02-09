# Admin-Konzept fuer Turnierverwaltung

## Ziel
Ein geschuetzter Admin-Bereich soll Turniere zentral verwalten:
- Login fuer Admin-Nutzer
- Turnier manuell anlegen, bearbeiten und loeschen
- Gewinnernamen pflegen
- Bilder (Sieger, Turnierbaum, Galerie) ueber Pfade/URLs oder Uploads verwalten

## Architektur
- Frontend: Next.js App Router (`/admin/login`, `/admin`)
- Auth: Cookie-basierte Session mit serverseitiger Validierung
- Datenhaltung: JSON-Datei `data/tournaments.json`
- Uploads: Dateischreibzugriff nach `public/uploads/<jahr>/...`

## Datenmodell
`Tournament`:
- `year: number`
- `winnerName: string`
- `winnerImage: string`
- `winnerAlt: string`
- `bracketImage: string`
- `bracketAlt: string`
- `gallery: { src: string; alt: string }[]`

## Admin-Workflows
1. Login auf `/admin/login`
2. Geschuetzte Verwaltung auf `/admin`
3. Neues Turnier erfassen oder bestehendes bearbeiten
4. Speichern aktualisiert automatisch:
- Uebersicht `/turniere`
- Detailseite `/turniere/<jahr>`

## Sicherheit
- Zugangsdaten via Umgebungsvariablen steuerbar:
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- Session-Cookie ist `httpOnly`, `sameSite=lax`, mit Ablaufzeit.

## Grenzen und spaetere Ausbaustufen
- Aktuell Dateibasiert (kein Multi-User, keine Historie)
- Keine Rollen/Feinrechte
- Kein Versionsvergleich fuer Inhalte

Empfohlene Erweiterungen:
- Persistenz auf DB (z. B. Postgres)
- Audit-Log und Versionierung
- Optional 2FA fuer Admin-Login
