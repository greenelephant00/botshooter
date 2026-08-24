function saveShopState() {
  localStorage.setItem('botShooterCoins', coins);
  localStorage.setItem('botShooterOwnedWeapons', JSON.stringify(ownedWeapons));
  localStorage.setItem('botShooterOwnedArmor', JSON.stringify(ownedArmor));
  localStorage.setItem('botShooterEquippedWeapon', equippedWeapon);
  localStorage.setItem('botShooterEquippedArmor', equippedArmor);
  localStorage.setItem('botShooterEquippedArmor2', equippedArmor2);
  localStorage.setItem('botShooterHasDualArmor', hasDualArmor);
  localStorage.setItem('botShooterLvlExtraHp', lvlExtraHp);
  localStorage.setItem('botShooterLvlSprint', lvlSprint);
  localStorage.setItem('botShooterLvlMagnet', lvlMagnet);
  localStorage.setItem('botShooterLvlLongBoosts', lvlLongBoosts);
  localStorage.setItem('botShooterHasRevive', hasRevive);
  localStorage.setItem('botShooterLvlFastReload', lvlFastReload);
  localStorage.setItem('botShooterLvlIronSkin', lvlIronSkin);
  localStorage.setItem('botShooterLvlLuckyDrop', lvlLuckyDrop);
  localStorage.setItem('botShooterLvlPiercingRounds', lvlPiercingRounds);
  localStorage.setItem('botShooterLvlCoinRain', lvlCoinRain);
  localStorage.setItem('botShooterLvlSecondWind', lvlSecondWind);
  localStorage.setItem('botShooterLvlSharpshooter', lvlSharpshooter);
  localStorage.setItem('botShooterLvlFlyingStart', lvlFlyingStart);
  localStorage.setItem('botShooterLvlCriticalHit', lvlCriticalHit);
  localStorage.setItem('botShooterLvlSplinterShot', lvlSplinterShot);
  localStorage.setItem('botShooterLvlShockwave', lvlShockwave);
  localStorage.setItem('botShooterLvlMultiShield', lvlMultiShield);
  localStorage.setItem('botShooterLvlGoldRush', lvlGoldRush);
  localStorage.setItem('botShooterLvlOverkill', lvlOverkill);
  localStorage.setItem('botShooterLvlBloodlust', lvlBloodlust);
  localStorage.setItem('botShooterPowerupLevels', JSON.stringify(powerupLevels));
  localStorage.setItem('botShooterOwnedSkins', JSON.stringify(ownedSkins));
  localStorage.setItem('botShooterEquippedSkin', equippedSkin);
  localStorage.setItem('botShooterOwnedTransforms', JSON.stringify(ownedTransforms));
  localStorage.setItem('botShooterEquippedTransform', equippedTransform);
}

function openShop() {
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('shopScreen').style.display = 'flex';
  renderShop();
}
window.openShop = openShop;

function scrollToShopSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.scrollToShopSection = scrollToShopSection;

function closeShop() {
  document.getElementById('shopScreen').style.display = 'none';
  document.getElementById('startScreen').style.display = 'flex';
  document.getElementById('startCoins').textContent = coins;
}
window.closeShop = closeShop;

function openPowerupShop() {
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('powerupShopScreen').style.display = 'flex';
  renderPowerupShop();
}
window.openPowerupShop = openPowerupShop;

function closePowerupShop() {
  document.getElementById('powerupShopScreen').style.display = 'none';
  document.getElementById('startScreen').style.display = 'flex';
  document.getElementById('startCoins').textContent = coins;
}
window.closePowerupShop = closePowerupShop;

function buyPowerupUpgrade(id) {
  const info = POWERUP_LEVELS[id];
  const level = getPuLevel(id);
  if (!info || level >= info.prices.length || coins < info.prices[level]) return;
  coins -= info.prices[level];
  powerupLevels[id] = level + 1;
  saveShopState();
  renderPowerupShop();
}
window.buyPowerupUpgrade = buyPowerupUpgrade;

function powerupDescForLevel(id) {
  const info = POWERUP_LEVELS[id];
  const level = getPuLevel(id);
  const parts = [];
  if (info.durations) {
    const sec = (info.durations[level] / 1000).toFixed(1).replace(/\.0$/, '');
    parts.push(`${sec} sec duur`);
  }
  if (info.heals) parts.push(`+${info.heals[level]} HP`);
  if (info.dmgs) parts.push(`${info.dmgs[level]} schade aan alle bots`);
  if (info.pellets) parts.push(`${info.pellets[level]} kogels tegelijk`);
  const effectDesc = info.desc ? `${info.desc} ` : '';
  const current = `${effectDesc}Huidig (Lv. ${level}): ${parts.join(', ')}.`;
  if (level >= info.prices.length) return `${current} Max niveau bereikt.`;
  const nextParts = [];
  if (info.durations) {
    const sec = (info.durations[level + 1] / 1000).toFixed(1).replace(/\.0$/, '');
    nextParts.push(`${sec} sec duur`);
  }
  if (info.heals) nextParts.push(`+${info.heals[level + 1]} HP`);
  if (info.dmgs) nextParts.push(`${info.dmgs[level + 1]} schade aan alle bots`);
  if (info.pellets) nextParts.push(`${info.pellets[level + 1]} kogels tegelijk`);
  return `${current} Volgend niveau: ${nextParts.join(', ')}.`;
}

function renderPowerupShop() {
  document.getElementById('powerupShopCoins').textContent = coins;
  document.getElementById('powerupShopList').innerHTML = POWERUP_IDS.map(id => {
    const info = POWERUP_LEVELS[id];
    const level = getPuLevel(id);
    const maxLevel = info.prices.length;
    const maxed = level >= maxLevel;
    const btn = maxed
      ? `<button class="equipped" disabled>Max niveau (${maxLevel})</button>`
      : `<button class="buy" onclick="buyPowerupUpgrade('${id}')" ${coins < info.prices[level] ? 'disabled' : ''}>Koop niveau ${level + 1}/${maxLevel} · 🪙${info.prices[level]}</button>`;
    return `<div class="shopItem"><div class="info"><div class="name">${info.name} (Lv. ${level}/${maxLevel})</div><div class="desc">${powerupDescForLevel(id)}</div></div>${btn}</div>`;
  }).join('');
}

// ---- Bot info scherm ----
const BOT_DISPLAY_NAMES = {
  grunt: 'Grunt', runner: 'Runner', heavy: 'Heavy', tank: 'Tank', sniper: 'Sniper',
  brute: 'Brute (mes)', spinner: 'Spinner', chaser: 'Chaser', shielder: 'Shielder',
  ghost: 'Ghost', turret: 'Turret', bomber: 'Bomber',
  overlord: 'Overlord', phantom: 'Phantom', artillery: 'Artillery',
  swarmqueen: 'Swarmqueen', vortex: 'Vortex', swapper: 'Swapper',
  colossus: 'Colossus', titan: 'Titan', behemoth: 'Behemoth', nemesis: 'Nemesis'
};
const BOT_PATTERN_INFO = {
  single:    'Schiet één kogel recht op je af.',
  fast:      'Schiet één snelle, precieze kogel (sniper).',
  triple:    'Schiet 3 kogels tegelijk in een waaier.',
  burst:     'Vuurt een burst van 3 kogels snel na elkaar.',
  circle:    'Schiet 8 kogels tegelijk in alle richtingen rondom zich.',
  double:    'Vuurt 2 snelle kogels vlak na elkaar.',
  wide:      'Schiet een brede waaier van 5 kogels tegelijk.',
  melee:     'Geen vuurwapen — valt van dichtbij aan met een mes.',
  teleport:  'Teleporteert steeds vlak bij je en schiet meteen.',
  turret:    'Staat helemaal stil, maar schiet erg snel en precies.',
  suicide:   'Geen vuurwapen — rent op je af en ontploft van dichtbij.',
  megaburst: 'Vuurt 3 golven van 8 kogels in alle richtingen, snel na elkaar (mini-boss).',
  phantom:   'Geen vuurwapen — teleporteert vlak naast je en valt aan met een mes.',
  mortar:    'Vuurt op afstand een zware, langzame granaat met een korte waarschuwing vooraf.',
  spiral:    'Schiet continu kogels in een langzaam roterende spiraal om zich heen.',
  boss:      'Vuurt regelmatig een breed salvo van 16 kogels en heeft meerdere unieke special attacks.'
};
const BOSS_SPECIAL_DESC = {
  colossus: 'Special 1 — Schokgolf: een AOE-slam rond zichzelf met een getelegrafeerde waarschuwing vooraf. Special 2 — Spervuur: 3 snelle golven van 12 kogels in alle richtingen.',
  titan:    'Special 1 — Schokgolf: een AOE-slam rond zichzelf met een getelegrafeerde waarschuwing vooraf. Special 2 — Meteorregen: 4 getelegrafeerde inslagen rond je positie, kort na elkaar.',
  behemoth: 'Special 1 — Schokgolf: een AOE-slam rond zichzelf met een getelegrafeerde waarschuwing vooraf. Special 2 — Laserstraal: een gerichte, doorlopende straal met een korte waarschuwing vooraf.',
  nemesis:  'Special 1 — Schokgolf: een AOE-slam rond zichzelf met een getelegrafeerde waarschuwing vooraf. Special 2 — Doemspiraal: meerdere snelle golven roterende kogels die de hele arena vullen. Special 3 — Kruislaser: twee gelijktijdige, doorlopende laserstralen in een kruispatroon met een korte waarschuwing vooraf. De sterkste en taaiste boss in het spel.'
};

function botDamageText(type) {
  if (type.pattern === 'melee' || type.pattern === 'suicide' || type.pattern === 'phantom') {
    return `${type.meleeDamage || 15} schade per aanval (van dichtbij)`;
  }
  if (type.pattern === 'mortar') {
    return `${type.meleeDamage || 40} schade per inslag (op afstand)`;
  }
  if (type.pattern === 'boss') {
    return `8 schade per kogel + ${type.specialDmg || 30} schade bij schokgolf-aanval`;
  }
  if (type.pattern === 'fast') {
    return '15 schade per kogel (precisieschot)';
  }
  if (type.bulletDmg) {
    return `${type.bulletDmg} schade per kogel`;
  }
  return '8 schade per kogel';
}

function openBotsInfo() {
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('botsInfoScreen').style.display = 'flex';
  renderBotsInfo();
}
window.openBotsInfo = openBotsInfo;

function closeBotsInfo() {
  document.getElementById('botsInfoScreen').style.display = 'none';
  document.getElementById('startScreen').style.display = 'flex';
}
window.closeBotsInfo = closeBotsInfo;

function startPractice(botName) {
  const type = [...BOT_TYPES, ...SPECIAL_BOT_TYPES, ...BOSS_TYPES].find(t => t.name === botName);
  if (!type) return;

  gameMode = 'practice';
  practiceWeaponId = null;
  weaponPracticeActive = false;
  transformPracticeActive = false;
  document.getElementById('botsInfoScreen').style.display = 'none';
  document.getElementById('levelHud').style.display = 'none';

  resetPlayer();
  bots = [];
  bullets = [];
  particles = [];
  powerups = [];
  coinPickups = [];
  explosions = [];
  telegraphs = [];
  lightningBolts = [];
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
  chargeTrails = [];
  deployedTurrets = [];
  score = 0;
  gameOver = false;
  isPaused = false;
  levelTransition = false;
  bossAlive = false;
  bossWarningActive = false;
  lastPowerupSpawn = performance.now();
  lastCoinSpawn = performance.now();

  // speler links, bot rechts in een rustige, lege oefenruimte
  player.x = canvas.width * 0.25;
  player.y = canvas.height / 2;

  bots.push({
    x: canvas.width * 0.7,
    y: canvas.height / 2,
    r: type.r,
    speed: (type.speed[0] + type.speed[1]) / 2,
    hp: type.hp,
    maxHp: type.hp,
    lastShot: 0,
    shootCooldown: (type.cooldown[0] + type.cooldown[1]) / 2,
    color: type.color(),
    type: type.name,
    pattern: type.pattern,
    bulletSpeed: type.bulletSpeed,
    meleeDamage: type.meleeDamage || 0,
    splits: false,
    spiralAngle: 0,
    specialALastUsed: performance.now(),
    specialACooldown: type.specialACooldown,
    specialBLastUsed: performance.now() + 2000,
    specialBCooldown: type.specialBCooldown,
    specialCLastUsed: performance.now() + 4000,
    specialCCooldown: type.specialCCooldown,
    specialDmg: type.specialDmg || 30,
    isBoss: false, // telt niet als echte boss-kill/overlay in de oefenruimte
    immortal: true,
    frozenUntil: 0,
    slashUntil: 0
  });

  updateHUD();
  document.getElementById('pauseOverlay').style.display = 'none';
  document.getElementById('msg').style.display = 'none';

  if (!loopRunning) {
    loopRunning = true;
    loop();
  }
  startMusic();
}
window.startPractice = startPractice;

const DODGE_PRACTICE_MAX_TURRETS = 10;

function startDodgePractice() {
  // Speciale oefensessie: een ring van stilstaande turrets, puur om te oefenen met kogels
  // ontwijken. Net als bij bot-oefenen (gameMode 'practice') krijg je automatisch je volle
  // HP terug in plaats van dat het potje eindigt. Aantal turrets is vooraf instelbaar (max 10).
  const turretType = BOT_TYPES.find(t => t.name === 'turret');
  if (!turretType) return;
  const countInput = document.getElementById('dodgeTurretCount');
  const requested = countInput ? parseInt(countInput.value, 10) : 4;
  const turretCount = Math.max(1, Math.min(DODGE_PRACTICE_MAX_TURRETS, isNaN(requested) ? 4 : requested));
  if (countInput) countInput.value = turretCount;

  gameMode = 'practice';
  practiceWeaponId = null;
  weaponPracticeActive = false;
  transformPracticeActive = false;
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('levelHud').style.display = 'none';

  resetPlayer();
  bots = [];
  bullets = [];
  particles = [];
  powerups = [];
  coinPickups = [];
  explosions = [];
  telegraphs = [];
  lightningBolts = [];
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
  chargeTrails = [];
  deployedTurrets = [];
  score = 0;
  gameOver = false;
  isPaused = false;
  levelTransition = false;
  bossAlive = false;
  bossWarningActive = false;
  lastPowerupSpawn = performance.now();
  lastCoinSpawn = performance.now();

  player.x = canvas.width / 2;
  player.y = canvas.height / 2;

  // Alle turrets op een rijtje langs de linkerrand
  const marginX = 70;
  const marginY = 80;
  const usableHeight = Math.max(1, canvas.height - marginY * 2);
  for (let i = 0; i < turretCount; i++) {
    const ty = turretCount > 1 ? marginY + (usableHeight / (turretCount - 1)) * i : canvas.height / 2;
    bots.push({
      x: marginX,
      y: ty,
      r: turretType.r,
      speed: 0,
      hp: turretType.hp,
      maxHp: turretType.hp,
      lastShot: 0,
      shootCooldown: (turretType.cooldown[0] + turretType.cooldown[1]) / 2,
      color: turretType.color(),
      type: turretType.name,
      pattern: turretType.pattern,
      bulletSpeed: turretType.bulletSpeed,
      meleeDamage: 0,
      splits: false,
      spiralAngle: 0,
      isBoss: false,
      immortal: true,
      frozenUntil: 0,
      slashUntil: 0
    });
  }

  updateHUD();
  document.getElementById('pauseOverlay').style.display = 'none';
  document.getElementById('msg').style.display = 'none';

  if (!loopRunning) {
    loopRunning = true;
    loop();
  }
  startMusic();
}
window.startDodgePractice = startDodgePractice;

let weaponPracticeActive = false;
let transformPracticeActive = false;
let transformPracticeId = 'none';

function startWeaponPractice(weaponId) {
  practiceWeaponId = weaponId;
  weaponPracticeActive = true;
  transformPracticeActive = false;
  gameMode = 'endless';
  document.getElementById('shopScreen').style.display = 'none';
  initGame();
  updateHUD();
  document.getElementById('pauseOverlay').style.display = 'none';
  document.getElementById('msg').style.display = 'none';

  if (!loopRunning) {
    loopRunning = true;
    loop();
  }
  startMusic();
}
window.startWeaponPractice = startWeaponPractice;

function startTransformPractice(id) {
  practiceWeaponId = null;
  weaponPracticeActive = false;
  transformPracticeActive = true;
  transformPracticeId = id;
  gameMode = 'endless';
  document.getElementById('transformShopScreen').style.display = 'none';
  initGame();
  updateHUD();
  document.getElementById('pauseOverlay').style.display = 'none';
  document.getElementById('msg').style.display = 'none';

  if (!loopRunning) {
    loopRunning = true;
    loop();
  }
  startMusic();
}
window.startTransformPractice = startTransformPractice;

function speedLabel(type) {
  const [min, max] = type.speed;
  if (max === 0) return 'Staat helemaal stil';
  const avg = (min + max) / 2;
  return `${avg.toFixed(1)} (bereik ${min.toFixed(1)}–${max.toFixed(1)})`;
}

function botCardHtml(type) {
  const name = BOT_DISPLAY_NAMES[type.name] || type.name;
  let patternDesc = (BOT_PATTERN_INFO[type.pattern] || '') + (type.splits ? ' Splitst bij dood in 2 zwakke minions.' : '')
    + (type.swapOnHit ? ' Schiet 2x per sec — als een kogel je raakt wissel je van plek met deze bot en word je 3 sec vertraagd (zolang hij nog leeft).' : '');
  if (type.pattern === 'boss' && BOSS_SPECIAL_DESC[type.name]) {
    patternDesc += ' ' + BOSS_SPECIAL_DESC[type.name];
  }
  const maxAvgSpeed = 3.6; // snelste bot in het spel (chaser), gebruikt als vaste referentie
  const avgSpeed = (type.speed[0] + type.speed[1]) / 2;
  const speedPct = Math.max(3, Math.round((avgSpeed / maxAvgSpeed) * 100));
  const unlockText = type.pattern === 'boss'
    ? `Verschijnt één keer per potje: vanaf score ${type.minScore} (endless) of level ${type.minLevel} (levels), met waarschuwing vooraf`
    : `Verschijnt vanaf: score ${type.minScore} (endless) / level ${type.minLevel} (levels)`;
  return `<div class="shopItem" style="align-items:flex-start;">
    <canvas class="botPreview" id="botPreview_${type.name}" width="60" height="60"></canvas>
    <div class="info">
      <div class="name">${name}</div>
      <div class="desc">HP: ${type.hp} &nbsp;·&nbsp; ${botDamageText(type)}</div>
      <div class="desc">Snelheid: ${speedLabel(type)}</div>
      <div class="speedBar"><div class="speedBarFill" style="width:${speedPct}%"></div></div>
      <div class="desc">${patternDesc}</div>
      <div class="desc" style="color:#777;">${unlockText}</div>
    </div>
    <button class="equip" onclick="startPractice('${type.name}')">🎯 Oefen</button>
  </div>`;
}

function renderBotsInfo() {
  const normalHtml = BOT_TYPES.map(botCardHtml).join('');
  const specialHtml = SPECIAL_BOT_TYPES.map(botCardHtml).join('');
  const bossHtml = BOSS_TYPES.map(botCardHtml).join('');
  document.getElementById('botsInfoList').innerHTML = normalHtml;
  document.getElementById('specialBotsInfoList').innerHTML = specialHtml;
  document.getElementById('bossInfoList').innerHTML = bossHtml;
  [...BOT_TYPES, ...SPECIAL_BOT_TYPES, ...BOSS_TYPES].forEach(type => {
    const canvasEl = document.getElementById(`botPreview_${type.name}`);
    if (canvasEl) drawBotPreview(canvasEl, type);
  });
}

function drawBotPreview(canvasEl, type) {
  const c = canvasEl.getContext('2d');
  const w = canvasEl.width, h = canvasEl.height;
  c.clearRect(0, 0, w, h);
  const maxR = 82; // nemesis heeft de grootste radius in het spel
  const previewMaxR = 22;
  const r = Math.max(9, (type.r / maxR) * previewMaxR);
  const cx = w / 2 - 6; // iets naar links, zodat wapen/mes rechts past
  const cy = h / 2;
  c.save();
  c.translate(cx, cy);
  if (type.pattern === 'boss') {
    c.strokeStyle = 'rgba(255,56,56,0.7)';
    c.lineWidth = 3;
    c.beginPath(); c.arc(0, 0, r + 6, 0, Math.PI * 2); c.stroke();
  }
  c.fillStyle = type.color();
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  if (type.pattern === 'melee') {
    // mes
    c.fillStyle = '#e8e8e8';
    c.beginPath();
    c.moveTo(r - 2, -3); c.lineTo(r + 14, 0); c.lineTo(r - 2, 3); c.closePath(); c.fill();
    c.fillStyle = '#555';
    c.fillRect(r - 6, -2, 6, 4);
  } else if (type.pattern === 'suicide') {
    // bomber: dreigende rode gloed, geen wapen
    c.strokeStyle = 'rgba(255,56,56,0.8)';
    c.lineWidth = 2;
    c.beginPath(); c.arc(0, 0, r + 5, 0, Math.PI * 2); c.stroke();
  } else if (type.pattern === 'turret') {
    c.fillStyle = '#111';
    c.fillRect(-r * 0.6, -r * 0.6, r * 1.2, r * 1.2);
    c.fillStyle = '#444';
    c.fillRect(0, -3, r + 10, 6);
  } else {
    c.fillStyle = '#222';
    c.fillRect(0, -3, r + 7, 6);
  }
  c.restore();
}

function buyWeapon(id) {
  const w = WEAPONS.find(x => x.id === id) || SPECIAL_WEAPONS.find(x => x.id === id);
  if (!w || ownedWeapons.includes(id) || coins < w.price) return;
  coins -= w.price;
  ownedWeapons.push(id);
  saveShopState();
  renderShop();
}
window.buyWeapon = buyWeapon;

function equipWeapon(id) {
  if (!ownedWeapons.includes(id)) return;
  equippedWeapon = id;
  saveShopState();
  renderShop();
}
window.equipWeapon = equipWeapon;

function buyArmor(id) {
  const a = ARMOR.find(x => x.id === id);
  if (!a || ownedArmor.includes(id) || coins < a.price) return;
  coins -= a.price;
  ownedArmor.push(id);
  saveShopState();
  renderShop();
}
window.buyArmor = buyArmor;

function equipArmor(id) {
  if (!ownedArmor.includes(id)) return;
  equippedArmor = id;
  saveShopState();
  renderShop();
}
window.equipArmor = equipArmor;

function equipArmor2(id) {
  if (!hasDualArmor || !ownedArmor.includes(id)) return;
  equippedArmor2 = id;
  saveShopState();
  renderShop();
}
window.equipArmor2 = equipArmor2;

function buyDualArmorSlot() {
  if (hasDualArmor || coins < DUAL_ARMOR_PRICE) return;
  coins -= DUAL_ARMOR_PRICE;
  hasDualArmor = true;
  saveShopState();
  renderShop();
}
window.buyDualArmorSlot = buyDualArmorSlot;

function buySkin(id) {
  const skin = SKINS.find(s => s.id === id);
  if (!skin || ownedSkins.includes(id) || coins < skin.price) return;
  coins -= skin.price;
  ownedSkins.push(id);
  saveShopState();
  renderSkinsShop();
}
window.buySkin = buySkin;

function equipSkin(id) {
  if (!ownedSkins.includes(id)) return;
  equippedSkin = id;
  saveShopState();
  renderSkinsShop();
}
window.equipSkin = equipSkin;

function openSkinsShop() {
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('skinsShopScreen').style.display = 'flex';
  renderSkinsShop();
}
window.openSkinsShop = openSkinsShop;

function closeSkinsShop() {
  document.getElementById('skinsShopScreen').style.display = 'none';
  document.getElementById('startScreen').style.display = 'flex';
  document.getElementById('startCoins').textContent = coins;
}
window.closeSkinsShop = closeSkinsShop;

function renderSkinsShop() {
  document.getElementById('skinsShopCoins').textContent = coins;
  document.getElementById('skinsShopList').innerHTML = SKINS.map(s => {
    const owned = ownedSkins.includes(s.id);
    const equipped = equippedSkin === s.id;
    let btn;
    if (equipped) btn = `<button class="equipped" disabled>Uitgerust</button>`;
    else if (owned) btn = `<button class="equip" onclick="equipSkin('${s.id}')">Uitrusten</button>`;
    else btn = `<button class="buy" onclick="buySkin('${s.id}')" ${coins < s.price ? 'disabled' : ''}>Koop · 🪙${s.price}</button>`;
    return `<div class="shopItem">
      <canvas class="botPreview" id="skinPreview_${s.id}" width="60" height="60"></canvas>
      <div class="info">
        <div class="name">${s.name}</div>
        <div class="desc">${s.desc}</div>
      </div>
      ${btn}
    </div>`;
  }).join('');
  SKINS.forEach(s => {
    const canvasEl = document.getElementById(`skinPreview_${s.id}`);
    if (canvasEl) drawSkinPreview(canvasEl, s.id);
  });
}

function drawSkinPreview(canvasEl, skinId) {
  const c = canvasEl.getContext('2d');
  const w = canvasEl.width, h = canvasEl.height;
  c.clearRect(0, 0, w, h);
  c.save();
  c.translate(w / 2, h / 2);
  drawPlayerSkin(c, skinId, 20);
  c.restore();
}

function buyTransform(id) {
  const t = TRANSFORMS.find(x => x.id === id);
  if (!t || ownedTransforms.includes(id) || coins < t.price) return;
  coins -= t.price;
  ownedTransforms.push(id);
  saveShopState();
  renderTransformShop();
}
window.buyTransform = buyTransform;

function equipTransform(id) {
  if (!ownedTransforms.includes(id)) return;
  equippedTransform = id;
  saveShopState();
  renderTransformShop();
}
window.equipTransform = equipTransform;

function openTransformShop() {
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('transformShopScreen').style.display = 'flex';
  renderTransformShop();
}
window.openTransformShop = openTransformShop;

function closeTransformShop() {
  document.getElementById('transformShopScreen').style.display = 'none';
  document.getElementById('startScreen').style.display = 'flex';
  document.getElementById('startCoins').textContent = coins;
}
window.closeTransformShop = closeTransformShop;

function renderTransformShop() {
  document.getElementById('transformShopCoins').textContent = coins;
  document.getElementById('transformShopList').innerHTML = TRANSFORMS.map(t => {
    const owned = ownedTransforms.includes(t.id);
    const equipped = equippedTransform === t.id;
    let btn;
    if (equipped) btn = `<button class="equipped" disabled>Uitgerust</button>`;
    else if (owned) btn = `<button class="equip" onclick="equipTransform('${t.id}')">Uitrusten</button>`;
    else btn = `<button class="buy" onclick="buyTransform('${t.id}')" ${coins < t.price ? 'disabled' : ''}>Koop · 🪙${t.price}</button>`;
    const practiceBtn = t.id !== 'none'
      ? `<button class="equip" onclick="startTransformPractice('${t.id}')">🎯 Oefen</button>`
      : '';
    return `<div class="shopItem">
      <canvas class="botPreview" id="transformPreview_${t.id}" width="60" height="60"></canvas>
      <div class="info">
        <div class="name">${t.name}</div>
        <div class="desc">${t.desc}</div>
      </div>
      <div style="display:flex; flex-direction:column; gap:6px; align-items:stretch;">${btn}${practiceBtn}</div>
    </div>`;
  }).join('');
  TRANSFORMS.forEach(t => {
    const canvasEl = document.getElementById(`transformPreview_${t.id}`);
    if (canvasEl) drawTransformPreview(canvasEl, t.id);
  });
}

function drawTransformPreview(canvasEl, transformId) {
  const c = canvasEl.getContext('2d');
  const w = canvasEl.width, h = canvasEl.height;
  c.clearRect(0, 0, w, h);
  c.save();
  c.translate(w / 2, h / 2);
  if (transformId === 'tank') drawPlayerTank(c, 20);
  else if (transformId === 'berserker') drawPlayerBerserker(c, 20);
  else if (transformId === 'sniper') drawPlayerSniperMech(c, 20);
  else if (transformId === 'swarm') drawPlayerDroneHive(c, 20);
  else if (transformId === 'pyro') drawPlayerPyro(c, 20);
  else if (transformId === 'vampire') drawPlayerVampireLord(c, 20);
  else if (transformId === 'assassin') drawPlayerAssassin(c, 20);
  else if (transformId === 'necromancer') drawPlayerNecromancer(c, 20);
  else if (transformId === 'stormcaller') drawPlayerStormCaller(c, 20);
  else if (transformId === 'juggernaut') drawPlayerJuggernaut(c, 20);
  else if (transformId === 'engineer') drawPlayerEngineer(c, 20);
  else drawPlayerSkin(c, equippedSkin, 20);
  c.restore();
}

function buyExtraHp() {
  const price = EXTRA_HP_LEVELS[lvlExtraHp];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvlExtraHp++;
  saveShopState();
  renderShop();
}
window.buyExtraHp = buyExtraHp;

function buySprint() {
  const price = SPRINT_LEVELS[lvlSprint];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvlSprint++;
  saveShopState();
  renderShop();
}
window.buySprint = buySprint;

function buyMagnet() {
  const price = MAGNET_LEVELS[lvlMagnet];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvlMagnet++;
  saveShopState();
  renderShop();
}
window.buyMagnet = buyMagnet;

function buyLongBoosts() {
  const price = LONG_BOOSTS_LEVELS[lvlLongBoosts];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvlLongBoosts++;
  saveShopState();
  renderShop();
}
window.buyLongBoosts = buyLongBoosts;

function buyRevive() {
  if (hasRevive || coins < REVIVE_PRICE) return;
  coins -= REVIVE_PRICE;
  hasRevive = true;
  saveShopState();
  renderShop();
}
window.buyRevive = buyRevive;

function buyFastReload() {
  const price = FAST_RELOAD_LEVELS[lvlFastReload];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvlFastReload++;
  saveShopState();
  renderShop();
}
window.buyFastReload = buyFastReload;

function buyIronSkin() {
  const price = IRON_SKIN_LEVELS[lvlIronSkin];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvlIronSkin++;
  saveShopState();
  renderShop();
}
window.buyIronSkin = buyIronSkin;

function buyLuckyDrop() {
  const price = LUCKY_DROP_LEVELS[lvlLuckyDrop];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvlLuckyDrop++;
  saveShopState();
  renderShop();
}
window.buyLuckyDrop = buyLuckyDrop;

function buyPiercingRounds() {
  const price = PIERCING_ROUNDS_LEVELS[lvlPiercingRounds];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvlPiercingRounds++;
  saveShopState();
  renderShop();
}
window.buyPiercingRounds = buyPiercingRounds;

function buyCoinRain() {
  const price = COIN_RAIN_LEVELS[lvlCoinRain];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvlCoinRain++;
  saveShopState();
  renderShop();
}
window.buyCoinRain = buyCoinRain;

function buySecondWind() {
  const price = SECOND_WIND_LEVELS[lvlSecondWind];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvlSecondWind++;
  saveShopState();
  renderShop();
}
window.buySecondWind = buySecondWind;

function buySharpshooter() {
  const price = SHARPSHOOTER_LEVELS[lvlSharpshooter];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvlSharpshooter++;
  saveShopState();
  renderShop();
}
window.buySharpshooter = buySharpshooter;

function buyFlyingStart() {
  const price = FLYING_START_LEVELS[lvlFlyingStart];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvlFlyingStart++;
  saveShopState();
  renderShop();
}
window.buyFlyingStart = buyFlyingStart;

function buyCriticalHit() {
  const price = CRITICAL_HIT_LEVELS[lvlCriticalHit];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvlCriticalHit++;
  saveShopState();
  renderShop();
}
window.buyCriticalHit = buyCriticalHit;

function buySplinterShot() {
  const price = SPLINTER_SHOT_LEVELS[lvlSplinterShot];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvlSplinterShot++;
  saveShopState();
  renderShop();
}
window.buySplinterShot = buySplinterShot;

function buyShockwave() {
  const price = SHOCKWAVE_LEVELS[lvlShockwave];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvlShockwave++;
  saveShopState();
  renderShop();
}
window.buyShockwave = buyShockwave;

function buyMultiShield() {
  const price = MULTI_SHIELD_LEVELS[lvlMultiShield];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvlMultiShield++;
  saveShopState();
  renderShop();
}
window.buyMultiShield = buyMultiShield;

function buyGoldRush() {
  const price = GOLD_RUSH_LEVELS[lvlGoldRush];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvlGoldRush++;
  saveShopState();
  renderShop();
}
window.buyGoldRush = buyGoldRush;

function buyOverkill() {
  const price = OVERKILL_LEVELS[lvlOverkill];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvlOverkill++;
  saveShopState();
  renderShop();
}
window.buyOverkill = buyOverkill;

function buyBloodlust() {
  const price = BLOODLUST_LEVELS[lvlBloodlust];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvlBloodlust++;
  saveShopState();
  renderShop();
}
window.buyBloodlust = buyBloodlust;

function weaponStatsLine(w) {
  const cooldownMs = shootCooldown * w.cooldownMult;
  const shotsPerSec = 1000 / cooldownMs;
  const pelletDmg = w.dmg * w.pellets;
  const dmgText = w.pellets > 1
    ? `${w.dmg} schade × ${w.pellets} kogels (${pelletDmg} totaal per schot)`
    : `${w.dmg} schade per kogel`;
  return `${dmgText} &nbsp;·&nbsp; ${shotsPerSec.toFixed(1)} schoten/sec`;
}

function weaponItemHtml(item, owned, equipped, buyFn, equipFn) {
  let btn;
  if (equipped) btn = `<button class="equipped" disabled>Uitgerust</button>`;
  else if (owned) btn = `<button class="equip" onclick="${equipFn}('${item.id}')">Uitrusten</button>`;
  else btn = `<button class="buy" onclick="${buyFn}('${item.id}')" ${coins < item.price ? 'disabled' : ''}>Koop · 🪙${item.price}</button>`;
  return `<div class="shopItem"><div class="info"><div class="name">${item.name}</div><div class="desc">${weaponStatsLine(item)}</div><div class="desc">${item.desc}</div></div><div style="display:flex; flex-direction:column; gap:6px; align-items:stretch;">${btn}<button class="equip" onclick="startWeaponPractice('${item.id}')">🎯 Oefen</button></div></div>`;
}

function shopItemHtml(item, owned, equipped, buyFn, equipFn) {
  let btn;
  if (equipped) btn = `<button class="equipped" disabled>Uitgerust</button>`;
  else if (owned) btn = `<button class="equip" onclick="${equipFn}('${item.id}')">Uitrusten</button>`;
  else btn = `<button class="buy" onclick="${buyFn}('${item.id}')" ${coins < item.price ? 'disabled' : ''}>Koop · 🪙${item.price}</button>`;
  return `<div class="shopItem"><div class="info"><div class="name">${item.name}</div><div class="desc">${item.desc}</div></div>${btn}</div>`;
}

function upgradeItemHtml(name, desc, price, owned, buyFnName) {
  const btn = owned
    ? `<button class="equipped" disabled>Ontgrendeld</button>`
    : `<button class="buy" onclick="${buyFnName}()" ${coins < price ? 'disabled' : ''}>Koop · 🪙${price}</button>`;
  return `<div class="shopItem"><div class="info"><div class="name">${name}</div><div class="desc">${desc}</div></div>${btn}</div>`;
}

function leveledUpgradeItemHtml(name, desc, levels, currentLevel, buyFnName) {
  const maxLevel = levels.length;
  const maxed = currentLevel >= maxLevel;
  const btn = maxed
    ? `<button class="equipped" disabled>Max niveau (${maxLevel})</button>`
    : `<button class="buy" onclick="${buyFnName}()" ${coins < levels[currentLevel] ? 'disabled' : ''}>Koop niveau ${currentLevel + 1}/${maxLevel} · 🪙${levels[currentLevel]}</button>`;
  const levelTag = currentLevel > 0 ? ` (Lv. ${currentLevel}/${maxLevel})` : ` (0/${maxLevel})`;
  return `<div class="shopItem"><div class="info"><div class="name">${name}${levelTag}</div><div class="desc">${desc}</div></div>${btn}</div>`;
}

function renderShop() {
  document.getElementById('shopCoins').textContent = coins;
  document.getElementById('shopWeapons').innerHTML = WEAPONS.map(w =>
    weaponItemHtml(w, ownedWeapons.includes(w.id), equippedWeapon === w.id, 'buyWeapon', 'equipWeapon')
  ).join('');
  document.getElementById('shopSpecialWeapons').innerHTML = SPECIAL_WEAPONS.map(w =>
    weaponItemHtml(w, ownedWeapons.includes(w.id), equippedWeapon === w.id, 'buyWeapon', 'equipWeapon')
  ).join('');
  document.getElementById('shopArmor').innerHTML = ARMOR.map(a =>
    shopItemHtml(a, ownedArmor.includes(a.id), equippedArmor === a.id, 'buyArmor', 'equipArmor')
  ).join('');

  // Upgrades
  document.getElementById('shopUpgrades').innerHTML = [
    upgradeItemHtml('2e Armor Slot', 'Draag twee pantsers tegelijk — de effecten van beide stapelen.', DUAL_ARMOR_PRICE, hasDualArmor, 'buyDualArmorSlot'),
    leveledUpgradeItemHtml('Extra Conditie', `Niveau 1: +${EXTRA_HP_PER_LEVEL} max HP. Niveau 2: +${EXTRA_HP_PER_LEVEL*2} max HP. Niveau 3: +${EXTRA_HP_PER_LEVEL*3} max HP. Niveau 4: +${EXTRA_HP_PER_LEVEL*4} max HP. Niveau 5: +${EXTRA_HP_PER_LEVEL*5} max HP.`, EXTRA_HP_LEVELS, lvlExtraHp, 'buyExtraHp'),
    leveledUpgradeItemHtml('Sprint', `Niveau 1: +${Math.round(SPRINT_PER_LEVEL*100)}% snelheid. Niveau 2: +${Math.round(SPRINT_PER_LEVEL*200)}% snelheid. Niveau 3: +${Math.round(SPRINT_PER_LEVEL*300)}% snelheid.`, SPRINT_LEVELS, lvlSprint, 'buySprint'),
    leveledUpgradeItemHtml('Magneet', `Niveau 1: +${MAGNET_RADIUS_PER_LEVEL} oprapafstand. Niveau 2: +${MAGNET_RADIUS_PER_LEVEL*2} oprapafstand. Niveau 3: +${MAGNET_RADIUS_PER_LEVEL*3} oprapafstand.`, MAGNET_LEVELS, lvlMagnet, 'buyMagnet'),
    leveledUpgradeItemHtml('Verlengde Boosts', `Niveau 1: +${Math.round(LONG_BOOSTS_MULT_PER_LEVEL*100)}% boost-duur. Niveau 2: +${Math.round(LONG_BOOSTS_MULT_PER_LEVEL*200)}% boost-duur. Niveau 3: +${Math.round(LONG_BOOSTS_MULT_PER_LEVEL*300)}% boost-duur.`, LONG_BOOSTS_LEVELS, lvlLongBoosts, 'buyLongBoosts'),
    upgradeItemHtml('Reanimatie', `Eenmalig te koop: overleef één keer per leven een dodelijke klap en kom terug met ${Math.round(REVIVE_HEAL_PCT*100)}% van je max HP.`, REVIVE_PRICE, hasRevive, 'buyRevive'),
    leveledUpgradeItemHtml('Snelle Herlaad', `Niveau 1: -${Math.round(FAST_RELOAD_PER_LEVEL*100)}% cooldown. Niveau 2: -${Math.round(FAST_RELOAD_PER_LEVEL*200)}% cooldown. Niveau 3: -${Math.round(FAST_RELOAD_PER_LEVEL*300)}% cooldown.`, FAST_RELOAD_LEVELS, lvlFastReload, 'buyFastReload'),
    leveledUpgradeItemHtml('IJzeren Huid', `Niveau 1: -${Math.round(IRON_SKIN_REDUCTIONS[0]*100)}% schade. Niveau 2: -${Math.round(IRON_SKIN_REDUCTIONS[1]*100)}% schade. Niveau 3: -${Math.round(IRON_SKIN_REDUCTIONS[2]*100)}% schade.`, IRON_SKIN_LEVELS, lvlIronSkin, 'buyIronSkin'),
    leveledUpgradeItemHtml('Geluksvinder', `Basis interval: 6s. Niveau 1: interval ${(LUCKY_DROP_INTERVALS[0]/1000).toFixed(1)}s. Niveau 2: interval ${(LUCKY_DROP_INTERVALS[1]/1000).toFixed(1)}s. Niveau 3: interval ${(LUCKY_DROP_INTERVALS[2]/1000).toFixed(1)}s.`, LUCKY_DROP_LEVELS, lvlLuckyDrop, 'buyLuckyDrop'),
    leveledUpgradeItemHtml('Doorborende Kogels', 'Niveau 1: +1 extra bot doorboord. Niveau 2: +2 extra bots doorboord. Niveau 3: +3 extra bots doorboord.', PIERCING_ROUNDS_LEVELS, lvlPiercingRounds, 'buyPiercingRounds'),
    leveledUpgradeItemHtml('Muntenregen', `Niveau 1: +${COIN_RAIN_BONUSES[0]} munten. Niveau 2: +${COIN_RAIN_BONUSES[1]} munten. Niveau 3: +${COIN_RAIN_BONUSES[2]} munten. Niveau 4: +${COIN_RAIN_BONUSES[3]} munten.`, COIN_RAIN_LEVELS, lvlCoinRain, 'buyCoinRain'),
    leveledUpgradeItemHtml('IJzeren Wil', `Eenmalig per leven, activeert onder 50% HP. Niveau 1: geneest ${SECOND_WIND_HEALS[0]} HP. Niveau 2: geneest ${SECOND_WIND_HEALS[1]} HP. Niveau 3: geneest ${SECOND_WIND_HEALS[2]} HP.`, SECOND_WIND_LEVELS, lvlSecondWind, 'buySecondWind'),
    leveledUpgradeItemHtml('Scherpschutter', `Niveau 1: +${Math.round(SHARPSHOOTER_BONUSES[0]*100)}% kogelsnelheid. Niveau 2: +${Math.round(SHARPSHOOTER_BONUSES[1]*100)}% kogelsnelheid. Niveau 3: +${Math.round(SHARPSHOOTER_BONUSES[2]*100)}% kogelsnelheid.`, SHARPSHOOTER_LEVELS, lvlSharpshooter, 'buySharpshooter'),
    leveledUpgradeItemHtml('Vliegende Start', `Niveau 1: ${FLYING_START_DURATIONS[0]/1000}s schild. Niveau 2: ${FLYING_START_DURATIONS[1]/1000}s schild. Niveau 3: ${FLYING_START_DURATIONS[2]/1000}s schild.`, FLYING_START_LEVELS, lvlFlyingStart, 'buyFlyingStart'),
    leveledUpgradeItemHtml('Kritieke Hit', `Niveau 1: ${Math.round(CRITICAL_HIT_CHANCES[0]*100)}% kans op 2x schade. Niveau 2: ${Math.round(CRITICAL_HIT_CHANCES[1]*100)}% kans. Niveau 3: ${Math.round(CRITICAL_HIT_CHANCES[2]*100)}% kans.`, CRITICAL_HIT_LEVELS, lvlCriticalHit, 'buyCriticalHit'),
    leveledUpgradeItemHtml('Splinter-schoten', 'Niveau 1: Bij elke kill schieten 3 splinters. Niveau 2: 5 splinters. Niveau 3: 7 splinters.', SPLINTER_SHOT_LEVELS, lvlSplinterShot, 'buySplinterShot'),
    leveledUpgradeItemHtml('Schokgolf', `Niveau 1: Bij kills radius ${SHOCKWAVE_RADII[0]}px schade. Niveau 2: ${SHOCKWAVE_RADII[1]}px. Niveau 3: ${SHOCKWAVE_RADII[2]}px.`, SHOCKWAVE_LEVELS, lvlShockwave, 'buyShockwave'),
    leveledUpgradeItemHtml('Multi-schild', 'Niveau 1: Schilden stapelen (2 tegelijk). Niveau 2: 3 tegelijk. Niveau 3: 4 tegelijk.', MULTI_SHIELD_LEVELS, lvlMultiShield, 'buyMultiShield'),
    leveledUpgradeItemHtml('Goudtrek', `Niveau 1: Munten trekken van ${GOLD_RUSH_RADIUS[0]}px. Niveau 2: ${GOLD_RUSH_RADIUS[1]}px. Niveau 3: ${GOLD_RUSH_RADIUS[2]}px.`, GOLD_RUSH_LEVELS, lvlGoldRush, 'buyGoldRush'),
    leveledUpgradeItemHtml('Overkill', 'Niveau 1: Overkill-schade veroorzaakt mini-explosies. Niveau 2: Groter + meer schade. Niveau 3: Nog groter radius.', OVERKILL_LEVELS, lvlOverkill, 'buyOverkill'),
    leveledUpgradeItemHtml('Bloedlust', `Niveau 1: +${Math.round(BLOODLUST_BONUSES[0]*100)}% schade per actieve kill-streak. Niveau 2: +${Math.round(BLOODLUST_BONUSES[1]*100)}%. Niveau 3: +${Math.round(BLOODLUST_BONUSES[2]*100)}%.`, BLOODLUST_LEVELS, lvlBloodlust, 'buyBloodlust')
  ].join('');

  // 2e armor-slot sectie tonen zodra gekocht
  const section2 = document.getElementById('shopArmor2Section');
  const navArmor2Btn = document.getElementById('navArmor2Btn');
  if (hasDualArmor) {
    section2.style.display = 'block';
    if (navArmor2Btn) navArmor2Btn.style.display = 'inline-block';
    const equippedSlot1 = ARMOR.find(a => a.id === equippedArmor) || ARMOR[0];
    document.getElementById('shopArmor1Equipped').textContent = `Slot 1: ${equippedSlot1.name} uitgerust`;
    document.getElementById('shopArmor2').innerHTML = ARMOR.map(a =>
      shopItemHtml(a, ownedArmor.includes(a.id), equippedArmor2 === a.id, 'buyArmor', 'equipArmor2')
    ).join('');
  } else {
    section2.style.display = 'none';
    if (navArmor2Btn) navArmor2Btn.style.display = 'none';
  }
}

