// Kopfzeile: über dem Hero transparent, danach Waldgrün mit Weichzeichner und kompakter;
// beim Scrollen nach unten ausgeblendet, beim Scrollen nach oben wieder da.
// Nur Klassen werden gesetzt, die Bewegung selbst ist CSS (transform/opacity).
import { hoere, type Aufraeumen } from './typen';

export function kopf(): Aufraeumen | null {
  const el = document.querySelector<HTMLElement>('[data-kopf]');
  if (!el) return null;
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  let letztes = window.scrollY;
  let geplant = false;

  const aktualisieren = () => {
    geplant = false;
    const y = Math.max(0, window.scrollY);
    const hoehe = el.offsetHeight;
    const heroEnde = hero ? hero.offsetTop + hero.offsetHeight - hoehe : 0;
    el.classList.toggle('ueber-hero', Boolean(hero) && y < heroEnde);
    el.classList.toggle('kompakt', y > 24);
    const menueOffen = document.documentElement.classList.contains('menue-offen');
    const fokusDrin = el.contains(document.activeElement);
    const runter = y > letztes + 4;
    const hoch = y < letztes - 4;
    if (menueOffen || fokusDrin || y < hoehe * 2) el.classList.remove('versteckt');
    else if (runter) el.classList.add('versteckt');
    else if (hoch) el.classList.remove('versteckt');
    if (runter || hoch) letztes = y;
  };
  const planen = () => { if (!geplant) { geplant = true; requestAnimationFrame(aktualisieren); } };
  aktualisieren();
  const weg = [
    hoere(window, 'scroll', planen, { passive: true }),
    hoere(window, 'resize', planen),
    hoere(el, 'focusin', () => el.classList.remove('versteckt')),
  ];
  return () => weg.forEach((f) => f());
}
