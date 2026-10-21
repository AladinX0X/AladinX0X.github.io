// Browser-Prüfungen mit Playwright: Layout, Abstände, fremde Hosts, h1, Kontrast, Interaktion.
import { starteServer } from './server.mjs';
import { seitenPfade, browserStarten, Bericht } from './hilfen.mjs';

const { server, basis } = await starteServer();
const browser = await browserStarten();
const pfade = await seitenPfade();
const ergebnisse = [];
const host = new URL(basis).host;

// ---------- Layout, Abstände, fremde Hosts, Kontrast ----------
const layout = new Bericht('Layout: kein horizontaler Überlauf 375–1440 px, Navigation einzeilig');
const abstaende = new Bericht('Abstände: jeder Abschnitt mit oberem Innenabstand');
const fremd = new Bericht('Keine Anfragen an fremde Hosts');
const kontrast = new Bericht('Kontrast mind. WCAG AA');

for (const breite of [375, 768, 1024, 1440]) {
  const seite = await browser.newPage({ viewport: { width: breite, height: 900 }, reducedMotion: 'reduce' });
  seite.on('request', (r) => {
    const u = new URL(r.url());
    if (!['data:', 'blob:'].includes(u.protocol)) fremd.pruefe(u.host === host, `${r.url()} angefragt`);
  });
  for (const p of [...pfade, '/404.html']) {
    await seite.goto(basis + p, { waitUntil: 'networkidle' });
    await seite.evaluate(() => document.fonts.ready);
    const m = await seite.evaluate(() => {
      const ueber = document.documentElement.scrollWidth - window.innerWidth;
      const nav = document.querySelector('.kopf-nav');
      let navZeilen = 0;
      if (nav && getComputedStyle(nav).display !== 'none') {
        navZeilen = new Set([...nav.querySelectorAll('li')].map((li) => Math.round(li.getBoundingClientRect().top))).size;
      }
      const kopf = document.querySelector('.kopf-innen');
      const kopfHoehe = kopf ? kopf.getBoundingClientRect().height : 0;
      const ohneAbstand = [...document.querySelectorAll('main > section, main > article > section, main section.abschnitt')]
        .filter((s) => parseFloat(getComputedStyle(s).paddingTop) <= 0).map((s) => s.getAttribute('aria-labelledby') || s.className);
      return { ueber, navZeilen, kopfHoehe, ohneAbstand };
    });
    layout.pruefe(m.ueber <= 0, `${p} @${breite}px: ${m.ueber}px horizontaler Überlauf`);
    layout.pruefe(m.navZeilen <= 1, `${p} @${breite}px: Navigation in ${m.navZeilen} Zeilen`);
    if (breite === 1440 || breite === 375) for (const s of m.ohneAbstand) abstaende.pruefe(false, `${p} @${breite}px: Abschnitt ohne oberen Innenabstand (${s})`);
    abstaende.pruefe(true, 'ok');

    if (breite === 375 || breite === 1440) {
      const probleme = await seite.evaluate(() => {
        const farbe = (s) => {
          const m = s.match(/rgba?\(([^)]+)\)/);
          if (!m) return null;
          const t = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
          return { r: t[0], g: t[1], b: t[2], a: t.length > 3 ? t[3] : 1 };
        };
        const mische = (o, u) => ({ r: o.r * o.a + u.r * (1 - o.a), g: o.g * o.a + u.g * (1 - o.a), b: o.b * o.a + u.b * (1 - o.a), a: 1 });
        const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
        const verh = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
        const hintergrund = (el) => {
          const schichten = [];
          for (let e = el; e; e = e.parentElement) {
            const cs = getComputedStyle(e);
            if (e.matches('[data-ueber-bild]')) return null;
            const c = farbe(cs.backgroundColor);
            if (c && c.a > 0) { schichten.push(c); if (c.a >= 0.99) break; }
          }
          let erg = { r: 255, g: 255, b: 255, a: 1 };
          for (let i = schichten.length - 1; i >= 0; i--) erg = mische(schichten[i], erg);
          return erg;
        };
        const aus = [];
        const alle = document.querySelectorAll('body *');
        for (const el of alle) {
          if (!['P', 'SPAN', 'A', 'LI', 'H1', 'H2', 'H3', 'H4', 'DT', 'DD', 'LABEL', 'BUTTON', 'FIGCAPTION', 'SMALL', 'STRONG', 'BDI', 'TD', 'TH', 'LEGEND', 'TEXT', 'TSPAN'].includes(el.tagName.toUpperCase())) continue;
          const direkt = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
          if (!direkt) continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || el.closest('[hidden], .unsichtbar, .zum-inhalt')) continue;
          let c = farbe(el.tagName.toUpperCase() === 'TEXT' || el.tagName.toUpperCase() === 'TSPAN' ? cs.fill : cs.color);
          if (!c) continue;
          let op = 1;
          for (let e = el; e; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity);
          c = { ...c, a: c.a * op };
          const bg = hintergrund(el);
          if (!bg) continue;
          const v = verh(mische(c, bg), bg);
          const gr = parseFloat(cs.fontSize), gew = parseInt(cs.fontWeight, 10);
          const gross = gr >= 24 || (gr >= 18.66 && gew >= 700);
          const soll = gross ? 3 : 4.5;
          if (v < soll) aus.push(`${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 40)}" ${v.toFixed(2)}:1 (soll ${soll})`);
        }
        return aus;
      });
      kontrast.pruefe(probleme.length === 0, `${p} @${breite}px: ${probleme.slice(0, 4).join(' | ')}`);
    }
  }
  await seite.close();
}
ergebnisse.push(layout.ende(), abstaende.ende(), fremd.ende(), kontrast.ende());

// ---------- Interaktion ----------
const ia = new Bericht('Interaktion: Menü, Filter, Lightbox, Formular, Sprachumschalter');
const hat = (p) => pfade.includes(p);

// Mobiles Menü
{
  const s = await browser.newPage({ viewport: { width: 375, height: 800 } });
  await s.goto(basis + '/ar/');
  const knopf = s.locator('[data-menue-knopf]');
  ia.pruefe(await knopf.isVisible(), 'Menü-Knopf mobil nicht sichtbar');
  await knopf.click();
  ia.pruefe(await s.locator('#mobilmenue').isVisible(), 'Mobiles Menü öffnet nicht');
  ia.pruefe((await knopf.getAttribute('aria-expanded')) === 'true', 'aria-expanded nicht true');
  const box = await s.locator('#mobilmenue').boundingBox();
  ia.pruefe(box && box.height >= 800 - 80, `Mobiles Menü nicht voll hoch (${box?.height})`);
  const bg = await s.locator('#mobilmenue').evaluate((e) => getComputedStyle(e).backgroundColor);
  ia.pruefe(bg === 'rgb(5, 47, 36)', `Mobiles Menü nicht deckend Waldgrün (${bg})`);
  await s.keyboard.press('Escape');
  ia.pruefe(!(await s.locator('#mobilmenue').isVisible()), 'Esc schließt das Menü nicht');
  await s.close();
}

// Projektfilter per Maus und Tastatur
if (hat('/ar/projects/')) {
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await s.goto(basis + '/ar/projects/');
  const sichtbar = () => s.locator('[data-projekt]:visible').count();
  const alle = await sichtbar();
  await s.locator('[data-filter="interior"]').click();
  const innen = await sichtbar();
  ia.pruefe(innen > 0 && innen < alle, `Filter "Innen" per Maus wirkt nicht (${innen}/${alle})`);
  ia.pruefe((await s.locator('[data-filter="interior"]').getAttribute('aria-pressed')) === 'true', 'Filter: aria-pressed nicht gesetzt');
  await s.locator('[data-filter="graphic"]').focus();
  await s.keyboard.press('Enter');
  const grafik = await sichtbar();
  ia.pruefe(grafik >= 1 && grafik < alle, `Filter "Grafik" per Tastatur wirkt nicht (${grafik})`);
  await s.locator('[data-filter="alle"]').focus();
  await s.keyboard.press('Space');
  ia.pruefe((await sichtbar()) === alle, 'Filter "Alle" stellt nicht alle wieder her');
  const meldung = await s.locator('[data-filter-anzahl]').textContent();
  ia.pruefe(/\d/.test(meldung ?? '') && !/[٠-٩]/.test(meldung ?? ''), `Anzahl-Meldung fehlt oder falsche Ziffern: ${meldung}`);
  await s.close();
}

// Lightbox per Tastatur
const projektSeite = pfade.find((p) => /^\/ar\/projects\/[^/]+\/$/.test(p));
if (projektSeite) {
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await s.goto(basis + projektSeite);
  const erster = s.locator('[data-lightbox-index]').first();
  await erster.focus();
  await s.keyboard.press('Enter');
  const dialog = s.locator('dialog[data-lightbox]');
  ia.pruefe(await dialog.isVisible(), 'Lightbox öffnet nicht per Enter');
  const src1 = await dialog.locator('img').getAttribute('src');
  await s.keyboard.press('ArrowLeft');
  await s.keyboard.press('ArrowRight');
  await s.keyboard.press('ArrowRight');
  const src2 = await dialog.locator('img').getAttribute('src');
  ia.pruefe(src1 !== src2, 'Pfeiltasten wechseln das Bild nicht');
  for (let i = 0; i < 6; i++) await s.keyboard.press('Tab');
  const fokusDrin = await s.evaluate(() => document.querySelector('dialog[data-lightbox]').contains(document.activeElement));
  ia.pruefe(fokusDrin, 'Fokus verlässt die Lightbox');
  await s.keyboard.press('Escape');
  ia.pruefe(!(await dialog.isVisible()), 'Esc schließt die Lightbox nicht');
  const fokusZurueck = await s.evaluate(() => document.activeElement?.hasAttribute('data-lightbox-index'));
  ia.pruefe(fokusZurueck, 'Fokus kehrt nicht zum Auslöser zurück');
  await s.close();
}

// Formularfehler
for (const lang of ['ar', 'en']) {
  if (!hat(`/${lang}/contact/`)) continue;
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await s.goto(basis + `/${lang}/contact/`);
  await s.locator('form[data-formular] button[type="submit"]').click();
  const fehlerName = await s.locator('#fehler-name').textContent();
  ia.pruefe(Boolean(fehlerName?.trim()), `${lang}: Pflichtfeld-Fehler beim Namen fehlt`);
  ia.pruefe(lang === 'ar' ? /[؀-ۿ]/.test(fehlerName ?? '') : /^[\x00-\x7F]+$/.test(fehlerName ?? ''), `${lang}: Fehlermeldung nicht in Seitensprache: ${fehlerName}`);
  ia.pruefe((await s.locator('#feld-name').getAttribute('aria-invalid')) === 'true', `${lang}: aria-invalid fehlt`);
  await s.fill('#feld-name', 'Test');
  await s.fill('#feld-email', 'falsch');
  await s.fill('#feld-betreff', 'Test');
  await s.fill('#feld-nachricht', 'Eine ausreichend lange Nachricht.');
  await s.locator('form[data-formular] button[type="submit"]').click();
  ia.pruefe(Boolean((await s.locator('#fehler-email').textContent())?.trim()), `${lang}: E-Mail-Fehler fehlt`);
  await s.fill('#feld-email', 'name@example.com');
  await s.locator('form[data-formular] button[type="submit"]').click();
  ia.pruefe(await s.locator('[data-formular-erfolg]').isVisible(), `${lang}: Erfolgsmeldung nach gültiger Eingabe fehlt`);
  await s.close();
}

// Sprachumschalter führt auf dieselbe Seite
if (hat('/en/')) {
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  for (const p of pfade.filter((x) => x.startsWith('/ar/'))) {
    await s.goto(basis + p);
    const href = await s.locator('.sprache-desktop').first().getAttribute('href');
    ia.pruefe(href === p.replace('/ar/', '/en/'), `${p}: Sprachumschalter zeigt auf ${href}`);
  }
  await s.goto(basis + '/en/projects/');
  await s.locator('.sprache-desktop').first().click();
  await s.waitForLoadState();
  ia.pruefe(new URL(s.url()).pathname === '/ar/projects/', `Klick auf Sprachumschalter landet auf ${s.url()}`);
  await s.close();
}
ergebnisse.push(ia.ende());

await browser.close();
server.close();
process.exitCode = ergebnisse.every(Boolean) ? 0 : 1;
