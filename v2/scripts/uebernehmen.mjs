// Kopiert die benötigten Bilder aus der ersten Fassung (../public/bilder) nach v2/public/bilder.
// Welche Bilder: Hero und Titelbilder der ausgewählten Projekte (src/data/v2.json).
// Läuft automatisch vor build und dev.
import { readFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';

const v2 = JSON.parse(await readFile('src/data/v2.json', 'utf8'));
const { projekte } = JSON.parse(await readFile('../src/data/projekte.json', 'utf8'));
const site = JSON.parse(await readFile('../src/data/site.json', 'utf8'));
const manifest = JSON.parse(await readFile('../src/data/bilder-manifest.json', 'utf8'));

const ids = new Set([site.heroBild, ...v2.projekte.map((slug) => projekte.find((p) => p.slug === slug)?.titelbild)]);
await mkdir('public/bilder', { recursive: true });
let n = 0;
for (const id of ids) {
  const eintrag = manifest[id];
  if (!eintrag) throw new Error(`Bild ${id} fehlt im Manifest der ersten Fassung`);
  for (const v of eintrag.varianten) {
    await copyFile(path.join('../public', v.src), path.join('public', v.src));
    n++;
  }
}
for (const f of ['favicon.png', 'apple-touch-icon.png']) await copyFile(path.join('../public', f), path.join('public', f));
console.log(`${n} Bilddateien aus der ersten Fassung übernommen.`);
