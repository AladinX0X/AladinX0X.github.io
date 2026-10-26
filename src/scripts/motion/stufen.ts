// Stufen-Szene (Arbeitsweise). Groß: gepinnt, Fortschritt per Scroll – eine Stufe nach der anderen leuchtet auf
// (Klasse "an"), frühere bleiben gedämpft an ("vorbei"), Linie füllt sich bis zur aktiven Raute, Bild blendet über,
// Zähler "03 / 06". Mobil: senkrechte Zeitleiste, jede Stufe leuchtet beim Eintreten auf.
// Die Klassen schaltet JS; die Übergänge selbst sind CSS (opacity/transform).
import { gsap, ScrollTrigger } from './gsap';

export function stufen(gross: boolean) {
  const weg: (() => void)[] = [];
  document.querySelectorAll<HTMLElement>('[data-muster="stufen"]').forEach((sektion) => {
    const stufen = [...sektion.querySelectorAll<HTMLElement>('[data-stufe]')];
    const bilder = [...sektion.querySelectorAll<HTMLElement>('[data-stufen-bild]')];
    const fuellung = sektion.querySelector<HTMLElement>('[data-stufen-fuellung]');
    const zaehler = sektion.querySelector<HTMLElement>('[data-stufen-zaehler]');
    const ansage = sektion.querySelector<HTMLElement>('[data-stufen-ansage]');
    if (!stufen.length) return;
    const n = stufen.length;
    let aktiv = -1;
    // Linie bis zur Mitte der Raute der aktiven Stufe
    const fuellen = (i: number) => {
      if (!fuellung) return;
      const linie = fuellung.parentElement!;
      const knoten = stufen[i].querySelector<HTMLElement>('.st-knoten');
      const oben = linie.getBoundingClientRect().top;
      const ziel = knoten ? knoten.getBoundingClientRect().top + knoten.offsetHeight / 2 - oben : 0;
      gsap.to(fuellung, { scaleY: Math.max(0, Math.min(1, ziel / linie.offsetHeight)), duration: 0.6, ease: 'ein', overwrite: true });
    };
    const setzen = (i: number) => {
      if (i === aktiv) return;
      aktiv = i;
      stufen.forEach((s, j) => { s.classList.toggle('an', j <= i); s.classList.toggle('vorbei', j < i); });
      bilder.forEach((b, j) => b.classList.toggle('sichtbar', j === i));
      if (zaehler) zaehler.textContent = String(i + 1).padStart(2, '0');
      if (ansage) ansage.textContent = (ansage.dataset.vorlage ?? '').replace('{i}', String(i + 1)).replace('{n}', String(n));
      fuellen(i);
    };

    if (gross) {
      sektion.classList.add('bewegt');
      ScrollTrigger.refresh();
      if (fuellung) gsap.set(fuellung, { scaleY: 0 });
      setzen(0);
      ScrollTrigger.create({
        trigger: sektion, start: 'top top', end: `+=${n * 45}%`, pin: true, scrub: true,
        onUpdate: (st) => setzen(Math.min(n - 1, Math.floor(st.progress * n * 0.999))),
      });
      weg.push(() => { sektion.classList.remove('bewegt'); stufen.forEach((s) => { s.classList.add('an'); s.classList.remove('vorbei'); }); });
    } else {
      // Mobil: Zeitleiste, Stufen leuchten beim Eintreten auf
      sektion.classList.add('zeitleiste');
      stufen.forEach((s) => s.classList.remove('an'));
      if (fuellung) gsap.set(fuellung, { scaleY: 0 });
      stufen.forEach((s, i) => {
        ScrollTrigger.create({
          trigger: s, start: 'top 70%',
          onEnter: () => { s.classList.add('an'); fuellen(i); },
          onLeaveBack: () => { s.classList.remove('an'); fuellen(Math.max(0, i - 1)); },
        });
      });
      weg.push(() => { sektion.classList.remove('zeitleiste'); stufen.forEach((s) => s.classList.add('an')); });
    }
  });
  return () => weg.forEach((f) => f());
}
