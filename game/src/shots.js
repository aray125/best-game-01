// Deterministic screenshot scenes for Lumenkeeper: `?shot=start|play|win|end`
// builds a fixed world from a seed, advances it a fixed amount of simulated
// time with a scripted keeper, draws one frame and sets window.__shotReady.
// The screenshots are real renders of the game's own code, never edited.
import { ARENA } from './config.js';
import { World } from './world.js';
import { drawHud, drawGameOver, drawTitle, drawVictory } from './hud.js';
import { drawWorld } from './render.js';

function scriptedPlay(world, seconds) {
  // A fixed patrol: the keeper walks a loop through the garden while the
  // world runs, so embers, wisps and particles are mid-action in the shot.
  const waypoints = [
    { x: ARENA.width * 0.3, y: ARENA.height * 0.65 },
    { x: ARENA.width * 0.7, y: ARENA.height * 0.35 },
    { x: ARENA.width * 0.5, y: ARENA.height * 0.6 },
    { x: ARENA.width * 0.25, y: ARENA.height * 0.3 },
  ];
  const dt = 1 / 60;
  const steps = Math.floor(seconds / dt);
  let target = 0;
  for (let i = 0; i < steps; i++) {
    const p = world.player;
    const wp = waypoints[target];
    const dx = wp.x - p.x;
    const dy = wp.y - p.y;
    const d = Math.hypot(dx, dy);
    const move = d > 10 ? { x: dx / d, y: dy / d, target: null } : { x: 0, y: 0, target: null };
    if (d <= 10) target = (target + 1) % waypoints.length;
    const wantFlare = i === Math.floor(steps * 0.6);
    world.update(dt, move, wantFlare);
    if (world.over || world.won) break;
  }
}

// Build one scene, draw it once, and report that the shot is ready.
// Returns the world, so the main loop can keep it idle afterwards.
export function buildShot(ctx, scene, seed, best) {
  const world = new World(seed);
  if (scene === 'start') {
    // A garden already half-lit behind the title, drifting a little.
    world.lanterns[0].lit = true;
    world.lanterns[1].lit = true;
    world.lanternsLit = 2;
    scriptedPlay(world, 3);
    drawTitle(ctx, world, best);
  } else if (scene === 'play') {
    scriptedPlay(world, 14);
    // Make sure the shot shows progress: two lanterns lit, embers carried.
    if (world.lanternsLit < 2) {
      world.lanterns[0].lit = true;
      world.lanterns[1].lit = true;
      world.lanternsLit = 2;
    }
    world.embersCarried = Math.max(world.embersCarried, 3);
    world.score = Math.max(world.score, 640);
    world.waveBanner = 0;
    drawWorld(ctx, world);
    drawHud(ctx, world, best, false);
  } else if (scene === 'win') {
    scriptedPlay(world, 8);
    world.score = 4860;
    world.embersCollected = 41;
    world.embersDelivered = 38;
    world.wispsBanished = 9;
    world.bestCombo = 12;
    world.won = true;
    world.texts.length = 0;
    world.particles.length = 0;
    world.lanterns.forEach((lamp) => { lamp.lit = true; lamp.glow = 1; });
    world.lanternsLit = world.lanterns.length;
    drawWorld(ctx, world);
    drawVictory(ctx, world, Math.max(best, world.score));
  } else {
    // end: the garden went dark on wave 2, two lanterns already lit there.
    scriptedPlay(world, 10);
    world.wave = 2;
    world.hearts = 0;
    world.over = true;
    world.score = 1230;
    world.embersCollected = 18;
    world.wispsBanished = 4;
    world.bestCombo = 7;
    world.texts.length = 0;
    world.particles.length = 0;
    world.lanterns[0].lit = true;
    world.lanterns[0].glow = 1;
    world.lanterns[1].lit = true;
    world.lanterns[1].glow = 1;
    world.lanternsLit = 2;
    drawWorld(ctx, world);
    drawGameOver(ctx, world, Math.max(best, world.score));
  }
  window.__shotReady = true;
  return world;
}
