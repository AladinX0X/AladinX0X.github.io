import projekteDatei from './projekte.json';
import leistungenDatei from './leistungen.json';
import type { Sprache } from '../i18n/utils';

export type Bereich = 'exterior' | 'interior' | 'shop-drawings' | 'graphic';
export interface ProjektText {
  titel: string; kurz: string; typ: string | null; umfang: string | null; ort: string | null; stil: string | null;
  beschreibung: string[]; materialien: string[]; alt: Record<string, string>;
}
export interface Projekt {
  slug: string; bereich: Bereich; land: string | null; flaeche: number | null; jahr: number | null;
  pdfSeiten: string; auszug?: boolean; titelbild: string; galerie: string[]; farben: string[];
  ar: ProjektText; en: ProjektText;
}
export interface Leistung { slug: string; icon: string; bild: string; projekte: string[] }

export const projekte = projekteDatei.projekte as Projekt[];
export const leistungen = leistungenDatei.leistungen as Leistung[];
export const bereiche: Bereich[] = ['exterior', 'interior', 'shop-drawings', 'graphic'];

export const projektText = (p: Projekt, s: Sprache): ProjektText => p[s];
export const projektNach = (slug: string) => projekte.find((p) => p.slug === slug);

/** Kennzahlen, berechnet aus den Daten (nie von Hand eintragen). */
export function kennzahlen() {
  const laender = [...new Set(projekte.map((p) => p.land).filter((l): l is string => Boolean(l)))];
  return { projekte: projekte.length, leistungen: leistungen.length, laender: laender.length, laenderListe: laender };
}
