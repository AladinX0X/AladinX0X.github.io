// Erzeugt INHALTE-TODO.md: alle Angaben, die nicht 1:1 aus dem Portfolio stammen oder noch fehlen.
// Aufruf: node scripts/inhalte-todo.mjs  (manuelle Punkte stehen unten in diesem Skript)
import { readFile, writeFile } from 'node:fs/promises';

const ar = JSON.parse(await readFile('src/i18n/ar.json', 'utf8'));
const { projekte } = JSON.parse(await readFile('src/data/projekte.json', 'utf8'));
const bilder = JSON.parse(await readFile('src/data/bilder.json', 'utf8')).bilder;
const manifest = JSON.parse(await readFile('src/data/bilder-manifest.json', 'utf8'));

const zeilen = [];
const z = (s = '') => zeilen.push(s);

z('# INHALTE-TODO.md');
z();
z('Alles, was nicht 1:1 aus dem Portfolio stammt, selbst formuliert wurde oder noch fehlt.');
z('Erzeugt mit `node scripts/inhalte-todo.mjs`. Bitte prüfen und Änderungen direkt in den genannten Dateien vornehmen.');
z();
z('## 1. Bitte bestätigen oder entscheiden');
z();
z('- [x] **Seiten 15-17 = ein Projekt (entschieden in Runde 2).** Im Desktop-Ordner "Wohnvilla UAE" liegen die Villa mit dem hohen Glaselement UND die Fassade mit den Bögen. Nach der vereinbarten Regel (Ordnerstruktur entscheidet) bleibt es ein Projekt (`villa-uae`), also 7 Projekte.');
z('- [ ] **Bitte prüfen: Ordner "شقة غرفة معيشة-نوم-حمام".** Er ist Byte für Byte identisch mit "Wohnvilla Innen UAE" (gleiche 11 Dateien). Er wurde deshalb dem Projekt `villa-interior-uae` zugeordnet, kein neues Projekt. Falls es eine eigene Wohnung ist: bitte die richtigen Bilder in den Ordner legen.');
z('- [ ] **Bitte prüfen: Bilder mit dem Platzhalter "BUILDING NAME"** auf Gebäuden im Moscheeplatz-Rendering. Die Bilder 7 (2).jpg und 8.jpg zeigen ihn groß und wurden deshalb nicht verwendet; auf 9.jpg und 10.jpg (Hero) ist er klein im Hintergrund zu sehen. Am besten im Rendering entfernen und neu exportieren.');
z('- [ ] **Master-Schlafzimmer:** die Originale sind nur 1280 × 720 px. Größere Exporte (mind. 2400 px) wären schärfer.');
z('- [ ] **Wohnvilla Homs:** alle Originale sind Hochformat (1600 × 2000). Für Karten und Titelbild wäre ein Querformat besser.');
z('- [ ] **Bitte prüfen: Seite 11 eigenes Projekt?** Das Stimmungsbild der Fassade (PDF 11, `allgemein-fassade-exterior-gruen`) wird als allgemeines Bild bei der Leistung "Außenarchitektur" verwendet. Gehört es zu einem eigenen Projekt?');
z('- [ ] **Karte auf der Kontaktseite:** jetzt das Bild aus dem Desktop-Ordner "Adresse" (gleiche Karte wie Portfolio S. 43, im Markenstil; kein Google-Maps-Screenshot, deshalb keine Google-Zuordnung zu erhalten). Oben wurde nur leerer Nebel abgeschnitten. Die Straßennamen sind arabisch, auch auf der englischen Seite.');
z('- [ ] **Google-Maps-Link** sucht nach "Bazar Mall, Homs, Syria" (src/data/kontakt.json `googleMaps`). Besser: den genauen Link aus Google Maps einsetzen.');
z();
z('## 2. Neu geschriebene Texte (nicht im Portfolio)');
z();
z('- [ ] Leistung 5 "3D-Visualisierung": ar.json / en.json `leistungen.eintraege.3d-visualization` (kurz, text, aspekte).');
z('- [ ] Leistung 6 "Ausführung und Bauüberwachung": ar.json / en.json `leistungen.eintraege.construction-supervision`.');
z('- [ ] Schritt 04 "Raum" der Arbeitsweise (im Portfolio versehentlich mit dem Text von Schritt 01): `arbeitsweise.schritte[3].text`.');
z('- [ ] Aspekte der Leistungen Innenarchitektur und Grafikdesign (Kurzbeschreibungen der Stichworte): `leistungen.eintraege.interior-design.aspekte`, `...architectural-graphic-design.aspekte`.');
z('- [ ] Projekt 06 "Werkplanung Wohnung": Beschreibung aus den Planinhalten zusammengestellt (projekte.json `apartment-shop-drawings`).');
z('- [ ] Markenidentität: Der Satz zum "Visual Element" bricht im Portfolio (S. 39) mitten im Satz ab und wurde gekürzt (projekte.json `ayloul-brand-identity`).');
z('- [ ] **Neu in Runde 2: Startseite "تخصصاتنا / Our disciplines"**: Disziplin "التصميم ثلاثي الأبعاد / 3D Design" mit Kurztext und Stichworten: `start.dreiD` (name, text, begriffe), Einleitung `start.disziplinenIntro`, Link `start.disziplinLink`. Architektur und Grafikdesign nutzen die geprüften Texte aus `leistungen.eintraege.*.kurz` und `ueber.disziplinen`.');
z('- [ ] **Neu in Runde 2:** `start.hauptprojektKicker`, `start.hauptprojektLink`, `start.scrollHinweis`, `kontakt.linkedin`, `kontakt.whatsapp`, `kontakt.socialTitel`, `kontakt.neuesFenster`, `kontakt.direktTitel`, `kontakt.direktText`, `kontakt.karteAlt`, `kontakt.karteOeffnen`, `projekte.lightbox.plus/minus/zoomHinweis`.');
z('- [ ] **Neu in Runde 2:** alle alt-Texte der Originalbilder (projekte.json `ar.alt` / `en.alt`), geschrieben nach dem, was auf den Bildern zu sehen ist.');
z('- [ ] Kurztexte der Projekte (`kurz`), Seitentitel und Meta-Beschreibungen (`meta.*`), 404-Texte (`fehler404.*`).');
z('- [ ] Alle alt-Texte der Bilder (projekte.json `*.alt`, ar.json / en.json `alt`).');
z('- [ ] Englische Texte: Tippfehler aus dem Portfolio korrigiert (SERCIVES, nteriors, dentity, remebered, marbel, biege, SLAYOUT, residtant).');
z();
z('## 3. Alle arabischen Texte zur Prüfung');
z();
z('Die arabischen Texte sind Übersetzungen bzw. Neuformulierungen der englischen Portfolio-Texte. Bitte vollständig gegenlesen.');
z();
const flach = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
  v !== null && typeof v === 'object' ? flach(v, p + k + '.') : [[p + k, v]]);
z('### src/i18n/ar.json');
z();
z('| Schlüssel | Text |');
z('|---|---|');
for (const [k, v] of flach(ar)) z(`| \`${k}\` | ${String(v).replace(/\|/g, '\\|')} |`);
z();
z('### src/data/projekte.json (Teil `ar`)');
z();
for (const p of projekte) {
  z(`#### ${p.slug}`);
  z();
  z('| Schlüssel | Text |');
  z('|---|---|');
  for (const [k, v] of flach(p.ar)) if (v !== null) z(`| \`${k}\` | ${String(v).replace(/\|/g, '\\|')} |`);
  z();
}
z('## 4. Bilder: Herkunft (Original oder PDF-Auszug)');
z();
z('Seit Runde 2 stammen alle Projektbilder von Villa Homs, Villa VAE, Moscheeplatz, Villa Innen VAE und Master-Schlafzimmer aus den Originalen. Noch aus dem PDF: Werkplanung (Pläne), Markenidentität und vier Stimmungsbilder. Originale dafür in `quelle/originale/<projekt>/` ablegen, in src/data/bilder.json eintragen, dann `npm run bilder`.');
z();
z('| Bild-ID | Art | Breite × Höhe | Herkunft |');
z('|---|---|---|---|');
for (const id of Object.keys(bilder)) {
  const m = manifest[id];
  z(`| \`${id}\` | ${bilder[id].art} | ${m ? `${m.breite} × ${m.hoehe}` : '–'} | ${m?.herkunft ?? '–'} |`);
}
z();
z('- [x] Logo: seit Runde 2 aus den Originalen (Desktop-Ordner "logo", 5000 px PNG). Ein SVG wäre noch schärfer.');
z('- [ ] Raute: als SVG nachgebaut (src/components/Raute.astro), später aus dem Original-Logo ersetzen.');
z('- [ ] Pläne der Werkplanung: nur PDF-Auszüge (max. 1060 px). In der Großansicht kann man jetzt zoomen, für scharfe Details braucht es PDF- oder PNG-Exporte aus dem CAD.');
z('- [x] Hero als Vollbild mit dem Original-Nachtbild des Moscheeplatzes (2560 px).');
z();

await writeFile('INHALTE-TODO.md', zeilen.join('\n'));
console.log(`INHALTE-TODO.md geschrieben (${zeilen.length} Zeilen).`);
