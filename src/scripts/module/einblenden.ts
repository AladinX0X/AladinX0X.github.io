// Scroll-Einblendung für .einblenden (Inhalt ist ohne JavaScript und bei reduzierter Bewegung sofort sichtbar).
import { ruhig, type Aufraeumen } from './typen';

export function einblenden(): Aufraeumen | null {
  const elemente = document.querySelectorAll<HTMLElement>('.einblenden');
  if (!('IntersectionObserver' in window) || ruhig()) {
    elemente.forEach((el) => el.classList.add('sichtbar'));
    return null;
  }
  const io = new IntersectionObserver((eintraege) => {
    for (const e of eintraege) if (e.isIntersecting) { e.target.classList.add('sichtbar'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px' });
  elemente.forEach((el) => io.observe(el));
  return () => io.disconnect();
}
