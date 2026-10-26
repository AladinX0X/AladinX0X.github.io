// Fallstudie (Identität), Kapitel "Logo-Konstruktion": das Raster zeichnet sich (clip-path wischt in Leserichtung auf),
// danach baut sich das Zeichen Feld für Feld auf (Y, A, U, O, L, dann die Ikone). Groß gepinnt und gescrubbt,
// mobil gescrubbt ohne Pin. Ohne JS / reduzierte Bewegung: ganze Tafel statisch sichtbar.
import { gsap, ScrollTrigger } from './gsap';
import { istRtl } from '../module/typen';

export function fallstudie(gross: boolean) {
  const weg: (() => void)[] = [];
  const rtl = istRtl();
  document.querySelectorAll<HTMLElement>('[data-muster="raster"]').forEach((sektion) => {
    const gitter = sektion.querySelector<HTMLElement>('[data-raster-gitter]');
    const zellen = [...sektion.querySelectorAll<HTMLElement>('[data-raster-zelle]')];
    if (!gitter || !zellen.length) return;
    sektion.classList.add('bewegt');
    ScrollTrigger.refresh();
    const tl = gsap.timeline({
      scrollTrigger: gross
        ? { trigger: sektion, start: 'top top', end: '+=160%', scrub: 0.6, pin: true }
        : { trigger: sektion, start: 'top 70%', end: 'bottom 70%', scrub: 0.6 },
    });
    tl.fromTo(gitter, { clipPath: rtl ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', duration: 0.3 });
    zellen.forEach((z, i) => tl.fromTo(z, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, ease: 'ein', duration: 0.1 }, 0.3 + i * 0.1));
    tl.to({}, { duration: 0.1 });
    weg.push(() => sektion.classList.remove('bewegt'));
  });
  return () => weg.forEach((f) => f());
}
