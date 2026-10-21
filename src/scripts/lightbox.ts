// Lightbox: öffnet per Klick oder Enter auf [data-lightbox-index], blättert mit Pfeilen, Esc schließt.
interface LbBild { src: string; srcset: string; breite: number; hoehe: number; alt: string }

const dialog = document.querySelector<HTMLDialogElement>('dialog[data-lightbox]');
const daten = dialog?.querySelector<HTMLScriptElement>('[data-lb-daten]');
if (dialog && daten) {
  const bilder = JSON.parse(daten.textContent ?? '[]') as LbBild[];
  const img = dialog.querySelector<HTMLImageElement>('[data-lb-bild]')!;
  const altText = dialog.querySelector<HTMLElement>('[data-lb-alt]')!;
  const zaehler = dialog.querySelector<HTMLElement>('[data-lb-zaehler]')!;
  const vorlage = dialog.dataset.zaehler ?? '{i} / {n}';
  const rtl = document.documentElement.dir === 'rtl';
  let index = 0;
  let ausloeser: HTMLElement | null = null;

  const zeige = (i: number) => {
    index = (i + bilder.length) % bilder.length;
    const b = bilder[index];
    img.src = b.src;
    img.srcset = b.srcset;
    img.width = b.breite;
    img.height = b.hoehe;
    img.alt = b.alt;
    img.style.setProperty('--max', `${b.breite}px`);
    altText.textContent = b.alt;
    zaehler.textContent = vorlage.replace('{i}', String(index + 1)).replace('{n}', String(bilder.length));
  };

  const oeffnen = (i: number, von: HTMLElement) => {
    ausloeser = von;
    zeige(i);
    dialog.showModal();
    document.documentElement.classList.add('lightbox-offen');
    dialog.querySelector<HTMLElement>('[data-lb-schliessen]')?.focus();
  };

  document.querySelectorAll<HTMLElement>('[data-lightbox-index]').forEach((el) => {
    el.addEventListener('click', () => oeffnen(Number(el.dataset.lightboxIndex), el));
  });

  dialog.querySelector('[data-lb-schliessen]')?.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-lb-weiter]')?.addEventListener('click', () => zeige(index + 1));
  dialog.querySelector('[data-lb-zurueck]')?.addEventListener('click', () => zeige(index - 1));
  // Klick auf den Hintergrund (nicht auf Bild oder Knöpfe) schließt
  dialog.addEventListener('click', (e) => {
    const ziel = e.target as HTMLElement;
    if (ziel === dialog || ziel.classList.contains('lb-innen')) dialog.close();
  });

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      // In RTL liegt "weiter" links
      const vor = (e.key === 'ArrowLeft') === rtl;
      zeige(index + (vor ? 1 : -1));
    } else if (e.key === 'Tab') {
      // Fokus bleibt im Dialog
      const fokusierbar = [...dialog.querySelectorAll<HTMLElement>('button')].filter((b) => b.offsetParent !== null);
      if (fokusierbar.length === 0) return;
      const erstes = fokusierbar[0];
      const letztes = fokusierbar[fokusierbar.length - 1];
      const aktiv = document.activeElement;
      if (e.shiftKey && (aktiv === erstes || !dialog.contains(aktiv))) { e.preventDefault(); letztes.focus(); }
      else if (!e.shiftKey && (aktiv === letztes || !dialog.contains(aktiv))) { e.preventDefault(); erstes.focus(); }
    }
  });

  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('lightbox-offen');
    ausloeser?.focus();
  });
}
