// Phase 0: Schneidet Bilder aus den eingebetteten Seitenbildern des Portfolios.
// Voraussetzung: pdfimages -all quelle/AYLOUL-Portfolio.pdf quelle/extrahiert/roh/img
// Jede PDF-Seite ist EIN Bild (1170x827 px, 100 ppi). Ausnahme: Seite 44 (3507x2480, 300 ppi).
// Koordinaten unten immer im 1170x827-Raster; fuer Seite 44 wird automatisch skaliert.
// Aufruf: node scripts/extrahiere-bilder.mjs
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROH = 'quelle/extrahiert/roh';
const ZIEL = 'quelle/extrahiert';

// [dateiname, pdfSeite, x0, y0, x1, y1]
const ausschnitte = [
  // Projekt 1: Wohnvilla Homs (PDF 12-14)
  ['villa-homs-sepia-perspektive', 12, 0, 40, 690, 827],
  ['villa-homs-tag-front', 13, 600, 0, 1170, 827],
  ['villa-homs-galerie-1-tag-front', 14, 131, 214, 514, 695],
  ['villa-homs-galerie-2-tag-perspektive', 14, 539, 215, 716, 437],
  ['villa-homs-galerie-3-tag-eingang', 14, 745, 215, 923, 437],
  ['villa-homs-galerie-4-tag-balkon', 14, 950, 215, 1127, 437],
  ['villa-homs-galerie-5-nacht-perspektive', 14, 539, 471, 716, 694],
  ['villa-homs-galerie-6-nacht-eingang', 14, 745, 471, 923, 694],
  ['villa-homs-galerie-7-nacht-balkon', 14, 950, 471, 1127, 694],
  // Projekt 2: Wohnvilla VAE (PDF 15)
  ['villa-uae-sepia-perspektive', 15, 0, 40, 740, 820],
  // Projekt 3: Weisse Villa mit Boegen (PDF 16-17)
  ['white-villa-tag-front', 16, 0, 170, 1170, 827],
  ['white-villa-tag-boegen', 17, 188, 166, 980, 604],
  ['white-villa-nacht-1', 17, 188, 636, 430, 763],
  ['white-villa-nacht-2-boegen', 17, 465, 636, 707, 763],
  ['white-villa-nacht-3-perspektive', 17, 739, 636, 981, 763],
  // Projekt 4: Moscheeplatz (PDF 18-20)
  ['mosque-square-sepia-nacht', 18, 0, 0, 720, 827],
  ['mosque-square-luftbild', 19, 440, 0, 1170, 770],
  ['mosque-square-galerie-1-tag-eingang', 20, 188, 166, 431, 295],
  ['mosque-square-galerie-2-nacht-eingang', 20, 458, 166, 701, 295],
  ['mosque-square-galerie-3-nacht-wandbild', 20, 728, 167, 1060, 759],
  ['mosque-square-galerie-4-tag-wandbild', 20, 187, 325, 701, 604],
  ['mosque-square-galerie-5-tag-platz', 20, 187, 630, 430, 759],
  ['mosque-square-galerie-6-nacht-platz', 20, 456, 630, 700, 759],
  ['mosque-square-intro-nacht-gruen', 2, 700, 262, 1170, 827],
  // Projekt 5: Wohnvilla Innen VAE (PDF 22-27)
  ['villa-interior-uae-treppe-gruen', 22, 640, 0, 1170, 827],
  ['villa-interior-uae-sepia-detail', 23, 0, 0, 720, 827],
  ['villa-interior-uae-wohnzimmer-treppe', 24, 0, 140, 1170, 827],
  ['villa-interior-uae-essbereich', 25, 430, 60, 1170, 770],
  ['villa-interior-uae-galerie-1-wohnzimmer', 26, 199, 170, 727, 460],
  ['villa-interior-uae-galerie-2-wohnzimmer-oben', 26, 756, 170, 1054, 460],
  ['villa-interior-uae-galerie-3-kueche', 26, 199, 489, 495, 779],
  ['villa-interior-uae-galerie-4-kueche-front', 26, 525, 489, 1054, 779],
  ['villa-interior-uae-galerie-5-eingang', 27, 158, 251, 443, 686],
  ['villa-interior-uae-galerie-6-treppe', 27, 468, 251, 796, 419],
  ['villa-interior-uae-galerie-7-detail', 27, 468, 442, 614, 686],
  ['villa-interior-uae-galerie-8-gaeste-bad', 27, 638, 442, 796, 686],
  ['villa-interior-uae-galerie-9-gaeste-bad', 27, 823, 251, 1107, 686],
  // Projekt 6: Master-Schlafzimmer VAE (PDF 28-30)
  ['master-bedroom-sepia', 28, 0, 0, 740, 827],
  ['master-bedroom-gesamt', 29, 0, 135, 1170, 827],
  ['master-bedroom-galerie-1-tv-wand', 30, 196, 175, 707, 457],
  ['master-bedroom-galerie-2-bett', 30, 733, 175, 976, 457],
  ['master-bedroom-galerie-3-sitzbereich', 30, 195, 484, 437, 767],
  ['master-bedroom-galerie-4-raum', 30, 464, 484, 976, 767],
  // Projekt 7: Werkplanung Wohnung (PDF 32-37 = gedruckte Seiten 31-36)
  ['shop-drawings-grundriss', 32, 735, 135, 1125, 805],
  ['shop-drawings-moeblierung-legende', 33, 145, 155, 1025, 780],
  ['shop-drawings-boden', 34, 245, 150, 975, 450],
  ['shop-drawings-licht', 34, 335, 480, 1160, 790],
  ['shop-drawings-elektro', 35, 270, 150, 1140, 445],
  ['shop-drawings-legenden', 35, 270, 490, 1110, 780],
  ['shop-drawings-kueche', 36, 95, 150, 1060, 740],
  ['shop-drawings-bad', 37, 105, 170, 1165, 800],
  // Projekt 8: Markenidentitaet (PDF 39-43 = gedruckte Seiten 38-42)
  ['brand-identity-logo-varianten', 39, 716, 525, 1120, 733],
  ['brand-identity-farben', 39, 120, 610, 490, 735],
  ['brand-identity-raster', 40, 790, 210, 897, 306],
  ['brand-identity-konstruktion', 40, 120, 448, 545, 753],
  ['brand-identity-typografie', 40, 800, 370, 1030, 440],
  ['brand-identity-visitenkarte', 41, 148, 303, 492, 773],
  ['brand-identity-mockups', 41, 615, 305, 1035, 773],
  ['brand-identity-social-posts', 43, 120, 197, 1050, 735],
  // Nicht projektgebunden
  ['allgemein-studio-innenraum-sepia', 5, 880, 0, 1170, 827],
  ['allgemein-leistungen-essplatz-sepia', 9, 680, 0, 1170, 827],
  ['allgemein-fassade-exterior-gruen', 11, 685, 160, 1170, 827],
  ['allgemein-schlafzimmer-klassisch-sepia', 42, 570, 163, 1170, 827],
  ['allgemein-kontakt-karte', 44, 0, 273, 1170, 827],
  ['allgemein-kontakt-uhrturm', 44, 128, 495, 232, 715],
  // Texturen
  ['textur-nebel-gruen', 45, 100, 112, 1080, 370],
  ['textur-papier', 27, 150, 705, 1150, 825],
];

const seitenDatei = (s) => path.join(ROH, `img-${String((s - 1) * 2).padStart(3, '0')}.jpg`);

await mkdir(ZIEL, { recursive: true });
const liste = [];
for (const [name, seite, x0, y0, x1, y1] of ausschnitte) {
  const datei = seitenDatei(seite);
  const meta = await sharp(datei).metadata();
  const f = meta.width / 1170;
  const left = Math.round(x0 * f), top = Math.round(y0 * f);
  const width = Math.min(Math.round((x1 - x0) * f), meta.width - left);
  const height = Math.min(Math.round((y1 - y0) * f), meta.height - top);
  const out = path.join(ZIEL, `${name}.png`);
  await sharp(datei).extract({ left, top, width, height }).png().toFile(out);
  liste.push({ name, seite, width, height });
}
await writeFile(path.join(ZIEL, 'liste.json'), JSON.stringify(liste, null, 2));
console.log(`${liste.length} Ausschnitte geschrieben.`);
