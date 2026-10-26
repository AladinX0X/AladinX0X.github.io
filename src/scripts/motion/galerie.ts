// Filmische Galerie (nur groß): gepinnte waagerechte Reihe, die beim Scrollen in Leserichtung durchläuft.
// LTR: die Reihe wandert nach links; RTL: nach rechts (die Reihe beginnt am rechten Rand). Mobil: senkrecht (statisch).
import { gsap, ScrollTrigger } from './gsap';

export function galerie(rtl: boolean) {
  const weg: (() => void)[] = [];
  document.querySelectorAll<HTMLElement>('[data-muster="galerie"]').forEach((g) => {
    const reihe = g.querySelector<HTMLElement>('[data-g-reihe]');
    if (!reihe || reihe.children.length < 3) return;
    g.classList.add('bewegt');
    ScrollTrigger.refresh();
    const strecke = () => Math.max(0, reihe.scrollWidth - g.clientWidth);
    if (strecke() < 40) { g.classList.remove('bewegt'); return; }
    gsap.fromTo(reihe, { x: 0 }, {
      x: () => (rtl ? 1 : -1) * strecke(), ease: 'none',
      scrollTrigger: { trigger: g, start: 'top top', end: () => `+=${strecke()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
    });
    weg.push(() => g.classList.remove('bewegt'));
  });
  return () => weg.forEach((f) => f());
}
