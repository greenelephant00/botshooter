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
// Bots gebruiken de ECHTE score-progressie van Endless (pickBotType() in player.js: bottypes
// ontgrendelen op basis van score, Splitter-cap) en dezelfde spawnkans/-cap (3 + score/50, 1,5%
// kans/frame). Hun aanval-PATRONEN vuren nu ook dezelfde kogel-volleys als single-player (single/fast/
// triple/burst/circle/double/wide/megaburst/spiral/teleport, zie coopBotShoot()), met per-bottype
// schade/herlaadtijd. Swarmqueen splitst bij dood, Bomber doet zijn explosie-splash ongeacht doodsoorzaak.
// NIET overgenomen: de 11 zeldzame SPECIAL_BOT_TYPES (mortier/gifwolk/gravity well/mijn/vloek/enz.),
// bosses, Wereld 2-bots/-disasters — die zijn te complex voor deze stap en komen in Co-op nog niet voor.
//
// Spelers tekenen met hun eigen echte uitgeruste skin (drawPlayerSkin), en vechten met hun eigen wapen
// (schade/vuursnelheid/kogelgrootte/pellets/spreiding — zelfde formules als single-player) en pantser
// (HP-bonus, schadereductie, muntenvermenigvuldiger) — elke speler leest dit lokaal van zijn eigen
// account en meldt het aan de host (zie coopReadLocalLoadout()). De meeste speciale-wapen-effecten zijn
// geïmplementeerd met dezelfde getallen als single-player (zie COOP_SUPPORTED_EFFECTS) — dit zijn nu
// ALLE speciale-wapen-effecten uit single-player: bevriezen bij kill, lifesteal bij kill, ketting-
// bliksem, direct executeren onder 25% HP, gif (verspreidt zich naar bots in de buurt bij dood), brand,
// shatter-splash+bevriezen, terugstoot, windduw, zwart gat, kleefbom (vertraagde explosie) en
// wortelsleur (sleurt bij een kill de dichtstbijzijnde bot de grond in), en killstreak-schaalschade —
// en Kernvampirisme/Shockwave/Overkill/killstreak-teller gelden nu bij ELKE kill-oorzaak, niet alleen
// een directe kogeltreffer. Nog niet overgenomen: kogel-doorboring/-splash/-bereiklimiet (Railgun,
// Raketwerper, Windgeweer, Vlammenwerper), Minigun-inaccuracy, en de elementale/curse/Bloodlust-
// schademultipliers op een schot.
//
// Munten en powerups spawnen periodiek willekeurig op de kaart — net als single-player (zelfde
// interval/kans/veld-cap/levensduur), NIET als bot-drop bij een kill, en met hetzelfde plukbereik
// (Magneet + Goudtrek) en dezelfde muntenwaarde (Fortuinpantser + Muntenregen). 3 van de 26 echte
// powerup-types zijn geïmplementeerd: schild/snelheid/heal, met dezelfde duur-/heelbedrag-tabellen en
// Long Boosts-verlenging als single-player. De overige 23 (snelvuur, damage, multishot, freeze, nuke,
// onzichtbaar, timewarp, terugkaats, homing, stun, aura, overload, verwarring, elementenstorm, en de
// Wereld 2-exclusieve types) bestaan nog niet in Co-op. Munten worden echt bijgeschreven op je account.
// Munten/powerups/het zwarte gat gebruiken de ECHTE tekenfuncties (drawCoinPickup/drawPowerup/
// drawBlackHole uit render.js), niet een eigen tekenstijl.
//
// De meeste gekochte UPGRADES tellen mee (zie coopReadLocalUpgrades()): Extra HP, Sprint, Snel Herladen,
// Critical Hit, Iron Skin, Revive (1x per potje), Coin Rain, Magneet, Goudtrek, Long Boosts, en de
// Wereld 2 Kern-upgrades (Kernschade, Kernsnelheid, Kernregeneratie, Kernvampirisme), plus Shockwave en
// Overkill. Bonussen uit Wereld 1- én Wereld 2-bomen worden gewoon bij elkaar opgeteld (bewuste keuze:
// Co-op is niet aan één wereld gebonden, dus anders zou een Wereld 2-upgrade nooit meetellen). Lucky
// Drop is niet meegenomen (verkort in single-player alleen het powerup-spawn-interval, en Co-op heeft
// al een eigen vaste powerup-timer). Multi-Shield, Splinter-schoten, Sharpshooter, Second Wind, Flying
// Start, Piercing Rounds, Bloodlust en Core Shield/Aura/Shock zitten er nog niet in. Ook de meeste
// pantser-bijeffecten (regen, thorns, adrenaline, reflectie, gif-/bevries-reflectie, elementale
// weerstand/schademultiplier, terugstoot-weerstand) doen in Co-op nog niets, buiten HP-bonus/reductie/
// muntenvermenigvuldiger.
//
// Overige bekende beperkingen van deze versie:
// - Geen bosses, geen Wereld 2-disasters (tornado/zandstorm/aardbeving/enz.).
// - Alleen het skin-LICHAAM wordt getekend, geen wapen-in-hand, transformaties of dood-animaties.
// - Geen deeltjes-effecten (hits/kills/pickups) en geen aanval-telegraphs (waarschuwing vóór een
//   speciale aanval) — bots vallen dus zonder visuele wind-up aan.
// - Alleen toetsenbord+muis, geen touch-besturing.
// - Geen client-side prediction: je eigen bewegingen op een gast-scherm voelen iets vertraagd.
// - De bevriezings-visual op een GAST-scherm kan soms net niet kloppen (elke browser heeft zijn eigen
//   interne klok voor animatie-timing) — de daadwerkelijke bevriezing (bot staat stil) is wel altijd
//   correct, want die wordt volledig door de host bepaald.

const COOP_ARENA_MARGIN = 20;
const COOP_STATE_PUSH_MS = 200; // hoe vaak de host een snapshot naar Firestore schrijft
const COOP_INPUT_PUSH_MS = 180; // hoe vaak een gast zijn invoer naar Firestore schrijft
const COOP_PLAYER_R = 18;
const COOP_PLAYER_SPEED = 4.2;
const COOP_PLAYER_MAX_HP = 100;
const COOP_WEAPON = { dmg: 2, cooldownMs: 220, bulletSpeed: 9, bulletR: 4 }; // iedereen deelt dit simpele standaardwapen
const COOP_MAX_BOTS_SENT = 40;
const COOP_MAX_BULLETS_SENT = 60;
const COOP_PLAYER_COLORS = ['#4cc9f0', '#ff5cf1', '#c3e600'];
const COOP_MELEE_PATTERNS = ['melee'];
const COOP_SUICIDE_PATTERNS = ['suicide'];
const COOP_STATIONARY_PATTERNS = ['turret'];
const COOP_TELEPORT_PATTERNS = ['teleport'];
const COOP_KEEP_DIST = 140; // hoe ver "afstand houden"-bots proberen te blijven van hun doelwit (zelfde als single-player)
const COOP_RANGED_FIRE_RANGE = 600; // ranged bots schieten alleen binnen dit bereik, net als single-player

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

// Munten spawnen — net als single-player — periodiek op een willekeurige plek, LOS van bot-kills
// (niet als bot-drop, zoals een eerdere versie deed).
const COOP_COIN_SPAWN_MS = 4000;
const COOP_COIN_MAX_ON_FIELD = 2;
const COOP_COIN_VALUE_MIN = 5;
const COOP_COIN_VALUE_MAX = 15;
const COOP_COIN_PICKUP_R = 22;
const COOP_POWERUP_SPAWN_MS = 6000; // zelfde basis-interval als single-player (spawnkans hieronder ook 70%)
const COOP_POWERUP_PICKUP_R = 24;
const COOP_POWERUP_MAX_ON_FIELD = 2;
const COOP_POWERUP_LIFE_MS = 9000;
const COOP_COIN_LIFE_MS = 8000;
const COOP_POWERUP_TYPES = ['shield', 'speed', 'heal'];

// Alle speciale-wapen-effecten uit single-player zijn nu ondersteund in Co-op.
const COOP_SUPPORTED_EFFECTS = ['freezeKill', 'lifestealKill', 'chainLightning', 'execute', 'poison', 'igniteHit', 'shatterHit', 'knockbackHit', 'gustPush', 'killstreak', 'blackholeKill', 'stickyBomb', 'rootDragKill'];
const COOP_BLACKHOLE_RADIUS = 130;
const COOP_BLACKHOLE_DURATION = 1200;
const COOP_BLACKHOLE_BURST_DMG = 6;

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
    reduction: 1 - (1 - (a1.reduction || 0)) * (1 - (a2.reduction || 0)),
    coinMult: (a1.coinMult || 1) * (a2.coinMult || 1)
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
  const pickupBonus = (lvlMagnet || 0) * MAGNET_RADIUS_PER_LEVEL + (lvlGoldRush > 0 ? GOLD_RUSH_RADIUS[lvlGoldRush - 1] : 0);
  return {
    extraHpBonus: (lvlExtraHp || 0) * EXTRA_HP_PER_LEVEL + (lvl2ExtraHp || 0) * EXTRAHP2_PER_LEVEL,
    reloadMult: 1 - (lvlFastReload || 0) * FAST_RELOAD_PER_LEVEL - (lvl2FastReload || 0) * FASTRELOAD2_PER_LEVEL,
    speedMult: (1 + (lvlSprint || 0) * SPRINT_PER_LEVEL) * (1 + (lvlCoreSpeed || 0) * CORE_SPEED_PER_LEVEL),
    coreDamageMult: 1 + (lvlCoreDamage || 0) * CORE_DAMAGE_PER_LEVEL,
    critChance, ironSkinReduction, coinRainBonus, pickupBonus,
    hasRevive: !!(hasRevive || hasRevive2),
    coreRegenPerSec: (lvlCoreRegen || 0) * CORE_REGEN_PER_LEVEL,
    coreVampireHeal: (lvlCoreVampire || 0) * CORE_VAMPIRE_PER_LEVEL,
    overkillLevel: Math.max(lvlOverkill || 0, lvl2Overkill || 0),
    shockwaveLevel: lvlShockwave || 0,
    longBoostsMult: 1 + (lvlLongBoosts || 0) * LONG_BOOSTS_MULT_PER_LEVEL,
    puSpeedLvl: getPuLevel('speed'), puHealLvl: getPuLevel('heal'), puShieldLvl: getPuLevel('shield')
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
    weaponBulletR: weapon.bulletR || 4,
    weaponPellets: weapon.pellets || 1,
    weaponSpread: weapon.spread || 0.18,
    weaponEffect: COOP_SUPPORTED_EFFECTS.includes(weapon.effect) ? weapon.effect : null,
    armorHpBonus: (armor.hpBonus || 0) + up.extraHpBonus,
    armorReduction: 1 - (1 - (armor.reduction || 0)) * (1 - up.ironSkinReduction),
    coinMult: armor.coinMult || 1,
    speedMult: up.speedMult,
    critChance: up.critChance,
    hasRevive: up.hasRevive,
    coinRainBonus: up.coinRainBonus,
    pickupBonus: up.pickupBonus,
    coreRegenPerSec: up.coreRegenPerSec,
    coreVampireHeal: up.coreVampireHeal,
    overkillLevel: up.overkillLevel,
    shockwaveLevel: up.shockwaveLevel,
    longBoostsMult: up.longBoostsMult,
    puSpeedLvl: up.puSpeedLvl, puHealLvl: up.puHealLvl, puShieldLvl: up.puShieldLvl,
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
  if (typeof loadout.weaponBulletR === 'number') p.weaponBulletR = loadout.weaponBulletR;
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
  if (typeof loadout.pickupBonus === 'number') p.pickupBonus = loadout.pickupBonus;
  if (typeof loadout.coinMult === 'number') p.coinMult = loadout.coinMult;
  if (typeof loadout.coreRegenPerSec === 'number') p.coreRegenPerSec = loadout.coreRegenPerSec;
  if (typeof loadout.coreVampireHeal === 'number') p.coreVampireHeal = loadout.coreVampireHeal;
  if (typeof loadout.overkillLevel === 'number') p.overkillLevel = loadout.overkillLevel;
  if (typeof loadout.shockwaveLevel === 'number') p.shockwaveLevel = loadout.shockwaveLevel;
  if (typeof loadout.longBoostsMult === 'number') p.longBoostsMult = loadout.longBoostsMult;
  if (typeof loadout.puSpeedLvl === 'number') p.puSpeedLvl = loadout.puSpeedLvl;
  if (typeof loadout.puHealLvl === 'number') p.puHealLvl = loadout.puHealLvl;
  if (typeof loadout.puShieldLvl === 'number') p.puShieldLvl = loadout.puShieldLvl;
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
  coopSim = { players: {}, bots: [], bullets: [], coins: [], powerups: [], blackholes: [], score: 0, lastBotSpawn: 0, lastCoinSpawn: 0, lastPowerupSpawn: 0, nextId: 1, status: 'playing' };
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
        weaponDmg: COOP_WEAPON.dmg, weaponCooldownMs: COOP_WEAPON.cooldownMs, weaponBulletSpeed: COOP_WEAPON.bulletSpeed, weaponBulletR: COOP_WEAPON.bulletR,
        weaponPellets: 1, weaponSpread: 0.18, weaponEffect: null, armorHpBonus: 0, armorReduction: 0,
        killStreak: 0, lastKillAt: 0, skinId: 'default',
        speedMult: 1, critChance: 0, hasRevive: false, reviveUsed: false, coinRainBonus: 0, pickupBonus: 0, coinMult: 1,
        coreRegenPerSec: 0, coreVampireHeal: 0, overkillLevel: 0, shockwaveLevel: 0, lastRegenTick: 0,
        longBoostsMult: 1, puSpeedLvl: 0, puHealLvl: 0, puShieldLvl: 0
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
  coopGuestDisplay = { players: {}, bots: {} };
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
      const spread = p.weaponSpread || 0;
      const startAngle = p.angle - spread * (pellets - 1) / 2;
      for (let i = 0; i < pellets; i++) {
        // Meerdere pellets (bv. shotgun) waaieren symmetrisch rond de mikrichting uit, net als single-player
        const shotAngle = pellets === 1 ? p.angle : startAngle + spread * i;
        coopSim.bullets.push({
          id: coopSim.nextId++, owner: 'player', ownerUid: uid,
          x: p.x + Math.cos(shotAngle) * (COOP_PLAYER_R + 6), y: p.y + Math.sin(shotAngle) * (COOP_PLAYER_R + 6),
          vx: Math.cos(shotAngle) * p.weaponBulletSpeed, vy: Math.sin(shotAngle) * p.weaponBulletSpeed,
          r: p.weaponBulletR || 4, dmg: p.weaponDmg * streakMult * critMult, color: p.color, effect: p.weaponEffect
        });
      }
    }
  });

  // Bots spawnen — zelfde spawn-cap/-kans als single-player Endless (3 + score/50 tegelijk, 1,5% kans per frame)
  if (coopSim.bots.length < 3 + Math.floor(coopSim.score / 50) && Math.random() < 0.015) {
    coopSpawnBot();
  }

  // Munten en powerups spawnen — periodiek op een willekeurige plek, net als single-player (niet als
  // bot-drop)
  if (now - coopSim.lastCoinSpawn > COOP_COIN_SPAWN_MS && coopSim.coins.length < COOP_COIN_MAX_ON_FIELD) {
    coopSim.lastCoinSpawn = now;
    coopSpawnCoin();
  }
  if (now - coopSim.lastPowerupSpawn > COOP_POWERUP_SPAWN_MS && coopSim.powerups.length < COOP_POWERUP_MAX_ON_FIELD) {
    coopSim.lastPowerupSpawn = now;
    if (Math.random() < 0.7) coopSpawnPowerup();
  }

  // Munten en powerups oppakken — plukbereik/waarde met Magneet, Goudtrek, Fortuinpantser en Long
  // Boosts, en de duur/heelbedrag uit dezelfde niveau-tabellen als single-player (POWERUP_LEVELS)
  alivePlayers.forEach(p => {
    const pickupR = COOP_COIN_PICKUP_R + (p.pickupBonus || 0);
    coopSim.coins.forEach(c => {
      if (c.collected) return;
      if (Math.hypot(p.x - c.x, p.y - c.y) < pickupR) {
        c.collected = true;
        p.coinsEarned = (p.coinsEarned || 0) + Math.round(c.value * (p.coinMult || 1)) + (p.coinRainBonus || 0);
      }
    });
    const puPickupR = COOP_POWERUP_PICKUP_R + (p.pickupBonus || 0);
    coopSim.powerups.forEach(pu => {
      if (pu.collected) return;
      if (Math.hypot(p.x - pu.x, p.y - pu.y) < puPickupR) {
        pu.collected = true;
        const boostDurMult = p.longBoostsMult || 1;
        if (pu.type === 'shield') p.shieldUntil = now + POWERUP_LEVELS.shield.durations[p.puShieldLvl || 0] * boostDurMult;
        else if (pu.type === 'speed') p.boostUntil = now + POWERUP_LEVELS.speed.durations[p.puSpeedLvl || 0] * boostDurMult;
        else if (pu.type === 'heal') p.hp = Math.min(p.maxHp, p.hp + POWERUP_LEVELS.heal.heals[p.puHealLvl || 0]);
      }
    });
  });
  coopSim.coins = coopSim.coins.filter(c => !c.collected && now - c.born < COOP_COIN_LIFE_MS);
  coopSim.powerups = coopSim.powerups.filter(pu => !pu.collected && now - pu.born < COOP_POWERUP_LIFE_MS);

  // Zwarte gaten (Singularity Gun): zuigen bots naar binnen, doen geleidelijk schade, en imploderen
  // na COOP_BLACKHOLE_DURATION met een flinke schadeburst — zelfde zuigsnelheid/schadetempo als
  // single-player (daar per animatieframe, hier per tick van 200ms omgerekend naar hetzelfde tempo)
  coopSim.blackholes.forEach(bh => {
    const age = now - bh.born;
    if (age > COOP_BLACKHOLE_DURATION) {
      coopSim.bots.forEach(bot => {
        if (bot.dead) return;
        if (Math.hypot(bot.x - bh.x, bot.y - bh.y) < COOP_BLACKHOLE_RADIUS * 0.7) {
          bot.hp -= COOP_BLACKHOLE_BURST_DMG;
          if (bot.hp <= 0) coopKillBot(bot, bh.ownerUid, now);
        }
      });
      bh.expired = true;
      return;
    }
    const tickElapsed = now - (bh.lastTick || bh.born);
    if (tickElapsed > 200) {
      bh.lastTick = now;
      const ticksPassed = tickElapsed / 16.67; // schaal naar "aantal animatieframes" zoals single-player
      coopSim.bots.forEach(bot => {
        if (bot.dead) return;
        const d = Math.hypot(bot.x - bh.x, bot.y - bh.y);
        if (d < COOP_BLACKHOLE_RADIUS) {
          if (d > 10) { bot.x += (bh.x - bot.x) / d * 1.6 * ticksPassed; bot.y += (bh.y - bot.y) / d * 1.6 * ticksPassed; }
          bot.bhDmgAccum = (bot.bhDmgAccum || 0) + 0.05 * ticksPassed; // 5% kans per frame op 1 schade = gemiddeld ~3 schade/sec
          if (bot.bhDmgAccum >= 1) {
            const dmgNow = Math.floor(bot.bhDmgAccum);
            bot.bhDmgAccum -= dmgNow;
            bot.hp -= dmgNow;
            if (bot.hp <= 0) coopKillBot(bot, bh.ownerUid, now);
          }
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
      if (bot.hp <= 0) coopKillBot(bot, bot.poisonOwnerUid, now);
    }
    if (!bot.dead && bot.igniteUntil && now < bot.igniteUntil && now - (bot.lastIgniteTick || 0) > 400) {
      bot.lastIgniteTick = now;
      bot.hp -= 2;
      if (bot.hp <= 0) coopKillBot(bot, bot.igniteOwnerUid, now);
    }
  });
  coopSim.bots = coopSim.bots.filter(bot => !bot.dead);

  // Bots bewegen/aanvallen — zelfde standoff-afstanden, per-bot-type herlaadtijden/schade en
  // kogel-volleys als single-player (zie coopBotShoot() verderop in dit bestand).
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
      } else if (now - bot.lastAttack > bot.shootCooldown) {
        bot.lastAttack = now;
        coopDamagePlayer(nearest, bot.meleeDmg, now);
      }
    } else if (COOP_SUICIDE_PATTERNS.includes(bot.pattern)) {
      if (dist > bot.r + COOP_PLAYER_R + 10) {
        bot.x += (dx / dist) * bot.speed * stepMult;
        bot.y += (dy / dist) * bot.speed * stepMult;
      } else {
        coopDamagePlayer(nearest, bot.meleeDmg || 35, now);
        coopKillBot(bot);
      }
    } else if (COOP_TELEPORT_PATTERNS.includes(bot.pattern)) {
      // ghost: teleporteert naar een willekeurige plek 150-250px van zijn doelwit en schiet direct
      if (now - bot.lastAttack > bot.shootCooldown) {
        bot.lastAttack = now;
        const tAng = Math.random() * Math.PI * 2;
        const tDist = 150 + Math.random() * 100;
        bot.x = Math.max(bot.r, Math.min(canvas.width - bot.r, nearest.x + Math.cos(tAng) * tDist));
        bot.y = Math.max(bot.r, Math.min(canvas.height - bot.r, nearest.y + Math.sin(tAng) * tDist));
        coopFireBotBullet(bot, Math.atan2(nearest.y - bot.y, nearest.x - bot.x));
      }
    } else if (COOP_STATIONARY_PATTERNS.includes(bot.pattern)) {
      // turret: staat stil, schiet snel en precies, alleen binnen bereik
      if (dist < COOP_RANGED_FIRE_RANGE && now - bot.lastAttack > bot.shootCooldown) {
        bot.lastAttack = now;
        coopFireBotBullet(bot, Math.atan2(dy, dx), 1.3);
      }
    } else {
      // generiek: nadert tot in schietbereik en blijft daar staan (loopt NIET terug als je dichterbij
      // komt — single-player's ranged bots wijken ook niet uit, ze schieten gewoon door), en schiet
      // alleen binnen bereik, net als single-player
      if (dist > COOP_KEEP_DIST) {
        bot.x += (dx / dist) * bot.speed * stepMult;
        bot.y += (dy / dist) * bot.speed * stepMult;
      }
      if (dist < COOP_RANGED_FIRE_RANGE && now - bot.lastAttack > bot.shootCooldown) {
        bot.lastAttack = now;
        coopBotShoot(bot, Math.atan2(dy, dx));
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
            coopKillBot(bot, b.ownerUid, now);
            const shooter = b.ownerUid && coopSim.players[b.ownerUid];
            if (b.effect === 'lifestealKill' && shooter) shooter.hp = Math.min(shooter.maxHp, shooter.hp + 3);
            if (b.effect === 'freezeKill') {
              coopSim.bots.forEach(other => {
                if (other === bot || other.dead) return;
                if (Math.hypot(other.x - bot.x, other.y - bot.y) < 100) other.frozenUntil = now + 2000;
              });
            }
            if (b.effect === 'blackholeKill') {
              coopSim.blackholes.push({ id: coopSim.nextId++, x: bot.x, y: bot.y, born: now, lastTick: now, ownerUid: b.ownerUid });
            }
            if (b.effect === 'rootDragKill') {
              // Wortelgeweer: sleurt bij een kill de dichtstbijzijnde andere bot de grond in (instant-kill na 840ms)
              let nearest = null, nd = ROOT_DRAG_RANGE;
              coopSim.bots.forEach(other => {
                if (other === bot || other.dead) return;
                const dd = Math.hypot(other.x - bot.x, other.y - bot.y);
                if (dd < nd) { nd = dd; nearest = other; }
              });
              if (nearest) {
                const rootTarget = nearest, rootShooter = b.ownerUid;
                rootTarget.rootedUntil = now + 1400;
                setTimeout(() => {
                  if (!coopSim || coopRole !== 'host' || rootTarget.dead) return;
                  coopKillBot(rootTarget, rootShooter, performance.now());
                }, 840);
              }
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
              if (nearest.hp <= 0) coopKillBot(nearest, b.ownerUid, now);
            }
          }
          if (b.effect === 'shatterHit') {
            coopSim.bots.forEach(other => {
              if (other === bot || other.dead) return;
              if (other.invulnUntil && now < other.invulnUntil) return;
              if (Math.hypot(other.x - bot.x, other.y - bot.y) < 70) {
                other.hp -= Math.max(1, Math.round(b.dmg * 0.5));
                other.frozenUntil = Math.max(other.frozenUntil || 0, now + 400);
                if (other.hp <= 0) coopKillBot(other, b.ownerUid, now);
              }
            });
          }
          if (b.effect === 'poison' && !bot.dead) { bot.poisonUntil = now + 3000; bot.poisonOwnerUid = b.ownerUid; bot.poisonSpread = true; }
          if (b.effect === 'stickyBomb' && !bot.dead && !b.stuckTriggered) {
            // Kleefbom Werper: ontploft na een korte vertraging (zelfde 800ms/90px/5dmg als single-player)
            b.stuckTriggered = true;
            const bx = bot.x, by = bot.y, bombShooter = b.ownerUid;
            setTimeout(() => {
              if (!coopSim || coopRole !== 'host') return;
              coopSim.bots.forEach(other => {
                if (other.dead) return;
                if (Math.hypot(bx - other.x, by - other.y) < 90) {
                  other.hp -= 5;
                  if (other.hp <= 0) coopKillBot(other, bombShooter, performance.now());
                }
              });
            }, 800);
          }
          if (b.effect === 'igniteHit' && !bot.dead) { bot.igniteUntil = now + 2500; bot.igniteOwnerUid = b.ownerUid; }
          if (b.effect === 'knockbackHit' && !bot.dead) {
            // Duwt de bot weg van de SCHUTTER (net als single-player), niet van de kogel-vliegrichting
            const shooterForKb = b.ownerUid && coopSim.players[b.ownerUid];
            const kAng = shooterForKb ? Math.atan2(bot.y - shooterForKb.y, bot.x - shooterForKb.x) : Math.atan2(b.vy, b.vx);
            bot.x += Math.cos(kAng) * 45;
            bot.y += Math.sin(kAng) * 45;
          }
          if (b.effect === 'gustPush' && !bot.dead) {
            // Duwt de geraakte bot + alle bots binnen 90px mee in de vliegrichting van de kogel
            const kd2 = Math.hypot(b.vx, b.vy) || 1;
            const pdx = b.vx / kd2, pdy = b.vy / kd2;
            coopSim.bots.forEach(other => {
              if (other.dead) return;
              if (other === bot || Math.hypot(other.x - bot.x, other.y - bot.y) < 90) {
                other.x += pdx * 55;
                other.y += pdy * 55;
              }
            });
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
      if (now !== undefined) p.shieldUntil = Math.max(p.shieldUntil || 0, now + 1500); // korte adempauze
    } else {
      p.hp = 0;
      p.alive = false;
    }
  }
}

// Eén centrale plek om een bot te doden: telt altijd de score, laat Swarmqueen/Bomber hun dood-effect
// afgaan, en past (als een shooterUid bekend is) Vampirisme/Shockwave/Overkill/killstreak-teller toe —
// zodat iedere kill-oorzaak (kogel-treffer, gif/brand-schade-over-tijd, kettingbliksem, shatter-splash,
// zwart-gat) hetzelfde gedrag krijgt, net als single-player's handleBotDeath(). Munten spawnen HIER
// niet meer (dat gebeurt periodiek, zie coopSpawnCoin).
function coopKillBot(bot, shooterUid, now) {
  if (bot.dead) return;
  bot.dead = true;
  if (now === undefined) now = performance.now();
  coopSim.score += bot.scoreValue;

  // Swarmqueen splitst bij dood in 2 zwakke minions, ongeacht de doodsoorzaak
  if (bot.splits) {
    for (let i = 0; i < 2; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 15;
      coopSim.bots.push({
        id: coopSim.nextId++, type: 'swarmling', pattern: 'single',
        x: Math.max(10, Math.min(canvas.width - 10, bot.x + Math.cos(ang) * dist)),
        y: Math.max(10, Math.min(canvas.height - 10, bot.y + Math.sin(ang) * dist)),
        r: 10, color: bot.color, speed: 2.2, hp: 1, maxHp: 1, bulletSpeed: 5, bulletDmg: 0, meleeDmg: 0,
        shootCooldown: 1400, lastAttack: 0, spiralAngle: 0, splits: false,
        frozenUntil: 0, rootedUntil: 0, slashUntil: 0, invulnUntil: 0, immortal: false, isBoss: false,
        poisonUntil: 0, igniteUntil: 0, lastPoisonTick: 0, lastIgniteTick: 0, poisonSpread: false, scoreValue: 10
      });
    }
  }
  // Toxic Cannon: gif verspreidt zich naar bots in de buurt zodra een vergiftigde bot sterft, ongeacht doodsoorzaak
  if (bot.poisonSpread) {
    coopSim.bots.forEach(other => {
      if (other === bot || other.dead) return;
      if (Math.hypot(other.x - bot.x, other.y - bot.y) < 80) {
        other.poisonUntil = Math.max(other.poisonUntil || 0, now + 3000);
        other.poisonSpread = true;
        other.poisonOwnerUid = bot.poisonOwnerUid;
      }
    });
  }
  // Bomber ontploft ook als hij op een andere manier dan zijn eigen aanval sterft: schade aan bots eromheen
  if (bot.pattern === 'suicide') {
    coopSim.bots.forEach(other => {
      if (other === bot || other.dead) return;
      if (Math.hypot(other.x - bot.x, other.y - bot.y) < 65) {
        other.hp -= 4;
        if (other.hp <= 0) coopKillBot(other, shooterUid, now);
      }
    });
  }
  if (shooterUid) coopApplyKillEffects(shooterUid, bot, now);
}

// Vampirisme/Shockwave/Overkill/killstreak-teller gelden voor ELKE kill-oorzaak (niet alleen een
// directe kogel-treffer), net als single-player's handleBotDeath().
function coopApplyKillEffects(shooterUid, bot, now) {
  const shooter = coopSim.players[shooterUid];
  if (!shooter) return;
  if (shooter.weaponEffect === 'killstreak') shooter.killStreak++;
  shooter.lastKillAt = now;
  if (shooter.coreVampireHeal > 0) shooter.hp = Math.min(shooter.maxHp, shooter.hp + shooter.coreVampireHeal); // Kern-vampirisme: heelt bij ELKE kill
  if (shooter.shockwaveLevel > 0) {
    const swRadius = SHOCKWAVE_RADII[shooter.shockwaveLevel - 1];
    const swDmg = 5 + shooter.shockwaveLevel * 2;
    coopSim.bots.forEach(other => {
      if (other === bot || other.dead) return;
      if (Math.hypot(other.x - bot.x, other.y - bot.y) < swRadius) {
        other.hp -= swDmg;
        if (other.hp <= 0) coopKillBot(other, shooterUid, now);
      }
    });
  }
  if (shooter.overkillLevel > 0 && -bot.hp > bot.maxHp * 0.2) {
    const overkillExcess = -bot.hp; // bot.hp staat al op <=0, dus dit is het schade-overschot
    const okRadius = 60 + shooter.overkillLevel * 30;
    const okDmg = Math.max(3, Math.round(overkillExcess * 0.3));
    coopSim.bots.forEach(other => {
      if (other === bot || other.dead) return;
      if (Math.hypot(other.x - bot.x, other.y - bot.y) < okRadius) {
        other.hp -= okDmg;
        if (other.hp <= 0) coopKillBot(other, shooterUid, now);
      }
    });
  }
}

function coopFireBotBullet(bot, angle, speedMult) {
  coopSim.bullets.push({
    id: coopSim.nextId++, owner: 'bot',
    x: bot.x + Math.cos(angle) * (bot.r + 5), y: bot.y + Math.sin(angle) * (bot.r + 5),
    vx: Math.cos(angle) * bot.bulletSpeed * (speedMult || 1), vy: Math.sin(angle) * bot.bulletSpeed * (speedMult || 1),
    r: bot.pattern === 'fast' ? 3 : 4,
    dmg: bot.bulletDmg || (bot.pattern === 'fast' ? 15 : 8),
    color: bot.color
  });
}

function coopNearestAlivePlayer(bot) {
  if (!coopSim) return null;
  const alive = Object.values(coopSim.players).filter(p => p.alive);
  if (!alive.length) return null;
  let best = alive[0], bd = Math.hypot(best.x - bot.x, best.y - bot.y);
  alive.forEach(p => { const d = Math.hypot(p.x - bot.x, p.y - bot.y); if (d < bd) { bd = d; best = p; } });
  return best;
}

// Zelfde kogel-volleys per pattern als single-player's botShoot() (combat.js) — dekt alle patronen die
// in de basis-BOT_TYPES-roster voorkomen (de zeldzame SPECIAL_BOT_TYPES-patronen als mortier/gifwolk
// komen in Co-op nog niet voor, zie coopPickBotType()).
function coopBotShoot(bot, baseAngle) {
  if (bot.pattern === 'fast') {
    coopFireBotBullet(bot, baseAngle, 1.4);
  } else if (bot.pattern === 'triple') {
    const spread = 0.22;
    coopFireBotBullet(bot, baseAngle - spread);
    coopFireBotBullet(bot, baseAngle);
    coopFireBotBullet(bot, baseAngle + spread);
  } else if (bot.pattern === 'burst') {
    let count = 0;
    const burstInterval = setInterval(() => {
      if (bot.dead || !coopSim || coopRole !== 'host') { clearInterval(burstInterval); return; }
      const nearest = coopNearestAlivePlayer(bot);
      if (nearest) coopFireBotBullet(bot, Math.atan2(nearest.y - bot.y, nearest.x - bot.x));
      count++;
      if (count >= 3) clearInterval(burstInterval);
    }, 120);
  } else if (bot.pattern === 'circle') {
    const n = 8;
    for (let i = 0; i < n; i++) coopFireBotBullet(bot, (Math.PI * 2 / n) * i);
  } else if (bot.pattern === 'double') {
    coopFireBotBullet(bot, baseAngle);
    setTimeout(() => {
      if (bot.dead || !coopSim || coopRole !== 'host') return;
      const nearest = coopNearestAlivePlayer(bot);
      if (nearest) coopFireBotBullet(bot, Math.atan2(nearest.y - bot.y, nearest.x - bot.x));
    }, 150);
  } else if (bot.pattern === 'wide') {
    const spread = 0.16;
    for (let i = -2; i <= 2; i++) coopFireBotBullet(bot, baseAngle + spread * i);
  } else if (bot.pattern === 'megaburst') {
    const n = 8;
    let wave = 0;
    const doWave = () => {
      if (bot.dead || !coopSim || coopRole !== 'host') return;
      for (let i = 0; i < n; i++) coopFireBotBullet(bot, (Math.PI * 2 / n) * i + wave * 0.2);
      wave++;
      if (wave < 3) setTimeout(doWave, 220);
    };
    doWave();
  } else if (bot.pattern === 'spiral') {
    bot.spiralAngle = (bot.spiralAngle || 0) + 0.5;
    coopFireBotBullet(bot, bot.spiralAngle);
  } else {
    // 'single' en alles wat hier verder nog binnenkomt: één gericht schot
    coopFireBotBullet(bot, baseAngle);
  }
}

function coopSpawnCoin() {
  const margin = 60;
  coopSim.coins.push({
    id: coopSim.nextId++,
    x: margin + Math.random() * (canvas.width - margin * 2),
    y: margin + Math.random() * (canvas.height - margin * 2),
    value: COOP_COIN_VALUE_MIN + Math.floor(Math.random() * (COOP_COIN_VALUE_MAX - COOP_COIN_VALUE_MIN + 1)),
    born: performance.now()
  });
}

function coopSpawnPowerup() {
  const type = COOP_POWERUP_TYPES[Math.floor(Math.random() * COOP_POWERUP_TYPES.length)];
  coopSim.powerups.push({
    id: coopSim.nextId++, type,
    x: COOP_ARENA_MARGIN + 60 + Math.random() * (canvas.width - 2 * (COOP_ARENA_MARGIN + 60)),
    y: COOP_ARENA_MARGIN + 60 + Math.random() * (canvas.height - 2 * (COOP_ARENA_MARGIN + 60)),
    born: performance.now()
  });
}

// Zelfde progressie als single-player Endless (pickBotType() in player.js): bottypes ontgrendelen op
// basis van score, Splitter is beperkt tot MAX_SPLITTERS_ALIVE tegelijk. De 11 zeldzame SPECIAL_BOT_TYPES
// (met exotische aanvalspatronen als mortier/gifwolk/gravity well) en bosses zijn in Co-op nog niet
// geïmplementeerd, dus die worden hier bewust nog overgeslagen.
function coopPickBotType() {
  let unlocked = BOT_TYPES.filter(t => coopSim.score >= t.minScore);
  const splitterCount = coopSim.bots.filter(b => !b.dead && b.type === 'splitter').length;
  if (splitterCount >= MAX_SPLITTERS_ALIVE) {
    const withoutSplitter = unlocked.filter(t => t.name !== 'splitter');
    if (withoutSplitter.length) unlocked = withoutSplitter;
  }
  return unlocked[Math.floor(Math.random() * unlocked.length)];
}

function coopSpawnBot() {
  const def = coopPickBotType();
  let x, y;
  if (COOP_STATIONARY_PATTERNS.includes(def.pattern)) {
    // Stilstaande bots (turrets) bewegen nooit, dus ze moeten meteen binnen beeld verschijnen —
    // buiten beeld spawnen zou ze voorgoed onzichtbaar laten staan.
    const margin = 80;
    x = margin + Math.random() * (canvas.width - margin * 2);
    y = margin + Math.random() * (canvas.height - margin * 2);
  } else {
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) { x = Math.random() * canvas.width; y = -20; }
    else if (edge === 1) { x = canvas.width + 20; y = Math.random() * canvas.height; }
    else if (edge === 2) { x = Math.random() * canvas.width; y = canvas.height + 20; }
    else { x = -20; y = Math.random() * canvas.height; }
  }
  coopSim.bots.push({
    id: coopSim.nextId++,
    type: def.name, pattern: def.pattern,
    x, y, r: def.r, color: def.color(),
    speed: def.speed[0] + Math.random() * (def.speed[1] - def.speed[0]),
    hp: def.hp, maxHp: def.hp,
    bulletSpeed: def.bulletSpeed || 5,
    bulletDmg: def.bulletDmg || 0,
    meleeDmg: def.meleeDamage || 10,
    shootCooldown: def.cooldown[0] + Math.random() * (def.cooldown[1] - def.cooldown[0]),
    lastAttack: 0, spiralAngle: 0,
    splits: def.splits || false,
    frozenUntil: 0, rootedUntil: 0, slashUntil: 0, invulnUntil: 0, immortal: false, isBoss: false,
    poisonUntil: 0, igniteUntil: 0, lastPoisonTick: 0, lastIgniteTick: 0, poisonSpread: false,
    scoreValue: def.hp >= 10 ? 40 : def.hp >= 6 ? 25 : def.hp >= 3 ? 15 : 10
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
    id: b.id, x: Math.round(b.x), y: Math.round(b.y), hp: b.hp, maxHp: b.maxHp, r: b.r, color: b.color, type: b.type, pattern: b.pattern,
    frozenUntil: b.frozenUntil || 0, rootedUntil: 0, slashUntil: 0, invulnUntil: 0, immortal: false, isBoss: false
  }));
  const bullets = coopSim.bullets.slice(0, COOP_MAX_BULLETS_SENT).map(b => ({ x: Math.round(b.x), y: Math.round(b.y), r: b.r, color: b.color }));
  const coins = coopSim.coins.map(c => ({ x: Math.round(c.x), y: Math.round(c.y) }));
  const powerups = coopSim.powerups.map(pu => ({ x: Math.round(pu.x), y: Math.round(pu.y), type: pu.type }));
  const blackholes = coopSim.blackholes.map(bh => ({ x: Math.round(bh.x), y: Math.round(bh.y), age: performance.now() - bh.born }));
  db.collection('lobbies').doc(coopLobbyCode).collection('state').doc('live')
    .set({ players, bots, bullets, coins, powerups, blackholes, botCount: coopSim.bots.length, score: coopSim.score, status: coopSim.status, updatedAt: Date.now() })
    .catch(() => {});
}

function coopEndMatch() {
  if (!coopSim) return;
  coopSim.status = 'ended';
  coopPushHostState();
  coopShowMatchOverlay('Alle spelers zijn uitgeschakeld');
}

// ---- Gast: renderen wat de host stuurt ----
// De host tekent zijn eigen simulatie 60x/sec, maar een gast krijgt maar zo'n 5x/sec een nieuwe
// snapshot binnen via Firestore (COOP_STATE_PUSH_MS). Zonder meer zou dat elke keer een zichtbare
// sprong geven ("lag/glitch") — daarom wordt hier per speler/bot elke render-frame een stukje
// (COOP_SMOOTH_FACTOR) richting de laatst ontvangen positie bewogen i.p.v. er meteen naartoe te
// springen, zodat beweging er op een gast-scherm net zo vloeiend uitziet als bij de host.
const COOP_SMOOTH_FACTOR = 0.3;
let coopGuestDisplay = { players: {}, bots: {} };

function coopSmoothEntity(displayMap, key, target) {
  let d = displayMap[key];
  if (!d) { d = { ...target }; displayMap[key] = d; return d; }
  d.x += (target.x - d.x) * COOP_SMOOTH_FACTOR;
  d.y += (target.y - d.y) * COOP_SMOOTH_FACTOR;
  Object.keys(target).forEach(k => { if (k !== 'x' && k !== 'y') d[k] = target[k]; });
  return d;
}

function coopBuildSmoothedGuestState(remote) {
  const newPlayers = {};
  Object.keys(remote.players || {}).forEach(uid => {
    newPlayers[uid] = coopSmoothEntity(coopGuestDisplay.players, uid, remote.players[uid]);
  });
  coopGuestDisplay.players = newPlayers;
  const newBots = {};
  (remote.bots || []).forEach(b => { newBots[b.id] = coopSmoothEntity(coopGuestDisplay.bots, b.id, b); });
  coopGuestDisplay.bots = newBots;
  return {
    score: remote.score, botCount: remote.botCount, status: remote.status,
    players: newPlayers, bots: Object.values(newBots),
    // Kogels/munten/powerups/zwarte gaten bewegen snel of helemaal niet — die rechtstreeks doorgeven
    // (glad strijken zou kogels juist trager/verkeerd laten aanvoelen)
    bullets: remote.bullets || [], coins: remote.coins || [], powerups: remote.powerups || [], blackholes: remote.blackholes || []
  };
}

function coopGuestRenderLoop() {
  if (coopRole !== 'guest') return;
  if (coopRemoteState) {
    const smoothed = coopBuildSmoothedGuestState(coopRemoteState);
    coopRenderFrame(smoothed);
    coopUpdateHud(smoothed);
    coopSyncMyCoins(smoothed.players && smoothed.players[currentUid]);
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

  // Munten/powerups/zwarte gaten: de ECHTE drawCoinPickup()/drawPowerup()/drawBlackHole() uit render.js,
  // zodat deze er precies zo uitzien als in single-player i.p.v. eigen verzonnen vormen.
  (state.coins || []).forEach(c => drawCoinPickup({ x: c.x, y: c.y, r: 11 }));
  (state.powerups || []).forEach(pu => drawPowerup({ x: pu.x, y: pu.y, r: 14, type: pu.type }));
  (state.blackholes || []).forEach(bh => drawBlackHole({
    x: bh.x, y: bh.y, radius: COOP_BLACKHOLE_RADIUS, duration: COOP_BLACKHOLE_DURATION,
    born: performance.now() - (bh.age || 0) // eigen klok van deze client, zie toelichting bovenaan het bestand
  }));

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
  const botCountEl = document.getElementById('coopBotCountVal');
  if (botCountEl) botCountEl.textContent = typeof state.botCount === 'number' ? state.botCount : (state.bots || []).length;
  const coinEl = document.getElementById('coopCoinVal');
  if (coinEl) {
    const me = state.players && state.players[currentUid];
    coinEl.textContent = me ? Math.round(me.coinsEarned || 0) : 0;
  }
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
