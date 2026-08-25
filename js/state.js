// ---- Game state ----
let bullets = [];
let bots = [];
let particles = [];
let powerups = [];
let explosions = [];
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
  { id: 'sandstorm', name: '🌪 Zandstorm', desc: 'Een zandstorm trekt over het veld: 14 sec lang beperkt zicht (donkere waas rond je) en 30% minder bewegingssnelheid.' },
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
let gameOver = false;
let isPaused = false;
let gameStarted = false;
let gameMode = 'endless'; // 'endless' or 'levels'
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
const SKIN_PRICE = 500;
const SKIN_PRICE_MID = 600;
const SKIN_PRICE_HIGH = 800;
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
  { id: 'samurai',    name: 'Samurai',       price: 550,             desc: 'Japanse krijger met rood-zwart gewaad en een gloeiend zwaard.' },
  { id: 'cyborg',     name: 'Cyborg',        price: 650,             desc: 'Futuristische krijger met mechanische onderdelen en neon-accenten.' },
  { id: 'vampire',    name: 'Vampier',       price: 600,             desc: 'Spookachtige vampier met zwarte cape en rode ogen.' },
  { id: 'ghost',      name: 'Geest',         price: 550,             desc: 'Wit spookachtig figuur dat doorschijnend gloeit.' },
  { id: 'neon',       name: 'Neon Punk',     price: 650,             desc: 'Gloeiend cyberpunk-look met felle kleuren en geometrische vormen.' },
  { id: 'clown',      name: 'Clown',         price: 600,             desc: 'Kleurig circuskarakter met grote neus en grappige uiterlijk.' },
  { id: 'monster',    name: 'Monster',       price: 550,             desc: 'Griezelig groen monster met bobbels en tanden.' },
  { id: 'angel',      name: 'Engel',         price: 700,             desc: 'Hemels karakter met gloeiende witte vleugels en aureool.' },
  { id: 'demon',      name: 'Demon',         price: 700,             desc: 'Duiveachtig karakter met hoorns, staart en vlammen.' },
  { id: 'robot_simple', name: 'Blok-robot',  price: 600,             desc: 'Simpele blocky robot van zilver met kleurrijke antennes.' },
  { id: 'gemstone',   name: 'Edelsteen',     price: 750,             desc: 'Kristallig diamant-achtig lichaam dat schittert en gloeit.' },
  { id: 'mushroom',   name: 'Paddestoel',    price: 550,             desc: 'Grote felgekleurde paddestoel met stippen op het kapje.' },
  { id: 'pumpkin',    name: 'Pompoen',       price: 600,             desc: 'Halloween-pompoen met gloeiende ogen en een grappig gezicht.' },
  { id: 'mummy',      name: 'Momie',         price: 650,             desc: 'Oude momie gewikkeld in crèmekleurig linnen met gloeiende ogen.' },
  { id: 'werewolf',   name: 'Weerwolf',      price: 700,             desc: 'Behaard beest-karakter met scherpe nagels en gele ogen.' },
  { id: 'panda',      name: 'Panda',         price: 550,             desc: 'Schattige panda met zwart-witte vacht en ronde oortjes.' },
  { id: 'unicorn',    name: 'Eenhoorn',      price: 750,             desc: 'Wit fabeldier met een glinsterende regenboog-hoorn en manen.' },
  { id: 'shark',      name: 'Haai',          price: 650,             desc: 'Grijze roofvis met een scherpe vin en rijen puntige tanden.' },
  { id: 'frankenstein', name: 'Frankenstein', price: 650,            desc: 'Groen monster met hechtingen, bouten in de nek en een platte schedel.' },
  { id: 'cactus',     name: 'Cactus',        price: 550,             desc: 'Vrolijke woestijncactus met stekels en een kleine bloem.' },
  { id: 'snowman',    name: 'Sneeuwpop',     price: 550,             desc: 'Ronde sneeuwpop met een wortelneus en kolen-ogen.' },
  { id: 'discoball',  name: 'Discobal',      price: 700,             desc: 'Glinsterende spiegelbal die van kleur wisselt op de maat van de muziek.' },
  { id: 'turtle',     name: 'Schildpad',     price: 600,             desc: 'Groene schildpad met een stevig gestreept pantser.' },
  { id: 'jester',     name: 'Hofnar',        price: 650,             desc: 'Kleurrijke hofnar met een bellenmuts in paars en goud.' },
  { id: 'cyclops',    name: 'Cycloop',       price: 700,             desc: 'Paars eenogig monster met een groot gloeiend oog.' },
  { id: 'combofire',  name: 'Infernische Combo', price: 900,          desc: 'Een dovende ember-kern die feller ontbrandt en een groeiende vuuraura krijgt naarmate je killstreak oploopt.', killstreak: true },
  { id: 'combofrost', name: 'Vrieskristal Combo', price: 900,         desc: 'Een dof ijskristal dat steeds feller gaat gloeien en scherpere kristalpunten krijgt bij een oplopende killstreak.', killstreak: true },
  { id: 'combovolt',  name: 'Voltaïsche Combo', price: 900,           desc: 'Een gedimde energiekern die steeds meer knetterende bliksemboogjes om zich heen krijgt naarmate je killstreak stijgt.', killstreak: true },
  { id: 'neonpink',   name: 'Neon Roze',     price: 650,              desc: 'Zwarte kern met een felle, pulserende roze neonring en kruisende lichtstrepen.' },
  { id: 'neoncyan',   name: 'Neon Cyaan',    price: 650,              desc: 'Zwarte kern met een gloeiende cyaan neon-zeshoek erop getekend.' },
  { id: 'neonlime',   name: 'Neon Limoen',   price: 650,              desc: 'Zwarte kern met felgroene, pulserende neon-chevrons.' },
  { id: 'comboneonpink', name: 'Neon Roze Combo', price: 900,         desc: 'Een gedimde kern die een felle roze neonring en een groeiend kruispatroon krijgt naarmate je killstreak oploopt.', killstreak: true },
  { id: 'comboneoncyan', name: 'Neon Cyaan Combo', price: 900,        desc: 'Een gedimde kern die een felle cyaan neon-veelhoek krijgt, met steeds meer zijden naarmate je killstreak stijgt.', killstreak: true },
  { id: 'comboneonlime', name: 'Neon Limoen Combo', price: 900,       desc: 'Een gedimde kern die feller limoengroen gaat gloeien met steeds meer neon-chevrons bij een oplopende killstreak.', killstreak: true }
];

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
  { id: 'earthform', name: 'Aardgestalte', price: 6200, desc: `Wereld 2-exclusief. Je volgende potje begin je als aardelementaal: +${EARTHFORM_BONUS_HP} max HP en een 25% grotere hitbox, maar 15% minder snelheid. Geen wapens — je laat in plaats daarvan een muur van ${EARTHFORM_WALL_COUNT} rotspieken vlak voor je uit de grond schieten die bots beschadigt en heel even vastzet. Bij overlijden word je teruggevormd tot je normale poppetje met ${TRANSFORM_REVIVE_HP} HP en je uitgeruste wapen.` },
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
  { id: 'cryorifle',   name: 'Cryo Rifle',        price: 1350, cooldownMult: 0.95, dmg: 2, pellets: 1, spread: 0, effect: 'freezeKill',     desc: 'Bij elke kill bevriest een ijsgolf alle bots in de buurt 2 sec.' },
  { id: 'vampcannon',  name: 'Vamp Cannon',       price: 1300, cooldownMult: 1.2,  dmg: 2, pellets: 1, spread: 0, effect: 'lifestealKill',  desc: 'Elke kill geneest je direct 3 HP.' },
  { id: 'voltcaster',  name: 'Volt Caster',       price: 1500, cooldownMult: 1,    dmg: 2, pellets: 1, spread: 0, effect: 'chainLightning', desc: 'Elke kogel slaat over als bliksem naar een nabije bot voor extra schade.' },
  { id: 'singularity', name: 'Singularity Gun',   price: 2200, cooldownMult: 1.6,  dmg: 2, pellets: 1, spread: 0, effect: 'blackholeKill',  desc: 'Elke kill opent een kolkend zwart gat dat bots naar binnen zuigt, geleidelijk schade doet, en na ~1,2 sec imploderend nog een flinke schadeburst uitdeelt.' },
  { id: 'stickybomb',  name: 'Kleefbom Werper',   price: 1800, cooldownMult: 1.7,  dmg: 1, pellets: 1, spread: 0, effect: 'stickyBomb',     desc: 'Kogels blijven kleven op de bot die je raakt en ontploffen na een korte waarschuwing (rode telegraph-cirkel) met een grote explosie.' },
  { id: 'toxiccannon', name: 'Toxic Cannon',      price: 1900, cooldownMult: 1.1,  dmg: 1, pellets: 1, spread: 0, effect: 'poison',         desc: 'Vergiftigt bots met schade-over-tijd, en verspreidt het gif automatisch naar bots in de buurt zodra een vergiftigde bot sterft.' },
  { id: 'executioner', name: 'Executioner Rifle', price: 2000, cooldownMult: 1.3,  dmg: 2, pellets: 1, spread: 0, effect: 'execute',        desc: 'Maakt bots die onder 25% HP zitten altijd direct af, ongeacht hun resterende HP — perfect om net-niet-dode bots snel op te ruimen.' },
  { id: 'momentum',    name: 'Momentum Blade',    price: 2100, cooldownMult: 0.8,  dmg: 1, pellets: 1, spread: 0, effect: 'killstreak',     desc: 'Bouwt een killstreak op (zichtbaar in de HUD) die je schade tot +150% verhoogt bij 10 kills op rij, maar reset als je 2,5 sec geen kill maakt.' }
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
  { id: 'rootrifle',      name: 'Wortelgeweer',  price: 2700, cooldownMult: 1.0, dmg: 2, pellets: 1, spread: 0, effect: 'rootDragKill', desc: `Elke kogel doet gewone schade. Bij een kill schiet een boomwortel uit de grond omhoog en sleurt de dichtstbijzijnde bot (binnen ${ROOT_DRAG_RANGE}px, geen bosses) meteen de aarde in.` }
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
  { id: 'elementguard', name: 'Elementenwacht',        price: 2400, hpBonus: 60, reduction: 0, fireResist: 0.3, iceResist: 0.3, knockbackResist: 0.3, desc: '+60 max HP. Een beetje bestand tegen alles: vuur, ijs én wegblaas-effecten.' }
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
function getArmor() { return ARMOR.find(a => a.id === equippedArmor) || WORLD2_ARMOR.find(a => a.id === equippedArmor) || ARMOR[0]; }
function getArmor2() { return ARMOR.find(a => a.id === equippedArmor2) || WORLD2_ARMOR.find(a => a.id === equippedArmor2) || ARMOR[0]; }

// Gecombineerde stats van beide pantser-slots (2e slot telt alleen mee als hasDualArmor is gekocht)
function getArmorStats() {
  const a1 = getArmor();
  const a2 = hasDualArmor ? getArmor2() : ARMOR[0];
  return {
    hpBonus: a1.hpBonus + a2.hpBonus,
    reduction: 1 - (1 - (a1.reduction || 0)) * (1 - (a2.reduction || 0)),
    regen: (a1.regen || 0) + (a2.regen || 0),
    thorns: (a1.thorns || 0) + (a2.thorns || 0),
    vampireHeal: (a1.vampireHeal || 0) + (a2.vampireHeal || 0),
    coinMult: (a1.coinMult || 1) * (a2.coinMult || 1),
    adrenaline: !!(a1.adrenaline || a2.adrenaline),
    reflection: (a1.reflection || 0) + (a2.reflection || 0),
    speedBonus: (a1.speedBonus || 0) + (a2.speedBonus || 0),
    poisonReflect: !!(a1.poisonReflect || a2.poisonReflect),
    freezeReflect: !!(a1.freezeReflect || a2.freezeReflect),
    fireResist: 1 - (1 - (a1.fireResist || 0)) * (1 - (a2.fireResist || 0)),
    iceResist: 1 - (1 - (a1.iceResist || 0)) * (1 - (a2.iceResist || 0)),
    fireDmgMult: (a1.fireDmgMult || 1) * (a2.fireDmgMult || 1),
    iceDmgMult: (a1.iceDmgMult || 1) * (a2.iceDmgMult || 1),
    knockbackResist: 1 - (1 - (a1.knockbackResist || 0)) * (1 - (a2.knockbackResist || 0))
  };
}

