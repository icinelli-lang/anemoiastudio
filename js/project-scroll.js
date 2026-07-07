/* ============================================================
   ANEMOIA STUDIO — PROJECT SCROLLYTELLING
   Scrollando verticalmente, i progetti scorrono orizzontalmente
   verso sinistra, uno alla volta. La barra di avanzamento e il
   contatore "n/5_" seguono lo stesso progress, in sincro.
   ============================================================ */

(function () {

  const projectPin   = document.getElementById('project-pin');
  const projectTrack = document.getElementById('project-track');
  const progressFill = document.getElementById('project-progress-fill');
  const indexLabel   = document.getElementById('project-index');

  if (!projectPin || !projectTrack) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  const TOTAL = projectTrack.children.length;

  function update() {
    const rect = projectPin.getBoundingClientRect();
    const scrollableDistance = projectPin.offsetHeight - window.innerHeight;
    const progress = scrollableDistance > 0
      ? clamp01(-rect.top / scrollableDistance)
      : 0;

    // Il track trasla verso sinistra: da 0 a -(TOTAL-1) "schermate" di progetto
    projectTrack.style.transform = `translateX(${-progress * (TOTAL - 1) * 100}%)`;

    progressFill.style.width = (progress * 100) + '%';

    const currentIndex = Math.min(TOTAL - 1, Math.round(progress * (TOTAL - 1)));
    indexLabel.textContent = `${currentIndex + 1}/${TOTAL}_`;
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
    projectTrack.style.transition = 'none';
  }

})();
