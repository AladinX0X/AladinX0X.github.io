// Projektfilter nach Bereich: Knöpfe mit aria-pressed, Ergebnis per aria-live angesagt.
// Neuanordnung animiert (FLIP): bleibende Karten gleiten an ihre neue Stelle, neue blenden ein.
import { hoere, ruhig, type Aufraeumen } from './typen';

export function filter(): Aufraeumen | null {
  const leiste = document.querySelector<HTMLElement>('[data-filterleiste]');
  const anzahl = document.querySelector<HTMLElement>('[data-filter-anzahl]');
  if (!leiste || !anzahl) return null;
  const karten = [...document.querySelectorAll<HTMLElement>('[data-projekt]')];
  const knoepfe = [...leiste.querySelectorAll<HTMLButtonElement>('[data-filter]')];

  const waehle = (id: string) => {
    const vorher = new Map(karten.filter((k) => !k.hidden).map((k) => [k, k.getBoundingClientRect()]));
    let n = 0;
    for (const k of karten) {
      const zeigen = id === 'alle' || k.dataset.bereich === id;
      k.hidden = !zeigen;
      if (zeigen) { n++; k.classList.add('sichtbar'); }
    }
    for (const b of knoepfe) b.setAttribute('aria-pressed', String(b.dataset.filter === id));
    anzahl.textContent = (anzahl.dataset.vorlage ?? '{n}').replace('{n}', String(n));
    if (ruhig()) return;
    for (const k of karten) {
      if (k.hidden) continue;
      const alt = vorher.get(k);
      const neu = k.getBoundingClientRect();
      if (alt) {
        const dx = alt.left - neu.left, dy = alt.top - neu.top;
        if (dx || dy) k.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      } else {
        k.animate([{ opacity: 0, transform: 'scale(0.96)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      }
    }
  };
  const weg = knoepfe.map((b) => hoere(b, 'click', () => waehle(b.dataset.filter ?? 'alle')));
  return () => weg.forEach((f) => f());
}
