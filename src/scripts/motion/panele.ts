// Große Bildflächen (Studio): das Bild öffnet sich beim Scrollen von einem schmaleren Ausschnitt (clip-path) und
// setzt sich 1.08 → 1. Groß gescrubbt, mobil als einmalige kurze Einblendung.
import { gsap } from './gsap';

export function panele(gross: boolean) {
  document.querySelectorAll<HTMLElement>('[data-muster="panele"] [data-panel-bild]').forEach((rahmen) => {
    const img = rahmen.querySelector('img');
    if (gross) {
      const tl = gsap.timeline({ scrollTrigger: { trigger: rahmen, start: 'top 85%', end: 'center 50%', scrub: 0.6 } });
      tl.fromTo(rahmen, { clipPath: 'inset(12% 10% 12% 10% round 14px)' }, { clipPath: 'inset(0% 0% 0% 0% round 14px)', ease: 'none' }, 0);
      if (img) tl.fromTo(img, { scale: 1.08 }, { scale: 1, ease: 'none' }, 0);
    } else {
      gsap.fromTo(rahmen, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, ease: 'ein', scrollTrigger: { trigger: rahmen, start: 'top 90%', once: true } });
    }
  });
  return () => {};
}
