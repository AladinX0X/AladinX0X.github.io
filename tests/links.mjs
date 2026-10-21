// Links: kein interner Link, kein Bild, keine Schrift, kein Download ins Leere (über einen echten HTTP-Server).
import { starteServer } from './server.mjs';
import { seitenPfade, Bericht } from './hilfen.mjs';

const b = new Bericht('Links, Bilder, Schriften, Downloads');
const { server, basis } = await starteServer();
const pfade = await seitenPfade();
const geprueft = new Map();

async function hole(url) {
  if (geprueft.has(url)) return geprueft.get(url);
  const r = await fetch(basis + url, { redirect: 'manual' });
  const ergebnis = { status: r.status, typ: r.headers.get('content-type') ?? '', text: /text|css|javascript/.test(r.headers.get('content-type') ?? '') ? await r.text() : null };
  geprueft.set(url, ergebnis);
  return ergebnis;
}

const intern = (u) => u.startsWith('/') && !u.startsWith('//');
const ohneAnker = (u) => u.split('#')[0].split('?')[0];

for (const p of ['/', ...pfade, '/404.html']) {
  const seite = await hole(p);
  b.pruefe(seite.status === 200, `${p}: Status ${seite.status}`);
  if (!seite.text) continue;
  const ziele = new Set();
  for (const m of seite.text.matchAll(/\s(?:href|src)="([^"]+)"/g)) ziele.add(m[1]);
  for (const m of seite.text.matchAll(/\ssrcset="([^"]+)"/g)) m[1].split(',').forEach((t) => ziele.add(t.trim().split(/\s+/)[0]));
  for (const m of seite.text.matchAll(/content="0;url=([^"]+)"/g)) ziele.add(m[1]);
  for (const z of ziele) {
    if (!intern(z)) continue;
    const u = ohneAnker(z);
    if (!u) continue;
    const r = await hole(u);
    b.pruefe(r.status === 200, `${p} -> ${u}: Status ${r.status}`);
    if (r.typ.includes('css') && r.text) {
      for (const m of r.text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
        if (m[1].startsWith('data:')) continue;
        const ziel = new URL(m[1], basis + u).pathname;
        const rr = await hole(ziel);
        b.pruefe(rr.status === 200, `${u} -> ${ziel}: Status ${rr.status}`);
      }
    }
  }
}
// Unbekannte Seite liefert 404-Seite
const nichts = await fetch(basis + '/ar/gibt-es-nicht/');
b.pruefe(nichts.status === 404, 'Unbekannte URL liefert nicht 404');

server.close();
const schriften = [...geprueft.keys()].filter((k) => k.endsWith('.woff2')).length;
console.log(`   (${geprueft.size} Adressen geprüft, davon ${schriften} Schriftdateien)`);
process.exitCode = b.ende() ? 0 : 1;
