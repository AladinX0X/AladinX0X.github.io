// Gemeinsame Typen und Hilfen der Seitenmodule.
export type Aufraeumen = () => void;

export const ruhig = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const istRtl = () => document.documentElement.dir === 'rtl';
/** Touch-Geräte ohne Maus: keine Hover-Effekte, kein Lenis */
export const istTouch = () => window.matchMedia('(hover: none), (pointer: coarse)').matches;

/** Fügt einen Listener hinzu und liefert die passende Aufräumfunktion. */
export function hoere<K extends keyof HTMLElementEventMap>(
  ziel: EventTarget, typ: K | string, fn: (e: never) => void, optionen?: AddEventListenerOptions,
): Aufraeumen {
  ziel.addEventListener(typ, fn as EventListener, optionen);
  return () => ziel.removeEventListener(typ, fn as EventListener, optionen);
}
