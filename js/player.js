// levels mode state
let currentLevel = 1;
let levelKills = 0;
let levelTarget = 5;
let lastLevelSpawn = 0;
let levelTransition = false;

function levelConfig(level) {
  return {
    target: 5 + (level - 1) * 3,
    maxBots: Math.min(3 + Math.floor(level / 2), 9),
    spawnInterval: Math.max(1300 - level * 60, 450)
  };
}

const PLAYER_BASE_R = 16;

const player = {
  x: 0, y: 0,
  r: PLAYER_BASE_R,
  baseSpeed: 3.5,
  speed: 3.5,
  hp: 100,
  maxHp: 100,
  angle: 0,
  boostUntil: 0,
  fireBoostUntil: 0,
  shieldUntil: 0,
  damageBoostUntil: 0,
  multiShotUntil: 0,
  invisibleUntil: 0,
  timewarpUntil: 0,
  ricochetUntil: 0,
  homingUntil: 0,
  stunUntil: 0,
  auraUntil: 0,
  overloadUntil: 0,
  slowUntil: 0,
  rootedUntil: 0,
  curseUntil: 0,
  confuseUntil: 0,
  killStreak: 0,
  killStreakLastKill: 0,
  comboStreak: 0,
  comboLastKill: 0,
  slideVX: 0,
  slideVY: 0,
  activeTransform: 'none'
};

function resetPlayer() {
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  const wantedTransform = transformPracticeActive
    ? transformPracticeId
    : (equippedTransform !== 'none' && !weaponPracticeActive ? equippedTransform : 'none');
  player.activeTransform = gameMode !== 'practice' ? wantedTransform : 'none';
  const tStats = TRANSFORM_STATS[player.activeTransform] || TRANSFORM_STATS.none;
  const armorSpeed = 1 + getArmorStats().speedBonus;
  player.baseSpeed = 3.5 * (1 + lvlSprint * SPRINT_PER_LEVEL) * tStats.speedMult * armorSpeed;
  player.r = PLAYER_BASE_R * tStats.rMult;
  player.maxHp = 100 + getArmorStats().hpBonus + lvlExtraHp * EXTRA_HP_PER_LEVEL + tStats.hpBonus;
  player.hp = player.maxHp;
  player.speed = player.baseSpeed;
  player.boostUntil = 0;
  player.fireBoostUntil = 0;
  player.shieldUntil = 0;
  player.damageBoostUntil = 0;
  player.multiShotUntil = 0;
  player.invisibleUntil = 0;
  player.timewarpUntil = 0;
  player.ricochetUntil = 0;
  player.homingUntil = 0;
  player.stunUntil = 0;
  player.auraUntil = 0;
  player.overloadUntil = 0;
  player.slowUntil = 0;
  player.rootedUntil = 0;
  player.curseUntil = 0;
  player.confuseUntil = 0;
  player.adrenalineUsed = false;
  player.reviveUsed = false;
  player.killStreak = 0;
  player.killStreakLastKill = 0;
  player.comboStreak = 0;
  player.comboLastKill = 0;
  player.slideVX = 0;
  player.slideVY = 0;
  player.secondWindUsed = false;
  if (lvlFlyingStart > 0) player.shieldUntil = performance.now() + FLYING_START_DURATIONS[lvlFlyingStart - 1];
}

const BOT_TYPES = [
  { name: 'grunt',    minScore: 0,   minLevel: 1,  r: 15, hp: 2,  speed: [1, 2.2],   cooldown: [1200, 2400], pattern: 'single', bulletSpeed: 5,   color: () => `hsl(${Math.floor(Math.random()*360)}, 70%, 55%)` },
  { name: 'runner',   minScore: 40,  minLevel: 2,  r: 13, hp: 3,  speed: [2.2, 3.4], cooldown: [900, 1600],  pattern: 'single', bulletSpeed: 6.5, color: () => `hsl(${Math.floor(Math.random()*40)+40}, 80%, 55%)` },
  { name: 'heavy',    minScore: 100, minLevel: 4,  r: 22, hp: 6,  speed: [0.7, 1.3], cooldown: [1000, 1800], pattern: 'triple', bulletSpeed: 5,   color: () => `hsl(${Math.floor(Math.random()*30)+200}, 60%, 50%)` },
  { name: 'tank',     minScore: 220, minLevel: 6,  r: 30, hp: 12, speed: [0.5, 0.9], cooldown: [1400, 2000], pattern: 'burst',  bulletSpeed: 5.5, color: () => `hsl(${Math.floor(Math.random()*20)+0}, 70%, 45%)` },
  { name: 'sniper',   minScore: 350, minLevel: 8,  r: 17, hp: 4,  speed: [0.9, 1.6], cooldown: [1800, 2600], pattern: 'fast',   bulletSpeed: 10,  color: () => `hsl(${Math.floor(Math.random()*20)+280}, 70%, 55%)` },
  { name: 'brute',    minScore: 200, minLevel: 2, r: 20, hp: 7,  speed: [1.6, 2.3], cooldown: [900, 1300],  pattern: 'melee',  bulletSpeed: 0,   meleeDamage: 18, color: () => `hsl(${Math.floor(Math.random()*15)+10}, 75%, 40%)` },
  { name: 'spinner',  minScore: 250, minLevel: 3, r: 18, hp: 5,  speed: [0.8, 1.4], cooldown: [2200, 3200], pattern: 'circle', bulletSpeed: 4.5, color: () => `hsl(${Math.floor(Math.random()*20)+150}, 70%, 45%)` },
  { name: 'chaser',   minScore: 300, minLevel: 4, r: 14, hp: 4,  speed: [2.6, 3.6], cooldown: [700, 1100],  pattern: 'double', bulletSpeed: 6,   color: () => `hsl(${Math.floor(Math.random()*20)+320}, 75%, 55%)` },
  { name: 'shielder', minScore: 350, minLevel: 5, r: 24, hp: 9,  speed: [0.6, 1],   cooldown: [1800, 2600], pattern: 'wide',   bulletSpeed: 4.5, color: () => `hsl(${Math.floor(Math.random()*20)+90}, 55%, 45%)` },
  { name: 'ghost',    minScore: 400, minLevel: 6, r: 16, hp: 5,  speed: [1.2, 1.8], cooldown: [1800, 2600], pattern: 'teleport', bulletSpeed: 7,   color: () => `hsl(${Math.floor(Math.random()*20)+260}, 55%, 65%)` },
  { name: 'turret',   minScore: 450, minLevel: 7, r: 19, hp: 6,  speed: [0, 0],     cooldown: [333, 333],   pattern: 'turret',   bulletSpeed: 9,   color: () => `hsl(${Math.floor(Math.random()*15)+0}, 80%, 40%)` },
  { name: 'bomber',   minScore: 550, minLevel: 8, r: 17, hp: 4,  speed: [2.4, 3.0], cooldown: [0, 0],       pattern: 'suicide',  bulletSpeed: 0,   meleeDamage: 35, color: () => `hsl(${Math.floor(Math.random()*20)+30}, 90%, 50%)` },
  { name: 'overlord',   minScore: 700, minLevel: 9,  r: 34, hp: 20, speed: [0.5, 0.8], cooldown: [2600, 3400], pattern: 'megaburst', bulletSpeed: 5,   color: () => `hsl(${Math.floor(Math.random()*15)+290}, 65%, 35%)` },
  { name: 'artillery',  minScore: 700, minLevel: 9,  r: 20, hp: 8,  speed: [0.4, 0.7], cooldown: [3200, 4200], pattern: 'mortar',    bulletSpeed: 0,   meleeDamage: 40, color: () => `hsl(${Math.floor(Math.random()*10)+0}, 70%, 32%)` },
  { name: 'swarmqueen', minScore: 700, minLevel: 9,  r: 22, hp: 10, speed: [0.9, 1.3], cooldown: [1400, 2000], pattern: 'triple',    bulletSpeed: 5,   splits: true, color: () => `hsl(${Math.floor(Math.random()*15)+95}, 70%, 40%)` },
  { name: 'vortex',     minScore: 700, minLevel: 9,  r: 19, hp: 9,  speed: [0.7, 1.1], cooldown: [180, 180],   pattern: 'spiral',    bulletSpeed: 5,   color: () => `hsl(${Math.floor(Math.random()*15)+195}, 80%, 55%)` },
  { name: 'splitter',   minScore: 250, minLevel: 4,  r: 23, hp: 11, speed: [0.9, 1.4], cooldown: [1500, 2200], pattern: 'single',    bulletSpeed: 5.5, splitsSelf: 3, color: () => `hsl(${Math.floor(Math.random()*15)+15}, 65%, 45%)` }
];

// Speciale bots: zeldzaam, maar stuk voor stuk zwaar en met een uniek gevecht-gimmick
const SPECIAL_BOT_TYPES = [
  { name: 'swapper',    minScore: 700, minLevel: 9,  r: 18, hp: 12, speed: [1.0, 1.5], cooldown: [500, 500],   pattern: 'single',    bulletSpeed: 6.5, bulletDmg: 10, swapOnHit: true, color: () => `hsl(${Math.floor(Math.random()*15)+300}, 85%, 45%)` },
  { name: 'warden',     minScore: 700, minLevel: 9,  r: 19, hp: 10, speed: [0.9, 1.3], cooldown: [1000, 1000], pattern: 'mine',          bulletSpeed: 0, specialDmg: 26, color: () => `hsl(${Math.floor(Math.random()*15)+25}, 80%, 40%)` },
  { name: 'arclight',   minScore: 700, minLevel: 9,  r: 17, hp: 9,  speed: [1.1, 1.6], cooldown: [2200, 2800], pattern: 'shockbolt',     bulletSpeed: 0, specialDmg: 18, color: () => `hsl(${Math.floor(Math.random()*15)+50}, 90%, 55%)` },
  { name: 'miasma',     minScore: 700, minLevel: 9,  r: 18, hp: 10, speed: [0.9, 1.3], cooldown: [1000, 1000], pattern: 'gascloud',      bulletSpeed: 0, specialDmg: 9,  color: () => `hsl(${Math.floor(Math.random()*15)+100}, 65%, 40%)` },
  { name: 'bulwark',    minScore: 700, minLevel: 9,  r: 23, hp: 15, speed: [1.3, 1.8], cooldown: [1800, 2400], pattern: 'shieldbash',    bulletSpeed: 0, specialDmg: 22, color: () => `hsl(${Math.floor(Math.random()*15)+215}, 55%, 40%)` },
  { name: 'broodmother', minScore: 700, minLevel: 9, r: 21, hp: 13, speed: [0.7, 1.1], cooldown: [4500, 5500], pattern: 'summon',        bulletSpeed: 0, specialDmg: 0,  color: () => `hsl(${Math.floor(Math.random()*15)+265}, 65%, 40%)` },
  { name: 'gravitas',   minScore: 700, minLevel: 9,  r: 22, hp: 12, speed: [0.6, 1.0], cooldown: [4200, 5000], pattern: 'gravitywell',   bulletSpeed: 0, specialDmg: 24, color: () => `hsl(${Math.floor(Math.random()*15)+250}, 70%, 35%)` },
  { name: 'cryostasis', minScore: 700, minLevel: 9,  r: 18, hp: 10, speed: [0.9, 1.3], cooldown: [4000, 4000], pattern: 'freezetrap',    bulletSpeed: 0, specialDmg: 8,  color: () => `hsl(${Math.floor(Math.random()*15)+195}, 75%, 60%)` },
  { name: 'railgunner', minScore: 700, minLevel: 9,  r: 20, hp: 10, speed: [0.5, 0.8], cooldown: [1200, 1200], pattern: 'snipebeam',     bulletSpeed: 0, specialDmg: 42, color: () => `hsl(${Math.floor(Math.random()*15)+5}, 80%, 45%)` },
  { name: 'vexer',      minScore: 700, minLevel: 9,  r: 17, hp: 9,  speed: [1.0, 1.4], cooldown: [1300, 1300], pattern: 'curse',         bulletSpeed: 0, specialDmg: 0,  color: () => `hsl(${Math.floor(Math.random()*15)+320}, 60%, 40%)` },
  { name: 'bombardier', minScore: 700, minLevel: 9,  r: 20, hp: 11, speed: [0.6, 1.0], cooldown: [3800, 4400], pattern: 'clusterbomb',   bulletSpeed: 0, specialDmg: 14, color: () => `hsl(${Math.floor(Math.random()*15)+35}, 75%, 42%)` }
];
const SPECIAL_SPAWN_CHANCE = 0.13; // 13% kans zodra ze ontgrendeld zijn
const MAX_SPECIAL_BOTS_ALIVE = 3; // max aantal special bots tegelijk in het speelveld
const MAX_SPLITTERS_ALIVE = 15; // max aantal Splitters (groot + klein) tegelijk in het speelveld

// De bosses: verschijnen elk precies één keer per potje, enorm, traag en met een verwoestende special attack
const BOSS_TYPES = [
  { name: 'colossus', displayName: 'Colossus', minScore: 1000, minLevel: 10, r: 55, hp: 160, speed: [0.3, 0.45],  cooldown: [1800, 2200], pattern: 'boss', bulletSpeed: 5,   specialACooldown: 3500, specialBCooldown: 4500, specialDmg: 30, color: () => `hsl(${Math.floor(Math.random()*15)+345}, 75%, 30%)` },
  { name: 'titan',    displayName: 'Titan',    minScore: 3000, minLevel: 15, r: 65, hp: 240, speed: [0.28, 0.4], cooldown: [1600, 2000], pattern: 'boss', bulletSpeed: 5.5, specialACooldown: 3000, specialBCooldown: 5000, specialDmg: 38, color: () => `hsl(${Math.floor(Math.random()*15)+20}, 80%, 32%)` },
  { name: 'behemoth', displayName: 'Behemoth', minScore: 5000, minLevel: 20, r: 75, hp: 320, speed: [0.25, 0.35], cooldown: [1400, 1800], pattern: 'boss', bulletSpeed: 6,   specialACooldown: 2500, specialBCooldown: 5500, specialDmg: 45, color: () => `hsl(${Math.floor(Math.random()*15)+265}, 70%, 26%)` },
  { name: 'nemesis',  displayName: 'Nemesis',  minScore: 7500, minLevel: 25, r: 82, hp: 420, speed: [0.26, 0.38], cooldown: [1300, 1700], pattern: 'boss', bulletSpeed: 6.5, specialACooldown: 2200, specialBCooldown: 4200, specialCCooldown: 6500, specialDmg: 50, color: () => `hsl(${Math.floor(Math.random()*15)+42}, 85%, 32%)` },
  { name: 'leviathan', displayName: 'Leviathan', minScore: 10000, minLevel: 30, r: 90, hp: 500, speed: [0.24, 0.36], cooldown: [1200, 1600], pattern: 'boss', bulletSpeed: 7, specialACooldown: 3000, specialBCooldown: 4500, specialCCooldown: 6000, specialDmg: 55, color: () => `hsl(${Math.floor(Math.random()*15)+200}, 80%, 35%)` },
  { name: 'abomination', displayName: 'Abomination', minScore: 13000, minLevel: 35, r: 95, hp: 600, speed: [0.22, 0.34], cooldown: [1100, 1500], pattern: 'boss', bulletSpeed: 7.5, specialACooldown: 2800, specialBCooldown: 4200, specialCCooldown: 5500, specialDmg: 60, color: () => `hsl(${Math.floor(Math.random()*15)+280}, 75%, 38%)` }
];
let bossAlive = false;
let bossWarningActive = false;
let bossesSpawned = {}; // per boss-naam: true zodra hij deze sessie al is verschenen

// Wereld 2 (Elementen): nog maar 3 simpele bots, los van het level/score-systeem van wereld 1
const WORLD2_BOT_TYPES = [
  { name: 'fireling',  r: 16, hp: 4, speed: [1.4, 2.2], cooldown: [1100, 1900], pattern: 'single', bulletSpeed: 5.5, color: () => '#ff5a1f' },
  { name: 'frostling', r: 16, hp: 4, speed: [1.2, 2.0], cooldown: [1100, 1900], pattern: 'single', bulletSpeed: 5.5, color: () => '#7fd9ff' },
  { name: 'earthling', r: 18, hp: 6, speed: [0.9, 1.5], cooldown: [1300, 2100], pattern: 'single', bulletSpeed: 5,   color: () => '#8a6a3a' }
];

function pickBotType() {
  if (currentWorld === 2) {
    return WORLD2_BOT_TYPES[Math.floor(Math.random() * WORLD2_BOT_TYPES.length)];
  }
  let unlocked = gameMode === 'levels'
    ? BOT_TYPES.filter(t => currentLevel >= t.minLevel)
    : BOT_TYPES.filter(t => score >= t.minScore);
  const splitterCount = bots.filter(b => !b.dead && b.type === 'splitter').length;
  if (splitterCount >= MAX_SPLITTERS_ALIVE) {
    const withoutSplitter = unlocked.filter(t => t.name !== 'splitter');
    if (withoutSplitter.length) unlocked = withoutSplitter;
  }
  const specialUnlocked = gameMode === 'levels'
    ? SPECIAL_BOT_TYPES.filter(t => currentLevel >= t.minLevel)
    : SPECIAL_BOT_TYPES.filter(t => score >= t.minScore);
  const specialAliveCount = bots.filter(b => !b.dead && SPECIAL_BOT_TYPES.some(t => t.name === b.type)).length;
  if (specialUnlocked.length && specialAliveCount < MAX_SPECIAL_BOTS_ALIVE && Math.random() < SPECIAL_SPAWN_CHANCE) {
    return specialUnlocked[Math.floor(Math.random() * specialUnlocked.length)];
  }
  return unlocked[Math.floor(Math.random() * unlocked.length)];
}

function spawnBot() {
  const type = pickBotType();
  let x, y;

  if (type.pattern === 'turret') {
    // turret staat stil, dus die moet meteen zichtbaar in beeld spawnen
    const margin = 80;
    x = margin + Math.random() * (canvas.width - margin * 2);
    y = margin + Math.random() * (canvas.height - margin * 2);
  } else {
    // spawn at edge of screen
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) { x = Math.random() * canvas.width; y = -30; }
    else if (edge === 1) { x = canvas.width + 30; y = Math.random() * canvas.height; }
    else if (edge === 2) { x = Math.random() * canvas.width; y = canvas.height + 30; }
    else { x = -30; y = Math.random() * canvas.height; }
  }

  const hcMult = gameMode === 'hardcore' ? HARDCORE_MULT : 1;
  bots.push({
    x, y,
    r: type.r,
    speed: type.speed[0] + Math.random() * (type.speed[1] - type.speed[0]),
    hp: type.hp * hcMult,
    maxHp: type.hp * hcMult,
    lastShot: 0,
    shootCooldown: type.cooldown[0] + Math.random() * (type.cooldown[1] - type.cooldown[0]),
    color: type.color(),
    type: type.name,
    pattern: type.pattern,
    bulletSpeed: type.bulletSpeed,
    bulletDmg: type.bulletDmg || 0,
    swapOnHit: type.swapOnHit || false,
    meleeDamage: (type.meleeDamage || 0) * hcMult,
    specialDmg: (type.specialDmg || 0) * hcMult,
    specialLastUsed: 0,
    splits: type.splits || false,
    splitsSelf: type.splitsSelf || 0,
    spiralAngle: 0,
    frozenUntil: 0,
    slashUntil: 0
  });
}

function spawnBoss(type) {
  const x = canvas.width / 2;
  const y = -type.r - 20; // net buiten beeld, komt langzaam van boven binnen
  const hcMult = gameMode === 'hardcore' ? HARDCORE_MULT : 1;
  bots.push({
    x, y,
    r: type.r,
    speed: type.speed[0] + Math.random() * (type.speed[1] - type.speed[0]),
    hp: type.hp * hcMult,
    maxHp: type.hp * hcMult,
    lastShot: 0,
    shootCooldown: type.cooldown[0] + Math.random() * (type.cooldown[1] - type.cooldown[0]),
    color: type.color(),
    type: type.name,
    pattern: type.pattern,
    bulletSpeed: type.bulletSpeed,
    meleeDamage: (type.meleeDamage || 0) * hcMult,
    splits: false,
    spiralAngle: 0,
    specialALastUsed: performance.now(),
    specialACooldown: type.specialACooldown,
    specialBLastUsed: performance.now() + 2000, // iets vertraagd zodat specials niet gelijk vallen
    specialBCooldown: type.specialBCooldown,
    specialCLastUsed: performance.now() + 4000, // nog iets later, zodat alle 3 specials verspreid vallen
    specialCCooldown: type.specialCCooldown,
    specialDmg: (type.specialDmg || 30) * hcMult,
    isBoss: true,
    frozenUntil: 0,
    slashUntil: 0
  });
  bossAlive = true;
}

function showBossAlert(type) {
  const el = document.getElementById('bossAlert');
  if (!el) return;
  el.textContent = `⚠ ${(type.displayName || 'BOSS').toUpperCase()} NADERT ⚠`;
  el.style.display = 'flex';
  setTimeout(() => { el.style.display = 'none'; }, 2500);
}

function triggerBossWarning(type) {
  bossWarningActive = true;
  bossesSpawned[type.name] = true;
  showBossAlert(type);
  setTimeout(() => {
    bossWarningActive = false;
    if (gameOver || levelTransition) return;
    spawnBoss(type);
  }, 2500);
}


function initGame() {
  resetPlayer();
  isPaused = false;
  const pauseOverlayEl = document.getElementById('pauseOverlay');
  if (pauseOverlayEl) pauseOverlayEl.style.display = 'none';
  const pauseBtnEl = document.getElementById('pauseBtn');
  if (pauseBtnEl) pauseBtnEl.textContent = '⏸ Pauze';
  bots = [];
  bullets = [];
  particles = [];
  powerups = [];
  coinPickups = [];
  explosions = [];
  telegraphs = [];
  lightningBolts = [];
  fallingMeteors = [];
  blackHoles = [];
  laserTelegraphs = [];
  activeLasers = [];
  iceGrenades = [];
  cryoGrenadeLastUsed = 0;
  vampBolts = [];
  vampBoltLastUsed = 0;
  stickyThrows = [];
  bladeTrails = [];
  fireballThrows = [];
  fireZones = [];
  gasClouds = [];
  barrageLasers = [];
  barrageTelegraphs = [];
  iceFloorUntil = 0;
  sandstormUntil = 0;
  lightningStormUntil = 0;
  meteorShowerUntil = 0;
  earthquakeShakeUntil = 0;
  lastEarthquakeShake = 0;
  tornadoUntil = 0;
  tsunamiUntil = 0;
  tsunamiWaves = [];
  activeDisasterType = null;
  disasterEndAt = 0;
  nextDisasterAt = performance.now() + 30000 + Math.random() * 25000;
  chargeTrails = [];
  deployedTurrets = [];
  bossAlive = false;
  bossWarningActive = false;
  bossesSpawned = {};
  score = 0;
  gameOver = false;
  levelTransition = false;
  lastPowerupSpawn = performance.now();
  lastLevelSpawn = performance.now();
  lastCoinSpawn = performance.now();
  if (gameMode === 'levels') {
    currentLevel = 1;
    const cfg = levelConfig(currentLevel);
    levelTarget = cfg.target;
    levelKills = 0;
    for (let i = 0; i < Math.min(3, cfg.maxBots); i++) spawnBot();
  } else {
    for (let i = 0; i < 4; i++) spawnBot();
  }
  document.getElementById('msg').style.display = 'none';
  document.getElementById('levelHud').style.display = gameMode === 'levels' ? 'inline' : 'none';
  updateHUD();
}

// Start het volgende level zonder score/hp helemaal te resetten
function setupNextLevel() {
  bots = [];
  bullets = [];
  particles = [];
  powerups = [];
  coinPickups = [];
  explosions = [];
  telegraphs = [];
  lightningBolts = [];
  fallingMeteors = [];
  blackHoles = [];
  laserTelegraphs = [];
  activeLasers = [];
  iceGrenades = [];
  cryoGrenadeLastUsed = 0;
  vampBolts = [];
  vampBoltLastUsed = 0;
  stickyThrows = [];
  bladeTrails = [];
  fireballThrows = [];
  fireZones = [];
  gasClouds = [];
  barrageLasers = [];
  barrageTelegraphs = [];
  iceFloorUntil = 0;
  sandstormUntil = 0;
  lightningStormUntil = 0;
  meteorShowerUntil = 0;
  earthquakeShakeUntil = 0;
  lastEarthquakeShake = 0;
  tornadoUntil = 0;
  tsunamiUntil = 0;
  tsunamiWaves = [];
  activeDisasterType = null;
  disasterEndAt = 0;
  nextDisasterAt = performance.now() + 30000 + Math.random() * 25000;
  chargeTrails = [];
  deployedTurrets = [];
  gameOver = false;
  levelTransition = false;
  lastPowerupSpawn = performance.now();
  lastLevelSpawn = performance.now();
  lastCoinSpawn = performance.now();
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  player.adrenalineUsed = false;
  player.reviveUsed = false;
  player.secondWindUsed = false;
  const cfg = levelConfig(currentLevel);
  levelTarget = cfg.target;
  levelKills = 0;
  for (let i = 0; i < Math.min(3, cfg.maxBots); i++) spawnBot();
  document.getElementById('msg').style.display = 'none';
  updateHUD();
}

function selectMode(mode) {
  gameMode = mode;
  currentLevel = 1;
  practiceWeaponId = null;
  weaponPracticeActive = false;
  transformPracticeActive = false;
  disasterPracticeActive = false;
  disasterPracticeType = null;
  exitSkinPractice();
  document.getElementById('startScreen').style.display = 'none';
  initGame();
  startMusic();
  if (!loopRunning) {
    loopRunning = true;
    loop();
  }
}
window.selectMode = selectMode;

function startWorld2Game() {
  if (!world2Unlocked) return;
  currentWorld = 2;
  gameMode = 'endless';
  currentLevel = 1;
  practiceWeaponId = null;
  weaponPracticeActive = false;
  transformPracticeActive = false;
  disasterPracticeActive = false;
  disasterPracticeType = null;
  exitSkinPractice();
  document.getElementById('world2Screen').style.display = 'none';
  initGame();
  startMusic();
  if (!loopRunning) {
    loopRunning = true;
    loop();
  }
}
window.startWorld2Game = startWorld2Game;

function updateHUD() {
  const inPracticeSession = weaponPracticeActive || transformPracticeActive;
  document.getElementById('scoreVal').textContent = inPracticeSession ? '—' : score;
  document.getElementById('highScoreVal').textContent = inPracticeSession ? '—' : (gameMode === 'hardcore' ? highScoreHardcore : highScore);
  document.getElementById('hpVal').textContent = Math.max(0, Math.round(player.hp));
  document.getElementById('coinsVal').textContent = inPracticeSession ? '—' : coins;
  document.getElementById('botsVal').textContent = bots.length;
  if (gameMode === 'levels') {
    document.getElementById('levelVal').textContent = currentLevel;
    document.getElementById('levelProgressVal').textContent = `${levelKills}/${levelTarget}`;
  }
  const now = performance.now();
  const active = [];
  if (now < player.boostUntil) active.push('⚡ Speed');
  if (now < player.fireBoostUntil) active.push('🔥 Snelvuur');
  if (now < player.shieldUntil) active.push('🛡 Schild');
  if (now < player.damageBoostUntil) active.push('💥 Damage');
  if (now < player.multiShotUntil) active.push('✦ Multishot');
  if (now < player.invisibleUntil) active.push('👻 Onzichtbaar');
  if (now < player.timewarpUntil) active.push('⏳ Timewarp');
  if (now < player.ricochetUntil) active.push('🔄 Terugkaats');
  if (now < player.homingUntil) active.push('🎯 Homing');
  if (now < player.stunUntil) active.push('⊗ Stun');
  if (now < player.auraUntil) active.push('💫 Aura');
  if (now < player.overloadUntil) active.push('⚡ Overload');
  if (now < player.slowUntil) active.push('🐌 Vertraagd');
  if (now < player.rootedUntil) active.push('🥶 Bevroren');
  if (now < player.curseUntil) active.push('☠ Vervloekt (-50% schade)');
  if (now < player.confuseUntil) active.push('🌀 Verwarring');
  if (player.activeTransform === 'tank') {
    active.push('🚜 Tank — alleen handgranaten');
  } else if (player.activeTransform === 'berserker') {
    active.push('🔪 Berserker — alleen mes-waaier');
  } else if (player.activeTransform === 'sniper') {
    active.push('🎯 Sniper Mech — alleen railgun');
  } else if (player.activeTransform === 'swarm') {
    active.push('🛰️ Drone Hive — alleen dronesalvo');
  } else if (player.activeTransform === 'pyro') {
    active.push('🔥 Pyromancer — alleen vuurballen');
  } else if (player.activeTransform === 'vampire') {
    active.push('🧛 Vampire Lord — alleen beet');
  } else if (player.activeTransform === 'assassin') {
    active.push('🗡️ Shadow Assassin — alleen blink-strike');
  } else if (player.activeTransform === 'necromancer') {
    active.push('💀 Soul Reaper — alleen chain-aanval');
  } else if (player.activeTransform === 'stormcaller') {
    active.push('⚡ Storm Caller — alleen bliksemschicht');
  } else if (player.activeTransform === 'juggernaut') {
    active.push('🐗 Juggernaut — alleen beuk-charge');
  } else if (player.activeTransform === 'engineer') {
    active.push(`🔧 Field Engineer — koepels ${deployedTurrets.length}/${ENGINEER_MAX_TURRETS}`);
  } else {
    if (getWeapon().effect === 'killstreak' && player.killStreak > 0) active.push(`🗡️ Streak x${player.killStreak}`);
    if (['combofire', 'combofrost', 'combovolt', 'comboneonpink', 'comboneoncyan', 'comboneonlime'].includes(equippedSkin) && player.comboStreak > 0) active.push(`🔥 Combo x${player.comboStreak}`);
    if (getWeapon().id === 'cryorifle') {
      const remain = CRYO_GRENADE_COOLDOWN - (now - cryoGrenadeLastUsed);
      active.push(remain <= 0 ? '❄️ Granaat (E) gereed' : `❄️ Granaat over ${Math.ceil(remain / 1000)}s`);
    }
    if (getWeapon().id === 'vampcannon') {
      const remain = VAMP_BOLT_COOLDOWN - (now - vampBoltLastUsed);
      active.push(remain <= 0 ? '🩸 Levenzuiger (E) gereed' : `🩸 Levenzuiger over ${Math.ceil(remain / 1000)}s`);
    }
    if (getWeapon().id === 'voltcaster') {
      const remain = VOLT_NOVA_COOLDOWN - (now - voltNovaLastUsed);
      active.push(remain <= 0 ? '⚡ Volt Nova (E) gereed' : `⚡ Volt Nova over ${Math.ceil(remain / 1000)}s`);
    }
    if (getWeapon().id === 'singularity') {
      const remain = RIFT_PULSE_COOLDOWN - (now - riftPulseLastUsed);
      active.push(remain <= 0 ? '🕳️ Rift Pulse (E) gereed' : `🕳️ Rift Pulse over ${Math.ceil(remain / 1000)}s`);
    }
    if (getWeapon().id === 'stickybomb') {
      const remain = STICKY_BARRAGE_COOLDOWN - (now - stickyBarrageLastUsed);
      active.push(remain <= 0 ? '💣 Bominworp (E) gereed' : `💣 Bominworp over ${Math.ceil(remain / 1000)}s`);
    }
    if (getWeapon().id === 'toxiccannon') {
      const remain = TOXIC_CLOUD_COOLDOWN - (now - toxicCloudLastUsed);
      active.push(remain <= 0 ? '☠️ Gifwolk (E) gereed' : `☠️ Gifwolk over ${Math.ceil(remain / 1000)}s`);
    }
    if (getWeapon().id === 'executioner') {
      const remain = EXECUTION_ORDER_COOLDOWN - (now - executionOrderLastUsed);
      active.push(remain <= 0 ? '⚔️ Doodvonnis (E) gereed' : `⚔️ Doodvonnis over ${Math.ceil(remain / 1000)}s`);
    }
    if (getWeapon().id === 'momentum') {
      const remain = BLADE_DASH_COOLDOWN - (now - bladeDashLastUsed);
      active.push(remain <= 0 ? '🗡️ Zwaardsprong (E) gereed' : `🗡️ Zwaardsprong over ${Math.ceil(remain / 1000)}s`);
    }
  }
  const boostEl = document.getElementById('boostVal');
  if (boostEl) {
    boostEl.textContent = active.length ? active.join(' · ') : '-';
  }
}

