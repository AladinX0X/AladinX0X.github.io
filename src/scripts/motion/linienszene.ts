// Linie (nur groß): die Raute wandert entlang der gestrichelten Linie, die Füllung folgt, Schritte leuchten auf.
import { gsap, ScrollTrigger } from './gsap';

export function linienszene(rtl: boolean) {
  const weg: (() => void)[] = [];
  document.querySelectorAll<HTMLElement>('[data-muster="linienszene"]').forEach((sektion) => {
    const leiste = sektion.querySelector<HTMLElement>('[data-ablauf-leiste]');
    const raute = sektion.querySelector<HTMLElement>('[data-ablauf-raute]');
    const fuellung = sektion.querySelector<HTMLElement>('[data-ablauf-fuellung]');
    const schritte = [...sektion.querySelectorAll<HTMLElement>('[data-ablauf-schritt]')];
    if (!leiste || !raute || schritte.length < 2) return;
    sektion.classList.add('bewegt');
    ScrollTrigger.refresh();
    const n = schritte.length;
    const strecke = () => (leiste.offsetWidth * (n - 1)) / n * (rtl ? -1 : 1);
    const tl = gsap.timeline({ scrollTrigger: { trigger: sektion, start: 'top top', end: `+=${30 * n}%`, scrub: 0.7, pin: true, invalidateOnRefresh: true } });
    tl.fromTo(raute, { x: 0 }, { x: strecke, ease: 'none', duration: 1 }, 0);
    if (fuellung) tl.fromTo(fuellung, { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 1 }, 0);
    schritte.forEach((s, i) => {
      if (i === 0) return;
      tl.fromTo(s, { opacity: 0.32, y: 16 }, { opacity: 1, y: 0, ease: 'ein', duration: 0.12 }, (i / (n - 1)) - 0.06);
    });
    tl.to({}, { duration: 0.15 });
    weg.push(() => sektion.classList.remove('bewegt'));
  });
  return () => weg.forEach((f) => f());
}
