// Wort-Einblendung: Wörter (.wort) werden beim Scrollen von blass zu voll.
// [data-muster="wortszene"]: groß gepinnt (wenn data-pin), sonst gescrubbt.
// [data-woerter-einblenden]: Fließtext (z. B. Projektbeschreibung), immer nur gescrubbt, nie gepinnt.
import { gsap } from './gsap';

export function wortszene(gross: boolean) {
  document.querySelectorAll<HTMLElement>('[data-muster="wortszene"]').forEach((sektion) => {
    const satz = sektion.querySelector('[data-satz]');
    if (!satz) return;
    const pin = gross && sektion.hasAttribute('data-pin');
    gsap.fromTo(satz.querySelectorAll('.wort'), { opacity: 0.16 }, {
      opacity: 1, ease: 'none', stagger: 0.12,
      scrollTrigger: pin
        ? { trigger: sektion, start: 'top top', end: '+=110%', scrub: 0.6, pin: true }
        : { trigger: sektion, start: 'top 75%', end: 'center 45%', scrub: 0.6 },
    });
  });
  document.querySelectorAll<HTMLElement>('[data-woerter-einblenden]').forEach((el) => {
    gsap.fromTo(el.querySelectorAll('.wort'), { opacity: 0.2 }, {
      opacity: 1, ease: 'none', stagger: 0.05,
      scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 60%', scrub: 0.5 },
    });
  });
}
