/* ============================================================
   ANEMOIA STUDIO — SCIA DI PIXEL DEL CURSORE
   Ad ogni movimento del mouse, lascia una scia di piccoli pixel
   rosa che sfumano e scompaiono, coerente con l'estetica pixel-art
   del sito. Disattivata per chi preferisce ridurre le animazioni.
   ============================================================ */

(function () {

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  // Su dispositivi touch non c'è un cursore da inseguire
  if (window.matchMedia('(hover: none)').matches) return;

  let lastSpawn = 0;
  const SPAWN_INTERVAL = 40; // ms tra un pixel e l'altro della scia

  function spawnPixel(x, y) {
    const el = document.createElement('div');
    el.className = 'cursor-pixel';
    // leggera variazione di dimensione per un effetto meno meccanico
    const size = 5 + Math.round(Math.random() * 3);
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.left = (x - size / 2) + 'px';
    el.style.top = (y - size / 2) + 'px';
    document.body.appendChild(el);

    // Rimuoviamo l'elemento dal DOM al termine della dissolvenza
    el.addEventListener('animationend', () => el.remove());
  }

  window.addEventListener('mousemove', (e) => {
    const now = performance.now();
    if (now - lastSpawn < SPAWN_INTERVAL) return;
    lastSpawn = now;
    spawnPixel(e.clientX, e.clientY);
  });

})();
