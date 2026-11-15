// Lumenkeeper tuning: every number that shapes how the game feels lives here,
// so balance can be changed without touching the simulation or the drawing.
export const ARENA = {
  width: 1280,
  height: 720,
  margin: 56,
};

export const PLAYER = {
  radius: 16,
  speed: 265,
  swiftSpeed: 390,
  carryCapacity: 5,
  invulnerableSeconds: 2.0,
  pickupRadius: 30,
};

export const HEARTS = 3;
export const TOTAL_WAVES = 5;

// One entry per wave, in order. lanterns: how many to light to clear the wave.
// wisps: how many shadow wisps hunt at once. wispSpeed: their chase speed.
// emberInterval: seconds between ember spawns. snuffSeconds: how long a wisp
// must touch a lit lantern to snuff it out.
export const WAVES = [
  { lanterns: 4, wisps: 2, wispSpeed: 98, emberInterval: 1.5, snuffSeconds: 2.2 },
  { lanterns: 5, wisps: 3, wispSpeed: 118, emberInterval: 1.35, snuffSeconds: 2.0 },
  { lanterns: 6, wisps: 4, wispSpeed: 132, emberInterval: 1.2, snuffSeconds: 1.8 },
  { lanterns: 7, wisps: 5, wispSpeed: 146, emberInterval: 1.05, snuffSeconds: 1.6 },
  { lanterns: 8, wisps: 6, wispSpeed: 160, emberInterval: 0.9, snuffSeconds: 1.4 },
];

export const SCORE = {
  ember: 10,
  depositEach: 30,
  lanternLit: 100,
  wispBanished: 25,
  waveClear: 200,
  waveTimeBonusPerSecond: 5,
};

export const FLARE = {
  radius: 230,
  startCharges: 2,
  perWaveBonus: 1,
};

// The night-garden palette: deep indigo night, warm amber light.
export const COLORS = {
  nightTop: '#131a3a',
  nightBottom: '#0a0d22',
  ground: '#141c40',
  groundLine: '#232c5c',
  hedge: '#16204a',
  lanternPole: '#3a2f22',
  lanternGlass: '#ffd98a',
  lanternGlow: 'rgba(255, 190, 90, 0.55)',
  ember: '#ffb347',
  emberCore: '#fff3c4',
  wisp: '#8b7bff',
  wispCore: '#cfc6ff',
  player: '#ffe9a8',
  playerRing: '#ffbe5a',
  text: '#f2ead8',
  textDim: '#9aa3c7',
  danger: '#ff6b6b',
  good: '#7be495',
};
