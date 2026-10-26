// Eckdaten-Reihe (Projekt-Template): die Angaben steigen nacheinander auf (fade + 24 px), einmal beim Eintreten.
import { gsap } from './gsap';

export function eckdaten() {
  document.querySelectorAll<HTMLElement>('[data-eckdaten]').forEach((reihe) => {
    gsap.fromTo(reihe.querySelectorAll('[data-fakt]'), { opacity: 0, y: 24 }, {
      opacity: 1, y: 0, duration: 1.1, ease: 'ein', stagger: 0.1,
      scrollTrigger: { trigger: reihe, start: 'top 88%', once: true },
    });
  });
}
