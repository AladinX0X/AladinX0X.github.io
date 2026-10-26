// Bewegung mit GSAP, ScrollTrigger und Lenis. Wird nur geladen, wenn prefers-reduced-motion NICHT gesetzt ist.
// Konzept (siehe BERICHT.md "Bewegungskonzept"):
//  - Hero: Einstieg per CSS (Zoom 1.08 → 1, Wörter/Zeilen nacheinander, global.css); hier beim Scrollen
//    leichte Parallaxe, das Bild dunkelt ab, der Text blendet aus.
//  - Drei gepinnte Szenen nur auf großen Bildschirmen mit Maus: Studio-Satz (Wörter von blass zu voll),
//    Hauptprojekt (gerahmtes Bild wird Vollbild, Text wechselt), Arbeitsweise (Raute wandert die Linie entlang).
//  - Mobil und Touch: keine Pins, nur leichte Varianten.
// Arabisch wird nie in Buchstaben zerlegt: animiert werden nur ganze Wörter (.wort) oder ganze Zeilen/Blöcke.
// Animiert werden nur transform, opacity und clip-path.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import Lenis from 'lenis';
import { istRtl, istTouch, type Aufraeumen } from './typen';

gsap.registerPlugin(ScrollTrigger, CustomEase);
// Gleiche Kurve wie das CSS-Token --kurve-ein (src/styles/tokens.css)
CustomEase.create('ein', '0.22,1,0.36,1');

declare global {
  interface Window { __ayloul?: { scrollTrigger: () => number; lenis: () => boolean; szenen: () => { name: string; start: number; end: number; pin: boolean }[] } }
}

const GROSS = '(min-width: 62rem) and (hover: hover) and (pointer: fine)';
const KLEIN = '(max-width: 61.99rem), (hover: none), (pointer: coarse)';

function hero() {
  const sektion = document.querySelector<HTMLElement>('[data-hero]');
  if (!sektion) return;
  // Der Einstieg (Zoom, Zeilen) läuft per CSS (global.css), hier nur die Scroll-Bewegung
  const rahmen = sektion.querySelector<HTMLElement>('[data-hero-bild]');
  const schleier = sektion.querySelector<HTMLElement>('[data-hero-schleier]');
  const text = sektion.querySelector<HTMLElement>('[data-hero-text]');
  const hinweis = sektion.querySelector<HTMLElement>('[data-hero-hinweis]');

  // Beim Scrollen: leichte Parallaxe, Bild dunkelt ab, Text blendet aus
  const st = { trigger: sektion, start: 'top top', end: 'bottom top', scrub: true };
  if (rahmen) gsap.to(rahmen, { yPercent: 14, ease: 'none', scrollTrigger: st });
  if (schleier) gsap.fromTo(schleier, { opacity: 0 }, { opacity: 0.75, ease: 'none', scrollTrigger: st });
  if (text) gsap.to(text, { opacity: 0, y: -48, ease: 'none', scrollTrigger: { ...st, end: '55% top' } });
  if (hinweis) gsap.to(hinweis, { opacity: 0, ease: 'none', scrollTrigger: { ...st, end: '15% top' } });
}

/** Szene a: Studio-Satz, Wörter werden beim Scrollen von blass zu voll. */
function szeneSatz(gross: boolean) {
  const sektion = document.querySelector<HTMLElement>('[data-szene="satz"]');
  const satz = sektion?.querySelector('[data-satz]');
  if (!sektion || !satz) return;
  const woerter = satz.querySelectorAll('.wort');
  gsap.fromTo(woerter, { opacity: 0.16 }, {
    opacity: 1, ease: 'none', stagger: 0.12,
    scrollTrigger: gross
      ? { trigger: sektion, start: 'top top', end: '+=110%', scrub: 0.6, pin: true }
      : { trigger: sektion, start: 'top 75%', end: 'center 45%', scrub: 0.6 },
  });
}

/** Szene b: Hauptprojekt, gerahmte Karte wird Vollbild, Text wechselt. Nur groß. */
function szeneProjekt(rtl: boolean) {
  const sektion = document.querySelector<HTMLElement>('[data-szene="projekt"]');
  if (!sektion) return () => {};
  const bild = sektion.querySelector<HTMLElement>('[data-sp-bild]');
  const img = bild?.querySelector('img');
  const text1 = sektion.querySelector<HTMLElement>('[data-sp-text1]');
  const text2 = sektion.querySelector<HTMLElement>('[data-sp-text2]');
  const schleier = sektion.querySelector<HTMLElement>('[data-sp-schleier]');
  if (!bild || !text1 || !text2) return () => {};
  sektion.classList.add('bewegt');
  ScrollTrigger.refresh();
  // Karte am Zeilenende, Text am Zeilenanfang (inset ist physisch: oben rechts unten links)
  const start = rtl ? 'inset(16% 50% 16% 6% round 14px)' : 'inset(16% 6% 16% 50% round 14px)';
  const tl = gsap.timeline({ scrollTrigger: { trigger: sektion, start: 'top top', end: '+=160%', scrub: 0.8, pin: true } });
  tl.fromTo(bild, { clipPath: start }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', duration: 1 }, 0);
  if (img) tl.fromTo(img, { scale: 1.15 }, { scale: 1, ease: 'none', duration: 1 }, 0);
  tl.to(text1, { opacity: 0, y: -32, ease: 'none', duration: 0.3 }, 0.1);
  if (schleier) tl.fromTo(schleier, { opacity: 0 }, { opacity: 1, ease: 'none', duration: 0.3 }, 0.6);
  tl.fromTo(text2, { opacity: 0, y: 32 }, { opacity: 1, y: 0, ease: 'none', duration: 0.3 }, 0.65);
  tl.to({}, { duration: 0.25 });
  return () => sektion.classList.remove('bewegt');
}

/** Szene c: Arbeitsweise, die Raute wandert entlang der gestrichelten Linie, Schritte leuchten auf. Nur groß. */
function szeneAblauf(rtl: boolean) {
  const sektion = document.querySelector<HTMLElement>('[data-szene="ablauf"]');
  if (!sektion) return () => {};
  const leiste = sektion.querySelector<HTMLElement>('[data-ablauf-leiste]');
  const raute = sektion.querySelector<HTMLElement>('[data-ablauf-raute]');
  const fuellung = sektion.querySelector<HTMLElement>('[data-ablauf-fuellung]');
  const schritte = [...sektion.querySelectorAll<HTMLElement>('[data-ablauf-schritt]')];
  if (!leiste || !raute || !schritte.length) return () => {};
  sektion.classList.add('bewegt');
  ScrollTrigger.refresh();
  const n = schritte.length;
  const weg = () => (leiste.offsetWidth * (n - 1)) / n * (rtl ? -1 : 1);
  const tl = gsap.timeline({ scrollTrigger: { trigger: sektion, start: 'top top', end: '+=180%', scrub: 0.7, pin: true, invalidateOnRefresh: true } });
  tl.fromTo(raute, { x: 0 }, { x: weg, ease: 'none', duration: 1 }, 0);
  if (fuellung) tl.fromTo(fuellung, { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 1 }, 0);
  schritte.forEach((s, i) => {
    if (i === 0) return;
    tl.fromTo(s, { opacity: 0.32, y: 16 }, { opacity: 1, y: 0, ease: 'ein', duration: 0.12 }, (i / (n - 1)) - 0.06);
  });
  tl.to({}, { duration: 0.15 });
  return () => sektion.classList.remove('bewegt');
}

/** Leichte Parallaxe für Bilder mit [data-parallax] (Seitenköpfe). */
function parallaxe() {
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((rahmen) => {
    const img = rahmen.querySelector('img');
    if (!img) return;
    gsap.fromTo(img, { yPercent: -5, scale: 1.12 }, {
      yPercent: 5, scale: 1.12, ease: 'none',
      scrollTrigger: { trigger: rahmen, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
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
  });
  mm.add({ gross: GROSS, klein: KLEIN }, (c) => {
    const { gross } = c.conditions as { gross: boolean; klein: boolean };
    szeneSatz(gross);
    if (!gross) return;
    const a = szeneProjekt(rtl);
    const b = szeneAblauf(rtl);
    return () => { a(); b(); };
  });

  // Für die Tests (tests/bewegung.mjs): Anzahl ScrollTrigger, Lenis aktiv, Scroll-Bereiche der Szenen
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
