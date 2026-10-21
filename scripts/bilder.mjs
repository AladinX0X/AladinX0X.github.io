// Optimiert alle Bilder aus src/data/bilder.json mit sharp und erzeugt das Logo-Paket.
// Reihenfolge der Quellen je Bild: quelle/originale/<id>.* (Original) vor quelle/extrahiert/<id>.png (PDF-Auszug).
// Ausgabe: public/bilder/<id>-<breite>.webp und src/data/bilder-manifest.json.
// Logo: liegt quelle/logo/<name>.png (oder .svg) vor, wird es nach src/assets/logo/ übernommen.
// Danach werden Favicon und Apple-Touch-Icon aus src/assets/logo/logo-zeichen-hell.png erzeugt.
// Nie hochskalieren: Es entstehen nur Breiten bis zur Originalbreite.
// Aufruf: npm run bilder
import sharp from 'sharp';
import { readFile, writeFile, mkdir, readdir, rm, copyFile, access } from 'node:fs/promises';
import path from 'node:path';

const BREITEN = [375, 768, 1440, 1920];
const ENDUNGEN = ['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff'];
const ZIEL = 'public/bilder';
const LOGO_NAMEN = [
  'logo-zeichen-hell', 'logo-zeichen-dunkel',
  'logo-zeichen-schriftzug-hell', 'logo-zeichen-schriftzug-dunkel',
  'logo-komplett-hell', 'logo-komplett-dunkel',
];

const gibtEs = async (p) => access(p).then(() => true, () => false);

async function quelleFinden(id) {
  for (const e of ENDUNGEN) {
    const p = path.join('quelle/originale', id + e);
    if (await gibtEs(p)) return { datei: p, herkunft: 'original' };
  }
  const p = path.join('quelle/extrahiert', id + '.png');
  if (await gibtEs(p)) return { datei: p, herkunft: 'pdf' };
  return null;
}

const register = JSON.parse(await readFile('src/data/bilder.json', 'utf8')).bilder;
await rm(ZIEL, { recursive: true, force: true });
await mkdir(ZIEL, { recursive: true });

const manifest = {};
const fehlend = [];
for (const [id, info] of Object.entries(register)) {
  const q = await quelleFinden(id);
  if (!q) { fehlend.push(id); continue; }
  const meta = await sharp(q.datei).metadata();
  const breite = meta.width, hoehe = meta.height;
  const ziele = BREITEN.filter((b) => b < breite);
  if (!ziele.includes(breite) && breite <= 1920) ziele.push(breite);
  if (breite > 1920 && !ziele.includes(1920)) ziele.push(1920);
  const qualitaet = info.art === 'plan' ? 90 : info.art === 'textur' ? 45 : 78;
  const varianten = [];
  for (const b of ziele) {
    const h = Math.round((hoehe * b) / breite);
    const datei = `${id}-${b}.webp`;
    await sharp(q.datei).resize({ width: b, withoutEnlargement: true }).webp({ quality: qualitaet, effort: 5 }).toFile(path.join(ZIEL, datei));
    varianten.push({ breite: b, hoehe: h, src: `/bilder/${datei}` });
  }
  manifest[id] = { breite: Math.min(breite, 1920), hoehe: Math.round(hoehe * Math.min(breite, 1920) / breite), herkunft: q.herkunft, art: info.art, varianten };
}
await writeFile('src/data/bilder-manifest.json', JSON.stringify(manifest, null, 2) + '\n');

// Logo: Originale aus quelle/logo/ übernehmen (PNG oder SVG gleichen Namens)
let logoOriginale = 0;
for (const name of LOGO_NAMEN) {
  for (const e of ['.svg', '.png']) {
    const p = path.join('quelle/logo', name + e);
    if (await gibtEs(p)) {
      if (e === '.svg') console.warn(`Hinweis: ${p} ist SVG. Bitte im Code die Endung von ${name} auf .svg umstellen (src/components/Logo.astro).`);
      await copyFile(p, path.join('src/assets/logo', name + e));
      logoOriginale++;
      break;
    }
  }
}

// Favicon und Apple-Touch-Icon: Zeichen auf Waldgrün
const zeichen = 'src/assets/logo/logo-zeichen-hell.png';
async function icon(groesse, datei, rand) {
  const innen = Math.round(groesse * (1 - 2 * rand));
  const bild = await sharp(zeichen).resize({ width: innen, height: innen, fit: 'inside' }).toBuffer();
  await sharp({ create: { width: groesse, height: groesse, channels: 4, background: '#052f24' } })
    .composite([{ input: bild, gravity: 'center' }]).png().toFile(path.join('public', datei));
}
await icon(48, 'favicon.png', 0.1);
await icon(180, 'apple-touch-icon.png', 0.14);

const anzahl = Object.keys(manifest).length;
const originale = Object.values(manifest).filter((m) => m.herkunft === 'original').length;
console.log(`${anzahl} Bilder optimiert (${originale} aus Originalen, ${anzahl - originale} aus PDF-Auszügen). Logo-Originale übernommen: ${logoOriginale}.`);
if (fehlend.length) {
  console.error('FEHLT (weder Original noch PDF-Auszug gefunden):', fehlend.join(', '));
  process.exitCode = 1;
}
