// Hero (alle Seiten): Einstieg läuft per CSS (global.css). Hier nur die Scroll-Bewegung:
// leichte Parallaxe, das Bild dunkelt ab, der Text blendet aus.
import { gsap } from './gsap';

export function hero() {
  document.querySelectorAll<HTMLElement>('[data-hero]').forEach((sektion) => {
    const rahmen = sektion.querySelector<HTMLElement>('[data-hero-bild]');
    const schleier = sektion.querySelector<HTMLElement>('[data-hero-schleier]');
    const text = sektion.querySelector<HTMLElement>('[data-hero-text]');
    const hinweis = sektion.querySelector<HTMLElement>('[data-hero-hinweis]');
    const st = { trigger: sektion, start: 'top top', end: 'bottom top', scrub: true };
    if (rahmen) gsap.to(rahmen, { yPercent: 14, ease: 'none', scrollTrigger: st });
    if (schleier) gsap.fromTo(schleier, { opacity: 0 }, { opacity: 0.75, ease: 'none', scrollTrigger: st });
    if (text) gsap.to(text, { opacity: 0, y: -48, ease: 'none', scrollTrigger: { ...st, end: '55% top' } });
    if (hinweis) gsap.to(hinweis, { opacity: 0, ease: 'none', scrollTrigger: { ...st, end: '15% top' } });
  });
}
