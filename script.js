/* ==========================================================================
   SECTOR RED — Motor del juego
   PixiJS 7 | GSAP 3 | Web Audio API | canvas-confetti
   ========================================================================== */

// ============================================================================
// CONFIGURACIÓN
// ============================================================================
const CONFIG = {
  TOTAL_TO_WIN: 15,
  MAX_LIVES: 3,
  POINTS_BASE: 100,
  POINTS_COMBO_BONUS: 50,
  PACKET_SPAWN_DELAY_OK: 500,
  PACKET_SPAWN_DELAY_FAIL: 1000
};

const DIFFICULTY = {
  easy: { label: 'FÁCIL',  BASE_TIME: 15, MIN_TIME: 15, TIME_DECREASE: 0,   pointsMultiplier: 0.5 },
  normal: { label: 'NORMAL', BASE_TIME: 10, MIN_TIME: 5,  TIME_DECREASE: 0.15, pointsMultiplier: 1 },
  hard: { label: 'DIFÍCIL', BASE_TIME: 6,  MIN_TIME: 3,  TIME_DECREASE: 0.2,  pointsMultiplier: 1.5 }
};
let selectedDifficulty = 'normal';

const COLORS = {
  green: 0x00ff88, greenRgba: 'rgba(0,255,136,',
  purple: 0x7b2ffc, purpleRgba: 'rgba(123,47,252,',
  cyan: 0x00f0ff, cyanRgba: 'rgba(0,240,255,',
  red: 0xff3366,
  gold: 0xffd700,
  dark: 0x0a0e27
};

// ============================================================================
// DATOS — Afirmaciones clasificables (Calidad=0, Pertinencia=1, Usabilidad=2)
// ============================================================================
const STATEMENTS = [
  // ---- CALIDAD (0) ----
  { text: 'La información del recurso está verificada y actualizada.', category: 0 },
  { text: 'El diseño visual mantiene coherencia estética en todas las pantallas.', category: 0 },
  { text: 'Los contenidos están libres de errores conceptuales o gramaticales.', category: 0 },
  { text: 'El recurso cita fuentes confiables y verificables.', category: 0 },
  { text: 'Los formatos multimedia utilizados tienen resolución y calidad adecuadas.', category: 0 },
  { text: 'La redacción del contenido es clara, precisa y bien estructurada.', category: 0 },
  { text: 'El recurso ha sido actualizado en los últimos dos años.', category: 0 },
  { text: 'Los materiales descargables mantienen su formato al abrirse.', category: 0 },
  // ---- PERTINENCIA (1) ----
  { text: 'El nivel de dificultad es adecuado para los estudiantes del curso.', category: 1 },
  { text: 'Los contenidos corresponden directamente al temario de la asignatura.', category: 1 },
  { text: 'El recurso promueve el logro de las competencias definidas en el sílabo.', category: 1 },
  { text: 'Las actividades propuestas se alinean con los objetivos de aprendizaje.', category: 1 },
  { text: 'El recurso aborda las necesidades específicas del grupo estudiantil.', category: 1 },
  { text: 'La extensión del recurso es adecuada para el tiempo disponible en clase.', category: 1 },
  { text: 'Los ejemplos utilizados son relevantes para el contexto del estudiante.', category: 1 },
  { text: 'El recurso complementa adecuadamente otros materiales del curso.', category: 1 },
  // ---- USABILIDAD (2) ----
  { text: 'La navegación del recurso es intuitiva y requiere mínima capacitación.', category: 2 },
  { text: 'El recurso se adapta correctamente a dispositivos móviles y tablets.', category: 2 },
  { text: 'Los botones y enlaces funcionan correctamente sin enlaces rotos.', category: 2 },
  { text: 'Las instrucciones de uso son claras y están visibles.', category: 2 },
  { text: 'El tiempo de carga del recurso es aceptable.', category: 2 },
  { text: 'Los elementos interactivos responden de manera predecible.', category: 2 },
  { text: 'El recurso es accesible para personas con discapacidad visual o auditiva.', category: 2 },
  { text: 'Los textos tienen tamaño y contraste legibles sin esfuerzo.', category: 2 }
];

const TERMINAL_LABELS = ['CALIDAD', 'PERTINENCIA', 'USABILIDAD'];
const TERMINAL_COLORS = [COLORS.green, COLORS.purple, COLORS.cyan];
const TERMINAL_COLORS_RGBA = ['rgba(0,255,136,', 'rgba(123,47,252,', 'rgba(0,240,255,'];

const BUZZ_PHRASES = [
  '¡Al infinito... y más allá!',
  'Esto no es volar, esto es caer con estilo.',
  'Ranger Espacial Buzz Lightyear, reportándose.',
  'Misión cumplida.',
  'Al infinito... ¡y más allá!',
  '¡Hasta el infinito y más allá!'
];

// ============================================================================
// MOTOR DE AUDIO (Web Audio API)
// ============================================================================
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.muted = JSON.parse(localStorage.getItem('sectorRedMuted') || 'false');
  }

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.ready = true;
    } catch (e) {
      console.warn('Web Audio no disponible');
    }
  }

  resume() {
    if (!this.ctx) { this.init(); return; }
    if (this.ctx.state === 'closed') { this.init(); return; }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  _osc(type, freq, dur, vol = 0.15) {
    if (!this.ready || this.muted) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, this.ctx.currentTime);
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + dur);
  }

  laser() {
    if (!this.ready || this.muted) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(300, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 0.2);
    g.gain.setValueAtTime(0.08, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    o.connect(g).connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + 0.25);
  }

  explosion() {
    if (!this.ready || this.muted) return;
    const bufSize = this.ctx.sampleRate * 0.3;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.15));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.2, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(3000, this.ctx.currentTime);
    f.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.3);
    src.connect(f).connect(g).connect(this.ctx.destination);
    src.start(); src.stop(this.ctx.currentTime + 0.35);
  }

  error() {
    this._osc('square', 150, 0.3, 0.1);
    setTimeout(() => this._osc('square', 80, 0.3, 0.08), 100);
  }

  combo(level = 3) {
    const notes = [523, 659, 784, 1047];
    if (level > 4) level = 4;
    for (let i = 0; i < level; i++) {
      setTimeout(() => this._osc('sine', notes[i], 0.15, 0.1), i * 80);
    }
  }

  tick() {
    this._osc('sine', 880, 0.05, 0.06);
  }

  victory() {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319];
    notes.forEach((f, i) => {
      setTimeout(() => this._osc('sine', f, 0.3, 0.1), i * 120);
    });
  }

  gameOver() {
    this._osc('square', 300, 0.5, 0.1);
    setTimeout(() => this._osc('square', 200, 0.5, 0.08), 400);
    setTimeout(() => this._osc('square', 100, 0.8, 0.06), 800);
  }

  timeLow() {
    this._osc('square', 440, 0.08, 0.06);
  }
}

// ============================================================================
// ESTADO DEL JUEGO
// ============================================================================
const state = {
  score: 0,
  lives: 3,
  combo: 1,
  correctCount: 0,
  maxCombo: 0,
  wrongCount: 0,
  isAnswering: false,
  gameActive: false,
  paused: false,
  timerActive: false,
  timeRemaining: 0,
  timerMax: 0,
  usedIndices: [],
  currentStatement: null,
  difficulty: 0,
  diffConfig: null,
  twInterval: null
};

let highScore = parseInt(localStorage.getItem('sectorRedHighScore') || '0', 10);
const activeTweens = [];

function killAllTweens() {
  activeTweens.forEach(t => t.kill());
  activeTweens.length = 0;
}

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mDur = (n) => reduceMotion() ? 0.001 : n;

// ============================================================================
// AUDIO ENGINE — instancia global
// ============================================================================
const audio = new AudioEngine();

// ============================================================================
// INICIALIZAR PIXIJS
// ============================================================================
const app = new PIXI.Application({
  resizeTo: window,
  backgroundColor: COLORS.dark,
  antialias: true,
  resolution: Math.min(window.devicePixelRatio || 1, 2),
  autoDensity: true
});
document.getElementById('game-container').appendChild(app.view);

const W = () => app.screen.width;
const H = () => app.screen.height;

// ============================================================================
// CAPAS
// ============================================================================
const bgLayer = new PIXI.Container();
const gridLayer = new PIXI.Container();
const starLayer = new PIXI.Container();
const terminalLayer = new PIXI.Container();
const packetLayer = new PIXI.Container();
const laserLayer = new PIXI.Container();
const fxLayer = new PIXI.Container();
const overlayLayer = new PIXI.Container();

const shipLayer = new PIXI.Container();
const shipParticleLayer = new PIXI.Container();

app.stage.addChild(bgLayer);
app.stage.addChild(gridLayer);
app.stage.addChild(starLayer);
app.stage.addChild(shipLayer);
app.stage.addChild(shipParticleLayer);
app.stage.addChild(terminalLayer);
app.stage.addChild(packetLayer);
app.stage.addChild(laserLayer);
app.stage.addChild(fxLayer);
app.stage.addChild(overlayLayer);

// ============================================================================
// ESTRELLAS
// ============================================================================
const stars = [];
function createStars() {
  const count = 160;
  for (let i = 0; i < count; i++) {
    const s = new PIXI.Graphics();
    const r = Math.random() * 1.5 + 0.5;
    const alpha = Math.random() * 0.6 + 0.2;
    s.beginFill(0xe0e6ff, alpha);
    s.drawCircle(0, 0, r);
    s.endFill();
    s.x = Math.random() * W();
    s.y = Math.random() * H();
    s.alpha = alpha;
    starLayer.addChild(s);
    stars.push({ gfx: s, speed: Math.random() * 0.02 + 0.005, phase: Math.random() * Math.PI * 2 });
  }
}
createStars();

function updateStars(time) {
  for (const s of stars) {
    const twinkle = 0.5 + 0.5 * Math.sin(time * s.speed * 60 + s.phase);
    s.gfx.alpha = s.gfx._baseAlpha !== undefined
      ? s.gfx._baseAlpha * twinkle
      : (s.gfx._baseAlpha = s.gfx.alpha, s.gfx.alpha * twinkle);
  }
}

// ============================================================================
// NEBULOSA (fondo con blur)
// ============================================================================
function createNebula() {
  const blobData = [
    { x: 0.2, y: 0.3, r: 300, color: 0x1a0a3e },
    { x: 0.7, y: 0.5, r: 250, color: 0x0a2a4e },
    { x: 0.5, y: 0.8, r: 200, color: 0x0a3a2e }
  ];
  for (const b of blobData) {
    const g = new PIXI.Graphics();
    g.beginFill(b.color, 0.12);
    g.drawCircle(0, 0, b.r);
    g.endFill();
    g.x = W() * b.x;
    g.y = H() * b.y;
    g.filters = [new PIXI.BlurFilter(80)];
    bgLayer.addChild(g);
  }
}
createNebula();

// ============================================================================
// REJILLA DE PERSPECTIVA (arcade retro)
// ============================================================================
let gridLines = [];
function createRetroGrid() {
  gridLayer.removeChildren();
  gridLines = [];
  const w = W(), h = H();
  const cx = w / 2, cy = h * 0.55;
  const count = 28;
  for (let i = 0; i < count; i++) {
    const g = new PIXI.Graphics();
    const t = (i + 1) / count;
    const alpha = 0.015 + t * 0.025;
    const yOff = t * h * 0.6;
    g.lineStyle(1, 0x00f0ff, alpha);
    g.moveTo(cx - t * w * 0.55, 0);
    g.lineTo(cx + t * w * 0.55, 0);
    g.position.set(0, cy + yOff);
    gridLayer.addChild(g);
    gridLines.push({ gfx: g, baseY: cy + yOff, t });
  }
}
createRetroGrid();

function updateRetroGrid(time) {
  if (reduceMotion()) return;
  for (const l of gridLines) {
    const wave = Math.sin(time * 1.2 + l.t * 3.5) * 2;
    l.gfx.y = l.baseY + wave;
  }
}

// ============================================================================
// NAVE ESPACIAL (dibujada con Graphics)
// ============================================================================
let shipContainer = null;

function createSpaceship() {
  if (shipContainer) {
    shipContainer.visible = true;
    return;
  }

  shipContainer = new PIXI.Container();
  const W_ = W(), H_ = H();
  const sx = W_ * 0.15, sy = H_ * 0.5;

  // Cuerpo principal (triangular, alargado)
  const body = new PIXI.Graphics();
  body.beginFill(0x2a3a6a, 0.85);
  body.lineStyle(1.5, 0x00f0ff, 0.35);
  body.moveTo(0, -55);
  body.lineTo(22, 35);
  body.lineTo(18, 45);
  body.lineTo(0, 50);
  body.lineTo(-18, 45);
  body.lineTo(-22, 35);
  body.closePath();
  body.endFill();
  shipContainer.addChild(body);

  // Alas
  const wingsLeft = new PIXI.Graphics();
  wingsLeft.beginFill(0x1a2a5a, 0.7);
  wingsLeft.lineStyle(1, 0x00f0ff, 0.2);
  wingsLeft.moveTo(-12, 5);
  wingsLeft.lineTo(-60, 45);
  wingsLeft.lineTo(-50, 48);
  wingsLeft.lineTo(-20, 30);
  wingsLeft.closePath();
  wingsLeft.endFill();
  shipContainer.addChild(wingsLeft);

  const wingsRight = new PIXI.Graphics();
  wingsRight.beginFill(0x1a2a5a, 0.7);
  wingsRight.lineStyle(1, 0x00f0ff, 0.2);
  wingsRight.moveTo(12, 5);
  wingsRight.lineTo(60, 45);
  wingsRight.lineTo(50, 48);
  wingsRight.lineTo(20, 30);
  wingsRight.closePath();
  wingsRight.endFill();
  shipContainer.addChild(wingsRight);

  // Cabina (cúpula)
  const cockpit = new PIXI.Graphics();
  cockpit.beginFill(0x00f0ff, 0.25);
  cockpit.lineStyle(1, 0x00f0ff, 0.4);
  cockpit.drawEllipse(0, -18, 10, 6);
  cockpit.endFill();
  shipContainer.addChild(cockpit);

  // Detalle brillo cabina
  const cockpitGlow = new PIXI.Graphics();
  cockpitGlow.beginFill(0x00f0ff, 0.08);
  cockpitGlow.drawEllipse(0, -18, 16, 11);
  cockpitGlow.endFill();
  shipContainer.addChild(cockpitGlow);

  // Canal de luz en el centro
  const centerLine = new PIXI.Graphics();
  centerLine.beginFill(0x00f0ff, 0.15);
  centerLine.drawRect(-1, -40, 2, 85);
  centerLine.endFill();
  shipContainer.addChild(centerLine);

  // Escape de motor (círculos con blur)
  const engineGlow = new PIXI.Graphics();
  engineGlow.beginFill(0x00f0ff, 0.15);
  engineGlow.drawEllipse(0, 60, 20, 35);
  engineGlow.endFill();
  engineGlow.filters = [new PIXI.BlurFilter(12)];
  shipContainer.addChild(engineGlow);

  // Llama del motor (Graphics dinámico)
  const flame = new PIXI.Graphics();
  flame.beginFill(0x00f0ff, 0.3);
  flame.moveTo(-6, 50);
  flame.lineTo(0, 65 + Math.random() * 10);
  flame.lineTo(6, 50);
  flame.closePath();
  flame.endFill();
  shipContainer.addChild(flame);

  // Animación de flama con GSAP
  if (!reduceMotion()) {
    gsap.to(flame, {
      duration: 0.15 + Math.random() * 0.1,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      onRepeat: () => {
        gsap.set(flame, {
          scaleX: 0.7 + Math.random() * 0.6,
          scaleY: 0.8 + Math.random() * 0.4
        });
      }
    });
  }

  // Posicionamiento
  shipContainer.x = sx;
  shipContainer.y = sy;
  shipContainer.scale.set(1.2);
  shipContainer.alpha = 0;

  shipLayer.addChild(shipContainer);

  // Animación de entrada
  gsap.to(shipContainer, { alpha: 1, duration: mDur(1.2), ease: 'power2.inOut' });

  if (!reduceMotion()) {
    // Trayectoria lemniscata (∞) con GSAP
    const shipData = { t: 0 };
    const baseX = sx, baseY = sy;
    const ampX = W_ * 0.08, ampY = H_ * 0.06;

    function updateShipPos() {
    const angle = shipData.t;
    const lx = ampX * Math.sin(angle);
    const ly = ampY * Math.sin(angle * 2) * 0.6;
    shipContainer.x = baseX + lx;
    shipContainer.y = baseY + ly;
    shipContainer.rotation = Math.atan2(
      Math.cos(angle * 2) * 2 * ampY * 0.6,
      Math.cos(angle) * ampX
    ) * 0.3;
  }

  gsap.to(shipData, {
    t: Math.PI * 2,
    duration: 8,
    repeat: -1,
    ease: 'none',
    onUpdate: updateShipPos
  });

  // Partículas de estela (thrust)
  function startShipParticles() {
    if (shipContainer.particleInterval) return;
    shipContainer.particleInterval = setInterval(() => {
      if (!shipContainer.visible || shipContainer.alpha < 0.5) return;
      const p = new PIXI.Graphics();
      const s = 1 + Math.random() * 3;
      const alpha = 0.15 + Math.random() * 0.2;
      p.beginFill(0x00f0ff, alpha);
      p.drawCircle(0, 0, s);
      p.endFill();
      p.x = shipContainer.x + (Math.random() - 0.5) * 6;
      p.y = shipContainer.y + 35 + Math.random() * 5;
      shipParticleLayer.addChild(p);

      gsap.to(p, {
        y: p.y + 60 + Math.random() * 40,
        x: p.x + (Math.random() - 0.5) * 20,
        alpha: 0,
        duration: 0.8 + Math.random() * 0.6,
        ease: 'power2.out',
        onComplete: () => shipParticleLayer.removeChild(p)
      });
      gsap.to(p.scale, { x: 0, y: 0, duration: 0.6, ease: 'power1.out' });
    }, 80);
  }
  startShipParticles();
  } // end-if !reduceMotion
} // end createSpaceship

function hideShip() {
  if (shipContainer) {
    if (shipContainer.particleInterval) {
      clearInterval(shipContainer.particleInterval);
      shipContainer.particleInterval = null;
    }
    gsap.to(shipContainer, {
      alpha: 0,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => { shipContainer.visible = false; }
    });
    // Limpiar partículas de estela
    shipParticleLayer.removeChildren();
  }
}

function showShip() {
  if (shipContainer) {
    shipContainer.visible = true;
    gsap.to(shipContainer, { alpha: 1, duration: 0.6, ease: 'power2.out' });
  } else {
    createSpaceship();
  }
}

// ============================================================================
// TERMINALES
// ============================================================================
const terminals = [];

function createTerminals() {
  terminalLayer.removeChildren();
  terminals.length = 0;

  const tw = Math.min(160, Math.max(80, (W() - 30) / 3.4));
  const th = Math.round(tw * 0.47);
  const gap = Math.max(8, tw * 0.12);
  const totalW = tw * 3 + gap * 2;
  const startX = (W() - totalW) / 2;
  const ty = H() * 0.78;

  for (let i = 0; i < 3; i++) {
    const cx = startX + tw * i + gap * i + tw / 2;

    // Contenedor del terminal
    const container = new PIXI.Container();
    container.x = cx;
    container.y = ty;
    container.eventMode = 'static';
    container.cursor = 'pointer';

    // Fondo
    const bg = new PIXI.Graphics();
    bg.beginFill(TERMINAL_COLORS[i], 0.08);
    bg.lineStyle(1.5, TERMINAL_COLORS[i], 0.3);
    bg.drawRoundedRect(-tw / 2, -th / 2, tw, th, 8);
    bg.endFill();
    container.addChild(bg);

    // Glow overlay (hover)
    const glow = new PIXI.Graphics();
    glow.beginFill(TERMINAL_COLORS[i], 0.08);
    glow.lineStyle(2, TERMINAL_COLORS[i], 0.15);
    glow.drawRoundedRect(-tw / 2, -th / 2, tw, th, 8);
    glow.endFill();
    glow.alpha = 0;
    container.addChild(glow);

    // Línea decorativa superior
    const line = new PIXI.Graphics();
    line.beginFill(TERMINAL_COLORS[i], 0.5);
    line.drawRect(-tw / 2, -th / 2, tw, 3);
    line.endFill();
    container.addChild(line);

    // Texto
    const fontSize = Math.min(12, tw * 0.1);
    const txt = new PIXI.Text(TERMINAL_LABELS[i], {
      fontFamily: '"Courier New", monospace',
      fontSize: fontSize,
      fill: TERMINAL_COLORS[i],
      letterSpacing: Math.min(4, fontSize * 0.35),
      fontWeight: 700
    });
    txt.anchor.set(0.5);
    container.addChild(txt);

    // Indicador de energía (barra activa)
    const energyBar = new PIXI.Graphics();
    energyBar.beginFill(TERMINAL_COLORS[i], 0.3);
    energyBar.drawRect(-tw / 2 + 8, th / 2 - 6, tw - 16, 3);
    energyBar.endFill();
    container.addChild(energyBar);

    // Eventos
    container.on('pointerover', () => {
      gsap.to(glow, { alpha: 0.6, duration: 0.2 });
      gsap.to(container.scale, { x: 1.03, y: 1.03, duration: 0.2 });
    });
    container.on('pointerout', () => {
      gsap.to(glow, { alpha: 0, duration: 0.3 });
      gsap.to(container.scale, { x: 1, y: 1, duration: 0.3 });
    });
    container.on('pointerdown', () => {
      handleAnswer(i);
    });

    terminalLayer.addChild(container);

    terminals.push({
      container,
      bg,
      glow,
      line,
      txt,
      energyBar,
      color: TERMINAL_COLORS[i],
      colorRgba: TERMINAL_COLORS_RGBA[i],
      index: i
    });
  }
}
createTerminals();

// ============================================================================
// PAQUETE DE DATOS
// ============================================================================
let packet = null;

function createPacket() {
  if (packet) {
    packetLayer.removeChild(packet.container);
    if (packet.tweens) packet.tweens.forEach(t => t.kill());
  }

  const container = new PIXI.Container();
  const radius = 48;
  const cx = 0;
  const cy = 0;

  // Hexágono exterior
  const hexOuter = new PIXI.Graphics();
  hexOuter.beginFill(0x00b8d4, 0.15);
  hexOuter.lineStyle(2, 0x00f0ff, 0.5);
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const px = cx + radius * Math.cos(a);
    const py = cy + radius * Math.sin(a);
    if (i === 0) hexOuter.moveTo(px, py);
    else hexOuter.lineTo(px, py);
  }
  hexOuter.closePath();
  hexOuter.endFill();
  container.addChild(hexOuter);

  // Hexágono interior (más pequeño, rotado)
  const hexInner = new PIXI.Graphics();
  hexInner.beginFill(0x00e5ff, 0.06);
  hexInner.lineStyle(1, 0x00f0ff, 0.2);
  const innerR = radius * 0.6;
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    const px = cx + innerR * Math.cos(a);
    const py = cy + innerR * Math.sin(a);
    if (i === 0) hexInner.moveTo(px, py);
    else hexInner.lineTo(px, py);
  }
  hexInner.closePath();
  hexInner.endFill();
  container.addChild(hexInner);

  // Destello central
  const core = new PIXI.Graphics();
  core.beginFill(0x00f0ff, 0.4);
  core.drawCircle(0, 0, 6);
  core.endFill();
  container.addChild(core);

  // Añadir un filtro de glow
  const glowFilter = new PIXI.BlurFilter(6);
  const glowObj = new PIXI.Graphics();
  glowObj.beginFill(0x00f0ff, 0.08);
  glowObj.drawCircle(0, 0, radius);
  glowObj.endFill();
  glowObj.filters = [glowFilter];
  container.addChild(glowObj);

  container.x = W() + 80;
  container.y = H() * 0.38;
  container.alpha = 0;

  packetLayer.addChild(container);

  const tweens = [];

  // Entrada
  tweens.push(gsap.to(container, {
    x: W() / 2,
    alpha: 1,
    duration: 0.7,
    ease: 'power3.out'
  }));

  // Rotación continua
  tweens.push(gsap.to(container, {
    rotation: Math.PI * 2,
    duration: 4,
    repeat: -1,
    ease: 'none'
  }));

  // Flotación
  tweens.push(gsap.to(container, {
    y: H() * 0.38 - 8,
    duration: 1.6,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  }));

  packet = { container, hexOuter, hexInner, core, glowObj, tweens, radius };
}

function destroyPacket(animated = false) {
  if (!packet) return;
  if (packet.tweens) packet.tweens.forEach(t => t.kill());

  const c = packet.container;
  if (animated) {
    gsap.to(c, {
      alpha: 0,
      duration: 0.3,
      ease: 'back.in',
      onComplete: () => {
        packetLayer.removeChild(c);
        packet = null;
      }
    });
    gsap.to(c.scale, { x: 0.2, y: 0.2, duration: 0.3, ease: 'back.in' });
  } else {
    packetLayer.removeChild(c);
    packet = null;
  }
}

// ============================================================================
// LÁSER
// ============================================================================
function shootLaser(fromX, fromY, toX, toY, color = 0x00f0ff, callback) {
  const g = new PIXI.Graphics();
  g.lineStyle(3, color, 0.8);
  g.moveTo(fromX, fromY);
  g.lineTo(toX, toY);
  laserLayer.addChild(g);

  // Glow
  const glowLaser = new PIXI.Graphics();
  glowLaser.lineStyle(8, color, 0.2);
  glowLaser.moveTo(fromX, fromY);
  glowLaser.lineTo(toX, toY);
  glowLaser.filters = [new PIXI.BlurFilter(4)];
  laserLayer.addChild(glowLaser);

  // Destello en el punto de impacto
  const hit = new PIXI.Graphics();
  hit.beginFill(0xffffff, 0.6);
  hit.drawCircle(0, 0, 5);
  hit.endFill();
  hit.x = toX;
  hit.y = toY;
  laserLayer.addChild(hit);

  const t1 = gsap.to(g, { alpha: 0, duration: 0.3, delay: 0.1 });
  const t2 = gsap.to(glowLaser, { alpha: 0, duration: 0.3, delay: 0.1 });
  const t3 = gsap.to(hit, {
    alpha: 0,
    duration: 0.25,
    onComplete: () => {
      laserLayer.removeChild(g);
      laserLayer.removeChild(glowLaser);
      laserLayer.removeChild(hit);
      if (callback) callback();
    }
  });
  const t4 = gsap.to(hit.scale, { x: 2, y: 2, duration: 0.25 });
  activeTweens.push(t1, t2, t3, t4);

  audio.laser();
}

// ============================================================================
// PARTÍCULAS
// ============================================================================
function burstParticles(x, y, color, count = 20, spread = 80) {
  for (let i = 0; i < count; i++) {
    const p = new PIXI.Graphics();
    const size = 2 + Math.random() * 3;
    p.beginFill(color, 1);
    p.drawCircle(0, 0, size);
    p.endFill();
    p.x = x;
    p.y = y;
    fxLayer.addChild(p);

    const angle = Math.random() * Math.PI * 2;
    const dist = spread * (0.3 + Math.random() * 0.7);
    const dur = 0.4 + Math.random() * 0.4;

    const t = gsap.to(p, {
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist + 20,
      alpha: 0,
      duration: dur,
      ease: 'power2.out',
      onComplete: () => fxLayer.removeChild(p)
    });
    const ts = gsap.to(p.scale, { x: 0, y: 0, duration: dur, ease: 'power2.out' });
    activeTweens.push(t, ts);
  }
}

function screenFlash(color = 0xffffff) {
  const flash = new PIXI.Graphics();
  flash.beginFill(color, 0.15);
  flash.drawRect(0, 0, W(), H());
  flash.endFill();
  overlayLayer.addChild(flash);
  gsap.to(flash, { alpha: 0, duration: 0.4, onComplete: () => overlayLayer.removeChild(flash) });
}

// ============================================================================
// SHAKE (GSAP en stage)
// ============================================================================
function shakeScreen() {
  const tl = gsap.timeline();
  tl.to(app.stage, { x: -6, duration: 0.04 })
    .to(app.stage, { x: 6, duration: 0.04 })
    .to(app.stage, { x: -4, duration: 0.04 })
    .to(app.stage, { x: 4, duration: 0.04 })
    .to(app.stage, { x: -2, duration: 0.04 })
    .to(app.stage, { x: 2, duration: 0.04 })
    .to(app.stage, { x: 0, duration: 0.04 });
}

// ============================================================================
// SELECCIONAR AFIRMACIÓN ALEATORIA
// ============================================================================
function getRandomStatement() {
  if (state.usedIndices.length >= STATEMENTS.length) {
    state.usedIndices = [];
  }
  const available = [];
  for (let i = 0; i < STATEMENTS.length; i++) {
    if (!state.usedIndices.includes(i)) available.push(i);
  }
  const idx = available[Math.floor(Math.random() * available.length)];
  state.usedIndices.push(idx);
  return { ...STATEMENTS[idx], index: idx };
}

// ============================================================================
// ACTUALIZAR HUD
// ============================================================================
function updateHUD() {
  const hearts = '♥ '.repeat(state.lives).trim() || '✗';
  document.getElementById('livesDisplay').textContent = hearts;
  document.getElementById('scoreDisplay').textContent = state.score;
  document.getElementById('comboDisplay').textContent = `x${state.combo}`;
  document.getElementById('progressDisplay').textContent =
    `${state.correctCount}/${CONFIG.TOTAL_TO_WIN}`;

  // Badge de dificultad
  const diffBadge = document.getElementById('diffBadge');
  const badgeContainer = document.getElementById('diffBadgeContainer');
  if (state.diffConfig) {
    const diffKey = Object.keys(DIFFICULTY).find(k => DIFFICULTY[k] === state.diffConfig) || 'normal';
    badgeContainer.classList.add('visible');
    diffBadge.textContent = state.diffConfig.label || 'NORMAL';
    diffBadge.className = 'hud-value diff-badge ' + diffKey;
  } else {
    badgeContainer.classList.remove('visible');
  }
}

// ============================================================================
// MOSTRAR / OCULTAR PANTALLAS
// ============================================================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('visible'));
  const el = document.getElementById(id);
  if (el) el.classList.add('visible');

  // Mostrar nave solo en pantalla de inicio
  if (id === 'startScreen') {
    createSpaceship();
    showShip();
    document.getElementById('highScoreDisplay').textContent = String(highScore).padStart(4, '0');

    // Frase aleatoria de Buzz en el briefing
    const hint = document.querySelector('.briefing .hint');
    if (hint) {
      const phrase = BUZZ_PHRASES[Math.floor(Math.random() * BUZZ_PHRASES.length)];
      hint.innerHTML = `<span class="hint-dash">—</span> "${phrase}" <span class="hint-dash">—</span>`;
    }
  } else {
    hideShip();
  }
}

function showHUD(show) {
  document.getElementById('gameHUD').classList.toggle('hidden', !show);
  document.getElementById('statementArea').classList.toggle('hidden', !show);
}

function togglePause() {
  if (!state.gameActive) return;
  state.paused = !state.paused;
  const overlay = document.getElementById('pauseOverlay');
  if (state.paused) {
    state.timerActive = false;
    overlay.classList.remove('hidden');
    gsap.globalTimeline.pause();
  } else {
    overlay.classList.add('hidden');
    state.timerActive = true;
    gsap.globalTimeline.resume();
  }
}

// ============================================================================
// LÓGICA DEL JUEGO
// ============================================================================
function startGame() {
  const diff = DIFFICULTY[selectedDifficulty];
  state.score = 0;
  state.lives = CONFIG.MAX_LIVES;
  state.combo = 1;
  state.correctCount = 0;
  state.maxCombo = 0;
  state.wrongCount = 0;
  state.isAnswering = false;
  state.gameActive = true;
  state.usedIndices = [];
  state.diffConfig = diff;
  state.paused = false;
  document.getElementById('pauseOverlay').classList.add('hidden');

  audio.resume();
  showScreen('__none__');
  hideShip();

  // Preparar HUD para animación de entrada
  const hud = document.getElementById('gameHUD');
  gsap.set(hud, { opacity: 0, y: -20 });
  showHUD(true);
  gsap.to(hud, { opacity: 1, y: 0, duration: mDur(0.4), ease: 'power2.out' });

  // Limpiar efectos visuales de partidas anteriores
  killAllTweens();
  fxLayer.removeChildren();
  overlayLayer.removeChildren();
  laserLayer.removeChildren();
  shipParticleLayer.removeChildren();
  if (packet) { packetLayer.removeChildren(); packet = null; }

  updateHUD();
  createTerminals();
  createPacket();
  showStatement(startTimer);
}

function showStatement(onReady) {
  // Limpiar typewriter anterior
  if (state.twInterval) {
    clearInterval(state.twInterval);
    state.twInterval = null;
  }

  state.currentStatement = getRandomStatement();
  const el = document.getElementById('statementText');
  el.textContent = '';
  el.style.opacity = 0;

  // Animar la caja de afirmación entrando
  const area = document.getElementById('statementArea');
  gsap.fromTo(area,
    { opacity: 0, x: 40 },
    { opacity: 1, x: 0, duration: mDur(0.4), ease: 'power2.out' }
  );

  gsap.to(el, { opacity: 1, duration: mDur(0.3), delay: 0.15 });

  // Typewriter effect
  const txt = state.currentStatement.text;
  let i = 0;

  if (reduceMotion()) {
    el.textContent = txt;
    if (onReady) onReady();
    return;
  }

  state.twInterval = setInterval(() => {
    el.textContent += txt[i];
    i++;
    if (i >= txt.length) {
      clearInterval(state.twInterval);
      state.twInterval = null;
      if (typeof onReady === 'function') onReady();
    }
  }, 16);
}

function startTimer() {
  const diff = state.diffConfig || DIFFICULTY.normal;
  state.timerMax = Math.max(
    diff.BASE_TIME - state.correctCount * diff.TIME_DECREASE,
    diff.MIN_TIME
  );
  state.timeRemaining = state.timerMax;
  state.timerActive = true;

  const fill = document.getElementById('timerFill');
  fill.style.width = '100%';
  fill.style.background = 'var(--cyan)';
}

function updateTimer(delta) {
  if (!state.timerActive || !state.gameActive) return;
  state.timeRemaining -= delta * 0.001;
  const pct = Math.max(0, (state.timeRemaining / state.timerMax) * 100);

  const fill = document.getElementById('timerFill');
  fill.style.width = pct + '%';

  if (pct < 25) {
    fill.style.background = '#ff3366';
    fill.classList.add('low');
    if (Math.floor(state.timeRemaining * 10) % 10 === 0 && state.timeRemaining > 0) {
      audio.timeLow();
    }
  } else if (pct < 50) {
    fill.style.background = '#ffd700';
    fill.classList.remove('low');
  } else {
    fill.style.background = '#00f0ff';
    fill.classList.remove('low');
  }

  if (state.timeRemaining <= 0) {
    handleTimeout();
  }
}

function handleTimeout() {
  if (state.isAnswering || !state.gameActive) return;
  state.timerActive = false;
  state.isAnswering = true;

  // Detener typewriter si sigue activo
  if (state.twInterval) {
    clearInterval(state.twInterval);
    state.twInterval = null;
  }

  state.lives--;
  state.combo = 1;
  state.wrongCount++;
  updateHUD();
  audio.error();
  shakeScreen();
  screenFlash(COLORS.red);

  // Destruir paquete con animación
  if (packet) {
    const c = packet.container;
    gsap.to(c, {
      alpha: 0,
      duration: 0.3,
      ease: 'back.in',
      onComplete: () => {
        destroyPacket();
        checkGameOver();
      }
    });
    gsap.to(c.scale, { x: 0.1, y: 0.1, duration: 0.3, ease: 'back.in' });
  }
}

function handleAnswer(index) {
  if (state.isAnswering || !state.gameActive) return;
  if (!state.currentStatement || !packet) return;

  // Detener typewriter si sigue activo
  if (state.twInterval) {
    clearInterval(state.twInterval);
    state.twInterval = null;
  }

  state.isAnswering = true;
  state.timerActive = false;

  const isCorrect = index === state.currentStatement.category;
  const terminal = terminals[index];
  const pkt = packet;

  // Disparar láser
  const fromX = pkt.container.x;
  const fromY = pkt.container.y;
  const toX = terminal.container.x;
  const toY = terminal.container.y;

  shootLaser(fromX, fromY, toX, toY, terminal.color, () => {
    if (isCorrect) {
      handleCorrect(terminal);
    } else {
      handleWrong(terminal);
    }
  });
}

function handleCorrect(terminal) {
  const mult = (state.diffConfig && state.diffConfig.pointsMultiplier) || 1;
  state.score += Math.round((CONFIG.POINTS_BASE * state.combo + CONFIG.POINTS_COMBO_BONUS * (state.combo - 1)) * mult);
  state.combo++;
  state.correctCount++;
  state.maxCombo = Math.max(state.maxCombo, state.combo);
  updateHUD();

  audio.explosion();
  if (state.combo > 3) audio.combo(Math.min(state.combo, 6));

  // Partículas verdes
  burstParticles(terminal.container.x, terminal.container.y, terminal.color, 22, 90);
  screenFlash(terminal.color);

  // canvas-confetti burst
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 18,
      spread: 40,
      origin: {
        x: terminal.container.x / W(),
        y: terminal.container.y / H()
      },
      colors: ['#' + terminal.color.toString(16).padStart(6, '0')],
      startVelocity: 25,
      scalar: 0.8
    });
  }

  // Destruir paquete
  destroyPacket(true);

  // Verificar victoria
  if (state.correctCount >= CONFIG.TOTAL_TO_WIN) {
    setTimeout(victory, 600);
    return;
  }

  // Siguiente pregunta
  setTimeout(() => {
    createPacket();
    showStatement(() => {
      state.isAnswering = false;
      startTimer();
    });
  }, CONFIG.PACKET_SPAWN_DELAY_OK);
}

function handleWrong(terminal) {
  state.combo = 1;
  state.lives--;
  state.wrongCount++;
  updateHUD();

  audio.error();
  shakeScreen();
  screenFlash(COLORS.red);

  // Destello rojo en terminal
  gsap.to(terminal.bg, { alpha: 0, duration: 0.1 });
  gsap.to(terminal.bg, { alpha: 0.08, duration: 0.3, delay: 0.1 });

  // Partículas rojas
  burstParticles(terminal.container.x, terminal.container.y, COLORS.red, 12, 50);

  // Destruir paquete
  destroyPacket(true);

  // Verificar game over
  if (state.lives <= 0) {
    setTimeout(gameOver, 600);
    return;
  }

  setTimeout(() => {
    createPacket();
    showStatement(() => {
      state.isAnswering = false;
      startTimer();
    });
  }, CONFIG.PACKET_SPAWN_DELAY_FAIL);
}

function checkGameOver() {
  if (state.lives <= 0) {
    setTimeout(gameOver, 300);
  } else {
    setTimeout(() => {
      createPacket();
      showStatement(() => {
        state.isAnswering = false;
        startTimer();
      });
    }, CONFIG.PACKET_SPAWN_DELAY_FAIL);
  }
}

// ============================================================================
// GAME OVER
// ============================================================================
function gameOver() {
  state.gameActive = false;
  state.timerActive = false;
  showHUD(false);
  audio.gameOver();

  // High Score
  if (state.score > highScore) {
    highScore = state.score;
    localStorage.setItem('sectorRedHighScore', String(highScore));
    const hsEl = document.getElementById('highScoreDisplay');
    hsEl.textContent = String(highScore).padStart(4, '0');
    gsap.fromTo(hsEl,
      { scale: 1.6, color: '#ffd700' },
      { scale: 1, duration: mDur(0.5), ease: 'back.out(2)' }
    );
    gsap.fromTo('#startScreen .hs-label',
      { opacity: 0 },
      { opacity: 1, duration: mDur(0.4), delay: 0.1 }
    );
  }

  document.getElementById('gameOverScore').textContent = state.score;
  document.getElementById('gameOverDetail').textContent =
    `Aciertos: ${state.correctCount} | Rachas: ${state.wrongCount} errores`;

  // Efecto visual PixiJS (flash + shake antes de mostrar pantalla)
  if (!reduceMotion()) {
    screenFlash(COLORS.red);
    shakeScreen();
  }

  if (packet) destroyPacket();

  // Pequeño delay para que se vea el flash antes de la pantalla
  const content = document.querySelector('#gameOverScreen .screen-content');
  gsap.set(content, { opacity: 0, y: 40 });

  const delay = reduceMotion() ? 0 : 400;

  setTimeout(() => {
    showScreen('gameOverScreen');

    gsap.to(content, {
      opacity: 1, y: 0,
      duration: mDur(0.6),
      ease: 'power3.out'
    });

    const title = document.querySelector('#gameOverScreen .fail-title');
    gsap.fromTo(title,
      { opacity: 0, x: -15 },
      { opacity: 1, x: 0, duration: mDur(0.5), ease: 'power2.out', delay: 0.15 }
    );

    // Animación de esquinas arcade
    const scons = document.querySelectorAll('#gameOverScreen .scon');
    gsap.fromTo(scons,
      { opacity: 0 },
      { opacity: 1, duration: mDur(0.5), stagger: reduceMotion() ? 0 : 0.08, ease: 'power2.out', delay: 0.1 }
    );

    // Parpadeo inicial para el prompt
    gsap.fromTo('#gameOverScreen .go-prompt',
      { opacity: 0 },
      { opacity: 0.5, duration: mDur(0.3), delay: 0.8 }
    );
  }, delay);
}

// ============================================================================
// VICTORIA
// ============================================================================
function victory() {
  state.gameActive = false;
  state.timerActive = false;
  showHUD(false);
  audio.victory();

  // High Score
  if (state.score > highScore) {
    highScore = state.score;
    localStorage.setItem('sectorRedHighScore', String(highScore));
    const hsEl = document.getElementById('highScoreDisplay');
    hsEl.textContent = String(highScore).padStart(4, '0');
    gsap.fromTo(hsEl,
      { scale: 1.6, color: '#ffd700' },
      { scale: 1, duration: mDur(0.5), ease: 'back.out(2)' }
    );
    gsap.fromTo('#startScreen .hs-label',
      { opacity: 0 },
      { opacity: 1, duration: mDur(0.4), delay: 0.1 }
    );
  }

  document.getElementById('victoryScore').textContent = state.score;
  document.getElementById('victoryDetail').textContent =
    `Aciertos: ${state.correctCount} | Racha máxima: x${state.maxCombo} | Errores: ${state.wrongCount}`;

  if (packet) destroyPacket();

  // Animar entrada con GSAP (elástica)
  const content = document.querySelector('#victoryScreen .screen-content');
  gsap.set(content, { opacity: 0, scale: 0.8, y: 20 });
  showScreen('victoryScreen');

  gsap.to(content, {
    opacity: 1, scale: 1, y: 0,
    duration: mDur(0.9),
    ease: reduceMotion() ? 'power2.out' : 'elastic.out(1, 0.5)',
    delay: 0.2
  });

  // Animación de esquinas arcade
  const scons = document.querySelectorAll('#victoryScreen .scon');
  gsap.fromTo(scons,
    { opacity: 0 },
    { opacity: 1, duration: mDur(0.5), stagger: reduceMotion() ? 0 : 0.08, ease: 'power2.out', delay: 0.1 }
  );

  // Frase de Buzz con fade-in
  gsap.fromTo('#buzzVictory',
    { opacity: 0, y: 10 },
    { opacity: 0.5, y: 0, duration: mDur(1), delay: 1.2, ease: 'power2.out' }
  );

  // Efecto de brillo dorado PixiJS
  screenFlash(COLORS.gold);

  // Confeti celebración
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 200,
      spread: 160,
      origin: { y: 0.5 },
      colors: ['#ffd700', '#00f0ff', '#00ff88', '#7b2ffc', '#ff3366'],
      startVelocity: 40,
      ticks: 200
    });

    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        confetti({
          particleCount: 25 + Math.floor(Math.random() * 20),
          spread: 60 + Math.random() * 60,
          origin: {
            x: Math.random(),
            y: Math.random() * 0.3
          },
          colors: ['#ffd700', '#00f0ff', '#00ff88', '#7b2ffc'],
          startVelocity: 20 + Math.random() * 20
        });
      }, 500 + i * 450);
    }
  }
}

// ============================================================================
// INTEGRACIÓN — postMessage al padre
// ============================================================================
function completeMission() {
  if (state.gameActive) return;

  try {
      const targetOrigin = window.parent.origin || '*';
      window.parent.postMessage({
      type: 'MODULE_COMPLETE',
      module: 'red-routing',
      score: state.score,
      maxScore: Math.round(CONFIG.TOTAL_TO_WIN * CONFIG.POINTS_BASE * ((state.diffConfig && state.diffConfig.pointsMultiplier) || 1)),
      passed: state.correctCount >= CONFIG.TOTAL_TO_WIN,
      details: {
        correct: state.correctCount,
        wrong: state.wrongCount,
        maxCombo: state.maxCombo,
        totalStatements: CONFIG.TOTAL_TO_WIN
      }
    }, targetOrigin);
  } catch (e) {
    console.log('Módulo completado. Score:', state.score);
  }
}

// ============================================================================
// TICKER — loop principal de PixiJS
// ============================================================================
app.ticker.add((delta) => {
  const time = Date.now() * 0.001;

  // Actualizar estrellas
  updateStars(time);

  // Actualizar rejilla
  updateRetroGrid(time);

  // Actualizar timer (solo si no está en pausa)
  if (!state.paused) updateTimer(app.ticker.deltaMS);

  // Pulsación de terminales
  for (let i = 0; i < terminals.length; i++) {
    const t = terminals[i];
    const pulse = 0.3 + 0.1 * Math.sin(time * 2 + i * 2.1);
    t.energyBar.alpha = pulse;
  }
});

// ============================================================================
// EVENTOS — Botones
// ============================================================================
document.getElementById('startBtn').addEventListener('click', () => {
  audio.init();
  audio.resume();
  startGame();
});

// Selector de dificultad
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (state.gameActive) return;
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedDifficulty = btn.dataset.diff;
    audio.resume();
  });
});

document.getElementById('retryBtn').addEventListener('click', () => {
  audio.resume();
  showScreen('startScreen');
});

document.getElementById('completeBtn').addEventListener('click', completeMission);

// Botón de mute
const muteBtn = document.getElementById('muteBtn');
function updateMuteBtn() {
  muteBtn.textContent = audio.muted ? '🔇' : '🔊';
  muteBtn.classList.toggle('muted', audio.muted);
}
muteBtn.addEventListener('click', () => {
  audio.muted = !audio.muted;
  localStorage.setItem('sectorRedMuted', JSON.stringify(audio.muted));
  updateMuteBtn();
});
updateMuteBtn();

// Keyboard
document.addEventListener('keydown', (e) => {
  // Pausa (Escape / P)
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
    if (state.gameActive) {
      e.preventDefault();
      togglePause();
      return;
    }
  }
  // Si está en pausa, ignorar otras teclas
  if (state.paused) return;

  if (e.key === ' ' || e.key === 'Enter') {
    const start = document.getElementById('startScreen');
    if (start.classList.contains('visible')) {
      e.preventDefault();
      audio.init();
      audio.resume();
      startGame();
    }
  }
  // Numpad 1,2,3 para terminales en debug
  if (state.gameActive && !state.isAnswering) {
    if (e.key === '1') { e.preventDefault(); handleAnswer(0); }
    if (e.key === '2') { e.preventDefault(); handleAnswer(1); }
    if (e.key === '3') { e.preventDefault(); handleAnswer(2); }
  }
});

// ============================================================================
// RESPONSIVE — reconstruir terminales al redimensionar
// ============================================================================
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    createRetroGrid();
    if (state.gameActive) {
      createTerminals();
      if (packet) {
        const c = packet.container;
        gsap.to(c, { x: W() / 2, y: H() * 0.38, duration: 0.3 });
      }
    }
  }, 300);
});

// ============================================================================
// INICIO — mostrar pantalla de inicio
// ============================================================================
showScreen('startScreen');
showHUD(false);

// ============================================================================
// Font loading + ocultar loading overlay
// ============================================================================
(async function hideLoading() {
  try {
    await document.fonts.load('1em "Press Start 2P"');
    await document.fonts.ready;
  } catch (_) { /* fallback */ }
  document.getElementById('loadingOverlay').classList.add('hidden');
})();
