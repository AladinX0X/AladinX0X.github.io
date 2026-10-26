// Bewegung für ALLE Seiten (GSAP, ScrollTrigger, Lenis). Wird nur geladen, wenn prefers-reduced-motion NICHT gesetzt ist.
// Jedes Muster ist ein eigenes Modul und sucht seine Bausteine über data-muster (siehe DESIGN-SYSTEM.md).
// Pins nur auf großen Bildschirmen mit Maus; mobil leichte Varianten. Arabisch nur ganze Wörter/Zeilen.
// Animiert werden nur transform, opacity und clip-path.
import Lenis from 'lenis';
import { gsap, ScrollTrigger, GROSS, KLEIN } from './gsap';
import { hero } from './hero';
import { wortszene } from './wortszene';
import { bildszene } from './bildszene';
import { linienszene } from './linienszene';
import { parallaxe } from './parallaxe';
import { stufen } from './stufen';
import { stickyliste } from './stickyliste';
import { panele } from './panele';
import { galerie } from './galerie';
import { muster } from './muster';
import { plansatz } from './plansatz';
import { fallstudie } from './fallstudie';
import { eckdaten } from './eckdaten';
import { istRtl, istTouch, type Aufraeumen } from '../module/typen';

declare global {
  interface Window { __ayloul?: { scrollTrigger: () => number; lenis: () => boolean; szenen: () => { name: string; start: number; end: number; pin: boolean }[] } }
}

export async function bewegung(): Promise<Aufraeumen> {
  const rtl = istRtl();
  // Lenis: weiches Scrollen nur mit Maus/Trackpad, nicht auf Touch-Geräten
  let lenis: Lenis | null = null;
  const takt = (zeit: number) => lenis?.raf(zeit * 1000);
  if (!istTouch()) {
    lenis = new Lenis({ anchors: { offset: -80 }, lerp: 0.12, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(takt);
    gsap.ticker.lagSmoothing(0);
    document.documentElement.classList.add('lenis-an');
  }

  const mm = gsap.matchMedia();
  const ctx = gsap.context(() => {
    hero();
    parallaxe();
    eckdaten();
  });
  mm.add({ gross: GROSS, klein: KLEIN }, (c) => {
    const { gross } = c.conditions as { gross: boolean; klein: boolean };
    wortszene(gross);
    const weg = [stufen(gross, rtl), panele(gross), muster(gross), plansatz(gross), fallstudie(gross), stickyliste(gross)];
    if (gross) weg.push(bildszene(rtl), linienszene(rtl), galerie(rtl));
    return () => weg.forEach((f) => f());
  });

  // Für die Tests (tests/bewegung.mjs, tests/szenen.mjs): Anzahl ScrollTrigger, Lenis aktiv, Scroll-Bereiche der Szenen
  window.__ayloul = {
    scrollTrigger: () => ScrollTrigger.getAll().length,
    lenis: () => Boolean(lenis),
    szenen: () => ScrollTrigger.getAll()
      .filter((t) => (t.trigger as HTMLElement | undefined)?.dataset?.szene)
      .map((t) => ({ name: (t.trigger as HTMLElement).dataset.szene!, start: t.start, end: t.end, pin: Boolean(t.pin) })),
  };
  // Bilder und Schriften verändern Höhen: danach neu messen
  const neuMessen = () => ScrollTrigger.refresh();
  window.addEventListener('load', neuMessen, { once: true });
  void document.fonts?.ready.then(neuMessen);

  return () => {
    window.removeEventListener('load', neuMessen);
    mm.revert();
    ctx.revert();
    ScrollTrigger.getAll().forEach((t) => t.kill());
    gsap.ticker.remove(takt);
    lenis?.destroy();
    lenis = null;
    document.documentElement.classList.remove('lenis-an');
  };
}
