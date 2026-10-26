// Musterkarten (Farben der Innenprojekte, Identität): die Karten liegen zuerst als Stapel und fächern beim Scrollen
// an ihre Plätze auf (leichte Drehung, Versatz). Mobil: kurze, gestaffelte Einblendung.
import { gsap } from './gsap';
import { istRtl } from '../module/typen';

export function muster(gross: boolean) {
  const r = istRtl() ? -1 : 1;
  document.querySelectorAll<HTMLElement>('[data-muster="muster"]').forEach((m) => {
    const karten = [...m.querySelectorAll<HTMLElement>('[data-musterkarte]')];
    if (!karten.length) return;
    if (gross) {
      const mitte = (karten.length - 1) / 2;
      gsap.fromTo(karten, {
        x: (i: number) => r * (mitte - i) * 60, y: 40, rotate: (i: number) => r * (i - mitte) * 6, opacity: 0.4,
      }, {
        x: 0, y: 0, rotate: 0, opacity: 1, ease: 'none', stagger: 0.04,
        scrollTrigger: { trigger: m, start: 'top 85%', end: 'center 55%', scrub: 0.6 },
      });
    } else {
      gsap.fromTo(karten, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: 'ein', stagger: 0.08, scrollTrigger: { trigger: m, start: 'top 85%', once: true } });
    }
  });
  return () => {};
}
