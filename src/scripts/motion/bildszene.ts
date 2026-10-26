// Bild-Expansion (nur groß): gerahmte Karte wird beim Scrollen zum Vollbild, Text wechselt.
import { gsap, ScrollTrigger } from './gsap';

export function bildszene(rtl: boolean) {
  const weg: (() => void)[] = [];
  document.querySelectorAll<HTMLElement>('[data-muster="bildszene"]').forEach((sektion) => {
    const bild = sektion.querySelector<HTMLElement>('[data-sp-bild]');
    const img = bild?.querySelector('img');
    const text1 = sektion.querySelector<HTMLElement>('[data-sp-text1]');
    const text2 = sektion.querySelector<HTMLElement>('[data-sp-text2]');
    const schleier = sektion.querySelector<HTMLElement>('[data-sp-schleier]');
    if (!bild || !text1 || !text2) return;
    sektion.classList.add('bewegt');
    ScrollTrigger.refresh();
    // Karte am Zeilenende, Text am Zeilenanfang (inset ist physisch: oben rechts unten links)
    const start = rtl ? 'inset(16% 50% 16% 6% round 14px)' : 'inset(16% 6% 16% 50% round 14px)';
    const tl = gsap.timeline({ scrollTrigger: { trigger: sektion, start: 'top top', end: '+=160%', scrub: 0.8, pin: true } });
    tl.fromTo(bild, { clipPath: start }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', duration: 1 }, 0);
    if (img) tl.fromTo(img, { scale: 1.06 }, { scale: 1, ease: 'none', duration: 1 }, 0);
    tl.to(text1, { opacity: 0, y: -32, ease: 'none', duration: 0.3 }, 0.1);
    if (schleier) tl.fromTo(schleier, { opacity: 0 }, { opacity: 1, ease: 'none', duration: 0.3 }, 0.6);
    tl.fromTo(text2, { opacity: 0, y: 32 }, { opacity: 1, y: 0, ease: 'none', duration: 0.3 }, 0.65);
    tl.to({}, { duration: 0.25 });
    weg.push(() => sektion.classList.remove('bewegt'));
  });
  return () => weg.forEach((f) => f());
}
