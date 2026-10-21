// Gemeinsame Hilfen für die Tests.
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

export async function alleDateien(ordner, endung) {
  const aus = [];
  for (const e of await readdir(ordner, { withFileTypes: true })) {
    const p = path.join(ordner, e.name);
    if (e.isDirectory()) aus.push(...(await alleDateien(p, endung)));
    else if (!endung || p.endsWith(endung)) aus.push(p);
  }
  return aus;
}

/** Alle gebauten Seiten als URL-Pfade (ohne die Weiterleitung "/"). */
export async function seitenPfade() {
  const html = await alleDateien('dist', '.html');
  return html
    .map((d) => '/' + path.relative('dist', d).replace(/\\/g, '/').replace(/index\.html$/, ''))
    .filter((p) => p !== '/' && p !== '/404.html')
    .sort();
}

// Lokal: Playwright-Chromium (npx playwright install chromium). In der Cloud-Umgebung liegt ein vorinstalliertes Chromium bereit.
export function browserStarten() {
  const vorinstalliert = '/opt/pw-browsers/chromium';
  const opts = existsSync(vorinstalliert) && !process.env.PW_EIGENES_CHROMIUM ? { executablePath: vorinstalliert } : {};
  return chromium.launch(opts);
}

export class Bericht {
  constructor(name) { this.name = name; this.fehler = []; this.anzahl = 0; }
  pruefe(bedingung, meldung) { this.anzahl++; if (!bedingung) this.fehler.push(meldung); }
  ende() {
    const ok = this.fehler.length === 0;
    console.log(`${ok ? 'OK  ' : 'FEHLER'} ${this.name}: ${this.anzahl - this.fehler.length}/${this.anzahl} Prüfungen bestanden`);
    for (const f of this.fehler.slice(0, 30)) console.log('   - ' + f);
    if (this.fehler.length > 30) console.log(`   ... und ${this.fehler.length - 30} weitere`);
    return ok;
  }
}
