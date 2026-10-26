// Einstieg für alle Seiten. Mit Astro View Transitions (ClientRouter) läuft dieses Modul nur EINMAL;
// jede Seite wird deshalb bei astro:page-load initialisiert und bei astro:before-swap wieder aufgeräumt
// (Ereignis-Listener, Beobachter, GSAP/ScrollTrigger, Lenis). So entstehen keine Doppelungen und Lecks.
import { menue } from './module/menue';
import { kopf } from './module/kopf';
import { einblenden } from './module/einblenden';
import { zahlen } from './module/zahlen';
import { bilder } from './module/bilder';
import { lightbox } from './module/lightbox';
import { filter } from './module/filter';
import type { Aufraeumen } from './module/typen';

let aufraeumen: Aufraeumen[] = [];
let generation = 0;

async function starten() {
  const meine = ++generation;
  aufraeumen = [menue(), kopf(), einblenden(), zahlen(), bilder(), lightbox(), filter()].filter(Boolean) as Aufraeumen[];
  // GSAP, ScrollTrigger und Lenis nur laden, wenn Bewegung erlaubt ist (spart JavaScript bei reduzierter Bewegung)
  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (ruhig) return;
  const { bewegung } = await import('./module/bewegung');
  if (meine !== generation) return; // Seite wurde inzwischen gewechselt
  const weg = await bewegung();
  if (meine !== generation) { weg(); return; }
  aufraeumen.push(weg);
}

function stoppen() {
  generation++;
  for (const f of aufraeumen.splice(0)) {
    try { f(); } catch (e) { console.error(e); }
  }
}

document.addEventListener('astro:page-load', () => { void starten(); });
document.addEventListener('astro:before-swap', stoppen);
