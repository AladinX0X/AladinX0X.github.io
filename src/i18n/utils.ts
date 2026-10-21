import ar from './ar.json';
import site from '../data/site.json';

// en.json wird in Phase 3 ergänzt. Solange fehlt, gilt nur Arabisch.
const woerterbuecher: Record<string, typeof ar> = { ar };
const enModule = import.meta.glob<{ default: typeof ar }>('./en.json', { eager: true });
for (const m of Object.values(enModule)) woerterbuecher.en = m.default;

export type Sprache = 'ar' | 'en';
export const sprachen = site.sprachen as Sprache[];
export const standardSprache = site.standardSprache as Sprache;

export const richtung = (s: Sprache) => (s === 'ar' ? 'rtl' : 'ltr');
export const t = (s: Sprache) => woerterbuecher[s];

/** Ersetzt {platzhalter} in einem Text. Zahlen immer mit westlichen Ziffern. */
export function fuelle(text: string, werte: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in werte ? String(werte[k]) : `{${k}}`));
}

/** Pfad ab Wurzel, z. B. pfad('ar', 'projects/villa-homs') -> /ar/projects/villa-homs/ */
export function pfad(s: Sprache, rest = '') {
  const r = rest.replace(/^\/+|\/+$/g, '');
  return r ? `/${s}/${r}/` : `/${s}/`;
}

/** Derselbe Pfad in einer anderen Sprache. */
export function pfadIn(aktuellerPfad: string, ziel: Sprache) {
  return aktuellerPfad.replace(/^\/(ar|en)(\/|$)/, `/${ziel}/`);
}

export const andereSprachen = (s: Sprache) => sprachen.filter((x) => x !== s);

export const sprachPfade = () => sprachen.map((lang) => ({ params: { lang } }));
