// Optimiert alle Bilder aus src/data/bilder.json mit sharp und erzeugt das Logo-Paket.
// Quelle je Bild: "quelle" im Register (Pfad unter quelle/), sonst quelle/originale/<id>.* (Original)
// vor quelle/extrahiert/<id>.png (PDF-Auszug).
// Ausgabe: public/bilder/<id>-<breite>.avif und .webp, src/data/bilder-manifest.json
// (Breite, Höhe, Herkunft, LQIP-Platzhalter, Varianten).
// Budget: Hero <= 400 KB bei 1920 px, alle anderen <= 250 KB bei 1440 px (Qualität wird gesenkt, bis es passt).
// Alle EXIF-/GPS-Metadaten werden entfernt (sharp schreibt ohne withMetadata keine Metadaten).
// Logo: quelle/logo-original/ (Originale, 5000 px) vor quelle/logo/<name>.png → src/assets/logo/.
// Danach werden Favicon und Apple-Touch-Icon aus src/assets/logo/logo-zeichen-hell.png erzeugt.
// Nie hochskalieren: Es entstehen nur Breiten bis zur Originalbreite.
// Aufruf: npm run bilder
import sharp from 'sharp';
import { readFile, writeFile, mkdir, rm, copyFile, access } from 'node:fs/promises';
import path from 'node:path';

const BREITEN = [640, 800, 960, 1440, 1920, 2560];
const ENDUNGEN = ['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff'];
const ZIEL = 'public/bilder';
const KB = 1024;
const LOGO_NAMEN = [
  'logo-zeichen-hell', 'logo-zeichen-dunkel',
  'logo-zeichen-schriftzug-hell', 'logo-zeichen-schriftzug-dunkel',
  'logo-komplett-hell', 'logo-komplett-dunkel',
];
// Original-Logodateien (quelle/logo-original/) → Namen im Projekt, Zielbreite in px
const LOGO_ORIGINALE = {
  'logo-komplett-hell': ['1-01-01.png', 1200],
  'logo-komplett-dunkel': ['1-01-02.png', 1200],
  'logo-zeichen-schriftzug-hell': ['3-03.png', 900],
  'logo-zeichen-schriftzug-dunkel': ['3-04.png', 900],
  'logo-zeichen-hell': ['3-05.png', 512],
  'logo-zeichen-dunkel': ['3-06.png', 512],
};

const gibtEs = async (p) => access(p).then(() => true, () => false);

async function quelleFinden(id, info) {
  if (info.quelle) {
    const p = path.join('quelle', info.quelle);
    if (await gibtEs(p)) return { datei: p, herkunft: info.quelle.startsWith('extrahiert/') ? 'pdf' : 'original' };
  }
  for (const e of ENDUNGEN) {
    const p = path.join('quelle/originale', id + e);
    if (await gibtEs(p)) return { datei: p, herkunft: 'original' };
  }
  const p = path.join('quelle/extrahiert', id + '.png');
  if (await gibtEs(p)) return { datei: p, herkunft: 'pdf' };
  return null;
}

// Speichert ein Format und senkt die Qualität, bis das Budget passt (nur für die Budget-Breite).
async function speichern(basis, breite, format, start, budget) {
  let q = start;
  for (;;) {
    const kette = basis.clone().resize({ width: breite, withoutEnlargement: true });
    const puffer = format === 'avif'
      ? await kette.avif({ quality: q, effort: 4 }).toBuffer()
      : await kette.webp({ quality: q, effort: 5 }).toBuffer();
    if (!budget || puffer.length <= budget || q <= 40) return { puffer, q };
    q -= 4;
  }
}

const register = JSON.parse(await readFile('src/data/bilder.json', 'utf8')).bilder;
const site = JSON.parse(await readFile('src/data/site.json', 'utf8'));
await rm(ZIEL, { recursive: true, force: true });
await mkdir(ZIEL, { recursive: true });

const manifest = {};
const fehlend = [];
const zuGross = [];

async function verarbeiten(id, info) {
  const q = await quelleFinden(id, info);
  if (!q) { fehlend.push(id); return; }
  let basis;
  if (info.ausschnitt) {
    const m0 = await sharp(q.datei).metadata();
    // Ausschnitt: { left, top, width, height } in Pixeln des Originals (fehlende Werte = ganze Breite/Höhe)
    const a = info.ausschnitt;
    const left = a.left ?? 0, top = a.top ?? 0;
    const width = Math.min(a.width ?? m0.width - left, m0.width - left);
    const height = Math.min(a.height ?? m0.height - top, m0.height - top);
    basis = sharp(await sharp(q.datei).rotate().extract({ left, top, width, height }).png().toBuffer());
  } else {
    basis = sharp(await sharp(q.datei).rotate().png({ compressionLevel: 0 }).toBuffer());
  }
  const meta = await basis.metadata();
  const breite = meta.width, hoehe = meta.height;
  // Pläne bekommen größere Breiten, damit die Beschriftung beim Zoomen in der Lightbox lesbar bleibt
  const breiten = info.art === 'plan' ? [...BREITEN, 3200, 4096] : BREITEN;
  const maxBreite = breiten[breiten.length - 1];
  const ziele = breiten.filter((b) => b < breite);
  if (breite <= maxBreite && !ziele.includes(breite)) ziele.push(breite);
  const istHero = id === site.heroBild;
  const budgetBreite = istHero ? 1920 : 1440;
  const budget = istHero ? 400 * KB : 250 * KB;
  const start = info.art === 'plan' ? 88 : info.art === 'textur' ? 45 : info.art === 'karte' ? 80 : 76;
  // Budget gilt für die Budget-Breite, sonst für die größte Breite darunter
  const budgetZiel = ziele.includes(budgetBreite) ? budgetBreite : Math.max(...ziele.filter((b) => b <= budgetBreite));
  const varianten = [];
  for (const b of ziele) {
    const h = Math.round((hoehe * b) / breite);
    const mitBudget = b === budgetZiel && info.art !== 'textur';
    const webp = await speichern(basis, b, 'webp', start, mitBudget ? budget : 0);
    const avif = await speichern(basis, b, 'avif', Math.max(start - 28, 40), mitBudget ? budget : 0);
    await writeFile(path.join(ZIEL, `${id}-${b}.webp`), webp.puffer);
    await writeFile(path.join(ZIEL, `${id}-${b}.avif`), avif.puffer);
    if (mitBudget && webp.puffer.length > budget) zuGross.push(`${id}-${b}.webp ${Math.round(webp.puffer.length / KB)} KB`);
    varianten.push({ breite: b, hoehe: h, src: `/bilder/${id}-${b}.webp`, avif: `/bilder/${id}-${b}.avif`, kb: Math.round(webp.puffer.length / KB), kbAvif: Math.round(avif.puffer.length / KB) });
  }
  // LQIP: 24 px breit, weichgezeichnet, als data-URI im Manifest
  const lqip = await basis.clone().resize({ width: 24 }).blur(1.2).webp({ quality: 40 }).toBuffer();
  const groesste = varianten[varianten.length - 1];
  manifest[id] = {
    breite: groesste.breite, hoehe: groesste.hoehe,
    herkunft: q.herkunft, art: info.art, quelle: q.datei.replace(/^quelle\//, ''),
    lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
    varianten,
  };
}

// Begrenzte Parallelität
const eintraege = Object.entries(register);
let naechster = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (naechster < eintraege.length) {
    const [id, info] = eintraege[naechster++];
    await verarbeiten(id, info);
  }
}));
const sortiert = Object.fromEntries(eintraege.filter(([id]) => manifest[id]).map(([id]) => [id, manifest[id]]));
await writeFile('src/data/bilder-manifest.json', JSON.stringify(sortiert, null, 2) + '\n');

// Logo: Originale (quelle/logo-original/) beschneiden und verkleinern; sonst quelle/logo/<name>.png
let logoOriginale = 0;
for (const name of LOGO_NAMEN) {
  const [datei, zielBreite] = LOGO_ORIGINALE[name];
  const original = path.join('quelle/logo-original', datei);
  if (await gibtEs(original)) {
    const getrimmt = await sharp(original).trim().png().toBuffer();
    await sharp(getrimmt).resize({ width: zielBreite, withoutEnlargement: true }).png({ compressionLevel: 9 }).toFile(path.join('src/assets/logo', name + '.png'));
    logoOriginale++;
    continue;
  }
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
if (zuGross.length) console.warn('Über Budget:', zuGross.join(', '));
if (fehlend.length) {
  console.error('FEHLT (weder Original noch PDF-Auszug gefunden):', fehlend.join(', '));
  process.exitCode = 1;
}
