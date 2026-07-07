/* ============================================================
   ANEMOIA STUDIO — INTRO SCROLLYTELLING
   Un'unica sequenza pinnata, interamente guidata dalla posizione
   di scroll (bidirezionale: scrollare indietro fa tornare indietro
   ogni fase in sincro). Nessun timer, nessun trigger "one-shot":
   ad ogni scroll event ricalcoliamo un progress 0→1 e deriviamo
   lo stato esatto di ogni elemento.

   Fasi (frazioni del progress totale 0→1):
     0.00 → 0.20  logo dal centro verso la navbar; navbar e banda
                  rosa scendono dall'alto
     0.20 → 0.32  la testa compare, scalando da piccola a grande
                  (~65% dell'altezza schermo)
     0.32 → 0.72  rotazione a 360° della testa, un frame per ogni
                  incremento di scroll
     0.72 → 1.00  la testa si riduce leggermente restando centrata;
                  compaiono in sequenza firma, Purpose, Vision, Mission
   ============================================================ */

(function () {

  const introPin   = document.getElementById('intro-pin');
  const gradient   = document.getElementById('intro-bg__gradient');
  const blackOverlay = document.getElementById('intro-bg__black-overlay');
  const introLogo  = document.getElementById('intro-logo');
  const navbar     = document.getElementById('navbar');
  const navbarLogo = document.getElementById('navbar-logo');
  const headCanvas = document.getElementById('head-canvas');
  const calloutName    = document.getElementById('pvm-name');
  const calloutPurpose = document.getElementById('pvm-purpose');
  const calloutVision  = document.getElementById('pvm-vision');
  const calloutMission = document.getElementById('pvm-mission');
  const lineName    = document.getElementById('line-name');
  const linePurpose = document.getElementById('line-purpose');
  const lineVision  = document.getElementById('line-vision');
  const lineMission = document.getElementById('line-mission');

  if (!introPin || !headCanvas) return; // sicurezza se il markup non è quello atteso

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Confini di fase (frazioni di progress 0→1) ----------
  const P1_END = 0.20; // logo → navbar
  const P2_END = 0.32; // testa compare
  const P3_END = 0.72; // rotazione 360°

  // ---------- Utility numeriche ----------
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mapRange01 = (v, inMin, inMax) => clamp01((v - inMin) / (inMax - inMin));

  // ============================================================
  // ROTAZIONE 360° — precaricamento dei 97 frame
  // ============================================================
  const TOTAL_FRAMES = 97;
  const frames = new Array(TOTAL_FRAMES);
  let framesLoadedCount = 0;
  let firstFrameReady = false;

  function frameSrc(i) {
    const idx = String(i).padStart(3, '0');
    return `assets/rotation-frames/frame_${idx}.png`;
  }

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const img = new Image();
    img.onload = () => {
      framesLoadedCount++;
      if (i === 0) {
        firstFrameReady = true;
        sizeCanvasToFrame(img);
        drawFrame(0);
      }
    };
    img.src = frameSrc(i);
    frames[i] = img;
  }

  const ctx = headCanvas.getContext('2d');
  let canvasFrameW = 0, canvasFrameH = 0;
  let lastDrawnIndex = -1;

  function sizeCanvasToFrame(img) {
    canvasFrameW = img.naturalWidth;
    canvasFrameH = img.naturalHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    headCanvas.width = canvasFrameW * dpr;
    headCanvas.height = canvasFrameH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Dimensione a schermo: normalmente l'altezza è il vincolo (85vh),
    // ma su schermi stretti e alti (telefoni) questo la renderebbe più
    // larga dello schermo, causando uno scroll orizzontale indesiderato.
    // Scegliamo quindi il vincolo più restrittivo tra altezza e larghezza,
    // esattamente come object-fit:contain.
    const aspect = canvasFrameW / canvasFrameH;
    const maxHeightPx = window.innerHeight * 0.85;
    const maxWidthPx = window.innerWidth * 0.9;
    let targetHeightPx = maxHeightPx;
    let targetWidthPx = targetHeightPx * aspect;
    if (targetWidthPx > maxWidthPx) {
      targetWidthPx = maxWidthPx;
      targetHeightPx = targetWidthPx / aspect;
    }
    headCanvas.style.height = targetHeightPx + 'px';
    headCanvas.style.width = targetWidthPx + 'px';
  }

  function drawFrame(index) {
    if (!firstFrameReady) return;
    const clampedIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, index));
    if (clampedIndex === lastDrawnIndex) return;
    const img = frames[clampedIndex];
    if (!img || !img.complete || img.naturalWidth === 0) return;
    ctx.clearRect(0, 0, canvasFrameW, canvasFrameH);
    ctx.drawImage(img, 0, 0, canvasFrameW, canvasFrameH);
    lastDrawnIndex = clampedIndex;
  }

  // ============================================================
  // MISURAZIONE POSIZIONI PER IL LOGO (fase 1)
  // ============================================================
  const LOGO_ASPECT = 105 / 501; // altezza/larghezza del logo.svg (viewBox 501x105)

  function getLogoStartRect() {
    const width = Math.min(window.innerWidth * 0.70, 720);
    const height = width * LOGO_ASPECT;
    return {
      width,
      height,
      top: (window.innerHeight - height) / 2,
      left: (window.innerWidth - width) / 2
    };
  }

  // Misura la posizione di riposo del logo in navbar "congelando"
  // temporaneamente il transform (nessuna transition da gestire: la
  // navbar non ha transition CSS, quindi la lettura è già istantanea
  // e sicura, nessun trucco FLIP necessario)
  function getNavbarLogoRestRect() {
    const prevTransform = navbar.style.transform;
    navbar.style.transform = 'translateY(0)';
    const rect = navbarLogo.getBoundingClientRect();
    navbar.style.transform = prevTransform;
    return { width: rect.width, height: rect.height, top: rect.top, left: rect.left };
  }

  let logoStartRect = getLogoStartRect();
  let logoRestRect = getNavbarLogoRestRect();

  // ============================================================
  // AGGIORNAMENTO PRINCIPALE — chiamato ad ogni scroll (via rAF)
  // ============================================================
  function update() {
    const rect = introPin.getBoundingClientRect();
    const scrollableDistance = introPin.offsetHeight - window.innerHeight;
    const progress = scrollableDistance > 0
      ? clamp01(-rect.top / scrollableDistance)
      : 0;

    // ---------- FASE 1: logo → navbar, navbar/banda rosa scendono ----------
    const p1 = mapRange01(progress, 0, P1_END);

    navbar.style.transform = `translateY(${-100 * (1 - p1)}%)`;
    gradient.style.opacity = p1;

    const logoTop   = lerp(logoStartRect.top, logoRestRect.top, p1);
    const logoLeft  = lerp(logoStartRect.left, logoRestRect.left, p1);
    const logoWidth = lerp(logoStartRect.width, logoRestRect.width, p1);
    introLogo.style.top = logoTop + 'px';
    introLogo.style.left = logoLeft + 'px';
    introLogo.style.width = logoWidth + 'px';
    introLogo.style.transform = 'none';

    const introComplete = progress >= P1_END;
    introLogo.style.opacity = introComplete ? '0' : '1';
    navbarLogo.style.opacity = introComplete ? '1' : '0';

    // ---------- FASE 2: la testa compare, grande ----------
    const p2 = mapRange01(progress, P1_END, P2_END);
    const headScale = lerp(0.2, 1, p2);
    headCanvas.style.opacity = String(p2);

    // ---------- FASE 3: rotazione 360° ----------
    const p3 = mapRange01(progress, P2_END, P3_END);
    const frameIndex = Math.round(p3 * (TOTAL_FRAMES - 1));
    drawFrame(frameIndex);

    // Il fondo passa dal gradiente rosa al nero pieno tra la fine
    // della rotazione e l'inizio della sezione Purpose/Vision/Mission
    blackOverlay.style.opacity = String(mapRange01(progress, 0.55, 0.75));

    // ---------- FASE 4: riduzione testa + comparsa testi ----------
    const p4 = mapRange01(progress, P3_END, 1);
    // La testa prima si ingrandisce leggermente (piccolo "rimbalzo"),
    // poi torna alla dimensione attuale (0.65) entro la fine della fase
    let scaleP4;
    if (p4 < 0.2) {
      scaleP4 = lerp(1, 1.12, p4 / 0.2);
    } else {
      scaleP4 = lerp(1.12, 0.65, (p4 - 0.2) / 0.8);
    }
    const finalScale = progress <= P2_END ? headScale : scaleP4;
    headCanvas.style.transform = `translate(-50%, -50%) scale(${finalScale})`;

    const tName    = mapRange01(p4, 0.00, 0.20);
    const tPurpose = mapRange01(p4, 0.15, 0.45);
    const tVision  = mapRange01(p4, 0.40, 0.70);
    const tMission = mapRange01(p4, 0.65, 1.00);

    setCallout(calloutName,    tName,    'up');
    setCallout(calloutPurpose, tPurpose, 'left');
    setCallout(calloutVision,  tVision,  'left');
    setCallout(calloutMission, tMission, 'right');

    drawConnectorLine(lineName,    calloutName,    ANCHORS.name,    tName);
    drawConnectorLine(linePurpose, calloutPurpose, ANCHORS.purpose, tPurpose);
    drawConnectorLine(lineVision,  calloutVision,  ANCHORS.vision,  tVision);
    drawConnectorLine(lineMission, calloutMission, ANCHORS.mission, tMission);
  }

  function setCallout(el, t, direction) {
    // Il testo compare "in coda" alla linea: la linea disegna per prima
    // (0 → 0.6 di t), il box sfuma in vista nella seconda parte (0.4 → 1)
    const boxT = mapRange01(t, 0.4, 1);
    el.style.opacity = String(boxT);
    let translate = '';
    if (direction === 'left')  translate = `translateX(${lerp(-16, 0, boxT)}px)`;
    if (direction === 'right') translate = `translateX(${lerp(16, 0, boxT)}px)`;
    if (direction === 'up')    translate = `translateY(${lerp(-10, 0, boxT)}px)`;
    el.style.transform = translate;
  }

  // Punti di ancoraggio sul volto, espressi come frazione (0-1) della
  // larghezza/altezza correnti del canvas della testa (così restano
  // corretti anche quando la testa si ingrandisce/rimpicciolisce)
  const ANCHORS = {
    name:    { fx: 0.62, fy: 0.30 }, // ciuffo in alto
    purpose: { fx: 0.36, fy: 0.55 }, // occhio sinistro
    vision:  { fx: 0.46, fy: 0.75 }, // bocca
    mission: { fx: 0.64, fy: 0.55 }  // occhio destro
  };

  function drawConnectorLine(lineEl, calloutEl, anchor, t) {
    const headRect = headCanvas.getBoundingClientRect();
    const boxRect = calloutEl.getBoundingClientRect();

    const ax = headRect.left + headRect.width * anchor.fx;
    const ay = headRect.top + headRect.height * anchor.fy;

    // Punto di attacco sul box: il bordo rivolto verso la testa
    const boxIsOnLeft = boxRect.left + boxRect.width / 2 < ax;
    const bx = boxIsOnLeft ? boxRect.right : boxRect.left;
    const by = boxRect.top + boxRect.height / 2;

    lineEl.setAttribute('x1', ax);
    lineEl.setAttribute('y1', ay);
    // La linea si "disegna" progressivamente dall'ancora verso il box
    const drawT = mapRange01(t, 0, 0.6);
    lineEl.setAttribute('x2', lerp(ax, bx, drawT));
    lineEl.setAttribute('y2', lerp(ay, by, drawT));
    lineEl.style.opacity = t > 0 ? '1' : '0';
  }

  // ============================================================
  // EVENTI: scroll (throttled via rAF) + resize (ricalcola le misure)
  // ============================================================
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

  function onResize() {
    logoStartRect = getLogoStartRect();
    logoRestRect = getNavbarLogoRestRect();
    if (firstFrameReady) {
      sizeCanvasToFrame(frames[0]);
      lastDrawnIndex = -1; // forza il ridisegno al prossimo frame utile
    }
    update();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  // Stato iniziale (progress 0) applicato subito, senza aspettare
  // il primo scroll: mostra logo centrato su nero, come da schermata
  // "logo al centro" richiesta.
  update();

  // Se il visitatore ha impostato "riduci animazioni", saltiamo
  // direttamente allo stato finale della sequenza intro
  if (reduceMotion) {
    window.scrollTo(0, introPin.offsetHeight - window.innerHeight);
    update();
  }

})();
