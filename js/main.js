/* ============================================================
   ANEMOIA STUDIO — MAIN JS
   Gestisce solo la Loading Screen: conteggio percentuale 1→100
   e la tenda che sale rivelando la pagina sottostante.
   Da quel momento in poi la sequenza (logo→navbar, testa gigante,
   rotazione 360°, Purpose/Vision/Mission) è governata dallo scroll
   reale dell'utente in js/intro-scroll.js.
   ============================================================ */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {

  const loadingScreen = document.getElementById('loading-screen');
  const loadingFill   = document.getElementById('loading-fill');
  const loadingPercent= document.getElementById('loading-percent');
  const loadingBar    = document.getElementById('loading-bar');

  document.body.classList.add('lock-scroll');

  function setProgress(pct) {
    const clamped = Math.min(100, Math.max(0, Math.round(pct)));
    loadingFill.style.width = clamped + '%';
    loadingPercent.textContent = clamped + '%';
    loadingBar.setAttribute('aria-valuenow', clamped);
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, prefersReducedMotion ? 0 : ms));
  }

  function waitTransition(el, propName, fallbackMs) {
    return new Promise(resolve => {
      if (prefersReducedMotion) { resolve(); return; }
      let done = false;
      const onEnd = (e) => {
        if (e.propertyName === propName) {
          done = true;
          el.removeEventListener('transitionend', onEnd);
          resolve();
        }
      };
      el.addEventListener('transitionend', onEnd);
      setTimeout(() => { if (!done) resolve(); }, fallbackMs);
    });
  }

  // Asset critici da precaricare qui (il resto, i 97 frame della
  // rotazione, viene precaricato da intro-scroll.js in parallelo,
  // senza bloccare questa schermata)
  const assetsToLoad = [
    'assets/img/logo.svg'
  ];

  function preloadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = resolve;
      img.src = src;
    });
  }

  function preloadFont() {
    if (document.fonts && document.fonts.load) {
      return document.fonts.load('700 1em ByteBounce').catch(() => {});
    }
    return Promise.resolve();
  }

  function animatePercentCount(durationMs) {
    return new Promise(resolve => {
      if (prefersReducedMotion) { setProgress(100); resolve(); return; }
      const start = performance.now();
      function tick(now) {
        const elapsed = now - start;
        const pct = Math.min(100, (elapsed / durationMs) * 100);
        setProgress(pct);
        if (pct < 100) {
          requestAnimationFrame(tick);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(tick);
    });
  }

  async function runLoading() {
    const assetsPromise = Promise.all([preloadFont(), ...assetsToLoad.map(preloadImage)]);

    await Promise.all([
      animatePercentCount(1600),
      assetsPromise
    ]);
    setProgress(100);

    await wait(350);

    // Tenda del loading che sale, rivelando la schermata con il logo centrale
    loadingScreen.classList.add('is-hidden');
    await waitTransition(loadingScreen, 'transform', 1000);
    loadingScreen.style.display = 'none';

    // Da qui in poi il controllo passa allo scroll dell'utente:
    // sblocchiamo lo scroll e segnaliamo a intro-scroll.js che può iniziare
    document.body.classList.remove('lock-scroll');
    document.dispatchEvent(new CustomEvent('anemoia:intro-ready'));
  }

  runLoading();
});
