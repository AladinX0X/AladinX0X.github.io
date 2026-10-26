// Kontrast für Text auf dem Hero-Bild: Text ausblenden, Hero fotografieren, in jedem Textfeld die hellste Stelle
// (98. Perzentil der Leuchtdichte) messen und das Kontrastverhältnis zur Textfarbe berechnen.
// Ziel: mind. 4.5:1 (große Schrift mind. 3:1). Auch für die Szene "Hauptprojekt" (Text über dem Vollbild).
import sharp from 'sharp';
import { starteServer } from './server.mjs';
import { browserStarten, Bericht } from './hilfen.mjs';

const { server, basis } = await starteServer();
const browser = await browserStarten();
const b = new Bericht('Kontrast: Text auf dem Hero-Bild (hellste Stelle hinter dem Text)');
const lum = (r, g, bb) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bb); };
const verh = (a, c) => (Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05);
const ergebnisse = [];

for (const lang of ['ar', 'en']) {
  for (const [w, h] of [[1440, 900], [375, 812], [1920, 1080]]) {
    const seite = await browser.newPage({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    await seite.goto(`${basis}/${lang}/`, { waitUntil: 'networkidle' });
    await seite.evaluate(() => document.fonts.ready);
    const felder = await seite.evaluate(() => {
      const aus = [];
      for (const el of document.querySelectorAll('[data-hero] .hero-text *, .kopf.ueber-hero .kopf-nav a, .kopf.ueber-hero .sprache-desktop, .kopf.ueber-hero .menue-text')) {
        if (!el.checkVisibility()) continue;
        const direkt = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (!direkt) continue;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const m = cs.color.match(/\d+(\.\d+)?/g).map(Number);
        const gross = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
        // Knöpfe haben einen eigenen Hintergrund: nicht über dem Bild messen
        if (el.closest('.knopf')) continue;
        aus.push({ text: el.textContent.trim().slice(0, 30), x: r.x, y: r.y, w: r.width, h: r.height, farbe: m.slice(0, 3), gross });
      }
      // Nur die Schrift unsichtbar machen (eigene Hintergründe hinter dem Text bleiben stehen)
      const stil = document.createElement('style');
      stil.textContent = '[data-hero] .hero-text *, .kopf * { color: transparent !important; } [data-hero] .hero-text svg, [data-hero] .knopf, .kopf img, .kopf svg, .menue-knopf { visibility: hidden !important; } .sprache-desktop { border-color: transparent !important; } .scroll-hinweis { visibility: hidden !important; }';
      document.head.append(stil);
      return aus;
    });
    const png = await seite.screenshot();
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    for (const f of felder) {
      const werte = [];
      const x0 = Math.max(0, Math.floor(f.x)), y0 = Math.max(0, Math.floor(f.y));
      const x1 = Math.min(info.width, Math.ceil(f.x + f.w)), y1 = Math.min(info.height, Math.ceil(f.y + f.h));
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = (y * info.width + x) * info.channels;
        werte.push(lum(data[i], data[i + 1], data[i + 2]));
      }
      if (!werte.length) continue;
      werte.sort((a, c) => a - c);
      const hell = werte[Math.floor(werte.length * 0.98)];
      const v = verh(lum(...f.farbe), hell);
      const soll = f.gross ? 3 : 4.5;
      ergebnisse.push(`${lang} ${w}px "${f.text}": ${v.toFixed(2)}:1`);
      b.pruefe(v >= soll, `${lang} @${w}px "${f.text}": ${v.toFixed(2)}:1 an der hellsten Stelle (soll ${soll})`);
    }
    await seite.close();
  }
}
const ok = b.ende();
if (process.argv.includes('--werte')) console.log(ergebnisse.join('\n'));
await browser.close();
server.close();
process.exitCode = ok ? 0 : 1;
