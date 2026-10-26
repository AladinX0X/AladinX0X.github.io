// Screenshots der gepinnten Szenen ([data-szene]) einer Seite bei 0 %, 50 % und 100 % Fortschritt,
// bei 1440 und 375 px, Arabisch und Englisch, plus erster Bildschirm.
// Aufruf (nach npm run build): node tests/szenen.mjs [zielordner] [seite …]
//   z. B. node tests/szenen.mjs screenshots/szenen "" approach/ projects/villa-uae/
//   Ohne Seitenangabe: alle Seiten mit Szenen (Startseite, Arbeitsweise, Leistungen, Projekte).
import { mkdir } from 'node:fs/promises';
import { starteServer } from './server.mjs';
import { browserStarten } from './hilfen.mjs';

const ziel = process.argv[2] || 'screenshots/szenen';
const seiten = process.argv.length > 3 ? process.argv.slice(3) : ['', 'about/', 'approach/', 'services/', 'projects/villa-homs/', 'projects/apartment-shop-drawings/', 'projects/ayloul-brand-identity/', 'projects/villa-interior-uae/'];
const { server, basis } = await starteServer();
const browser = await browserStarten();
await mkdir(ziel, { recursive: true });
let n = 0;
for (const seitePfad of seiten) {
  const name = seitePfad.replace(/\/$/, '').replace(/\//g, '_') || 'start';
  for (const lang of ['ar', 'en']) {
    for (const breite of [1440, 375]) {
      const seite = await browser.newPage({ viewport: { width: breite, height: breite === 375 ? 812 : 900 } });
      await seite.goto(`${basis}/${lang}/${seitePfad}`, { waitUntil: 'networkidle' });
      await seite.waitForFunction(() => Boolean(window.__ayloul));
      await seite.evaluate(() => document.fonts.ready);
      await seite.waitForTimeout(1800);
      await seite.screenshot({ path: `${ziel}/${name}_${lang}_${breite}_oben.png` });
      n++;
      // Szenen ohne ScrollTrigger (mobil ohne Pin): Abschnitt oben, Mitte, Ende im Bild
      const szenen = await seite.evaluate(() => {
        const mit = window.__ayloul.szenen();
        for (const el of document.querySelectorAll('[data-szene]')) {
          if (mit.some((s) => s.name === el.dataset.szene)) continue;
          const oben = el.getBoundingClientRect().top + window.scrollY;
          mit.push({ name: el.dataset.szene, start: oben, end: oben + Math.max(0, el.offsetHeight - window.innerHeight), pin: false });
        }
        return mit;
      });
      for (const s of szenen) {
        for (const p of [0, 0.5, 1]) {
          const y = Math.round(s.start + (s.end - s.start) * p);
          await seite.evaluate((y) => window.scrollTo(0, y), y);
          await seite.waitForTimeout(1400);
          await seite.screenshot({ path: `${ziel}/${name}_${lang}_${breite}_${s.name}_${Math.round(p * 100)}.png` });
          n++;
        }
      }
      await seite.close();
    }
  }
}
await browser.close();
server.close();
console.log(`${n} Szenen-Screenshots in ${ziel}/`);
