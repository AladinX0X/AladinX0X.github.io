// Screenshots jeder Seite bei 375 und 1440 px (ganze Seite) nach screenshots/<sprache>/.
// Aufruf: node tests/screenshots.mjs [filter]   z. B. node tests/screenshots.mjs /ar/projects
import { mkdir } from 'node:fs/promises';
import { starteServer } from './server.mjs';
import { seitenPfade, browserStarten } from './hilfen.mjs';

const filter = process.argv[2] ?? '';
const { server, basis } = await starteServer();
const browser = await browserStarten();
const pfade = (await seitenPfade()).filter((p) => p.includes(filter));
pfade.push('/404.html');
let n = 0;
for (const breite of [375, 1440]) {
  const seite = await browser.newPage({ viewport: { width: breite, height: breite === 375 ? 812 : 900 }, reducedMotion: 'reduce' });
  for (const p of pfade) {
    if (filter && !p.includes(filter)) continue;
    await seite.goto(basis + p, { waitUntil: 'networkidle' });
    await seite.evaluate(async () => {
      await document.fonts.ready;
      // Lazy-Bilder laden: einmal durch die Seite scrollen
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
      window.scrollTo(0, 0);
      await Promise.all([...document.images].map((i) => i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })));
    });
    const name = (p.replace(/^\/|\/$/g, '').replace(/\//g, '_') || 'start').replace('.html', '');
    await mkdir('screenshots', { recursive: true });
    await seite.screenshot({ path: `screenshots/${name}_${breite}.png`, fullPage: true });
    n++;
  }
  await seite.close();
}
await browser.close();
server.close();
console.log(`${n} Screenshots in screenshots/`);
