// The simulation of Lumenkeeper: the keeper, the lanterns, the embers, the
// shadow wisps, pickups and particles. It knows nothing about drawing or
// input; main.js feeds it a movement vector and it reports what happened
// through its `events` list, which main.js turns into sound and score text.
import { ARENA, COLORS, FLARE, HEARTS, PLAYER, SCORE, TOTAL_WAVES, WAVES } from './config.js';
import { clamp, distance, makeRandom, pick, range } from './random.js';

const PICKUP_KINDS = ['swift', 'ward', 'flare'];

export class World {
  constructor(seed) {
    this.rng = makeRandom(seed);
    this.time = 0;
    this.wave = 1;
    this.waveTime = 0;
    this.score = 0;
    this.hearts = HEARTS;
    this.bestCombo = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.embersCarried = 0;
    this.flareCharges = FLARE.startCharges;
    this.lanternsLit = 0;
    this.wispsBanished = 0;
    this.embersCollected = 0;
    this.embersDelivered = 0;
    this.shake = 0;
    this.flash = 0;
    this.waveBanner = 0;
    this.waveBannerText = '';
    this.over = false;
    this.won = false;
    this.events = [];
    this.embers = [];
    this.wisps = [];
    this.pickups = [];
    this.particles = [];
    this.texts = [];
    this.ambient = [];
    this.player = {
      x: ARENA.width / 2,
      y: ARENA.height - 130,
      vx: 0,
      vy: 0,
      radius: PLAYER.radius,
      invulnerable: 0,
      swift: 0,
      ward: false,
      faceX: 0,
      faceY: -1,
    };
    for (let i = 0; i < 42; i++) {
      this.ambient.push({
        x: this.rng() * ARENA.width,
        y: this.rng() * ARENA.height,
        size: range(this.rng, 1, 3),
        drift: range(this.rng, 4, 14),
        phase: this.rng() * Math.PI * 2,
      });
    }
    this.startWave(1);
  }

  waveConfig() {
    return WAVES[Math.min(this.wave, TOTAL_WAVES) - 1];
  }

  startWave(n) {
    this.wave = n;
    this.waveTime = 0;
    this.emberTimer = 0;
    this.pickupTimer = 9;
    const cfg = this.waveConfig();
    this.lanterns = this.placeLanterns(cfg.lanterns);
    this.lanternsLit = 0;
    this.embers = [];
    this.pickups = [];
    this.wisps = [];
    for (let i = 0; i < cfg.wisps; i++) this.spawnWisp(true);
    for (let i = 0; i < 5; i++) this.spawnEmber();
    this.waveBanner = 2.4;
    this.waveBannerText = n === 1 ? 'Wave 1 — Light the lanterns' : `Wave ${n} of ${TOTAL_WAVES}`;
    this.events.push({ type: 'wave', wave: n });
  }

  placeLanterns(count) {
    const spots = [];
    const margin = ARENA.margin + 60;
    const cols = Math.ceil(Math.sqrt(count * 1.6));
    const rows = Math.ceil(count / cols);
    const cellW = (ARENA.width - margin * 2) / cols;
    const cellH = (ARENA.height - margin * 2 - 90) / rows;
    let made = 0;
    for (let r = 0; r < rows && made < count; r++) {
      for (let c = 0; c < cols && made < count; c++) {
        spots.push({
          x: margin + cellW * (c + 0.5) + range(this.rng, -26, 26),
          y: margin + 40 + cellH * (r + 0.5) + range(this.rng, -20, 20),
          lit: false,
          glow: 0,
          snuff: 0,
          wobble: this.rng() * Math.PI * 2,
        });
        made++;
      }
    }
    return spots;
  }

  spawnEmber() {
    const margin = ARENA.margin + 30;
    this.embers.push({
      x: range(this.rng, margin, ARENA.width - margin),
      y: range(this.rng, margin + 40, ARENA.height - margin),
      bob: this.rng() * Math.PI * 2,
      life: 0,
    });
  }

  spawnWisp(atEdge) {
    const margin = ARENA.margin;
    let x;
    let y;
    if (atEdge) {
      const side = Math.floor(this.rng() * 4);
      if (side === 0) { x = range(this.rng, margin, ARENA.width - margin); y = margin; }
      else if (side === 1) { x = range(this.rng, margin, ARENA.width - margin); y = ARENA.height - margin; }
      else if (side === 2) { x = margin; y = range(this.rng, margin, ARENA.height - margin); }
      else { x = ARENA.width - margin; y = range(this.rng, margin, ARENA.height - margin); }
    } else {
      x = range(this.rng, margin, ARENA.width - margin);
      y = range(this.rng, margin, ARENA.height - margin);
    }
    this.wisps.push({
      x,
      y,
      vx: 0,
      vy: 0,
      wander: this.rng() * Math.PI * 2,
      radius: 15,
      snuffing: null,
      banished: 0,
      trail: 0,
    });
  }

  spawnPickup() {
    const margin = ARENA.margin + 40;
    this.pickups.push({
      kind: pick(this.rng, PICKUP_KINDS),
      x: range(this.rng, margin, ARENA.width - margin),
      y: range(this.rng, margin + 40, ARENA.height - margin),
      bob: this.rng() * Math.PI * 2,
      life: 12,
    });
  }

  burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i++) {
      const angle = this.rng() * Math.PI * 2;
      const v = range(this.rng, speed * 0.3, speed);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        life: range(this.rng, 0.35, 0.8),
        maxLife: 0.8,
        size: range(this.rng, 2, 5),
        color,
      });
    }
  }

  floatText(x, y, text, color) {
    this.texts.push({ x, y, text, color, life: 1.1 });
  }

  addScore(points, x, y, label) {
    const mult = 1 + Math.min(this.combo, 10) * 0.1;
    const gained = Math.round(points * mult);
    this.score += gained;
    if (x !== undefined) this.floatText(x, y, `+${gained}${label ? ' ' + label : ''}`, '#ffe9a8');
    return gained;
  }

  // The one public step: advance the world by dt seconds.
  update(dt, move, wantFlare) {
    if (this.over || this.won) {
      this.updateAmbient(dt);
      this.updateParticles(dt);
      return;
    }
    this.time += dt;
    this.waveTime += dt;
    this.waveBanner = Math.max(0, this.waveBanner - dt);
    this.shake = Math.max(0, this.shake - dt * 2.2);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.comboTimer -= dt;
    if (this.comboTimer <= 0) this.combo = 0;

    const p = this.player;
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    p.swift = Math.max(0, p.swift - dt);

    // Movement: keyboard vector, or steer toward the clicked point.
    let mx = move.x;
    let my = move.y;
    if (mx === 0 && my === 0 && move.target) {
      const d = distance(p.x, p.y, move.target.x, move.target.y);
      if (d > 12) {
        mx = (move.target.x - p.x) / d;
        my = (move.target.y - p.y) / d;
      }
    }
    const speed = p.swift > 0 ? PLAYER.swiftSpeed : PLAYER.speed;
    p.vx = mx * speed;
    p.vy = my * speed;
    p.x = clamp(p.x + p.vx * dt, ARENA.margin, ARENA.width - ARENA.margin);
    p.y = clamp(p.y + p.vy * dt, ARENA.margin + 46, ARENA.height - ARENA.margin);
    if (mx !== 0 || my !== 0) {
      p.faceX = mx;
      p.faceY = my;
    }

    if (wantFlare && this.flareCharges > 0) this.castFlare();

    const cfg = this.waveConfig();
    this.emberTimer -= dt;
    if (this.emberTimer <= 0 && this.embers.length < 14) {
      this.spawnEmber();
      this.emberTimer = cfg.emberInterval;
    }
    this.pickupTimer -= dt;
    if (this.pickupTimer <= 0 && this.pickups.length < 2) {
      this.spawnPickup();
      this.pickupTimer = range(this.rng, 11, 16);
    }

    this.updateEmbers(dt);
    this.updateLanterns(dt);
    this.updateWisps(dt, cfg);
    this.updatePickups(dt);
    this.updateAmbient(dt);
    this.updateParticles(dt);
    this.updateTexts(dt);

    if (this.lanternsLit >= this.lanterns.length) this.clearWave();
  }

  castFlare() {
    this.flareCharges -= 1;
    this.flash = 1;
    this.shake = Math.max(this.shake, 0.35);
    const p = this.player;
    this.burst(p.x, p.y, '#ffd98a', 26, 320);
    let banished = 0;
    for (const w of this.wisps) {
      if (w.banished > 0) continue;
      if (distance(p.x, p.y, w.x, w.y) < FLARE.radius) {
        w.banished = 3;
        w.snuffing = null;
        banished++;
        this.burst(w.x, w.y, '#b7aaff', 12, 200);
      }
    }
    if (banished > 0) {
      this.wispsBanished += banished;
      this.addScore(SCORE.wispBanished * banished, p.x, p.y - 34, 'banished');
    }
    this.events.push({ type: 'flare' });
  }

  updateEmbers(dt) {
    const p = this.player;
    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      e.life += dt;
      e.bob += dt * 3;
      if (distance(p.x, p.y, e.x, e.y) < PLAYER.pickupRadius + 8) {
        this.embers.splice(i, 1);
        if (this.embersCarried < PLAYER.carryCapacity) {
          this.embersCarried += 1;
          this.embersCollected += 1;
          this.combo += 1;
          this.comboTimer = 2.5;
          this.bestCombo = Math.max(this.bestCombo, this.combo);
          this.addScore(SCORE.ember, e.x, e.y - 14);
          this.burst(e.x, e.y, '#ffb347', 6, 120);
          this.events.push({ type: 'ember' });
        } else {
          this.floatText(e.x, e.y - 14, 'Hands full!', '#9aa3c7');
        }
      }
    }
  }

  updateLanterns(dt) {
    const p = this.player;
    for (const lamp of this.lanterns) {
      lamp.wobble += dt * 2;
      lamp.glow += ((lamp.lit ? 1 : 0) - lamp.glow) * Math.min(1, dt * 4);
      if (!lamp.lit && this.embersCarried > 0 && distance(p.x, p.y, lamp.x, lamp.y) < 52) {
        // Deposit every carried ember at once: the risk of carrying pays off.
        const delivered = this.embersCarried;
        this.embersDelivered += delivered;
        this.embersCarried = 0;
        lamp.lit = true;
        this.lanternsLit += 1;
        this.addScore(SCORE.depositEach * delivered, lamp.x, lamp.y - 46);
        this.addScore(SCORE.lanternLit, lamp.x, lamp.y - 66, 'lit!');
        this.burst(lamp.x, lamp.y - 30, '#ffd98a', 22, 240);
        this.events.push({ type: 'lantern', x: lamp.x, y: lamp.y });
      }
    }
  }

  updateWisps(dt, cfg) {
    const p = this.player;
    for (const w of this.wisps) {
      if (w.banished > 0) {
        w.banished -= dt;
        if (w.banished <= 0) {
          // A banished wisp reforms at the garden's edge.
          const margin = ARENA.margin;
          w.x = this.rng() < 0.5 ? margin : ARENA.width - margin;
          w.y = range(this.rng, margin, ARENA.height - margin);
          w.snuffing = null;
        }
        continue;
      }
      w.trail -= dt;
      const distPlayer = distance(p.x, p.y, w.x, w.y);
      let tx;
      let ty;
      let speed = cfg.wispSpeed;
      if (distPlayer < 250) {
        tx = p.x;
        ty = p.y;
        speed *= 1.12;
        w.snuffing = null;
      } else {
        // No keeper nearby: drift toward the nearest lit lantern to snuff it.
        const lit = this.lanterns.find((lamp) => lamp.lit);
        if (lit) {
          tx = lit.x;
          ty = lit.y;
          w.snuffing = lit;
        } else {
          w.wander += dt * 0.8;
          tx = w.x + Math.cos(w.wander) * 120;
          ty = w.y + Math.sin(w.wander) * 120;
          speed *= 0.55;
        }
      }
      const d = Math.max(1, distance(w.x, w.y, tx, ty));
      w.vx = ((tx - w.x) / d) * speed;
      w.vy = ((ty - w.y) / d) * speed;
      w.x = clamp(w.x + w.vx * dt, ARENA.margin, ARENA.width - ARENA.margin);
      w.y = clamp(w.y + w.vy * dt, ARENA.margin + 46, ARENA.height - ARENA.margin);

      // Snuffing: hold contact with a lit lantern and its light dies.
      if (w.snuffing && w.snuffing.lit) {
        if (distance(w.x, w.y, w.snuffing.x, w.snuffing.y) < 46) {
          w.snuffing.snuff += dt;
          if (w.snuffing.snuff >= cfg.snuffSeconds) {
            w.snuffing.lit = false;
            w.snuffing.snuff = 0;
            w.snuffing = null;
            this.lanternsLit = Math.max(0, this.lanternsLit - 1);
            this.events.push({ type: 'snuffed', x: w.x, y: w.y });
          }
        } else {
          w.snuffing.snuff = Math.max(0, w.snuffing.snuff - dt);
        }
      } else {
        w.snuffing = null;
      }

      // Touching the keeper: a heart, and the carried embers scatter.
      if (distPlayer < w.radius + p.radius - 2 && p.invulnerable <= 0) {
        this.hurtPlayer(w);
      }
    }
  }

  hurtPlayer(wisp) {
    const p = this.player;
    if (p.ward) {
      p.ward = false;
      p.invulnerable = 1.2;
      this.burst(p.x, p.y, '#7be495', 18, 220);
      this.floatText(p.x, p.y - 34, 'Ward held!', '#7be495');
      this.events.push({ type: 'ward' });
      return;
    }
    this.hearts -= 1;
    p.invulnerable = PLAYER.invulnerableSeconds;
    this.shake = 0.7;
    this.flash = 0.5;
    this.combo = 0;
    const scattered = this.embersCarried;
    this.embersCarried = 0;
    for (let i = 0; i < scattered; i++) {
      this.embers.push({
        x: clamp(p.x + range(this.rng, -90, 90), ARENA.margin, ARENA.width - ARENA.margin),
        y: clamp(p.y + range(this.rng, -90, 90), ARENA.margin + 46, ARENA.height - ARENA.margin),
        bob: this.rng() * Math.PI * 2,
        life: 0,
      });
    }
    const dx = p.x - wisp.x;
    const dy = p.y - wisp.y;
    const d = Math.max(1, Math.hypot(dx, dy));
    p.x = clamp(p.x + (dx / d) * 46, ARENA.margin, ARENA.width - ARENA.margin);
    p.y = clamp(p.y + (dy / d) * 46, ARENA.margin + 46, ARENA.height - ARENA.margin);
    this.burst(p.x, p.y, '#ff6b6b', 16, 260);
    this.events.push({ type: 'hurt' });
    if (this.hearts <= 0) {
      this.over = true;
      this.events.push({ type: 'gameover' });
    }
  }

  updatePickups(dt) {
    const p = this.player;
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pk = this.pickups[i];
      pk.life -= dt;
      pk.bob += dt * 3;
      if (pk.life <= 0) {
        this.pickups.splice(i, 1);
        continue;
      }
      if (distance(p.x, p.y, pk.x, pk.y) < PLAYER.pickupRadius + 10) {
        this.pickups.splice(i, 1);
        if (pk.kind === 'swift') {
          p.swift = 8;
          this.floatText(p.x, p.y - 34, 'Swift feet!', '#7be495');
        } else if (pk.kind === 'ward') {
          p.ward = true;
          this.floatText(p.x, p.y - 34, 'Ward up!', '#7be495');
        } else {
          this.flareCharges += 1;
          this.floatText(p.x, p.y - 34, '+1 Flare', '#ffd98a');
        }
        this.burst(pk.x, pk.y, '#7be495', 10, 160);
        this.events.push({ type: 'pickup' });
      }
    }
  }

  updateAmbient(dt) {
    for (const m of this.ambient) {
      m.phase += dt;
      m.y -= m.drift * dt * 0.2;
      if (m.y < -6) {
        m.y = ARENA.height + 6;
        m.x = this.rng() * ARENA.width;
      }
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 0.94;
      pt.vy *= 0.94;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  updateTexts(dt) {
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      t.y -= 34 * dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
  }

  clearWave() {
    const timeBonus = Math.max(0, Math.round((90 - this.waveTime) * SCORE.waveTimeBonusPerSecond));
    this.addScore(SCORE.waveClear + timeBonus, ARENA.width / 2, 300, `Wave ${this.wave} clear!`);
    this.flareCharges += FLARE.perWaveBonus;
    this.events.push({ type: 'waveclear', bonus: timeBonus });
    if (this.wave >= TOTAL_WAVES) {
      this.won = true;
      this.events.push({ type: 'victory' });
      return;
    }
    this.startWave(this.wave + 1);
  }

  get lanternTotal() {
    return this.lanterns.length;
  }
}
