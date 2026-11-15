// Lumenkeeper boot and game loop: owns the canvas, the screen state machine
// (title, playing, paused, game over, victory), the best score in
// localStorage, and the fixed-timestep loop. All simulation lives in World,
// all drawing in render.js and hud.js, all sound in audio.js.
import { ARENA } from './config.js';
import { World } from './world.js';
import { Input } from './input.js';
import { SoundEngine } from './audio.js';
import { drawWorld } from './render.js';
import { drawGameOver, drawHud, drawPaused, drawTitle, drawVictory } from './hud.js';
import { buildShot } from './shots.js';

const BEST_KEY = 'lumenkeeper-best';
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function fitCanvas() {
  const scale = Math.min(window.innerWidth / ARENA.width, window.innerHeight / ARENA.height);
  const w = Math.floor(ARENA.width * scale);
  const h = Math.floor(ARENA.height * scale);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  canvas.width = ARENA.width;
  canvas.height = ARENA.height;
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

function loadBest() {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Best score is a nicety; a browser that refuses storage still plays.
  }
}

const input = new Input(canvas);
const sound = new SoundEngine();
const params = new URLSearchParams(window.location.search);
const shotScene = params.get('shot');
const seed = Number(params.get('seed')) || 20261116;

let best = loadBest();
let world = new World(seed);
let screen = 'title';
let moveTarget = null;
let last = performance.now();

// Read-only hook for automated playtests: the game itself never uses it.
window.__lumen = {
  get screen() { return screen; },
  get world() { return world; },
  get best() { return best; },
};

function startGame() {
  world = new World((Math.random() * 1e9) | 0);
  screen = 'playing';
  moveTarget = null;
  sound.unlock();
  sound.click();
}

function restart() {
  startGame();
}

function handleEvents() {
  for (const event of world.events) {
    if (event.type === 'ember') sound.ember();
    else if (event.type === 'lantern') sound.lanternLit();
    else if (event.type === 'hurt') sound.hurt();
    else if (event.type === 'snuffed') sound.snuffed();
    else if (event.type === 'flare') sound.flare();
    else if (event.type === 'pickup') sound.pickup();
    else if (event.type === 'waveclear') sound.waveClear();
    else if (event.type === 'victory') {
      sound.victory();
      if (world.score > best) {
        best = world.score;
        saveBest(best);
      }
    } else if (event.type === 'gameover') {
      sound.gameOver();
      if (world.score > best) {
        best = world.score;
        saveBest(best);
      }
    }
  }
  world.events.length = 0;
}

// Screenshot mode: one deterministic frame, then idle. The screenshot tool
// waits for window.__shotReady before capturing.
if (shotScene) {
  buildShot(ctx, shotScene, seed, best);
} else {
  requestAnimationFrame(frame);
}

function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // Global keys work on every screen.
  if (input.wasPressed('m')) sound.toggleMute();
  if (input.wasPressed('r') && screen !== 'title') restart();

  if (screen === 'title') {
    // The garden idles behind the title: ambient motes drift, nothing hunts.
    world.updateAmbient(dt);
    world.time += dt;
    if (input.wasPressed('enter') || input.mouse.clicked) {
      sound.unlock();
      startGame();
    }
    drawTitle(ctx, world, best);
  } else if (screen === 'playing') {
    if (input.wasPressed('p') || input.wasPressed('escape')) {
      screen = 'paused';
    } else {
      if (input.mouse.clicked) {
        moveTarget = { x: input.mouse.x, y: input.mouse.y };
        sound.unlock();
      }
      if (input.mouse.down) {
        moveTarget = { x: input.mouse.x, y: input.mouse.y };
      }
      const move = input.moveVector();
      const wantFlare = input.wasPressed(' ');
      world.update(dt, { x: move.x, y: move.y, target: moveTarget }, wantFlare);
      handleEvents();
      sound.updateMusic(dt, true);
      if (world.over) screen = 'over';
      else if (world.won) screen = 'win';
      drawWorld(ctx, world);
      drawHud(ctx, world, best, sound.muted);
    }
  } else if (screen === 'paused') {
    drawWorld(ctx, world);
    drawHud(ctx, world, best, sound.muted);
    drawPaused(ctx);
    if (input.wasPressed('p') || input.wasPressed('escape') || input.wasPressed('enter')) {
      screen = 'playing';
      last = performance.now();
    }
  } else if (screen === 'over') {
    world.updateAmbient(dt);
    world.time += dt;
    drawWorld(ctx, world);
    drawGameOver(ctx, world, best);
    if (input.wasPressed('enter') || input.mouse.clicked) restart();
  } else if (screen === 'win') {
    world.updateAmbient(dt);
    world.time += dt;
    drawWorld(ctx, world);
    drawVictory(ctx, world, best);
    if (input.wasPressed('enter') || input.mouse.clicked) restart();
  }

  input.endFrame();
}
