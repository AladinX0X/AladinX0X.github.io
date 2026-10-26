import { defineConfig } from 'astro/config';
import path from 'node:path';

// Nur lokal, ohne Domain: kein `site`, keine Sitemap. Siehe README "Going online with your own domain".
// AYLOUL_PROJEKTE=<datei>: Test-Build mit anderen Projektdaten (tests/kennzahlen.mjs prüft so, dass alle Zahlen
// aus den Daten berechnet werden). Im normalen Build nicht gesetzt.
const fixture = process.env.AYLOUL_PROJEKTE ? path.resolve(process.env.AYLOUL_PROJEKTE) : null;

export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  vite: fixture ? { resolve: { alias: [{ find: /^(\.{1,2}\/)+(data\/)?projekte\.json$/, replacement: fixture }] } } : {},
});
