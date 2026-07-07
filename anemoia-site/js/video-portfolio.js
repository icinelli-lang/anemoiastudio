/* ============================================================
   ANEMOIA STUDIO — VIDEO PORTFOLIO AUTOPLAY
   Il video parte da solo (muto, come richiesto dai browser per
   l'autoplay) appena la sezione entra nello scroll, e si ferma
   quando esce dalla vista.
   ============================================================ */

(function () {

  const video = document.getElementById('portfolio-video');
  if (!video) return;

  // Forziamo muted anche via proprietà JS (non solo attributo HTML):
  // alcuni browser sono più affidabili nel concedere l'autoplay così
  video.muted = true;
  video.playsInline = true;

  function tryPlay() {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Riprova un'unica volta al prossimo frame utile: capita che il
        // primo tentativo fallisca se il video non ha ancora abbastanza
        // dati bufferizzati
        video.addEventListener('canplay', () => {
          video.play().catch(() => {
            // Se blocca comunque, l'utente avvia manualmente dai controlli
          });
        }, { once: true });
      });
    }
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        tryPlay();
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.3, rootMargin: '0px 0px -10% 0px' });

  observer.observe(video);

  // Rete di sicurezza: alcuni browser bloccano comunque l'autoplay
  // programmatico per policy interna, ma consentono sempre la
  // riproduzione dopo una qualsiasi interazione reale dell'utente.
  // Restiamo in ascolto finché il video non parte davvero (non basta
  // che scatti un solo evento: potrebbe capitare mentre il video non
  // è ancora visibile e sarebbe uno spreco del tentativo).
  function retryOnInteraction() {
    const rect = video.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (isVisible && video.paused) {
      tryPlay();
    }
    if (!video.paused) {
      ['click', 'touchstart', 'scroll', 'keydown'].forEach((evt) => {
        window.removeEventListener(evt, retryOnInteraction);
      });
    }
  }
  ['click', 'touchstart', 'scroll', 'keydown'].forEach((evt) => {
    window.addEventListener(evt, retryOnInteraction, { passive: true });
  });

})();
