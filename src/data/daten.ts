import projekteDatei from './projekte.json';
import leistungenDatei from './leistungen.json';
import type { Sprache } from '../i18n/utils';

export type Bereich = 'exterior' | 'interior' | 'shop-drawings' | 'graphic';
export interface ProjektText {
  titel: string; kurz: string; typ: string | null; umfang: string | null; ort: string | null; stil: string | null;
  beschreibung: string[]; materialien: string[]; alt: Record<string, string>;
  /** Namen zu farben (gleiche Reihenfolge); nur Innenprojekte und Identität */
  farbnamen?: string[];
  /** Plannamen (Werkplanung), gleiche Reihenfolge wie galerie */
  blaetter?: string[];
}
export interface Projekt {
  slug: string; bereich: Bereich; land: string | null; flaeche: number | null; jahr: number | null;
  pdfSeiten: string; titelbild: string; galerie: string[]; farben: string[];
  /** "geteilt" erzwingt den geteilten Hero (sonst automatisch nach Bildbreite) */
  hero?: 'geteilt' | 'vollbild';
  ar: ProjektText; en: ProjektText;
}
export interface Leistung { slug: string; icon: string; bild: string; projekte: string[] }

export const projekte = projekteDatei.projekte as Projekt[];
export const leistungen = leistungenDatei.leistungen as Leistung[];
export const bereiche: Bereich[] = ['exterior', 'interior', 'shop-drawings', 'graphic'];

export const projektText = (p: Projekt, s: Sprache): ProjektText => p[s];
export const projektNach = (slug: string) => projekte.find((p) => p.slug === slug);

/** Nachbarn in der Reihenfolge der Datendatei (Kreis): vorheriges und nächstes Projekt. */
export function nachbarn(slug: string) {
  const i = projekte.findIndex((p) => p.slug === slug);
  return { vorher: projekte[(i - 1 + projekte.length) % projekte.length], nachher: projekte[(i + 1) % projekte.length] };
}

/** alt-Text zu einer Bild-ID: aus dem Projekt, zu dem das Bild gehört (projekte.json). */
export function altText(id: string, s: Sprache): string {
  for (const p of projekte) if (p[s].alt[id]) return p[s].alt[id];
  throw new Error(`alt-Text für Bild "${id}" fehlt (kein Projekt hat es in der Galerie)`);
}

/** Kennzahlen, berechnet aus den Daten (nie von Hand eintragen). Reine Funktion, damit sie testbar ist. */
export function berechneKennzahlen(p: { land: string | null }[], l: unknown[]) {
  const laender = [...new Set(p.map((x) => x.land).filter((x): x is string => Boolean(x)))];
  return { projekte: p.length, leistungen: l.length, laender: laender.length, laenderListe: laender };
}
export const kennzahlen = () => berechneKennzahlen(projekte, leistungen);
