// Auflösung: Kein Bild wird größer gezeigt, als seine echte Auflösung erlaubt.
// Regel: größte verfügbare Breite (width-Attribut = größte Variante aus dem Manifest) >= angezeigte Breite × 1.5.
// Bei object-fit: cover zählt die tatsächlich gezeichnete Bildbreite (Rahmen wird ggf. überdeckt).
// Geprüft bei 1440 und 375 px auf jeder Seite, mit reduzierter Bewegung (statische Fassungen) und bei 1440 px
// zusätzlich mit Bewegung (gepinnte Fassungen: Galerie-Reihe, Bildstapel), 2 s nach dem Laden, wenn
// der Hero-Einstieg fertig ist.
import { starteServer } from './server.mjs';
import { seitenPfade, browserStarten, Bericht } from './hilfen.mjs';

const { server, basis } = await starteServer();
const browser = await browserStarten();
const pfade = [...(await seitenPfade()), '/404.html'];
const b = new Bericht('Auflösung: echte Bildbreite >= angezeigte Breite × 1.5 (1440 und 375 px, jede Seite)');

for (const [breite, bewegung] of [[1440, 'reduce'], [375, 'reduce'], [1440, 'no-preference']]) {
  const seite = await browser.newPage({ viewport: { width: breite, height: breite === 375 ? 812 : 900 }, reducedMotion: bewegung });
  for (const p of pfade) {
    await seite.goto(basis + p, { waitUntil: bewegung === 'reduce' ? 'domcontentloaded' : 'networkidle' });
    if (bewegung !== 'reduce') await seite.waitForTimeout(2000);
    const fehler = await seite.evaluate(() => {
      const aus = [];
      for (const img of document.querySelectorAll('main img')) {
        if (img.closest('dialog')) continue;
        const r = img.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        const cs = getComputedStyle(img);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const echt = Number(img.getAttribute('width'));
        const echtH = Number(img.getAttribute('height'));
        if (!echt || !echtH) continue;
        // gezeichnete Breite: bei cover die größere der beiden Skalierungen
        let gezeichnet = r.width;
        if (cs.objectFit === 'cover') gezeichnet = Math.max(r.width, r.height * (echt / echtH));
        if (echt < gezeichnet * 1.5 - 1) aus.push(`${img.currentSrc.split('/').pop() || img.src.split('/').pop()}: echt ${echt}px, angezeigt ${Math.round(gezeichnet)}px`);
      }
      return aus;
    });
    for (const f of fehler) b.pruefe(false, `${p} @${breite} ${bewegung}: ${f}`);
    b.pruefe(true, 'ok');
  }
  await seite.close();
}
const ok = b.ende();
await browser.close();
server.close();
process.exitCode = ok ? 0 : 1;
