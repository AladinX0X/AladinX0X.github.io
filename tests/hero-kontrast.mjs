// Kontrast für Text auf Bildern (Hero jeder Seite, Kopf über dem Hero, Bild-Teaser der Projektseiten):
// Schrift unsichtbar machen, Bereich fotografieren, in jedem Textfeld die hellste Stelle (98. Perzentil der
// Leuchtdichte) messen und das Kontrastverhältnis zur Textfarbe berechnen.
// Ziel: mind. 4.5:1 (große Schrift mind. 3:1). Startseite zusätzlich bei 1920 px.
import sharp from 'sharp';
import { starteServer } from './server.mjs';
import { browserStarten, seitenPfade, Bericht } from './hilfen.mjs';

const { server, basis } = await starteServer();
const browser = await browserStarten();
const b = new Bericht('Kontrast: Text auf Bildern (hellste Stelle hinter dem Text), alle Seiten');
const lum = (r, g, bb) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bb); };
const verh = (a, c) => (Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05);
const ergebnisse = [];
const pfade = [...(await seitenPfade()), '/404.html'];

// Textfelder in einem Bereich sammeln (ohne Knöpfe, die eigenen Hintergrund haben)
function sammeln(selektor) {
  const aus = [];
  for (const el of document.querySelectorAll(selektor)) {
    if (!el.checkVisibility()) continue;
    const direkt = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!direkt || el.closest('.knopf')) continue;
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) continue;
    const cs = getComputedStyle(el);
    const m = cs.color.match(/\d+(\.\d+)?/g).map(Number);
    const gross = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
    aus.push({ text: el.textContent.trim().slice(0, 30), x: r.x, y: r.y, w: r.width, h: r.height, farbe: m.slice(0, 3), gross });
  }
  return aus;
}
const VERSTECKEN = '[data-hero] .hero-text *, .kopf *, [data-text-auf-bild] * { color: transparent !important; } [data-hero] .hero-text svg, [data-hero] .knopf, .kopf img, .kopf svg, .menue-knopf, [data-text-auf-bild] svg { visibility: hidden !important; } .sprache-desktop, .kopf-nav a { border-color: transparent !important; } .scroll-hinweis { visibility: hidden !important; }';

async function messen(seite, felder, name) {
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
    const v = verh(lum(...f.farbe), werte[Math.floor(werte.length * 0.98)]);
    const soll = f.gross ? 3 : 4.5;
    ergebnisse.push(`${name} "${f.text}": ${v.toFixed(2)}:1`);
    b.pruefe(v >= soll, `${name} "${f.text}": ${v.toFixed(2)}:1 an der hellsten Stelle (soll ${soll})`);
  }
}

const groessen = (p) => (p === '/ar/' || p === '/en/' ? [[1440, 900], [375, 812], [1920, 1080]] : [[1440, 900], [375, 812]]);
for (const p of pfade) {
  for (const [w, h] of groessen(p)) {
    const seite = await browser.newPage({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    await seite.goto(basis + p, { waitUntil: 'networkidle' });
    await seite.evaluate(() => document.fonts.ready);
    // 1. Hero + Kopf über dem Hero (nur Vollbild-Hero: Text liegt auf dem Bild)
    if (await seite.locator('.hero-vollbild').count()) {
      const felder = await seite.evaluate(sammeln, '.hero-vollbild .hero-text *, .kopf.ueber-hero .kopf-nav a, .kopf.ueber-hero .sprache-desktop, .kopf.ueber-hero .menue-text');
      const stil = await seite.addStyleTag({ content: VERSTECKEN });
      await messen(seite, felder, `${p} @${w} Hero`);
      await stil.evaluate((e) => e.remove());
    }
    // 2. Text auf Bild-Teasern
    const teaser = seite.locator('[data-text-auf-bild]');
    for (let i = 0; i < await teaser.count(); i++) {
      await teaser.nth(i).scrollIntoViewIfNeeded();
      await seite.evaluate(() => window.scrollBy(0, -100));
      const felder = await seite.evaluate(sammeln, `[data-text-auf-bild]:nth-of-type(n) *`);
      const stil = await seite.addStyleTag({ content: VERSTECKEN });
      await messen(seite, felder, `${p} @${w} Teaser ${i + 1}`);
      await stil.evaluate((e) => e.remove());
    }
    await seite.close();
  }
}
const ok = b.ende();
if (process.argv.includes('--werte')) console.log(ergebnisse.join('\n'));
await browser.close();
server.close();
process.exitCode = ok ? 0 : 1;
