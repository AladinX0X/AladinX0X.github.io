import { defineConfig } from 'astro/config';

// Zweite Designrichtung: eigenes kleines Projekt, liest Projektdaten und Texte der ersten Fassung (../src).
// Nur lokal, ohne Domain: kein `site`, keine Sitemap.
export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  vite: { server: { fs: { allow: ['..'] } } },
});
