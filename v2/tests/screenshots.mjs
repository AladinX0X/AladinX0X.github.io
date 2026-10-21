// Screenshots: jede Folie bei 1440x900 (nach dem Aufbau der Diagramme) und die ganze Seite bei 375 px.
import { mkdir } from 'node:fs/promises';
import { starteServer } from '../../tests/server.mjs';
import { browserStarten } from '../../tests/hilfen.mjs';

await mkdir('screenshots', { recursive: true });
const { server, basis } = await starteServer('dist');
const browser = await browserStarten();

const s = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await s.goto(basis + '/', { waitUntil: 'networkidle' });
await s.evaluate(() => document.fonts.ready);
const ids = await s.$$eval('[data-folie]', (el) => el.map((e) => e.id));
for (const [i, id] of ids.entries()) {
  await s.evaluate((x) => document.getElementById(x).scrollIntoView({ behavior: 'instant' }), id);
  await s.waitForTimeout(1800);
  await s.screenshot({ path: `screenshots/folie-${String(i + 1).padStart(2, '0')}_1440.png` });
}
await s.close();

const m = await browser.newPage({ viewport: { width: 375, height: 800 } });
await m.goto(basis + '/', { waitUntil: 'networkidle' });
const hoehe = await m.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < hoehe; y += 600) { await m.evaluate((yy) => window.scrollTo(0, yy), y); await m.waitForTimeout(250); }
await m.waitForTimeout(1500);
await m.screenshot({ path: 'screenshots/ganze-seite_375.png', fullPage: true });
await m.close();

await browser.close();
server.close();
console.log(`${ids.length + 1} Screenshots in v2/screenshots/`);
