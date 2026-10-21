// Gemeinsames Verhalten: mobiles Menü, Scroll-Einblendung, hochzählende Kennzahlen.

// Mobiles Menü
const knopf = document.querySelector<HTMLButtonElement>('[data-menue-knopf]');
const menue = document.querySelector<HTMLElement>('[data-mobilmenue]');
if (knopf && menue) {
  const text = knopf.querySelector<HTMLElement>('.menue-text');
  const setzen = (offen: boolean) => {
    knopf.setAttribute('aria-expanded', String(offen));
    menue.hidden = !offen;
    document.documentElement.classList.toggle('menue-offen', offen);
    if (text) text.textContent = offen ? text.dataset.textZu ?? '' : text.dataset.textAuf ?? '';
    if (offen) menue.querySelector<HTMLElement>('a')?.focus();
  };
  knopf.addEventListener('click', () => setzen(knopf.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menue.hidden) { setzen(false); knopf.focus(); }
  });
  window.matchMedia('(min-width: 62.0625rem)').addEventListener('change', (e) => { if (e.matches) setzen(false); });
}

const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Scroll-Einblendung
const einblenden = document.querySelectorAll<HTMLElement>('.einblenden');
if ('IntersectionObserver' in window && !ruhig) {
  const io = new IntersectionObserver((eintraege) => {
    for (const e of eintraege) if (e.isIntersecting) { e.target.classList.add('sichtbar'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px' });
  einblenden.forEach((el) => io.observe(el));
} else {
  einblenden.forEach((el) => el.classList.add('sichtbar'));
}

// Kennzahlen hochzählen (Endwert steht bereits im HTML, westliche Ziffern)
const zahlen = document.querySelectorAll<HTMLElement>('[data-zahl]');
if ('IntersectionObserver' in window && !ruhig) {
  const io = new IntersectionObserver((eintraege) => {
    for (const e of eintraege) {
      if (!e.isIntersecting) continue;
      const el = e.target as HTMLElement;
      io.unobserve(el);
      const ziel = Number(el.dataset.zahl);
      const start = performance.now();
      const dauer = 900;
      const schritt = (jetzt: number) => {
        const p = Math.min(1, (jetzt - start) / dauer);
        el.textContent = String(Math.round(ziel * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(schritt);
      };
      requestAnimationFrame(schritt);
    }
  }, { threshold: 0.6 });
  zahlen.forEach((el) => io.observe(el));
}
