// Sticky-Liste (Leistungen). Groß: Bild bleibt am Zeilenende stehen (CSS sticky) und blendet auf den Eintrag über,
// der die Lesezeile (Bildschirmmitte) erreicht. Mobil: statisch (Bild bei jedem Eintrag).
import { ScrollTrigger } from './gsap';

export function stickyliste(gross: boolean) {
  const weg: (() => void)[] = [];
  if (!gross) return () => {};
  document.querySelectorAll<HTMLElement>('[data-muster="stickyliste"]').forEach((liste) => {
    const eintraege = [...liste.querySelectorAll<HTMLElement>('[data-sl-eintrag]')];
    const bilder = [...liste.querySelectorAll<HTMLElement>('[data-sl-bild]')];
    liste.classList.add('bewegt');
    ScrollTrigger.refresh();
    const setzen = (i: number) => {
      eintraege.forEach((e, j) => e.classList.toggle('aktiv', j === i));
      bilder.forEach((b, j) => b.classList.toggle('sichtbar', j === i));
    };
    eintraege.forEach((e, i) => {
      ScrollTrigger.create({ trigger: e, start: 'top 55%', end: 'bottom 55%', onToggle: (st) => { if (st.isActive) setzen(i); } });
    });
    weg.push(() => { liste.classList.remove('bewegt'); setzen(0); });
  });
  return () => weg.forEach((f) => f());
}
