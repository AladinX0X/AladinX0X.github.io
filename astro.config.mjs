import { defineConfig } from 'astro/config';

// Nur lokal, ohne Domain: kein `site`, keine Sitemap. Siehe README "Später online gehen".
export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
