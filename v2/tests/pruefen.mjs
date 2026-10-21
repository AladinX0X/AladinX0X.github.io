// Prüfungen für v2 (nach npm run build): Inhalt, Zahlen aus den Projektdaten, RTL-CSS, Ziffern, Layout, Kontrast.
// Nutzt Server und Hilfen der ersten Fassung.
import { readFile } from 'node:fs/promises';
import { starteServer } from '../../tests/server.mjs';
import { alleDateien, browserStarten, Bericht } from '../../tests/hilfen.mjs';

const html = await readFile('dist/index.html', 'utf8');
const { projekte } = JSON.parse(await readFile('../src/data/projekte.json', 'utf8'));
const ergebnisse = [];

// ---------- Statisch ----------
{
  const b = new Bericht('v2 statisch: Folien, h1, Ziffern, keine fremden Quellen, Zahlen aus den Daten');
  b.pruefe((html.match(/data-folie="/g) ?? []).length === 8, 'nicht genau 8 Folien');
  b.pruefe((html.match(/<h1[\s>]/g) ?? []).length === 1, 'nicht genau eine h1');
  b.pruefe(/<html[^>]*lang="ar"[^>]*dir="rtl"/.test(html), 'lang/dir fehlt');
  b.pruefe(!/[٠-٩۰-۹]/.test(html), 'arabisch-indische Ziffern gefunden');
  b.pruefe(!/<(script|link)[^>]+(src|href)="(https?:)?\/\//i.test(html), 'externes Skript oder Stylesheet');
  b.pruefe(!/rel="canonical"/.test(html), 'canonical gefunden');
  for (const img of html.match(/<img [^>]*>/g) ?? []) {
    b.pruefe(/ width="\d+"/.test(img) && / height="\d+"/.test(img) && / alt(=|[\s>])/.test(img), `Bild ohne width/height/alt: ${img.slice(0, 80)}`);
  }
  // Balken: Werte müssen den Projektdaten entsprechen
  const zaehle = (f) => projekte.filter(f).length;
  const soll = ['exterior', 'interior', 'shop-drawings', 'graphic'].map((id) => zaehle((p) => p.bereich === id));
  const ist = [...html.matchAll(/<text class="wert"[^>]*>(\d+)<\/text>/g)].map((m) => Number(m[1]));
  b.pruefe(JSON.stringify(ist) === JSON.stringify(soll), `Balkenwerte ${ist} statt ${soll}`);
  // Ring: Summe = Anzahl Projekte
  const ring = Number(html.match(/<text class="ring-zahl"[^>]*>(\d+)<\/text>/)?.[1]);
  b.pruefe(ring === projekte.length, `Ringmitte ${ring} statt ${projekte.length}`);
  b.pruefe(html.includes(`>${projekte.length}</span>`), 'Kennzahl Projekte passt nicht zu den Daten');
  ergebnisse.push(b.ende());
}

// ---------- RTL: keine physischen Richtungs-Eigenschaften ----------
{
  const b = new Bericht('v2 RTL: keine left/right-Eigenschaften im CSS');
  const muster = /(?:^|[\s;{"'])(?:(?:margin|padding|border)-(?:left|right)(?:-[a-z]+)?|left|right|float|clear)\s*:|text-align\s*:\s*(?:left|right)/m;
  for (const d of [...(await alleDateien('src', '.css')), ...(await alleDateien('src', '.astro'))]) {
    let t = await readFile(d, 'utf8');
    if (d.endsWith('.astro')) t = [...t.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n') + [...t.matchAll(/style=["'{]([^"'}]*)["'}]/g)].map((m) => m[1]).join('\n');
    t.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').forEach((z, i) => b.pruefe(!muster.test(z), `${d}:${i + 1}: ${z.trim()}`));
  }
  ergebnisse.push(b.ende());
}

// ---------- Browser ----------
const { server, basis } = await starteServer('dist');
const browser = await browserStarten();
const host = new URL(basis).host;
{
  const b = new Bericht('v2 Browser: Überlauf, fremde Hosts, Links, Fortschrittspunkte, Zähler, Kontrast');
  for (const breite of [375, 768, 1024, 1440]) {
    const s = await browser.newPage({ viewport: { width: breite, height: 900 }, reducedMotion: 'reduce' });
    s.on('request', (r) => { const u = new URL(r.url()); if (u.protocol.startsWith('http')) b.pruefe(u.host === host, `fremde Anfrage ${r.url()}`); });
    s.on('response', (r) => b.pruefe(r.status() < 400, `${r.url()} -> ${r.status()}`));
    await s.goto(basis + '/', { waitUntil: 'networkidle' });
    const ueber = await s.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    b.pruefe(ueber <= 0, `@${breite}px: ${ueber}px Überlauf`);
    if (breite === 1440) {
      // Fortschrittspunkte liegen in RTL am linken Rand (Zeilenende)
      const box = await s.locator('.fortschritt').boundingBox();
      b.pruefe(box && box.x < 100, `Fortschrittspunkte nicht am Zeilenende (x=${box?.x})`);
      await s.locator('#folie-bereiche').scrollIntoViewIfNeeded();
      await s.evaluate(() => document.querySelector('#folie-bereiche').scrollIntoView());
      await s.waitForTimeout(400);
      const z = await s.locator('[data-zaehler]').textContent();
      b.pruefe(z === '03', `Zähler zeigt ${z} statt 03`);
      const aktiv = await s.locator('[data-punkt][aria-current="true"]').getAttribute('data-punkt');
      b.pruefe(aktiv === 'bereiche', `aktiver Punkt ${aktiv}`);
      // Diagramme bei reduzierter Bewegung sofort fertig
      const fertig = await s.evaluate(() => [...document.querySelectorAll('[data-diagramm]')].every((d) => d.classList.contains('fertig')));
      b.pruefe(fertig, 'Diagramme bei reduzierter Bewegung nicht sofort fertig');
    }
    // Kontrast (Text gegen Hintergrund)
    const probleme = await s.evaluate(() => {
      const farbe = (x) => { const m = x.match(/rgba?\(([^)]+)\)/); if (!m) return null; const t = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return { r: t[0], g: t[1], b: t[2], a: t.length > 3 ? t[3] : 1 }; };
      const mische = (o, u) => ({ r: o.r * o.a + u.r * (1 - o.a), g: o.g * o.a + u.g * (1 - o.a), b: o.b * o.a + u.b * (1 - o.a), a: 1 });
      const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
      const verh = (a, c) => { const x = lum(a), y = lum(c); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
      const bg = (el) => { for (let e = el; e; e = e.parentElement) { const c = farbe(getComputedStyle(e).backgroundColor); if (c && c.a > 0.99) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };
      const aus = [];
      for (const el of document.querySelectorAll('body *')) {
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
        const r = el.getBoundingClientRect(); if (!r.width || el.closest('.unsichtbar, [hidden]')) continue;
        if (el.closest('details:not([open])') && el.tagName !== 'SUMMARY') continue;
        const cs = getComputedStyle(el);
        const svgText = ['text', 'tspan'].includes(el.tagName.toLowerCase());
        let c = farbe(svgText ? cs.fill : cs.color); if (!c) continue;
        let op = 1; for (let e = el; e; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity);
        c = { ...c, a: c.a * op };
        const h = bg(el);
        const v = verh(mische(c, h), h);
        const gr = parseFloat(cs.fontSize) * (svgText ? (el.ownerSVGElement.getBoundingClientRect().width / el.ownerSVGElement.viewBox.baseVal.width) : 1);
        const soll = gr >= 24 || (gr >= 18.66 && parseInt(cs.fontWeight, 10) >= 700) ? 3 : 4.5;
        if (v < soll) aus.push(`${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 30)}" ${v.toFixed(2)}:1`);
      }
      return aus;
    });
    b.pruefe(probleme.length === 0, `@${breite}px Kontrast: ${probleme.slice(0, 4).join(' | ')}`);
    await s.close();
  }
  // Ohne reduzierte Bewegung: Diagramme starten leer und sind nach dem Scrollen fertig
  const s = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  await s.goto(basis + '/');
  const vorher = await s.evaluate(() => document.querySelector('.balken-diagramm').classList.contains('fertig'));
  await s.evaluate(() => document.querySelector('#folie-bereiche').scrollIntoView({ behavior: 'instant' }));
  await s.waitForTimeout(1500);
  const nachher = await s.evaluate(() => document.querySelector('.balken-diagramm').classList.contains('fertig'));
  b.pruefe(!vorher && nachher, `Aufbau beim Scrollen: vorher=${vorher}, nachher=${nachher}`);
  await s.close();
  ergebnisse.push(b.ende());
}
await browser.close();
server.close();
process.exitCode = ergebnisse.every(Boolean) ? 0 : 1;
