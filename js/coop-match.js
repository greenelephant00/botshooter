// ---- 2-Speler Co-op: het daadwerkelijke gedeelde potje (fase 2, bouwt voort op de lobby uit coop.js) ----
// Architectuur: host-gezaghebbend. De host draait de hele simulatie (spelers bewegen, bots spawnen en
// vallen aan, botsingen, schade) lokaal, met meerdere spelers tegelijk. Gasten sturen alleen hun invoer
// (bewegingsrichting, mikhoek, schiet-ja/nee) naar de host via Firestore, en tekenen op hun eigen scherm
// simpelweg wat de host terugstuurt.
//
// Om bots er ECHT hetzelfde uit te laten zien als in single-player, hergebruikt dit bestand de bestaande
// BOT_TYPES-data (player.js) en de bestaande drawBot()-tekenfunctie (render.js) rechtstreeks, in plaats
// van een eigen tekenstijl te verzinnen. Dat vereist wel hetzelfde canvas als single-player (drawBot
// tekent altijd naar de globale `ctx`) — daarom tekent Co-op op #gameCanvas zelf, en wordt de gewone
// single-player teken-/update-lus tijdelijk overgeslagen via de coopMatchActive-vlag (zie de
// eenregelige checks bovenaan draw() in render.js en update() in update.js).
//
// De aanval-PATRONEN van elke bot (mortier, gifwolk, gravity well, enz.) zijn NIET overgenomen — elke
// bot valt hier aan volgens één van vier simpele gedragingen (melee/zelfmoord/stilstaand-schieten/
// afstand-houden-en-schieten) gebaseerd op zijn `pattern`-veld. Dat is bewust nog een vereenvoudiging;
// de bots ZIEN er wel al echt uit en de basis-roster (grunt t/m splitter) is de echte data.
//
// Spelers tekenen nu met hun eigen echte uitgeruste skin (drawPlayerSkin), en vechten met hun eigen
// wapen (schade/vuursnelheid/pellets/spreiding) en pantser (HP-bonus + schadereductie) — elke speler
// leest dit lokaal van zijn eigen account en meldt het aan de host (zie coopReadLocalLoadout()).
// Een deel van de speciale-wapen-effecten is ook geïmplementeerd (zie COOP_SUPPORTED_EFFECTS):
// bevriezen bij kill, lifesteal bij kill, kettingbliksem, direct executeren onder 25% HP, gif,
// brand, kleine schok-splash+bevriezen, terugstoot, en killstreak-schaalschade. Niet ondersteund:
// zwart gat (Singularity Gun), kleefbom, windduw, wortelsleur — die vallen terug op kale schade
// zonder effect.
//
// Bots laten bij het sterven kans op een munt vallen (echte munten, worden bijgeschreven op je eigen
// account) en er spawnen periodiek 3 simpele powerups: schild (🛡️ tijdelijk onkwetsbaar), snelheid
// (⚡ tijdelijk sneller) en heal (❤️ direct HP terug).
//
// Een deel van de gekochte UPGRADES telt nu ook mee (zie coopReadLocalUpgrades()): Extra HP, Sprint,
// Snel Herladen, Critical Hit, Iron Skin, Revive (1x per potje), Coin Rain, en de Wereld 2 Kern-
// upgrades (Kernschade, Kernsnelheid, Kernregeneratie, Kernvampirisme), plus Shockwave en Overkill
// (schade-splash bij een kill). Lucky Drop is niet meegenomen (verkort in single-player alleen het
// powerup-spawn-interval, en Co-op heeft al een eigen vaste powerup-timer). Multi-Shield, Splinter-
// schoten, Sharpshooter, Second Wind, Flying Start, Piercing Rounds, Bloodlust en Core Shield/Aura/
// Shock zitten er ook nog niet in.
//
// Overige bekende beperkingen van deze versie:
// - Alleen het skin-LICHAAM wordt getekend, geen wapen-in-hand, transformaties of dood-animaties.
// - Alleen toetsenbord+muis, geen touch-besturing.
// - Geen client-side prediction: je eigen bewegingen op een gast-scherm voelen iets vertraagd.
// - De bevriezings-visual op een GAST-scherm kan soms net niet kloppen (elke browser heeft zijn eigen
//   interne klok voor animatie-timing) — de daadwerkelijke bevriezing (bot staat stil) is wel altijd
//   correct, want die wordt volledig door de host bepaald.

const COOP_ARENA_MARGIN = 20;
const COOP_STATE_PUSH_MS = 120; // hoe vaak de host een snapshot naar Firestore schrijft
const COOP_INPUT_PUSH_MS = 100; // hoe vaak een gast zijn invoer naar Firestore schrijft
const COOP_PLAYER_R = 18;
const COOP_PLAYER_SPEED = 4.2;
const COOP_PLAYER_MAX_HP = 100;
const COOP_WEAPON = { dmg: 2, cooldownMs: 220, bulletSpeed: 10, bulletR: 4 }; // iedereen deelt dit simpele standaardwapen
const COOP_BOT_BULLET_DMG = 6;
const COOP_MAX_BOTS_SENT = 40;
const COOP_MAX_BULLETS_SENT = 60;
const COOP_PLAYER_COLORS = ['#4cc9f0', '#ff5cf1', '#c3e600'];
const COOP_MELEE_PATTERNS = ['melee'];
const COOP_SUICIDE_PATTERNS = ['suicide'];
const COOP_STATIONARY_PATTERNS = ['turret'];
const COOP_KEEP_DIST = 260; // hoe ver "afstand houden"-bots proberen te blijven van hun doelwit

// ---- Gedeelde toestand ----
let coopMatchActive = false;  // true zolang een co-op potje loopt — schakelt de single-player teken-/update-lus uit
let coopSim = null;           // host: de volledige, gezaghebbende simulatie
let coopRemoteState = null;   // gast: laatste ontvangen snapshot van de host
let coopRole = null;          // 'host' | 'guest' | null
let coopRafId = null;
let coopStateUnsub = null;
let coopInputsUnsub = null;
let coopInputPushTimer = null;
let coopLastTick = 0;
let coopLastStatePush = 0;
let coopMyPos = { x: 0, y: 0 }; // gast: laatst bekende eigen positie, voor het bepalen van de mikhoek
let coopMyCoinsApplied = 0; // hoeveel van je eigen coopSim/coopRemoteState-coinsEarned je al aan je echte account hebt toegevoegd

const COOP_COIN_DROP_CHANCE = 0.6;
const COOP_COIN_VALUE_MIN = 1;
const COOP_COIN_VALUE_MAX = 3;
const COOP_COIN_PICKUP_R = 22;
const COOP_POWERUP_SPAWN_MS = 10000;
const COOP_POWERUP_PICKUP_R = 24;
const COOP_POWERUP_TYPES = ['shield', 'speed', 'heal'];
const COOP_POWERUP_COLORS = { shield: '#4cc9f0', speed: '#ffd60a', heal: '#4cd964' };
const COOP_POWERUP_ICONS = { shield: '🛡️', speed: '⚡', heal: '❤️' };

// Ondersteunde speciale-wapen-effecten in Co-op — niet allemaal (zwart gat, kleefbom, windduw,
// wortelsleur ontbreken nog, die zijn te complex voor deze stap en vallen terug op kale schade).
const COOP_SUPPORTED_EFFECTS = ['freezeKill', 'lifestealKill', 'chainLightning', 'execute', 'poison', 'igniteHit', 'shatterHit', 'knockbackHit', 'killstreak', 'blackholeKill'];
const COOP_BLACKHOLE_RADIUS = 150;
const COOP_BLACKHOLE_DURATION = 1200;
const COOP_BLACKHOLE_TICK_DMG = 2;
const COOP_BLACKHOLE_BURST_DMG = 14;

// getWeapon()/getArmorStats() uit state.js kijken naar `currentWorld` en negeren een Wereld
//2-wapen/pantser stil als je toevallig niet "in" Wereld 2 staat — logisch voor single-player (je kunt
// een Wereld 2-item nooit gebruiken in een Wereld 1-potje), maar Co-op is alleen vanuit het Wereld
// 1-menu te openen, dus die check zou een uitgerust Wereld 2-wapen/pantser altijd laten verdwijnen.
// Deze twee lezen daarom rechtstreeks uit alle wapen-/pantsertabellen, zonder wereld-gating.
function coopGetOwnWeapon() {
  const id = equippedWeapon;
  return WEAPONS.find(w => w.id === id) || SPECIAL_WEAPONS.find(w => w.id === id) || WORLD2_WEAPONS.find(w => w.id === id) || WORLD2_SPECIAL_WEAPONS.find(w => w.id === id) || WEAPONS[0];
}
function coopGetOwnArmorPiece(id) {
  return ARMOR.find(a => a.id === id) || WORLD2_ARMOR.find(a => a.id === id) || ARMOR[0];
}
function coopGetOwnArmorStats() {
  const a1 = coopGetOwnArmorPiece(equippedArmor);
  const dualOwned = hasDualArmor || hasDualArmor2; // in Co-op telt de 2e-slot-upgrade van beide werelden mee
  const a2 = dualOwned ? coopGetOwnArmorPiece(equippedArmor2) : ARMOR[0];
  return {
    hpBonus: a1.hpBonus + a2.hpBonus,
    reduction: 1 - (1 - (a1.reduction || 0)) * (1 - (a2.reduction || 0))
  };
}

// Elke speler leest zíjn eigen uitgeruste wapen/pantser lokaal (het account waarmee je bent
// ingelogd op DIT apparaat) en meldt de resulterende statistieken — de host kan onmogelijk weten wat
// een gast heeft uitgerust, dus dat moet elke speler zelf doorgeven.
// Upgrades (winkel "Upgrades" + Wereld 2 Kern-winkel) — gelezen los van currentWorld (zelfde reden als
// coopGetOwnWeapon/coopGetOwnArmorStats hierboven), en bonussen uit Wereld 1- én Wereld 2-bomen worden
// gewoon bij elkaar opgeteld. Lucky Drop is hier niet in verwerkt (verkort in single-player alleen het
// powerup-spawn-interval, en Co-op heeft al een eigen, vaste powerup-timer).
function coopReadLocalUpgrades() {
  const critChance = lvlCriticalHit > 0 ? CRITICAL_HIT_CHANCES[lvlCriticalHit - 1] : (lvl2CriticalHit > 0 ? CRITICALHIT2_CHANCES[lvl2CriticalHit - 1] : 0);
  const ironSkinReduction = lvlIronSkin > 0 ? IRON_SKIN_REDUCTIONS[lvlIronSkin - 1] : (lvl2IronSkin > 0 ? IRONSKIN2_REDUCTIONS[lvl2IronSkin - 1] : 0);
  const coinRainBonus = (lvlCoinRain > 0 ? COIN_RAIN_BONUSES[lvlCoinRain - 1] : 0) + (lvl2CoinRain > 0 ? COINRAIN2_BONUSES[lvl2CoinRain - 1] : 0);
  return {
    extraHpBonus: (lvlExtraHp || 0) * EXTRA_HP_PER_LEVEL + (lvl2ExtraHp || 0) * EXTRAHP2_PER_LEVEL,
    reloadMult: 1 - (lvlFastReload || 0) * FAST_RELOAD_PER_LEVEL - (lvl2FastReload || 0) * FASTRELOAD2_PER_LEVEL,
    speedMult: (1 + (lvlSprint || 0) * SPRINT_PER_LEVEL) * (1 + (lvlCoreSpeed || 0) * CORE_SPEED_PER_LEVEL),
    coreDamageMult: 1 + (lvlCoreDamage || 0) * CORE_DAMAGE_PER_LEVEL,
    critChance, ironSkinReduction, coinRainBonus,
    hasRevive: !!(hasRevive || hasRevive2),
    coreRegenPerSec: (lvlCoreRegen || 0) * CORE_REGEN_PER_LEVEL,
    coreVampireHeal: (lvlCoreVampire || 0) * CORE_VAMPIRE_PER_LEVEL,
    overkillLevel: Math.max(lvlOverkill || 0, lvl2Overkill || 0),
    shockwaveLevel: lvlShockwave || 0
  };
}

function coopReadLocalLoadout() {
  const weapon = coopGetOwnWeapon();
  const armor = coopGetOwnArmorStats();
  const up = coopReadLocalUpgrades();
  return {
    weaponDmg: weapon.dmg * up.coreDamageMult,
    weaponCooldownMs: shootCooldown * weapon.cooldownMult * up.reloadMult,
    weaponBulletSpeed: COOP_WEAPON.bulletSpeed * (weapon.bulletSpeedMult || 1),
    weaponPellets: weapon.pellets || 1,
    weaponSpread: weapon.spread || 0,
    weaponEffect: COOP_SUPPORTED_EFFECTS.includes(weapon.effect) ? weapon.effect : null,
    armorHpBonus: (armor.hpBonus || 0) + up.extraHpBonus,
    armorReduction: 1 - (1 - (armor.reduction || 0)) * (1 - up.ironSkinReduction),
    speedMult: up.speedMult,
    critChance: up.critChance,
    hasRevive: up.hasRevive,
    coinRainBonus: up.coinRainBonus,
    coreRegenPerSec: up.coreRegenPerSec,
    coreVampireHeal: up.coreVampireHeal,
    overkillLevel: up.overkillLevel,
    shockwaveLevel: up.shockwaveLevel,
    skinId: getSkin()
  };
}

// Zet gerapporteerde wapen/pantser-waarden op een simulatie-speler. Bij een NIEUWE (of gewijzigde)
// pantser-HP-bonus wordt zowel max-HP als huidige HP met hetzelfde bedrag opgehoogd, zodat een speler
// niet plotseling een deel van zijn nieuwe max-HP als "ontbrekend" ziet zodra dit voor het eerst
// binnenkomt.
function coopApplyLoadoutToPlayer(p, loadout) {
  if (typeof loadout.weaponDmg === 'number') p.weaponDmg = loadout.weaponDmg;
  if (typeof loadout.weaponCooldownMs === 'number') p.weaponCooldownMs = loadout.weaponCooldownMs;
  if (typeof loadout.weaponBulletSpeed === 'number') p.weaponBulletSpeed = loadout.weaponBulletSpeed;
  if (typeof loadout.weaponPellets === 'number') p.weaponPellets = loadout.weaponPellets;
  if (typeof loadout.weaponSpread === 'number') p.weaponSpread = loadout.weaponSpread;
  if (loadout.weaponEffect !== undefined) p.weaponEffect = loadout.weaponEffect;
  if (loadout.skinId) p.skinId = loadout.skinId;
  if (typeof loadout.armorReduction === 'number') p.armorReduction = loadout.armorReduction;
  if (typeof loadout.armorHpBonus === 'number') {
    const newMaxHp = COOP_PLAYER_MAX_HP + loadout.armorHpBonus;
    if (newMaxHp !== p.maxHp) {
      p.hp += (newMaxHp - p.maxHp);
      p.maxHp = newMaxHp;
    }
    p.armorHpBonus = loadout.armorHpBonus;
  }
  if (typeof loadout.speedMult === 'number') p.speedMult = loadout.speedMult;
  if (typeof loadout.critChance === 'number') p.critChance = loadout.critChance;
  if (typeof loadout.hasRevive === 'boolean') p.hasRevive = loadout.hasRevive;
  if (typeof loadout.coinRainBonus === 'number') p.coinRainBonus = loadout.coinRainBonus;
  if (typeof loadout.coreRegenPerSec === 'number') p.coreRegenPerSec = loadout.coreRegenPerSec;
  if (typeof loadout.coreVampireHeal === 'number') p.coreVampireHeal = loadout.coreVampireHeal;
  if (typeof loadout.overkillLevel === 'number') p.overkillLevel = loadout.overkillLevel;
  if (typeof loadout.shockwaveLevel === 'number') p.shockwaveLevel = loadout.shockwaveLevel;
}

function coopReadLocalInput() {
  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;
  dx += joystickDX || 0;
  dy += joystickDY || 0;
  const len = Math.hypot(dx, dy) || 1;
  return { moveX: dx / len, moveY: dy / len, firing: !!(keys[' '] || keys['mouse']) };
}

// ---- Match starten (aangeroepen zodra de lobby-status 'playing' wordt) ----
function enterCoopMatchAsHost() {
  coopRole = 'host';
  coopMatchActive = true;
  coopMyCoinsApplied = 0;
  document.getElementById('coopLobbyScreen').style.display = 'none';
  document.getElementById('coopMatchScreen').style.display = 'block';
  document.getElementById('coopMatchOverlay').style.display = 'none';
  coopSim = { players: {}, bots: [], bullets: [], coins: [], powerups: [], blackholes: [], score: 0, lastBotSpawn: 0, lastPowerupSpawn: 0, nextId: 1, status: 'playing' };
  db.collection('lobbies').doc(coopLobbyCode).collection('players').get().then(snap => {
    let i = 0;
    snap.forEach(doc => {
      const uid = doc.id;
      const data = doc.data();
      coopSim.players[uid] = {
        x: COOP_ARENA_MARGIN + 100 + i * 140,
        y: canvas.height / 2,
        angle: 0, hp: COOP_PLAYER_MAX_HP, maxHp: COOP_PLAYER_MAX_HP,
        name: data.name || '?', color: COOP_PLAYER_COLORS[i % COOP_PLAYER_COLORS.length],
        alive: true, lastShot: 0,
        inputMoveX: 0, inputMoveY: 0, firing: false,
        // Eigen wapen/pantser-statistieken — worden hieronder bijgewerkt zodra de speler ze meestuurt
        // (host leest ze lokaal, gasten sturen ze mee met hun invoer). Tot dan een neutrale standaard.
        weaponDmg: COOP_WEAPON.dmg, weaponCooldownMs: COOP_WEAPON.cooldownMs, weaponBulletSpeed: COOP_WEAPON.bulletSpeed,
        weaponPellets: 1, weaponSpread: 0, weaponEffect: null, armorHpBonus: 0, armorReduction: 0,
        killStreak: 0, lastKillAt: 0, skinId: 'default',
        speedMult: 1, critChance: 0, hasRevive: false, reviveUsed: false, coinRainBonus: 0,
        coreRegenPerSec: 0, coreVampireHeal: 0, overkillLevel: 0, shockwaveLevel: 0, lastRegenTick: 0
      };
      i++;
    });
  });
  coopInputsUnsub = db.collection('lobbies').doc(coopLobbyCode).collection('inputs')
    .onSnapshot(snap => {
      snap.forEach(doc => {
        const uid = doc.id;
        if (uid === currentUid) return; // eigen invoer komt lokaal binnen, niet via Firestore
        const p = coopSim && coopSim.players[uid];
        if (!p) return;
        const data = doc.data();
        p.inputMoveX = data.moveX || 0;
        p.inputMoveY = data.moveY || 0;
        p.angle = typeof data.aimAngle === 'number' ? data.aimAngle : p.angle;
        p.firing = !!data.firing;
        coopApplyLoadoutToPlayer(p, data);
      });
    }, () => {});
  coopLastTick = performance.now();
  coopLastStatePush = 0;
  coopRafId = requestAnimationFrame(coopHostLoop);
}
window.enterCoopMatchAsHost = enterCoopMatchAsHost;

function enterCoopMatchAsGuest() {
  coopRole = 'guest';
  coopMatchActive = true;
  coopMyCoinsApplied = 0;
  document.getElementById('coopLobbyScreen').style.display = 'none';
  document.getElementById('coopMatchScreen').style.display = 'block';
  document.getElementById('coopMatchOverlay').style.display = 'none';
  coopRemoteState = null;
  coopStateUnsub = db.collection('lobbies').doc(coopLobbyCode).collection('state').doc('live')
    .onSnapshot(doc => {
      if (!doc.exists) return;
      coopRemoteState = doc.data();
      const me = coopRemoteState.players && coopRemoteState.players[currentUid];
      if (me) coopMyPos = { x: me.x, y: me.y };
      if (coopRemoteState.status === 'ended') coopShowMatchOverlay('Potje voorbij');
    }, () => {});
  coopInputPushTimer = setInterval(coopPushGuestInput, COOP_INPUT_PUSH_MS);
  coopRafId = requestAnimationFrame(coopGuestRenderLoop);
}
window.enterCoopMatchAsGuest = enterCoopMatchAsGuest;

function coopPushGuestInput() {
  if (!coopLobbyCode || !currentUid || coopRole !== 'guest') return;
  const input = coopReadLocalInput();
  const aimAngle = Math.atan2(mouse.y - coopMyPos.y, mouse.x - coopMyPos.x);
  const loadout = coopReadLocalLoadout();
  db.collection('lobbies').doc(coopLobbyCode).collection('inputs').doc(currentUid)
    .set({ moveX: input.moveX, moveY: input.moveY, aimAngle, firing: input.firing, ts: Date.now(), ...loadout })
    .catch(() => {});
}

// ---- Host-simulatie ----
function coopHostLoop(now) {
  if (!coopSim || coopRole !== 'host') return;
  const dt = Math.min(50, now - coopLastTick);
  coopLastTick = now;
  coopHostUpdate(dt, now);
  if (now - coopLastStatePush > COOP_STATE_PUSH_MS) {
    coopLastStatePush = now;
    coopPushHostState();
  }
  coopRenderFrame(coopSim);
  coopUpdateHud(coopSim);
  coopSyncMyCoins(coopSim.players[currentUid]);
  coopRafId = requestAnimationFrame(coopHostLoop);
}

function coopHostUpdate(dt, now) {
  const stepMult = dt / 16.67;

  // Eigen (host) invoer lokaal lezen — niet via Firestore, dat is alleen voor gasten nodig
  const hostP = coopSim.players[currentUid];
  if (hostP) {
    const input = coopReadLocalInput();
    hostP.inputMoveX = input.moveX;
    hostP.inputMoveY = input.moveY;
    hostP.firing = input.firing;
    hostP.angle = Math.atan2(mouse.y - hostP.y, mouse.x - hostP.x);
    coopApplyLoadoutToPlayer(hostP, coopReadLocalLoadout());
  }

  const alivePlayers = Object.values(coopSim.players).filter(p => p.alive);

  // Spelers bewegen + schieten
  Object.entries(coopSim.players).forEach(([uid, p]) => {
    if (!p.alive) return;
    const boostMult = now < (p.boostUntil || 0) ? 1.7 : 1; // Snelheid-powerup
    const totalSpeedMult = (p.speedMult || 1) * boostMult; // Sprint/Kernsnelheid-upgrades x powerup
    p.x += p.inputMoveX * COOP_PLAYER_SPEED * totalSpeedMult * stepMult;
    p.y += p.inputMoveY * COOP_PLAYER_SPEED * totalSpeedMult * stepMult;
    p.x = Math.max(COOP_ARENA_MARGIN + COOP_PLAYER_R, Math.min(canvas.width - COOP_ARENA_MARGIN - COOP_PLAYER_R, p.x));
    p.y = Math.max(COOP_ARENA_MARGIN + COOP_PLAYER_R, Math.min(canvas.height - COOP_ARENA_MARGIN - COOP_PLAYER_R, p.y));
    if (now - p.lastKillAt > 2500) p.killStreak = 0; // killstreak (Momentum Blade) vervalt na 2,5 sec zonder kill
    // Kern-regeneratie: passieve HP-genezing per seconde
    if (p.coreRegenPerSec > 0 && now - (p.lastRegenTick || 0) > 1000) {
      p.lastRegenTick = now;
      p.hp = Math.min(p.maxHp, p.hp + p.coreRegenPerSec);
    }
    if (p.firing && now - p.lastShot > p.weaponCooldownMs) {
      p.lastShot = now;
      const pellets = Math.max(1, p.weaponPellets || 1);
      const streakMult = p.weaponEffect === 'killstreak' ? 1 + Math.min(p.killStreak, 10) * 0.15 : 1;
      const isCrit = Math.random() < (p.critChance || 0);
      const critMult = isCrit ? 2 : 1;
      for (let i = 0; i < pellets; i++) {
        // Meerdere pellets (bv. shotgun) waaieren symmetrisch rond de mikrichting uit, net als single-player
        const spreadOffset = pellets === 1 ? 0 : (p.weaponSpread || 0) * (i / (pellets - 1) - 0.5);
        const shotAngle = p.angle + spreadOffset;
        coopSim.bullets.push({
          id: coopSim.nextId++, owner: 'player', ownerUid: uid,
          x: p.x + Math.cos(shotAngle) * (COOP_PLAYER_R + 6), y: p.y + Math.sin(shotAngle) * (COOP_PLAYER_R + 6),
          vx: Math.cos(shotAngle) * p.weaponBulletSpeed, vy: Math.sin(shotAngle) * p.weaponBulletSpeed,
          r: COOP_WEAPON.bulletR, dmg: Math.round(p.weaponDmg * streakMult * critMult), color: p.color, effect: p.weaponEffect
        });
      }
    }
  });

  // Bots spawnen — uit de ECHTE BOT_TYPES-roster (player.js), zodat ze er straks ook echt zo uitzien
  const spawnInterval = Math.max(500, 1100 - coopSim.score * 2);
  if (now - coopSim.lastBotSpawn > spawnInterval && coopSim.bots.length < 25) {
    coopSim.lastBotSpawn = now;
    coopSpawnBot();
  }

  // Powerups spawnen
  if (now - coopSim.lastPowerupSpawn > COOP_POWERUP_SPAWN_MS) {
    coopSim.lastPowerupSpawn = now;
    coopSpawnPowerup();
  }

  // Munten en powerups oppakken
  alivePlayers.forEach(p => {
    coopSim.coins.forEach(c => {
      if (c.collected) return;
      if (Math.hypot(p.x - c.x, p.y - c.y) < COOP_COIN_PICKUP_R) {
        c.collected = true;
        p.coinsEarned = (p.coinsEarned || 0) + c.value + (p.coinRainBonus || 0); // Coin Rain-upgrade: vaste bonus bovenop elke munt
      }
    });
    coopSim.powerups.forEach(pu => {
      if (pu.collected) return;
      if (Math.hypot(p.x - pu.x, p.y - pu.y) < COOP_POWERUP_PICKUP_R) {
        pu.collected = true;
        if (pu.type === 'shield') p.shieldUntil = now + 4000;
        else if (pu.type === 'speed') p.boostUntil = now + 5000;
        else if (pu.type === 'heal') p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.4);
      }
    });
  });
  coopSim.coins = coopSim.coins.filter(c => !c.collected);
  coopSim.powerups = coopSim.powerups.filter(pu => !pu.collected);

  // Zwarte gaten (Singularity Gun): zuigen bots naar binnen, doen geleidelijk schade, en imploderen
  // na COOP_BLACKHOLE_DURATION met een flinke schadeburst
  coopSim.blackholes.forEach(bh => {
    const age = now - bh.born;
    if (age > COOP_BLACKHOLE_DURATION) {
      coopSim.bots.forEach(bot => {
        if (bot.dead) return;
        if (Math.hypot(bot.x - bh.x, bot.y - bh.y) < COOP_BLACKHOLE_RADIUS) {
          bot.hp -= COOP_BLACKHOLE_BURST_DMG;
          if (bot.hp <= 0) coopKillBot(bot);
        }
      });
      bh.expired = true;
      return;
    }
    if (now - bh.lastTick > 200) {
      bh.lastTick = now;
      coopSim.bots.forEach(bot => {
        if (bot.dead) return;
        const d = Math.hypot(bot.x - bh.x, bot.y - bh.y);
        if (d < COOP_BLACKHOLE_RADIUS) {
          if (d > 10) { bot.x += (bh.x - bot.x) / d * 8; bot.y += (bh.y - bot.y) / d * 8; }
          bot.hp -= COOP_BLACKHOLE_TICK_DMG;
          if (bot.hp <= 0) coopKillBot(bot);
        }
      });
    }
  });
  coopSim.blackholes = coopSim.blackholes.filter(bh => !bh.expired);

  // Gif/brand-schade-over-tijd (Toxic Cannon / Vlammenwerper e.a.) — apart van de aanval-AI hieronder
  coopSim.bots.forEach(bot => {
    if (bot.dead) return;
    if (bot.poisonUntil && now < bot.poisonUntil && now - (bot.lastPoisonTick || 0) > 400) {
      bot.lastPoisonTick = now;
      bot.hp -= 1;
      if (bot.hp <= 0) coopKillBot(bot);
    }
    if (!bot.dead && bot.igniteUntil && now < bot.igniteUntil && now - (bot.lastIgniteTick || 0) > 400) {
      bot.lastIgniteTick = now;
      bot.hp -= 2;
      if (bot.hp <= 0) coopKillBot(bot);
    }
  });
  coopSim.bots = coopSim.bots.filter(bot => !bot.dead);

  // Bots bewegen/aanvallen — vier simpele gedragsgroepen op basis van het echte pattern-veld
  coopSim.bots.forEach(bot => {
    if (now < (bot.frozenUntil || 0)) return; // bevroren, geen actie
    if (alivePlayers.length === 0) return;
    let nearest = alivePlayers[0], nd = Math.hypot(alivePlayers[0].x - bot.x, alivePlayers[0].y - bot.y);
    alivePlayers.forEach(p => {
      const d = Math.hypot(p.x - bot.x, p.y - bot.y);
      if (d < nd) { nd = d; nearest = p; }
    });
    const dx = nearest.x - bot.x, dy = nearest.y - bot.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (COOP_MELEE_PATTERNS.includes(bot.pattern)) {
      if (dist > bot.r + COOP_PLAYER_R - 4) {
        bot.x += (dx / dist) * bot.speed * stepMult;
        bot.y += (dy / dist) * bot.speed * stepMult;
      } else if (now - bot.lastAttack > 900) {
        bot.lastAttack = now;
        coopDamagePlayer(nearest, bot.meleeDmg, now);
      }
    } else if (COOP_SUICIDE_PATTERNS.includes(bot.pattern)) {
      if (dist > bot.r + COOP_PLAYER_R + 6) {
        bot.x += (dx / dist) * bot.speed * stepMult;
        bot.y += (dy / dist) * bot.speed * stepMult;
      } else {
        coopDamagePlayer(nearest, bot.meleeDmg || 30, now);
        coopKillBot(bot);
      }
    } else if (COOP_STATIONARY_PATTERNS.includes(bot.pattern)) {
      if (now - bot.lastAttack > bot.shootCooldown) {
        bot.lastAttack = now;
        coopSim.bullets.push({ id: coopSim.nextId++, owner: 'bot', x: bot.x, y: bot.y, vx: (dx / dist) * bot.bulletSpeed, vy: (dy / dist) * bot.bulletSpeed, r: 5, dmg: COOP_BOT_BULLET_DMG, color: bot.color });
      }
    } else {
      // generiek: probeer op afstand te blijven en op de dichtstbijzijnde speler te schieten
      if (dist > COOP_KEEP_DIST + 20) {
        bot.x += (dx / dist) * bot.speed * stepMult;
        bot.y += (dy / dist) * bot.speed * stepMult;
      } else if (dist < COOP_KEEP_DIST - 20) {
        bot.x -= (dx / dist) * bot.speed * stepMult;
        bot.y -= (dy / dist) * bot.speed * stepMult;
      }
      if (now - bot.lastAttack > bot.shootCooldown) {
        bot.lastAttack = now;
        coopSim.bullets.push({ id: coopSim.nextId++, owner: 'bot', x: bot.x, y: bot.y, vx: (dx / dist) * bot.bulletSpeed, vy: (dy / dist) * bot.bulletSpeed, r: 5, dmg: COOP_BOT_BULLET_DMG, color: bot.color });
      }
    }
  });

  // Kogels bewegen + botsingen
  coopSim.bullets.forEach(b => { b.x += b.vx * stepMult; b.y += b.vy * stepMult; });
  coopSim.bullets = coopSim.bullets.filter(b => b.x > -20 && b.x < canvas.width + 20 && b.y > -20 && b.y < canvas.height + 20);

  coopSim.bullets.forEach(b => {
    if (b.hit) return;
    if (b.owner === 'player') {
      coopSim.bots.forEach(bot => {
        if (b.hit || bot.dead) return;
        if (Math.hypot(b.x - bot.x, b.y - bot.y) < b.r + bot.r) {
          b.hit = true;
          bot.hp -= b.dmg;
          if (b.effect === 'execute' && bot.hp > 0 && bot.hp / bot.maxHp < 0.25) bot.hp = 0; // Executioner Rifle: onder 25% HP altijd meteen af
          const wasAlreadyDead = bot.dead;
          if (bot.hp <= 0 && !wasAlreadyDead) {
            coopKillBot(bot);
            const shooter = b.ownerUid && coopSim.players[b.ownerUid];
            if (shooter) {
              shooter.killStreak++;
              shooter.lastKillAt = now;
              if (shooter.coreVampireHeal > 0) shooter.hp = Math.min(shooter.maxHp, shooter.hp + shooter.coreVampireHeal); // Kern-vampirisme: heelt bij ELKE kill
              if (shooter.shockwaveLevel > 0) {
                const swRadius = SHOCKWAVE_RADII[shooter.shockwaveLevel - 1];
                const swDmg = 5 + shooter.shockwaveLevel * 2;
                coopSim.bots.forEach(other => {
                  if (other === bot || other.dead) return;
                  if (Math.hypot(other.x - bot.x, other.y - bot.y) < swRadius) {
                    other.hp -= swDmg;
                    if (other.hp <= 0) coopKillBot(other);
                  }
                });
              }
              if (shooter.overkillLevel > 0 && b.dmg > bot.maxHp * 0.2) {
                const overkillExcess = -bot.hp; // bot.hp staat al op <=0, dus dit is het schade-overschot
                if (overkillExcess > 0) {
                  const okRadius = 60 + shooter.overkillLevel * 30;
                  const okDmg = Math.max(3, Math.round(overkillExcess * 0.3));
                  coopSim.bots.forEach(other => {
                    if (other === bot || other.dead) return;
                    if (Math.hypot(other.x - bot.x, other.y - bot.y) < okRadius) {
                      other.hp -= okDmg;
                      if (other.hp <= 0) coopKillBot(other);
                    }
                  });
                }
              }
            }
            if (b.effect === 'lifestealKill' && shooter) shooter.hp = Math.min(shooter.maxHp, shooter.hp + 3);
            if (b.effect === 'freezeKill') {
              coopSim.bots.forEach(other => {
                if (other === bot || other.dead) return;
                if (Math.hypot(other.x - bot.x, other.y - bot.y) < 100) other.frozenUntil = now + 2000;
              });
            }
            if (b.effect === 'blackholeKill') {
              coopSim.blackholes.push({ id: coopSim.nextId++, x: bot.x, y: bot.y, born: now, lastTick: now });
            }
          }
          if (b.effect === 'chainLightning') {
            let nearest = null, nd = 140;
            coopSim.bots.forEach(other => {
              if (other === bot || other.dead) return;
              const d = Math.hypot(other.x - bot.x, other.y - bot.y);
              if (d < nd) { nd = d; nearest = other; }
            });
            if (nearest) {
              nearest.hp -= Math.max(1, Math.round(b.dmg * 0.6));
              if (nearest.hp <= 0) coopKillBot(nearest);
            }
          }
          if (b.effect === 'shatterHit') {
            coopSim.bots.forEach(other => {
              if (other === bot || other.dead) return;
              if (Math.hypot(other.x - bot.x, other.y - bot.y) < 70) {
                other.hp -= Math.max(1, Math.round(b.dmg * 0.5));
                other.frozenUntil = Math.max(other.frozenUntil || 0, now + 400);
                if (other.hp <= 0) coopKillBot(other);
              }
            });
          }
          if (b.effect === 'poison' && !bot.dead) bot.poisonUntil = now + 4000;
          if (b.effect === 'igniteHit' && !bot.dead) bot.igniteUntil = now + 2500;
          if (b.effect === 'knockbackHit' && !bot.dead) {
            const kd = Math.hypot(b.vx, b.vy) || 1;
            bot.x += (b.vx / kd) * 40;
            bot.y += (b.vy / kd) * 40;
          }
        }
      });
    } else {
      alivePlayers.forEach(p => {
        if (b.hit) return;
        if (Math.hypot(b.x - p.x, b.y - p.y) < b.r + COOP_PLAYER_R) {
          b.hit = true;
          coopDamagePlayer(p, b.dmg, now);
        }
      });
    }
  });
  coopSim.bots = coopSim.bots.filter(bot => !bot.dead);
  coopSim.bullets = coopSim.bullets.filter(b => !b.hit);

  if (Object.values(coopSim.players).length > 0 && Object.values(coopSim.players).every(p => !p.alive)) {
    coopEndMatch();
  }
}

function coopDamagePlayer(p, dmg, now) {
  if (now !== undefined && now < (p.shieldUntil || 0)) return; // Schild-powerup: volledig immuun tot het afloopt
  p.hp -= dmg * (1 - (p.armorReduction || 0));
  if (p.hp <= 0) {
    if (p.hasRevive && !p.reviveUsed) {
      // Revive-upgrade: één keer per potje terugkomen op 35% HP i.p.v. dood te gaan
      p.reviveUsed = true;
      p.hp = p.maxHp * 0.35;
      if (now !== undefined) p.shieldUntil = Math.max(p.shieldUntil || 0, now + 1000); // korte adempauze
    } else {
      p.hp = 0;
      p.alive = false;
    }
  }
}

// Eén centrale plek om een bot te doden: telt altijd de score, en laat 'm een munt vallen — zodat
// iedere kill-plek (kogel-treffer, gif/brand-schade-over-tijd, kettingbliksem, schok-splash) hetzelfde
// gedrag krijgt in plaats van dat elke plek dit los moet doen.
function coopKillBot(bot) {
  if (bot.dead) return;
  bot.dead = true;
  coopSim.score += bot.scoreValue;
  if (Math.random() < COOP_COIN_DROP_CHANCE) {
    coopSim.coins.push({
      id: coopSim.nextId++, x: bot.x, y: bot.y,
      value: COOP_COIN_VALUE_MIN + Math.floor(Math.random() * (COOP_COIN_VALUE_MAX - COOP_COIN_VALUE_MIN + 1))
    });
  }
}

function coopSpawnPowerup() {
  const type = COOP_POWERUP_TYPES[Math.floor(Math.random() * COOP_POWERUP_TYPES.length)];
  coopSim.powerups.push({
    id: coopSim.nextId++, type,
    x: COOP_ARENA_MARGIN + 60 + Math.random() * (canvas.width - 2 * (COOP_ARENA_MARGIN + 60)),
    y: COOP_ARENA_MARGIN + 60 + Math.random() * (canvas.height - 2 * (COOP_ARENA_MARGIN + 60))
  });
}

function coopSpawnBot() {
  const def = BOT_TYPES[Math.floor(Math.random() * BOT_TYPES.length)];
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  if (edge === 0) { x = Math.random() * canvas.width; y = -20; }
  else if (edge === 1) { x = canvas.width + 20; y = Math.random() * canvas.height; }
  else if (edge === 2) { x = Math.random() * canvas.width; y = canvas.height + 20; }
  else { x = -20; y = Math.random() * canvas.height; }
  coopSim.bots.push({
    id: coopSim.nextId++,
    type: def.name, pattern: def.pattern,
    x, y, r: def.r, color: def.color(),
    speed: def.speed[0] + Math.random() * (def.speed[1] - def.speed[0]),
    hp: def.hp, maxHp: def.hp,
    bulletSpeed: def.bulletSpeed || 5,
    meleeDmg: def.meleeDamage || 10,
    shootCooldown: def.cooldown[0] + Math.random() * (def.cooldown[1] - def.cooldown[0]),
    lastAttack: 0,
    frozenUntil: 0, rootedUntil: 0, slashUntil: 0, invulnUntil: 0, immortal: false, isBoss: false,
    poisonUntil: 0, igniteUntil: 0, lastPoisonTick: 0, lastIgniteTick: 0,
    scoreValue: Math.max(5, def.hp)
  });
}

function coopPushHostState() {
  if (!coopLobbyCode) return;
  const players = {};
  Object.keys(coopSim.players).forEach(uid => {
    const p = coopSim.players[uid];
    players[uid] = {
      x: Math.round(p.x), y: Math.round(p.y), angle: p.angle, hp: p.hp, maxHp: p.maxHp, name: p.name, color: p.color, alive: p.alive,
      skinId: p.skinId || 'default', coinsEarned: p.coinsEarned || 0,
      shieldActive: performance.now() < (p.shieldUntil || 0), boostActive: performance.now() < (p.boostUntil || 0)
    };
  });
  const bots = coopSim.bots.slice(0, COOP_MAX_BOTS_SENT).map(b => ({
    x: Math.round(b.x), y: Math.round(b.y), hp: b.hp, maxHp: b.maxHp, r: b.r, color: b.color, type: b.type, pattern: b.pattern,
    frozenUntil: b.frozenUntil || 0, rootedUntil: 0, slashUntil: 0, invulnUntil: 0, immortal: false, isBoss: false
  }));
  const bullets = coopSim.bullets.slice(0, COOP_MAX_BULLETS_SENT).map(b => ({ x: Math.round(b.x), y: Math.round(b.y), r: b.r, color: b.color }));
  const coins = coopSim.coins.map(c => ({ x: Math.round(c.x), y: Math.round(c.y) }));
  const powerups = coopSim.powerups.map(pu => ({ x: Math.round(pu.x), y: Math.round(pu.y), type: pu.type }));
  const blackholes = coopSim.blackholes.map(bh => ({ x: Math.round(bh.x), y: Math.round(bh.y), age: performance.now() - bh.born }));
  db.collection('lobbies').doc(coopLobbyCode).collection('state').doc('live')
    .set({ players, bots, bullets, coins, powerups, blackholes, score: coopSim.score, status: coopSim.status, updatedAt: Date.now() })
    .catch(() => {});
}

function coopEndMatch() {
  if (!coopSim) return;
  coopSim.status = 'ended';
  coopPushHostState();
  coopShowMatchOverlay('Alle spelers zijn uitgeschakeld');
}

// ---- Gast: renderen wat de host stuurt ----
function coopGuestRenderLoop() {
  if (coopRole !== 'guest') return;
  if (coopRemoteState) {
    coopRenderFrame(coopRemoteState);
    coopUpdateHud(coopRemoteState);
    coopSyncMyCoins(coopRemoteState.players && coopRemoteState.players[currentUid]);
  }
  coopRafId = requestAnimationFrame(coopGuestRenderLoop);
}

// Zoekt de dichtstbijzijnde (levende) speler t.o.v. een bot, puur om drawBot() de juiste kant op te
// laten kijken (drawBot bepaalt de kijkrichting altijd zelf via de globale `player.x/y`).
function coopNearestPlayerPos(bot, players) {
  let best = null, bestD = Infinity;
  Object.values(players).forEach(p => {
    if (!p.alive) return;
    const d = Math.hypot(p.x - bot.x, p.y - bot.y);
    if (d < bestD) { bestD = d; best = p; }
  });
  return best || { x: bot.x, y: bot.y - 1 };
}

// ---- Gedeelde rendering (host tekent zijn eigen coopSim, gast tekent de laatste ontvangen snapshot) ----
function coopRenderFrame(state) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#16213e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const players = state.players || {};
  const bots = state.bots || [];

  // Munten en powerups
  (state.coins || []).forEach(c => {
    ctx.beginPath();
    ctx.fillStyle = '#ffd60a';
    ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
    ctx.fill();
  });
  (state.powerups || []).forEach(pu => {
    ctx.beginPath();
    ctx.fillStyle = COOP_POWERUP_COLORS[pu.type] || '#fff';
    ctx.globalAlpha = 0.25;
    ctx.arc(pu.x, pu.y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = '20px Segoe UI';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(COOP_POWERUP_ICONS[pu.type] || '?', pu.x, pu.y);
    ctx.textBaseline = 'alphabetic';
  });
  (state.blackholes || []).forEach(bh => {
    const t = Math.min(1, (bh.age || 0) / COOP_BLACKHOLE_DURATION);
    const r = COOP_BLACKHOLE_RADIUS * (0.4 + t * 0.6);
    const grad = ctx.createRadialGradient(bh.x, bh.y, 4, bh.x, bh.y, r);
    grad.addColorStop(0, '#000000');
    grad.addColorStop(0.6, '#3a0a5c');
    grad.addColorStop(1, 'rgba(58,10,92,0)');
    ctx.beginPath();
    ctx.fillStyle = grad;
    ctx.arc(bh.x, bh.y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Bots tekenen met de ECHTE drawBot() uit render.js — die bepaalt zelf kleur/vorm/hp-balk/status-
  // ringen aan de hand van bot.type/pattern/hp/maxHp/frozenUntil/enz., en kijkt naar de globale
  // player.x/y voor de kijkrichting. We zetten die tijdelijk op de dichtstbijzijnde speler per bot.
  const savedPlayerX = player.x, savedPlayerY = player.y;
  bots.forEach(bot => {
    const near = coopNearestPlayerPos(bot, players);
    player.x = near.x; player.y = near.y;
    drawBot(bot);
  });
  player.x = savedPlayerX; player.y = savedPlayerY;

  const bullets = state.bullets || [];
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.fillStyle = b.color || '#fff';
    ctx.arc(b.x, b.y, b.r || 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Spelers: tekent de ECHTE, eigen uitgeruste skin van elke speler via drawPlayerSkin() — net als
  // drawPlayer() in render.js zelf doet, maar dan met de x/y/hoek/skin van DEZE speler i.p.v. de globale
  // player. Transformaties/dood-animaties/wapen-in-hand zijn hier nog niet in verwerkt.
  Object.values(players).forEach(p => {
    if (!p.alive) return;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle || 0);
    drawPlayerSkin(ctx, p.skinId || 'default', COOP_PLAYER_R);
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.font = '13px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(p.name || '?', p.x, p.y - COOP_PLAYER_R - 22);
    const w = COOP_PLAYER_R * 2.2;
    ctx.fillStyle = '#333';
    ctx.fillRect(p.x - w / 2, p.y - COOP_PLAYER_R - 16, w, 5);
    ctx.fillStyle = p.hp / p.maxHp > 0.3 ? '#4cd964' : '#ff5c5c';
    ctx.fillRect(p.x - w / 2, p.y - COOP_PLAYER_R - 16, w * Math.max(0, p.hp / p.maxHp), 5);
  });
}

// Munten die JOUW speler oppakte staan als een oplopend totaal (coinsEarned) in de simulatie/snapshot —
// elke client (host voor zichzelf, elke gast voor zichzelf) houdt bij hoeveel daarvan al is bijgeschreven
// op het echte account, en boekt alleen het verschil bij. Zo kan de host nooit per ongeluk munten op een
// ANDER account bijschrijven (dat mag alleen het account zelf, lokaal), en telt niets dubbel.
function coopSyncMyCoins(myPlayerState) {
  if (!myPlayerState) return;
  const total = myPlayerState.coinsEarned || 0;
  if (total > coopMyCoinsApplied) {
    coins += (total - coopMyCoinsApplied);
    coopMyCoinsApplied = total;
    saveShopState();
    if (typeof refreshCurrencyDisplays === 'function') refreshCurrencyDisplays();
    if (typeof updateHUD === 'function') updateHUD();
  }
}

function coopUpdateHud(state) {
  const scoreEl = document.getElementById('coopScoreVal');
  if (scoreEl) scoreEl.textContent = state.score || 0;
  const hudEl = document.getElementById('coopPlayersHud');
  if (hudEl && state.players) {
    hudEl.innerHTML = Object.values(state.players).map(p =>
      `<div style="color:${p.color || '#fff'};">${escapeHtml(String(p.name || '?'))}: ${p.alive ? Math.max(0, Math.round(p.hp)) : '💀'} HP</div>`
    ).join('');
  }
}

function coopShowMatchOverlay(text) {
  const overlay = document.getElementById('coopMatchOverlay');
  const title = document.getElementById('coopMatchOverlayTitle');
  if (title) title.textContent = text;
  if (overlay) overlay.style.display = 'flex';
}

// ---- Potje verlaten / opruimen ----
function coopStopLoopsAndListeners() {
  if (coopRafId) { cancelAnimationFrame(coopRafId); coopRafId = null; }
  if (coopStateUnsub) { coopStateUnsub(); coopStateUnsub = null; }
  if (coopInputsUnsub) { coopInputsUnsub(); coopInputsUnsub = null; }
  if (coopInputPushTimer) { clearInterval(coopInputPushTimer); coopInputPushTimer = null; }
}

async function leaveCoopMatch() {
  coopStopLoopsAndListeners();
  if (coopRole === 'host' && coopLobbyCode) {
    try { await db.collection('lobbies').doc(coopLobbyCode).update({ status: 'ended' }); } catch (e) { /* stil negeren */ }
  }
  if (coopMyCoinsApplied > 0) { try { await syncCurrentAccountSave(); } catch (e) { /* stil negeren, de gewone 8-sec-sync pakt het alsnog op */ } }
  coopSim = null;
  coopRemoteState = null;
  coopRole = null;
  coopMatchActive = false;
  document.getElementById('coopMatchScreen').style.display = 'none';
  document.getElementById('coopMatchOverlay').style.display = 'none';
  document.getElementById(menuScreenId()).style.display = 'flex';
  // De lobby zelf (en de speler-/inputdocumenten) definitief opruimen
  await leaveCoopLobby();
}
window.leaveCoopMatch = leaveCoopMatch;
