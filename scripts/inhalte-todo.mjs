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
z('- [ ] **Bitte bestätigen: Seiten 15-17 = ein Projekt.** Die Bilder der weißen Villa (PDF 16-17) sind als Teil von Projekt 02 "Wohnvilla VAE" eingeordnet (src/data/projekte.json, slug `villa-uae`). Deshalb zeigt die Website 7 statt 8 Projekte. Falls es doch zwei Projekte sind: einen neuen Eintrag in projekte.json anlegen, die Bilder `white-villa-*` dorthin verschieben; die Kennzahl passt sich automatisch an.');
z('  Das betrifft auch die Präsentationsseite v2 (Kennzahlen und Diagramme werden aus denselben Daten berechnet).');
z('- [ ] **Bitte prüfen: Seite 11 eigenes Projekt?** Das Stimmungsbild der Fassade (PDF 11, `allgemein-fassade-exterior-gruen`) wird als allgemeines Bild bei der Leistung "Außenarchitektur" verwendet. Gehört es zu einem eigenen Projekt?');
z('- [ ] **Facebook-Link fehlt.** src/data/kontakt.json, Schlüssel `facebook` (derzeit `#`).');
z('- [ ] **Karte auf der Kontaktseite** (src/components/HomsKarte.astro) ist eine vereinfachte Skizze, nicht maßstabsgetreu. Lage von alter Uhr, Bazar Mall, Großer Nuri-Moschee, Souq und der Name "Shukri al-Quwatli" bitte prüfen. Texte: ar.json / en.json `kontakt.karte.*`.');
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
z('- [ ] Kurztexte der Projekte (`kurz`), Seitentitel und Meta-Beschreibungen (`meta.*`), Formular- und Fehlertexte (`kontakt.*`), 404-Texte (`fehler404.*`).');
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
z('## 4. Bilder und Logo aus dem PDF (durch Originale ersetzen)');
z();
z('Alle Bilder stammen aus dem Portfolio-PDF (max. 1170 px breit). Originale in `quelle/originale/` ablegen (Anleitung: quelle/originale/LIESMICH.txt), dann `npm run bilder`.');
z();
z('| Bild-ID | Art | Breite × Höhe | Herkunft |');
z('|---|---|---|---|');
for (const id of Object.keys(bilder)) {
  const m = manifest[id];
  z(`| \`${id}\` | ${bilder[id].art} | ${m ? `${m.breite} × ${m.hoehe}` : '–'} | ${m?.herkunft ?? '–'} |`);
}
z();
z('- [ ] Logo: aus dem PDF gewonnen (PNG). Original als SVG in `quelle/logo/` ablegen (Anleitung: quelle/logo/LIESMICH.txt).');
z('- [ ] Raute: als SVG nachgebaut (src/components/Raute.astro), später aus dem Original-Logo ersetzen.');
z('- [ ] Hero als Vollbild, sobald das Moscheeplatz-Nachtbild im Original da ist: src/data/site.json `heroVollbild: true`.');
z();

await writeFile('INHALTE-TODO.md', zeilen.join('\n'));
console.log(`INHALTE-TODO.md geschrieben (${zeilen.length} Zeilen).`);
