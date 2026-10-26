// Bewegung: reduzierte Bewegung, ohne JavaScript, Seitenwechsel mit View Transitions.
//  - prefers-reduced-motion: alle Inhalte sichtbar, keine gepinnten Abschnitte, kein GSAP/Lenis geladen
//  - ohne JavaScript: alle Inhalte sichtbar
//  - Startseite → Projekt → zurück: Animationen laufen wieder, Anzahl ScrollTrigger wächst nicht, keine Konsolenfehler
import { starteServer } from './server.mjs';
import { browserStarten, Bericht } from './hilfen.mjs';

const { server, basis } = await starteServer();
const browser = await browserStarten();
const ergebnisse = [];

// Alle Textelemente in main: sichtbar (Deckkraft mind. 0.6 – gestalterisch gedämpfte Texte haben 0.85 –, nicht versteckt)
const unsichtbareTexte = () => {
  const aus = [];
  for (const el of document.querySelectorAll('main p, main h1, main h2, main h3, main li, main a, main dt, main dd')) {
    if (el.closest('[hidden], dialog, .unsichtbar')) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    let op = 1;
    for (let e = el; e; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity);
    if (op < 0.6 || getComputedStyle(el).visibility === 'hidden') aus.push(`${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 30)}" (${op.toFixed(2)})`);
  }
  return aus;
};
const SEITEN = ['/ar/', '/en/', '/ar/projects/', '/ar/projects/villa-uae/', '/en/contact/', '/ar/approach/'];

{
  const b = new Bericht('Reduzierte Bewegung: alles sichtbar, keine Pins, kein GSAP/Lenis');
  for (const breite of [1440, 375]) {
    const s = await browser.newPage({ viewport: { width: breite, height: 900 }, reducedMotion: 'reduce' });
    for (const p of SEITEN) {
      await s.goto(basis + p, { waitUntil: 'networkidle' });
      await s.waitForTimeout(300);
      const aus = await s.evaluate(unsichtbareTexte);
      b.pruefe(aus.length === 0, `${p} @${breite}: unsichtbar: ${aus.slice(0, 3).join(' | ')}`);
      const pins = await s.locator('.pin-spacer').count();
      b.pruefe(pins === 0, `${p} @${breite}: ${pins} gepinnte Abschnitte`);
      b.pruefe(await s.evaluate(() => !window.__ayloul && !document.documentElement.classList.contains('lenis-an')), `${p} @${breite}: GSAP/Lenis trotz reduzierter Bewegung aktiv`);
    }
    await s.close();
  }
  ergebnisse.push(b.ende());
}

{
  const b = new Bericht('Ohne JavaScript: alle Inhalte sichtbar');
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const s = await ctx.newPage();
  for (const p of SEITEN) {
    await s.goto(basis + p, { waitUntil: 'networkidle' });
    // Der Hero-Einstieg ist reines CSS (ca. 1.8 s): nach dem Einstieg prüfen
    await s.waitForTimeout(2200);
    const aus = await s.evaluate(unsichtbareTexte);
    b.pruefe(aus.length === 0, `${p}: unsichtbar ohne JS: ${aus.slice(0, 3).join(' | ')}`);
  }
  await ctx.close();
  ergebnisse.push(b.ende());
}

{
  const b = new Bericht('View Transitions: Startseite → Projekt → zurück ohne Lecks und Fehler');
  for (const breite of [1440, 375]) {
    const s = await browser.newPage({ viewport: { width: breite, height: 900 } });
    const fehler = [];
    s.on('console', (m) => { if (m.type() === 'error') fehler.push(m.text()); });
    s.on('pageerror', (e) => fehler.push(String(e)));
    await s.goto(basis + '/ar/', { waitUntil: 'networkidle' });
    await s.waitForFunction(() => Boolean(window.__ayloul));
    await s.waitForTimeout(800);
    const vorher = await s.evaluate(() => window.__ayloul.scrollTrigger());
    b.pruefe(vorher > 0, `@${breite}: keine ScrollTrigger auf der Startseite`);
    // Zu einer Projektkarte scrollen und klicken (Bild-Morph per transition:name)
    const karte = s.locator('.karte .titel a').first();
    await karte.scrollIntoViewIfNeeded();
    await s.waitForTimeout(400);
    await karte.click();
    await s.waitForURL(/\/ar\/projects\/[^/]+\/$/);
    await s.waitForTimeout(1200);
    b.pruefe(await s.evaluate(() => document.querySelectorAll('dialog[data-lightbox]').length === 1), `@${breite}: Projektseite nach Wechsel ohne Lightbox`);
    // Lightbox funktioniert nach dem Seitenwechsel (Skripte neu initialisiert)
    await s.locator('[data-lightbox-index="0"]').click();
    b.pruefe(await s.locator('dialog[data-lightbox]').isVisible(), `@${breite}: Lightbox öffnet nach dem Seitenwechsel nicht`);
    await s.keyboard.press('Escape');
    for (let runde = 0; runde < 2; runde++) {
      await s.goBack();
      await s.waitForURL(/\/ar\/$/);
      await s.waitForFunction(() => Boolean(window.__ayloul) && document.querySelector('[data-hero]'));
      await s.waitForTimeout(1500);
      const nachher = await s.evaluate(() => window.__ayloul.scrollTrigger());
      b.pruefe(nachher === vorher, `@${breite} Runde ${runde + 1}: ScrollTrigger ${vorher} → ${nachher}`);
      const heroSichtbar = await s.evaluate(() => {
        const h = document.querySelector('.hero-claim');
        return h ? parseFloat(getComputedStyle(h.querySelector('.wort') ?? h).opacity) > 0.95 : false;
      });
      b.pruefe(heroSichtbar, `@${breite} Runde ${runde + 1}: Hero-Text nach dem Zurückgehen nicht eingeblendet`);
      const menueKnoepfe = await s.locator('[data-menue-knopf]').count();
      b.pruefe(menueKnoepfe === 1, `@${breite}: ${menueKnoepfe} Menü-Knöpfe`);
      if (runde === 0) {
        await s.goForward();
        await s.waitForURL(/\/ar\/projects\//);
        await s.waitForTimeout(800);
      }
    }
    b.pruefe(fehler.length === 0, `@${breite}: Konsolenfehler: ${fehler.slice(0, 3).join(' | ')}`);
    if (breite === 1440) b.pruefe(await s.evaluate(() => window.__ayloul.lenis()), '@1440: Lenis nicht aktiv (Desktop)');
    await s.close();
  }
  ergebnisse.push(b.ende());
}

await browser.close();
server.close();
process.exitCode = ergebnisse.every(Boolean) ? 0 : 1;
