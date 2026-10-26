// Kennzahlen: Alle Zahlen werden aus den Daten berechnet, keine ist fest eingetragen.
// 1. Der normale Build zeigt Projekte = Einträge in projekte.json, Leistungen = Einträge in leistungen.json,
//    Länder = verschiedene Länder der Projekte (Startseite, beide Sprachen; Projektliste; v2).
// 2. Test-Build mit einer Fixture (ein zusätzliches Projekt): die Zähler steigen um 1 (Startseite, Projektliste,
//    Filter-Anzahl, v2), die Seite des neuen Projekts entsteht, vorher/nachher-Verweise schließen es ein.
// 3. Kein Text in den Sprachdateien nennt eine Anzahl als Zahlwort oder Ziffer.
// Aufruf: node tests/kennzahlen.mjs (baut selbst; dauert etwas)
import { readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { Bericht } from './hilfen.mjs';

const b = new Bericht('Kennzahlen: aus den Daten berechnet (Fixture mit einem zusätzlichen Projekt erhöht die Zähler)');
const { projekte } = JSON.parse(await readFile('src/data/projekte.json', 'utf8'));
const { leistungen } = JSON.parse(await readFile('src/data/leistungen.json', 'utf8'));
const laender = new Set(projekte.map((p) => p.land).filter(Boolean)).size;

const zahlen = (html) => [...html.matchAll(/data-zahl="(\d+)"/g)].map((m) => Number(m[1]));
const anzahlListe = (html) => Number(html.match(/data-filter-anzahl[^>]*>[^<\d]*(\d+)/)?.[1]);

async function pruefeBuild(ordner, erwartet, name) {
  for (const lang of ['ar', 'en']) {
    const start = await readFile(`${ordner}/${lang}/index.html`, 'utf8');
    const [p, l, c] = zahlen(start);
    b.pruefe(p === erwartet.projekte, `${name} /${lang}/: Projekte ${p} statt ${erwartet.projekte}`);
    b.pruefe(l === erwartet.leistungen, `${name} /${lang}/: Leistungen ${l} statt ${erwartet.leistungen}`);
    b.pruefe(c === erwartet.laender, `${name} /${lang}/: Länder ${c} statt ${erwartet.laender}`);
    const liste = await readFile(`${ordner}/${lang}/projects/index.html`, 'utf8');
    b.pruefe(anzahlListe(liste) === erwartet.projekte, `${name} /${lang}/projects/: Anzahl ${anzahlListe(liste)} statt ${erwartet.projekte}`);
    b.pruefe((liste.match(/data-projekt /g) ?? []).length === erwartet.projekte, `${name} /${lang}/projects/: Kartenzahl falsch`);
  }
}

// 1. normaler Build (vorher npm run build)
await pruefeBuild('dist', { projekte: projekte.length, leistungen: leistungen.length, laender }, 'Build');

// 2. Fixture: ein zusätzliches Projekt (Kopie eines vorhandenen, eigener Slug)
const fixture = 'tests/fixtures/projekte-plus-eins.json';
await mkdir('tests/fixtures', { recursive: true });
const extra = structuredClone(projekte[0]);
extra.slug = 'fixture-projekt';
extra.ar.titel = 'مشروع للاختبار';
extra.en.titel = 'Test fixture project';
await writeFile(fixture, JSON.stringify({ projekte: [...projekte, extra] }, null, 2));
const r = spawnSync('npx', ['astro', 'build', '--outDir', 'dist-fixture'], { env: { ...process.env, AYLOUL_PROJEKTE: fixture }, encoding: 'utf8' });
b.pruefe(r.status === 0, `Fixture-Build fehlgeschlagen: ${r.stderr?.slice(-400)}`);
if (r.status === 0) {
  await pruefeBuild('dist-fixture', { projekte: projekte.length + 1, leistungen: leistungen.length, laender }, 'Fixture');
  const seite = await readFile('dist-fixture/ar/projects/fixture-projekt/index.html', 'utf8').catch(() => '');
  b.pruefe(seite.includes('مشروع للاختبار'), 'Fixture: Seite des neuen Projekts fehlt');
  const letztes = await readFile(`dist-fixture/ar/projects/${projekte[projekte.length - 1].slug}/index.html`, 'utf8');
  b.pruefe(letztes.includes('/ar/projects/fixture-projekt/'), 'Fixture: vorher/nachher verweist nicht auf das neue Projekt');
}
// v2 mit derselben Fixture
const v2 = spawnSync('node', ['scripts/uebernehmen.mjs'], { cwd: 'v2', encoding: 'utf8' });
const v2b = spawnSync('npx', ['astro', 'build', '--outDir', 'dist-fixture'], { cwd: 'v2', env: { ...process.env, AYLOUL_PROJEKTE: '../' + fixture }, encoding: 'utf8' });
b.pruefe(v2.status === 0 && v2b.status === 0, `v2-Fixture-Build fehlgeschlagen: ${v2b.stderr?.slice(-300)}`);
if (v2b.status === 0) {
  const html = await readFile('v2/dist-fixture/index.html', 'utf8');
  b.pruefe(new RegExp(`data-zaehlen="${projekte.length + 1}"`).test(html), 'v2-Fixture: Projektzahl steigt nicht');
}
await rm('dist-fixture', { recursive: true, force: true });
await rm('v2/dist-fixture', { recursive: true, force: true });
await rm(fixture, { force: true });

// 3. keine Anzahl als Zahlwort/Ziffer in Texten
const zahlwoerter = /(^|[\s،,])(اثنان|ثلاثة|ثلاث|أربعة|أربع|خمسة|خمس|ستة|ست|سبعة|سبع|ثمانية|ثماني|تسعة|تسع|عشرة)(\s|$)|\b(two|three|four|five|six|seven|eight|nine|ten)\b/i;
for (const f of ['src/i18n/ar.json', 'src/i18n/en.json', 'v2/src/i18n/ar.json']) {
  const flach = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flach(v, p + k + '.') : [[p + k, String(v)]]));
  for (const [k, v] of flach(JSON.parse(await readFile(f, 'utf8')))) {
    b.pruefe(!zahlwoerter.test(v), `${f} ${k}: Anzahl als Zahlwort: "${v.slice(0, 60)}"`);
  }
}
process.exitCode = b.ende() ? 0 : 1;
