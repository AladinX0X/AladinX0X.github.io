// Statische Prüfungen ohne Browser: i18n-Schlüssel, RTL-CSS, Ziffern, Dateinamen, Kopfdaten, hreflang.
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { alleDateien, Bericht } from './hilfen.mjs';

const ok = [];

// ---------- i18n ----------
{
  const b = new Bericht('i18n: gleiche Schlüssel, keine leeren Werte');
  const ar = JSON.parse(await readFile('src/i18n/ar.json', 'utf8'));
  const enDa = existsSync('src/i18n/en.json');
  const en = enDa ? JSON.parse(await readFile('src/i18n/en.json', 'utf8')) : null;
  const schluessel = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
    v !== null && typeof v === 'object' ? [p + k, ...schluessel(v, p + k + '.')] : [p + k]);
  const leere = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
    v !== null && typeof v === 'object' ? leere(v, p + k + '.') : (typeof v === 'string' && v.trim() === '' ? [p + k] : []));
  for (const k of leere(ar)) b.pruefe(false, `ar.json: leerer Wert bei ${k}`);
  b.pruefe(true, 'ar.json gelesen');
  if (en) {
    const a = new Set(schluessel(ar)), e = new Set(schluessel(en));
    for (const k of a) b.pruefe(e.has(k), `en.json fehlt Schlüssel ${k}`);
    for (const k of e) b.pruefe(a.has(k), `ar.json fehlt Schlüssel ${k}`);
    for (const k of leere(en)) b.pruefe(false, `en.json: leerer Wert bei ${k}`);
  }
  // Projekttexte: ar und en mit denselben Schlüsseln, null nur in beiden
  const projekte = JSON.parse(await readFile('src/data/projekte.json', 'utf8')).projekte;
  for (const p of projekte) {
    const ka = schluessel(p.ar), ke = schluessel(p.en);
    b.pruefe(JSON.stringify(ka) === JSON.stringify(ke), `projekte.json ${p.slug}: ar/en-Schlüssel unterschiedlich`);
    for (const k of Object.keys(p.ar)) b.pruefe((p.ar[k] === null) === (p.en[k] === null), `projekte.json ${p.slug}.${k}: null nur in einer Sprache`);
    for (const k of [...leere(p.ar), ...leere(p.en)]) b.pruefe(false, `projekte.json ${p.slug}: leerer Wert ${k}`);
    for (const id of p.galerie) {
      b.pruefe(Boolean(p.ar.alt[id]) && Boolean(p.en.alt[id]), `projekte.json ${p.slug}: alt-Text fehlt für ${id}`);
    }
  }
  ok.push(b.ende());
}

// ---------- RTL: keine physischen Richtungs-Eigenschaften ----------
{
  const b = new Bericht('RTL: keine left/right-Eigenschaften im CSS');
  const muster = /(?:^|[\s;{"'])(?:(?:margin|padding|border)-(?:left|right)(?:-[a-z]+)?|left|right|float|clear)\s*:|text-align\s*:\s*(?:left|right)|float\s*:\s*(?:left|right)/m;
  const dateien = [...(await alleDateien('src', '.css')), ...(await alleDateien('src', '.astro'))];
  for (const d of dateien) {
    let text = await readFile(d, 'utf8');
    if (d.endsWith('.astro')) {
      const teile = [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
      const inline = [...text.matchAll(/style=["'{]([^"'}]*)["'}]/g)].map((m) => m[1]);
      text = [...teile, ...inline].join('\n');
    }
    text = text.replace(/\/\*[\s\S]*?\*\//g, '');
    text.split('\n').forEach((zeile, i) => b.pruefe(!muster.test(zeile), `${d}:${i + 1}: ${zeile.trim()}`));
  }
  ok.push(b.ende());
}

// ---------- Build-Prüfungen ----------
const html = await alleDateien('dist', '.html');
const seiten = [];
for (const d of html) seiten.push({ datei: d, text: await readFile(d, 'utf8'), pfad: '/' + path.relative('dist', d).replace(/index\.html$/, '') });
const echteSeiten = seiten.filter((s) => s.pfad !== '/');

{
  const b = new Bericht('Ziffern: keine arabisch-indischen Ziffern im Build');
  for (const s of seiten) {
    const treffer = s.text.match(/[٠-٩۰-۹]/g);
    b.pruefe(!treffer, `${s.pfad}: ${treffer?.length} arabisch-indische Ziffern`);
  }
  const quell = await alleDateien('src');
  for (const d of quell) {
    const t = await readFile(d, 'utf8').catch(() => '');
    b.pruefe(!/toLocaleString\(\s*['"]ar/.test(t), `${d}: toLocaleString('ar…) gefunden`);
  }
  ok.push(b.ende());
}

{
  const b = new Bericht('Kopf: title, description, eine h1, Sprache, keine Domain-Angaben');
  const titel = new Map();
  for (const s of echteSeiten) {
    const t = s.text.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
    const desc = s.text.match(/<meta name="description" content="([^"]*)"/)?.[1]?.trim();
    b.pruefe(Boolean(t), `${s.pfad}: <title> fehlt`);
    b.pruefe(Boolean(desc) && desc.length > 30, `${s.pfad}: Meta-Beschreibung fehlt oder zu kurz`);
    if (t) { b.pruefe(!titel.has(t), `${s.pfad}: Titel doppelt mit ${titel.get(t)}`); titel.set(t, s.pfad); }
    const h1 = (s.text.match(/<h1[\s>]/g) ?? []).length;
    b.pruefe(h1 === 1, `${s.pfad}: ${h1} h1-Überschriften`);
    const lang = s.text.match(/<html[^>]*lang="(\w+)"/)?.[1];
    const dir = s.text.match(/<html[^>]*dir="(\w+)"/)?.[1];
    if (s.pfad.startsWith('/ar/')) b.pruefe(lang === 'ar' && dir === 'rtl', `${s.pfad}: lang/dir falsch (${lang}/${dir})`);
    if (s.pfad.startsWith('/en/')) b.pruefe(lang === 'en' && dir === 'ltr', `${s.pfad}: lang/dir falsch (${lang}/${dir})`);
    b.pruefe(!/rel="canonical"/.test(s.text), `${s.pfad}: canonical gefunden`);
    b.pruefe(!/property="og:image" content="https?:/.test(s.text), `${s.pfad}: Open-Graph-Bild mit absoluter URL`);
    b.pruefe(!/<iframe/i.test(s.text), `${s.pfad}: iframe gefunden`);
    b.pruefe(!/<(script|link)[^>]+(src|href)="(https?:)?\/\//i.test(s.text), `${s.pfad}: externes Skript oder Stylesheet`);
    for (const img of s.text.match(/<img [^>]*>/g) ?? []) {
      b.pruefe(/ width="\d+"/.test(img) && / height="\d+"/.test(img), `${s.pfad}: Bild ohne width/height: ${img.slice(0, 90)}`);
      b.pruefe(/ alt(="|[\s>])/.test(img), `${s.pfad}: Bild ohne alt: ${img.slice(0, 90)}`);
    }
    // Interne Links relativ zur Wurzel, ohne Domain
    for (const m of s.text.matchAll(/href="([^"]+)"/g)) {
      const h = m[1];
      if (/^(https?:|mailto:|tel:|#)/.test(h)) continue;
      b.pruefe(h.startsWith('/'), `${s.pfad}: interner Link nicht ab Wurzel: ${h}`);
    }
  }
  b.pruefe(!existsSync('dist/robots.txt'), 'robots.txt vorhanden');
  b.pruefe(!(await readdir('dist')).some((f) => f.startsWith('sitemap')), 'Sitemap vorhanden');
  const cfg = await readFile('astro.config.mjs', 'utf8');
  b.pruefe(!/^\s*site\s*:/m.test(cfg), 'astro.config.mjs enthält site');
  ok.push(b.ende());
}

{
  const b = new Bericht('hreflang: alle Sprachen + x-default, relative Pfade, Ziele existieren');
  const site = JSON.parse(await readFile('src/data/site.json', 'utf8'));
  const vorhanden = new Set(echteSeiten.map((s) => s.pfad));
  for (const s of echteSeiten.filter((x) => x.pfad !== '/404.html')) {
    const alts = [...s.text.matchAll(/<link rel="alternate" hreflang="([\w-]+)" href="([^"]+)"/g)].map((m) => ({ l: m[1], h: m[2] }));
    if (site.sprachen.length < 2) { b.pruefe(alts.length === 0, `${s.pfad}: hreflang ohne zweite Sprache`); continue; }
    for (const l of [...site.sprachen, 'x-default']) {
      const a = alts.find((x) => x.l === l);
      b.pruefe(Boolean(a), `${s.pfad}: hreflang ${l} fehlt`);
      if (a) {
        b.pruefe(a.h.startsWith('/'), `${s.pfad}: hreflang ${l} nicht relativ: ${a.h}`);
        b.pruefe(vorhanden.has(a.h), `${s.pfad}: hreflang ${l} zeigt ins Leere: ${a.h}`);
      }
    }
    b.pruefe(alts.find((x) => x.l === 'x-default')?.h.startsWith('/ar/'), `${s.pfad}: x-default zeigt nicht auf /ar/`);
  }
  ok.push(b.ende());
}

{
  const b = new Bericht('Dateinamen: Kleinbuchstaben, Ziffern, Bindestriche; Importe exakt geschrieben');
  for (const ordner of ['public/bilder', 'src/assets/logo', 'public/downloads']) {
    for (const f of await readdir(ordner)) b.pruefe(/^[a-z0-9-]+\.[a-z0-9]+$/.test(f) || ordner === 'public/downloads', `${ordner}/${f}: ungültiger Dateiname`);
  }
  // Relative Importe in src müssen exakt (Groß-/Kleinschreibung) existieren
  const quellen = [...(await alleDateien('src', '.astro')), ...(await alleDateien('src', '.ts'))];
  for (const d of quellen) {
    const t = await readFile(d, 'utf8');
    for (const m of t.matchAll(/(?:import\s[^'"]*|import\()\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
      const ziel = path.resolve(path.dirname(d), m[1]);
      const name = path.basename(ziel);
      const liste = await readdir(path.dirname(ziel)).catch(() => []);
      const passt = ['', '.ts', '.js', '.mjs', '.json', '.astro'].some((e) => liste.includes(name + e));
      b.pruefe(passt, `${d}: Import "${m[1]}" nicht exakt vorhanden`);
    }
  }
  ok.push(b.ende());
}

process.exitCode = ok.every(Boolean) ? 0 : 1;
