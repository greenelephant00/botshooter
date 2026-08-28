// ---- Favorieten: markeer skins/wapens zodat ze bovenaan hun shoplijst verschijnen ----
let favoriteItems = JSON.parse(localStorage.getItem('botShooterFavoriteItems') || '[]');
function isFavorite(key) { return favoriteItems.includes(key); }
function toggleFavorite(key) {
  const idx = favoriteItems.indexOf(key);
  if (idx === -1) favoriteItems.push(key); else favoriteItems.splice(idx, 1);
  localStorage.setItem('botShooterFavoriteItems', JSON.stringify(favoriteItems));
}
function sortFavoritesFirst(arr, prefix) {
  return [...arr].sort((a, b) => (isFavorite(`${prefix}:${b.id}`) ? 1 : 0) - (isFavorite(`${prefix}:${a.id}`) ? 1 : 0));
}

// ---- Killstreak-drones: verschijnen één voor één naarmate je killstreak oploopt, helpen bots doden, verdwijnen als de streak weer daaronder zakt ----
const KILLSTREAK_DRONE_THRESHOLDS = [30, 50, 70, 100];
const KILLSTREAK_DRONE_ORBIT_RADIUS = 42;
const KILLSTREAK_DRONES = KILLSTREAK_DRONE_THRESHOLDS.map((threshold, i) => ({
  threshold,
  angle: (Math.PI * 2 / KILLSTREAK_DRONE_THRESHOLDS.length) * i,
  radius: KILLSTREAK_DRONE_ORBIT_RADIUS + i * 16,
  x: 0, y: 0, lastShot: 0, beam: null
}));
// Drone Upgrade: elke drone heeft zijn eigen, aparte upgrade-niveau — meer schade, sneller vuren, groter en feller uiterlijk
let droneLevels = JSON.parse(localStorage.getItem('botShooterDroneLevels') || JSON.stringify(KILLSTREAK_DRONE_THRESHOLDS.map(() => 0)));
const DRONE_UPGRADE_PRICES = [1500, 2500, 4000];
const DRONE_DMG_LEVELS = [2, 4, 6, 8];
const DRONE_COOLDOWN_LEVELS = [700, 550, 450, 380];
const DRONE_SCALE_LEVELS = [0.8, 0.95, 1.1, 1.25];
const DRONE_COLOR_LEVELS = ['#4cc9f0', '#4cd964', '#ffb703', '#ff4d4d'];
const DRONE_RANGE_LEVELS = [150, 190, 230, 260];
function droneDmg(lvl) { return DRONE_DMG_LEVELS[lvl]; }
function droneCooldown(lvl) { return DRONE_COOLDOWN_LEVELS[lvl]; }
function droneScale(lvl) { return DRONE_SCALE_LEVELS[lvl]; }
function droneColor(lvl) { return DRONE_COLOR_LEVELS[lvl]; }
function droneRange(lvl) { return DRONE_RANGE_LEVELS[lvl]; }
// Drone-testpotje: "Bekijk volgend niveau" start een schoon Endless-potje met de drone al actief, zonder killstreak nodig, zonder bosses/munten/powerups
let dronePracticeActive = false;
let dronePracticeLevel = 0;
let dronePracticeDrone = { angle: 0, radius: KILLSTREAK_DRONE_ORBIT_RADIUS, x: 0, y: 0, lastShot: 0, beam: null };
function updateOneDrone(drone, lvl, now0) {
  drone.angle += 0.05;
  drone.x = player.x + Math.cos(drone.angle) * drone.radius;
  drone.y = player.y + Math.sin(drone.angle) * drone.radius - 14;
  if (now0 - drone.lastShot > droneCooldown(lvl)) {
    let nearestDrone = null, nearestDroneDist = droneRange(lvl);
    bots.forEach(b => {
      if (b.dead) return;
      const dd = Math.hypot(b.x - drone.x, b.y - drone.y);
      if (dd < nearestDroneDist) { nearestDrone = b; nearestDroneDist = dd; }
    });
    if (nearestDrone) {
      drone.lastShot = now0;
      drone.beam = { x1: drone.x, y1: drone.y, x2: nearestDrone.x, y2: nearestDrone.y, bornAt: now0, color: droneColor(lvl) };
      damageBotSimple(nearestDrone, droneDmg(lvl), droneColor(lvl));
    }
  }
}

// ---- Intro Animatie: koop hoe je verschijnt bij het begin van een potje ----
let ownedIntroAnimations = JSON.parse(localStorage.getItem('botShooterOwnedIntroAnimations') || '["none"]');
let equippedIntroAnimation = localStorage.getItem('botShooterEquippedIntroAnimation') || 'none';
const INTRO_ANIM_DURATION = 1600;
const INTRO_ANIMATIONS = [
  { id: 'none',        name: 'Geen',          price: 0,    desc: 'Geen intro — je verschijnt gewoon meteen.' },
  { id: 'beam',        name: 'Lichtbundel',   price: 1900, desc: 'Een felle lichtbundel daalt neer van boven en je materialiseert erin.' },
  { id: 'portal',      name: 'Portaalstap',   price: 1950, desc: 'Je stapt uit een kolkend portaal dat achter je weer dichttrekt.' },
  { id: 'materialize', name: 'Materialisatie', price: 1950, desc: 'Je lichaam bouwt zich op uit deeltjes die van alle kanten naar binnen vliegen.' },
  { id: 'dropin',      name: 'Luchtlanding',  price: 1900, desc: 'Je valt van boven neer en landt met een korte schokgolf.' },
  { id: 'flash',       name: 'Flitsinstap',   price: 1850, desc: 'Een felle witte lichtflits en daar sta je.' },
  { id: 'spin',        name: 'Duizelspawn',   price: 1900, desc: 'Je tolt razendsnel rond en komt tot stilstand zodra je verschijnt.' }
];

// ---- Mysterie-doos: koop een verrassing, maar maar 1x per half uur ----
const MYSTERY_BOX_PRICE = 500;
const MYSTERY_BOX_COOLDOWN = 1800000; // half uur
let lastMysteryBoxOpen = Number(localStorage.getItem('botShooterLastMysteryBoxOpen')) || 0;
function mysteryBoxReady() { return Date.now() - lastMysteryBoxOpen >= MYSTERY_BOX_COOLDOWN; }
function mysteryBoxTimeLeft() { return Math.max(0, MYSTERY_BOX_COOLDOWN - (Date.now() - lastMysteryBoxOpen)); }
const MYSTERY_BOX_TABLE = [
  { chance: 0.10, amount: 100 },
  { chance: 0.20, amount: 200 },
  { chance: 0.20, amount: 300 },
  { chance: 0.20, amount: 400 },
  { chance: 0.15, amount: 500 },
  { chance: 0.10, amount: 900 },
  { chance: 0.03, amount: 1200 },
  { chance: 0.02, amount: 2000 }
];
function rollMysteryBoxReward() {
  const roll = Math.random();
  let cumulative = 0;
  for (const entry of MYSTERY_BOX_TABLE) {
    cumulative += entry.chance;
    if (roll < cumulative) return entry.amount;
  }
  return MYSTERY_BOX_TABLE[MYSTERY_BOX_TABLE.length - 1].amount;
}

// ---- Wereld 2 Mysterie-doos: zelfde principe, maar beloont Elemental Cores i.p.v. munten (kost wel munten) ----
const WORLD2_MYSTERY_BOX_PRICE = 6; // kost Elemental Cores, niet munten
const WORLD2_MYSTERY_BOX_COOLDOWN = 1800000; // half uur
let lastWorld2MysteryBoxOpen = Number(localStorage.getItem('botShooterLastWorld2MysteryBoxOpen')) || 0;
function world2MysteryBoxReady() { return Date.now() - lastWorld2MysteryBoxOpen >= WORLD2_MYSTERY_BOX_COOLDOWN; }
function world2MysteryBoxTimeLeft() { return Math.max(0, WORLD2_MYSTERY_BOX_COOLDOWN - (Date.now() - lastWorld2MysteryBoxOpen)); }
const WORLD2_MYSTERY_BOX_TABLE = [
  { chance: 0.10, amount: 2 },
  { chance: 0.20, amount: 3 },
  { chance: 0.20, amount: 4 },
  { chance: 0.20, amount: 5 },
  { chance: 0.15, amount: 7 },
  { chance: 0.10, amount: 10 },
  { chance: 0.03, amount: 15 },
  { chance: 0.02, amount: 25 }
];
function rollWorld2MysteryBoxReward() {
  const roll = Math.random();
  let cumulative = 0;
  for (const entry of WORLD2_MYSTERY_BOX_TABLE) {
    cumulative += entry.chance;
    if (roll < cumulative) return entry.amount;
  }
  return WORLD2_MYSTERY_BOX_TABLE[WORLD2_MYSTERY_BOX_TABLE.length - 1].amount;
}

// ---- Risico-doos: goedkoop, maar een flinke kans op niets — gecompenseerd door een kleine kans op een grote uitbetaling ----
const RISK_BOX_PRICE = 600;
const RISK_BOX_COOLDOWN = 1800000; // half uur
let lastRiskBoxOpen = Number(localStorage.getItem('botShooterLastRiskBoxOpen')) || 0;
function riskBoxReady() { return Date.now() - lastRiskBoxOpen >= RISK_BOX_COOLDOWN; }
function riskBoxTimeLeft() { return Math.max(0, RISK_BOX_COOLDOWN - (Date.now() - lastRiskBoxOpen)); }
const RISK_BOX_TABLE = [
  { chance: 0.30, amount: 0 },
  { chance: 0.25, amount: 150 },
  { chance: 0.20, amount: 400 },
  { chance: 0.15, amount: 800 },
  { chance: 0.07, amount: 1800 },
  { chance: 0.03, amount: 3000 }
];
function rollRiskBoxReward() {
  const roll = Math.random();
  let cumulative = 0;
  for (const entry of RISK_BOX_TABLE) {
    cumulative += entry.chance;
    if (roll < cumulative) return entry.amount;
  }
  return RISK_BOX_TABLE[RISK_BOX_TABLE.length - 1].amount;
}

// ---- Dubbel-of-niets-doos: zelf gekozen inzet (max 500 munten), 40% kans om te verdubbelen ----
const DOUBLE_OR_NOTHING_MAX_STAKE = 500;
let doubleOrNothingStake = Math.max(0, Math.min(DOUBLE_OR_NOTHING_MAX_STAKE, Number(localStorage.getItem('botShooterDoubleOrNothingStake')) || 100));

// ---- Kern-dubbel-of-niets-doos: zelfde principe maar met Elemental Cores (alleen Wereld 2) ----
const CORE_DOUBLE_OR_NOTHING_MAX_STAKE = 25;
let coreDoubleOrNothingStake = Math.max(0, Math.min(CORE_DOUBLE_OR_NOTHING_MAX_STAKE, Number(localStorage.getItem('botShooterCoreDoubleOrNothingStake')) || 5));

// ---- Game state ----
let bullets = [];
let bots = [];
let particles = [];
let powerups = [];
let explosions = [];
// Player killeffect: een animatie op de bot zelf op het moment dat jij hem killt (los van je Death Animation, die pas afspeelt als JIJ doodgaat)
let botDeathAnimations = [];
// Elke prestatie-exclusieve skin heeft zijn eigen vaste, unieke player killeffect — overschrijft je gekozen Bot Kill Effect zolang die skin uitgerust is
const EXCLUSIVE_SKIN_DEATH_ANIM = { titanchrome: 'chromeshatter', supernova: 'novacollapse', neonultra: 'neonoverload' };
// Sommige player killeffecten spelen korter af dan de standaard death-animation-duur (novacollapse iets korter dan de rest)
const EXCLUSIVE_SKIN_DEATH_ANIM_DURATION = { novacollapse: 1900 };
// Bot Kill Effect-shop: eigen, kortere en compactere animaties dan Death Animation, los bezit/uitgerust
let ownedBotKillEffects = JSON.parse(localStorage.getItem('botShooterOwnedBotKillEffects') || '["none"]');
let equippedBotKillEffect = localStorage.getItem('botShooterEquippedBotKillEffect') || 'none';
const BOT_KILL_EFFECTS = [
  { id: 'none',       name: 'Geen',        price: 0,    duration: 0,   desc: 'Geen extra effect op de bot.' },
  { id: 'pixelpop',   name: 'Pixelpop',    price: 1850, duration: 550, desc: 'De bot valt uiteen in blokkerige pixels die naar buiten ploffen.' },
  { id: 'sparkburst', name: 'Vonkenbarst', price: 1900, duration: 400, desc: 'Een felle witte flits gevolgd door metalige vonken die alle kanten op schieten.' },
  { id: 'poof',       name: 'Rookpoef',    price: 1800, duration: 450, desc: 'Een korte, snel uitdijende rookring — en de bot is meteen weg.' },
  { id: 'shrinkpop',  name: 'Krimppop',    price: 1800, duration: 350, desc: 'De bot krimpt razendsnel ineen en verdwijnt met een klein lichtflitsje.' },
  { id: 'coinburst',  name: 'Muntbarst',   price: 1950, duration: 550, desc: 'De bot barst uiteen in kleine gouden muntjes die wegstuiteren.' },
  { id: 'dustcloud',  name: 'Stofwolk',    price: 1800, duration: 500, desc: 'Een lage stofwolk poeft op waar de bot stond.' },
  { id: 'splinter',   name: 'Splinterhout', price: 1850, duration: 500, desc: 'De bot spat uiteen in houten splinters.' },
  { id: 'ragdoll',    name: 'Tuimelval',   price: 1900, duration: 500, desc: 'De bot tolt rond terwijl hij ineenkrimpt en vervaagt.' },
  { id: 'voidsuck',   name: 'Nietsvortex', price: 1950, duration: 400, desc: 'Een piepklein zwart gaatje zuigt de bot in een oogwenk naar binnen.' }
];
function maybeTriggerPlayerKillEffect(bot) {
  const exclusiveType = EXCLUSIVE_SKIN_DEATH_ANIM[getSkin()];
  if (exclusiveType) {
    const duration = EXCLUSIVE_SKIN_DEATH_ANIM_DURATION[exclusiveType] || DEATH_ANIM_DURATION;
    botDeathAnimations.push({ x: bot.x, y: bot.y, r: bot.r, type: exclusiveType, kind: 'exclusive', duration, born: performance.now() });
    return;
  }
  if (equippedBotKillEffect === 'none') return;
  const effect = BOT_KILL_EFFECTS.find(e => e.id === equippedBotKillEffect);
  if (!effect) return;
  botDeathAnimations.push({ x: bot.x, y: bot.y, r: bot.r, type: effect.id, kind: 'botkill', duration: effect.duration, born: performance.now() });
}

// ---- Lifetime statistieken (Statistieken-scherm) ----
let totalLifetimeKills = Number(localStorage.getItem('botShooterTotalLifetimeKills')) || 0;
let weaponKillCounts = JSON.parse(localStorage.getItem('botShooterWeaponKillCounts') || '{}');
function recordKillStat() {
  totalLifetimeKills++;
  localStorage.setItem('botShooterTotalLifetimeKills', totalLifetimeKills);
  const wid = getWeapon().id;
  weaponKillCounts[wid] = (weaponKillCounts[wid] || 0) + 1;
  localStorage.setItem('botShooterWeaponKillCounts', JSON.stringify(weaponKillCounts));
}
function favoriteWeaponName() {
  let bestId = null, bestCount = 0;
  for (const wid in weaponKillCounts) {
    if (weaponKillCounts[wid] > bestCount) { bestCount = weaponKillCounts[wid]; bestId = wid; }
  }
  if (!bestId) return 'Nog geen kills';
  const all = [...WEAPONS, ...SPECIAL_WEAPONS, ...WORLD2_WEAPONS, ...WORLD2_SPECIAL_WEAPONS];
  const w = all.find(w => w.id === bestId);
  return w ? `${w.name} (${bestCount} kills)` : `${bestId} (${bestCount} kills)`;
}
let iceGrenades = [];
let cryoGrenadeLastUsed = 0;
const CRYO_GRENADE_COOLDOWN = 10000;
const CRYO_GRENADE_DMG = 10;
let vampBolts = [];
let vampBoltLastUsed = 0;
const VAMP_BOLT_COOLDOWN = 10000;
const VAMP_BOLT_DMG = 10;
const VAMP_BOLT_HEAL = 8;
let voltNovaLastUsed = 0;
const VOLT_NOVA_COOLDOWN = 10000;
const VOLT_NOVA_RADIUS = 220;
const VOLT_NOVA_DMG = 12;
let riftPulseLastUsed = 0;
const RIFT_PULSE_COOLDOWN = 12000;
let lavaFieldLastUsed = 0;
const LAVA_FIELD_COOLDOWN = 10000;
const LAVA_FIELD_RADIUS = 90;
const LAVA_FIELD_DURATION = 5000;
const LAVA_FIELD_TICK_DMG = 6;
let hurricaneBlastLastUsed = 0;
const HURRICANE_BLAST_COOLDOWN = 10000;
const HURRICANE_BLAST_RADIUS = 200;
const HURRICANE_BLAST_DMG = 8;
let frostLanceLastUsed = 0;
const FROST_LANCE_COOLDOWN = 10000;
const FROST_LANCE_RANGE = 500;
const FROST_LANCE_DMG = 10;
let earthSlamLastUsed = 0;
const EARTH_SLAM_COOLDOWN = 10000;
const EARTH_SLAM_RADIUS = 170;
const EARTH_SLAM_DMG = 10;
let iceLances = []; // Rijmlans-special: korte, gloeiende ijslijn-visual
let tornadoShots = []; // Tornado-schot powerup: ronddwalend projectiel dat bots meesleurt en van de kaart slingert
let rootDrags = []; // Wortelgeweer: dunne boomwortel die uit een scheur in de aarde komt en een bot mee naar beneden trekt
let fireRings = []; // Vuurtitaan-boss: statische vuurring om de speler, bots door ongehinderd, speler vat vlam bij oversteken
let chasingCracks = []; // Aardkoning-boss: achtervolgende scheur die de speler blijft opjagen
let fireballThrows = []; // Pyromancer-transformatie: vliegende vuurballen
let fireZones = []; // Pyromancer-transformatie: brandende zones die schade-over-tijd doen
let gasClouds = []; // Miasma special bot: gifwolken die schade-over-tijd doen aan de speler
let barrageLasers = []; // Elementenstorm-powerup: vuur/ijsstralen vanaf de zijkanten die alleen bots raken
let barrageTelegraphs = []; // Elementenstorm-powerup: stippellijn-waarschuwing vóór elke straal

// ---- Natuurrampen ----
let iceFloorUntil = 0; // IJsvloer: de hele vloer is bevroren en glad
let sandstormUntil = 0; // Zandstorm: verminderd zicht en snelheid
let lightningStormUntil = 0; // Bliksemstorm: periodieke blikseminslagen
let lastLightningStrike = 0;
let meteorShowerUntil = 0; // Meteorenregen: periodieke inslagen
let lastMeteorImpact = 0;
let fallingMeteors = []; // Meteorenregen: zichtbare meteoren die uit de lucht vallen, blijven liggen en wegtrekken
let treeGrabs = []; // Wortelgreep-powerup (Wereld 2): bomen die uit de grond komen en een bot mee naar beneden trekken
let shockRings = []; // Gedeeld: uitdijende schokgolf-ringen voor de Wereld 2 elementale powerup-effecten
let lavaPools = []; // Lavagolem (Wereld 2): vallende lava die blijft liggen en je in brand zet
let staticShockUntil = 0; // Donderknaap (Wereld 2): korte schok-jolt van het scherm bij een treffer
let earthquakeShakeUntil = 0; // Aardbeving: schermschudding + bots verstrooid
let lastEarthquakeShake = 0;
let tornadoUntil = 0; // Tornado: ronddwalende wervelwind die zuigt en wegslingert
let tornadoX = 0;
let tornadoY = 0;
let tornadoVX = 0;
let tornadoVY = 0;
let tsunamiUntil = 0; // Tsunami: natte, gladde vloer + periodieke vloedgolven
let lastTsunamiWave = 0;
let tsunamiWaves = []; // actieve vloedgolven die over het scherm razen
let activeDisasterType = null;
let disasterEndAt = 0;
let nextDisasterAt = 0;
const DISASTER_TYPES = [
  { id: 'iceFloor', name: '🧊 IJsvloer', desc: 'De hele vloer van het speelveld bevriest en wordt spekglad. Je beweging reageert traag en je glijdt door in de richting waar je heen ging in plaats van direct te kunnen bijsturen.' },
  { id: 'sandstorm', name: '🌪 Zandstorm', desc: 'Een zandstorm trekt over het veld: 7 sec lang beperkt zicht (donkere waas rond je) en 30% minder bewegingssnelheid.' },
  { id: 'lightningStorm', name: '⛈ Bliksemstorm', desc: '12 sec lang slaan er om de ~0,35 sec razendsnel echte bliksemschichten in op willekeurige, kort getelegrafeerde plekken op het veld. Zowel bots als jijzelf lopen schade op als je erin staat.' },
  { id: 'earthquake', name: '🌋 Aardbeving', desc: 'Een korte maar zeer hevige aardbeving: het scherm schudt keihard en alle bots worden abrupt en ver weg in willekeurige richtingen weggeslingerd.' },
  { id: 'meteorShower', name: '☄ Meteorenregen', desc: '10 sec lang vallen er om de ~0,5 sec getelegrafeerde meteorieten uit de lucht op willekeurige plekken. Je ziet ze echt naar beneden vallen, ze blijven even gloeiend liggen en trekken daarna langzaam weer weg. Zowel bots als jijzelf lopen schade op als je erin staat.' },
  { id: 'tornado', name: '🌀 Tornado', desc: '12 sec lang trekt een ronddwalende wervelwind grillig over het veld met een felle windkracht. Kom je in de buurt, dan word je hard naar binnen gezogen; kom je te dichtbij, dan word je met schade keihard weggeslingerd.' },
  { id: 'tsunami', name: '🌊 Tsunami', desc: '15 sec lang overstroomt het veld: de vloer wordt nat en 20% glibberiger, en om de ~3 sec raast er een levensgrote vloedgolf over het scherm die iedereen op zijn pad een flink stuk meesleurt. De golf doet zelf geen schade.' }
];
let chargeTrails = []; // Juggernaut-transformatie: spoor van de beuk-charge
let deployedTurrets = []; // Field Engineer-transformatie: neergezette geschutskoepels
let stickyThrows = [];
let stickyBarrageLastUsed = 0;
const STICKY_BARRAGE_COOLDOWN = 12000;
const STICKY_BARRAGE_DMG = 6;
let toxicCloudLastUsed = 0;
const TOXIC_CLOUD_COOLDOWN = 10000;
const TOXIC_CLOUD_RADIUS = 180;
let executionOrderLastUsed = 0;
const EXECUTION_ORDER_COOLDOWN = 9000;
const EXECUTION_ORDER_RADIUS = 260;
const EXECUTION_ORDER_HP_PCT = 0.35;
let bladeTrails = [];
let bladeDashLastUsed = 0;
const BLADE_DASH_COOLDOWN = 8000;
const BLADE_DASH_DIST = 220;
const BLADE_DASH_DMG = 14;
let telegraphs = [];
let lightningBolts = [];
let blackHoles = [];
let laserTelegraphs = [];
let activeLasers = [];
let score = 0;
let highScore = Number(localStorage.getItem('botShooterHighScore')) || 0;
let highScoreHardcore = Number(localStorage.getItem('botShooterHighScoreHardcore')) || 0;
let highScoreWorld2 = Number(localStorage.getItem('botShooterHighScoreWorld2')) || 0;
const HARDCORE_MULT = 2;
let highLevel = Number(localStorage.getItem('botShooterHighLevel')) || 1;

// ---- Kill Cam: neemt een kort (5 sec) filmpje op van je indrukwekkendste moment (boss-kill of hoogste killstreak) dit potje ----
let bestMomentSnapshot = null; // object-URL van het opgenomen webm-filmpje
let bestMomentLabel = '';
let bestMomentScore = -1;
let sessionBestStreak = 0;
let highestComboStreak = Number(localStorage.getItem('botShooterHighestComboStreak')) || 0;
let killCamRecording = false;
let killCamLastRecordEnd = 0;

// ---- Eindbaas Rush: vecht alle bosses van de huidige wereld na elkaar uit, zonder dood te gaan ----
let bossRushActive = false;
let bossRushIndex = 0;
let bossRushWorld = 1;

// ---- Elemental Cores: aparte valuta, alleen te verdienen in Wereld 2 ----
// Elke keer dat je in Wereld 2 een boss verslaat (in een gewoon potje Endless/Levels/Hardcore, of tijdens
// Eindbaas Rush) levert dat Elemental Cores op. Hoeveel hangt af van de hoeveelste boss het is deze sessie
// (1e/2e/3e/4e+) en van de spelmodus: Endless/Hardcore/Eindbaas Rush gebruiken de hogere Endless-tabel,
// Levels gebruikt de lagere Levels-tabel.
let elementalCores = Number(localStorage.getItem('botShooterElementalCores')) || 0;
let world2BossKillCount = 0; // reset elk potje, telt hoeveelste Wereld 2-boss je deze sessie verslaat
const BOSSRUSH_CORES_ENDLESS = [5, 10, 15, 20];
const BOSSRUSH_CORES_LEVELS = [2, 5, 8, 15];

// ---- Prestaties ----
let hasFirstBoss = localStorage.getItem('botShooterHasFirstBoss') === 'true';
let hasWorldBoss = localStorage.getItem('botShooterHasWorldBoss') === 'true';
let hasBossRushW1 = localStorage.getItem('botShooterHasBossRushW1') === 'true';
let hasBossRushW2 = localStorage.getItem('botShooterHasBossRushW2') === 'true';
let unlockedAchievements = JSON.parse(localStorage.getItem('botShooterUnlockedAchievements') || '[]');
let claimedAchievementRewards = JSON.parse(localStorage.getItem('botShooterClaimedAchievementRewards') || '[]');

function rewardText(r) {
  if (r.type === 'cores') return `🔮 ${r.amount} Elemental Cores`;
  if (r.type === 'unlockSkin') {
    const s = SKINS.find(s => s.id === r.skinId) || {};
    return `🔓 Ontgrendelt: ${s.name || r.skinId} (koop daarna voor 🪙${s.price || '?'})`;
  }
  return `🪙 ${r.amount} munten`;
}

const ACHIEVEMENTS = [
  { id: 'first_kill', category: 'w1', name: 'Eerste Bloed', icon: '🎯', desc: 'Dood je allereerste bot — dit kan in elke spelmodus en in beide werelden gebeuren.', reward: { type: 'coins', amount: 50 }, check: () => score > 0 || highScore > 0 || highScoreWorld2 > 0 || highScoreHardcore > 0 },
  { id: 'first_boss', category: 'w1', name: 'Bazenslachter', icon: '⚔️', desc: 'Versla je allereerste boss, of dat nu in een gewoon potje is of tijdens Eindbaas Rush, in Wereld 1 of Wereld 2.', reward: { type: 'coins', amount: 150 }, check: () => hasFirstBoss },
  { id: 'score_1000', category: 'w1', name: 'Op Gang', icon: '⭐', desc: 'Behaal in één potje Endless, Hardcore of Levels een score van minstens 1000 (in Wereld 1 of Wereld 2).', reward: { type: 'coins', amount: 100 }, check: () => highScore >= 1000 || highScoreWorld2 >= 1000 || highScoreHardcore >= 1000 },
  { id: 'score_5000', category: 'w1', name: 'Doorgewinterd', icon: '🌟', desc: 'Behaal in één potje een score van minstens 5000 — blijf gewoon lang genoeg in leven en dood bots.', reward: { type: 'coins', amount: 300 }, check: () => highScore >= 5000 || highScoreWorld2 >= 5000 || highScoreHardcore >= 5000 },
  { id: 'score_10000', category: 'w1', name: 'Veteraan', icon: '💫', desc: 'Behaal in één potje een score van minstens 10.000 — goede upgrades en wapens helpen enorm.', reward: { type: 'coins', amount: 600 }, check: () => highScore >= 10000 || highScoreWorld2 >= 10000 || highScoreHardcore >= 10000 },
  { id: 'score_25000', category: 'w1', name: 'Legende', icon: '👑', desc: 'Behaal in één potje een score van minstens 25.000, een flinke overlevingssessie.', reward: { type: 'coins', amount: 1200 }, check: () => highScore >= 25000 || highScoreWorld2 >= 25000 || highScoreHardcore >= 25000 },
  { id: 'hardcore_2500', category: 'w1', name: 'Hardcore Overlever', icon: '☠️', desc: 'Kies de Hardcore-modus (bots met 2x HP en 2x schade) en overleef daarin tot een score van minstens 2500.', reward: { type: 'coins', amount: 500 }, check: () => highScoreHardcore >= 2500 },
  { id: 'world2_unlocked', category: 'w2', name: 'Elementair', icon: '🔥', desc: 'Koop de toegang tot Wereld 2: Elementen via de knop linksboven in het hoofdmenu.', reward: { type: 'coins', amount: 500 }, check: () => world2Unlocked },
  { id: 'bossrush_w1', category: 'w1', name: 'Eindbaas Rush: Wereld 1', icon: '🏆', desc: 'Start Eindbaas Rush in Wereld 1 en versla alle 6 bosses achter elkaar zonder dood te gaan.', reward: { type: 'coins', amount: 400 }, check: () => hasBossRushW1 },
  { id: 'bossrush_w2', category: 'w2', name: 'Eindbaas Rush: Wereld 2', icon: '🏆', desc: 'Start Eindbaas Rush in Wereld 2 en versla alle 4 elementale bosses achter elkaar zonder dood te gaan.', reward: { type: 'cores', amount: 20 }, check: () => hasBossRushW2 },
  { id: 'worldboss', category: 'w2', name: 'Oerelementaal Verslagen', icon: '🌍', desc: 'Speel in Wereld 2 door tot een score van 20.000+ zodat de zeldzame megaboss Oerelementaal verschijnt, en versla hem.', reward: { type: 'cores', amount: 40 }, check: () => hasWorldBoss },
  { id: 'cores_10', category: 'w2', name: 'Kernverzamelaar', icon: '🔮', desc: 'Verzamel in totaal 10 Elemental Cores door bosses te verslaan in Wereld 2.', reward: { type: 'coins', amount: 100 }, check: () => elementalCores >= 10 },
  { id: 'cores_50', category: 'w2', name: 'Kernmeester', icon: '💎', desc: 'Verzamel in totaal 50 Elemental Cores door bosses te verslaan in Wereld 2.', reward: { type: 'coins', amount: 300 }, check: () => elementalCores >= 50 },
  { id: 'all_transforms', category: 'w1', name: 'Gedaanteverwisselaar', icon: '🔄', desc: 'Koop alle 11 transformaties in de Transform-shop van Wereld 1.', reward: { type: 'coins', amount: 800 }, check: () => TRANSFORMS.every(t => ownedTransforms.includes(t.id)) },
  { id: 'all_weapons_w1', category: 'w1', name: 'Wapenverzamelaar', icon: '🔫', desc: 'Koop alle normale én speciale wapens uit de Wereld 1-wapenshop.', reward: { type: 'coins', amount: 500 }, check: () => [...WEAPONS, ...SPECIAL_WEAPONS].every(w => ownedWeapons.includes(w.id)) },
  { id: 'all_armor_w1', category: 'w1', name: 'Pantserverzamelaar', icon: '🛡️', desc: 'Koop alle pantsers uit de Wereld 1-pantsershop.', reward: { type: 'coins', amount: 500 }, check: () => ARMOR.every(a => ownedArmor.includes(a.id)) },
  { id: 'all_world2_weapons', category: 'w2', name: 'Elementwapens', icon: '🔥', desc: 'Koop alle normale én speciale elementale wapens uit de Wereld 2-wapenshop (de wapens uit de Kern-winkel tellen niet mee).', reward: { type: 'cores', amount: 30 }, check: () => [...WORLD2_WEAPONS, ...WORLD2_SPECIAL_WEAPONS].filter(w => !w.coreOnly).every(w => ownedWeapons.includes(w.id)) },
  { id: 'all_world2_armor', category: 'w2', name: 'Elementpantsers', icon: '🪨', desc: 'Koop alle elementale pantsers uit de Wereld 2-pantsershop (het Kernpantser telt niet mee).', reward: { type: 'cores', amount: 30 }, check: () => WORLD2_ARMOR.filter(a => !a.coreOnly).every(a => ownedArmor.includes(a.id)) },
  { id: 'dual_armor', category: 'w1', name: 'Dubbel Gepantserd', icon: '🛡️', desc: 'Koop het 2e pantser-slot in de shop, zodat je twee pantsers tegelijk kunt dragen.', reward: { type: 'coins', amount: 300 }, check: () => hasDualArmor },
  { id: 'coins_5000', category: 'w1', name: 'Spaarpot', icon: '🪙', desc: 'Spaar tot je ooit 5000 munten tegelijk in bezit hebt.', reward: { type: 'cores', amount: 10 }, check: () => coins >= 5000 },
  { id: 'coins_20000', category: 'w1', name: 'Rijkdom', icon: '💰', desc: 'Spaar tot je ooit 20.000 munten tegelijk in bezit hebt.', reward: { type: 'cores', amount: 25 }, check: () => coins >= 20000 },
  { id: 'all_skins_normal', category: 'w1', name: 'Modebewust', icon: '🎨', desc: 'Koop alle gewone skins in de Skins-shop (dus geen killstreak- of Elementen-skins).', reward: { type: 'coins', amount: 500 }, check: () => SKINS.filter(s => !s.killstreak && !s.element && !s.coreOnly).every(s => ownedSkins.includes(s.id)) },
  { id: 'all_killstreak_skins', category: 'w1', name: 'Streak Style', icon: '🔥', desc: 'Koop alle 6 Wereld 1-killstreak-combo-skins in de Skins-shop.', reward: { type: 'coins', amount: 400 }, check: () => SKINS.filter(s => s.killstreak && !s.element).every(s => ownedSkins.includes(s.id)) },
  { id: 'all_element_skins', category: 'w2', name: 'Elementenmode', icon: '🌍', desc: 'Koop alle 10 gewone Elementen Skins in de Skins-shop (alleen zichtbaar in Wereld 2).', reward: { type: 'cores', amount: 25 }, check: () => SKINS.filter(s => s.element && !s.killstreak && !s.coreOnly).every(s => ownedSkins.includes(s.id)) },
  { id: 'all_element_killstreak_skins', category: 'w2', name: 'Elementaire Streak', icon: '🌈', desc: 'Koop alle 4 Wereld 2-killstreak-elementen-skins in de Skins-shop.', reward: { type: 'cores', amount: 30 }, check: () => SKINS.filter(s => s.element && s.killstreak).every(s => ownedSkins.includes(s.id)) },
  { id: 'core_shop_full', category: 'w2', name: 'Kern-verzamelaar', icon: '🔮', desc: 'Koop Kernpantser, Kernblaster én Kernwezen in de Elemental Kern-winkel.', reward: { type: 'coins', amount: 500 }, check: () => ownedArmor.includes('coreplate') && ownedWeapons.includes('coreblaster') && ownedSkins.includes('coreessence') },
  { id: 'max_upgrade_w1', category: 'w1', name: 'Volledig Uitgerust', icon: '💪', desc: 'Koop alle 5 niveaus van de Extra Conditie-upgrade in de shop.', reward: { type: 'coins', amount: 300 }, check: () => lvlExtraHp >= EXTRA_HP_LEVELS.length },
  { id: 'max_core_damage', category: 'w2', name: 'Kernkracht Voltooid', icon: '💥', desc: 'Koop alle 3 niveaus van Kernkracht in de Elemental Kern-winkel.', reward: { type: 'cores', amount: 20 }, check: () => lvlCoreDamage >= CORE_DAMAGE_LEVELS.length },
  { id: 'max_core_shield', category: 'w2', name: 'Kernschild Voltooid', icon: '🛡️', desc: 'Koop alle 3 niveaus van Kernschild in de Elemental Kern-winkel.', reward: { type: 'cores', amount: 20 }, check: () => lvlCoreShield >= CORE_SHIELD_LEVELS.length },
  { id: 'core_harvest_owned', category: 'w2', name: 'Kernoogster', icon: '🌾', desc: 'Koop Kernoogst in de Elemental Kern-winkel.', reward: { type: 'cores', amount: 15 }, check: () => hasCoreHarvest },
  { id: 'revive_w1', category: 'w1', name: 'Reanimatie Gekocht', icon: '❤️', desc: 'Koop Reanimatie bij de Wereld 1-upgrades in de shop.', reward: { type: 'coins', amount: 200 }, check: () => hasRevive },
  { id: 'revive_w2', category: 'w2', name: 'Elementreanimatie Gekocht', icon: '💚', desc: 'Koop Elementreanimatie bij de Wereld 2-upgrades in de shop.', reward: { type: 'cores', amount: 15 }, check: () => hasRevive2 },
  { id: 'highlevel_20', category: 'w1', name: 'Klimmer', icon: '🧗', desc: 'Rond in Levels-modus level 20 af.', reward: { type: 'coins', amount: 400 }, check: () => highLevel >= 20 },
  { id: 'highlevel_40', category: 'w1', name: 'Bergbeklimmer', icon: '⛰️', desc: 'Rond in Levels-modus level 40 af.', reward: { type: 'coins', amount: 800 }, check: () => highLevel >= 40 },
  { id: 'max_goldrush', category: 'w1', name: 'Muntenmagnaat', icon: '🧲', desc: 'Koop alle 3 niveaus van Goudtrek in de shop.', reward: { type: 'coins', amount: 300 }, check: () => lvlGoldRush >= GOLD_RUSH_LEVELS.length },
  { id: 'max_criticalhit', category: 'w1', name: 'Dodelijke Precisie', icon: '🎯', desc: 'Koop alle 3 niveaus van Kritieke Hit in de shop.', reward: { type: 'coins', amount: 300 }, check: () => lvlCriticalHit >= CRITICAL_HIT_LEVELS.length },
  { id: 'score_50000', category: 'w1', name: 'Onsterfelijk', icon: '♾️', desc: 'Behaal in één potje een score van minstens 50.000 — een extreem lange overlevingssessie.', reward: { type: 'coins', amount: 2000 }, check: () => highScore >= 50000 || highScoreWorld2 >= 50000 || highScoreHardcore >= 50000 },
  { id: 'highlevel_60', category: 'w1', name: 'Levelloper', icon: '🏔️', desc: 'Rond in Levels-modus level 60 af.', reward: { type: 'coins', amount: 1200 }, check: () => highLevel >= 60 },
  { id: 'max_secondwind', category: 'w1', name: 'IJzeren Wil Meester', icon: '🩹', desc: 'Koop alle 3 niveaus van IJzeren Wil in de shop.', reward: { type: 'coins', amount: 300 }, check: () => lvlSecondWind >= SECOND_WIND_LEVELS.length },
  { id: 'max_core_speed', category: 'w2', name: 'Kernsnelheid Voltooid', icon: '💨', desc: 'Koop alle 3 niveaus van Kernsnelheid in de Elemental Kern-winkel.', reward: { type: 'cores', amount: 20 }, check: () => lvlCoreSpeed >= CORE_SPEED_LEVELS.length },
  { id: 'max_core_regen', category: 'w2', name: 'Kernregeneratie Voltooid', icon: '💗', desc: 'Koop alle 3 niveaus van Kernregeneratie in de Elemental Kern-winkel.', reward: { type: 'cores', amount: 20 }, check: () => lvlCoreRegen >= CORE_REGEN_LEVELS.length },
  { id: 'max_core_vampire', category: 'w2', name: 'Kernvampier Voltooid', icon: '🧛', desc: 'Koop alle 3 niveaus van Kernvampier in de Elemental Kern-winkel.', reward: { type: 'cores', amount: 20 }, check: () => lvlCoreVampire >= CORE_VAMPIRE_LEVELS.length },
  { id: 'core_aura_owned', category: 'w2', name: 'Kernaura Ontgrendeld', icon: '💫', desc: 'Koop Kernaura in de Elemental Kern-winkel.', reward: { type: 'cores', amount: 15 }, check: () => hasCoreAura },
  { id: 'core_shock_owned', category: 'w2', name: 'Kernschok Ontgrendeld', icon: '⚡', desc: 'Koop Kernschok in de Elemental Kern-winkel.', reward: { type: 'cores', amount: 15 }, check: () => hasCoreShock },
  { id: 'max_firecore', category: 'w2', name: 'Vuurkern Voltooid', icon: '🔥', desc: 'Koop alle 3 niveaus van Vuurkern bij de Wereld 2-upgrades in de shop.', reward: { type: 'coins', amount: 300 }, check: () => lvl2FireCore >= FIRECORE_LEVELS.length },
  { id: 'max_frostblood', category: 'w2', name: 'Vriesbloed Voltooid', icon: '❄️', desc: 'Koop alle 3 niveaus van Vriesbloed bij de Wereld 2-upgrades in de shop.', reward: { type: 'coins', amount: 300 }, check: () => lvl2FrostBlood >= FROSTBLOOD_LEVELS.length },
  { id: 'max_steadfast', category: 'w2', name: 'Aardvastheid Voltooid', icon: '🪨', desc: 'Koop alle 3 niveaus van Aardvastheid bij de Wereld 2-upgrades in de shop.', reward: { type: 'coins', amount: 300 }, check: () => lvl2Steadfast >= STEADFAST_LEVELS.length },
  { id: 'max_extrahp2', category: 'w2', name: 'Elementaire Conditie Voltooid', icon: '💪', desc: 'Koop alle 5 niveaus van Elementaire Conditie bij de Wereld 2-upgrades in de shop.', reward: { type: 'coins', amount: 400 }, check: () => lvl2ExtraHp >= EXTRAHP2_LEVELS.length },
  { id: 'max_vengeance', category: 'w2', name: 'Elementaire Wraak Voltooid', icon: '💢', desc: 'Koop alle 3 niveaus van Elementaire Wraak bij de Wereld 2-upgrades in de shop.', reward: { type: 'coins', amount: 300 }, check: () => lvl2Vengeance >= VENGEANCE_LEVELS.length },
  { id: 'master_both_worlds', category: 'w1', name: 'Meester van Beide Werelden', icon: '🌐', desc: 'Voltooi de Eindbaas Rush in zowel Wereld 1 als Wereld 2.', reward: { type: 'unlockSkin', skinId: 'titanchrome' }, check: () => hasBossRushW1 && hasBossRushW2 },
  { id: 'killstreak_legend', category: 'w1', name: 'Killstreak Legende', icon: '🔥', desc: 'Bereik ooit een killstreak van 80 op rij, in Wereld 1 of Wereld 2.', reward: { type: 'unlockSkin', skinId: 'supernova' }, check: () => highestComboStreak >= 80 },
  { id: 'neon_master', category: 'w1', name: 'Neon Meester', icon: '🌈', desc: 'Koop alle 6 neon-skins in de Skins-shop: Neon Roze, Neon Cyaan, Neon Limoen en hun 3 killstreak-combo-varianten.', reward: { type: 'unlockSkin', skinId: 'neonultra' }, check: () => ['neonpink', 'neoncyan', 'neonlime', 'comboneonpink', 'comboneoncyan', 'comboneonlime'].every(id => ownedSkins.includes(id)) },
  { id: 'score_75000', category: 'w1', name: 'Ongenaakbaar', icon: '🌠', desc: 'Behaal in één potje een score van minstens 75.000 — bijna niemand overleeft zo lang.', reward: { type: 'coins', amount: 3000 }, check: () => highScore >= 75000 || highScoreWorld2 >= 75000 || highScoreHardcore >= 75000 },
  { id: 'hardcore_10000', category: 'w1', name: 'Hardcore Titaan', icon: '💀', desc: 'Behaal in de Hardcore-modus (2x HP en 2x schade voor bots) een score van minstens 10.000 in één potje.', reward: { type: 'coins', amount: 2500 }, check: () => highScoreHardcore >= 10000 },
  { id: 'highlevel_100', category: 'w1', name: 'Eeuwige Klimmer', icon: '🗻', desc: 'Rond in Levels-modus level 100 af — een marathon van steeds zwaardere golven.', reward: { type: 'coins', amount: 3000 }, check: () => highLevel >= 100 },
  { id: 'cores_150', category: 'w2', name: 'Kernlegende', icon: '🌟', desc: 'Verzamel in totaal 150 Elemental Cores door bosses te verslaan in Wereld 2 — een langdurig project.', reward: { type: 'coins', amount: 2000 }, check: () => elementalCores >= 150 },
  { id: 'kills_10000', category: 'w1', name: 'Massamoordenaar', icon: '☠️', desc: 'Dood in totaal 10.000 bots, over al je potjes samen (zichtbaar in Statistieken).', reward: { type: 'coins', amount: 2500 }, check: () => totalLifetimeKills >= 10000 }
];

function grantAchievementReward(a) {
  if (a.reward.type === 'cores') {
    elementalCores += a.reward.amount;
    localStorage.setItem('botShooterElementalCores', elementalCores);
  } else if (a.reward.type === 'unlockSkin') {
    // Geen directe beloning: de quest ontgrendelt alleen de mogelijkheid om de skin te kopen in de Skins-shop
  } else {
    coins += a.reward.amount;
    if (typeof saveShopState === 'function') saveShopState();
  }
}

function checkAchievements() {
  const newlyUnlocked = [];
  ACHIEVEMENTS.forEach(a => {
    if (!unlockedAchievements.includes(a.id) && a.check()) {
      unlockedAchievements.push(a.id);
      newlyUnlocked.push(a);
    }
  });
  if (newlyUnlocked.length > 0) {
    localStorage.setItem('botShooterUnlockedAchievements', JSON.stringify(unlockedAchievements));
  }
  // Beloningen uitkeren: voor elke ontgrendelde prestatie die nog geen beloning heeft gekregen — inclusief
  // prestaties die al eerder (voor dit beloningssysteem bestond) ontgrendeld waren.
  let grantedAny = false;
  ACHIEVEMENTS.forEach(a => {
    if (unlockedAchievements.includes(a.id) && !claimedAchievementRewards.includes(a.id)) {
      grantAchievementReward(a);
      claimedAchievementRewards.push(a.id);
      grantedAny = true;
    }
  });
  if (grantedAny) localStorage.setItem('botShooterClaimedAchievementRewards', JSON.stringify(claimedAchievementRewards));
  newlyUnlocked.forEach(a => { if (typeof showAchievementToast === 'function') showAchievementToast(a); });
}

function onBossDefeated(bot) {
  if (typeof recordMoment === 'function') {
    const pool = [...BOSS_TYPES, ...WORLD2_BOSS_TYPES, WORLD_BOSS_TYPE];
    const type = pool.find(b => b.name === bot.type);
    const importance = bot.type === 'oerelementaal' ? 150 : 100;
    recordMoment(importance, `👑 Boss verslagen: ${type ? type.displayName : bot.type}`);
  }
  if (bossRushActive) {
    bossRushIndex++;
  }
  if (currentWorld === 2 && !bossRushActive) {
    world2BossKillCount++;
    const table = gameMode === 'levels' ? BOSSRUSH_CORES_LEVELS : BOSSRUSH_CORES_ENDLESS;
    const pos = Math.min(world2BossKillCount, table.length) - 1;
    const coreReward = table[pos] + (hasCoreHarvest ? CORE_HARVEST_BONUS : 0);
    elementalCores += coreReward;
    localStorage.setItem('botShooterElementalCores', elementalCores);
  }
  if (!hasFirstBoss) {
    hasFirstBoss = true;
    localStorage.setItem('botShooterHasFirstBoss', 'true');
  }
  if (bot.type === 'oerelementaal' && !hasWorldBoss) {
    hasWorldBoss = true;
    localStorage.setItem('botShooterHasWorldBoss', 'true');
  }
  checkAchievements();
}

let gameOver = false;
let isPaused = false;
let gameStarted = false;
let gameMode = 'endless'; // 'endless' or 'levels'
// ---- Golfsprint: tijdgebonden modus van 5 minuten, pure snelheid ----
const SPRINT_DURATION = 300000;
let sprintEndTime = 0;
let highScoreSprint = Number(localStorage.getItem('botShooterHighScoreSprint')) || 0;
let lastShot = 0;
const shootCooldown = 120; // ms - hou spatie ingedrukt voor snelvuur
let lastPowerupSpawn = 0;
let loopRunning = false;

// ---- Coins & shop state ----
let coins = Number(localStorage.getItem('botShooterCoins')) || 0;

// Eenmalige bonus: +3500 munten, wordt maar één keer uitgekeerd
if (!localStorage.getItem('botShooterCoinGrant_3500')) {
  coins += 3500;
  localStorage.setItem('botShooterCoins', coins);
  localStorage.setItem('botShooterCoinGrant_3500', 'true');
}

// Eenmalige bonus: +500 munten, wordt maar één keer uitgekeerd
if (!localStorage.getItem('botShooterCoinGrant_500')) {
  coins += 500;
  localStorage.setItem('botShooterCoins', coins);
  localStorage.setItem('botShooterCoinGrant_500', 'true');
}

// Eenmalige bonus: +600 munten, wordt maar één keer uitgekeerd
if (!localStorage.getItem('botShooterCoinGrant_600')) {
  coins += 600;
  localStorage.setItem('botShooterCoins', coins);
  localStorage.setItem('botShooterCoinGrant_600', 'true');
}

// Eenmalige bonus: +1000 munten, wordt maar één keer uitgekeerd
if (!localStorage.getItem('botShooterCoinGrant_1000')) {
  coins += 1000;
  localStorage.setItem('botShooterCoins', coins);
  localStorage.setItem('botShooterCoinGrant_1000', 'true');
}

// Eenmalige bonus: nog eens +1000 munten, wordt maar één keer uitgekeerd
if (!localStorage.getItem('botShooterCoinGrant_1000b')) {
  coins += 1000;
  localStorage.setItem('botShooterCoins', coins);
  localStorage.setItem('botShooterCoinGrant_1000b', 'true');
}

// Eenmalige bonus: +2500 munten, wordt maar één keer uitgekeerd
if (!localStorage.getItem('botShooterCoinGrant_2500')) {
  coins += 2500;
  localStorage.setItem('botShooterCoins', coins);
  localStorage.setItem('botShooterCoinGrant_2500', 'true');
}

// Eenmalige bonus: +200 munten, wordt maar één keer uitgekeerd
if (!localStorage.getItem('botShooterCoinGrant_200')) {
  coins += 200;
  localStorage.setItem('botShooterCoins', coins);
  localStorage.setItem('botShooterCoinGrant_200', 'true');
}

// Eenmalige bonus: +10000 munten, wordt maar één keer uitgekeerd
if (!localStorage.getItem('botShooterCoinGrant_10000')) {
  coins += 10000;
  localStorage.setItem('botShooterCoins', coins);
  localStorage.setItem('botShooterCoinGrant_10000', 'true');
}

// Eenmalige bonus: +2000 munten, alleen voor account 'ben'
if (currentAccount === 'ben' && !localStorage.getItem('botShooterCoinGrant_2000_ben')) {
  coins += 2000;
  localStorage.setItem('botShooterCoins', coins);
  localStorage.setItem('botShooterCoinGrant_2000_ben', 'true');
}

// Eenmalige bonus: nog eens +2000 munten, wordt maar één keer uitgekeerd
if (!localStorage.getItem('botShooterCoinGrant_2000b')) {
  coins += 2000;
  localStorage.setItem('botShooterCoins', coins);
  localStorage.setItem('botShooterCoinGrant_2000b', 'true');
}

// Eenmalige bonus: +15000 munten, wordt maar één keer uitgekeerd
if (!localStorage.getItem('botShooterCoinGrant_15000')) {
  coins += 15000;
  localStorage.setItem('botShooterCoins', coins);
  localStorage.setItem('botShooterCoinGrant_15000', 'true');
}

let ownedWeapons = JSON.parse(localStorage.getItem('botShooterOwnedWeapons') || '["pistol"]');
let ownedArmor = JSON.parse(localStorage.getItem('botShooterOwnedArmor') || '["none"]');
let equippedWeapon = localStorage.getItem('botShooterEquippedWeapon') || 'pistol';
let equippedArmor = localStorage.getItem('botShooterEquippedArmor') || 'none';
let equippedArmor2 = localStorage.getItem('botShooterEquippedArmor2') || 'none';
let ownedSkins = JSON.parse(localStorage.getItem('botShooterOwnedSkins') || '["default"]');
let equippedSkin = localStorage.getItem('botShooterEquippedSkin') || 'default';
const SKIN_PRICE = 1500;
const SKIN_PRICE_MID = 1600;
const SKIN_PRICE_HIGH = 1800;
const SKINS = [
  { id: 'default',   name: 'Standaard',     price: 0,              desc: 'Het klassieke blauwe poppetje.' },
  { id: 'muncher',    name: 'Muncher',       price: SKIN_PRICE,      desc: 'Een hongerig rond arcade-monstertje met een happende bek.' },
  { id: 'ninja',      name: 'Cyber Ninja',   price: SKIN_PRICE,      desc: 'Donker pak met een gloeiend cyaan vizier.' },
  { id: 'astronaut',  name: 'Astronaut',     price: SKIN_PRICE,      desc: 'Wit ruimtepak met een reflecterend vizier.' },
  { id: 'robo',       name: 'Robo Guardian', price: SKIN_PRICE,      desc: 'Metalen robot-lijf met een gloeiend rood oog.' },
  { id: 'viking',     name: 'Viking',        price: SKIN_PRICE_MID,  desc: 'Gehoornde helm en een stoer bruin gewaad.' },
  { id: 'pirate',     name: 'Piraat',        price: SKIN_PRICE_MID,  desc: 'Zwarte bandana, ooglapje en een stoere blik.' },
  { id: 'wizard',     name: 'Tovenaar',      price: SKIN_PRICE_MID,  desc: 'Paarse mantel, puntige hoed en een gloeiende toverstaf.' },
  { id: 'dragon',     name: 'Draak',         price: SKIN_PRICE_HIGH, desc: 'Groene schubben, hoorntjes en een gloeiende vuuradem.' },
  { id: 'skeleton',   name: 'Skelet',        price: SKIN_PRICE_HIGH, desc: 'Botstructuur op een donker lijf met gloeiende oogkassen.' },
  { id: 'alien',      name: 'Alien',         price: SKIN_PRICE_HIGH, desc: 'Groen buitenaards wezen met grote zwarte ogen en een antenne.' },
  { id: 'knight',     name: 'Ridder',        price: SKIN_PRICE_HIGH, desc: 'Zilveren harnas met vizier en een rode pluim.' },
  { id: 'phoenix',    name: 'Phoenix',       price: SKIN_PRICE_HIGH, desc: 'Vlammend lijf in geel, oranje en rood, met flakkerende vleugels.' },
  { id: 'cosmic',     name: 'Cosmic',        price: SKIN_PRICE_HIGH, desc: 'Sterrenhemel-lijf met een paarse nevelgloed en fonkelende sterren.' },
  { id: 'samurai',    name: 'Samurai',       price: 1550,             desc: 'Japanse krijger met rood-zwart gewaad en een gloeiend zwaard.' },
  { id: 'cyborg',     name: 'Cyborg',        price: 1650,             desc: 'Futuristische krijger met mechanische onderdelen en neon-accenten.' },
  { id: 'vampire',    name: 'Vampier',       price: 1600,             desc: 'Spookachtige vampier met zwarte cape en rode ogen.' },
  { id: 'ghost',      name: 'Geest',         price: 1550,             desc: 'Wit spookachtig figuur dat doorschijnend gloeit.' },
  { id: 'neon',       name: 'Neon Punk',     price: 1650,             desc: 'Gloeiend cyberpunk-look met felle kleuren en geometrische vormen.' },
  { id: 'clown',      name: 'Clown',         price: 1600,             desc: 'Kleurig circuskarakter met grote neus en grappige uiterlijk.' },
  { id: 'monster',    name: 'Monster',       price: 1550,             desc: 'Griezelig groen monster met bobbels en tanden.' },
  { id: 'angel',      name: 'Engel',         price: 1700,             desc: 'Hemels karakter met gloeiende witte vleugels en aureool.' },
  { id: 'demon',      name: 'Demon',         price: 1700,             desc: 'Duiveachtig karakter met hoorns, staart en vlammen.' },
  { id: 'robot_simple', name: 'Blok-robot',  price: 1600,             desc: 'Simpele blocky robot van zilver met kleurrijke antennes.' },
  { id: 'gemstone',   name: 'Edelsteen',     price: 1750,             desc: 'Kristallig diamant-achtig lichaam dat schittert en gloeit.' },
  { id: 'mushroom',   name: 'Paddestoel',    price: 1550,             desc: 'Grote felgekleurde paddestoel met stippen op het kapje.' },
  { id: 'pumpkin',    name: 'Pompoen',       price: 1600,             desc: 'Halloween-pompoen met gloeiende ogen en een grappig gezicht.' },
  { id: 'mummy',      name: 'Momie',         price: 1650,             desc: 'Oude momie gewikkeld in crèmekleurig linnen met gloeiende ogen.' },
  { id: 'werewolf',   name: 'Weerwolf',      price: 1700,             desc: 'Behaard beest-karakter met scherpe nagels en gele ogen.' },
  { id: 'panda',      name: 'Panda',         price: 1550,             desc: 'Schattige panda met zwart-witte vacht en ronde oortjes.' },
  { id: 'unicorn',    name: 'Eenhoorn',      price: 1750,             desc: 'Wit fabeldier met een glinsterende regenboog-hoorn en manen.' },
  { id: 'shark',      name: 'Haai',          price: 1650,             desc: 'Grijze roofvis met een scherpe vin en rijen puntige tanden.' },
  { id: 'frankenstein', name: 'Frankenstein', price: 1650,            desc: 'Groen monster met hechtingen, bouten in de nek en een platte schedel.' },
  { id: 'cactus',     name: 'Cactus',        price: 1550,             desc: 'Vrolijke woestijncactus met stekels en een kleine bloem.' },
  { id: 'snowman',    name: 'Sneeuwpop',     price: 1550,             desc: 'Ronde sneeuwpop met een wortelneus en kolen-ogen.' },
  { id: 'discoball',  name: 'Discobal',      price: 1700,             desc: 'Glinsterende spiegelbal die van kleur wisselt op de maat van de muziek.' },
  { id: 'turtle',     name: 'Schildpad',     price: 1600,             desc: 'Groene schildpad met een stevig gestreept pantser.' },
  { id: 'jester',     name: 'Hofnar',        price: 1650,             desc: 'Kleurrijke hofnar met een bellenmuts in paars en goud.' },
  { id: 'cyclops',    name: 'Cycloop',       price: 1700,             desc: 'Paars eenogig monster met een groot gloeiend oog.' },
  { id: 'combofire',  name: 'Infernische Combo', price: 3350,          desc: 'Een dovende ember-kern die feller ontbrandt en een groeiende vuuraura krijgt naarmate je killstreak oploopt.', killstreak: true },
  { id: 'combofrost', name: 'Vrieskristal Combo', price: 3350,         desc: 'Een dof ijskristal dat steeds feller gaat gloeien en scherpere kristalpunten krijgt bij een oplopende killstreak.', killstreak: true },
  { id: 'combovolt',  name: 'Voltaïsche Combo', price: 3350,           desc: 'Een gedimde energiekern die steeds meer knetterende bliksemboogjes om zich heen krijgt naarmate je killstreak stijgt.', killstreak: true },
  { id: 'neonpink',   name: 'Neon Roze',     price: 1650,              desc: 'Zwarte kern met een felle, pulserende roze neonring en kruisende lichtstrepen.' },
  { id: 'neoncyan',   name: 'Neon Cyaan',    price: 1650,              desc: 'Zwarte kern met een gloeiende cyaan neon-zeshoek erop getekend.' },
  { id: 'neonlime',   name: 'Neon Limoen',   price: 1650,              desc: 'Zwarte kern met felgroene, pulserende neon-chevrons.' },
  { id: 'comboneonpink', name: 'Neon Roze Combo', price: 3350,         desc: 'Een gedimde kern die een felle roze neonring en een groeiend kruispatroon krijgt naarmate je killstreak oploopt.', killstreak: true },
  { id: 'comboneoncyan', name: 'Neon Cyaan Combo', price: 3350,        desc: 'Een gedimde kern die een felle cyaan neon-veelhoek krijgt, met steeds meer zijden naarmate je killstreak stijgt.', killstreak: true },
  { id: 'comboneonlime', name: 'Neon Limoen Combo', price: 3350,       desc: 'Een gedimde kern die feller limoengroen gaat gloeien met steeds meer neon-chevrons bij een oplopende killstreak.', killstreak: true },
  { id: 'comboearth',  name: 'Aardschok Combo',   price: 3400, desc: 'Wereld 2-exclusief killstreak-skin. Dof gesteente dat openbarst en gaat gloeien met mos-groene aders, met steeds meer rotspieken naarmate je killstreak oploopt. Werkt alleen in Wereld 2.', killstreak: true, element: true },
  { id: 'combowind',   name: 'Wervelwind Combo',  price: 3400, desc: 'Wereld 2-exclusief killstreak-skin. IJl, doorschijnend lichaam met steeds meer en snellere kolkende windbogen naarmate je killstreak oploopt. Werkt alleen in Wereld 2.', killstreak: true, element: true },
  { id: 'combowater',  name: 'Vloedgolf Combo',   price: 3400, desc: 'Wereld 2-exclusief killstreak-skin. Kolkend waterlichaam met steeds meer golfringen en opspattende schuimdruppels naarmate je killstreak oploopt. Werkt alleen in Wereld 2.', killstreak: true, element: true },
  { id: 'combocrystal', name: 'Kristalpracht Combo', price: 3500, desc: 'Wereld 2-exclusief killstreak-skin. Een dof gesteente dat verandert in een schitterende, kleurwisselende kristalstructuur met steeds meer facetten naarmate je killstreak oploopt. Werkt alleen in Wereld 2.', killstreak: true, element: true },
  { id: 'coreessence', name: 'Kernwezen', coreOnly: true, corePrice: 33, element: true, desc: 'Elemental Cores-exclusief (Kern-winkel). Een levend lichaam van pure, kleurwisselende kernenergie met ronddraaiende energiepieken. Werkt alleen in Wereld 2.' },
  { id: 'elemfire',    name: 'Vuurwezen',    price: 1700, desc: 'Wereld 2-exclusief. Gloeiend lichaam van gestold vuur met een flikkerende gloed. Werkt alleen in Wereld 2.', element: true },
  { id: 'elemice',     name: 'IJswezen',     price: 1700, desc: 'Wereld 2-exclusief. Kristallijnen lichaam van blauwig ijs. Werkt alleen in Wereld 2.', element: true },
  { id: 'elemearth',   name: 'Aardwezen',    price: 1700, desc: 'Wereld 2-exclusief. Zwaar rotslichaam met mosplekjes. Werkt alleen in Wereld 2.', element: true },
  { id: 'elemstorm',   name: 'Stormwezen',   price: 1700, desc: 'Wereld 2-exclusief. Elektrisch lichaam met knetterende vonken. Werkt alleen in Wereld 2.', element: true },
  { id: 'elemwind',    name: 'Windwezen',    price: 1700, desc: 'Wereld 2-exclusief. IJl, doorschijnend lichaam van kolkende lucht. Werkt alleen in Wereld 2.', element: true },
  { id: 'elemwater',   name: 'Waterwezen',   price: 1700, desc: 'Wereld 2-exclusief. Druppelvormig, doorschijnend lichaam van kolkend water. Werkt alleen in Wereld 2.', element: true },
  { id: 'elemlava',    name: 'Lavawezen',    price: 1750, desc: 'Wereld 2-exclusief. Donker gebarsten gesteente met gloeiende lava-aders. Werkt alleen in Wereld 2.', element: true },
  { id: 'elemcrystal', name: 'Kristalwezen', price: 1750, desc: 'Wereld 2-exclusief. Facet-geslepen edelsteen-lichaam dat schittert. Werkt alleen in Wereld 2.', element: true },
  { id: 'elemthunder', name: 'Donderwezen',  price: 1750, desc: 'Wereld 2-exclusief. Donkere onweerswolk met een felle bliksemschicht erdoorheen. Werkt alleen in Wereld 2.', element: true },
  { id: 'elemtide',    name: 'Getijwezen',   price: 1750, desc: 'Wereld 2-exclusief. Diepblauw lichaam van kolkende zee met witte schuimkoppen. Werkt alleen in Wereld 2.', element: true },
  { id: 'titanchrome', name: 'Titan Chroom', achievementOnly: true, requiredAchievement: 'master_both_worlds', price: 2500, desc: 'Quest-exclusief. Een gepolijst, spiegelend chroom-lichaam met een rondzwenkende lichtglans en gelaagde titan-pantserplaten. Ontgrendel de quest "Meester van Beide Werelden", koop hem dan voor 2500 munten.' },
  { id: 'supernova',   name: 'Supernova',    achievementOnly: true, requiredAchievement: 'killstreak_legend', price: 2500, desc: 'Quest-exclusief. Een verblindend witheet sterrenlichaam met pulserende, ronddraaiende vlamstralen. Ontgrendel de quest "Killstreak Legende", koop hem dan voor 2500 munten.' },
  { id: 'neonultra',   name: 'Neon Ultra',   achievementOnly: true, requiredAchievement: 'neon_master', price: 2500, desc: 'Quest-exclusief. Een zwarte kern omringd door een volledig kleurwisselende regenboog-neonring met ronddraaiende neon-spaken. Ontgrendel de quest "Neon Meester", koop hem dan voor 2500 munten.' }
];

// Elementen Skins werken alleen in Wereld 2 — val in Wereld 1 terug op de standaard-skin, net als wapens/pantsers/transformaties
function getSkin() {
  if (skinPracticeActive) return equippedSkin; // tijdens oefenen altijd tonen, ongeacht wereld
  const s = SKINS.find(x => x.id === equippedSkin);
  if (s && s.element && currentWorld !== 2) return 'default';
  return equippedSkin;
}

// ---- Wereld 2: Elementen ----
let world2Unlocked = localStorage.getItem('botShooterWorld2Unlocked') === 'true';
let currentWorld = 1; // 1 = normale wereld, 2 = Elementen-wereld — reset altijd naar 1 bij herladen
const WORLD2_PRICE = 15000;
let ownedTransforms = JSON.parse(localStorage.getItem('botShooterOwnedTransforms') || '["none"]');
let equippedTransform = localStorage.getItem('botShooterEquippedTransform') || 'none';
// Gedeeld door alle transformaties: sterf je in een transformatie, dan word je één keer
// teruggevormd tot je normale poppetje met dit vaste HP, in plaats van dat het potje eindigt.
const TRANSFORM_REVIVE_HP = 50;

const TANK_BONUS_HP = 50;
const TANK_R_MULT = 1.5;
const TANK_GRENADE_COOLDOWN = 650;
const TANK_GRENADE_DMG = 5;
const TANK_GRENADE_SPLASH_RADIUS = 95;
const TANK_GRENADE_SPLASH_DMG = 4;
const TANK_GRENADE_SPEED = 6.5;

const BERSERKER_BONUS_HP = 40;
const BERSERKER_R_MULT = 1.15;
const BERSERKER_SPEED_MULT = 1.5;
const BERSERKER_SLASH_COOLDOWN = 380;
const BERSERKER_SLASH_DMG = 6;
const BERSERKER_SLASH_RANGE = 70;
const BERSERKER_SLASH_ARC = Math.PI * 0.7; // ~126 graden waaier voor de speler uit

const SNIPER_BONUS_HP = 10;
const SNIPER_R_MULT = 1.3;
const SNIPER_SPEED_MULT = 0.55;
const SNIPER_COOLDOWN = 1100;
const SNIPER_DMG = 12;
const SNIPER_PIERCE = 5;
const SNIPER_BULLET_SPEED = 13;

const SWARM_BONUS_HP = 0;
const SWARM_R_MULT = 1;
const SWARM_SPEED_MULT = 1;
const SWARM_VOLLEY_COOLDOWN = 550;
const SWARM_DRONE_COUNT = 3;
const SWARM_DRONE_DMG = 3;
const SWARM_DRONE_SPLASH_RADIUS = 30;
const SWARM_DRONE_SPEED = 7;
const SWARM_HOMING_TURN = 0.12; // hoeveel een dronekogel per frame naar zijn doelwit bijstuurt

const PYRO_BONUS_HP = 15;
const PYRO_R_MULT = 1.05;
const PYRO_SPEED_MULT = 1;
const PYRO_FIREBALL_COOLDOWN = 500;
const PYRO_FIREBALL_RANGE = 260;
const PYRO_FIREBALL_TRAVEL_TIME = 300;
const PYRO_IMPACT_DMG = 3;
const PYRO_ZONE_RADIUS = 55;
const PYRO_ZONE_DURATION = 3000;
const PYRO_ZONE_TICK_DMG = 2;
const PYRO_ZONE_TICK_INTERVAL = 500;

const VAMPIRE_BONUS_HP = 20;
const VAMPIRE_R_MULT = 1;
const VAMPIRE_SPEED_MULT = 1.2;
const VAMPIRE_BITE_COOLDOWN = 320;
const VAMPIRE_BITE_DMG = 5;
const VAMPIRE_BITE_RANGE = 55;
const VAMPIRE_BITE_HEAL = 4;

const ASSASSIN_HP_PENALTY = 20;
const ASSASSIN_R_MULT = 0.85;
const ASSASSIN_SPEED_MULT = 1.7;
const ASSASSIN_BLINK_COOLDOWN = 550;
const ASSASSIN_BLINK_DIST = 180;
const ASSASSIN_BLINK_DMG = 8;

const NECRO_BONUS_HP = 25;
const NECRO_R_MULT = 1;
const NECRO_SPEED_MULT = 1;
const SOUL_REAP_COOLDOWN = 450;
const SOUL_REAP_RANGE = 220;
const SOUL_REAP_DMG = 6;
const SOUL_REAP_CHAIN_DMG_MULT = 0.6; // schade van elke extra chain-hit t.o.v. de vorige
const SOUL_REAP_MAX_CHAIN = 3; // eerste treffer + maximaal dit aantal extra chains bij een kill

const STORM_BONUS_HP = 10;
const STORM_R_MULT = 1;
const STORM_SPEED_MULT = 1.05;
const STORM_COOLDOWN = 700;
const STORM_DMG = 5;
const STORM_CHAIN_RANGE = 160;
const STORM_MAX_JUMPS = 5;

const ENGINEER_BONUS_HP = 30;
const ENGINEER_R_MULT = 1;
const ENGINEER_SPEED_MULT = 1;
const ENGINEER_DEPLOY_COOLDOWN = 1500;
const ENGINEER_DEPLOY_RANGE = 180;
const ENGINEER_MAX_TURRETS = 3;
const ENGINEER_TURRET_DURATION = 8000;
const ENGINEER_TURRET_RANGE = 220;
const ENGINEER_TURRET_FIRE_COOLDOWN = 500;
const ENGINEER_TURRET_DMG = 4;
const ENGINEER_TURRET_R = 12; // botsingsradius/tekenradius van een koepel
const ENGINEER_TURRET_HP = 60; // bots kunnen een koepel kapotschieten

const JUGGERNAUT_BONUS_HP = 80;
const JUGGERNAUT_R_MULT = 1.4;
const JUGGERNAUT_SPEED_MULT = 0.85;
const JUGGERNAUT_CHARGE_COOLDOWN = 1200;
const JUGGERNAUT_CHARGE_DIST = 150;
const JUGGERNAUT_CHARGE_DMG = 14;
const JUGGERNAUT_KNOCKBACK = 40;

// Stats per transformatie, gebruikt om max HP / hitbox / snelheid te herberekenen bij het starten
// van een potje (zie resetPlayer()).
const TRANSFORM_STATS = {
  none:       { hpBonus: 0,                    rMult: 1,               speedMult: 1 },
  tank:       { hpBonus: TANK_BONUS_HP,        rMult: TANK_R_MULT,      speedMult: 1 },
  berserker:  { hpBonus: BERSERKER_BONUS_HP,   rMult: BERSERKER_R_MULT, speedMult: BERSERKER_SPEED_MULT },
  sniper:     { hpBonus: SNIPER_BONUS_HP,      rMult: SNIPER_R_MULT,    speedMult: SNIPER_SPEED_MULT },
  swarm:      { hpBonus: SWARM_BONUS_HP,       rMult: SWARM_R_MULT,     speedMult: SWARM_SPEED_MULT },
  pyro:       { hpBonus: PYRO_BONUS_HP,        rMult: PYRO_R_MULT,      speedMult: PYRO_SPEED_MULT },
  vampire:    { hpBonus: VAMPIRE_BONUS_HP,     rMult: VAMPIRE_R_MULT,   speedMult: VAMPIRE_SPEED_MULT },
  assassin:   { hpBonus: -ASSASSIN_HP_PENALTY, rMult: ASSASSIN_R_MULT,  speedMult: ASSASSIN_SPEED_MULT },
  necromancer:{ hpBonus: NECRO_BONUS_HP,       rMult: NECRO_R_MULT,     speedMult: NECRO_SPEED_MULT },
  stormcaller:{ hpBonus: STORM_BONUS_HP,       rMult: STORM_R_MULT,     speedMult: STORM_SPEED_MULT },
  juggernaut: { hpBonus: JUGGERNAUT_BONUS_HP,  rMult: JUGGERNAUT_R_MULT, speedMult: JUGGERNAUT_SPEED_MULT },
  engineer:   { hpBonus: ENGINEER_BONUS_HP,    rMult: ENGINEER_R_MULT,  speedMult: ENGINEER_SPEED_MULT }
};

const TRANSFORMS = [
  { id: 'none', name: 'Geen transformatie', price: 0, desc: 'Speel gewoon als je normale poppetje met je uitgeruste wapen.' },
  { id: 'tank', name: 'Tank', price: 5500, desc: `Je volgende potje begin je als tank: +${TANK_BONUS_HP} max HP en een 50% grotere hitbox, maar geen wapens — je kunt alleen grote handgranaten met splash-schade lobben. Ga je dood als tank, dan word je één keer teruggevormd tot je normale poppetje met ${TRANSFORM_REVIVE_HP} HP en je uitgeruste wapen, in plaats van dat het potje eindigt.` },
  { id: 'berserker', name: 'Berserker', price: 5200, desc: `Je volgende potje begin je als berserker: +${BERSERKER_BONUS_HP} max HP en 50% meer snelheid, maar geen vuurwapens — je slaat in plaats daarvan een snelle mes-waaier uit vlak voor je. Ga je dood, dan word je net als bij de andere transformaties één keer teruggevormd tot je normale poppetje met ${TRANSFORM_REVIVE_HP} HP en je uitgeruste wapen.` },
  { id: 'sniper', name: 'Sniper Mech', price: 5600, desc: `Je volgende potje begin je als een trage, zwaar gepantserde sniper mech: +${SNIPER_BONUS_HP} max HP maar 45% minder snelheid. Geen normale wapens — in plaats daarvan vuur je een trage maar keiharde doorborende railgun-kogel af die door meerdere bots op een lijn heen schiet. Bij overlijden word je teruggevormd tot je normale poppetje met ${TRANSFORM_REVIVE_HP} HP en je uitgeruste wapen.` },
  { id: 'swarm', name: 'Drone Hive', price: 5800, desc: `Je volgende potje begin je als een drone-commandant: geen extra HP of snelheid, en geen eigen wapen — in plaats daarvan lanceer je bij elk schot ${SWARM_DRONE_COUNT} kleine zelfsturende drones die naar de dichtstbijzijnde bots zoeven. Bij overlijden word je teruggevormd tot je normale poppetje met ${TRANSFORM_REVIVE_HP} HP en je uitgeruste wapen.` },
  { id: 'pyro', name: 'Pyromancer', price: 5400, desc: `Je volgende potje begin je als pyromaniac: +${PYRO_BONUS_HP} max HP, maar geen wapens — je lobt in plaats daarvan vuurballen die bij inslag een brandende zone achterlaten die bots gedurende ${(PYRO_ZONE_DURATION/1000).toFixed(0)} sec schade-over-tijd toebrengt. Bij overlijden word je teruggevormd tot je normale poppetje met ${TRANSFORM_REVIVE_HP} HP en je uitgeruste wapen.` },
  { id: 'vampire', name: 'Vampire Lord', price: 5300, desc: `Je volgende potje begin je als vampier: +${VAMPIRE_BONUS_HP} max HP en 20% meer snelheid, maar geen wapens — je bijt in plaats daarvan de dichtstbijzijnde bot van dichtbij en geneest ${VAMPIRE_BITE_HEAL} HP per beet. Bij overlijden word je teruggevormd tot je normale poppetje met ${TRANSFORM_REVIVE_HP} HP en je uitgeruste wapen.` },
  { id: 'assassin', name: 'Shadow Assassin', price: 5700, desc: `Je volgende potje begin je als schaduwmoordenaar: -${ASSASSIN_HP_PENALTY} max HP en een kleinere hitbox, maar 70% meer snelheid. Geen wapens — je blinkt in plaats daarvan naar je muispositie en haalt alle bots op de route neer. Hoog risico, hoge beloning. Bij overlijden word je teruggevormd tot je normale poppetje met ${TRANSFORM_REVIVE_HP} HP en je uitgeruste wapen.` },
  { id: 'necromancer', name: 'Soul Reaper', price: 5500, desc: `Je volgende potje begin je als soul reaper: +${NECRO_BONUS_HP} max HP, maar geen wapens — je maait in plaats daarvan zielen van bots op afstand: raak je de dichtstbijzijnde bot en maak je hem af, dan springt de aanval automatisch door naar de volgende (tot ${SOUL_REAP_MAX_CHAIN} extra chains). Bij overlijden word je teruggevormd tot je normale poppetje met ${TRANSFORM_REVIVE_HP} HP en je uitgeruste wapen.` },
  { id: 'stormcaller', name: 'Storm Caller', price: 5600, desc: `Je volgende potje begin je als storm caller: +${STORM_BONUS_HP} max HP, maar geen wapens — je slingert in plaats daarvan een bliksemschicht die overspringt tussen tot ${STORM_MAX_JUMPS} nabije bots. Bij overlijden word je teruggevormd tot je normale poppetje met ${TRANSFORM_REVIVE_HP} HP en je uitgeruste wapen.` },
  { id: 'juggernaut', name: 'Juggernaut', price: 5900, desc: `Je volgende potje begin je als juggernaut: +${JUGGERNAUT_BONUS_HP} max HP en een 40% grotere hitbox, maar 15% minder snelheid. Geen wapens — je beukt in plaats daarvan naar voren en ramt alle bots op je pad omver met zware schade en flinke terugstoot. Bij overlijden word je teruggevormd tot je normale poppetje met ${TRANSFORM_REVIVE_HP} HP en je uitgeruste wapen.` },
  { id: 'engineer', name: 'Field Engineer', price: 5700, desc: `Je volgende potje begin je als field engineer: +${ENGINEER_BONUS_HP} max HP, maar geen wapens — je zet in plaats daarvan automatische geschutskoepels neer (max ${ENGINEER_MAX_TURRETS} tegelijk) die zelfstandig op nabije bots vuren. Bots schieten op hun beurt terug op de koepels (${ENGINEER_TURRET_HP} HP) tot ze kapot gaan, of ze verdwijnen vanzelf na een tijdje. Bij overlijden word je teruggevormd tot je normale poppetje met ${TRANSFORM_REVIVE_HP} HP en je uitgeruste wapen.` }
];

// ---- Wereld 2-exclusieve transformaties: Elementgestaltes ----
const FIREFORM_BONUS_HP = 20;
const FIREFORM_R_MULT = 1.05;
const FIREFORM_SPEED_MULT = 1;
const FIREFORM_COOLDOWN = 450;
const FIREFORM_RANGE = 150;
const FIREFORM_ARC = Math.PI * 0.6;
const FIREFORM_DMG = 7;
const FIREFORM_IGNITE_RADIUS = 30;
const FIREFORM_IGNITE_DURATION = 2000;
const FIREFORM_IGNITE_TICK = 2;

const ICEFORM_BONUS_HP = 15;
const ICEFORM_R_MULT = 1;
const ICEFORM_SPEED_MULT = 0.9;
const ICEFORM_COOLDOWN = 950;
const ICEFORM_RANGE = 620;
const ICEFORM_DMG = 10;
const ICEFORM_FREEZE_DURATION = 1300;

const EARTHFORM_BONUS_HP = 70;
const EARTHFORM_R_MULT = 1.25;
const EARTHFORM_SPEED_MULT = 0.85;
const EARTHFORM_COOLDOWN = 900;
const EARTHFORM_WALL_DIST = 220;
const EARTHFORM_WALL_COUNT = 5;
const EARTHFORM_WALL_SPACING = 30;
const EARTHFORM_SPIKE_RADIUS = 24;
const EARTHFORM_DMG = 12;
const EARTHFORM_ROOT_DURATION = 700;
const EARTHFORM_PATH_COUNT = 4; // kleine bommetjes die een pad vormen van de speler naar de middelste piek van de muur
const EARTHFORM_PATH_RADIUS_MULT = 0.6;
const EARTHFORM_PATH_DMG_MULT = 0.6;

const WINDFORM_BONUS_HP = 0;
const WINDFORM_R_MULT = 0.9;
const WINDFORM_SPEED_MULT = 1.6;
const WINDFORM_COOLDOWN = 600;
const WINDFORM_DASH_DIST = 170;
const WINDFORM_DMG = 6;
const WINDFORM_KNOCKBACK = 90;

const WATERFORM_BONUS_HP = 15;
const WATERFORM_R_MULT = 1;
const WATERFORM_SPEED_MULT = 1.05;
const WATERFORM_COOLDOWN = 1400;
const WATERFORM_RADIUS = 150;
const WATERFORM_DMG = 9;
const WATERFORM_SHIELD_DURATION = 900;

const WORLD2_TRANSFORM_STATS = {
  fireform:  { hpBonus: FIREFORM_BONUS_HP,  rMult: FIREFORM_R_MULT,  speedMult: FIREFORM_SPEED_MULT },
  iceform:   { hpBonus: ICEFORM_BONUS_HP,   rMult: ICEFORM_R_MULT,   speedMult: ICEFORM_SPEED_MULT },
  earthform: { hpBonus: EARTHFORM_BONUS_HP, rMult: EARTHFORM_R_MULT, speedMult: EARTHFORM_SPEED_MULT },
  windform:  { hpBonus: WINDFORM_BONUS_HP,  rMult: WINDFORM_R_MULT,  speedMult: WINDFORM_SPEED_MULT },
  waterform: { hpBonus: WATERFORM_BONUS_HP, rMult: WATERFORM_R_MULT, speedMult: WATERFORM_SPEED_MULT }
};

const WORLD2_TRANSFORMS = [
  { id: 'fireform', name: 'Vuurgestalte', price: 6000, desc: `Wereld 2-exclusief. Je volgende potje begin je als vuurelementaal: +${FIREFORM_BONUS_HP} max HP, maar geen wapens — je slaat in plaats daarvan een brandende vlammenboog vlak voor je uit die bots ontsteekt zodat ze nog even doorbranden. Bij overlijden word je teruggevormd tot je normale poppetje met ${TRANSFORM_REVIVE_HP} HP en je uitgeruste wapen.` },
  { id: 'iceform', name: 'IJsgestalte', price: 6000, desc: `Wereld 2-exclusief. Je volgende potje begin je als ijselementaal: +${ICEFORM_BONUS_HP} max HP maar 10% minder snelheid. Geen wapens — je schiet in plaats daarvan een doorborende vriesstraal af die alle bots op een lijn raakt en bevriest. Bij overlijden word je teruggevormd tot je normale poppetje met ${TRANSFORM_REVIVE_HP} HP en je uitgeruste wapen.` },
  { id: 'earthform', name: 'Aardgestalte', price: 6200, desc: `Wereld 2-exclusief. Je volgende potje begin je als aardelementaal: +${EARTHFORM_BONUS_HP} max HP en een 25% grotere hitbox, maar 15% minder snelheid. Geen wapens — je laat in plaats daarvan een pad van kleine bommetjes vanaf jezelf ontstaan die uitkomt bij een muur van ${EARTHFORM_WALL_COUNT} rotspieken verderop, allemaal bots beschadigend en heel even vastzettend. Bij overlijden word je teruggevormd tot je normale poppetje met ${TRANSFORM_REVIVE_HP} HP en je uitgeruste wapen.` },
  { id: 'windform', name: 'Windgestalte', price: 6100, desc: `Wereld 2-exclusief. Je volgende potje begin je als windelementaal: 60% meer snelheid en een kleinere hitbox, maar geen extra HP. Geen wapens — je schiet in plaats daarvan als een vlaag naar je muispositie en blaast alle bots op de route weg. Bij overlijden word je teruggevormd tot je normale poppetje met ${TRANSFORM_REVIVE_HP} HP en je uitgeruste wapen.` },
  { id: 'waterform', name: 'Watergestalte', price: 6000, desc: `Wereld 2-exclusief. Je volgende potje begin je als waterelementaal: +${WATERFORM_BONUS_HP} max HP. Geen wapens — je laat in plaats daarvan een vloedgolf om je heen losbarsten die bots wegstoot en beschadigt, en geeft jezelf daarbij een kort schild. Bij overlijden word je teruggevormd tot je normale poppetje met ${TRANSFORM_REVIVE_HP} HP en je uitgeruste wapen.` }
];
let hasDualArmor = localStorage.getItem('botShooterHasDualArmor') === 'true';
const DUAL_ARMOR_PRICE = 2000;
let lvlExtraHp = Number(localStorage.getItem('botShooterLvlExtraHp')) || 0;
const EXTRA_HP_LEVELS = [800, 1200, 1700, 2300, 3000];
const EXTRA_HP_PER_LEVEL = 25;
let lvlSprint = Number(localStorage.getItem('botShooterLvlSprint')) || 0;
const SPRINT_LEVELS = [600, 1000, 1500];
const SPRINT_PER_LEVEL = 0.10;
let lvlMagnet = Number(localStorage.getItem('botShooterLvlMagnet')) || 0;
const MAGNET_LEVELS = [500, 800, 1200];
const MAGNET_RADIUS_PER_LEVEL = 35;
let lvlLongBoosts = Number(localStorage.getItem('botShooterLvlLongBoosts')) || 0;
const LONG_BOOSTS_LEVELS = [650, 1000, 1450];
const LONG_BOOSTS_MULT_PER_LEVEL = 0.5;
let hasRevive = localStorage.getItem('botShooterHasRevive') === 'true';
const REVIVE_PRICE = 1500;
const REVIVE_HEAL_PCT = 0.35;
let lvlFastReload = Number(localStorage.getItem('botShooterLvlFastReload')) || 0;
const FAST_RELOAD_LEVELS = [700, 1100, 1600];
const FAST_RELOAD_PER_LEVEL = 0.06;
let lvlIronSkin = Number(localStorage.getItem('botShooterLvlIronSkin')) || 0;
const IRON_SKIN_LEVELS = [900, 1400, 2000];
const IRON_SKIN_REDUCTIONS = [0.10, 0.18, 0.25];
let lvlLuckyDrop = Number(localStorage.getItem('botShooterLvlLuckyDrop')) || 0;
const LUCKY_DROP_LEVELS = [550, 850, 1200];
const LUCKY_DROP_INTERVALS = [3600, 2700, 1800];
let lvlPiercingRounds = Number(localStorage.getItem('botShooterLvlPiercingRounds')) || 0;
const PIERCING_ROUNDS_LEVELS = [750, 1150, 1600];
let lvlCoinRain = Number(localStorage.getItem('botShooterLvlCoinRain')) || 0;
const COIN_RAIN_LEVELS = [600, 900, 1300, 1800];
const COIN_RAIN_BONUSES = [2, 4, 5, 6];
let lvlSecondWind = Number(localStorage.getItem('botShooterLvlSecondWind')) || 0;
const SECOND_WIND_LEVELS = [1000, 1500, 2100];
const SECOND_WIND_HEALS = [20, 35, 50];
let lvlSharpshooter = Number(localStorage.getItem('botShooterLvlSharpshooter')) || 0;
const SHARPSHOOTER_LEVELS = [650, 1000, 1400];
const SHARPSHOOTER_BONUSES = [0.15, 0.25, 0.35];
let lvlFlyingStart = Number(localStorage.getItem('botShooterLvlFlyingStart')) || 0;
const FLYING_START_LEVELS = [500, 800, 1150];
const FLYING_START_DURATIONS = [3000, 5000, 7000];
let lvlCriticalHit = Number(localStorage.getItem('botShooterLvlCriticalHit')) || 0;
const CRITICAL_HIT_LEVELS = [600, 950, 1350];
const CRITICAL_HIT_CHANCES = [0.15, 0.25, 0.35];
let lvlSplinterShot = Number(localStorage.getItem('botShooterLvlSplinterShot')) || 0;
const SPLINTER_SHOT_LEVELS = [700, 1100, 1550];
let lvlShockwave = Number(localStorage.getItem('botShooterLvlShockwave')) || 0;
const SHOCKWAVE_LEVELS = [800, 1300, 1900];
const SHOCKWAVE_RADII = [80, 120, 160];
let lvlMultiShield = Number(localStorage.getItem('botShooterLvlMultiShield')) || 0;
const MULTI_SHIELD_LEVELS = [1000, 1500, 2100];
let lvlGoldRush = Number(localStorage.getItem('botShooterLvlGoldRush')) || 0;
const GOLD_RUSH_LEVELS = [500, 850, 1250];
const GOLD_RUSH_RADIUS = [150, 200, 250];
let lvlOverkill = Number(localStorage.getItem('botShooterLvlOverkill')) || 0;
const OVERKILL_LEVELS = [850, 1300, 1900];
let lvlBloodlust = Number(localStorage.getItem('botShooterLvlBloodlust')) || 0;
const BLOODLUST_LEVELS = [750, 1150, 1650];
const BLOODLUST_BONUSES = [0.05, 0.08, 0.12];

// Alle permanente meta-upgrades hierboven zijn Wereld 1-only: geen effect in Wereld 2, net als speciale wapens/pantsers/powerups
function w1Lvl(lvl) { return currentWorld === 2 ? 0 : lvl; }
function w1Flag(flag) { return currentWorld === 2 ? false : flag; }

// ---- Wereld 2-exclusieve permanente upgrades: geen effect in Wereld 1, net als de elementale wapens/pantsers ----
let lvl2FireCore = Number(localStorage.getItem('botShooterLvl2FireCore')) || 0;
const FIRECORE_LEVELS = [700, 1100, 1600];
const FIRECORE_RESIST_PER_LEVEL = 0.15;
let lvl2FrostBlood = Number(localStorage.getItem('botShooterLvl2FrostBlood')) || 0;
const FROSTBLOOD_LEVELS = [700, 1100, 1600];
const FROSTBLOOD_RESIST_PER_LEVEL = 0.15;
let lvl2Steadfast = Number(localStorage.getItem('botShooterLvl2Steadfast')) || 0;
const STEADFAST_LEVELS = [650, 1000, 1450];
const STEADFAST_RESIST_PER_LEVEL = 0.2;
let lvl2FastReload = Number(localStorage.getItem('botShooterLvl2FastReload')) || 0;
const FASTRELOAD2_LEVELS = [750, 1150, 1650];
const FASTRELOAD2_PER_LEVEL = 0.06;
let lvl2LongBoosts = Number(localStorage.getItem('botShooterLvl2LongBoosts')) || 0;
const LONGBOOSTS2_LEVELS = [700, 1050, 1500];
const LONGBOOSTS2_MULT_PER_LEVEL = 0.5;
let lvl2Magnet = Number(localStorage.getItem('botShooterLvl2Magnet')) || 0;
const MAGNET2_LEVELS = [550, 850, 1250];
const MAGNET2_RADIUS_PER_LEVEL = 35;
let hasRevive2 = localStorage.getItem('botShooterHasRevive2') === 'true';
const REVIVE2_PRICE = 1800;
const REVIVE2_HEAL_PCT = 0.35;
let hasDualArmor2 = localStorage.getItem('botShooterHasDualArmor2') === 'true';
const DUAL_ARMOR2_PRICE = 2000;
let lvl2Vengeance = Number(localStorage.getItem('botShooterLvl2Vengeance')) || 0;
const VENGEANCE_LEVELS = [800, 1250, 1800];
const VENGEANCE_RADII = [80, 120, 160];
const VENGEANCE_DMGS = [6, 8, 10];
let lvl2IronSkin = Number(localStorage.getItem('botShooterLvl2IronSkin')) || 0;
const IRONSKIN2_LEVELS = [750, 1150, 1650];
const IRONSKIN2_REDUCTIONS = [0.15, 0.25, 0.35];
let lvl2ExtraHp = Number(localStorage.getItem('botShooterLvl2ExtraHp')) || 0;
const EXTRAHP2_LEVELS = [750, 1150, 1600, 2200, 2900];
const EXTRAHP2_PER_LEVEL = 25;

function w2Lvl(lvl) { return currentWorld === 2 ? lvl : 0; }
function w2Flag(flag) { return currentWorld === 2 ? flag : false; }

// ---- Nog 10 Wereld 2-exclusieve permanente upgrades: geen effect in Wereld 1 ----
let lvl2LuckyDrop = Number(localStorage.getItem('botShooterLvl2LuckyDrop')) || 0;
const LUCKYDROP2_LEVELS = [600, 900, 1300];
const LUCKYDROP2_INTERVALS = [3600, 2700, 1800];
let lvl2PiercingRounds = Number(localStorage.getItem('botShooterLvl2PiercingRounds')) || 0;
const PIERCINGROUNDS2_LEVELS = [800, 1200, 1650];
let lvl2CoinRain = Number(localStorage.getItem('botShooterLvl2CoinRain')) || 0;
const COINRAIN2_LEVELS = [650, 950, 1350, 1850];
const COINRAIN2_BONUSES = [2, 4, 5, 6];
let lvl2SecondWind = Number(localStorage.getItem('botShooterLvl2SecondWind')) || 0;
const SECONDWIND2_LEVELS = [1050, 1550, 2150];
const SECONDWIND2_HEALS = [20, 35, 50];
let lvl2Sharpshooter = Number(localStorage.getItem('botShooterLvl2Sharpshooter')) || 0;
const SHARPSHOOTER2_LEVELS = [700, 1050, 1450];
const SHARPSHOOTER2_BONUSES = [0.15, 0.25, 0.35];
let lvl2FlyingStart = Number(localStorage.getItem('botShooterLvl2FlyingStart')) || 0;
const FLYINGSTART2_LEVELS = [550, 850, 1200];
const FLYINGSTART2_DURATIONS = [3000, 5000, 7000];
let lvl2CriticalHit = Number(localStorage.getItem('botShooterLvl2CriticalHit')) || 0;
const CRITICALHIT2_LEVELS = [650, 1000, 1400];
const CRITICALHIT2_CHANCES = [0.15, 0.25, 0.35];
let lvl2SplinterShot = Number(localStorage.getItem('botShooterLvl2SplinterShot')) || 0;
const SPLINTERSHOT2_LEVELS = [750, 1150, 1600];
let lvl2MultiShield = Number(localStorage.getItem('botShooterLvl2MultiShield')) || 0;
const MULTISHIELD2_LEVELS = [1050, 1550, 2150];
let lvl2Overkill = Number(localStorage.getItem('botShooterLvl2Overkill')) || 0;
const OVERKILL2_LEVELS = [900, 1350, 1950];

// ---- Elemental Kern-winkel (Wereld 2-only): items en upgrades gekocht met Elemental Cores i.p.v. munten ----
let lvlCoreDamage = Number(localStorage.getItem('botShooterLvlCoreDamage')) || 0;
const CORE_DAMAGE_LEVELS = [23, 33, 43]; // prijzen in Elemental Cores
const CORE_DAMAGE_PER_LEVEL = 0.08;
let lvlCoreShield = Number(localStorage.getItem('botShooterLvlCoreShield')) || 0;
const CORE_SHIELD_LEVELS = [23, 33, 43];
const CORE_SHIELD_REDUCTIONS = [0.1, 0.18, 0.25];
let hasCoreHarvest = localStorage.getItem('botShooterHasCoreHarvest') === 'true';
const CORE_HARVEST_PRICE = 53;
const CORE_HARVEST_BONUS = 3; // extra Elemental Cores per verslagen boss in Eindbaas Rush
let lvlCoreSpeed = Number(localStorage.getItem('botShooterLvlCoreSpeed')) || 0;
const CORE_SPEED_LEVELS = [23, 33, 43];
const CORE_SPEED_PER_LEVEL = 0.08;
let lvlCoreRegen = Number(localStorage.getItem('botShooterLvlCoreRegen')) || 0;
const CORE_REGEN_LEVELS = [23, 33, 43];
const CORE_REGEN_PER_LEVEL = 1; // extra HP/sec per niveau
let lvlCoreVampire = Number(localStorage.getItem('botShooterLvlCoreVampire')) || 0;
const CORE_VAMPIRE_LEVELS = [23, 33, 43];
const CORE_VAMPIRE_PER_LEVEL = 2; // extra HP per kill per niveau
let hasCoreAura = localStorage.getItem('botShooterHasCoreAura') === 'true';
const CORE_AURA_PRICE = 38;
const CORE_AURA_RADIUS = 90;
const CORE_AURA_DMG = 2;
let hasCoreShock = localStorage.getItem('botShooterHasCoreShock') === 'true';
const CORE_SHOCK_PRICE = 38;
const CORE_SHOCK_CHANCE = 0.12;

// Powerup-upgrades: elke soort powerup kan permanent verbeterd worden
let powerupLevels = JSON.parse(localStorage.getItem('botShooterPowerupLevels') || '{}'); // id -> huidig niveau (0-3)
const POWERUP_LEVELS = {
  speed:     { name: '⚡ Speed',       prices: [300, 500, 750],   durations: [5000, 6000, 7000, 8000] },
  heal:      { name: '+ Heal',         prices: [300, 500, 750],   heals: [30, 50, 65, 75] },
  fire:      { name: '🔥 Snelvuur',    prices: [350, 550, 800],   durations: [6000, 7000, 8000, 9500] },
  shield:    { name: '🛡 Schild',      prices: [350, 550, 800],   durations: [5000, 6000, 7500, 9000] },
  damage:    { name: '💥 Damage',      prices: [400, 650, 950],   durations: [6000, 7000, 8000, 9500] },
  multishot: { name: '✦ Multishot',    prices: [400, 650, 950],   durations: [6000, 7000, 8000, 9500], pellets: [3, 5, 6, 7] },
  freeze:    { name: '❄ Freeze',       prices: [350, 550, 800],   durations: [5000, 6000, 7000, 9000] },
  nuke:      { name: '💣 Nuke',        prices: [500, 800, 1150],  dmgs: [10, 13, 16, 20] },
  invisible: { name: '👻 Onzichtbaar', prices: [450, 700, 1000],  durations: [5000, 6000, 7000, 9000] },
  timewarp:  { name: '⏳ Timewarp',    prices: [450, 700, 1000],  durations: [5000, 6000, 7000, 8000] },
  ricochet:  { name: '🔄 Terugkaats',  prices: [400, 650, 950],   durations: [9000, 12000, 15000, 18000], desc: 'Schild: kogels van bots kaatsen terug naar de bot die ze afvuurde in plaats van jou te raken.' },
  homing:    { name: '🎯 Homing',      prices: [450, 700, 1000],  durations: [6000, 8000, 10000, 12000], desc: 'Je kogels buigen automatisch af richting de dichtstbijzijnde bot.' },
  stun:      { name: '⊗ Stun',         prices: [350, 550, 800],   durations: [4000, 5000, 6000, 7000], desc: 'Elke bot die op je schiet wordt na het schot even verlamd en kan tijdelijk niet vuren.' },
  aura:      { name: '💫 Aura',        prices: [400, 650, 950],   durations: [7000, 8000, 9000, 10000], desc: 'Een schadeveld om je heen doet voortdurend schade aan alle bots die dichtbij komen.' },
  overload:  { name: '⚡ Overload',     prices: [500, 800, 1150],  durations: [5000, 6000, 7000, 8000], desc: 'Dubbele schade en veel hogere vuursnelheid tegelijk.' },
  chaos:     { name: '🌀 Verwarring',   prices: [450, 700, 1000],  durations: [7000, 8500, 10000, 12000], desc: 'Alle bots (ook bosses) schieten op elkaar in plaats van op jou. Hun kogels doen elkaar evenveel schade als aan jou.' },
  elementstorm: { name: '🔥❄ Elementenstorm', prices: [500, 800, 1150], dmgs: [12, 16, 20, 25], counts: [25, 30, 35, 40], desc: 'Afwisselend vuur- en ijsstralen schieten vanaf de zijkanten het speelveld in, 8 per seconde, elk met een stippellijntje als waarschuwing vooraf. Ijsstralen bevriezen bots ook even. Doet alleen schade aan bots.' },
  firetrail: { name: '🔥 Vuurspoor', prices: [400, 650, 950], durations: [6000, 7000, 8000, 9000], desc: 'Laat een tijdlang een brandend spoor achter je aan dat bots beschadigt die erin lopen.' },
  strike: { name: '⚡ Inslag', prices: [400, 650, 950], dmgs: [35, 45, 55, 65], desc: 'Een enorme blikseminslag treft het midden van het speelveld en beschadigt alle bots die daar staan.' },
  tornadoshot: { name: '🌪 Tornado-schot', prices: [450, 700, 1000], radii: [45, 60, 75], desc: 'Je volgende schot is geen kogel maar een kleine tornado. Bots die hij raakt worden meegesleurd; zodra hij de rand van het veld bereikt worden ze eraf geslingerd en sterven (werkt niet op bosses).' },
  lightningbarrage: { name: '⚡ Bliksemschichten', prices: [450, 700, 1000], dmgs: [30, 36, 42, 48], desc: '4 bliksemschichten treffen de 3 bots met de meeste HP, elk voor forse schade.' },
  wortelgreep: { name: '🌳 Wortelgreep', prices: [400, 650, 950], counts: [3, 4, 5], desc: 'Bomen schieten uit de grond, grijpen elk een willekeurige bot en trekken hem met wortel en tak de grond in.' },
  aardhuid:    { name: '🪨 Aardhuid',    prices: [350, 550, 800], durations: [7000, 8500, 10000], reductions: [0.6, 0.7, 0.8], desc: 'Een rotshuid om je heen vermindert inkomende schade fors, tijdelijk.' },
  vuurnova:    { name: '🔥 Vuurnova',    prices: [400, 650, 950], dmgs: [22, 28, 34], radii: [170, 190, 210], desc: 'Een felle vuurexplosie om je heen beschadigt direct alle bots dichtbij.' },
  aardaura:    { name: '🌱 Aardaura',    prices: [350, 550, 800], durations: [8000, 9500, 11000], desc: 'Een veld van aarde-energie om je heen doet voortdurend schade aan bots die dichtbij komen.' },
  ijsbries:    { name: '❄ IJsbries',    prices: [300, 500, 750], durations: [4500, 5500, 6500], desc: 'Een ijzige windvlaag bevriest alle bots op het scherm tijdelijk.' }
};
const POWERUP_IDS = ['speed', 'heal', 'fire', 'shield', 'damage', 'multishot', 'freeze', 'nuke', 'invisible', 'timewarp', 'ricochet', 'homing', 'stun', 'aura', 'overload', 'chaos', 'elementstorm'];
// Alleen te vinden als pickup in Wereld 2 — niet in POWERUP_IDS, dus niet upgradebaar/koopbaar in de (lege) powerup-shop
const WORLD2_POWERUP_IDS = ['wortelgreep', 'aardhuid', 'vuurnova', 'aardaura', 'ijsbries', 'firetrail', 'strike', 'tornadoshot', 'lightningbarrage'];

function getPuLevel(id) { return powerupLevels[id] || 0; }

let coinPickups = [];
let lastCoinSpawn = 0;

const WEAPONS = [
  { id: 'pistol',   name: 'Pistool',       price: 0,    cooldownMult: 1,    dmg: 1, pellets: 1, spread: 0,    desc: 'Standaard wapen, gebalanceerd.' },
  { id: 'smg',      name: 'SMG',           price: 150,  cooldownMult: 0.55, dmg: 1, pellets: 1, spread: 0,    desc: 'Veel sneller schieten, zelfde schade per kogel.' },
  { id: 'rifle',    name: 'Geweer',        price: 350,  cooldownMult: 0.85, dmg: 2, pellets: 1, spread: 0,    bulletSpeedMult: 1.5, desc: 'Snelle, precieze kogels met meer schade.' },
  { id: 'shotgun',  name: 'Shotgun',       price: 400,  cooldownMult: 1.3,  dmg: 1, pellets: 3, spread: 0.26, desc: 'Vuurt 3 kogels in een waaier, dodelijk van dichtbij.' },
  { id: 'minigun',  name: 'Minigun',       price: 700,  cooldownMult: 0.4167,  dmg: 1, pellets: 1, spread: 0,    inaccuracy: 0.15, desc: 'Bizar hoog vuurtempo (20 schoten/sec), iets minder nauwkeurig.' },
  { id: 'cannon',   name: 'Cannon',        price: 550,  cooldownMult: 1.8,  dmg: 3, pellets: 1, spread: 0,    desc: 'Traag maar keiharde klap per schot.' },
  { id: 'railgun',  name: 'Railgun',       price: 950,  cooldownMult: 2.2,  dmg: 4, pellets: 1, spread: 0,    pierce: 2, desc: 'Doorboort tot 3 bots op een rechte lijn.' },
  { id: 'rocket',   name: 'Raketwerper',   price: 1200, cooldownMult: 2.6,  dmg: 3, pellets: 1, spread: 0,    splashRadius: 70, splashDmg: 2, desc: 'Explodeert bij impact en beschadigt bots in de omgeving.' }
];

// Speciale wapens: eigen categorie, elk met een uniek hit- of kill-effect
const SPECIAL_WEAPONS = [
  { id: 'cryorifle',   name: 'Cryo Rifle',        price: 2350, cooldownMult: 0.95, dmg: 2, pellets: 1, spread: 0, effect: 'freezeKill',     desc: 'Bij elke kill bevriest een ijsgolf alle bots in de buurt 2 sec.' },
  { id: 'vampcannon',  name: 'Vamp Cannon',       price: 2300, cooldownMult: 1.2,  dmg: 2, pellets: 1, spread: 0, effect: 'lifestealKill',  desc: 'Elke kill geneest je direct 3 HP.' },
  { id: 'voltcaster',  name: 'Volt Caster',       price: 2500, cooldownMult: 1,    dmg: 2, pellets: 1, spread: 0, effect: 'chainLightning', desc: 'Elke kogel slaat over als bliksem naar een nabije bot voor extra schade.' },
  { id: 'singularity', name: 'Singularity Gun',   price: 3200, cooldownMult: 1.6,  dmg: 2, pellets: 1, spread: 0, effect: 'blackholeKill',  desc: 'Elke kill opent een kolkend zwart gat dat bots naar binnen zuigt, geleidelijk schade doet, en na ~1,2 sec imploderend nog een flinke schadeburst uitdeelt.' },
  { id: 'stickybomb',  name: 'Kleefbom Werper',   price: 2800, cooldownMult: 1.7,  dmg: 1, pellets: 1, spread: 0, effect: 'stickyBomb',     desc: 'Kogels blijven kleven op de bot die je raakt en ontploffen na een korte waarschuwing (rode telegraph-cirkel) met een grote explosie.' },
  { id: 'toxiccannon', name: 'Toxic Cannon',      price: 2900, cooldownMult: 1.1,  dmg: 1, pellets: 1, spread: 0, effect: 'poison',         desc: 'Vergiftigt bots met schade-over-tijd, en verspreidt het gif automatisch naar bots in de buurt zodra een vergiftigde bot sterft.' },
  { id: 'executioner', name: 'Executioner Rifle', price: 3000, cooldownMult: 1.3,  dmg: 2, pellets: 1, spread: 0, effect: 'execute',        desc: 'Maakt bots die onder 25% HP zitten altijd direct af, ongeacht hun resterende HP — perfect om net-niet-dode bots snel op te ruimen.' },
  { id: 'momentum',    name: 'Momentum Blade',    price: 3100, cooldownMult: 0.8,  dmg: 1, pellets: 1, spread: 0, effect: 'killstreak',     desc: 'Bouwt een killstreak op (zichtbaar in de HUD) die je schade tot +150% verhoogt bij 10 kills op rij, maar reset als je 2,5 sec geen kill maakt.' }
];

const ARMOR = [
  { id: 'none',       name: 'Geen pantser',        price: 0,    hpBonus: 0,   reduction: 0,    desc: 'Geen extra bescherming.' },
  { id: 'vest',       name: 'Vest',                price: 150,  hpBonus: 30,  reduction: 0,    desc: '+30 max HP.' },
  { id: 'plate',      name: 'Plaatpantser',        price: 350,  hpBonus: 60,  reduction: 0.25, desc: '+60 max HP, -25% inkomende schade.' },
  { id: 'juggernaut', name: 'Juggernaut',          price: 650,  hpBonus: 120, reduction: 0.4,  desc: '+120 max HP, -40% inkomende schade.' },
  { id: 'regen',      name: 'Regeneratie-pantser', price: 450,  hpBonus: 20,  reduction: 0,    regen: 2,        desc: '+20 max HP. Geneest passief 2 HP per seconde.' },
  { id: 'thorns',     name: 'Doornpantser',        price: 500,  hpBonus: 20,  reduction: 0,    thorns: 3,       desc: '+20 max HP. Kaatst 3 schade terug naar bots die je van dichtbij raken.' },
  { id: 'vampire',    name: 'Vampierpantser',      price: 550,  hpBonus: 15,  reduction: 0,    vampireHeal: 4,  desc: '+15 max HP. Geneest 4 HP bij elke gedode bot.' },
  { id: 'fortune',    name: 'Fortuinpantser',      price: 400,  hpBonus: 15,  reduction: 0,    coinMult: 1.5,   desc: '+15 max HP. Munten zijn 50% meer waard.' },
  { id: 'adrenaline', name: 'Adrenalinepantser',   price: 700,  hpBonus: 40,  reduction: 0,    adrenaline: true, desc: '+40 max HP. Onder 25% HP krijg je eenmalig automatisch 3s schild + snelheidsboost.' },
  { id: 'reflection', name: 'Reflectie-pantser',   price: 600,  hpBonus: 50,  reduction: 0,    reflection: 0.3, desc: '+50 max HP. Kaatst 30% van inkomende schade terug naar aanvallers.' },
  { id: 'spikes',     name: 'Spijkerpantser',      price: 550,  hpBonus: 25,  reduction: 0,    thorns: 6,       desc: '+25 max HP. Kaatst 6 schade terug naar bots die je van dichtbij raken.' },
  { id: 'fortress',   name: 'Vesting-pantser',     price: 750,  hpBonus: 80,  reduction: 0.5,  desc: '+80 max HP, -50% inkomende schade. Zeer defensief.' },
  { id: 'mystic',     name: 'Mystiek-pantser',     price: 650,  hpBonus: 20,  reduction: 0,    regen: 2, vampireHeal: 1, desc: '+20 max HP. Geneest 2 HP/sec passief en 1 HP per kill.' },
  { id: 'leather',    name: 'Lederen Armor',       price: 350,  hpBonus: 40,  reduction: 0.1,  speedBonus: 0.15, desc: '+40 max HP, -10% schade, +15% bewegingssnelheid.' },
  { id: 'plague',     name: 'Pesteuntzer-pantser', price: 600,  hpBonus: 25,  reduction: 0,    poisonReflect: true, desc: '+25 max HP. Bots die je van dichtbij raken, worden vergiftigd.' },
  { id: 'ice',        name: 'Ijs-pantser',         price: 650,  hpBonus: 30,  reduction: 0.15, freezeReflect: true, desc: '+30 max HP, -15% schade. Bots die je raken, bevriezen voor 3 sec.' }
];

// Elementale wapens: alleen te koop in de Wereld 2-shop
const WORLD2_WEAPONS = [
  { id: 'flamethrower', name: 'Vlammenwerper', price: 2200, cooldownMult: 0.35, dmg: 1, pellets: 2, spread: 0.16, maxRange: 230, effect: 'igniteHit', desc: 'Spuit een korte stoot echt vuur met beperkte reikwijdte (~230px). Zet de geraakte bot 2,5 sec in brand voor schade-over-tijd.' },
  { id: 'earthpounder',  name: 'Aardstamper',   price: 2300, cooldownMult: 1.6, dmg: 3, pellets: 1, spread: 0,    effect: 'knockbackHit', desc: 'Elke kogel stampt de geraakte bot een flink stuk naar achteren.' },
  { id: 'windrifle',     name: 'Windgeweer',    price: 2400, cooldownMult: 1.5, dmg: 2, pellets: 1, spread: 0,    pierce: 3, bulletSpeedMult: 0.65, bulletR: 10, effect: 'gustPush', desc: 'Schiet kolkende windstoten i.p.v. kogels, iets minder snel achter elkaar. Ze waaien dwars door tot 4 bots op een lijn en blazen iedereen dichtbij een flink stuk weg.' },
  { id: 'crystalgun',    name: 'Kristalgeweer', price: 2500, cooldownMult: 1.1, dmg: 2, pellets: 1, spread: 0, bulletR: 7, effect: 'shatterHit', desc: 'Schiet echte, zichtbare ijsscherven i.p.v. kogels. Elke scherf spat uiteen in ijsschilfers die bots dichtbij ook raken en even bevriezen.' }
];

// Elementale speciale wapens: alleen te koop in de Wereld 2-shop, elk met een eigen E-ability
const ROOT_DRAG_RANGE = 220; // Wortelgeweer: max afstand tot de dichtstbijzijnde bot die meegesleurd kan worden
const WORLD2_SPECIAL_WEAPONS = [
  { id: 'magmacannon',    name: 'Magma Kanon',   price: 2600, cooldownMult: 1.2, dmg: 3, pellets: 1, spread: 0, effect: 'igniteHit',   desc: 'Zwaar vuurwapen. Elke kogel zet de bot in brand. Druk op E om een brandend lavaveld op je richtpunt neer te leggen dat bots daarin voortdurend schade geeft.' },
  { id: 'hurricanestaff', name: 'Orkaanstaf',    price: 2600, cooldownMult: 1.0, dmg: 2, pellets: 1, spread: 0, effect: 'gustPush',    desc: 'Wind-staf. Elke kogel blaast de geraakte bot en iedereen dichtbij een stuk weg. Druk op E voor een windvlaag om je heen die alle bots dichtbij beschadigt en wegblaast.' },
  { id: 'frostlance',     name: 'Rijmlans',      price: 2700, cooldownMult: 1.1, dmg: 2, pellets: 1, spread: 0, effect: 'shatterHit',  desc: 'IJzige lans. Elke kogel spat uiteen in ijsscherven die bots dichtbij ook raken en even bevriezen. Druk op E voor een doorborende vriesstraal die alle bots op een lijn beschadigt en bevriest.' },
  { id: 'earthhammer',    name: 'Aardhamer',     price: 2700, cooldownMult: 1.3, dmg: 3, pellets: 1, spread: 0, effect: 'knockbackHit', desc: 'Zware aardstaf. Elke kogel stampt de geraakte bot naar achteren. Druk op E voor een aardschok om je heen die bots beschadigt, wegstoot en heel even verlamt.' },
  { id: 'rootrifle',      name: 'Wortelgeweer',  price: 2700, cooldownMult: 1.0, dmg: 2, pellets: 1, spread: 0, effect: 'rootDragKill', desc: `Elke kogel doet gewone schade. Bij een kill schiet een boomwortel uit de grond omhoog en sleurt de dichtstbijzijnde bot (binnen ${ROOT_DRAG_RANGE}px, geen bosses) meteen de aarde in.` },
  { id: 'coreblaster', name: 'Kernblaster', coreOnly: true, corePrice: 58, cooldownMult: 0.9, dmg: 4, pellets: 1, spread: 0, effect: 'chainLightning', desc: 'Elemental Cores-exclusief (Kern-winkel). Zware kern-energie kogels met hoge schade die bij een treffer overspringen naar een nabije bot.' }
];

// ---- Wapenskins: per speciaal wapen één alternatieve kogelkleur, los van je personage-skin, met munten te koop ----
let ownedWeaponSkins = JSON.parse(localStorage.getItem('botShooterOwnedWeaponSkins') || '[]');
let equippedWeaponSkins = JSON.parse(localStorage.getItem('botShooterEquippedWeaponSkins') || '{}'); // weaponId -> skinId
const WEAPON_SKINS = [
  { id: 'cryorifle_neon',     weaponId: 'cryorifle',    name: 'Neon Cryo',        price: 350, color: '#00e5ff', coreColor: '#ffffff' },
  { id: 'vampcannon_blood',   weaponId: 'vampcannon',   name: 'Bloedkanon',       price: 350, color: '#ff0044', coreColor: '#330008' },
  { id: 'voltcaster_arc',     weaponId: 'voltcaster',   name: 'Paarse Boog',      price: 350, color: '#b026ff', coreColor: '#fff066' },
  { id: 'singularity_void',   weaponId: 'singularity',  name: 'Duister Vacuüm',   price: 400, color: '#4b0082', coreColor: '#000000' },
  { id: 'stickybomb_radio',   weaponId: 'stickybomb',   name: 'Radioactief',      price: 400, color: '#39ff14', coreColor: '#003300' },
  { id: 'toxiccannon_venom',  weaponId: 'toxiccannon',  name: 'Giftig Groen',     price: 350, color: '#7fff00', coreColor: '#1a3300' },
  { id: 'executioner_gold',   weaponId: 'executioner',  name: 'Bloedgoud',        price: 450, color: '#ffd700', coreColor: '#4a0000' },
  { id: 'momentum_ember',     weaponId: 'momentum',     name: 'Vurige Momentum',  price: 400, color: '#ff6600', coreColor: '#ffffff' },
  { id: 'magmacannon_frost',  weaponId: 'magmacannon',  name: 'Vrieskanon',       price: 400, color: '#00ccff', coreColor: '#ffffff' },
  { id: 'hurricanestaff_storm', weaponId: 'hurricanestaff', name: 'Stormpaars',   price: 400, color: '#8a2be2', coreColor: '#ffffff' },
  { id: 'frostlance_ember',   weaponId: 'frostlance',   name: 'Vurige Lans',      price: 400, color: '#ff4500', coreColor: '#fff275' },
  { id: 'earthhammer_crystal', weaponId: 'earthhammer', name: 'Kristalhamer',     price: 400, color: '#00e5ff', coreColor: '#ffffff' },
  { id: 'rootrifle_autumn',   weaponId: 'rootrifle',    name: 'Herfstwortel',     price: 400, color: '#ff8c00', coreColor: '#4a2f18' },
  { id: 'coreblaster_prism',  weaponId: 'coreblaster',  name: 'Prisma Kern',      price: 500, color: '#ff00ff', coreColor: '#00ffff' }
];

// ---- Death Animations: koop een eigen animatie die afspeelt op het moment dat je doodgaat ----
let ownedDeathAnimations = JSON.parse(localStorage.getItem('botShooterOwnedDeathAnimations') || '["default"]');
let equippedDeathAnimation = localStorage.getItem('botShooterEquippedDeathAnimation') || 'default';
const DEATH_ANIM_DURATION = 2600;
const DEATH_ANIMATIONS = [
  { id: 'default',      name: 'Standaard',        price: 2200, desc: 'Geen enkel effect — je verdwijnt gewoon direct, zonder animatie.' },
  { id: 'explosion',     name: 'Explosie',         price: 2350, desc: 'Je gaat uit elkaar in een felle, uitdijende explosie van vuur, een schokgolfring en wegvliegende vonken.' },
  { id: 'disintegrate',  name: 'Uiteenvallen',     price: 2400, desc: 'Je lichaam trilt even op, dan vallen er 14 blokjes met een sporend spoor alle kanten op uiteen.' },
  { id: 'fireworks',     name: 'Vuurwerk',         price: 2500, desc: 'Er gaan 6 kleurrijke vuurwerk-bursts achter elkaar af, elk met stralen en een dovende ring.' },
  { id: 'ghost',         name: 'Spookverschijning', price: 2400, desc: 'Je vervaagt tot een doorschijnende geest die ver omhoog wegdrijft, met achterblijvende echo\'s en dwarrelende sterretjes.' },
  { id: 'implosion',     name: 'Implosie',         price: 2500, desc: 'Een oplaadende gloeiring, dan klap je razendsnel in tot een punt, gevolgd door een felle flits met meerdere schokgolven.' },
  { id: 'lightning',     name: 'Blikseminslag',    price: 1800, desc: 'Meerdere flikkerende bliksemschichten slaan achter elkaar op je neer, met een felle flits bij elke inslag.' },
  { id: 'blackhole',     name: 'Zwart Gat',        price: 1900, desc: 'Een kolkende, alles verzwelgende vortex zuigt je met ronddraaiende deeltjes naar binnen, gevolgd door een korte flits.' },
  { id: 'petrify',       name: 'Verstening',       price: 1800, desc: 'Je verandert in steen, barst dan open en valt in stukken uiteen die naar beneden vallen.' },
  { id: 'freezeshatter', name: 'Bevriezen & Breken', price: 1850, desc: 'Je bevriest volledig tot ijs en spat daarna in scherpe, wegvliegende ijsscherven uiteen.' },
  { id: 'confetti',      name: 'Confetti',         price: 1800, desc: 'Een vrolijke uitbarsting van kleurrijke, ronddwarrelende confetti-snippers.' },
  { id: 'smoke',         name: 'Rooksignaal',      price: 1800, desc: 'Je lost op in een kolkende pluim donkere rook die langzaam omhoog optrekt en vervaagt.' },
  { id: 'portal',        name: 'Portaal',          price: 1900, desc: 'Een ronddraaiend portaal opent zich en zuigt je krimpend naar binnen tot je verdwenen bent.' },
  { id: 'lavamelt',      name: 'Smelten',          price: 1850, desc: 'Je smelt weg tot een gloeiende plas lava die langzaam uitdooft.' },
  { id: 'starburst',     name: 'Sterexplosie',     price: 1850, desc: 'Je verandert in een felle, ronddraaiende ster die krimpt en een sprankelend spoor achterlaat.' },
  { id: 'glitch',        name: 'Glitch',           price: 1850, desc: 'Je lichaam valt uiteen in flikkerende, kleur-gesplitste digitale reepjes vol pixel-ruis.' },
  { id: 'butterflies',   name: 'Vlinders',         price: 1900, desc: 'Je lost op in een zwerm fladderende vlindertjes die alle kanten op wegvliegen.' },
  { id: 'timewarp',      name: 'Tijdvervorming',   price: 1900, desc: 'Ronddraaiende ringen vervormen en rekken je uit voordat je in een flits verdwijnt.' },
  { id: 'sand',          name: 'Zandkorrels',      price: 1800, desc: 'Je valt uiteen in duizenden zandkorrels die zijwaarts wegwaaien.' },
  { id: 'rainbow',       name: 'Regenboogspoor',   price: 1850, desc: 'Je tolt razendsnel rond en laat een kleurrijk regenboogspoor na voordat je vervaagt.' },
  { id: 'void',          name: 'Leegte',           price: 1900, desc: 'Een groeiende duistere leegte verzwelgt je van binnenuit naar buiten toe, tegenovergesteld aan een explosie.' }
];

// ---- Trails: bewegingsspoor los van je skin, laat een spoor van deeltjes achter je vallen terwijl je beweegt ----
let ownedTrails = JSON.parse(localStorage.getItem('botShooterOwnedTrails') || '["none"]');
let equippedTrail = localStorage.getItem('botShooterEquippedTrail') || 'none';
let trailParticles = [];
const TRAILS = [
  { id: 'none',     name: 'Geen',            price: 0,    color: '#fff',    desc: 'Geen bewegingsspoor.' },
  { id: 'fire',     name: 'Vuurspoor',       price: 2500, color: '#ff6a00', desc: 'Laat een spoor van dovende, gloeiende vuurdeeltjes achter je vallen terwijl je beweegt.' },
  { id: 'ice',      name: 'IJsspoor',        price: 2500, color: '#8ecbff', desc: 'Laat kleine glinsterende ijskristallen achter je vallen terwijl je beweegt.' },
  { id: 'smoke',    name: 'Rookspoor',       price: 2450, color: '#777777', desc: 'Laat een kolkend, langzaam optrekkend rookspoor achter je terwijl je beweegt.' },
  { id: 'stars',    name: 'Sterrenspoor',    price: 2550, color: '#ffe066', desc: 'Laat fonkelende gouden sterretjes achter je vallen terwijl je beweegt.' },
  { id: 'electric', name: 'Bliksemspoor',    price: 2600, color: '#4cc9f0', desc: 'Laat knetterende elektrische vonken achter je vallen terwijl je beweegt.' },
  { id: 'rainbow',  name: 'Regenboogspoor',  price: 2700, color: '#ff5cf1', desc: 'Laat een kleurwisselend regenboogspoor achter je vallen terwijl je beweegt.' }
];

// ---- Menu-achtergronden: animated achtergrond voor het hoofdmenu (Wereld 1 en Wereld 2) ----
let ownedMenuBackgrounds = JSON.parse(localStorage.getItem('botShooterOwnedMenuBackgrounds') || '["none"]');
let equippedMenuBackground = localStorage.getItem('botShooterEquippedMenuBackground') || 'none';
const MENU_BACKGROUNDS = [
  { id: 'none',      name: 'Geen',          price: 0,    desc: 'Geen animatie, gewoon de standaard donkere achtergrond.' },
  { id: 'starfield', name: 'Sterrenveld',   price: 2400, desc: 'Rustig drijvende, twinkelende sterren op een diepzwarte achtergrond.' },
  { id: 'nebula',    name: 'Nevelwolk',     price: 2500, desc: 'Langzaam kolkende, kleurrijke nevelwolken die zachtjes gloeien en verschuiven.' },
  { id: 'matrix',    name: 'Codewolk',      price: 2500, desc: 'Groene digitale tekens die van boven naar beneden naar beneden vallen, als een regen van code.' },
  { id: 'lava',      name: 'Lavaveld',      price: 2550, desc: 'Pulserende, gebarsten lava met opstijgende gloeiende asdeeltjes.' },
  { id: 'aurora',    name: 'Poollicht',     price: 2600, desc: 'Golvende, kleurwisselende poollicht-banden die rustig over het scherm bewegen.' }
];

// Elementale pantsers: alleen te koop in de Wereld 2-shop
const WORLD2_ARMOR = [
  { id: 'fireshield',   name: 'Vuurschild',            price: 1700, hpBonus: 30, reduction: 0, fireResist: 0.6, desc: '+30 max HP. Brandwonden (bv. van Lavagolem/Vulkaanheer) duren 60% korter.' },
  { id: 'iceshield',    name: 'IJsschild',             price: 1700, hpBonus: 30, reduction: 0, iceResist: 0.6, desc: '+30 max HP. Bevriezingen en vertragingen door ijs (Sneeuwjager, Vriesvorst, Kristalreus) duren 60% korter.' },
  { id: 'earthplate',   name: 'Aardharnas',            price: 1800, hpBonus: 80, reduction: 0.3, desc: '+80 max HP, -30% inkomende schade. Zwaar en degelijk, net als de aarde zelf.' },
  { id: 'windcloak',    name: 'Windmantel',            price: 1750, hpBonus: 15, reduction: 0, speedBonus: 0.2, knockbackResist: 0.6, desc: '+15 max HP, +20% snelheid. Wegblaas-effecten (Windloper, Windgeweer-terugslag) zijn 60% zwakker.' },
  { id: 'fireaffinity', name: 'Vuuraffiniteit-pantser', price: 1900, hpBonus: 15, reduction: 0, fireDmgMult: 1.35, iceDmgMult: 0.7, desc: '+15 max HP. Je vuurwapens (Vlammenwerper) doen 35% meer schade, maar je ijswapens (Kristalgeweer) doen 30% minder.' },
  { id: 'iceaffinity',  name: 'IJsaffiniteit-pantser', price: 1900, hpBonus: 15, reduction: 0, iceDmgMult: 1.35, fireDmgMult: 0.7, desc: '+15 max HP. Je ijswapens (Kristalgeweer) doen 35% meer schade, maar je vuurwapens (Vlammenwerper) doen 30% minder.' },
  { id: 'meltarmor',    name: 'Smeltpantser',          price: 1850, hpBonus: 25, reduction: 0, fireResist: 0.3, iceResist: 0.3, desc: '+25 max HP. Zowel brand- als ijs-effecten duren 30% korter.' },
  { id: 'magmaskin',    name: 'Magmahuid',             price: 1950, hpBonus: 20, reduction: 0, fireResist: 0.7, regen: 2, desc: '+20 max HP. Brand-effecten duren 70% korter en je geneest passief 2 HP/sec.' },
  { id: 'permafrost',   name: 'Permafrosthuid',        price: 1950, hpBonus: 20, reduction: 0.15, iceResist: 0.7, desc: '+20 max HP, -15% schade. IJs-effecten duren 70% korter.' },
  { id: 'elementguard', name: 'Elementenwacht',        price: 2400, hpBonus: 60, reduction: 0, fireResist: 0.3, iceResist: 0.3, knockbackResist: 0.3, desc: '+60 max HP. Een beetje bestand tegen alles: vuur, ijs én wegblaas-effecten.' },
  { id: 'coreplate', name: 'Kernpantser', coreOnly: true, corePrice: 48, hpBonus: 100, reduction: 0.35, fireResist: 0.4, iceResist: 0.4, knockbackResist: 0.4, desc: 'Elemental Cores-exclusief (Kern-winkel). +100 max HP, -35% schade, en 40% weerstand tegen vuur, ijs én wegblaas-effecten tegelijk.' }
];

let practiceWeaponId = null; // overschrijft equippedWeapon tijdens een wapen-oefensessie

function getWeapon() {
  const id = practiceWeaponId || equippedWeapon;
  const w = WEAPONS.find(w => w.id === id) || SPECIAL_WEAPONS.find(w => w.id === id) || WORLD2_WEAPONS.find(w => w.id === id) || WORLD2_SPECIAL_WEAPONS.find(w => w.id === id) || WEAPONS[0];
  // Speciale wapens van de ene wereld werken niet in de andere wereld — val dan terug op het standaard pistool
  if (currentWorld === 2 && SPECIAL_WEAPONS.some(sw => sw.id === w.id)) return WEAPONS[0];
  if (currentWorld !== 2 && WORLD2_SPECIAL_WEAPONS.some(sw => sw.id === w.id)) return WEAPONS[0];
  return w;
}
function getArmor() {
  const a = ARMOR.find(a => a.id === equippedArmor) || WORLD2_ARMOR.find(a => a.id === equippedArmor) || ARMOR[0];
  // Pantsers van de ene wereld werken niet in de andere wereld, net als speciale wapens — val dan terug op geen pantser
  if (currentWorld === 2 && a.id !== 'none' && ARMOR.some(x => x.id === a.id)) return ARMOR[0];
  if (currentWorld !== 2 && WORLD2_ARMOR.some(x => x.id === a.id)) return ARMOR[0];
  return a;
}
function getArmor2() {
  const a = ARMOR.find(a => a.id === equippedArmor2) || WORLD2_ARMOR.find(a => a.id === equippedArmor2) || ARMOR[0];
  if (currentWorld === 2 && a.id !== 'none' && ARMOR.some(x => x.id === a.id)) return ARMOR[0];
  if (currentWorld !== 2 && WORLD2_ARMOR.some(x => x.id === a.id)) return ARMOR[0];
  return a;
}

// Gecombineerde stats van beide pantser-slots (2e slot telt alleen mee als de 2e-slot-upgrade van de huidige wereld is gekocht)
function getArmorStats() {
  const a1 = getArmor();
  const dualArmorOwned = currentWorld === 2 ? hasDualArmor2 : hasDualArmor;
  const a2 = dualArmorOwned ? getArmor2() : ARMOR[0];
  return {
    hpBonus: a1.hpBonus + a2.hpBonus,
    reduction: 1 - (1 - (a1.reduction || 0)) * (1 - (a2.reduction || 0)),
    regen: (a1.regen || 0) + (a2.regen || 0) + w2Lvl(lvlCoreRegen) * CORE_REGEN_PER_LEVEL,
    thorns: (a1.thorns || 0) + (a2.thorns || 0),
    vampireHeal: (a1.vampireHeal || 0) + (a2.vampireHeal || 0) + w2Lvl(lvlCoreVampire) * CORE_VAMPIRE_PER_LEVEL,
    coinMult: (a1.coinMult || 1) * (a2.coinMult || 1),
    adrenaline: !!(a1.adrenaline || a2.adrenaline),
    reflection: (a1.reflection || 0) + (a2.reflection || 0),
    speedBonus: (a1.speedBonus || 0) + (a2.speedBonus || 0) + w2Lvl(lvlCoreSpeed) * CORE_SPEED_PER_LEVEL,
    poisonReflect: !!(a1.poisonReflect || a2.poisonReflect),
    freezeReflect: !!(a1.freezeReflect || a2.freezeReflect),
    fireResist: 1 - (1 - (a1.fireResist || 0)) * (1 - (a2.fireResist || 0)) * (1 - w2Lvl(lvl2FireCore) * FIRECORE_RESIST_PER_LEVEL),
    iceResist: 1 - (1 - (a1.iceResist || 0)) * (1 - (a2.iceResist || 0)) * (1 - w2Lvl(lvl2FrostBlood) * FROSTBLOOD_RESIST_PER_LEVEL),
    fireDmgMult: (a1.fireDmgMult || 1) * (a2.fireDmgMult || 1),
    iceDmgMult: (a1.iceDmgMult || 1) * (a2.iceDmgMult || 1),
    knockbackResist: 1 - (1 - (a1.knockbackResist || 0)) * (1 - (a2.knockbackResist || 0)) * (1 - w2Lvl(lvl2Steadfast) * STEADFAST_RESIST_PER_LEVEL)
  };
}

