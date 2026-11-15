// The HUD and the menu screens of Lumenkeeper, all drawn on the same canvas
// as the garden so every screenshot shows the game itself: score, hearts,
// wave, lanterns, carried embers, flare charges, and the title, pause,
// game-over and victory screens with their restart prompts.
import { ARENA, COLORS, HEARTS, PLAYER, TOTAL_WAVES } from './config.js';
import { drawWorld } from './render.js';

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(10, 13, 34, 0.72)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(154, 163, 199, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function centerText(ctx, text, x, y, font, color) {
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function heart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 16, size / 16);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-9, -3, -5, -10, 0, -5);
  ctx.bezierCurveTo(5, -10, 9, -3, 0, 5);
  ctx.closePath();
  ctx.fillStyle = filled ? '#ff6b6b' : 'rgba(154, 163, 199, 0.3)';
  ctx.fill();
  ctx.restore();
}

export function drawHud(ctx, world, best, muted) {
  const { width } = ARENA;
  ctx.textBaseline = 'middle';

  // Top bar: score and best left, wave centre, hearts right.
  ctx.fillStyle = 'rgba(10, 13, 34, 0.66)';
  ctx.fillRect(0, 0, width, 44);
  ctx.textAlign = 'left';
  ctx.font = 'bold 21px system-ui, sans-serif';
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`Score ${world.score}   Best ${best}`, 18, 23);
  ctx.textAlign = 'center';
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.fillText(`Wave ${world.wave} / ${TOTAL_WAVES}`, width / 2, 23);
  ctx.textAlign = 'right';
  for (let i = 0; i < HEARTS; i++) {
    heart(ctx, width - 26 - i * 30, 23, 15, i < world.hearts);
  }

  // Bottom bar: lanterns lit, embers carried, flare charges, combo, hints.
  ctx.fillStyle = 'rgba(10, 13, 34, 0.66)';
  ctx.fillRect(0, ARENA.height - 40, width, 40);
  ctx.textAlign = 'left';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`Lanterns ${world.lanternsLit}/${world.lanternTotal} lit`, 18, ARENA.height - 20);
  ctx.fillText(`Embers ${world.embersCarried}/${PLAYER.carryCapacity}`, 190, ARENA.height - 20);
  ctx.fillText(`Flare ${world.flareCharges}  (Space)`, 350, ARENA.height - 20);
  if (world.combo >= 3) {
    ctx.fillStyle = '#ffd98a';
    ctx.fillText(`Combo x${(1 + Math.min(world.combo, 10) * 0.1).toFixed(1)}`, 520, ARENA.height - 20);
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText(muted ? 'M - sound off' : 'P pause - M mute - R restart', width - 18, ARENA.height - 20);

  // Wave banner, fading in the middle of the screen.
  if (world.waveBanner > 0) {
    const alpha = Math.min(1, world.waveBanner);
    ctx.globalAlpha = alpha;
    centerText(ctx, world.waveBannerText, width / 2, 150, 'bold 34px system-ui, sans-serif', '#ffe9a8');
    ctx.globalAlpha = 1;
  }
}

export function drawTitle(ctx, world, best) {
  // The title plays over a living garden, so it never looks frozen.
  drawWorld(ctx, world);
  ctx.fillStyle = 'rgba(8, 10, 26, 0.55)';
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);

  centerText(ctx, 'LUMENKEEPER', ARENA.width / 2, 168, 'bold 72px system-ui, sans-serif', '#ffe9a8');
  centerText(ctx, 'Keep the garden lit. Do not let the dark snuff it out.', ARENA.width / 2, 226, '21px system-ui, sans-serif', COLORS.textDim);

  panel(ctx, ARENA.width / 2 - 330, 268, 660, 190);
  const lines = [
    'Collect embers, carry them to an unlit lantern to light it.',
    'Light every lantern to clear the wave - 5 waves to win.',
    'Shadow wisps chase you and snuff lit lanterns. One touch costs a heart.',
    'Carry up to 5 embers: a full load lights a lantern in one visit.',
    'Space: Flare banishes nearby wisps. Pickups grant speed, a ward, or flares.',  ];
  lines.forEach((line, i) => {
    centerText(ctx, line, ARENA.width / 2, 296 + i * 30, '17px system-ui, sans-serif', COLORS.text);
  });

  centerText(ctx, 'Move: WASD / arrows, or click where to walk   -   Flare: Space   -   Pause: P', ARENA.width / 2, 500, '17px system-ui, sans-serif', COLORS.textDim);
  if (best > 0) {
    centerText(ctx, `Best score: ${best}`, ARENA.width / 2, 536, 'bold 19px system-ui, sans-serif', '#ffd98a');
  }
  const pulse = 0.65 + 0.35 * Math.sin(world.time * 4);
  ctx.globalAlpha = pulse;
  centerText(ctx, 'Press Enter or click to begin', ARENA.width / 2, 592, 'bold 24px system-ui, sans-serif', '#ffe9a8');
  ctx.globalAlpha = 1;
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(8, 10, 26, 0.62)';
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  centerText(ctx, 'Paused', ARENA.width / 2, 300, 'bold 52px system-ui, sans-serif', COLORS.text);
  centerText(ctx, 'P to resume - R to restart - M to mute', ARENA.width / 2, 360, '19px system-ui, sans-serif', COLORS.textDim);
}

export function drawGameOver(ctx, world, best) {
  ctx.fillStyle = 'rgba(8, 10, 26, 0.72)';
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  centerText(ctx, 'The garden went dark', ARENA.width / 2, 220, 'bold 54px system-ui, sans-serif', '#ff9d9d');
  centerText(ctx, `The wisps snuffed the last light on wave ${world.wave}.`, ARENA.width / 2, 276, '20px system-ui, sans-serif', COLORS.textDim);

  panel(ctx, ARENA.width / 2 - 250, 316, 500, 150);
  centerText(ctx, `Score  ${world.score}`, ARENA.width / 2, 348, 'bold 26px system-ui, sans-serif', COLORS.text);
  centerText(ctx, `Best  ${best}`, ARENA.width / 2, 384, '19px system-ui, sans-serif', '#ffd98a');
  centerText(ctx, `Lanterns lit ${world.lanternsLit} - Embers gathered ${world.embersCollected} - Wisps banished ${world.wispsBanished}`, ARENA.width / 2, 420, '16px system-ui, sans-serif', COLORS.textDim);
  centerText(ctx, `Best combo x${(1 + Math.min(world.bestCombo, 10) * 0.1).toFixed(1)}`, ARENA.width / 2, 444, '16px system-ui, sans-serif', COLORS.textDim);

  const pulse = 0.65 + 0.35 * Math.sin(world.time * 4);
  ctx.globalAlpha = pulse;
  centerText(ctx, 'Press Enter or click to try again', ARENA.width / 2, 540, 'bold 24px system-ui, sans-serif', '#ffe9a8');
  ctx.globalAlpha = 1;
}

export function drawVictory(ctx, world, best) {
  ctx.fillStyle = 'rgba(8, 10, 26, 0.6)';
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  centerText(ctx, 'The garden blazes', ARENA.width / 2, 200, 'bold 54px system-ui, sans-serif', '#ffe9a8');
  centerText(ctx, 'Every lantern of every wave is lit. Dawn belongs to the keeper.', ARENA.width / 2, 256, '20px system-ui, sans-serif', COLORS.textDim);

  panel(ctx, ARENA.width / 2 - 250, 296, 500, 170);
  centerText(ctx, `Score  ${world.score}`, ARENA.width / 2, 330, 'bold 26px system-ui, sans-serif', COLORS.text);
  centerText(ctx, `Best  ${best}`, ARENA.width / 2, 366, '19px system-ui, sans-serif', '#ffd98a');
  centerText(ctx, `Embers gathered ${world.embersCollected} - delivered ${world.embersDelivered}`, ARENA.width / 2, 402, '16px system-ui, sans-serif', COLORS.textDim);
  centerText(ctx, `Wisps banished ${world.wispsBanished} - Best combo x${(1 + Math.min(world.bestCombo, 10) * 0.1).toFixed(1)}`, ARENA.width / 2, 428, '16px system-ui, sans-serif', COLORS.textDim);

  const pulse = 0.65 + 0.35 * Math.sin(world.time * 4);
  ctx.globalAlpha = pulse;
  centerText(ctx, 'Press Enter or click to play again', ARENA.width / 2, 540, 'bold 24px system-ui, sans-serif', '#ffe9a8');
  ctx.globalAlpha = 1;
}
