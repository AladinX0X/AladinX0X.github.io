# AYLOUL v2 – Präsentationsseite

Zweite Designrichtung: eine arabische Seite (RTL) als Präsentation mit 8 Folien. Hell und modern: Elfenbein, Waldgrün, Terrakotta als einziger Akzent, Schrift Fustat.

1. Titel mit Logo, Claim und Slogan
2. Kennzahlen (Projekte, Leistungen, Länder, seit 2026)
3. Balkendiagramm „Projekte nach Bereich“
4. Ringdiagramm „Projekte nach Land“ (mit Tabelle)
5. Arbeitsweise als Zeitstrahl
6. 4 ausgewählte Projekte (einstellbar in `src/data/v2.json`)
7. 6 Leistungen
8. Kontakt mit WhatsApp

## Start

- Mac: im Hauptordner `Vorschau-v2-starten.command` doppelklicken → http://127.0.0.1:4322/
- Terminal (in `v2/`): `npm install`, `npm run build`, `npm run preview`

## Daten

v2 hat keine eigenen Projektdaten. Es liest aus der ersten Fassung:
`../src/data/projekte.json`, `leistungen.json`, `kontakt.json`, `site.json`, die Texte aus `../src/i18n/ar.json` sowie Logo, Icons und Raute aus `../src/components/`. Alle Diagrammwerte werden beim Bauen aus den Projektdaten berechnet. Bilder kopiert `npm run build` automatisch aus `../public/bilder/` (Skript `scripts/uebernehmen.mjs`). Eigene Texte nur für die Folien: `src/i18n/ar.json`.

## Prüfen

`npm run build`, dann `npm test` (Folien, Zahlen gegen die Daten, RTL-CSS, Ziffern, Überlauf 375–1440 px, Kontrast, Aufbau der Diagramme) und `npm run screenshots` (jede Folie bei 1440×900, ganze Seite bei 375 px, Ablage `v2/screenshots/`).
