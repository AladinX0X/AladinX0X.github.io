// Kennzahlen zählen einmal hoch, sobald sie sichtbar sind. Der Endwert steht bereits im HTML (westliche Ziffern).
import { ruhig, type Aufraeumen } from './typen';

export function zahlen(): Aufraeumen | null {
  const elemente = document.querySelectorAll<HTMLElement>('[data-zahl]');
  if (!elemente.length || !('IntersectionObserver' in window) || ruhig()) return null;
  const rahmen = new Set<number>();
  const io = new IntersectionObserver((eintraege) => {
    for (const e of eintraege) {
      if (!e.isIntersecting) continue;
      const el = e.target as HTMLElement;
      io.unobserve(el);
      const ziel = Number(el.dataset.zahl);
      const start = performance.now();
      const dauer = 1100;
      const schritt = (jetzt: number) => {
        const p = Math.min(1, (jetzt - start) / dauer);
        // gleiche Kurve wie --kurve-ein (schneller Start, weiches Ende)
        el.textContent = String(Math.round(ziel * (1 - Math.pow(1 - p, 4))));
        if (p < 1) rahmen.add(requestAnimationFrame(schritt));
      };
      el.textContent = '0';
      rahmen.add(requestAnimationFrame(schritt));
    }
  }, { threshold: 0.6 });
  elemente.forEach((el) => io.observe(el));
  return () => {
    io.disconnect();
    rahmen.forEach((r) => cancelAnimationFrame(r));
    elemente.forEach((el) => { el.textContent = el.dataset.zahl ?? el.textContent; });
  };
}
