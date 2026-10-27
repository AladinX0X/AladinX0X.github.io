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
            // Text über einem Bild (Hero, Kopf über dem Hero): eigener Test tests/hero-kontrast.mjs
            if (e.matches('[data-ueber-bild], .ueber-hero')) return null;
            const c = farbe(cs.backgroundColor);
            if (c && c.a > 0) { schichten.push(c); if (c.a >= 0.99) break; }
            // Flächiger Hintergrund als ::before (z. B. Kopfzeile mit Weichzeichner)
            const vor = getComputedStyle(e, '::before');
            if (vor.content !== 'none' && vor.position === 'absolute' && vor.inset === '0px') {
              const v = farbe(vor.backgroundColor);
              if (v && v.a > 0) { const vv = { ...v, a: v.a * parseFloat(vor.opacity) }; schichten.push(vv); if (vv.a >= 0.99) break; }
            }
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
          if (cs.visibility === 'hidden' || el.closest('[hidden], .unsichtbar, .zum-inhalt, [aria-hidden="true"]')) continue;
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
const ia = new Bericht('Interaktion: Menü, Filter, Lightbox, Sprachumschalter, Kontakt ohne Formular');
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

// Kontakt: kein Formular, direkte Kontaktknöpfe im Hero, Social-Links in fester Reihenfolge, Karte öffnet Google Maps
for (const lang of ['ar', 'en']) {
  if (!hat(`/${lang}/contact/`)) continue;
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await s.goto(basis + `/${lang}/contact/`);
  ia.pruefe((await s.locator('form, input, textarea').count()) === 0, `${lang}: Kontaktseite enthält noch ein Formular`);
  for (const href of ['https://wa.me/', 'tel:', 'mailto:']) {
    ia.pruefe((await s.locator(`[data-hero] a.knopf[href^="${href}"]`).count()) === 1, `${lang}: Knopf ${href} fehlt im Hero`);
  }
  const reihenfolge = await s.locator('main .social a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  const erwartet = ['wa.me', 'instagram.com', 'facebook.com/share/1cDyKV6KHj', 'linkedin.com/in/ayloul-design-455786444', 'tel:', 'mailto:'];
  ia.pruefe(erwartet.every((e, i) => reihenfolge[i]?.includes(e)), `${lang}: Social-Reihenfolge falsch: ${reihenfolge.join(', ')}`);
  for (const a of await s.locator('.social a[href^="http"], .karte').all()) {
    ia.pruefe((await a.getAttribute('target')) === '_blank' && (await a.getAttribute('rel'))?.includes('noopener'), `${lang}: externer Link ohne target/rel: ${await a.getAttribute('href')}`);
    const label = await a.getAttribute('aria-label');
    ia.pruefe(Boolean(label) && (lang === 'ar' ? /[؀-ۿ]/.test(label) : /^[\x00-\x7F]+$/.test(label)), `${lang}: aria-label fehlt oder nicht in Seitensprache: ${label}`);
  }
  ia.pruefe((await s.locator('a.karte[href*="google.com/maps"] img').count()) === 1, `${lang}: Kartenbild ist kein Link zu Google Maps`);
  ia.pruefe((await s.locator('iframe').count()) === 0, `${lang}: iframe auf der Kontaktseite`);
  await s.close();
}
// Startseite: Hero-Knopf "تواصل معنا" ohne WhatsApp-Icon, führt zur Kontaktseite derselben Sprache
for (const lang of ['ar', 'en']) {
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await s.goto(basis + `/${lang}/`);
  const knopf = s.locator('[data-hero] .knopf-linie');
  ia.pruefe((await knopf.getAttribute('href')) === `/${lang}/contact/`, `${lang}: Hero-Knopf führt nicht zur Kontaktseite`);
  ia.pruefe((await knopf.locator('svg').count()) === 0 && !(await s.locator('[data-hero] a[href*="wa.me"]').count()), `${lang}: Hero-Knopf hat noch ein WhatsApp-Icon/-Link`);
  await s.close();
}
{
  // Footer: Social-Links auf jeder Seite inkl. LinkedIn und Facebook
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await s.goto(basis + '/en/about/');
  const hrefs = await s.locator('.fuss .social a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  ia.pruefe(hrefs.length === 6 && hrefs.some((h) => h.includes('linkedin.com')) && hrefs.some((h) => h.includes('facebook.com/share')), `Footer-Social-Links unvollständig: ${hrefs.join(', ')}`);
  await s.close();
}
// Projektseiten: Farbabschnitt nur bei Innenprojekten
for (const slug of ['villa-homs', 'villa-uae', 'mosque-square', 'apartment-shop-drawings', 'villa-interior-uae', 'master-bedroom-uae']) {
  if (!hat(`/ar/projects/${slug}/`)) continue;
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await s.goto(basis + `/ar/projects/${slug}/`);
  const muster = await s.locator('[data-muster="muster"]').count();
  const innen = slug.includes('interior') || slug.includes('bedroom');
  ia.pruefe(innen ? muster === 1 : muster === 0, `${slug}: Farbabschnitt ${muster ? 'vorhanden' : 'fehlt'}`);
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
  // Seitenwechsel läuft über Astro View Transitions (ohne neues load-Ereignis)
  await s.waitForURL(/\/ar\/projects\/$/, { timeout: 5000 }).catch(() => {});
  ia.pruefe(await s.evaluate(() => document.documentElement.lang === 'ar' && document.documentElement.dir === 'rtl'), 'Nach dem Sprachwechsel stimmen lang/dir nicht');
  ia.pruefe(new URL(s.url()).pathname === '/ar/projects/', `Klick auf Sprachumschalter landet auf ${s.url()}`);
  await s.close();
}
ergebnisse.push(ia.ende());

await browser.close();
server.close();
process.exitCode = ergebnisse.every(Boolean) ? 0 : 1;
