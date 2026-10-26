// Leichte Parallaxe für Bilder mit [data-parallax] (Bildrahmen mit overflow hidden).
import { gsap } from './gsap';

export function parallaxe() {
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((rahmen) => {
    const img = rahmen.querySelector('img');
    if (!img) return;
    gsap.fromTo(img, { yPercent: -5, scale: 1.12 }, {
      yPercent: 5, scale: 1.12, ease: 'none',
      scrollTrigger: { trigger: rahmen, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}
