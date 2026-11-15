// All sound in Lumenkeeper is synthesised with WebAudio: no audio files are
// shipped, so the game stays fully offline. Every effect is one small function
// that plays a short oscillator or noise burst, and the music is a quiet
// pentatonic pluck pattern that the game loop steps.
export class SoundEngine {
  constructor() {
    this.context = null;
    this.muted = false;
    this.musicStep = 0;
    this.musicTimer = 0;
    // A-minor pentatonic, calm enough to sit under play for minutes.
    this.scale = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
  }

  // AudioContext needs a user gesture in browsers; create it lazily on the
  // first input and never throw if the browser refuses.
  unlock() {
    try {
      if (!this.context) {
        const Ctor = window.AudioContext ?? window.webkitAudioContext;
        if (!Ctor) return;
        this.context = new Ctor();
      }
      if (this.context.state === 'suspended') void this.context.resume();
    } catch {
      this.context = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, duration, type, volume, slideTo) {
    if (!this.context || this.muted) return;
    try {
      const now = this.context.currentTime;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain).connect(this.context.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {
      // Sound is garnish: a failure must never break the game.
    }
  }

  noise(duration, volume, lowpass) {
    if (!this.context || this.muted) return;
    try {
      const now = this.context.currentTime;
      const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
      const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass;
      const gain = this.context.createGain();
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      source.connect(filter).connect(gain).connect(this.context.destination);
      source.start(now);
    } catch {
      // See tone(): sound must never break the game.
    }
  }

  ember() {
    this.tone(740, 0.09, 'sine', 0.16, 1180);
  }

  deposit() {
    this.tone(523.25, 0.12, 'triangle', 0.2);
    window.setTimeout(() => this.tone(783.99, 0.16, 'triangle', 0.18), 70);
  }

  lanternLit() {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      window.setTimeout(() => this.tone(freq, 0.22, 'sine', 0.16), i * 80);
    });
  }

  hurt() {
    this.tone(180, 0.25, 'sawtooth', 0.2, 70);
    this.noise(0.18, 0.14, 900);
  }

  snuffed() {
    this.tone(320, 0.3, 'sine', 0.14, 110);
  }

  flare() {
    this.noise(0.35, 0.2, 3200);
    this.tone(880, 0.3, 'sine', 0.12, 1760);
  }

  pickup() {
    this.tone(660, 0.1, 'triangle', 0.16, 990);
  }

  waveClear() {
    [392.0, 523.25, 659.25, 783.99].forEach((freq, i) => {
      window.setTimeout(() => this.tone(freq, 0.25, 'triangle', 0.16), i * 90);
    });
  }

  victory() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
      window.setTimeout(() => this.tone(freq, 0.4, 'sine', 0.16), i * 120);
    });
  }

  gameOver() {
    [392.0, 329.63, 261.63, 196.0].forEach((freq, i) => {
      window.setTimeout(() => this.tone(freq, 0.35, 'triangle', 0.15), i * 160);
    });
  }

  click() {
    this.tone(520, 0.05, 'square', 0.07);
  }

  // One quiet pluck every 0.42 s while playing; the pattern walks the scale
  // and rests often, so it never fights the sound effects.
  updateMusic(dt, playing) {
    if (!this.context || this.muted || !playing) return;
    this.musicTimer += dt;
    if (this.musicTimer < 0.42) return;
    this.musicTimer = 0;
    this.musicStep += 1;
    const pattern = [0, 2, 4, 2, 5, 4, 3, 1, 0, 2, 4, 6, 5, 3, 2, 0];
    const degree = pattern[this.musicStep % pattern.length];
    if (this.musicStep % 4 !== 3) {
      this.tone(this.scale[degree], 0.5, 'sine', 0.045);
    }
  }
}
