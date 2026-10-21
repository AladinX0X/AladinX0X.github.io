// Kontaktformular: Prüfung am Feld, Meldungen aus data-Attributen (Seitensprache). Kein Versand.
const form = document.querySelector<HTMLFormElement>('form[data-formular]');

/**
 * TODO Versand: Hier später einen Versanddienst anschließen (z. B. ein Formular-Dienst
 * oder eine eigene Serverfunktion, mit Spamschutz). Bis dahin wird nichts gesendet.
 * Rückgabe true = gesendet. Siehe README, Abschnitt "Später online gehen".
 */
async function versenden(_daten: Record<string, string>): Promise<boolean> {
  return false;
}

if (form) {
  const meldung = {
    pflicht: form.dataset.fehlerPflicht ?? '',
    email: form.dataset.fehlerEmail ?? '',
    telefon: form.dataset.fehlerTelefon ?? '',
    kurz: form.dataset.fehlerKurz ?? '',
  };
  const zusammenfassung = form.querySelector<HTMLElement>('[data-formular-zusammenfassung]')!;
  const erfolg = form.querySelector<HTMLElement>('[data-formular-erfolg]')!;
  const felder = [...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')];

  const pruefe = (f: HTMLInputElement | HTMLTextAreaElement) => {
    const wert = f.value.trim();
    let fehler = '';
    if (f.required && !wert) fehler = meldung.pflicht;
    else if (f.type === 'email' && wert && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(wert)) fehler = meldung.email;
    else if (f.type === 'tel' && wert && !/^\+?[\d\s]{6,20}$/.test(wert)) fehler = meldung.telefon;
    else if (f.name === 'nachricht' && wert && wert.length < 10) fehler = meldung.kurz;
    const ausgabe = form.querySelector<HTMLElement>(`#fehler-${f.name}`);
    if (ausgabe) ausgabe.textContent = fehler;
    if (fehler) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid');
    return !fehler;
  };

  // Nach dem ersten Fehler beim Verlassen und Tippen neu prüfen
  for (const f of felder) {
    f.addEventListener('blur', () => { if (f.value.trim() || f.hasAttribute('aria-invalid')) pruefe(f); });
    f.addEventListener('input', () => { if (f.hasAttribute('aria-invalid')) pruefe(f); });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    erfolg.hidden = true;
    const ergebnisse = felder.map(pruefe);
    if (ergebnisse.includes(false)) {
      zusammenfassung.hidden = false;
      felder[ergebnisse.indexOf(false)].focus();
      return;
    }
    zusammenfassung.hidden = true;
    const daten = Object.fromEntries(felder.map((f) => [f.name, f.value.trim()]));
    await versenden(daten);
    erfolg.hidden = false;
  });
}
