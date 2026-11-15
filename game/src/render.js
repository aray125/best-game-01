// Drawing of the Lumenkeeper garden: the night sky, the hedges, the lanterns
// with their glow, the embers, the wisps, the keeper and the particles. It
// only reads the world, it never changes it.
import { ARENA, COLORS } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawWorld(ctx, world) {
  const { width, height } = ARENA;
  const time = world.time;

  // Night sky and ground.
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, COLORS.nightTop);
  sky.addColorStop(1, COLORS.nightBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Stars: the ambient motes, drawn faint so the garden reads first.
  for (const m of world.ambient) {
    const twinkle = 0.25 + 0.35 * Math.abs(Math.sin(m.phase));
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = '#cdd6ff';
    ctx.fillRect(m.x, m.y, m.size, m.size);
  }
  ctx.globalAlpha = 1;

  // Ground: a soft lawn with a stone border.
  ctx.fillStyle = COLORS.ground;
  roundRect(ctx, ARENA.margin - 14, ARENA.margin + 32, width - 2 * (ARENA.margin - 14), height - ARENA.margin - 32 - 14, 18);
  ctx.fill();
  ctx.strokeStyle = COLORS.groundLine;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = COLORS.hedge;
  for (let x = ARENA.margin + 10; x < width - ARENA.margin; x += 46) {
    ctx.beginPath();
    ctx.arc(x, ARENA.margin + 40, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, height - ARENA.margin + 4, 13, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lantern light pools on the ground, under everything else.
  for (const lamp of world.lanterns) {
    if (lamp.glow <= 0.01) continue;
    const pool = ctx.createRadialGradient(lamp.x, lamp.y + 8, 4, lamp.x, lamp.y + 8, 120);
    pool.addColorStop(0, `rgba(255, 190, 90, ${0.22 * lamp.glow})`);
    pool.addColorStop(1, 'rgba(255, 190, 90, 0)');
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y + 8, 120, 0, Math.PI * 2);
    ctx.fill();
  }

  drawEmbers(ctx, world);
  drawPickups(ctx, world);
  drawLanterns(ctx, world);
  drawWisps(ctx, world);
  drawPlayer(ctx, world);
  drawParticles(ctx, world);
  drawTexts(ctx, world);

  // The keeper's own light, over the garden but under the HUD.
  const p = world.player;
  const halo = ctx.createRadialGradient(p.x, p.y, 8, p.x, p.y, 150);
  halo.addColorStop(0, 'rgba(255, 220, 140, 0.20)');
  halo.addColorStop(1, 'rgba(255, 220, 140, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 150, 0, Math.PI * 2);
  ctx.fill();

  // A red flash when the keeper is hurt, a white one for a flare.
  if (world.flash > 0) {
    ctx.fillStyle = `rgba(255, 240, 200, ${world.flash * 0.18})`;
    ctx.fillRect(0, 0, width, height);
  }
}

function drawLanterns(ctx, world) {
  for (const lamp of world.lanterns) {
    const flicker = lamp.lit ? 1 + 0.08 * Math.sin(lamp.wobble * 3) : 0;
    // Pole.
    ctx.fillStyle = COLORS.lanternPole;
    ctx.fillRect(lamp.x - 3, lamp.y - 6, 6, 26);
    // Cap and base.
    ctx.fillStyle = '#241c12';
    ctx.beginPath();
    ctx.moveTo(lamp.x - 12, lamp.y - 6);
    ctx.lineTo(lamp.x + 12, lamp.y - 6);
    ctx.lineTo(lamp.x + 6, lamp.y - 16);
    ctx.lineTo(lamp.x - 6, lamp.y - 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(lamp.x - 10, lamp.y + 18, 20, 4);
    // Glass: dark when unlit, warm and glowing when lit.
    if (lamp.lit) {
      const glow = ctx.createRadialGradient(lamp.x, lamp.y + 4, 2, lamp.x, lamp.y + 4, 34);
      glow.addColorStop(0, 'rgba(255, 214, 130, 0.85)');
      glow.addColorStop(1, 'rgba(255, 190, 90, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y + 4, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.lanternGlass;
      ctx.globalAlpha = flicker;
      roundRect(ctx, lamp.x - 9, lamp.y - 8, 18, 22, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#2a3358';
      roundRect(ctx, lamp.x - 9, lamp.y - 8, 18, 22, 4);
      ctx.fill();
      ctx.strokeStyle = '#4a5588';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // A dim outline of the flame-to-be, so the goal reads at a glance.
      ctx.fillStyle = 'rgba(255, 217, 138, 0.35)';
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y + 5, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Snuff progress ring while a wisp holds on.
    if (lamp.snuff > 0 && lamp.lit) {
      ctx.strokeStyle = '#8b7bff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y + 4, 22, -Math.PI / 2, -Math.PI / 2 + (lamp.snuff / 2) * Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawEmbers(ctx, world) {
  for (const e of world.embers) {
    const bobY = Math.sin(e.bob) * 3;
    const pulse = 0.75 + 0.25 * Math.sin(e.bob * 1.7);
    const glow = ctx.createRadialGradient(e.x, e.y + bobY, 1, e.x, e.y + bobY, 16);
    glow.addColorStop(0, `rgba(255, 179, 71, ${0.5 * pulse})`);
    glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(e.x, e.y + bobY, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.ember;
    ctx.beginPath();
    ctx.arc(e.x, e.y + bobY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.emberCore;
    ctx.beginPath();
    ctx.arc(e.x, e.y + bobY, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPickups(ctx, world) {
  for (const pk of world.pickups) {
    const bobY = Math.sin(pk.bob) * 3;
    const blink = pk.life < 3 ? (Math.sin(pk.life * 12) > 0 ? 1 : 0.25) : 1;
    ctx.globalAlpha = blink;
    ctx.fillStyle = '#1d2b52';
    ctx.beginPath();
    ctx.arc(pk.x, pk.y + bobY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7be495';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#eafff0';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const glyph = pk.kind === 'swift' ? '»' : pk.kind === 'ward' ? '◈' : '✦';
    ctx.fillText(glyph, pk.x, pk.y + bobY + 1);
    ctx.globalAlpha = 1;
  }
}

function drawWisps(ctx, world) {
  for (const w of world.wisps) {
    if (w.banished > 0) {
      // A banished wisp is a fading wisp of smoke at the garden's edge.
      ctx.globalAlpha = Math.max(0, Math.min(0.5, w.banished / 3)) * 0.6;
      ctx.fillStyle = COLORS.wisp;
      ctx.beginPath();
      ctx.arc(w.x, w.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      continue;
    }
    const sway = Math.sin(world.time * 3 + w.x * 0.05) * 2;
    const glow = ctx.createRadialGradient(w.x, w.y, 2, w.x, w.y, 34);
    glow.addColorStop(0, 'rgba(139, 123, 255, 0.5)');
    glow.addColorStop(1, 'rgba(139, 123, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(w.x, w.y, 34, 0, Math.PI * 2);
    ctx.fill();
    // Body: a little hooded shade with two eyes.
    ctx.fillStyle = COLORS.wisp;
    ctx.beginPath();
    ctx.moveTo(w.x, w.y - 16);
    ctx.quadraticCurveTo(w.x + 14, w.y - 12, w.x + 12, w.y + 4);
    ctx.quadraticCurveTo(w.x + 8, w.y + 12 + sway, w.x + 3, w.y + 10);
    ctx.quadraticCurveTo(w.x, w.y + 14 + sway, w.x - 3, w.y + 10);
    ctx.quadraticCurveTo(w.x - 8, w.y + 12 + sway, w.x - 12, w.y + 4);
    ctx.quadraticCurveTo(w.x - 14, w.y - 12, w.x, w.y - 16);
    ctx.fill();
    ctx.fillStyle = COLORS.wispCore;
    ctx.beginPath();
    ctx.arc(w.x - 5, w.y - 4, 2.4, 0, Math.PI * 2);
    ctx.arc(w.x + 5, w.y - 4, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(ctx, world) {
  const p = world.player;
  const blink = p.invulnerable > 0 && Math.sin(world.time * 24) > 0;
  if (blink) return;
  // Carried embers orbit the keeper, so the risk reads at a glance.
  for (let i = 0; i < world.embersCarried; i++) {
    const angle = world.time * 2.4 + (i / Math.max(1, world.embersCarried)) * Math.PI * 2;
    const ex = p.x + Math.cos(angle) * 26;
    const ey = p.y + Math.sin(angle) * 26;
    ctx.fillStyle = COLORS.ember;
    ctx.beginPath();
    ctx.arc(ex, ey, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Ward shield ring.
  if (p.ward) {
    ctx.strokeStyle = 'rgba(123, 228, 149, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + 9, 0, Math.PI * 2);
    ctx.stroke();
  }
  // The keeper: a small lantern-bearer, drawn as a warm flame in a cloak.
  ctx.fillStyle = '#2b3a6e';
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 15);
  ctx.quadraticCurveTo(p.x + 13, p.y - 8, p.x + 11, p.y + 12);
  ctx.quadraticCurveTo(p.x, p.y + 17, p.x - 11, p.y + 12);
  ctx.quadraticCurveTo(p.x - 13, p.y - 8, p.x, p.y - 15);
  ctx.fill();
  const flame = ctx.createRadialGradient(p.x, p.y - 4, 1, p.x, p.y - 4, 12);
  flame.addColorStop(0, '#fff3c4');
  flame.addColorStop(0.55, '#ffb347');
  flame.addColorStop(1, 'rgba(255, 140, 60, 0)');
  ctx.fillStyle = flame;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 4, 12, 0, Math.PI * 2);
  ctx.fill();
  // Facing tick: a tiny lantern held ahead.
  ctx.fillStyle = COLORS.lanternGlass;
  ctx.beginPath();
  ctx.arc(p.x + p.faceX * 18, p.y + p.faceY * 18, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawParticles(ctx, world) {
  for (const pt of world.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawTexts(ctx, world) {
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const t of world.texts) {
    ctx.globalAlpha = Math.max(0, Math.min(1, t.life));
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}
