/* ============================================================
   ANEMOIA STUDIO — ABOUT ME SCROLLYTELLING
   Sia il titolo che il paragrafo si "scrivono da soli", lettera
   per lettera / parola per parola, agganciati allo scroll (stesso
   principio del text-reveal di sui.io): non è un timer, è la
   posizione di scroll a determinare esattamente quanto testo è
   visibile e quanto è "a fuoco".
   I rettangoli evidenziatori (mark.hl) si dipingono in sincro con
   la frase che racchiudono.
   ============================================================ */

(function () {

  const aboutPin   = document.getElementById('about-pin');
  const aboutTitle = document.getElementById('about-title');
  const aboutText  = document.getElementById('about-text');

  if (!aboutPin || !aboutText) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const mapRange01 = (v, inMin, inMax) => clamp01((v - inMin) / (inMax - inMin));

  // Rivela in sequenza un elenco di elementi lungo un intervallo di
  // progress [0,1] locale, con una finestra di sovrapposizione tra un
  // elemento e il successivo (sensazione di scrittura continua).
  // Le soglie sono "compresse" di mezza finestra su entrambi i lati in
  // modo che il PRIMO elemento raggiunga 0 esattamente a localProgress=0
  // e l'ULTIMO raggiunga 1 esattamente a localProgress=1 (senza questo
  // accorgimento l'ultimo elemento non arriva mai a piena opacità).
  function revealSequence(elements, localProgress, windowSize) {
    const n = elements.length;
    elements.forEach((el, i) => {
      const center = n > 1
        ? windowSize / 2 + (1 - windowSize) * (i / (n - 1))
        : 0.5;
      const t = mapRange01(localProgress, center - windowSize / 2, center + windowSize / 2);
      el.style.opacity = String(t);
      el.style.filter = `blur(${(1 - t) * 6}px)`;
      const bg = el.querySelector && el.querySelector('.hl-bg');
      if (bg) bg.style.transform = `scaleX(${t})`;
    });
  }

  // ---------- Titolo: spezzato in lettere per l'effetto "si scrive" ----------
  const titleText = aboutTitle.textContent;
  aboutTitle.textContent = '';
  const letters = Array.from(titleText).map((ch) => {
    const span = document.createElement('span');
    span.className = 'letter';
    span.textContent = ch === ' ' ? '\u00A0' : ch;
    aboutTitle.appendChild(span);
    return span;
  });

  // ---------- Paragrafo: parole + frasi evidenziate come token ----------
  const tokens = Array.from(aboutText.querySelectorAll('.word, mark.hl'));

  const TITLE_WINDOW = Math.min(0.6, 3 / Math.max(letters.length, 1));
  const TEXT_WINDOW  = 1.6 / Math.max(tokens.length, 1);

  function update() {
    const rect = aboutPin.getBoundingClientRect();
    const scrollableDistance = aboutPin.offsetHeight - window.innerHeight;
    const progress = scrollableDistance > 0
      ? clamp01(-rect.top / scrollableDistance)
      : 0;

    // Il titolo si scrive nella prima parte della sequenza
    const titleProgress = mapRange01(progress, 0, 0.12);
    revealSequence(letters, titleProgress, TITLE_WINDOW);

    // Il paragrafo occupa il resto
    const textProgress = mapRange01(progress, 0.16, 1);
    revealSequence(tokens, textProgress, TEXT_WINDOW);
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', update);

  update();

  if (reduceMotion) {
    [...letters, ...tokens].forEach((el) => {
      el.style.opacity = '1';
      el.style.filter = 'none';
      const bg = el.querySelector && el.querySelector('.hl-bg');
      if (bg) bg.style.transform = 'scaleX(1)';
    });
  }

})();
