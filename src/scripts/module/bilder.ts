// Weiches Einblenden der Bilder über ihrem Platzhalter: Klasse "geladen", sobald das Bild da ist.
import type { Aufraeumen } from './typen';

export function bilder(): Aufraeumen | null {
  const imgs = [...document.querySelectorAll<HTMLImageElement>('.bild-weich img')];
  const offen: Array<[HTMLImageElement, () => void]> = [];
  for (const img of imgs) {
    if (img.complete && img.naturalWidth > 0) { img.classList.add('geladen'); continue; }
    const fertig = () => img.classList.add('geladen');
    img.addEventListener('load', fertig, { once: true });
    img.addEventListener('error', fertig, { once: true });
    offen.push([img, fertig]);
  }
  return () => offen.forEach(([img, f]) => { img.removeEventListener('load', f); img.removeEventListener('error', f); });
}
