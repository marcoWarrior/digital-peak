// ─────────────────────────────────────────────────────────────────────────
//  design-d.js — Digital Peak · Versione D "PEAK RUN"
//  Regia spaziale 3D, fisica di surf sulle onde, HUD telemetrico,
//  transizioni cinematografiche tra le 8 Zone, micro-gioco Peak Run
//  e integrazione nativa con i18n (IT/EN/ES) e POST /api/contact.
// ─────────────────────────────────────────────────────────────────────────
(function (global, doc) {
  'use strict';

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpVec3(out, a, b, t) {
    out[0] = a[0] + (b[0] - a[0]) * t;
    out[1] = a[1] + (b[1] - a[1]) * t;
    out[2] = a[2] + (b[2] - a[2]) * t;
    return out;
  }

  // ── Dizionari HUD specifici Versione D (IT / EN / ES) ──
  const HUD_I18N = {
    it: {
      d_hud_depth: 'PROFONDITÀ',
      d_hud_speed: 'VELOCITÀ',
      d_hud_score: 'PIPELINE SCORE',
      d_hud_combo: 'MOLTIPLICATORE',
      d_hud_nodes: 'NODI DATI',
      d_btn_play: '⚡ PEAK RUN [GIOCA]',
      d_btn_stop: '✕ ESCI DA PEAK RUN',
      d_btn_audio_off: '🔇 AUDIO OFF',
      d_btn_audio_on: '🔊 AUDIO ON',
      d_hint_controls: 'SCROLL / W-S per surfare in profondità · MOUSE / A-D per guidare la tavola tra i Data Nodes',
      d_prev_zone: '◀ ZONA PREC.',
      d_next_zone: 'ZONA SUCC. ▶',
      d_surf_cta: 'INIZIA A SURFARE ↓',
      d_play_cta: '⚡ GIOCA PEAK RUN',
      d_warp_peak: 'VAI ALLA VETTA →',
      d_run_banner_title: 'PEAK RUN ATTIVO — GUIDA IL FLUSSO FINO ALLA VETTA (2480m)',
      d_run_banner_sub: 'Muovi il cursore o premi A / D / ← / → per raccogliere i Data Nodes azzurri ed evitare i Silos rossi',
      d_run_zone_kicker: '007 // MICRO-INTERAZIONE GIOCABILE',
      d_run_zone_title: 'THE PEAK RUN <span class="d-accent">SLALOM</span>',
      d_run_zone_desc: 'Guida la tavola energetica tra i nodi dati ad alto intento (ICP, SQL, Agentic AI, CRO) ed evita le frizioni di mercato (Silos, Budget Waste) nel canale ad alta velocità.',
      d_run_launch_btn: '⚡ AVVIA SFIDA PEAK RUN ORA',
      d_run_skip_btn: 'PROSEGUI VERSO THE PEAK →',
      d_victory_kicker: 'VETTA RAGGIUNTA · 2480m // GROWTH WITHOUT LIMITS',
      d_victory_title: 'PEAK RUN COMPLETATA!',
      d_victory_cta: 'FISSA LA TUA CALL STRATEGICA →',
      d_victory_replay: '↻ RIGIOCA PEAK RUN',
      d_back_ocean: '← TORNA ALL\'OCEANO 3D (PEAK RUN)',
      d_inner_hud: 'MODALITÀ DOSSIER SPAZIALE 3D · MUOVI IL CURSORE PER L\'ONDA LIQUIDA'
    },
    en: {
      d_hud_depth: 'DEPTH',
      d_hud_speed: 'SPEED',
      d_hud_score: 'PIPELINE SCORE',
      d_hud_combo: 'MULTIPLIER',
      d_hud_nodes: 'DATA NODES',
      d_btn_play: '⚡ PEAK RUN [PLAY]',
      d_btn_stop: '✕ EXIT PEAK RUN',
      d_btn_audio_off: '🔇 AUDIO OFF',
      d_btn_audio_on: '🔊 AUDIO ON',
      d_hint_controls: 'SCROLL / W-S to surf in depth · MOUSE / A-D to carve the energy board through Data Nodes',
      d_prev_zone: '◀ PREV ZONE',
      d_next_zone: 'NEXT ZONE ▶',
      d_surf_cta: 'START SURFING ↓',
      d_play_cta: '⚡ PLAY PEAK RUN',
      d_warp_peak: 'WARP TO THE PEAK →',
      d_run_banner_title: 'PEAK RUN ACTIVE — RIDE THE STREAM TO THE SUMMIT (2480m)',
      d_run_banner_sub: 'Move your cursor or press A / D / ← / → to collect cyan Data Nodes and dodge red Market Silos',
      d_run_zone_kicker: '007 // PLAYABLE MICRO-INTERACTION',
      d_run_zone_title: 'THE PEAK RUN <span class="d-accent">SLALOM</span>',
      d_run_zone_desc: 'Steer the energy board through high-intent data nodes (ICP, SQL, Agentic AI, CRO) and dodge market friction (Silos, Budget Waste) in the high-speed channel.',
      d_run_launch_btn: '⚡ LAUNCH PEAK RUN CHALLENGE',
      d_run_skip_btn: 'CONTINUE TO THE PEAK →',
      d_victory_kicker: 'SUMMIT REACHED · 2480m // GROWTH WITHOUT LIMITS',
      d_victory_title: 'PEAK RUN COMPLETED!',
      d_victory_cta: 'BOOK YOUR STRATEGY CALL →',
      d_victory_replay: '↻ REPLAY PEAK RUN',
      d_back_ocean: '← BACK TO 3D OCEAN (PEAK RUN)',
      d_inner_hud: '3D SPATIAL DOSSIER MODE · MOVE CURSOR FOR LIQUID WAVE DISTORTION'
    },
    es: {
      d_hud_depth: 'PROFUNDIDAD',
      d_hud_speed: 'VELOCIDAD',
      d_hud_score: 'PIPELINE SCORE',
      d_hud_combo: 'MULTIPLICADOR',
      d_hud_nodes: 'NODOS DE DATOS',
      d_btn_play: '⚡ PEAK RUN [JUGAR]',
      d_btn_stop: '✕ SALIR DE PEAK RUN',
      d_btn_audio_off: '🔇 AUDIO OFF',
      d_btn_audio_on: '🔊 AUDIO ON',
      d_hint_controls: 'SCROLL / W-S para surfear en profundidad · RATÓN / A-D para guiar la tabla entre Data Nodes',
      d_prev_zone: '◀ ZONA ANT.',
      d_next_zone: 'SIG. ZONA ▶',
      d_surf_cta: 'EMPEZAR A SURFEAR ↓',
      d_play_cta: '⚡ JUGAR PEAK RUN',
      d_warp_peak: 'IR A LA CIMA →',
      d_run_banner_title: 'PEAK RUN ACTIVO — GUÍA EL FLUJO HASTA LA CIMA (2480m)',
      d_run_banner_sub: 'Mueve el cursor o pulsa A / D / ← / → para recoger Data Nodes cian y esquivar Silos rojos',
      d_run_zone_kicker: '007 // MICRO-INTERACCIÓN JUGABLE',
      d_run_zone_title: 'THE PEAK RUN <span class="d-accent">SLALOM</span>',
      d_run_zone_desc: 'Guía la tabla energética entre nodos de datos de alta intención (ICP, SQL, Agentic AI, CRO) y esquiva las fricciones de mercado (Silos, Budget Waste).',
      d_run_launch_btn: '⚡ INICIAR DESAFÍO PEAK RUN',
      d_run_skip_btn: 'CONTINUAR HACIA THE PEAK →',
      d_victory_kicker: 'CIMA ALCANZADA · 2480m // GROWTH WITHOUT LIMITS',
      d_victory_title: '¡PEAK RUN COMPLETADO!',
      d_victory_cta: 'RESERVA TU SESIÓN ESTRATÉGICA →',
      d_victory_replay: '↻ JUGAR DE NUEVO',
      d_back_ocean: '← VOLVER AL OCÉANO 3D (PEAK RUN)',
      d_inner_hud: 'MODO DOSSIER ESPACIAL 3D · MUEVE EL CURSOR PARA ONDA LÍQUIDA'
    }
  };

  // ── Le 8 Zone Spaziali lungo il canale oceanico (0m -> 2520m) ──
  const ZONES = [
    {
      idx: 0,
      id: 'shoreline',
      code: '01',
      name: 'SHORELINE LAUNCH',
      short: 'LAUNCH',
      z: 0,
      shaderType: 0,
      shaderZ: 0,
      palette: {
        skyTop: [0.035, 0.012, 0.095],
        skyMid: [0.22, 0.045, 0.29],
        skyHor: [0.95, 0.22, 0.48],
        sunA: [1.0, 0.82, 0.18],
        sunB: [1.0, 0.16, 0.52],
        neonA: [0.0, 0.94, 1.0],
        neonB: [1.0, 0.18, 0.56],
        water: [0.03, 0.05, 0.13],
        grid: 0.65,
        stream: 0.85,
        clouds: 0.85
      }
    },
    {
      idx: 1,
      id: 'signal-tower',
      code: '02',
      name: 'SIGNAL TOWER',
      short: 'STRATEGY & DNA',
      z: 340,
      shaderType: 1,
      shaderZ: 310,
      palette: {
        skyTop: [0.04, 0.015, 0.11],
        skyMid: [0.28, 0.06, 0.26],
        skyHor: [1.0, 0.36, 0.25],
        sunA: [1.0, 0.88, 0.30],
        sunB: [1.0, 0.25, 0.35],
        neonA: [0.0, 0.92, 1.0],
        neonB: [1.0, 0.55, 0.12],
        water: [0.04, 0.04, 0.12],
        grid: 0.72,
        stream: 0.9,
        clouds: 0.75
      }
    },
    {
      idx: 2,
      id: 'lead-engine',
      code: '03',
      name: 'LEAD ENGINE',
      short: 'LEAD GEN B2B',
      z: 680,
      shaderType: 2,
      shaderZ: 650,
      palette: {
        skyTop: [0.02, 0.02, 0.10],
        skyMid: [0.16, 0.05, 0.32],
        skyHor: [0.92, 0.16, 0.56],
        sunA: [0.4, 0.98, 1.0],
        sunB: [1.0, 0.14, 0.58],
        neonA: [0.0, 0.96, 1.0],
        neonB: [1.0, 0.16, 0.58],
        water: [0.02, 0.06, 0.15],
        grid: 0.88,
        stream: 1.0,
        clouds: 0.65
      }
    },
    {
      idx: 3,
      id: 'commerce-district',
      code: '04',
      name: 'B2B COMMERCE DISTRICT',
      short: 'ECOMMERCE & CRO',
      z: 1020,
      shaderType: 3,
      shaderZ: 990,
      palette: {
        skyTop: [0.05, 0.015, 0.09],
        skyMid: [0.32, 0.08, 0.22],
        skyHor: [1.0, 0.45, 0.18],
        sunA: [1.0, 0.90, 0.32],
        sunB: [1.0, 0.32, 0.16],
        neonA: [1.0, 0.72, 0.12],
        neonB: [0.0, 0.92, 1.0],
        water: [0.05, 0.04, 0.10],
        grid: 0.78,
        stream: 0.9,
        clouds: 0.8
      }
    },
    {
      idx: 4,
      id: 'ai-harbor',
      code: '05',
      name: 'AI HARBOR',
      short: 'AGENTIC AI',
      z: 1360,
      shaderType: 4,
      shaderZ: 1320,
      palette: {
        skyTop: [0.015, 0.02, 0.09],
        skyMid: [0.12, 0.04, 0.30],
        skyHor: [0.58, 0.18, 0.85],
        sunA: [0.0, 0.96, 1.0],
        sunB: [0.68, 0.24, 1.0],
        neonA: [0.0, 0.98, 1.0],
        neonB: [0.68, 0.32, 1.0],
        water: [0.02, 0.05, 0.14],
        grid: 0.92,
        stream: 1.0,
        clouds: 0.55
      }
    },
    {
      idx: 5,
      id: 'code-foundry',
      code: '06',
      name: 'AUTOMATION & FOUNDRY',
      short: 'AUTOMATION & WEB',
      z: 1700,
      shaderType: 5,
      shaderZ: 1660,
      palette: {
        skyTop: [0.03, 0.015, 0.10],
        skyMid: [0.24, 0.05, 0.28],
        skyHor: [0.96, 0.25, 0.45],
        sunA: [1.0, 0.80, 0.22],
        sunB: [0.95, 0.18, 0.55],
        neonA: [0.0, 0.94, 1.0],
        neonB: [1.0, 0.24, 0.58],
        water: [0.03, 0.05, 0.13],
        grid: 0.85,
        stream: 0.95,
        clouds: 0.7
      }
    },
    {
      idx: 6,
      id: 'peak-run',
      code: '07',
      name: 'THE PEAK RUN',
      short: 'PLAYABLE RUN',
      z: 2040,
      shaderType: 6,
      shaderZ: 1920,
      palette: {
        skyTop: [0.04, 0.01, 0.11],
        skyMid: [0.30, 0.04, 0.32],
        skyHor: [1.0, 0.18, 0.52],
        sunA: [1.0, 0.88, 0.25],
        sunB: [1.0, 0.12, 0.52],
        neonA: [0.0, 0.98, 1.0],
        neonB: [1.0, 0.18, 0.55],
        water: [0.03, 0.04, 0.14],
        grid: 1.0,
        stream: 1.2,
        clouds: 0.65
      }
    },
    {
      idx: 7,
      id: 'the-peak',
      code: '08',
      name: 'THE PEAK // SUMMIT',
      short: 'THE PEAK',
      z: 2480,
      shaderType: 7,
      shaderZ: 2440,
      palette: {
        skyTop: [0.04, 0.02, 0.12],
        skyMid: [0.28, 0.08, 0.30],
        skyHor: [1.0, 0.42, 0.28],
        sunA: [1.0, 0.92, 0.42],
        sunB: [1.0, 0.24, 0.48],
        neonA: [0.0, 0.96, 1.0],
        neonB: [1.0, 0.76, 0.20],
        water: [0.04, 0.05, 0.14],
        grid: 0.85,
        stream: 1.0,
        clouds: 0.85
      }
    }
  ];

  const MAX_Z = 2500;

  let initialized = false;
  let running = false;
  let rafId = 0;
  let world = null;
  let surf = null;
  let audio = null;
  let isHomePage = false;

  // Stato camera e fisica di navigazione
  const camState = {
    z: 0,
    targetZ: 0,
    velZ: 0,
    mouseX: 0.5,
    mouseY: 0.5,
    smoothMouseX: 0.5,
    smoothMouseY: 0.5,
    mouseVelX: 0,
    mouseVelY: 0,
    flash: 0,
    flashCol: [0, 0.94, 1],
    glitch: 0,
    bars: 0,
    targetBars: 0,
    warpActive: false,
    ripple: [0.5, 0.5, 10, 0],
    clickWorld: [0, 0, 10, 0],
    hoverWorld: [0, 0, 0, 0],
    keys: { up: false, down: false, left: false, right: false }
  };

  let originalFormParent = null;
  let originalFormNext = null;

  function getLang() {
    return (global.DPI18n && global.DPI18n.getLang()) || doc.documentElement.lang || localStorage.getItem('dp_lang') || 'it';
  }

  function applyHudStrings() {
    const lang = getLang();
    const dict = HUD_I18N[lang] || HUD_I18N.it;
    doc.querySelectorAll('[data-d-i18n]').forEach((el) => {
      const k = el.getAttribute('data-d-i18n');
      if (k && dict[k]) {
        el.innerHTML = dict[k];
      }
    });
    const audioBtn = doc.getElementById('dpAudioToggle');
    if (audioBtn) {
      audioBtn.innerHTML = (audio && audio.enabled) ? dict.d_btn_audio_on : dict.d_btn_audio_off;
    }
    const playBtn = doc.getElementById('dpPlayToggle');
    if (playBtn && surf) {
      playBtn.innerHTML = surf.gameActive ? dict.d_btn_stop : dict.d_btn_play;
    }
  }

  function getZoneIndexAt(z) {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < ZONES.length; i++) {
      const d = Math.abs(z - ZONES[i].z);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  function interpolatePalette(z, out) {
    let i = 0;
    while (i < ZONES.length - 2 && z > ZONES[i + 1].z) i++;
    const a = ZONES[i];
    const b = ZONES[i + 1];
    const t = clamp((z - a.z) / Math.max(1, b.z - a.z), 0, 1);
    const s = t * t * (3 - 2 * t);

    lerpVec3(out.skyTop, a.palette.skyTop, b.palette.skyTop, s);
    lerpVec3(out.skyMid, a.palette.skyMid, b.palette.skyMid, s);
    lerpVec3(out.skyHor, a.palette.skyHor, b.palette.skyHor, s);
    lerpVec3(out.sunA, a.palette.sunA, b.palette.sunA, s);
    lerpVec3(out.sunB, a.palette.sunB, b.palette.sunB, s);
    lerpVec3(out.neonA, a.palette.neonA, b.palette.neonA, s);
    lerpVec3(out.neonB, a.palette.neonB, b.palette.neonB, s);
    lerpVec3(out.water, a.palette.water, b.palette.water, s);
    out.grid = lerp(a.palette.grid, b.palette.grid, s);
    out.stream = lerp(a.palette.stream, b.palette.stream, s);
    out.clouds = lerp(a.palette.clouds, b.palette.clouds, s);
    return { a, b };
  }

  function warpToZone(idx, startPlayMode) {
    const zObj = ZONES[clamp(idx, 0, ZONES.length - 1)];
    if (!zObj) return;
    camState.targetZ = zObj.z;
    camState.warpActive = true;
    camState.targetBars = 0.72;
    camState.flash = 0.22;
    camState.flashCol = [0, 0.94, 1];
    if (audio) audio.playWarp();
    setTimeout(() => {
      camState.targetBars = surf && surf.gameActive ? 0.45 : 0;
      camState.warpActive = false;
    }, 650);

    if (startPlayMode && surf) {
      startPeakRun(zObj.z);
    }
  }

  function startPeakRun(customStartZ) {
    if (!surf) return;
    const startZ = typeof customStartZ === 'number'
      ? customStartZ
      : (camState.z > 2250 ? 60 : Math.max(60, camState.z));
    camState.z = startZ;
    camState.targetZ = startZ;
    surf.resetRun(startZ);
    camState.targetBars = 0.42;
    camState.flash = 0.35;
    camState.flashCol = [0, 0.95, 1];
    if (audio) audio.playGate();
    const root = doc.getElementById('dpExperienceRoot');
    if (root) root.setAttribute('data-game-mode', 'active');
    const modal = doc.getElementById('dpVictoryModal');
    if (modal) modal.classList.remove('open');
    applyHudStrings();
  }

  function stopPeakRun() {
    if (!surf) return;
    surf.stopRun();
    camState.targetBars = 0;
    const root = doc.getElementById('dpExperienceRoot');
    if (root) root.removeAttribute('data-game-mode');
    applyHudStrings();
  }

  // ── Costruzione Stage Olografici 3D per la Homepage ──
  function buildHomeExperience() {
    if (doc.getElementById('dpExperienceRoot')) return;

    const root = doc.createElement('div');
    root.id = 'dpExperienceRoot';
    root.className = 'dp-exp-root';

    root.innerHTML = `
      <canvas id="dpWorldCanvas" class="dp-world-canvas" aria-hidden="true"></canvas>
      <canvas id="dpSurfCanvas" class="dp-surf-canvas" aria-hidden="true"></canvas>

      <!-- BANNER MODALITÀ GIOCO PEAK RUN -->
      <div class="dp-run-banner" id="dpRunBanner" role="status" aria-live="polite">
        <div class="dp-run-banner-inner">
          <div class="dp-run-banner-copy">
            <strong data-d-i18n="d_run_banner_title">PEAK RUN ATTIVO — GUIDA IL FLUSSO FINO ALLA VETTA (2480m)</strong>
            <span data-d-i18n="d_run_banner_sub">Muovi il cursore o premi A / D / ← / → per raccogliere i Data Nodes azzurri ed evitare i Silos rossi</span>
          </div>
          <button type="button" class="dp-hud-btn dp-hud-btn-danger" id="dpRunBannerStop" data-d-i18n="d_btn_stop">✕ ESCI DA PEAK RUN</button>
        </div>
      </div>

      <!-- HUD TELEMETRICO SUPERIORE -->
      <aside class="dp-hud-top" aria-label="Telemetry HUD">
        <div class="dp-telemetry-cluster">
          <div class="dp-tele-item">
            <span class="dp-tele-label" data-d-i18n="d_hud_depth">PROFONDITÀ</span>
            <strong class="dp-tele-val" id="dpTeleDepth">0000m / 2500m</strong>
          </div>
          <div class="dp-tele-item">
            <span class="dp-tele-label" data-d-i18n="d_hud_speed">VELOCITÀ</span>
            <strong class="dp-tele-val" id="dpTeleSpeed">18.0 KTS</strong>
          </div>
          <div class="dp-tele-zone" id="dpTeleZoneBadge">ZONE 01 // SHORELINE LAUNCH</div>
        </div>

        <div class="dp-hud-controls">
          <button type="button" class="dp-hud-btn dp-hud-btn-play" id="dpPlayToggle" data-d-i18n="d_btn_play">⚡ PEAK RUN [GIOCA]</button>
          <button type="button" class="dp-hud-btn dp-hud-btn-audio" id="dpAudioToggle" data-d-i18n="d_btn_audio_off">🔇 AUDIO OFF</button>
        </div>
      </aside>

      <!-- RADAR SPAZIALE LATERALE (WARP NON LINEARE) -->
      <nav class="dp-zone-rail" id="dpZoneRail" aria-label="Spatial Zone Navigator">
        ${ZONES.map((z, i) => `
          <button type="button" class="dp-rail-node ${i === 0 ? 'active' : ''}" data-zone-idx="${i}" aria-label="${z.code} ${z.name}">
            <span class="dp-rail-code">${z.code}</span>
            <span class="dp-rail-dot"></span>
            <span class="dp-rail-label">${z.short}</span>
          </button>
        `).join('')}
      </nav>

      <!-- VIEWPORT 3D DEGLI STAGE OLOGRAFICI -->
      <main class="dp-stage-viewport" id="dpStageViewport">

        <!-- ZONA 01: SHORELINE LAUNCH (HERO) -->
        <section class="dp-stage is-active" data-stage-idx="0">
          <div class="dp-holo-card dp-holo-hero">
            <div class="dp-holo-meta">
              <span class="dp-zone-tag">ZONE 01 // 0000m · SHORELINE LAUNCH</span>
              <span class="dp-eyebrow" data-i18n="hero_eyebrow">001 — L'onda perfetta</span>
            </div>
            <h1 class="dp-hero-title" data-i18n="hero_title">Cavalca l'onda del<br><span class="accent">cambiamento</span></h1>
            <p class="dp-hero-sub" data-i18n="hero_sub">Strategia, tecnologia e azione per aziende che vogliono dominare il mercato e scalare senza rallentare.</p>

            <div class="dp-pillars-strip">
              <div class="dp-pillar-chip"><span class="dp-p-num">01</span><span data-i18n="method_1_title">Studio</span></div>
              <div class="dp-pillar-chip"><span class="dp-p-num">02</span><span data-i18n="method_2_title">Preparazione</span></div>
              <div class="dp-pillar-chip"><span class="dp-p-num">03</span><span data-i18n="method_3_title">Azione</span></div>
            </div>

            <div class="dp-stage-actions">
              <button type="button" class="dp-btn-neon" data-warp-idx="1" data-d-i18n="d_surf_cta">INIZIA A SURFARE ↓</button>
              <button type="button" class="dp-btn-play-hero" id="dpHeroPlayBtn" data-d-i18n="d_play_cta">⚡ GIOCA PEAK RUN</button>
              <button type="button" class="dp-btn-ghost" data-warp-idx="7" data-i18n="nav_cta">Inizia ora</button>
            </div>
          </div>
        </section>

        <!-- ZONA 02: SIGNAL TOWER (CHI SIAMO & METODO + MARKETING STRATEGY) -->
        <section class="dp-stage" data-stage-idx="1">
          <div class="dp-holo-grid-2">
            <div class="dp-holo-card">
              <div class="dp-holo-meta">
                <span class="dp-zone-tag">ZONE 02 // 0340m · SIGNAL TOWER</span>
                <span class="dp-eyebrow" data-i18n="about_eye"><span class="eye-num">002</span> Chi Siamo</span>
              </div>
              <h2 class="dp-stage-title" data-i18n="about_title">Da oltre 15 anni lavoriamo nel <span class="cy">B2B</span></h2>
              <p class="dp-stage-desc" data-i18n="about_p">Siamo specialisti nell'analisi della parte bassa del funnel. Non ci interessano i numeri che fanno solo scena: creiamo valore concentrandoci in modo ossessivo sulle azioni che impattano realmente il tuo business in termini di conversione e lead generation.</p>

              <div class="dp-method-mini">
                <div class="dp-m-item">
                  <strong>01 · <span data-i18n="method_1_title">Studio</span></strong>
                  <p data-i18n="method_1_text">Leggiamo le correnti prima di entrare in acqua. Analizziamo il mercato, identifichiamo i cluster di acquisto ad alta resa e definiamo un posizionamento inattaccabile.</p>
                </div>
                <div class="dp-m-item">
                  <strong>02 · <span data-i18n="method_2_title">Preparazione</span></strong>
                  <p data-i18n="method_2_text">Costruiamo l'infrastruttura tecnologica. Integriamo CRM, marketing automation e sistemi di tracciamento affinché nessun dato e nessuna opportunità vengano dispersi.</p>
                </div>
                <div class="dp-m-item">
                  <strong>03 · <span data-i18n="method_3_title">Azione</span></strong>
                  <p data-i18n="method_3_text">Cavalchiamo l'onda. Attiviamo strategie di acquisizione mirate e ottimizziamo i tassi di conversione in modo continuo, con un focus ossessivo sull'esecuzione.</p>
                </div>
              </div>
            </div>

            <div class="dp-holo-card dp-holo-service">
              <div class="dp-holo-meta">
                <span class="dp-zone-tag">AREA 05 // CONSULENZA DIREZIONALE</span>
              </div>
              <h3 class="dp-svc-heading" data-i18n="s5_heading">MARKETING <br><span class="og-title-outline">STRATEGY</span></h3>
              <h4 class="dp-svc-sub" data-i18n="s5_title">Consulenza Direzionale</h4>
              <p class="dp-stage-desc" data-i18n="s5_desc">La strategia digitale che unisce tutti i canali e le automazioni in un sistema di crescita coerente e misurabile. Definiamo le metriche da scalare e l'architettura dei canali.</p>
              <div class="dp-stage-actions">
                <a href="pages/strategia-marketing.html" class="dp-btn-neon" data-i18n="s_discover">Scopri il servizio <span>→</span></a>
                <button type="button" class="dp-btn-ghost" data-warp-idx="2">LEAD ENGINE →</button>
              </div>
            </div>
          </div>
        </section>

        <!-- ZONA 03: LEAD ENGINE (LEAD GENERATION B2B) -->
        <section class="dp-stage" data-stage-idx="2">
          <div class="dp-holo-card dp-holo-featured">
            <div class="dp-holo-meta">
              <span class="dp-zone-tag">ZONE 03 // 0680m · LEAD ENGINE</span>
              <span class="dp-eyebrow">AREA 01 · ICP &amp; INTENT PIPELINE</span>
            </div>
            <div class="dp-featured-split">
              <div>
                <h2 class="dp-svc-heading-lg" data-i18n="s1_heading">LEAD <br><span class="og-title-outline">GENERATION</span></h2>
                <h3 class="dp-svc-sub" data-i18n="s1_title">Acquisizione B2B</h3>
                <p class="dp-stage-desc" data-i18n="s1_desc">Costruiamo sistemi prevedibili che ti portano contatti qualificati. Intercettiamo chi ha già bisogno del tuo prodotto e risvegliamo l'interesse di chi non ti conosce, azzerando la dispersione di budget.</p>
                <div class="dp-stage-actions">
                  <a href="pages/lead-generation.html" class="dp-btn-neon" data-i18n="s_discover">Scopri il servizio <span>→</span></a>
                  <button type="button" class="dp-btn-ghost" data-warp-idx="3">B2B COMMERCE →</button>
                </div>
              </div>
              <div class="dp-holo-metrics">
                <div class="dp-metric-box">
                  <span class="dp-m-code">MODULE // 01</span>
                  <strong>LinkedIn + Google Intent</strong>
                  <span>Outreach ABM sincronizzato con Search ad alto intento d'acquisto</span>
                </div>
                <div class="dp-metric-box">
                  <span class="dp-m-code">MODULE // 02</span>
                  <strong>Lead Scoring &amp; SQL Routing</strong>
                  <span>Qualifica firmografica e comportamentale connessa al CRM</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ZONA 04: B2B COMMERCE DISTRICT (ECOMMERCE B2B & CRO) -->
        <section class="dp-stage" data-stage-idx="3">
          <div class="dp-holo-card dp-holo-featured">
            <div class="dp-holo-meta">
              <span class="dp-zone-tag">ZONE 04 // 1020m · B2B COMMERCE DISTRICT</span>
              <span class="dp-eyebrow">AREA 02 · TRANSACTION VELOCITY</span>
            </div>
            <div class="dp-featured-split">
              <div>
                <h2 class="dp-svc-heading-lg" data-i18n="s2_heading"><span class="og-title-outline">ECOMMERCE</span><br>B2B</h2>
                <h3 class="dp-svc-sub" data-i18n="s2_title">Ottimizzazione Conversioni</h3>
                <p class="dp-stage-desc" data-i18n="s2_desc">Miglioramento netto della conversione nel mondo eCommerce. Rimuoviamo ogni ostacolo all'acquisto, ottimizzando l'esperienza dell'utente per massimizzare il volume delle transazioni.</p>
                <div class="dp-stage-actions">
                  <a href="pages/ecommerce-cro.html" class="dp-btn-neon" data-i18n="s_discover">Scopri il servizio <span>→</span></a>
                  <button type="button" class="dp-btn-ghost" data-warp-idx="4">AI HARBOR →</button>
                </div>
              </div>
              <div class="dp-holo-metrics">
                <div class="dp-metric-box">
                  <span class="dp-m-code">CRO // 01</span>
                  <strong>Dynamic B2B Tiering &amp; CRM</strong>
                  <span>Listini dedicati, riordino predittivo e upselling automatizzato</span>
                </div>
                <div class="dp-metric-box">
                  <span class="dp-m-code">CRO // 02</span>
                  <strong>Frictionless Checkout Architecture</strong>
                  <span>Audit heatmap, A/B testing continuo e flussi di preventivo rapidi</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ZONA 05: AI HARBOR (AGENTIC AI) -->
        <section class="dp-stage" data-stage-idx="4">
          <div class="dp-holo-card dp-holo-featured">
            <div class="dp-holo-meta">
              <span class="dp-zone-tag">ZONE 05 // 1360m · AI HARBOR</span>
              <span class="dp-eyebrow">AREA 03 · AUTONOMOUS NEURAL SYSTEMS</span>
            </div>
            <div class="dp-featured-split">
              <div>
                <h2 class="dp-svc-heading-lg" data-i18n="s3_heading">AGENTIC <br><span class="og-title-outline">AI</span></h2>
                <h3 class="dp-svc-sub" data-i18n="s3_title">Agenti su Misura</h3>
                <p class="dp-stage-desc" data-i18n="s3_desc">La soluzione AI giusta per il tuo business: analizziamo i processi, individuiamo dove l'AI genera impatto e costruiamo agenti su misura, senza soluzioni preconfezionate.</p>
                <div class="dp-stage-actions">
                  <a href="pages/agentic-ai.html" class="dp-btn-neon" data-i18n="s_discover">Scopri il servizio <span>→</span></a>
                  <button type="button" class="dp-btn-ghost" data-warp-idx="5">CODE FOUNDRY →</button>
                </div>
              </div>
              <div class="dp-holo-metrics">
                <div class="dp-metric-box">
                  <span class="dp-m-code">NEURAL // 01</span>
                  <strong>AI Audit &amp; Custom Sales Agents</strong>
                  <span>Prospecting autonomo, qualifica real-time e competitive intelligence</span>
                </div>
                <div class="dp-metric-box">
                  <span class="dp-m-code">NEURAL // 02</span>
                  <strong>Human-in-the-Loop Governance</strong>
                  <span>Integrazione nativa HubSpot / Salesforce con KPI misurabili e AI Act compliance</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ZONA 06: AUTOMATION NEXUS & CODE FOUNDRY (MARKETING AUTOMATION + SITI & APP WEB) -->
        <section class="dp-stage" data-stage-idx="5">
          <div class="dp-holo-grid-2">
            <div class="dp-holo-card dp-holo-service">
              <div class="dp-holo-meta">
                <span class="dp-zone-tag">ZONE 06A // 1700m · AUTOMATION NEXUS</span>
              </div>
              <h3 class="dp-svc-heading" data-i18n="s4_heading"><span class="og-title-outline">MARKETING</span><br>AUTOMATION</h3>
              <h4 class="dp-svc-sub" data-i18n="s4_title">Integrazione di Sistema</h4>
              <p class="dp-stage-desc" data-i18n="s4_desc">Eliminiamo i silos tra social, ads, web, database e CRM. Le stesse automazioni che accelerano la lead generation B2B scalano anche nell'eCommerce: una sola infrastruttura, molti contesti.</p>
              <div class="dp-stage-actions">
                <a href="pages/marketing-automation.html" class="dp-btn-neon" data-i18n="s_discover">Scopri il servizio <span>→</span></a>
              </div>
            </div>

            <div class="dp-holo-card dp-holo-service">
              <div class="dp-holo-meta">
                <span class="dp-zone-tag">ZONE 06B // 1700m · CODE FOUNDRY</span>
              </div>
              <h3 class="dp-svc-heading" data-i18n="s6_heading"><span class="og-title-outline">SITI</span><br>&amp; APP WEB</h3>
              <h4 class="dp-svc-sub" data-i18n="s6_title">Web Design &amp; Sviluppo</h4>
              <p class="dp-stage-desc" data-i18n="s6_desc">Siti B2B ad alta conversione e web application su misura, con integrazione CRM nativa. Design premium, performance ottimale e collegamento nativo con il tuo stack tecnologico.</p>
              <div class="dp-stage-actions">
                <a href="pages/siti-web.html" class="dp-btn-neon" data-i18n="s_discover">Scopri il servizio <span>→</span></a>
                <button type="button" class="dp-btn-ghost" data-warp-idx="6">PEAK RUN →</button>
              </div>
            </div>
          </div>
        </section>

        <!-- ZONA 07: THE PEAK RUN (ARENA MICRO-INTERAZIONE GIOCABILE) -->
        <section class="dp-stage" data-stage-idx="6">
          <div class="dp-holo-card dp-holo-run-arena">
            <div class="dp-holo-meta">
              <span class="dp-zone-tag">ZONE 07 // 2040m · THE PEAK RUN CORRIDOR</span>
              <span class="dp-eyebrow" data-d-i18n="d_run_zone_kicker">007 // MICRO-INTERAZIONE GIOCABILE</span>
            </div>
            <h2 class="dp-stage-title" data-d-i18n="d_run_zone_title">THE PEAK RUN <span class="d-accent">SLALOM</span></h2>
            <p class="dp-stage-desc" data-d-i18n="d_run_zone_desc">Guida la tavola energetica tra i nodi dati ad alto intento (ICP, SQL, Agentic AI, CRO) ed evita le frizioni di mercato (Silos, Budget Waste) nel canale ad alta velocità.</p>
            <div class="dp-stage-actions">
              <button type="button" class="dp-btn-play-hero" id="dpArenaLaunchBtn" data-d-i18n="d_run_launch_btn">⚡ AVVIA SFIDA PEAK RUN ORA</button>
              <button type="button" class="dp-btn-ghost" data-warp-idx="7" data-d-i18n="d_run_skip_btn">PROSEGUI VERSO THE PEAK →</button>
            </div>
          </div>
        </section>

        <!-- ZONA 08: THE PEAK — GROWTH WITHOUT LIMITS (CONTATTI & SUMMIT TERMINAL) -->
        <section class="dp-stage" data-stage-idx="7">
          <div class="dp-holo-grid-summit">
            <div class="dp-holo-card dp-summit-copy">
              <div class="dp-holo-meta">
                <span class="dp-zone-tag">ZONE 08 // 2480m · THE PEAK — GROWTH WITHOUT LIMITS</span>
                <span class="dp-eyebrow" data-i18n="contact_eye"><span class="eye-num">004</span> Contatti</span>
              </div>
              <h2 class="dp-stage-title" data-i18n="contact_title">Dove vuoi migliorare il tuo <span class="cy">business?</span></h2>
              <p class="dp-stage-desc" data-i18n="contact_sub">Non usiamo script preimpostati. Inviaci la tua richiesta: analizzeremo i tuoi dati e fisseremo una chiacchierata esplorativa, senza impegno, per capire come scalare i tuoi risultati.</p>

              <div class="dp-summit-links">
                <a href="pages/lead-generation.html" class="dp-mini-link"><span>01</span> <span data-i18n="nav_s1">Lead Generation B2B</span></a>
                <a href="pages/ecommerce-cro.html" class="dp-mini-link"><span>02</span> <span data-i18n="nav_s2">eCommerce B2B &amp; CRO</span></a>
                <a href="pages/agentic-ai.html" class="dp-mini-link"><span>03</span> <span data-i18n="nav_s3">Agentic AI</span></a>
                <a href="pages/marketing-automation.html" class="dp-mini-link"><span>04</span> <span data-i18n="nav_s4">Marketing Automation</span></a>
                <a href="pages/strategia-marketing.html" class="dp-mini-link"><span>05</span> <span data-i18n="nav_s5">Marketing Strategy</span></a>
                <a href="pages/siti-web.html" class="dp-mini-link"><span>06</span> <span data-i18n="nav_s6">Siti &amp; App Web</span></a>
              </div>
            </div>

            <div class="dp-holo-card dp-summit-form-host" id="dpSummitFormHost"></div>
          </div>
        </section>

      </main>

      <!-- MODALE VITTORIA PEAK RUN -->
      <div class="dp-victory-modal" id="dpVictoryModal" role="dialog" aria-modal="true" aria-labelledby="dpVictoryTitle">
        <div class="dp-holo-card dp-victory-card">
          <span class="dp-zone-tag" data-d-i18n="d_victory_kicker">VETTA RAGGIUNTA · 2480m // GROWTH WITHOUT LIMITS</span>
          <h2 id="dpVictoryTitle" class="dp-stage-title" data-d-i18n="d_victory_title">PEAK RUN COMPLETATA!</h2>
          <div class="dp-victory-stats" id="dpVictoryStats"></div>
          <div class="dp-stage-actions">
            <button type="button" class="dp-btn-neon" id="dpVictoryToContact" data-d-i18n="d_victory_cta">FISSA LA TUA CALL STRATEGICA →</button>
            <button type="button" class="dp-btn-ghost" id="dpVictoryReplay" data-d-i18n="d_victory_replay">↻ RIGIOCA PEAK RUN</button>
          </div>
        </div>
      </div>

      <!-- DECK INFERIORE DI NAVIGAZIONE E PUNTEGGIO -->
      <footer class="dp-hud-bottom" aria-label="Surf Deck & Score">
        <div class="dp-score-strip">
          <div class="dp-score-pill">
            <span data-d-i18n="d_hud_score">PIPELINE SCORE</span>
            <strong id="dpHudScore">00000</strong>
          </div>
          <div class="dp-score-pill">
            <span data-d-i18n="d_hud_combo">MOLTIPLICATORE</span>
            <strong id="dpHudCombo">x1</strong>
          </div>
          <div class="dp-score-pill">
            <span data-d-i18n="d_hud_nodes">NODI DATI</span>
            <strong id="dpHudNodes">0</strong>
          </div>
        </div>

        <div class="dp-progress-wrap">
          <div class="dp-progress-track" id="dpProgressTrack" title="Clicca per saltare lungo il canale 3D">
            <div class="dp-progress-fill" id="dpProgressFill"></div>
          </div>
          <span class="dp-controls-hint" data-d-i18n="d_hint_controls">SCROLL / W-S per surfare in profondità · MOUSE / A-D per guidare la tavola tra i Data Nodes</span>
        </div>

        <div class="dp-deck-nav">
          <button type="button" class="dp-hud-btn" id="dpPrevZoneBtn" data-d-i18n="d_prev_zone">◀ ZONA PREC.</button>
          <button type="button" class="dp-hud-btn" id="dpNextZoneBtn" data-d-i18n="d_next_zone">ZONA SUCC. ▶</button>
        </div>
      </footer>
    `;

    doc.body.appendChild(root);

    // Sposta il vero #contactForm dentro lo stage 08 (The Peak) così main.js + /api/contact + i18n funzionano nativamente
    const form = doc.getElementById('contactForm');
    const host = doc.getElementById('dpSummitFormHost');
    if (form && host) {
      originalFormParent = form.parentNode;
      originalFormNext = form.nextSibling;
      host.appendChild(form);
    }

    // Riapplica decorazione link (?design=D) e traduzioni i18n
    if (global.DPDesign && typeof global.DPDesign.decorateLinks === 'function') {
      global.DPDesign.decorateLinks('D');
    }
    if (global.DPI18n && typeof global.DPI18n.refresh === 'function') {
      global.DPI18n.refresh();
    }
    applyHudStrings();
  }

  // ── Costruzione Backdrop 3D per le 6 Pagine Interne di Servizio ──
  function buildInnerExperience() {
    if (doc.getElementById('dpExperienceRoot')) return;

    const root = doc.createElement('div');
    root.id = 'dpExperienceRoot';
    root.className = 'dp-exp-root dp-exp-inner';
    root.innerHTML = `
      <canvas id="dpWorldCanvas" class="dp-world-canvas" aria-hidden="true"></canvas>
      <canvas id="dpSurfCanvas" class="dp-surf-canvas" aria-hidden="true"></canvas>
      <aside class="dp-inner-telemetry" aria-label="3D Spatial Telemetry">
        <a href="../index.html?design=D" class="dp-inner-back" data-d-i18n="d_back_ocean">← TORNA ALL'OCEANO 3D (PEAK RUN)</a>
        <span class="dp-inner-status" data-d-i18n="d_inner_hud">MODALITÀ DOSSIER SPAZIALE 3D · MUOVI IL CURSORE PER L\'ONDA LIQUIDA</span>
        <button type="button" class="dp-hud-btn dp-hud-btn-audio" id="dpAudioToggle" data-d-i18n="d_btn_audio_off">🔇 AUDIO OFF</button>
      </aside>
    `;
    doc.body.insertBefore(root, doc.body.firstChild);

    if (global.DPDesign && typeof global.DPDesign.decorateLinks === 'function') {
      global.DPDesign.decorateLinks('D');
    }
    applyHudStrings();
  }

  function detectInnerZone() {
    const p = global.location.pathname.toLowerCase();
    if (p.includes('lead-generation')) return ZONES[2];      // Lead Engine
    if (p.includes('ecommerce-cro')) return ZONES[3];        // B2B Commerce District
    if (p.includes('agentic-ai')) return ZONES[4];           // AI Harbor
    if (p.includes('marketing-automation')) return ZONES[5]; // Code Foundry
    if (p.includes('strategia-marketing')) return ZONES[1];  // Signal Tower
    if (p.includes('siti-web')) return ZONES[5];             // Code Foundry
    return ZONES[4];
  }

  function bindEvents() {
    // 1. Intercetta i link della navbar (#about, #services, #contact, #home) in modalità spaziale D
    doc.addEventListener('click', (e) => {
      if (doc.documentElement.getAttribute('data-design') !== 'D') return;
      if (audio) audio.playTick();

      // Click sull'acqua / schermo -> onda d'urto liquida
      const nx = clamp(e.clientX / Math.max(1, global.innerWidth), 0, 1);
      const ny = clamp(1 - e.clientY / Math.max(1, global.innerHeight), 0, 1);
      camState.ripple = [nx, ny, 0.01, 0.85];
      const wx = global.DPWorld.PathMath.pathX(camState.z + 24) + (nx - 0.5) * 26;
      camState.clickWorld = [wx, camState.z + 24, 0.01, 1.0];

      if (!isHomePage) return;

      const warpBtn = e.target.closest('[data-warp-idx]');
      if (warpBtn) {
        e.preventDefault();
        const idx = parseInt(warpBtn.getAttribute('data-warp-idx'), 10);
        stopPeakRun();
        warpToZone(idx, false);
        return;
      }

      const railBtn = e.target.closest('.dp-rail-node');
      if (railBtn) {
        e.preventDefault();
        const idx = parseInt(railBtn.getAttribute('data-zone-idx'), 10);
        if (idx === 6) {
          warpToZone(6, true);
        } else {
          stopPeakRun();
          warpToZone(idx, false);
        }
        return;
      }

      const navLink = e.target.closest('a[data-target], a.nav-logo[href="#home"]');
      if (navLink) {
        const target = navLink.getAttribute('data-target') || navLink.getAttribute('href');
        if (target === '#home') { e.preventDefault(); stopPeakRun(); warpToZone(0); }
        else if (target === '#about') { e.preventDefault(); stopPeakRun(); warpToZone(1); }
        else if (target === '#services') { e.preventDefault(); stopPeakRun(); warpToZone(2); }
        else if (target === '#contact') { e.preventDefault(); stopPeakRun(); warpToZone(7); }
      }
    }, true);

    // 2. Pulsanti HUD
    doc.addEventListener('click', (e) => {
      if (doc.documentElement.getAttribute('data-design') !== 'D') return;
      const id = e.target.id || (e.target.closest('button') && e.target.closest('button').id);
      if (!id) return;

      if (id === 'dpAudioToggle') {
        if (audio) audio.toggle();
        applyHudStrings();
      } else if (id === 'dpPlayToggle') {
        if (surf && surf.gameActive) stopPeakRun();
        else startPeakRun(camState.z > 2100 ? 1880 : Math.max(60, camState.z));
      } else if (id === 'dpHeroPlayBtn') {
        startPeakRun(60);
      } else if (id === 'dpArenaLaunchBtn') {
        startPeakRun(1900);
      } else if (id === 'dpRunBannerStop') {
        stopPeakRun();
      } else if (id === 'dpPrevZoneBtn') {
        stopPeakRun();
        const cur = getZoneIndexAt(camState.targetZ);
        warpToZone(Math.max(0, cur - 1));
      } else if (id === 'dpNextZoneBtn') {
        stopPeakRun();
        const cur = getZoneIndexAt(camState.targetZ);
        warpToZone(Math.min(ZONES.length - 1, cur + 1));
      } else if (id === 'dpVictoryToContact') {
        const modal = doc.getElementById('dpVictoryModal');
        if (modal) modal.classList.remove('open');
        stopPeakRun();
        warpToZone(7);
      } else if (id === 'dpVictoryReplay') {
        const modal = doc.getElementById('dpVictoryModal');
        if (modal) modal.classList.remove('open');
        startPeakRun(1880);
      }
    });

    // Click sulla barra di avanzamento inferiore
    doc.addEventListener('click', (e) => {
      if (!isHomePage || doc.documentElement.getAttribute('data-design') !== 'D') return;
      const track = e.target.closest('#dpProgressTrack');
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const ratio = clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
      stopPeakRun();
      camState.targetZ = ratio * MAX_Z;
    });

    // 3. Wheel / Trackpad per surfare lungo l'asse Z
    global.addEventListener('wheel', (e) => {
      if (!isHomePage || doc.documentElement.getAttribute('data-design') !== 'D') return;
      // Permetti scroll interno se l'utente scorre dentro una textarea o card molto alta su mobile
      const insideScrollable = e.target.closest('textarea, .dp-holo-card');
      if (insideScrollable && insideScrollable.scrollHeight > insideScrollable.clientHeight + 8) {
        const atTop = insideScrollable.scrollTop <= 0 && e.deltaY < 0;
        const atBot = insideScrollable.scrollTop + insideScrollable.clientHeight >= insideScrollable.scrollHeight - 2 && e.deltaY > 0;
        if (!atTop && !atBot) return;
      }
      e.preventDefault();
      const delta = clamp(e.deltaY, -160, 160);
      camState.targetZ = clamp(camState.targetZ + delta * 0.62, 0, MAX_Z);
    }, { passive: false });

    // 4. Puntatore / Touch per prospettiva 3D, distorsione liquida e guida della tavola
    let touchStartY = null;
    let touchStartX = null;

    global.addEventListener('pointermove', (e) => {
      if (doc.documentElement.getAttribute('data-design') !== 'D') return;
      const nx = clamp(e.clientX / Math.max(1, global.innerWidth), 0, 1);
      const ny = clamp(1 - e.clientY / Math.max(1, global.innerHeight), 0, 1);
      camState.mouseVelX = clamp((nx - camState.mouseX) * 14, -1.5, 1.5);
      camState.mouseVelY = clamp((ny - camState.mouseY) * 14, -1.5, 1.5);
      camState.mouseX = nx;
      camState.mouseY = ny;

      if (surf) {
        surf.setSteer((nx - 0.5) * 2.15);
        surf.addCursorPoint(e.clientX, e.clientY);
      }
    }, { passive: true });

    global.addEventListener('touchstart', (e) => {
      if (!isHomePage || doc.documentElement.getAttribute('data-design') !== 'D') return;
      if (e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
      }
    }, { passive: true });

    global.addEventListener('touchmove', (e) => {
      if (!isHomePage || doc.documentElement.getAttribute('data-design') !== 'D') return;
      if (e.touches.length === 1 && touchStartY !== null) {
        const dy = touchStartY - e.touches[0].clientY;
        const nx = clamp(e.touches[0].clientX / Math.max(1, global.innerWidth), 0, 1);
        touchStartY = e.touches[0].clientY;
        camState.targetZ = clamp(camState.targetZ + dy * 1.45, 0, MAX_Z);
        if (surf) surf.setSteer((nx - 0.5) * 2.2);
      }
    }, { passive: true });

    // 5. Tastiera (W/S/Frecce per surfare e A/D/Frecce laterali per curvare sulla tavola)
    global.addEventListener('keydown', (e) => {
      if (doc.documentElement.getAttribute('data-design') !== 'D') return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(doc.activeElement && doc.activeElement.tagName)) return;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') camState.keys.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') camState.keys.down = true;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') camState.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') camState.keys.right = true;
      if (e.key === 'Escape' && surf && surf.gameActive) stopPeakRun();
    });

    global.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') camState.keys.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') camState.keys.down = false;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') camState.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') camState.keys.right = false;
    });

    global.addEventListener('resize', () => {
      if (world) world.resize();
      if (surf) surf.resize();
    });

    global.addEventListener('dp:lang', () => {
      applyHudStrings();
    });
  }

  // ── Loop Principale 60fps (WebGL2 + Surf Physics + 3D Stage Transforms) ──
  function startLoop() {
    if (running) return;
    running = true;
    let lastTime = performance.now();

    const paletteBuf = {
      skyTop: [0, 0, 0],
      skyMid: [0, 0, 0],
      skyHor: [0, 0, 0],
      sunA: [0, 0, 0],
      sunB: [0, 0, 0],
      neonA: [0, 0, 0],
      neonB: [0, 0, 0],
      water: [0, 0, 0],
      grid: 0.7,
      stream: 0.9,
      clouds: 0.8
    };

    const innerZone = !isHomePage ? detectInnerZone() : null;

    const frame = (now) => {
      if (!running || doc.documentElement.getAttribute('data-design') !== 'D') {
        running = false;
        return;
      }
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      const dtMs = now - lastTime;
      lastTime = now;
      const time = now * 0.001;

      // Input tastiera continuo
      if (isHomePage) {
        if (camState.keys.up) camState.targetZ = clamp(camState.targetZ + 115 * dt, 0, MAX_Z);
        if (camState.keys.down) camState.targetZ = clamp(camState.targetZ - 115 * dt, 0, MAX_Z);
      }
      if (surf) {
        if (camState.keys.left) surf.setSteer(surf.steerTarget - 1.9 * dt);
        if (camState.keys.right) surf.setSteer(surf.steerTarget + 1.9 * dt);
      }

      // In modalità gioco Peak Run, la tavola avanza automaticamente a velocità sostenuta verso The Peak
      if (isHomePage && surf && surf.gameActive) {
        const autoSpeed = 88; // metri al secondo
        camState.targetZ = clamp(camState.targetZ + autoSpeed * dt, 0, MAX_Z);
      } else if (!isHomePage && innerZone) {
        // Nelle pagine interne la camera avanza dolcemente attorno al monumento 3D del servizio
        const scrollRatio = clamp(global.scrollY / Math.max(1, doc.body.scrollHeight - global.innerHeight), 0, 1);
        camState.targetZ = innerZone.shaderZ + 15 + scrollRatio * 75 + Math.sin(time * 0.35) * 6;
      }

      // Inerzia fluida sull'asse Z
      const prevZ = camState.z;
      const stiffness = (surf && surf.gameActive) ? 7.5 : 5.2;
      camState.z = lerp(camState.z, camState.targetZ, Math.min(1, dt * stiffness));
      camState.velZ = (camState.z - prevZ) / dt;
      const speedAbs = Math.abs(camState.velZ);
      const speedNorm = clamp(speedAbs / 120, 0, 1);

      // Inerzia mouse
      camState.smoothMouseX = lerp(camState.smoothMouseX, camState.mouseX, Math.min(1, dt * 8));
      camState.smoothMouseY = lerp(camState.smoothMouseY, camState.mouseY, Math.min(1, dt * 8));
      camState.mouseVelX *= Math.pow(0.05, dt);
      camState.mouseVelY *= Math.pow(0.05, dt);

      // Decadimento effetti post-processing
      camState.flash = Math.max(0, camState.flash - dt * 1.8);
      camState.glitch = Math.max(0, camState.glitch - dt * 2.2);
      camState.bars = lerp(camState.bars, camState.targetBars, Math.min(1, dt * 6));
      if (camState.ripple[3] > 0.001) {
        camState.ripple[2] += dt * 1.35;
        camState.ripple[3] = Math.max(0, camState.ripple[3] - dt * 0.85);
      }
      if (camState.clickWorld[3] > 0.001) {
        camState.clickWorld[2] += dt * 1.4;
        camState.clickWorld[3] = Math.max(0, camState.clickWorld[3] - dt * 0.7);
      }

      // Calcolo posizione camera 3D sul canale d'onda
      const PM = global.DPWorld.PathMath;
      const pathCenterX = PM.pathX(camState.z);
      const pathSlope = PM.pathDX(camState.z);
      const boardLateral = surf ? surf.steerX * 0.38 : 0;
      const parallaxX = (camState.smoothMouseX - 0.5) * 3.8;
      const parallaxY = (camState.smoothMouseY - 0.5) * 1.6;

      const camX = pathCenterX + boardLateral + parallaxX;
      const waveH = PM.swell(camX, camState.z, time);
      const camY = Math.max(1.8, 3.6 + waveH * 0.55 + parallaxY);

      // Direzione dello sguardo + rollio fisico in curva
      const lookAheadZ = camState.z + 28;
      const lookAheadX = PM.pathX(lookAheadZ) + (camState.smoothMouseX - 0.5) * 8.5 + (surf ? surf.steerX * 0.5 : 0);
      const lookAheadY = 3.2 + (camState.smoothMouseY - 0.5) * 3.2;

      let fx = lookAheadX - camX;
      let fy = lookAheadY - camY;
      let fz = lookAheadZ - camState.z;
      const fLen = Math.hypot(fx, fy, fz) || 1;
      fx /= fLen; fy /= fLen; fz /= fLen;

      const roll = clamp(-pathSlope * 0.32 - (surf ? surf.bank * 0.28 : 0) - (camState.smoothMouseX - 0.5) * 0.14, -0.35, 0.35);
      const upWorldX = Math.sin(roll);
      const upWorldY = Math.cos(roll);
      const upWorldZ = 0;

      // right = normalize(cross(fwd, upWorld)) -> in coordinate shader right-handed con +Z in avanti:
      let rx = upWorldY * fz - upWorldZ * fy;
      let ry = upWorldZ * fx - upWorldX * fz;
      let rz = upWorldX * fy - upWorldY * fx;
      const rLen = Math.hypot(rx, ry, rz) || 1;
      rx /= rLen; ry /= rLen; rz /= rLen;

      const ux = fy * rz - fz * ry;
      const uy = fz * rx - fx * rz;
      const uz = fx * ry - fy * rx;

      const fovDeg = 58 + speedNorm * 14;
      const tanHalf = Math.tan((fovDeg * Math.PI) / 360);

      // Scia liquida del cursore sull'acqua
      const hoverZ = camState.z + 16 + camState.smoothMouseY * 22;
      const hoverX = PM.pathX(hoverZ) + (camState.smoothMouseX - 0.5) * 20;
      camState.hoverWorld[0] = hoverX;
      camState.hoverWorld[1] = hoverZ;
      camState.hoverWorld[2] = 0.65;

      // Interpolazione palette e selezione delle 2 Zone 3D più vicine per lo shader
      const pair = interpolatePalette(isHomePage ? camState.z : innerZone.z, paletteBuf);
      const zoneA = [pair.a.shaderType, pair.a.shaderZ, 1, 0];
      const zoneB = [pair.b.shaderType, pair.b.shaderZ, pair.b.idx !== pair.a.idx ? 1 : 0, 0];

      const camObj = {
        pos: [camX, camY, camState.z],
        fwd: [fx, fy, fz],
        right: [rx, ry, rz],
        up: [ux, uy, uz],
        tanHalf
      };

      // Render WebGL2
      if (world && world.ok) {
        world.adapt(dtMs);
        world.render({
          time,
          cam: camObj,
          palette: paletteBuf,
          zoneA,
          zoneB,
          peak: [PM.pathX(2720), 195.0, 2720.0],
          click: camState.clickWorld,
          hover: camState.hoverWorld,
          post: {
            mouse: [camState.smoothMouseX, camState.smoothMouseY],
            mouseVel: [camState.mouseVelX, camState.mouseVelY],
            speed: speedNorm,
            flash: camState.flash,
            flashCol: camState.flashCol,
            bars: camState.bars,
            glitch: camState.glitch,
            fade: 1.0,
            sunUv: [0.5 - (camState.smoothMouseX - 0.5) * 0.18, 0.53 - (camState.smoothMouseY - 0.5) * 0.12],
            rays: 0.45,
            ripple: camState.ripple,
            motion: 1.0
          }
        });
      }

      // Render 2D Surfboard + Data Nodes + Market Obstacles (e fallback 2D se WebGL2 assente)
      if (surf) {
        surf.updateAndRender(dt, {
          time,
          cam: camObj,
          useFallback2D: !(world && world.ok)
        });
      }

      // Aggiorna Audio procedurale
      if (audio && audio.enabled) {
        audio.update(speedNorm, surf ? Math.abs(surf.steerVel) / 10 : 0, time);
      }

      // Aggiorna HUD e trasformazioni 3D degli Stage Olografici sulla Homepage
      if (isHomePage) {
        updateHomeStagesAndHud(speedAbs);
      }

      rafId = global.requestAnimationFrame(frame);
    };

    rafId = global.requestAnimationFrame(frame);
  }

  function updateHomeStagesAndHud(speedAbs) {
    const activeIdx = getZoneIndexAt(camState.z);
    const activeZone = ZONES[activeIdx];

    const depthEl = doc.getElementById('dpTeleDepth');
    if (depthEl) {
      depthEl.textContent = `${String(Math.round(camState.z)).padStart(4, '0')}m / ${MAX_Z}m`;
    }
    const speedEl = doc.getElementById('dpTeleSpeed');
    if (speedEl) {
      const knots = (16.5 + speedAbs * 0.65 + (surf && surf.gameActive ? 28 : 0)).toFixed(1);
      speedEl.textContent = `${knots} KTS`;
    }
    const badgeEl = doc.getElementById('dpTeleZoneBadge');
    if (badgeEl && activeZone) {
      badgeEl.textContent = `ZONE ${activeZone.code} // ${activeZone.name}`;
    }

    if (surf) {
      const scoreEl = doc.getElementById('dpHudScore');
      if (scoreEl) scoreEl.textContent = String(surf.score).padStart(5, '0');
      const comboEl = doc.getElementById('dpHudCombo');
      if (comboEl) comboEl.textContent = `x${surf.combo}`;
      const nodesEl = doc.getElementById('dpHudNodes');
      if (nodesEl) nodesEl.textContent = String(surf.nodesCollected);
    }

    const fillEl = doc.getElementById('dpProgressFill');
    if (fillEl) {
      fillEl.style.width = `${(clamp(camState.z / MAX_Z, 0, 1) * 100).toFixed(1)}%`;
    }

    // Aggiorna nodi del Radar Spaziale
    doc.querySelectorAll('.dp-rail-node').forEach((btn) => {
      const idx = parseInt(btn.getAttribute('data-zone-idx'), 10);
      btn.classList.toggle('active', idx === activeIdx);
    });

    // Prospettiva 3D continua sugli 8 Stage Olografici
    const tiltX = ((camState.smoothMouseY - 0.5) * -5.5).toFixed(2);
    const tiltY = ((camState.smoothMouseX - 0.5) * 6.5).toFixed(2);

    doc.querySelectorAll('.dp-stage').forEach((stage) => {
      const idx = parseInt(stage.getAttribute('data-stage-idx'), 10);
      const zObj = ZONES[idx];
      if (!zObj) return;
      const dz = zObj.z - camState.z; // >0 davanti a noi, <0 già superata
      const absDz = Math.abs(dz);

      if (absDz > 270) {
        stage.classList.remove('is-active');
        stage.style.opacity = '0';
        stage.style.pointerEvents = 'none';
        return;
      }

      const isCurrent = idx === activeIdx && absDz < 165;
      stage.classList.toggle('is-active', isCurrent);
      stage.style.pointerEvents = isCurrent && !(surf && surf.gameActive) ? 'auto' : 'none';

      // Effetto volo spaziale 3D: le zone davanti arrivano dal fondo, quelle superate scorrono verso la camera
      const norm = clamp(dz / 220, -1, 1);
      const opacity = clamp(1 - Math.pow(absDz / 195, 1.8), 0, 1);
      const zShift = (-norm * 240).toFixed(1);
      const yShift = (norm * -26).toFixed(1);
      const scale = (1 - norm * 0.14).toFixed(3);

      stage.style.opacity = (surf && surf.gameActive) ? '0' : opacity.toFixed(3);
      stage.style.transform = `translate3d(0px, ${yShift}px, ${zShift}px) scale(${scale}) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    });
  }

  function bootDesignD() {
    if (doc.documentElement.getAttribute('data-design') !== 'D') return;

    isHomePage = !!doc.getElementById('home');
    if (isHomePage) {
      buildHomeExperience();
    } else {
      buildInnerExperience();
    }

    if (!initialized) {
      initialized = true;
      audio = new global.DPAudio.Soundscape();

      const worldCanvas = doc.getElementById('dpWorldCanvas');
      const surfCanvas = doc.getElementById('dpSurfCanvas');

      if (worldCanvas && global.DPWorld) {
        world = new global.DPWorld.World(worldCanvas, {
          scale: 0.62,
          minScale: 0.35,
          maxScale: 0.85,
          steps: 92,
          reflections: true,
          adaptive: true
        });
        world.init();
      }

      if (surfCanvas && global.DPSurf && global.DPWorld) {
        surf = new global.DPSurf.SurfEngine(surfCanvas, global.DPWorld.PathMath, {
          onCollect(combo) {
            camState.flash = 0.18;
            camState.flashCol = [0, 0.96, 1];
            if (audio) audio.playNode(combo);
          },
          onBoost() {
            camState.flash = 0.28;
            camState.flashCol = [1, 0.78, 0.15];
            camState.targetZ = clamp(camState.targetZ + 45, 0, MAX_Z);
            if (audio) audio.playGate();
          },
          onHit() {
            camState.glitch = 0.85;
            camState.flash = 0.26;
            camState.flashCol = [1, 0.12, 0.45];
            if (audio) audio.playHit();
          },
          onNearMiss() {
            camState.flash = 0.1;
            camState.flashCol = [0.65, 0.32, 1];
          },
          onFinishRun(stats) {
            camState.targetBars = 0;
            camState.flash = 0.45;
            camState.flashCol = [1, 0.86, 0.25];
            if (audio) audio.playGate();
            const root = doc.getElementById('dpExperienceRoot');
            if (root) root.removeAttribute('data-game-mode');
            const statsEl = doc.getElementById('dpVictoryStats');
            const rank = stats.score >= 4500 ? 'S // APEX SURFER' : (stats.score >= 2500 ? 'A // GROWTH ARCHITECT' : 'B // WAVE RIDER');
            if (statsEl) {
              statsEl.innerHTML = `
                <div class="dp-v-stat"><span>SCORE</span><strong>${stats.score}</strong></div>
                <div class="dp-v-stat"><span>MAX COMBO</span><strong>x${stats.maxCombo}</strong></div>
                <div class="dp-v-stat"><span>DATA NODES</span><strong>${stats.nodes}</strong></div>
                <div class="dp-v-stat"><span>RANK</span><strong>${rank}</strong></div>
              `;
            }
            const modal = doc.getElementById('dpVictoryModal');
            if (modal) modal.classList.add('open');
            applyHudStrings();
          }
        });
        surf.resize();
      }

      bindEvents();

      // Gestione hash iniziale (es. index.html?design=D#contact)
      if (isHomePage && global.location.hash) {
        const h = global.location.hash;
        if (h === '#about') camState.z = camState.targetZ = ZONES[1].z;
        else if (h === '#services') camState.z = camState.targetZ = ZONES[2].z;
        else if (h === '#contact') camState.z = camState.targetZ = ZONES[7].z;
      }
    }

    startLoop();
  }

  function teardownDesignD() {
    running = false;
    if (rafId) {
      global.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    if (audio && audio.enabled) {
      audio.toggle(false);
    }
    // Ripristina #contactForm nella sezione originale se si passa a A/B/C
    const form = doc.getElementById('contactForm');
    if (form && originalFormParent) {
      if (originalFormNext) originalFormParent.insertBefore(form, originalFormNext);
      else originalFormParent.appendChild(form);
    }
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', bootDesignD);
  } else {
    bootDesignD();
  }

  global.addEventListener('dp:designchange', (e) => {
    const next = e && e.detail && e.detail.design;
    if (next === 'D') bootDesignD();
    else teardownDesignD();
  });
})(window, document);
