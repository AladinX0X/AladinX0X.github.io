// Führt alle Tests nacheinander aus. Vorher: npm run build.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (!existsSync('dist/index.html')) {
  console.error('dist/ fehlt. Zuerst npm run build ausführen.');
  process.exit(1);
}
const tests = ['tests/statisch.mjs', 'tests/links.mjs', 'tests/browser.mjs', 'tests/bewegung.mjs', 'tests/hero-kontrast.mjs', 'tests/aufloesung.mjs', 'tests/kennzahlen.mjs'];
let alleOk = true;
for (const t of tests) {
  const r = spawnSync(process.execPath, [t], { stdio: 'inherit' });
  if (r.status !== 0) alleOk = false;
}
console.log(alleOk ? '\nAlle Tests bestanden.' : '\nMindestens ein Test ist fehlgeschlagen.');
process.exit(alleOk ? 0 : 1);
