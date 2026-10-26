// Mobiles Menü: öffnen/schließen, Esc, beim Wechsel auf Desktop schließen.
import { hoere, type Aufraeumen } from './typen';

export function menue(): Aufraeumen | null {
  const knopf = document.querySelector<HTMLButtonElement>('[data-menue-knopf]');
  const liste = document.querySelector<HTMLElement>('[data-mobilmenue]');
  if (!knopf || !liste) return null;
  const text = knopf.querySelector<HTMLElement>('.menue-text');
  const setzen = (offen: boolean) => {
    knopf.setAttribute('aria-expanded', String(offen));
    liste.hidden = !offen;
    document.documentElement.classList.toggle('menue-offen', offen);
    if (text) text.textContent = offen ? text.dataset.textZu ?? '' : text.dataset.textAuf ?? '';
    if (offen) liste.querySelector<HTMLElement>('a')?.focus();
  };
  const mq = window.matchMedia('(min-width: 62.0625rem)');
  const weg = [
    hoere(knopf, 'click', () => setzen(knopf.getAttribute('aria-expanded') !== 'true')),
    hoere(document, 'keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !liste.hidden) { setzen(false); knopf.focus(); }
    }),
    hoere(mq, 'change', (e: MediaQueryListEvent) => { if (e.matches) setzen(false); }),
  ];
  return () => {
    weg.forEach((f) => f());
    document.documentElement.classList.remove('menue-offen');
  };
}
