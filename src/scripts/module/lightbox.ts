// Lightbox: öffnet per Klick oder Enter auf [data-lightbox-index] mit Zoom aus dem Vorschaubild (FLIP),
// blättert mit Pfeiltasten und Wischen (in RTL gespiegelt), Esc schließt, Fokus bleibt im Dialog.
// Zoomen mit Mausrad, Zwei-Finger-Geste, Doppelklick oder den Knöpfen +/−; gezoomt wird das Bild verschoben (Pan).
import { hoere, istRtl, ruhig, type Aufraeumen } from './typen';

interface LbBild { src: string; srcset: string; avif: string; breite: number; hoehe: number; alt: string }

const MAX_ZOOM = 4;

export function lightbox(): Aufraeumen | null {
  const dialog = document.querySelector<HTMLDialogElement>('dialog[data-lightbox]');
  const daten = dialog?.querySelector<HTMLScriptElement>('[data-lb-daten]');
  if (!dialog || !daten) return null;
  const bilder = JSON.parse(daten.textContent ?? '[]') as LbBild[];
  const buehne = dialog.querySelector<HTMLElement>('[data-lb-buehne]')!;
  const img = dialog.querySelector<HTMLImageElement>('[data-lb-bild]')!;
  const quelle = dialog.querySelector<HTMLSourceElement>('[data-lb-avif]');
  const altText = dialog.querySelector<HTMLElement>('[data-lb-alt]')!;
  const zaehler = dialog.querySelector<HTMLElement>('[data-lb-zaehler]')!;
  const vorlage = dialog.dataset.zaehler ?? '{i} / {n}';
  const rtl = istRtl();
  let index = 0;
  let ausloeser: HTMLElement | null = null;
  const weg: Aufraeumen[] = [];

  // ---------- Zoom und Verschieben ----------
  let s = 1, x = 0, y = 0;
  const begrenzen = () => {
    const r = img.getBoundingClientRect();
    const w = r.width / s, h = r.height / s; // Größe ohne Zoom
    const mx = (w * (s - 1)) / 2, my = (h * (s - 1)) / 2;
    x = Math.max(-mx, Math.min(mx, x));
    y = Math.max(-my, Math.min(my, y));
  };
  const anwenden = () => {
    if (s <= 1.001) { s = 1; x = 0; y = 0; }
    begrenzen();
    img.style.transform = s === 1 ? '' : `translate(${x}px, ${y}px) scale(${s})`;
    dialog.classList.toggle('gezoomt', s > 1);
  };
  // Zoom um einen Punkt (Bildschirmkoordinaten)
  const zoomen = (neu: number, px?: number, py?: number) => {
    neu = Math.max(1, Math.min(MAX_ZOOM, neu));
    const r = img.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = (px ?? cx) - cx, dy = (py ?? cy) - cy;
    x = x - dx * (neu / s - 1);
    y = y - dy * (neu / s - 1);
    s = neu;
    anwenden();
    if (s > 1.3) volleAufloesung();
  };
  // Beim Zoomen die größte Variante laden (Pläne bis 4096 px), damit Beschriftungen scharf bleiben
  let voll = false;
  const volleAufloesung = () => {
    if (voll) return;
    voll = true;
    const b = bilder[index];
    const groesste = b.avif.split(',').pop()?.trim().split(' ')[0];
    if (quelle && groesste) quelle.srcset = groesste;
    img.srcset = '';
    img.src = b.src;
  };
  const zuruecksetzen = () => { s = 1; x = 0; y = 0; img.style.transform = ''; dialog.classList.remove('gezoomt'); };

  const zeige = (i: number) => {
    index = (i + bilder.length) % bilder.length;
    const b = bilder[index];
    zuruecksetzen();
    voll = false;
    if (quelle) quelle.srcset = b.avif;
    img.src = b.src;
    img.srcset = b.srcset;
    img.width = b.breite;
    img.height = b.hoehe;
    img.alt = b.alt;
    altText.textContent = b.alt;
    zaehler.textContent = vorlage.replace('{i}', String(index + 1)).replace('{n}', String(bilder.length));
  };

  // FLIP: vom Vorschaubild in die Endposition
  const flip = (von: HTMLElement) => {
    if (ruhig()) return;
    const vorschau = von.querySelector('img') ?? von;
    const a = vorschau.getBoundingClientRect();
    const b = img.getBoundingClientRect();
    if (!a.width || !b.width) return;
    const sx = a.width / b.width, sy = a.height / b.height;
    const tx = a.left + a.width / 2 - (b.left + b.width / 2);
    const ty = a.top + a.height / 2 - (b.top + b.height / 2);
    img.animate(
      [{ transform: `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`, borderRadius: '14px' }, { transform: 'none', borderRadius: '0' }],
      { duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
    dialog.animate([{ backgroundColor: 'rgb(3 33 26 / 0)' }, { backgroundColor: 'rgb(3 33 26 / 0.97)' }], { duration: 400, easing: 'ease-out' });
  };

  const oeffnen = (i: number, von: HTMLElement) => {
    ausloeser = von;
    zeige(i);
    dialog.showModal();
    document.documentElement.classList.add('lightbox-offen');
    flip(von);
    dialog.querySelector<HTMLElement>('[data-lb-schliessen]')?.focus();
  };

  document.querySelectorAll<HTMLElement>('[data-lightbox-index]').forEach((el) => {
    weg.push(hoere(el, 'click', () => oeffnen(Number(el.dataset.lightboxIndex), el)));
  });
  const knopf = (sel: string, fn: () => void) => {
    const k = dialog.querySelector(sel);
    if (k) weg.push(hoere(k, 'click', fn));
  };
  knopf('[data-lb-schliessen]', () => dialog.close());
  knopf('[data-lb-weiter]', () => zeige(index + 1));
  knopf('[data-lb-zurueck]', () => zeige(index - 1));
  knopf('[data-lb-plus]', () => zoomen(s * 1.6));
  knopf('[data-lb-minus]', () => zoomen(s / 1.6));

  // Klick auf den Hintergrund (nicht auf Bild oder Knöpfe) schließt
  weg.push(hoere(dialog, 'click', (e: MouseEvent) => {
    const ziel = e.target as HTMLElement;
    if (ziel === dialog || ziel.classList.contains('lb-innen')) dialog.close();
  }));

  weg.push(hoere(dialog, 'keydown', (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      // In RTL liegt "weiter" links
      const vor = (e.key === 'ArrowLeft') === rtl;
      zeige(index + (vor ? 1 : -1));
    } else if (e.key === '+' || e.key === '=') { zoomen(s * 1.6); }
    else if (e.key === '-') { zoomen(s / 1.6); }
    else if (e.key === 'Tab') {
      // Fokus bleibt im Dialog
      const fokusierbar = [...dialog.querySelectorAll<HTMLElement>('button')].filter((b) => b.offsetParent !== null);
      if (fokusierbar.length === 0) return;
      const erstes = fokusierbar[0];
      const letztes = fokusierbar[fokusierbar.length - 1];
      const aktiv = document.activeElement;
      if (e.shiftKey && (aktiv === erstes || !dialog.contains(aktiv))) { e.preventDefault(); letztes.focus(); }
      else if (!e.shiftKey && (aktiv === letztes || !dialog.contains(aktiv))) { e.preventDefault(); erstes.focus(); }
    }
  }));

  // Mausrad zoomt um den Mauszeiger
  weg.push(hoere(buehne, 'wheel', (e: WheelEvent) => {
    e.preventDefault();
    zoomen(s * Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
  }, { passive: false }));
  weg.push(hoere(img, 'dblclick', (e: MouseEvent) => zoomen(s > 1 ? 1 : 2.5, e.clientX, e.clientY)));

  // Zeiger: ein Finger/Maus = verschieben (gezoomt) oder wischen (nicht gezoomt), zwei Finger = Zoom
  const zeiger = new Map<number, { x: number; y: number }>();
  let start: { x: number; y: number; zeit: number } | null = null;
  let pinch: { abstand: number; s: number } | null = null;
  const abstand = () => { const [a, b] = [...zeiger.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  const mitte = () => { const [a, b] = [...zeiger.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; };
  weg.push(hoere(buehne, 'pointerdown', (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    buehne.setPointerCapture(e.pointerId);
    zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (zeiger.size === 1) start = { x: e.clientX, y: e.clientY, zeit: performance.now() };
    if (zeiger.size === 2) { pinch = { abstand: abstand(), s }; start = null; }
  }));
  weg.push(hoere(buehne, 'pointermove', (e: PointerEvent) => {
    const alt = zeiger.get(e.pointerId);
    if (!alt) return;
    const neu = { x: e.clientX, y: e.clientY };
    zeiger.set(e.pointerId, neu);
    if (zeiger.size === 2 && pinch) {
      const m = mitte();
      zoomen(pinch.s * (abstand() / pinch.abstand), m.x, m.y);
    } else if (zeiger.size === 1 && s > 1) {
      x += neu.x - alt.x;
      y += neu.y - alt.y;
      anwenden();
    }
  }));
  const ende = (e: PointerEvent) => {
    zeiger.delete(e.pointerId);
    if (zeiger.size < 2) pinch = null;
    if (start && zeiger.size === 0 && s === 1) {
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && performance.now() - start.zeit < 800) {
        // LTR: nach links wischen = weiter; RTL: nach rechts wischen = weiter
        const weiter = rtl ? dx > 0 : dx < 0;
        zeige(index + (weiter ? 1 : -1));
      }
    }
    if (zeiger.size === 0) start = null;
    // Doppeltipp: zwei kurze Tipps kurz hintereinander an fast derselben Stelle
    if (e.pointerType === 'touch' && zeiger.size === 0) {
      const jetzt = performance.now();
      if (letzterTipp && jetzt - letzterTipp.zeit < 320 && Math.hypot(e.clientX - letzterTipp.x, e.clientY - letzterTipp.y) < 30) {
        zoomen(s > 1 ? 1 : 2.5, e.clientX, e.clientY);
        letzterTipp = null;
      } else letzterTipp = { x: e.clientX, y: e.clientY, zeit: jetzt };
    }
  };
  let letzterTipp: { x: number; y: number; zeit: number } | null = null;
  weg.push(hoere(buehne, 'pointerup', ende), hoere(buehne, 'pointercancel', ende));

  weg.push(hoere(dialog, 'close', () => {
    document.documentElement.classList.remove('lightbox-offen');
    zuruecksetzen();
    ausloeser?.focus();
  }));

  return () => {
    weg.forEach((f) => f());
    if (dialog.open) dialog.close();
    document.documentElement.classList.remove('lightbox-offen');
  };
}
