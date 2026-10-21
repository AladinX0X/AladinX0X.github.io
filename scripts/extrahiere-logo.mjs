// Phase 0: Logo aus dem Titelbild (PDF-Seite 1) freistellen.
// Das Logo liegt im PDF nur als Pixelbild vor (kein Vektor). Jeder Pixel wird als Mischung
// aus Hintergrund (Waldgruen) und einer Markenfarbe (Elfenbein oder Terrakotta) gelesen;
// daraus entstehen Deckkraft und eine saubere Markenfarbe. Nichts wird nachgezeichnet.
// Aufruf: node scripts/extrahiere-logo.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const QUELLE = 'quelle/extrahiert/roh/img-000.jpg';
const ZIEL = 'quelle/extrahiert/logo';

const HG = [2, 24, 17];          // gemessener Hintergrund um das Logo
const ELFENBEIN = [255, 239, 220]; // #ffefdc
const TERRAKOTTA = [193, 84, 40];  // #c15428
const WALDGRUEN = [5, 47, 36];     // #052f24

const teile = {
  zeichen: { left: 379, top: 262, width: 186, height: 162 },
  'zeichen-schriftzug': { left: 377, top: 258, width: 418, height: 192 },
  komplett: { left: 375, top: 256, width: 422, height: 318 },
};

const fgs = [ELFENBEIN, TERRAKOTTA];
const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);

async function freistellen(name, box, variante) {
  const { data, info } = await sharp(QUELLE).extract(box).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const d = sub([data[i], data[i + 1], data[i + 2]], HG);
    let best = null;
    for (const fg of fgs) {
      const v = sub(fg, HG);
      const a = Math.max(0, Math.min(1, dot(d, v) / dot(v, v)));
      const r = sub(d, v.map((x) => x * a));
      const err = dot(r, r);
      if (!best || err < best.err) best = { fg, a, err };
    }
    let a = best.a < 0.12 ? 0 : Math.min(1, (best.a - 0.12) / 0.8);
    let farbe = best.fg;
    if (variante === 'dunkel' && farbe === ELFENBEIN) farbe = WALDGRUEN;
    out[j] = farbe[0]; out[j + 1] = farbe[1]; out[j + 2] = farbe[2];
    out[j + 3] = Math.round(a * 255);
  }
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 1 })
    .png()
    .toFile(`${ZIEL}/logo-${name}-${variante}.png`);
}

await mkdir(ZIEL, { recursive: true });
for (const [name, box] of Object.entries(teile)) {
  for (const variante of ['hell', 'dunkel']) await freistellen(name, box, variante);
}
console.log('Logo-Varianten geschrieben nach', ZIEL);
