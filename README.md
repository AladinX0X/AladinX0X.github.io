# AYLOUL Website (أيلول)

Zweisprachige Website (Arabisch von rechts nach links als Standard, Englisch) für AYLOUL, Architektur und Grafikdesign, Homs. Statisch gebaut mit Astro, läuft vollständig lokal ohne Internet, ohne Domain und ohne Hosting.

## Schnellstart auf dem Mac

1. Einmalig Node.js installieren (aktuelle LTS-Version, mindestens 22.22): https://nodejs.org/
2. Im Finder `Vorschau-starten.command` doppelklicken.
   - Beim ersten Mal installiert die Datei die Pakete (Internet nötig, 1–3 Minuten).
   - Sie baut die Website und öffnet http://127.0.0.1:4321/ar/ im Browser.
   - Fenster offen lassen, solange die Vorschau laufen soll.
   - Meldet macOS „kann nicht geöffnet werden, da sie von einem nicht verifizierten Entwickler stammt“: Rechtsklick auf die Datei → **Öffnen** → im Dialog noch einmal **Öffnen**. Das ist nur beim ersten Mal nötig.

Im Terminal geht es auch so:

```
npm install        # einmalig
npm run build      # Website bauen (Ordner dist/)
npm run preview    # Vorschau unter http://127.0.0.1:4321/ar/
```

## Vorführung ohne Internet

- Einmal mit Internet `npm install` ausführen (oder die Startdatei einmal doppelklicken). Danach braucht nichts mehr das Internet: Schrift, Bilder, Karte und Portfolio-PDF liegen im Projekt.
- Vor der Vorführung `Vorschau-starten.command` doppelklicken, Browser im Vollbild (ctrl+cmd+F).
- Ablauf-Vorschlag: Startseite → Projekte (Filter zeigen) → Moscheeplatz (Galerie, Großansicht mit Pfeiltasten) → Leistungen → Kontakt (Karte, Formular) → oben rechts Sprache wechseln.
- Hinweis: Links zu WhatsApp, Instagram und Google Maps brauchen Internet. Das Kontaktformular sendet noch nichts (siehe unten).

## Befehle

| Befehl | Zweck |
|---|---|
| `npm run build` | Website nach `dist/` bauen |
| `npm run preview` | Gebaute Website lokal zeigen (Port 4321) |
| `npm run dev` | Entwicklungsmodus mit automatischem Neuladen |
| `npm test` | Alle Prüfungen (nach `npm run build`) |
| `npm run pruefen` | Bauen und prüfen in einem Schritt |
| `npm run screenshots` | Screenshots aller Seiten (375 und 1440 px) nach `screenshots/` |
| `npm run bilder` | Bilder für das Web aufbereiten (Originale aus `quelle/originale/` haben Vorrang) |
| `npm run portfolio` | Portfolio-PDF für den Download verkleinern (braucht ghostscript: `brew install ghostscript`) |
| `node scripts/inhalte-todo.mjs` | INHALTE-TODO.md neu erzeugen |

Für `npm test` und `npm run screenshots` auf dem Mac einmalig: `npx playwright install chromium`.

## Wo steht was?

- Texte: `src/i18n/ar.json` und `src/i18n/en.json` (immer beide mit denselben Schlüsseln pflegen)
- Projekte: `src/data/projekte.json` (gemeinsame Daten, Texte je Sprache); Kennzahlen werden daraus berechnet
- Leistungen: `src/data/leistungen.json` · Kontakt: `src/data/kontakt.json` · Einstellungen: `src/data/site.json`
- Bilder: Originale nach `quelle/originale/`, Logo nach `quelle/logo/` (je eine LIESMICH.txt erklärt die Benennung), dann `npm run bilder`
- Offene Inhalte: `INHALTE-TODO.md` · Bilderliste: `BILDER.md` · Regeln für die Weiterarbeit: `CLAUDE.md`

## Seiten

`/ar/` und `/en/` jeweils mit: Startseite, `about/`, `approach/`, `services/` (+ 6 Leistungen), `projects/` (+ 7 Projekte), `contact/`. Dazu `/404.html` (zweisprachig) und `/` (leitet auf `/ar/` weiter).

## Später online gehen

Die Website ist so gebaut, dass sie ohne Umbau online gehen kann. Bewusst noch NICHT eingerichtet, weil es eine Domain braucht:

1. **Domain und Hosting mit HTTPS** wählen, z. B. ein Anbieter für statische Seiten. Hochgeladen wird nur der Inhalt von `dist/`. Der Server muss für unbekannte Adressen `404.html` ausliefern.
2. **Domain eintragen**: in `astro.config.mjs` `site: 'https://www.beispiel.de'` ergänzen (und den Test in `tests/statisch.mjs`, der `site` verbietet, entfernen).
3. **Sitemap**: Paket `@astrojs/sitemap` installieren und in `astro.config.mjs` aktivieren (mit i18n-Angaben für ar/en).
4. **robots.txt** in `public/` anlegen, mit Verweis auf die Sitemap.
5. **canonical-Links** im Kopf (`src/layouts/Basis.astro`) mit der vollen Adresse jeder Seite; hreflang auf absolute Adressen umstellen.
6. **Open Graph** (Titel, Beschreibung, Vorschaubild mit absoluter Adresse) für Vorschauen in WhatsApp und sozialen Netzwerken.
7. **JSON-LD** (schema.org `LocalBusiness` bzw. `ArchitecturalFirm` mit Adresse, Telefon, Öffnungszeiten) im Kopf der Startseite.
8. **Formularversand**: in `src/scripts/formular.ts` die Funktion `versenden()` (mit TODO markiert) an einen Versanddienst anschließen, mit Spamschutz.
9. **Rechtliches** je nach Zielmarkt: Impressum, Datenschutzerklärung; Cookie-Hinweis nur, falls später Analyse-Werkzeuge dazukommen.
10. **Google Search Console** einrichten und **Google Unternehmensprofil** anlegen bzw. mit der Website verknüpfen.
11. Weiterleitung von `/` auf `/ar/` dann besser serverseitig (301) statt per meta refresh.

## Technik

Astro 7 (statisch), eine Schrift (Fustat, lokal über @fontsource), eigene Bildpipeline mit sharp (WebP 375/768/1440/1920 px, nie hochskaliert), keine externen Skripte, keine CDNs. Tests mit Playwright in `tests/`.
