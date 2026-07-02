import {
  World, createSystem, PanelUI, PanelDocument, UIKitDocument, UIKit, eq,
  Follower, ScreenSpace,
} from '@iwsdk/core';
import {
  Mesh, PlaneGeometry, BoxGeometry, SphereGeometry, TorusGeometry,
  ConeGeometry, OctahedronGeometry,
  MeshBasicMaterial, MeshStandardMaterial, CanvasTexture, LinearFilter,
  Color, Vector3, Vector2, Raycaster,
  DirectionalLight, AmbientLight, PointLight, FogExp2,
  Group, AdditiveBlending, WireframeGeometry, LineSegments, LineBasicMaterial,
  DoubleSide,
} from '@iwsdk/core';

// ─── WORD DATABASE ──────────────────────────────────────────
const CATEGORIES: Record<string, string[]> = {
  ANIMALS: ['CAT','DOG','FISH','BIRD','LION','BEAR','DEER','FOX','WOLF','HORSE','EAGLE','SHARK','TIGER','SNAKE','WHALE'],
  SPACE: ['STAR','MOON','SUN','MARS','COMET','ORBIT','NEBULA','PLANET','ROCKET','METEOR','COSMOS','VENUS','SATURN','PLUTO','SOLAR'],
  FOOD: ['CAKE','BREAD','SOUP','RICE','PASTA','STEAK','PIZZA','TACO','SALAD','APPLE','GRAPE','LEMON','MANGO','SUSHI','CURRY'],
  TECH: ['CODE','DATA','BYTE','CHIP','CLOUD','PIXEL','ROBOT','LASER','DEBUG','CACHE','DRONE','MODEM','VIRUS','PROXY','INPUT'],
  COLORS: ['RED','BLUE','GREEN','GOLD','PINK','CYAN','LIME','AMBER','CORAL','IVORY','JADE','RUBY','ONYX','TEAL','PLUM'],
  SPORTS: ['GOLF','SWIM','RACE','SURF','KICK','DUNK','GOAL','SCORE','BALL','TEAM','ARENA','COURT','MATCH','SERVE','DRAFT'],
  MUSIC: ['DRUM','BASS','BEAT','SONG','TUNE','JAZZ','ROCK','NOTE','BAND','SOLO','TEMPO','PIANO','CHORD','SOUND','VOCAL'],
  NATURE: ['TREE','LAKE','HILL','SAND','RAIN','WAVE','LEAF','WIND','FIRE','SNOW','CAVE','PEAK','REEF','BLOOM','FROST'],
};
const CAT_NAMES = Object.keys(CATEGORIES);

// 8 directions: [dr, dc]
const DIRS: [number,number][] = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
const DIR_H = [DIRS[0], DIRS[1]]; // horizontal only
const DIR_HV = [DIRS[0], DIRS[1], DIRS[2], DIRS[3]]; // h+v
const DIR_ALL = DIRS; // all 8

// ─── THEMES ─────────────────────────────────────────────────
interface Theme {
  name: string; grid: string; accent: string; bg: string; letter: string;
  found: string; hover: string; wall: string; fog: string;
}
const THEMES: Theme[] = [
  { name: 'Neon Holodeck', grid: '#003344', accent: '#00ffff', bg: '#000811', letter: '#00ffff', found: '#004466', hover: '#00ffff22', wall: '#002233', fog: '#000811' },
  { name: 'Crimson Arena', grid: '#330011', accent: '#ff2244', bg: '#0a0002', letter: '#ff4466', found: '#440022', hover: '#ff224422', wall: '#220011', fog: '#0a0002' },
  { name: 'Toxic Neon', grid: '#003300', accent: '#44ff44', bg: '#000a00', letter: '#44ff44', found: '#004400', hover: '#44ff4422', wall: '#002200', fog: '#000a00' },
  { name: 'Ultra Violet', grid: '#220044', accent: '#aa44ff', bg: '#08001a', letter: '#bb66ff', found: '#330055', hover: '#aa44ff22', wall: '#1a0033', fog: '#08001a' },
  { name: 'Solar Blaze', grid: '#331100', accent: '#ff8844', bg: '#0a0400', letter: '#ffaa66', found: '#442200', hover: '#ff884422', wall: '#221100', fog: '#0a0400' },
];

// ─── SKINS ──────────────────────────────────────────────────
interface Skin { name: string; color: string; unlock: string; req: number; }
const SKINS: Skin[] = [
  { name: 'Neon Cyan', color: '#00ffff', unlock: 'default', req: 0 },
  { name: 'Solar Flare', color: '#ff4444', unlock: '50 words', req: 50 },
  { name: 'Plasma Pink', color: '#ff44ff', unlock: '5K score', req: 5000 },
  { name: 'Frost Blue', color: '#4488ff', unlock: '10 games', req: 10 },
  { name: 'Toxic Green', color: '#44ff44', unlock: 'x3 combo', req: 3 },
  { name: 'Royal Gold', color: '#ffaa00', unlock: 'clear grid', req: 1 },
  { name: 'Void Purple', color: '#aa44ff', unlock: '80% acc', req: 80 },
  { name: 'Inferno', color: '#ff8844', unlock: 'all modes', req: 8 },
];

// ─── ACHIEVEMENTS ───────────────────────────────────────────
interface AchDef { id: string; name: string; desc: string; }
const ACHIEVEMENTS: AchDef[] = [
  { id:'first_find', name:'First Find', desc:'Find your first word' },
  { id:'sharp_eye', name:'Sharp Eye', desc:'Find 10 words total' },
  { id:'word_hunter', name:'Word Hunter', desc:'Find 50 words total' },
  { id:'lexicon', name:'Lexicon', desc:'Find 100 words total' },
  { id:'wordsmith', name:'Wordsmith', desc:'Find 500 words total' },
  { id:'speed_reader', name:'Speed Reader', desc:'Find a word in under 3s' },
  { id:'lightning', name:'Lightning', desc:'Find 3 words in 10s' },
  { id:'combo_x2', name:'Combo x2', desc:'Reach 2x combo' },
  { id:'combo_x3', name:'Combo x3', desc:'Reach 3x combo' },
  { id:'max_combo', name:'Max Combo', desc:'Reach x5 combo' },
  { id:'perfect_grid', name:'Perfect Grid', desc:'Find all words in a grid' },
  { id:'score_1k', name:'Score 1K', desc:'Score 1,000 in one game' },
  { id:'score_5k', name:'Score 5K', desc:'Score 5,000 in one game' },
  { id:'score_10k', name:'Score 10K', desc:'Score 10,000 in one game' },
  { id:'easy_win', name:'Easy Win', desc:'Complete an easy game' },
  { id:'medium_win', name:'Medium Win', desc:'Complete a medium game' },
  { id:'hard_win', name:'Hard Win', desc:'Complete a hard game' },
  { id:'all_modes', name:'All Modes', desc:'Play all 8 game modes' },
  { id:'games_10', name:'Dedicated', desc:'Play 10 games' },
  { id:'games_50', name:'Veteran', desc:'Play 50 games' },
  { id:'games_100', name:'Century', desc:'Play 100 games' },
  { id:'daily_done', name:'Daily Done', desc:'Complete a daily challenge' },
  { id:'daily_3', name:'Daily Fan', desc:'Complete 3 daily challenges' },
  { id:'daily_7', name:'Daily Devotee', desc:'Complete 7 daily challenges' },
  { id:'marathon_5', name:'Marathon Runner', desc:'Complete 5 marathon grids' },
  { id:'category_master', name:'Category Master', desc:'Find all words in category mode' },
  { id:'animal_expert', name:'Animal Expert', desc:'Find 20 animal words' },
  { id:'space_explorer', name:'Space Explorer', desc:'Find 20 space words' },
  { id:'foodie', name:'Foodie', desc:'Find 20 food words' },
  { id:'tech_guru', name:'Tech Guru', desc:'Find 20 tech words' },
  { id:'speed_demon', name:'Speed Demon', desc:'Timed: 30+ seconds left' },
  { id:'race_winner', name:'Race Winner', desc:'Race: finish under 60s' },
  { id:'zen_master', name:'Zen Master', desc:'Find 50 words in zen mode' },
  { id:'theme_explorer', name:'Theme Explorer', desc:'Try all grid themes' },
  { id:'fashionista', name:'Fashionista', desc:'Unlock a letter skin' },
  { id:'no_hints', name:'No Hints', desc:'Clear hard grid without hints' },
  { id:'accuracy_100', name:'Perfect Eye', desc:'100% accuracy in a game' },
  { id:'persistence', name:'Persistence', desc:'Play for 30+ minutes' },
  { id:'big_grid', name:'Big Grid', desc:'Complete a 12x12 grid' },
  { id:'legend', name:'Legend', desc:'Reach level 50' },
];

// ─── GAME STATE ─────────────────────────────────────────────
type GamePhase = 'menu' | 'modeselect' | 'difficulty' | 'countdown' | 'playing' | 'paused' | 'gameover'
  | 'leaderboard' | 'achievements' | 'settings' | 'stats' | 'help' | 'skins';

interface WordPlacement { word: string; sr: number; sc: number; dr: number; dc: number; found: boolean; }
interface SaveData {
  games: number; totalWords: number; bestScore: number; totalScore: number;
  bestCombo: number; totalAttempts: number; totalCorrect: number; gridsCleared: number;
  playTimeMs: number; dailyStreak: number; lastDaily: string; level: number; xp: number;
  skinIndex: number; themeIndex: number; masterVol: number; sfxVol: number; musicVol: number;
  achievements: string[]; modesPlayed: string[]; themesUsed: number[];
  leaderboard: { score: number; mode: string; date: string; words: number; }[];
  catWords: Record<string, number>; zenWords: number; marathonGrids: number;
  dailyDone: number; hintsUsed: number;
}

const defaultSave = (): SaveData => ({
  games: 0, totalWords: 0, bestScore: 0, totalScore: 0, bestCombo: 0,
  totalAttempts: 0, totalCorrect: 0, gridsCleared: 0, playTimeMs: 0,
  dailyStreak: 0, lastDaily: '', level: 1, xp: 0, skinIndex: 0, themeIndex: 0,
  masterVol: 80, sfxVol: 80, musicVol: 80, achievements: [], modesPlayed: [],
  themesUsed: [], leaderboard: [], catWords: {}, zenWords: 0, marathonGrids: 0,
  dailyDone: 0, hintsUsed: 0,
});

let save: SaveData;
function loadSave(): SaveData {
  try { const s = localStorage.getItem('neon-words-save'); return s ? { ...defaultSave(), ...JSON.parse(s) } : defaultSave(); }
  catch { return defaultSave(); }
}
function writeSave() { try { localStorage.setItem('neon-words-save', JSON.stringify(save)); } catch {} }

let phase: GamePhase = 'menu';
let mode = 'classic';
let difficulty = 'medium';
let gridSize = 10;
let grid: string[][] = [];
let placements: WordPlacement[] = [];
let foundCount = 0;
let score = 0;
let combo = 0;
let bestCombo = 0;
let lastFindTime = 0;
let gameTime = 0;
let timeLimit = 0; // 0 = no limit
let gameStartTime = 0;
let attempts = 0;
let correctAttempts = 0;
let marathonGrid = 0;
let countdownVal = 3;
let countdownTimer = 0;
let hoverR = -1, hoverC = -1;
let selectStartR = -1, selectStartC = -1;
let selecting = false;
let selectEndR = -1, selectEndC = -1;
let toastMsg = '';
let toastTimer = 0;
let achPage = 0;
let usedHints = false;
let sessionStartMs = 0;
let currentCategory = '';

// Found cells: color per cell for rendering
let foundCells: (string | null)[][] = [];
const FOUND_COLORS = ['#00aaff','#ff44aa','#44ff88','#ffaa00','#aa44ff','#ff4444','#44aaff','#aaff44','#ff88aa','#88aaff','#ffff44','#44ffff'];
let foundColorIdx = 0;

// ─── SEEDED PRNG ────────────────────────────────────────────
function mulberry32(a: number) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a); t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function dateSeed(): number {
  const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate();
}

// ─── GRID GENERATION ────────────────────────────────────────
function generateGrid(size: number, words: string[], dirs: [number,number][], rng: () => number): { grid: string[][]; placements: WordPlacement[] } {
  const g: string[][] = Array.from({length: size}, () => Array(size).fill(''));
  const placed: WordPlacement[] = [];

  for (const word of words) {
    let ok = false;
    for (let tries = 0; tries < 200 && !ok; tries++) {
      const dir = dirs[Math.floor(rng() * dirs.length)];
      const [dr, dc] = dir;
      const maxR = dr === 0 ? size : (dr > 0 ? size - word.length : size);
      const maxC = dc === 0 ? size : (dc > 0 ? size - word.length : size);
      const minR = dr < 0 ? word.length - 1 : 0;
      const minC = dc < 0 ? word.length - 1 : 0;
      if (maxR <= minR || maxC <= minC) continue;
      const sr = minR + Math.floor(rng() * (maxR - minR));
      const sc = minC + Math.floor(rng() * (maxC - minC));
      let fits = true;
      for (let i = 0; i < word.length; i++) {
        const r = sr + dr * i, c = sc + dc * i;
        if (r < 0 || r >= size || c < 0 || c >= size) { fits = false; break; }
        if (g[r][c] !== '' && g[r][c] !== word[i]) { fits = false; break; }
      }
      if (fits) {
        for (let i = 0; i < word.length; i++) g[sr + dr * i][sc + dc * i] = word[i];
        placed.push({ word, sr, sc, dr: dir[0], dc: dir[1], found: false });
        ok = true;
      }
    }
    if (!ok) { /* word couldn't be placed — skip it */ }
  }

  // Fill empty cells
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (g[r][c] === '') g[r][c] = String.fromCharCode(65 + Math.floor(rng() * 26));

  return { grid: g, placements: placed };
}

function pickWords(count: number, cat?: string, rng?: () => number): string[] {
  const r = rng || Math.random;
  let pool: string[];
  if (cat && CATEGORIES[cat]) {
    pool = [...CATEGORIES[cat]];
  } else {
    pool = [];
    for (const c of CAT_NAMES) pool.push(...CATEGORIES[c]);
  }
  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function getDirsForDifficulty(diff: string): [number,number][] {
  if (diff === 'easy') return DIR_HV;
  if (diff === 'medium') return DIR_HV.concat([[1,1],[1,-1]]);
  return DIR_ALL;
}

function getGridSize(diff: string): number {
  if (diff === 'easy') return 8;
  if (diff === 'medium') return 10;
  return 12;
}

function getWordCount(diff: string): number {
  if (diff === 'easy') return 6;
  if (diff === 'medium') return 8;
  return 10;
}

// ─── AUDIO ENGINE ───────────────────────────────────────────
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let droneOsc1: OscillatorNode | null = null;
let droneOsc2: OscillatorNode | null = null;
let droneLfo: OscillatorNode | null = null;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new AudioContext();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = save.masterVol / 100;
  masterGain.connect(audioCtx.destination);
  sfxGain = audioCtx.createGain();
  sfxGain.gain.value = save.sfxVol / 100;
  sfxGain.connect(masterGain);
  musicGain = audioCtx.createGain();
  musicGain.gain.value = save.musicVol / 100;
  musicGain.connect(masterGain);
}

function startDrone() {
  if (!audioCtx || !musicGain) return;
  if (droneOsc1) return;
  droneOsc1 = audioCtx.createOscillator();
  droneOsc1.type = 'sine'; droneOsc1.frequency.value = 55;
  const lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
  droneOsc1.connect(lp);
  droneOsc2 = audioCtx.createOscillator();
  droneOsc2.type = 'triangle'; droneOsc2.frequency.value = 82.5;
  const g2 = audioCtx.createGain(); g2.gain.value = 0.15;
  droneOsc2.connect(g2); g2.connect(lp);
  droneLfo = audioCtx.createOscillator();
  droneLfo.type = 'sine'; droneLfo.frequency.value = 0.15;
  const lfoG = audioCtx.createGain(); lfoG.gain.value = 0.08;
  droneLfo.connect(lfoG);
  const dg = audioCtx.createGain(); dg.gain.value = 0.12;
  lp.connect(dg); lfoG.connect(dg.gain); dg.connect(musicGain);
  droneOsc1.start(); droneOsc2.start(); droneLfo.start();
}

function stopDrone() {
  try { droneOsc1?.stop(); droneOsc2?.stop(); droneLfo?.stop(); } catch {}
  droneOsc1 = droneOsc2 = droneLfo = null;
}

function playSfx(freq: number, type: OscillatorType = 'sine', dur = 0.15, vol = 0.3) {
  if (!audioCtx || !sfxGain) return;
  const o = audioCtx.createOscillator();
  o.type = type; o.frequency.value = freq * (0.95 + Math.random() * 0.1);
  const g = audioCtx.createGain(); g.gain.value = vol;
  g.gain.setTargetAtTime(0, audioCtx.currentTime + dur * 0.7, dur * 0.2);
  o.connect(g); g.connect(sfxGain);
  o.start(); o.stop(audioCtx.currentTime + dur);
}

function playFound() {
  const base = 440 + foundCount * 40;
  playSfx(base, 'sine', 0.12, 0.3);
  setTimeout(() => playSfx(base * 1.25, 'triangle', 0.12, 0.25), 60);
  setTimeout(() => playSfx(base * 1.5, 'sine', 0.15, 0.2), 120);
  setTimeout(() => playSfx(base * 2, 'triangle', 0.2, 0.2), 180);
}

function playMiss() { playSfx(220, 'sawtooth', 0.2, 0.25); setTimeout(() => playSfx(165, 'sawtooth', 0.25, 0.2), 100); }
function playClick() { playSfx(880, 'sine', 0.06, 0.15); }
function playCountdown() { playSfx(660, 'sine', 0.1, 0.2); }
function playGo() { playSfx(880, 'sine', 0.15, 0.3); setTimeout(() => playSfx(1100, 'triangle', 0.2, 0.25), 80); }
function playAchievement() {
  [660,880,1100,1320,1760].forEach((f,i) => setTimeout(() => playSfx(f, 'sine', 0.12, 0.2), i * 60));
}
function playGameOver() {
  [880,660,440,330].forEach((f,i) => setTimeout(() => playSfx(f, 'triangle', 0.2, 0.2), i * 120));
}
function playCombo() { playSfx(660 + combo * 110, 'triangle', 0.1, 0.25); }
function playHover() { playSfx(1200, 'sine', 0.03, 0.08); }
function playSelect() { playSfx(550, 'sine', 0.08, 0.2); }

// ─── CANVAS GRID RENDERING ─────────────────────────────────
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let gridTexture: CanvasTexture;
const CANVAS_SIZE = 1024;

function initCanvas() {
  canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  ctx = canvas.getContext('2d')!;
  gridTexture = new CanvasTexture(canvas);
  gridTexture.minFilter = LinearFilter;
  gridTexture.magFilter = LinearFilter;
}

function renderGridCanvas() {
  if (!ctx || !grid.length) return;
  const t = THEMES[save.themeIndex];
  const cellSize = CANVAS_SIZE / gridSize;

  // Background
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Grid lines
  ctx.strokeStyle = t.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= gridSize; i++) {
    ctx.beginPath(); ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, CANVAS_SIZE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * cellSize); ctx.lineTo(CANVAS_SIZE, i * cellSize); ctx.stroke();
  }

  // Found word highlight cells
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (foundCells[r] && foundCells[r][c]) {
        ctx.fillStyle = foundCells[r][c]!;
        ctx.fillRect(c * cellSize + 2, r * cellSize + 2, cellSize - 4, cellSize - 4);
      }
    }
  }

  // Selection highlight (drag line)
  if (selecting && selectStartR >= 0 && selectEndR >= 0) {
    const cells = getLineCells(selectStartR, selectStartC, selectEndR, selectEndC);
    ctx.fillStyle = t.hover;
    for (const [cr, cc] of cells) {
      ctx.fillRect(cc * cellSize + 1, cr * cellSize + 1, cellSize - 2, cellSize - 2);
    }
  }

  // Hover highlight
  if (hoverR >= 0 && hoverR < gridSize && hoverC >= 0 && hoverC < gridSize && !selecting) {
    ctx.fillStyle = t.hover;
    ctx.fillRect(hoverC * cellSize, hoverR * cellSize, cellSize, cellSize);
  }

  // Letters
  const skinColor = SKINS[save.skinIndex]?.color || t.letter;
  ctx.font = `bold ${cellSize * 0.55}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const isFound = foundCells[r] && foundCells[r][c];
      ctx.fillStyle = isFound ? '#ffffff' : skinColor;
      ctx.shadowColor = isFound ? '#ffffff' : skinColor;
      ctx.shadowBlur = isFound ? 6 : 3;
      ctx.fillText(grid[r][c], c * cellSize + cellSize / 2, r * cellSize + cellSize / 2);
    }
  }
  ctx.shadowBlur = 0;

  // Outer border glow
  ctx.strokeStyle = t.accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(1, 1, CANVAS_SIZE - 2, CANVAS_SIZE - 2);

  gridTexture.needsUpdate = true;
}

function getLineCells(r1: number, c1: number, r2: number, c2: number): [number, number][] {
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);
  const len = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
  // Must be a valid line direction
  if (r1 === r2 || c1 === c2 || Math.abs(r2 - r1) === Math.abs(c2 - c1)) {
    const cells: [number, number][] = [];
    for (let i = 0; i <= len; i++) cells.push([r1 + dr * i, c1 + dc * i]);
    return cells;
  }
  return [];
}

// ─── GAME LOGIC ─────────────────────────────────────────────
function startGame(m: string, diff: string, cat?: string) {
  initAudio();
  mode = m;
  difficulty = diff;
  currentCategory = cat || '';
  gridSize = getGridSize(diff);
  const wordCount = getWordCount(diff);
  const dirs = getDirsForDifficulty(diff);

  let rng = Math.random;
  if (m === 'daily') {
    rng = mulberry32(dateSeed());
  }

  const words = pickWords(wordCount, m === 'category' ? cat : undefined, rng);
  const result = generateGrid(gridSize, words, dirs, rng);
  grid = result.grid;
  placements = result.placements;
  foundCount = 0;
  score = 0;
  combo = 0;
  bestCombo = 0;
  lastFindTime = 0;
  attempts = 0;
  correctAttempts = 0;
  usedHints = false;
  foundColorIdx = 0;
  foundCells = Array.from({length: gridSize}, () => Array(gridSize).fill(null));
  selectStartR = selectStartC = selectEndR = selectEndC = -1;
  selecting = false;
  hoverR = hoverC = -1;

  // Time limits
  if (m === 'timed') {
    timeLimit = diff === 'easy' ? 90 : diff === 'medium' ? 75 : 60;
  } else if (m === 'race') {
    timeLimit = 0; // no limit, but we track time
  } else {
    timeLimit = 0;
  }
  gameTime = 0;
  gameStartTime = Date.now();
  sessionStartMs = Date.now();

  if (!save.modesPlayed.includes(m)) save.modesPlayed.push(m);
  if (!save.themesUsed.includes(save.themeIndex)) save.themesUsed.push(save.themeIndex);
  writeSave();

  // Start countdown
  countdownVal = 3;
  countdownTimer = 0;
  phase = 'countdown';
  renderGridCanvas();
}

function checkSelection(r1: number, c1: number, r2: number, c2: number): boolean {
  attempts++;
  const cells = getLineCells(r1, c1, r2, c2);
  if (cells.length < 2) { playMiss(); return false; }

  const selectedWord = cells.map(([r,c]) => grid[r][c]).join('');

  for (const p of placements) {
    if (p.found) continue;
    const pCells = getLineCells(p.sr, p.sc, p.sr + p.dr * (p.word.length - 1), p.sc + p.dc * (p.word.length - 1));
    if (pCells.length !== cells.length) continue;
    const match = pCells.every(([pr,pc], i) => cells[i][0] === pr && cells[i][1] === pc);
    const reverseMatch = pCells.every(([pr,pc], i) => cells[cells.length - 1 - i][0] === pr && cells[cells.length - 1 - i][1] === pc);

    if (match || reverseMatch) {
      // Found!
      p.found = true;
      foundCount++;
      correctAttempts++;
      const color = FOUND_COLORS[foundColorIdx % FOUND_COLORS.length];
      foundColorIdx++;
      for (const [cr, cc] of pCells) foundCells[cr][cc] = color;

      // Combo
      const now = Date.now();
      if (lastFindTime > 0 && (now - lastFindTime) < 10000) {
        combo++;
      } else {
        combo = 1;
      }
      lastFindTime = now;
      if (combo > bestCombo) bestCombo = combo;

      // Score
      const baseScore = 100 * (difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2);
      const comboMult = Math.min(combo, 5);
      const wordScore = Math.round(baseScore * comboMult);
      score += wordScore;

      // Track category words
      for (const [catName, catWords] of Object.entries(CATEGORIES)) {
        if (catWords.includes(p.word)) {
          save.catWords[catName] = (save.catWords[catName] || 0) + 1;
        }
      }
      save.totalWords++;
      if (mode === 'zen') save.zenWords++;

      playFound();
      if (combo >= 2) playCombo();
      showToast(`${p.word} +${wordScore}` + (combo >= 2 ? ` x${combo}` : ''));

      checkAchievements();
      renderGridCanvas();

      // Check win
      if (foundCount >= placements.length) {
        setTimeout(() => endGame(true), 500);
      }
      return true;
    }
  }

  playMiss();
  return false;
}

function giveHint() {
  if (mode !== 'practice' && mode !== 'zen') return;
  usedHints = true;
  save.hintsUsed++;
  for (const p of placements) {
    if (!p.found) {
      // Flash the first letter
      const r = p.sr, c = p.sc;
      foundCells[r][c] = '#ffff0066';
      renderGridCanvas();
      setTimeout(() => {
        if (!p.found) foundCells[r][c] = null;
        renderGridCanvas();
      }, 2000);
      showToast('Hint: look near the flash!');
      playSfx(440, 'triangle', 0.15, 0.2);
      break;
    }
  }
}

function endGame(won: boolean) {
  phase = 'gameover';
  const elapsed = (Date.now() - gameStartTime) / 1000;
  gameTime = elapsed;

  save.games++;
  save.totalScore += score;
  if (score > save.bestScore) save.bestScore = score;
  if (bestCombo > save.bestCombo) save.bestCombo = bestCombo;
  save.totalAttempts += attempts;
  save.totalCorrect += correctAttempts;
  save.playTimeMs += Date.now() - sessionStartMs;

  if (won) {
    save.gridsCleared++;
    if (mode === 'marathon') {
      save.marathonGrids++;
    }
    if (mode === 'daily') {
      save.dailyDone++;
      const today = new Date().toISOString().split('T')[0];
      if (save.lastDaily !== today) {
        save.dailyStreak++;
        save.lastDaily = today;
      }
    }
  }

  // XP
  const xpGain = Math.round(score / 10 + foundCount * 5);
  save.xp += xpGain;
  const xpForLevel = (l: number) => 100 + 50 * l;
  while (save.xp >= xpForLevel(save.level) && save.level < 50) {
    save.xp -= xpForLevel(save.level);
    save.level++;
    showToast(`Level up! Level ${save.level}`);
  }

  // Leaderboard
  save.leaderboard.push({ score, mode, date: new Date().toISOString().split('T')[0], words: foundCount });
  save.leaderboard.sort((a, b) => b.score - a.score);
  if (save.leaderboard.length > 20) save.leaderboard.length = 20;

  checkAchievements();
  writeSave();
  playGameOver();
  stopDrone();
}

function checkAchievements() {
  const earned: string[] = [];
  const check = (id: string, cond: boolean) => { if (cond && !save.achievements.includes(id)) { save.achievements.push(id); earned.push(id); } };

  check('first_find', save.totalWords >= 1);
  check('sharp_eye', save.totalWords >= 10);
  check('word_hunter', save.totalWords >= 50);
  check('lexicon', save.totalWords >= 100);
  check('wordsmith', save.totalWords >= 500);
  check('speed_reader', lastFindTime > 0 && (Date.now() - gameStartTime) < 3000 && foundCount > 0);
  check('combo_x2', bestCombo >= 2);
  check('combo_x3', bestCombo >= 3);
  check('max_combo', bestCombo >= 5);
  check('perfect_grid', placements.length > 0 && foundCount >= placements.length);
  check('score_1k', score >= 1000);
  check('score_5k', score >= 5000);
  check('score_10k', score >= 10000);
  check('easy_win', difficulty === 'easy' && foundCount >= placements.length);
  check('medium_win', difficulty === 'medium' && foundCount >= placements.length);
  check('hard_win', difficulty === 'hard' && foundCount >= placements.length);
  check('all_modes', save.modesPlayed.length >= 8);
  check('games_10', save.games >= 10);
  check('games_50', save.games >= 50);
  check('games_100', save.games >= 100);
  check('daily_done', save.dailyDone >= 1);
  check('daily_3', save.dailyDone >= 3);
  check('daily_7', save.dailyDone >= 7);
  check('marathon_5', save.marathonGrids >= 5);
  check('category_master', mode === 'category' && foundCount >= placements.length);
  check('animal_expert', (save.catWords['ANIMALS'] || 0) >= 20);
  check('space_explorer', (save.catWords['SPACE'] || 0) >= 20);
  check('foodie', (save.catWords['FOOD'] || 0) >= 20);
  check('tech_guru', (save.catWords['TECH'] || 0) >= 20);
  check('speed_demon', mode === 'timed' && timeLimit > 0 && (timeLimit - gameTime) >= 30 && foundCount >= placements.length);
  check('race_winner', mode === 'race' && gameTime < 60 && foundCount >= placements.length);
  check('zen_master', save.zenWords >= 50);
  check('theme_explorer', save.themesUsed.length >= THEMES.length);
  check('accuracy_100', attempts > 0 && correctAttempts === attempts && foundCount >= placements.length);
  check('no_hints', difficulty === 'hard' && !usedHints && foundCount >= placements.length);
  check('persistence', save.playTimeMs >= 30 * 60 * 1000);
  check('big_grid', difficulty === 'hard' && foundCount >= placements.length);
  check('legend', save.level >= 50);

  if (earned.length > 0) {
    playAchievement();
    for (const id of earned) {
      const a = ACHIEVEMENTS.find(a => a.id === id);
      if (a) showToast(`Achievement: ${a.name}!`);
    }
    writeSave();
  }
}

function showToast(msg: string) {
  toastMsg = msg;
  toastTimer = 2.5;
}

// ─── 3D SCENE SETUP ────────────────────────────────────────
let world: World;
let gridMesh: Mesh;
let gridGroup: Group;
const raycaster = new Raycaster();
const mouse = new Vector2();
let mouseDown = false;

function buildHolodeck(scene: any, t: Theme) {
  // Floor grid
  const floorGeo = new PlaneGeometry(20, 20);
  const floorMat = new MeshBasicMaterial({ color: new Color(t.wall), transparent: true, opacity: 0.3 });
  const floor = new Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);

  // Grid lines on floor
  const lineColor = new Color(t.grid);
  for (let i = -10; i <= 10; i++) {
    const mat = new LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0.2 });
    const pts = [new Vector3(i, 0.01, -10), new Vector3(i, 0.01, 10)];
    const geo = new PlaneGeometry(0.02, 20);
    const line = new Mesh(geo, new MeshBasicMaterial({ color: lineColor, transparent: true, opacity: 0.15 }));
    line.rotation.x = -Math.PI / 2; line.position.set(i, 0.01, 0);
    scene.add(line);
    const line2 = new Mesh(new PlaneGeometry(20, 0.02), new MeshBasicMaterial({ color: lineColor, transparent: true, opacity: 0.15 }));
    line2.rotation.x = -Math.PI / 2; line2.position.set(0, 0.01, i);
    scene.add(line2);
  }

  // Ceiling grid
  const ceiling = new Mesh(new PlaneGeometry(20, 20), new MeshBasicMaterial({ color: new Color(t.wall), transparent: true, opacity: 0.15 }));
  ceiling.rotation.x = Math.PI / 2; ceiling.position.y = 4;
  scene.add(ceiling);

  // Floating decorations
  const decoShapes = [
    () => new TorusGeometry(0.15, 0.04, 8, 16),
    () => new BoxGeometry(0.2, 0.2, 0.2),
    () => new SphereGeometry(0.12, 8, 8),
    () => new ConeGeometry(0.1, 0.25, 6),
  ];
  const accentColor = new Color(t.accent);
  for (let i = 0; i < 14; i++) {
    const shape = decoShapes[i % decoShapes.length]();
    const wire = new WireframeGeometry(shape);
    const deco = new LineSegments(wire, new LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.3 }));
    deco.position.set(
      (Math.random() - 0.5) * 12,
      0.5 + Math.random() * 3,
      (Math.random() - 0.5) * 12
    );
    deco.userData.baseY = deco.position.y;
    deco.userData.rotSpeed = 0.3 + Math.random() * 0.5;
    deco.userData.bobSpeed = 0.5 + Math.random() * 0.5;
    deco.userData.bobAmp = 0.1 + Math.random() * 0.15;
    scene.add(deco);
  }

  // Lighting
  scene.add(new AmbientLight(new Color(t.accent), 0.3));
  const dirLight = new DirectionalLight(new Color('#ffffff'), 0.5);
  dirLight.position.set(2, 4, 3);
  scene.add(dirLight);
  const pl1 = new PointLight(new Color(t.accent), 0.6, 10);
  pl1.position.set(-3, 2, -3); scene.add(pl1);
  const pl2 = new PointLight(new Color('#ff44ff'), 0.3, 10);
  pl2.position.set(3, 2, -3); scene.add(pl2);

  // Fog
  scene.fog = new FogExp2(new Color(t.fog).getHex(), 0.06);
}

// ─── PARTICLES ──────────────────────────────────────────────
interface Particle { mesh: Mesh; vx: number; vy: number; vz: number; life: number; maxLife: number; }
const particles: Particle[] = [];
const MAX_PARTICLES = 150;

function initParticles(scene: any) {
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const m = new Mesh(
      new SphereGeometry(0.015, 4, 4),
      new MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0, blending: AdditiveBlending })
    );
    m.visible = false;
    scene.add(m);
    particles.push({ mesh: m, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 0 });
  }
}

function emitParticles(x: number, y: number, z: number, color: string, count: number) {
  const c = new Color(color);
  let spawned = 0;
  for (const p of particles) {
    if (spawned >= count) break;
    if (p.life <= 0) {
      p.mesh.visible = true;
      p.mesh.position.set(x, y, z);
      (p.mesh.material as MeshBasicMaterial).color.copy(c);
      (p.mesh.material as MeshBasicMaterial).opacity = 1;
      p.vx = (Math.random() - 0.5) * 2;
      p.vy = Math.random() * 2 + 0.5;
      p.vz = (Math.random() - 0.5) * 2;
      p.life = 0.8 + Math.random() * 0.4;
      p.maxLife = p.life;
      spawned++;
    }
  }
}

function updateParticles(delta: number) {
  for (const p of particles) {
    if (p.life <= 0) continue;
    p.life -= delta;
    p.mesh.position.x += p.vx * delta;
    p.mesh.position.y += p.vy * delta;
    p.mesh.position.z += p.vz * delta;
    p.vy -= 3 * delta; // gravity
    const frac = Math.max(0, p.life / p.maxLife);
    (p.mesh.material as MeshBasicMaterial).opacity = frac;
    if (p.life <= 0) p.mesh.visible = false;
  }
}

// ─── PANEL VISIBILITY ───────────────────────────────────────
const panelEntities: Record<string, any> = {};
function showPanel(name: string) {
  for (const [n, e] of Object.entries(panelEntities)) {
    if (e && e.object3D) e.object3D.visible = (n === name || n === 'hud' || n === 'wordlist' || n === 'toast' || n === 'countdown');
  }
  // Only show HUD/wordlist/toast/countdown during gameplay
  if (panelEntities.hud?.object3D) panelEntities.hud.object3D.visible = (phase === 'playing' || phase === 'paused');
  if (panelEntities.wordlist?.object3D) panelEntities.wordlist.object3D.visible = (phase === 'playing' || phase === 'paused');
  if (panelEntities.toast?.object3D) panelEntities.toast.object3D.visible = toastTimer > 0;
  if (panelEntities.countdown?.object3D) panelEntities.countdown.object3D.visible = phase === 'countdown';
}

// ─── ECS SYSTEMS ────────────────────────────────────────────
class GameSystem extends createSystem({}) {
  update(delta: number, time: number) {
    // Countdown
    if (phase === 'countdown') {
      countdownTimer += delta;
      if (countdownTimer >= 1) {
        countdownTimer -= 1;
        countdownVal--;
        if (countdownVal <= 0) {
          phase = 'playing';
          gameStartTime = Date.now();
          startDrone();
          showPanel('');
          if (gridMesh) gridMesh.visible = true;
        } else {
          playCountdown();
        }
      }
      return;
    }

    // Game timer
    if (phase === 'playing') {
      gameTime = (Date.now() - gameStartTime) / 1000;
      if (timeLimit > 0 && gameTime >= timeLimit) {
        endGame(false);
        return;
      }

      // Combo decay
      if (combo > 0 && lastFindTime > 0 && (Date.now() - lastFindTime) > 10000) {
        combo = 0;
      }

      // Handle keyboard input
      const kb = (world.input as any)?.keyboard;
      if (kb) {
        if (kb.getKeyPressed?.('Escape') || kb.getKeyPressed?.('KeyP')) {
          phase = 'paused';
          showPanel('pause');
        }
        if (kb.getKeyPressed?.('KeyH')) {
          giveHint();
        }
      }

      // Handle mouse raycasting on grid
      if (gridMesh && gridMesh.visible) {
        raycaster.setFromCamera(mouse, world.camera);
        const hits = raycaster.intersectObject(gridMesh);
        if (hits.length > 0 && hits[0].uv) {
          const uv = hits[0].uv;
          const newC = Math.floor(uv.x * gridSize);
          const newR = Math.floor((1 - uv.y) * gridSize);
          if (newR >= 0 && newR < gridSize && newC >= 0 && newC < gridSize) {
            if (newR !== hoverR || newC !== hoverC) {
              hoverR = newR; hoverC = newC;
              if (selecting) { selectEndR = newR; selectEndC = newC; }
              renderGridCanvas();
            }
          }
        } else {
          if (hoverR >= 0) { hoverR = hoverC = -1; renderGridCanvas(); }
        }
      }
    }

    // Update particles
    updateParticles(delta);

    // Toast timer
    if (toastTimer > 0) {
      toastTimer -= delta;
      if (panelEntities.toast?.object3D) panelEntities.toast.object3D.visible = toastTimer > 0;
    }

    // Animate decorations
    if (world.scene) {
      for (const obj of world.scene.children) {
        if (obj.userData.rotSpeed) {
          obj.rotation.y += obj.userData.rotSpeed * delta;
          obj.rotation.x += obj.userData.rotSpeed * 0.3 * delta;
        }
        if (obj.userData.bobSpeed) {
          obj.position.y = obj.userData.baseY + Math.sin(time * obj.userData.bobSpeed) * obj.userData.bobAmp;
        }
      }
    }
  }
}

class GameUISystem extends createSystem({
  menu: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/menu.json')] },
  modeselect: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/modeselect.json')] },
  difficulty: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/difficulty.json')] },
  hud: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/hud.json')] },
  wordlist: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/wordlist.json')] },
  pause: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/pause.json')] },
  gameover: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/gameover.json')] },
  leaderboard: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/leaderboard.json')] },
  achvlist: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/achvlist.json')] },
  settings: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/settings.json')] },
  stats: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/stats.json')] },
  help: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/help.json')] },
  toast: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/toast.json')] },
  countdown: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/countdown.json')] },
  skins: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/skins.json')] },
}) {
  init() {
    const getDoc = (e: any) => (PanelDocument as any).data.document[e.index] as UIKitDocument | undefined;
    const setText = (e: any, id: string, text: string) =>
      (getDoc(e)?.getElementById(id) as UIKit.Text | undefined)?.setProperties({ text });
    const onClick = (e: any, id: string, fn: () => void) =>
      (getDoc(e)?.getElementById(id) as UIKit.Text | undefined)?.addEventListener('click', fn);

    // ─── MENU ─────────────────────────────
    this.queries.menu.subscribe('qualify', (e) => {
      panelEntities.menu = e;
      setText(e, 'level-display', `Level ${save.level} - ${save.xp} XP`);
      onClick(e, 'btn-play', () => { playClick(); phase = 'modeselect'; showPanel('modeselect'); });
      onClick(e, 'btn-scores', () => { playClick(); phase = 'leaderboard'; updateLeaderboard(); showPanel('leaderboard'); });
      onClick(e, 'btn-achievements', () => { playClick(); phase = 'achievements'; achPage = 0; updateAchievements(); showPanel('achvlist'); });
      onClick(e, 'btn-stats', () => { playClick(); phase = 'stats'; updateStats(); showPanel('stats'); });
      onClick(e, 'btn-skins', () => { playClick(); phase = 'skins'; updateSkins(); showPanel('skins'); });
      onClick(e, 'btn-settings', () => { playClick(); phase = 'settings'; updateSettings(); showPanel('settings'); });
      onClick(e, 'btn-help', () => { playClick(); phase = 'help'; showPanel('help'); });
      showPanel('menu');
    });

    // ─── MODE SELECT ──────────────────────
    this.queries.modeselect.subscribe('qualify', (e) => {
      panelEntities.modeselect = e;
      const modes = ['classic','timed','race','category','daily','zen','marathon','practice'];
      for (const m of modes) {
        onClick(e, `btn-${m}`, () => {
          playClick();
          mode = m;
          if (m === 'category') {
            // Pick random category for now
            currentCategory = CAT_NAMES[Math.floor(Math.random() * CAT_NAMES.length)];
          }
          phase = 'difficulty'; showPanel('difficulty');
        });
      }
      onClick(e, 'btn-back', () => { playClick(); phase = 'menu'; showPanel('menu'); });
    });

    // ─── DIFFICULTY ───────────────────────
    this.queries.difficulty.subscribe('qualify', (e) => {
      panelEntities.difficulty = e;
      onClick(e, 'btn-easy', () => { playClick(); startGame(mode, 'easy', currentCategory); });
      onClick(e, 'btn-medium', () => { playClick(); startGame(mode, 'medium', currentCategory); });
      onClick(e, 'btn-hard', () => { playClick(); startGame(mode, 'hard', currentCategory); });
      onClick(e, 'btn-back', () => { playClick(); phase = 'modeselect'; showPanel('modeselect'); });
    });

    // ─── HUD ──────────────────────────────
    this.queries.hud.subscribe('qualify', (e) => {
      panelEntities.hud = e;
    });

    // ─── WORD LIST ────────────────────────
    this.queries.wordlist.subscribe('qualify', (e) => {
      panelEntities.wordlist = e;
    });

    // ─── PAUSE ────────────────────────────
    this.queries.pause.subscribe('qualify', (e) => {
      panelEntities.pause = e;
      onClick(e, 'btn-resume', () => { playClick(); phase = 'playing'; showPanel(''); });
      onClick(e, 'btn-quit', () => { playClick(); endGame(false); });
    });

    // ─── GAME OVER ────────────────────────
    this.queries.gameover.subscribe('qualify', (e) => {
      panelEntities.gameover = e;
      onClick(e, 'btn-rematch', () => { playClick(); startGame(mode, difficulty, currentCategory); });
      onClick(e, 'btn-menu', () => { playClick(); phase = 'menu'; if (gridMesh) gridMesh.visible = false; showPanel('menu'); });
    });

    // ─── LEADERBOARD ──────────────────────
    this.queries.leaderboard.subscribe('qualify', (e) => {
      panelEntities.leaderboard = e;
      onClick(e, 'btn-back', () => { playClick(); phase = 'menu'; showPanel('menu'); });
    });

    // ─── ACHIEVEMENTS ─────────────────────
    this.queries.achvlist.subscribe('qualify', (e) => {
      panelEntities.achvlist = e;
      onClick(e, 'btn-prev', () => { if (achPage > 0) { achPage--; updateAchievements(); playClick(); }});
      onClick(e, 'btn-next', () => { const maxP = Math.ceil(ACHIEVEMENTS.length / 15) - 1; if (achPage < maxP) { achPage++; updateAchievements(); playClick(); }});
      onClick(e, 'btn-back', () => { playClick(); phase = 'menu'; showPanel('menu'); });
    });

    // ─── SETTINGS ─────────────────────────
    this.queries.settings.subscribe('qualify', (e) => {
      panelEntities.settings = e;
      const volBtns = [
        ['master', () => save.masterVol, (v: number) => { save.masterVol = v; if (masterGain) masterGain.gain.value = v / 100; }],
        ['sfx', () => save.sfxVol, (v: number) => { save.sfxVol = v; if (sfxGain) sfxGain.gain.value = v / 100; }],
        ['music', () => save.musicVol, (v: number) => { save.musicVol = v; if (musicGain) musicGain.gain.value = v / 100; }],
      ] as const;
      for (const [key, getter, setter] of volBtns) {
        onClick(e, `btn-${key}-down`, () => { const v = Math.max(0, (getter as any)() - 10); (setter as any)(v); setText(e, `${key}-vol`, String(v)); writeSave(); playClick(); });
        onClick(e, `btn-${key}-up`, () => { const v = Math.min(100, (getter as any)() + 10); (setter as any)(v); setText(e, `${key}-vol`, String(v)); writeSave(); playClick(); });
      }
      onClick(e, 'btn-theme-prev', () => { save.themeIndex = (save.themeIndex - 1 + THEMES.length) % THEMES.length; updateSettings(); writeSave(); playClick(); });
      onClick(e, 'btn-theme-next', () => { save.themeIndex = (save.themeIndex + 1) % THEMES.length; updateSettings(); writeSave(); playClick(); });
      onClick(e, 'btn-back', () => { playClick(); phase = 'menu'; showPanel('menu'); });
    });

    // ─── STATS ────────────────────────────
    this.queries.stats.subscribe('qualify', (e) => {
      panelEntities.stats = e;
      onClick(e, 'btn-back', () => { playClick(); phase = 'menu'; showPanel('menu'); });
    });

    // ─── HELP ─────────────────────────────
    this.queries.help.subscribe('qualify', (e) => {
      panelEntities.help = e;
      onClick(e, 'btn-back', () => { playClick(); phase = 'menu'; showPanel('menu'); });
    });

    // ─── TOAST ────────────────────────────
    this.queries.toast.subscribe('qualify', (e) => {
      panelEntities.toast = e;
      if (e.object3D) e.object3D.visible = false;
    });

    // ─── COUNTDOWN ────────────────────────
    this.queries.countdown.subscribe('qualify', (e) => {
      panelEntities.countdown = e;
      if (e.object3D) e.object3D.visible = false;
    });

    // ─── SKINS ────────────────────────────
    this.queries.skins.subscribe('qualify', (e) => {
      panelEntities.skins = e;
      for (let i = 0; i < 8; i++) {
        const idx = i;
        onClick(e, `s${i}`, () => {
          if (isSkinUnlocked(idx)) {
            save.skinIndex = idx;
            writeSave();
            updateSkins();
            playClick();
            if (phase === 'playing') renderGridCanvas();
          }
        });
      }
      onClick(e, 'btn-back', () => { playClick(); phase = 'menu'; showPanel('menu'); });
    });
  }

  update() {
    const getDoc = (e: any) => (PanelDocument as any).data.document[e.index] as UIKitDocument | undefined;
    const setText = (e: any, id: string, text: string) =>
      (getDoc(e)?.getElementById(id) as UIKit.Text | undefined)?.setProperties({ text });

    // Update HUD
    if (phase === 'playing' && panelEntities.hud) {
      setText(panelEntities.hud, 'score', String(score));
      setText(panelEntities.hud, 'words', `${foundCount}/${placements.length}`);
      setText(panelEntities.hud, 'combo', combo >= 2 ? `x${combo}` : 'x1');
      setText(panelEntities.hud, 'mode', mode.toUpperCase());
      if (timeLimit > 0) {
        const remaining = Math.max(0, timeLimit - gameTime);
        setText(panelEntities.hud, 'time', `${Math.floor(remaining)}s`);
      } else {
        setText(panelEntities.hud, 'time', `${Math.floor(gameTime)}s`);
      }
    }

    // Update word list
    if ((phase === 'playing' || phase === 'paused') && panelEntities.wordlist) {
      for (let i = 0; i < 12; i++) {
        if (i < placements.length) {
          const p = placements[i];
          const prefix = p.found ? '[X] ' : '[ ] ';
          setText(panelEntities.wordlist, `w${i}`, prefix + p.word);
        } else {
          setText(panelEntities.wordlist, `w${i}`, '');
        }
      }
    }

    // Update toast
    if (toastTimer > 0 && panelEntities.toast) {
      setText(panelEntities.toast, 'msg', toastMsg);
    }

    // Update countdown
    if (phase === 'countdown' && panelEntities.countdown) {
      setText(panelEntities.countdown, 'count', countdownVal > 0 ? String(countdownVal) : 'FIND!');
    }

    // Update gameover
    if (phase === 'gameover' && panelEntities.gameover) {
      const won = foundCount >= placements.length;
      setText(panelEntities.gameover, 'result-title', won ? 'COMPLETE!' : 'TIME UP!');
      setText(panelEntities.gameover, 'result-mode', `${mode.toUpperCase()} - ${difficulty.toUpperCase()}`);
      setText(panelEntities.gameover, 'stat-score', `Score: ${score}`);
      setText(panelEntities.gameover, 'stat-words', `Words: ${foundCount}/${placements.length}`);
      const acc = attempts > 0 ? Math.round((correctAttempts / attempts) * 100) : 0;
      setText(panelEntities.gameover, 'stat-accuracy', `Accuracy: ${acc}%`);
      setText(panelEntities.gameover, 'stat-combo', `Best Combo: x${bestCombo}`);
      const mins = Math.floor(gameTime / 60);
      const secs = Math.floor(gameTime % 60);
      setText(panelEntities.gameover, 'stat-time', `Time: ${mins}:${secs < 10 ? '0' : ''}${secs}`);
      showPanel('gameover');
    }
  }
}

function updateLeaderboard() {
  if (!panelEntities.leaderboard) return;
  const getDoc = (e: any) => (PanelDocument as any).data.document[e.index] as UIKitDocument | undefined;
  const setText = (e: any, id: string, text: string) =>
    (getDoc(e)?.getElementById(id) as UIKit.Text | undefined)?.setProperties({ text });
  for (let i = 0; i < 10; i++) {
    if (i < save.leaderboard.length) {
      const entry = save.leaderboard[i];
      setText(panelEntities.leaderboard, `r${i}`, `${i+1}. ${entry.score} - ${entry.mode} (${entry.words}w) ${entry.date}`);
    } else {
      setText(panelEntities.leaderboard, `r${i}`, `${i+1}. ---`);
    }
  }
}

function updateAchievements() {
  if (!panelEntities.achvlist) return;
  const getDoc = (e: any) => (PanelDocument as any).data.document[e.index] as UIKitDocument | undefined;
  const setText = (e: any, id: string, text: string) =>
    (getDoc(e)?.getElementById(id) as UIKit.Text | undefined)?.setProperties({ text });
  const maxPage = Math.ceil(ACHIEVEMENTS.length / 15) - 1;
  setText(panelEntities.achvlist, 'page', `Page ${achPage + 1}/${maxPage + 1}`);
  for (let i = 0; i < 15; i++) {
    const idx = achPage * 15 + i;
    if (idx < ACHIEVEMENTS.length) {
      const a = ACHIEVEMENTS[idx];
      const done = save.achievements.includes(a.id);
      setText(panelEntities.achvlist, `a${i}`, `${done ? '[X]' : '[ ]'} ${a.name}: ${a.desc}`);
    } else {
      setText(panelEntities.achvlist, `a${i}`, '');
    }
  }
}

function updateSettings() {
  if (!panelEntities.settings) return;
  const getDoc = (e: any) => (PanelDocument as any).data.document[e.index] as UIKitDocument | undefined;
  const setText = (e: any, id: string, text: string) =>
    (getDoc(e)?.getElementById(id) as UIKit.Text | undefined)?.setProperties({ text });
  setText(panelEntities.settings, 'master-vol', String(save.masterVol));
  setText(panelEntities.settings, 'sfx-vol', String(save.sfxVol));
  setText(panelEntities.settings, 'music-vol', String(save.musicVol));
  setText(panelEntities.settings, 'theme-name', THEMES[save.themeIndex].name);
}

function updateStats() {
  if (!panelEntities.stats) return;
  const getDoc = (e: any) => (PanelDocument as any).data.document[e.index] as UIKitDocument | undefined;
  const setText = (e: any, id: string, text: string) =>
    (getDoc(e)?.getElementById(id) as UIKit.Text | undefined)?.setProperties({ text });
  const acc = save.totalAttempts > 0 ? Math.round((save.totalCorrect / save.totalAttempts) * 100) : 0;
  const mins = Math.round(save.playTimeMs / 60000);
  setText(panelEntities.stats, 's0', `Games Played: ${save.games}`);
  setText(panelEntities.stats, 's1', `Words Found: ${save.totalWords}`);
  setText(panelEntities.stats, 's2', `Best Score: ${save.bestScore}`);
  setText(panelEntities.stats, 's3', `Total Score: ${save.totalScore}`);
  setText(panelEntities.stats, 's4', `Best Combo: x${save.bestCombo}`);
  setText(panelEntities.stats, 's5', `Accuracy: ${acc}%`);
  setText(panelEntities.stats, 's6', `Grids Cleared: ${save.gridsCleared}`);
  setText(panelEntities.stats, 's7', `Play Time: ${mins}m`);
  setText(panelEntities.stats, 's8', `Daily Streak: ${save.dailyStreak}`);
  setText(panelEntities.stats, 's9', `Level: ${save.level}`);
}

function isSkinUnlocked(idx: number): boolean {
  if (idx === 0) return true;
  const s = SKINS[idx];
  if (s.unlock === '50 words') return save.totalWords >= 50;
  if (s.unlock === '5K score') return save.bestScore >= 5000;
  if (s.unlock === '10 games') return save.games >= 10;
  if (s.unlock === 'x3 combo') return save.bestCombo >= 3;
  if (s.unlock === 'clear grid') return save.gridsCleared >= 1;
  if (s.unlock === '80% acc') return save.totalAttempts > 0 && (save.totalCorrect / save.totalAttempts) >= 0.8;
  if (s.unlock === 'all modes') return save.modesPlayed.length >= 8;
  return false;
}

function updateSkins() {
  if (!panelEntities.skins) return;
  const getDoc = (e: any) => (PanelDocument as any).data.document[e.index] as UIKitDocument | undefined;
  const setText = (e: any, id: string, text: string) =>
    (getDoc(e)?.getElementById(id) as UIKit.Text | undefined)?.setProperties({ text });
  for (let i = 0; i < 8; i++) {
    const s = SKINS[i];
    const unlocked = isSkinUnlocked(i);
    const equipped = save.skinIndex === i;
    let label = s.name;
    if (equipped) label += ' [EQUIPPED]';
    else if (!unlocked) label += ` [${s.unlock}]`;
    setText(panelEntities.skins, `s${i}`, label);
  }
}

// ─── MOUSE HANDLERS ─────────────────────────────────────────
function onMouseMove(ev: MouseEvent) {
  const container = document.getElementById('app');
  if (!container) return;
  const rect = container.getBoundingClientRect();
  mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
}

function onMouseDown(ev: MouseEvent) {
  if (phase !== 'playing' || !gridMesh?.visible) return;
  initAudio();
  if (hoverR >= 0 && hoverR < gridSize && hoverC >= 0 && hoverC < gridSize) {
    selectStartR = hoverR;
    selectStartC = hoverC;
    selectEndR = hoverR;
    selectEndC = hoverC;
    selecting = true;
    mouseDown = true;
    playSelect();
    renderGridCanvas();
  }
}

function onMouseUp(ev: MouseEvent) {
  if (!selecting || phase !== 'playing') { selecting = false; mouseDown = false; return; }
  mouseDown = false;
  selecting = false;
  if (selectStartR >= 0 && selectEndR >= 0) {
    checkSelection(selectStartR, selectStartC, selectEndR, selectEndC);
  }
  selectStartR = selectStartC = selectEndR = selectEndC = -1;
  renderGridCanvas();
}

function onKeyDown(ev: KeyboardEvent) {
  if (phase === 'playing') {
    if (ev.key === 'Escape' || ev.key === 'p') { phase = 'paused'; showPanel('pause'); }
    if (ev.key === 'h') giveHint();
  } else if (phase === 'paused') {
    if (ev.key === 'Escape' || ev.key === 'p') { phase = 'playing'; showPanel(''); }
  } else if (phase === 'gameover') {
    if (ev.key === 'r') startGame(mode, difficulty, currentCategory);
  }
}

// ─── MAIN ───────────────────────────────────────────────────
async function main() {
  save = loadSave();
  initCanvas();

  const container = document.getElementById('app') as HTMLDivElement;
  if (!container) return;

  world = await World.create(container, {
    xr: { offer: 'once' as const },
    browserControls: true,
  } as any);

  const t = THEMES[save.themeIndex];
  buildHolodeck(world.scene, t);
  initParticles(world.scene);

  // Grid mesh (hidden initially)
  const gridWorldSize = 2.2;
  const gridGeo = new PlaneGeometry(gridWorldSize, gridWorldSize);
  const gridMat = new MeshBasicMaterial({ map: gridTexture, transparent: true, side: DoubleSide });
  gridMesh = new Mesh(gridGeo, gridMat);
  gridMesh.position.set(0, 1.5, -2.5);
  gridMesh.visible = false;
  world.scene.add(gridMesh);

  // Grid border glow
  const borderGeo = new PlaneGeometry(gridWorldSize + 0.08, gridWorldSize + 0.08);
  const borderMat = new MeshBasicMaterial({ color: new Color(t.accent), transparent: true, opacity: 0.15, blending: AdditiveBlending });
  const borderMesh = new Mesh(borderGeo, borderMat);
  borderMesh.position.set(0, 1.5, -2.51);
  world.scene.add(borderMesh);

  // Create PanelUI entities
  const panelConfigs = [
    { config: './ui/menu.json', pos: [0, 1.5, -3], scale: 0.003 },
    { config: './ui/modeselect.json', pos: [0, 1.5, -3], scale: 0.003 },
    { config: './ui/difficulty.json', pos: [0, 1.5, -3], scale: 0.003 },
    { config: './ui/hud.json', pos: [0, 0.15, -0.5], scale: 0.0015, follower: true },
    { config: './ui/wordlist.json', pos: [0.6, 0, -0.5], scale: 0.0015, screen: true },
    { config: './ui/pause.json', pos: [0, 1.5, -2], scale: 0.003 },
    { config: './ui/gameover.json', pos: [0, 1.5, -2.5], scale: 0.003 },
    { config: './ui/leaderboard.json', pos: [0, 1.5, -3], scale: 0.003 },
    { config: './ui/achvlist.json', pos: [0, 1.5, -3], scale: 0.003 },
    { config: './ui/settings.json', pos: [0, 1.5, -3], scale: 0.003 },
    { config: './ui/stats.json', pos: [0, 1.5, -3], scale: 0.003 },
    { config: './ui/help.json', pos: [0, 1.5, -3], scale: 0.003 },
    { config: './ui/toast.json', pos: [0, -0.1, -0.5], scale: 0.0012, follower: true },
    { config: './ui/countdown.json', pos: [0, 0, -0.5], scale: 0.003, follower: true },
    { config: './ui/skins.json', pos: [0, 1.5, -3], scale: 0.003 },
  ];

  for (const pc of panelConfigs) {
    const entity = (world as any).ecs.createEntity();
    entity.addComponent(PanelUI, { config: pc.config });
    if (entity.object3D) {
      entity.object3D.position.set(pc.pos[0], pc.pos[1], pc.pos[2]);
      entity.object3D.scale.setScalar(pc.scale);
    }
    if (pc.follower) {
      entity.addComponent(Follower);
      const fv = entity.getVectorView(Follower, 'offsetPosition');
      if (fv) { fv[0] = pc.pos[0]; fv[1] = pc.pos[1]; fv[2] = pc.pos[2]; }
      entity.setValue(Follower, 'target', world.player?.head);
    }
    if (pc.screen) {
      entity.addComponent(ScreenSpace);
    }
  }

  world.registerSystem(GameSystem);
  world.registerSystem(GameUISystem);

  // Mouse events
  container.addEventListener('mousemove', onMouseMove);
  container.addEventListener('mousedown', onMouseDown);
  container.addEventListener('mouseup', onMouseUp);
  document.addEventListener('keydown', onKeyDown);

  // Render initial empty grid
  renderGridCanvas();
}

main();
