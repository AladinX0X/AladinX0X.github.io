// Plansatz (Werkplanung): die Blätter stapeln sich per CSS sticky; hier gleiten neue Blätter herein und die
// darunterliegenden treten beim Darüberschieben leicht zurück (scale, blasser) wie Papier im Stapel.
import { gsap } from './gsap';

export function plansatz(gross: boolean) {
  document.querySelectorAll<HTMLElement>('[data-muster="plansatz"]').forEach((satz) => {
    const blaetter = [...satz.querySelectorAll<HTMLElement>('[data-blatt]')];
    blaetter.forEach((blatt, i) => {
      const knopf = blatt.querySelector<HTMLElement>('.blatt-knopf');
      if (!knopf) return;
      gsap.fromTo(knopf, { y: gross ? 80 : 30, rotate: i % 2 ? 0.6 : -0.6 }, { y: 0, rotate: 0, ease: 'none', scrollTrigger: { trigger: blatt, start: 'top bottom', end: 'top 60%', scrub: 0.5 } });
      const naechstes = blaetter[i + 1];
      if (naechstes && gross) {
        gsap.to(knopf, { scale: 0.94, opacity: 0.55, ease: 'none', scrollTrigger: { trigger: naechstes, start: 'top 90%', end: 'top 30%', scrub: 0.5 } });
      }
    });
  });
  return () => {};
}
