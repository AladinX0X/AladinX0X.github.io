// Lighthouse (mobil) gegen den lokalen Produktions-Build und Messung der JavaScript-Menge pro Seite (gzip).
// Budget: Performance >= 90, Barrierefreiheit >= 95, LCP < 2.5 s, CLS < 0.05, JS <= 120 KB gzip.
// Jede Seite wird 3-mal gemessen, gewertet wird der Median (einzelne Läufe schwanken lokal um ±0.4 s).
// Aufruf (nach npm run build): node tests/lighthouse.mjs
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { chromium } from 'playwright';
import { starteServer } from './server.mjs';
import { Bericht } from './hilfen.mjs';

const SEITEN = process.env.SEITEN ? process.env.SEITEN.split(',') : ['/ar/', '/en/', '/ar/about/', '/ar/approach/', '/ar/services/', '/ar/services/3d-visualization/', '/ar/projects/', '/ar/projects/villa-homs/', '/ar/projects/villa-interior-uae/', '/ar/projects/apartment-shop-drawings/', '/en/projects/ayloul-brand-identity/', '/ar/contact/', '/404.html'];
const { server, basis } = await starteServer('dist', 4399);
const chrome = await chromeLauncher.launch({ chromePath: process.env.CHROME_PATH || chromium.executablePath(), chromeFlags: ['--headless=new', '--no-sandbox'] });
const b = new Bericht('Lighthouse mobil: Performance >= 90, Barrierefreiheit >= 95, LCP < 2.5 s, CLS < 0.05, JS <= 120 KB');
const zeilen = ['| Seite | Performance | Barrierefreiheit | LCP | CLS | TBT | JS (gzip) |', '|---|---|---|---|---|---|---|'];
await mkdir('screenshots/lighthouse', { recursive: true });

// JS-Menge pro Seite: alle Skripte, die die Seite lädt (auch dynamisch nachgeladene), gzip-komprimiert gemessen
async function jsGroesse(url) {
  const browser = await chromium.launch();
  const s = await browser.newPage({ viewport: { width: 412, height: 823 } });
  const dateien = new Set();
  s.on('response', (r) => { if (r.request().resourceType() === 'script') dateien.add(new URL(r.url()).pathname); });
  await s.goto(url, { waitUntil: 'networkidle' });
  await s.waitForTimeout(500);
  await browser.close();
  let summe = 0;
  for (const d of dateien) summe += gzipSync(await readFile('dist' + d)).length;
  return summe / 1024;
}

for (const p of SEITEN) {
  const url = basis + p;
  const laeufe = [];
  for (let i = 0; i < 3; i++) laeufe.push((await lighthouse(url, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility'], formFactor: 'mobile' })).lhr);
  laeufe.sort((a, c) => a.categories.performance.score - c.categories.performance.score);
  const lhr = laeufe[1];
  const perf = Math.round(lhr.categories.performance.score * 100);
  const a11y = Math.round(lhr.categories.accessibility.score * 100);
  const lcp = lhr.audits['largest-contentful-paint'].numericValue / 1000;
  const cls = lhr.audits['cumulative-layout-shift'].numericValue;
  const tbt = lhr.audits['total-blocking-time'].numericValue;
  const js = await jsGroesse(url);
  zeilen.push(`| ${p} | ${perf} | ${a11y} | ${lcp.toFixed(2)} s | ${cls.toFixed(3)} | ${Math.round(tbt)} ms | ${js.toFixed(1)} KB |`);
  b.pruefe(perf >= 90, `${p}: Performance ${perf}`);
  b.pruefe(a11y >= 95, `${p}: Barrierefreiheit ${a11y}`);
  b.pruefe(lcp < 2.5, `${p}: LCP ${lcp.toFixed(2)} s`);
  b.pruefe(cls < 0.05, `${p}: CLS ${cls.toFixed(3)}`);
  b.pruefe(js <= 120, `${p}: JS ${js.toFixed(1)} KB gzip`);
  const fehlend = Object.values(lhr.audits).filter((a) => a.score !== null && a.score < 1 && lhr.categories.accessibility.auditRefs.some((r) => r.id === a.id)).map((a) => a.id);
  if (fehlend.length) console.log(`  ${p} Barrierefreiheit-Hinweise: ${fehlend.join(', ')}`);
  await writeFile(`screenshots/lighthouse/${p.replace(/\//g, '_')}.json`, JSON.stringify({ perf, a11y, lcp, cls, tbt, js, lcpElement: lhr.audits['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet }, null, 2));
}
console.log(zeilen.join('\n'));
const ok = b.ende();
await chrome.kill();
server.close();
process.exitCode = ok ? 0 : 1;
