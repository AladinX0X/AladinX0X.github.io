import { defineConfig } from 'astro/config';
import path from 'node:path';

// AYLOUL_PROJEKTE=<datei>: Test-Build mit anderen Projektdaten (../tests/kennzahlen.mjs).
const fixture = process.env.AYLOUL_PROJEKTE ? path.resolve(process.env.AYLOUL_PROJEKTE) : null;

// Zweite Designrichtung: eigenes kleines Projekt, liest Projektdaten und Texte der ersten Fassung (../src).
// Nur lokal, ohne Domain: kein `site`, keine Sitemap.
export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  vite: {
    server: { fs: { allow: ['..'] } },
    ...(fixture ? { resolve: { alias: [{ find: /^(\.{1,2}\/)+src\/data\/projekte\.json$/, replacement: fixture }] } } : {}),
  },
});
