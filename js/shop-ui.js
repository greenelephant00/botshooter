function saveShopState() {
  localStorage.setItem('botShooterCoins', coins);
  localStorage.setItem('botShooterOwnedWeapons', JSON.stringify(ownedWeapons));
  localStorage.setItem('botShooterOwnedArmor', JSON.stringify(ownedArmor));
  localStorage.setItem('botShooterEquippedWeapon', equippedWeapon);
  localStorage.setItem('botShooterEquippedArmor', equippedArmor);
  localStorage.setItem('botShooterEquippedArmor2', equippedArmor2);
  localStorage.setItem('botShooterHasDualArmor', hasDualArmor);
  localStorage.setItem('botShooterHasDualArmor2', hasDualArmor2);
  localStorage.setItem('botShooterLvlDroneUpgrade', lvlDroneUpgrade);
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
  localStorage.setItem('botShooterLvl2FireCore', lvl2FireCore);
  localStorage.setItem('botShooterLvl2FrostBlood', lvl2FrostBlood);
  localStorage.setItem('botShooterLvl2Steadfast', lvl2Steadfast);
  localStorage.setItem('botShooterLvl2FastReload', lvl2FastReload);
  localStorage.setItem('botShooterLvl2LongBoosts', lvl2LongBoosts);
  localStorage.setItem('botShooterLvl2Magnet', lvl2Magnet);
  localStorage.setItem('botShooterHasRevive2', hasRevive2);
  localStorage.setItem('botShooterLvl2Vengeance', lvl2Vengeance);
  localStorage.setItem('botShooterLvl2IronSkin', lvl2IronSkin);
  localStorage.setItem('botShooterLvl2ExtraHp', lvl2ExtraHp);
  localStorage.setItem('botShooterLvl2LuckyDrop', lvl2LuckyDrop);
  localStorage.setItem('botShooterLvl2PiercingRounds', lvl2PiercingRounds);
  localStorage.setItem('botShooterLvl2CoinRain', lvl2CoinRain);
  localStorage.setItem('botShooterLvl2SecondWind', lvl2SecondWind);
  localStorage.setItem('botShooterLvl2Sharpshooter', lvl2Sharpshooter);
  localStorage.setItem('botShooterLvl2FlyingStart', lvl2FlyingStart);
  localStorage.setItem('botShooterLvl2CriticalHit', lvl2CriticalHit);
  localStorage.setItem('botShooterLvl2SplinterShot', lvl2SplinterShot);
  localStorage.setItem('botShooterLvl2MultiShield', lvl2MultiShield);
  localStorage.setItem('botShooterLvl2Overkill', lvl2Overkill);
  localStorage.setItem('botShooterPowerupLevels', JSON.stringify(powerupLevels));
  localStorage.setItem('botShooterOwnedSkins', JSON.stringify(ownedSkins));
  localStorage.setItem('botShooterEquippedSkin', skinPracticeActive ? previousEquippedSkin : equippedSkin);
  localStorage.setItem('botShooterOwnedTransforms', JSON.stringify(ownedTransforms));
  localStorage.setItem('botShooterEquippedTransform', equippedTransform);
}

function menuScreenId() {
  return currentWorld === 2 ? 'world2Screen' : 'startScreen';
}
function menuCoinsId() {
  return currentWorld === 2 ? 'world2Coins' : 'startCoins';
}

function openShop() {
  document.getElementById(menuScreenId()).style.display = 'none';
  document.getElementById('shopScreen').style.display = 'flex';
  renderShop();
}
window.openShop = openShop;

function updateWorld2Button() {
  const btn = document.getElementById('world2Btn');
  if (!btn) return;
  btn.textContent = world2Unlocked ? '🔥❄️🪨 Wereld 2: Elementen' : `🔥❄️🪨 Wereld 2: Elementen · Koop 🪙${WORLD2_PRICE}`;
}
window.updateWorld2Button = updateWorld2Button;

function handleWorld2Click() {
  if (world2Unlocked) {
    openWorld2();
  } else {
    buyWorld2();
  }
}
window.handleWorld2Click = handleWorld2Click;

function buyWorld2() {
  if (world2Unlocked || coins < WORLD2_PRICE) return;
  coins -= WORLD2_PRICE;
  world2Unlocked = true;
  localStorage.setItem('botShooterWorld2Unlocked', 'true');
  saveShopState();
  checkAchievements();
  document.getElementById('startCoins').textContent = coins;
  updateWorld2Button();
  openWorld2();
}
window.buyWorld2 = buyWorld2;

function openWorld2() {
  if (!world2Unlocked) return;
  currentWorld = 2;
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('world2Coins').textContent = coins;
  document.getElementById('world2Cores').textContent = elementalCores;
  document.getElementById('world2Screen').style.display = 'flex';
}
window.openWorld2 = openWorld2;

function goToWorld1() {
  currentWorld = 1;
  document.getElementById('world2Screen').style.display = 'none';
  document.getElementById('startCoins').textContent = coins;
  document.getElementById('startScreen').style.display = 'flex';
}
window.goToWorld1 = goToWorld1;

function scrollToShopSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.scrollToShopSection = scrollToShopSection;

function closeShop() {
  document.getElementById('shopScreen').style.display = 'none';
  document.getElementById(menuScreenId()).style.display = 'flex';
  document.getElementById(menuCoinsId()).textContent = coins;
}
window.closeShop = closeShop;

function openPowerupShop() {
  document.getElementById(menuScreenId()).style.display = 'none';
  document.getElementById('powerupShopScreen').style.display = 'flex';
  renderPowerupShop();
}
window.openPowerupShop = openPowerupShop;

function closePowerupShop() {
  document.getElementById('powerupShopScreen').style.display = 'none';
  document.getElementById(menuScreenId()).style.display = 'flex';
  document.getElementById(menuCoinsId()).textContent = coins;
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
  if (info.dmgs) parts.push(`${info.dmgs[level]} schade`);
  if (info.pellets) parts.push(`${info.pellets[level]} kogels tegelijk`);
  if (info.counts) parts.push(`${info.counts[level]} lasers`);
  if (info.radii) parts.push(`${info.radii[level]}px straal`);
  const effectDesc = info.desc ? `${info.desc} ` : '';
  if (parts.length === 0) return effectDesc.trim();
  const current = `${effectDesc}Huidig (Lv. ${level}): ${parts.join(', ')}.`;
  if (level >= info.prices.length) return `${current} Max niveau bereikt.`;
  const nextParts = [];
  if (info.durations) {
    const sec = (info.durations[level + 1] / 1000).toFixed(1).replace(/\.0$/, '');
    nextParts.push(`${sec} sec duur`);
  }
  if (info.heals) nextParts.push(`+${info.heals[level + 1]} HP`);
  if (info.dmgs) nextParts.push(`${info.dmgs[level + 1]} schade`);
  if (info.pellets) nextParts.push(`${info.pellets[level + 1]} kogels tegelijk`);
  if (info.counts) nextParts.push(`${info.counts[level + 1]} lasers`);
  if (info.radii) nextParts.push(`${info.radii[level + 1]}px straal`);
  return `${current} Volgend niveau: ${nextParts.join(', ')}.`;
}

const WORLD2_POWERUP_VALUE_TEXT = {
  wortelgreep: (info, lvl) => `grijpt ${info.counts[lvl]} bots tegelijk`,
  aardhuid: (info, lvl) => `${Math.round(info.reductions[lvl] * 100)}% minder schade, ${(info.durations[lvl] / 1000).toFixed(1)} sec`,
  vuurnova: (info, lvl) => `${info.dmgs[lvl]} schade binnen ${info.radii[lvl]}px`,
  aardaura: (info, lvl) => `${(info.durations[lvl] / 1000).toFixed(1)} sec duur`,
  ijsbries: (info, lvl) => `${(info.durations[lvl] / 1000).toFixed(1)} sec bevroren`,
  firetrail: (info, lvl) => `${(info.durations[lvl] / 1000).toFixed(1)} sec spoor`,
  strike: (info, lvl) => `${info.dmgs[lvl]} schade in het midden`,
  tornadoshot: (info, lvl) => `${info.radii[lvl]}px straal`,
  lightningbarrage: (info, lvl) => `${info.dmgs[lvl]} schade per schicht`
};

function world2PowerupDesc(id) {
  const info = POWERUP_LEVELS[id];
  const level = getPuLevel(id);
  const maxLevel = info.prices.length;
  const fmt = WORLD2_POWERUP_VALUE_TEXT[id];
  const current = `${info.desc} Huidig (Lv. ${level}): ${fmt(info, level)}.`;
  if (level >= maxLevel) return `${current} Max niveau bereikt.`;
  return `${current} Volgend niveau: ${fmt(info, level + 1)}.`;
}

function renderPowerupShop() {
  document.getElementById('powerupShopCoins').textContent = coins;
  const ids = currentWorld === 2 ? WORLD2_POWERUP_IDS : POWERUP_IDS;
  document.getElementById('powerupShopList').innerHTML = ids.map(id => {
    const info = POWERUP_LEVELS[id];
    const level = getPuLevel(id);
    const maxLevel = info.prices.length;
    const maxed = level >= maxLevel;
    const btn = maxed
      ? `<button class="equipped" disabled>Max niveau (${maxLevel})</button>`
      : `<button class="buy" onclick="buyPowerupUpgrade('${id}')" ${coins < info.prices[level] ? 'disabled' : ''}>Koop niveau ${level + 1}/${maxLevel} · 🪙${info.prices[level]}</button>`;
    const desc = currentWorld === 2 ? world2PowerupDesc(id) : powerupDescForLevel(id);
    return `<div class="shopItem"><div class="info"><div class="name">${info.name} (Lv. ${level}/${maxLevel})</div><div class="desc">${desc}</div></div>
      <div style="display:flex; flex-direction:column; gap:6px; align-items:stretch;">${btn}<button class="equip" onclick="previewPowerup('${id}')">🎬 Bekijk</button></div>
    </div>`;
  }).join('');
}

function previewPowerup(id) {
  // Toont een kort, echt speelmoment (in de echte engine, geen nepvideo) van wat er gebeurt als je deze powerup oppakt
  practiceWeaponId = null;
  weaponPracticeActive = false;
  transformPracticeActive = false;
  disasterPracticeActive = false;
  disasterPracticeType = null;
  exitSkinPractice();
  powerupPreviewActive = true;
  powerupPreviewId = id;
  gameMode = 'practice';
  document.getElementById('powerupShopScreen').style.display = 'none';
  document.getElementById('levelHud').style.display = 'none';
  document.getElementById('sprintHud').style.display = 'none';

  initGame(); // volledige reset + 4 gewone bots, net als een echt potje

  const spawnPreviewPowerup = () => {
    if (!powerupPreviewActive || powerupPreviewId !== id || gameOver || levelTransition) return;
    powerups.push({ x: player.x, y: player.y, r: 14, type: id, bornAt: performance.now(), life: 9000 });
  };
  if (POWERUP_PREVIEW_DELAY_IDS.includes(id)) {
    setTimeout(spawnPreviewPowerup, POWERUP_PREVIEW_DELAY);
  } else {
    spawnPreviewPowerup();
  }

  updateHUD();
  document.getElementById('pauseOverlay').style.display = 'none';
  document.getElementById('msg').style.display = 'none';

  if (!loopRunning) {
    loopRunning = true;
    loop();
  }
  startMusic();

  setTimeout(() => {
    if (powerupPreviewActive && powerupPreviewId === id) goToMenu();
  }, POWERUP_PREVIEW_DURATION);
}
window.previewPowerup = previewPowerup;

// ---- Bot info scherm ----
const BOT_DISPLAY_NAMES = {
  grunt: 'Grunt', runner: 'Runner', heavy: 'Heavy', tank: 'Tank', sniper: 'Sniper',
  brute: 'Brute (mes)', spinner: 'Spinner', chaser: 'Chaser', shielder: 'Shielder',
  ghost: 'Ghost', turret: 'Turret', bomber: 'Bomber',
  overlord: 'Overlord', artillery: 'Artillery',
  swarmqueen: 'Swarmqueen', vortex: 'Vortex', swapper: 'Swapper', splitter: 'Splitter',
  warden: 'Warden', arclight: 'Arclight',
  miasma: 'Miasma', bulwark: 'Bulwark', broodmother: 'Broodmother',
  gravitas: 'Gravitas', cryostasis: 'Cryostasis', railgunner: 'Railgunner', vexer: 'Vexer', bombardier: 'Bombardier',
  colossus: 'Colossus', titan: 'Titan', behemoth: 'Behemoth', nemesis: 'Nemesis',
  fireling: 'Vlamgeest', frostling: 'Rijmgeest', earthling: 'Rotsgolem',
  bliksemwicht: 'Donderknaap', windwicht: 'Windloper', magmawicht: 'Lavagolem',
  stormwicht: 'Onweersgeest', kristalwicht: 'Kristalreus',
  zandworm: 'Zandworm', doornrank: 'Doornrank', getijgeest: 'Getijgeest',
  aswervelaar: 'Aswervelaar', sneeuwjager: 'Sneeuwjager',
  vulkaanheer: 'Vulkaanheer', vriesvorst: 'Vriesvorst', stormwever: 'Stormwever', wortelheer: 'Wortelheer',
  vuurtitaan: 'Vuurtitaan', vriesreus: 'Vriesreus', aardkoning: 'Aardkoning', stormvorst: 'Stormvorst'
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
  mortar:    'Vuurt op afstand een zware, langzame granaat met een korte waarschuwing vooraf.',
  spiral:    'Schiet continu kogels in een langzaam roterende spiraal om zich heen.',
  boss:      'Vuurt regelmatig een breed salvo van 16 kogels en heeft meerdere unieke special attacks.',
  mine:      'Geen kogels — legt elke seconde een mijn neer op jouw positie op dat moment, die na een paar seconden vanzelf afgaat.',
  shockbolt: 'Geen kogels — telegrafeert kort 3 inslagpunten rond je positie en zapt je daarna met 3 instant bliksemschichten.',
  gascloud:  'Geen kogels — laat regelmatig een gifwolk achter op zijn positie die schade-over-tijd doet zolang je erin staat.',
  shieldbash: 'Geen kogels — beukt continu op je af en stoot je bij impact weg met veel schade en een flinke terugstoot.',
  summon:    'Geen kogels — houdt afstand en roept periodiek 7 zwakke broodlings op in een grote cirkel om zich heen, om je te overweldigen.',
  gravitywell: 'Geen kogels — opent periodiek een zwaartekrachtveld dat je naar het middelpunt trekt en na 1,5 sec een schadeburst laat afgaan.',
  freezetrap: 'Geen kogels — telegrafeert een grote ijsval op je positie die je bij impact 2,2 sec volledig verlamt.',
  snipebeam: 'Geen kogels — houdt veel afstand en vuurt na een lange telegraaf een instant, verwoestende precisiestraal.',
  curse:     'Geen kogels — vervloekt je zonder waarschuwing vooraf zodat je 7 sec lang 50% minder schade doet, geen directe schade.',
  clusterbomb: 'Geen kogels — bestookt je met 4 gelijktijdige, verspreide inslagen rond je positie.',
  lavarain: 'Geen kogels — laat constant een spoor van lava achter zich terwijl hij loopt, en laat af en toe ook nog 3 klodders lava vlak bij je neerkomen. De lava blijft liggen en zet je in brand.',
  frostnova: 'Geen kogels — laat een uitdijende ijsring om zich heen ontstaan die je bevriest zodra hij je bereikt.',
  chainbolt: 'Geen kogels — blijft ver weg en zapt je op afstand met felle bliksemschichten.',
  rootsnare: 'Geen kogels — laat een boom uit de grond komen op jouw positie die je vastgrijpt en vasthoudt.'
};
const BOSS_SPECIAL_DESC = {
  colossus: 'Special 1 — Schokgolf: een AOE-slam rond zichzelf met een getelegrafeerde waarschuwing vooraf. Special 2 — Spervuur: 3 snelle golven van 12 kogels in alle richtingen.',
  titan:    'Special 1 — Schokgolf: een AOE-slam rond zichzelf met een getelegrafeerde waarschuwing vooraf. Special 2 — Meteorregen: 4 getelegrafeerde inslagen rond je positie, kort na elkaar.',
  behemoth: 'Special 1 — Schokgolf: een AOE-slam rond zichzelf met een getelegrafeerde waarschuwing vooraf. Special 2 — Laserstraal: een gerichte, doorlopende straal met een korte waarschuwing vooraf.',
  nemesis:  'Special 1 — Schokgolf: een AOE-slam rond zichzelf met een getelegrafeerde waarschuwing vooraf. Special 2 — Doemspiraal: meerdere snelle golven roterende kogels die de hele arena vullen. Special 3 — Kruislaser: twee gelijktijdige, doorlopende laserstralen in een kruispatroon met een korte waarschuwing vooraf. De sterkste en taaiste boss in het spel.',
  vuurtitaan: 'Vuur-boss (Wereld 2), 6 unieke attacks. Special 1 — Schokgolf: een AOE-slam rond zichzelf. Special 2 — Lavaregen: 3 getelegrafeerde lavaklodders vlak bij je die je in brand zetten. Special 3 — Vuurnova: een felle vuurexplosie rond zichzelf die je verbrandt als je te dichtbij staat. Special 4 — Vuurring: een vurige kooi om jezelf voor 5 sec — bots lopen er ongehinderd doorheen, maar jij kunt er niet uit, en tegen de vlammen aan duwen zet je in brand. Special 5 — Vuurlijn: een reeks vuurzuilen die na elkaar afgaan langs een rechte lijn vanaf de boss naar je toe. Special 6 — Feniksduik: duikt neer op je vastgelegde positie met een zware inslag en laat er blijvend vuur achter.',
  vriesreus: 'IJs-boss (Wereld 2), 6 unieke attacks. Special 1 — Schokgolf: een AOE-slam rond zichzelf. Special 2 — IJsring: een uitdijende ijsring die je bevriest zodra hij je bereikt. Special 3 — Rijmlans: telegrafeert 1 sec een stippellijn en schiet daarna exact langs die lijn — ontwijkbaar door weg te stappen. Special 4 — IJswaaier: 3 gelijktijdige vriesstralen in een waaier. Special 5 — Vriesveld: verspreide ijspieken ontstaan willekeurig over de hele arena.',
  aardkoning: 'Aarde-boss (Wereld 2), 6 unieke attacks. Special 1 — Schokgolf: een AOE-slam rond zichzelf. Special 2 — Wortelgreep: een extra grote, verwoestende boom uit de grond die je vastgrijpt en vasthoudt. Special 3 — Aardbeving: een verwoestende schok rond zichzelf die je wegstoot en even verlamt. Special 4 — Aardpiek: een zware aardpiek schiet omhoog op je vastgelegde positie. Special 5 — Achtervolgende scheur: een scheur in de grond die je een tijd lang blijft opjagen.',
  stormvorst: 'Storm-boss (Wereld 2), 6 unieke attacks. Special 1 — Schokgolf: een AOE-slam rond zichzelf. Special 2 — Bliksemschicht: telegrafeert kort een inslagcirkel op je positie voordat de bliksem inslaat — ontwijkbaar door weg te lopen. Special 3 — Orkaan: een kolkende windvlaag die je herhaaldelijk raakt en naar de boss toe trekt. Special 4 — Blikseminslag-cluster: 4 bliksems in een kruispatroon rond je vastgelegde positie. Special 5 — Stroomstoot: een EMP-golf die je wapen 2 sec uitschakelt als je erin staat wanneer hij afgaat.'
};

function botDamageText(type) {
  if (type.pattern === 'melee' || type.pattern === 'suicide') {
    return `${type.meleeDamage || 15} schade per aanval (van dichtbij)`;
  }
  if (type.pattern === 'mortar') {
    return `${type.meleeDamage || 40} schade per inslag (op afstand)`;
  }
  if (type.pattern === 'mine') {
    return `${type.specialDmg || 26} schade bij mijn-ontploffing`;
  }
  if (type.pattern === 'shockbolt') {
    return `${type.specialDmg || 18} schade per bliksemschicht`;
  }
  if (type.pattern === 'gascloud') {
    return `${type.specialDmg || 4} schade per tik in de gifwolk`;
  }
  if (type.pattern === 'shieldbash') {
    return `${type.specialDmg || 22} schade + terugstoot per beuk`;
  }
  if (type.pattern === 'summon') {
    return 'Doet zelf geen schade — roept broodlings op';
  }
  if (type.pattern === 'gravitywell') {
    return `${type.specialDmg || 24} schade bij het imploderen van het zwaartekrachtveld`;
  }
  if (type.pattern === 'freezetrap') {
    return `${type.specialDmg || 8} schade + 2,2 sec verlamming bij ijsval`;
  }
  if (type.pattern === 'snipebeam') {
    return `${type.specialDmg || 42} schade bij precisiestraal`;
  }
  if (type.pattern === 'curse') {
    return 'Doet zelf geen schade — halveert je schade 4 sec';
  }
  if (type.pattern === 'clusterbomb') {
    return `${type.specialDmg || 14} schade per inslag (tot 4 tegelijk)`;
  }
  if (type.pattern === 'lavarain') {
    return `${type.specialDmg || 16} schade per lavaklodder (3x) + 3 sec brand`;
  }
  if (type.pattern === 'frostnova') {
    return `${type.specialDmg || 14} schade + 1 sec volledige bevriezing bij de ijsring`;
  }
  if (type.pattern === 'chainbolt') {
    return `${type.specialDmg || 12} schade per bliksemschicht`;
  }
  if (type.pattern === 'rootsnare') {
    return `${type.specialDmg || 14} schade + 1,2 sec vastgegrepen`;
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
  document.getElementById(menuScreenId()).style.display = 'none';
  document.getElementById('botsInfoScreen').style.display = 'flex';
  renderBotsInfo();
}
window.openBotsInfo = openBotsInfo;

function closeBotsInfo() {
  document.getElementById('botsInfoScreen').style.display = 'none';
  document.getElementById(menuScreenId()).style.display = 'flex';
}
window.closeBotsInfo = closeBotsInfo;

function renderDisastersInfo() {
  document.getElementById('disastersInfoList').innerHTML = DISASTER_TYPES.map(d =>
    `<div class="shopItem"><div class="info"><div class="name">${d.name}</div><div class="desc">${d.desc}</div></div>
    <button class="equip" onclick="startDisasterPractice('${d.id}')">🎯 Oefen</button></div>`
  ).join('');
}

function openDisastersInfo() {
  document.getElementById(menuScreenId()).style.display = 'none';
  document.getElementById('disastersInfoScreen').style.display = 'flex';
  renderDisastersInfo();
}
window.openDisastersInfo = openDisastersInfo;

function closeDisastersInfo() {
  document.getElementById('disastersInfoScreen').style.display = 'none';
  document.getElementById(menuScreenId()).style.display = 'flex';
}
window.closeDisastersInfo = closeDisastersInfo;

function renderAchievementCard(a) {
  const unlocked = unlockedAchievements.includes(a.id);
  return `<div class="shopItem achievementCard${unlocked ? ' unlocked' : ''}"><div class="info"><div class="name">${a.icon} ${a.name}</div><div class="desc">${a.desc}</div><div class="desc" style="color:#ffd60a; margin-top:4px;">Beloning: ${rewardText(a.reward)}</div></div>
    <div style="min-width:90px; font-weight:bold; color:${unlocked ? '#4cd964' : '#888'};">${unlocked ? '✔ Behaald' : '🔒 Op slot'}</div></div>`;
}

function renderAchievements() {
  checkAchievements();
  const skinRewards = ACHIEVEMENTS.filter(a => a.reward.type === 'unlockSkin');
  const hardRewards = ACHIEVEMENTS.filter(a => a.reward.type === 'coins' && a.reward.amount >= 1000);
  const isSpecial = a => a.reward.type === 'unlockSkin' || (a.reward.type === 'coins' && a.reward.amount >= 1000);
  const w1 = ACHIEVEMENTS.filter(a => a.category === 'w1' && !isSpecial(a));
  const w2 = ACHIEVEMENTS.filter(a => a.category === 'w2' && !isSpecial(a));
  const skinCount = skinRewards.filter(a => unlockedAchievements.includes(a.id)).length;
  const hardCount = hardRewards.filter(a => unlockedAchievements.includes(a.id)).length;
  const w1Count = w1.filter(a => unlockedAchievements.includes(a.id)).length;
  const w2Count = w2.filter(a => unlockedAchievements.includes(a.id)).length;
  const w2Section = currentWorld === 2
    ? `<div class="shopSection"><h3>🔥❄️🪨 Wereld 2 (${w2Count}/${w2.length})</h3>${w2.map(renderAchievementCard).join('')}</div>`
    : '';
  const totalShown = (currentWorld === 2 ? w1.length + w2.length : w1.length) + skinRewards.length + hardRewards.length;
  const unlockedShown = (currentWorld === 2 ? w1Count + w2Count : w1Count) + skinCount + hardCount;
  document.getElementById('achievementsProgress').textContent = `${unlockedShown}/${totalShown} behaald`;
  document.getElementById('achievementsList').innerHTML =
    `<div class="shopSection"><h3>🌍 Wereld 1 (${w1Count}/${w1.length})</h3>${w1.map(renderAchievementCard).join('')}</div>` +
    w2Section +
    `<div class="shopSection"><h3>💰 Lastige Quests (${hardCount}/${hardRewards.length})</h3>${hardRewards.map(renderAchievementCard).join('')}</div>` +
    `<div class="shopSection"><h3>🎨 Exclusieve Skins (${skinCount}/${skinRewards.length})</h3>${skinRewards.map(renderAchievementCard).join('')}</div>`;
}

function openAchievements() {
  document.getElementById(menuScreenId()).style.display = 'none';
  document.getElementById('achievementsScreen').style.display = 'flex';
  renderAchievements();
}
window.openAchievements = openAchievements;

function closeAchievements() {
  document.getElementById('achievementsScreen').style.display = 'none';
  document.getElementById(menuScreenId()).style.display = 'flex';
}
window.closeAchievements = closeAchievements;

let achievementToastTimeout = null;
function showAchievementToast(a) {
  const el = document.getElementById('achievementToast');
  if (!el) return;
  el.innerHTML = `<div class="achTitle">🏆 QUEST VOLTOOID</div><div class="achName">${a.icon} ${a.name}</div><div class="achDesc">${a.desc}</div><div class="achReward">Beloning: ${rewardText(a.reward)}</div>`;
  el.style.display = 'block';
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
  if (achievementToastTimeout) clearTimeout(achievementToastTimeout);
  achievementToastTimeout = setTimeout(() => { el.style.display = 'none'; }, 4000);
}
window.showAchievementToast = showAchievementToast;

function buyCoreArmor() {
  const a = WORLD2_ARMOR.find(x => x.id === 'coreplate');
  if (!a || ownedArmor.includes('coreplate') || elementalCores < a.corePrice) return;
  elementalCores -= a.corePrice;
  ownedArmor.push('coreplate');
  localStorage.setItem('botShooterElementalCores', elementalCores);
  saveShopState();
  renderCoreShop();
}
window.buyCoreArmor = buyCoreArmor;

function buyCoreWeapon() {
  const w = WORLD2_SPECIAL_WEAPONS.find(x => x.id === 'coreblaster');
  if (!w || ownedWeapons.includes('coreblaster') || elementalCores < w.corePrice) return;
  elementalCores -= w.corePrice;
  ownedWeapons.push('coreblaster');
  localStorage.setItem('botShooterElementalCores', elementalCores);
  saveShopState();
  renderCoreShop();
}
window.buyCoreWeapon = buyCoreWeapon;

function buyCoreSkin() {
  const s = SKINS.find(x => x.id === 'coreessence');
  if (!s || ownedSkins.includes('coreessence') || elementalCores < s.corePrice) return;
  elementalCores -= s.corePrice;
  ownedSkins.push('coreessence');
  localStorage.setItem('botShooterElementalCores', elementalCores);
  saveShopState();
  renderCoreShop();
}
window.buyCoreSkin = buyCoreSkin;

function buyCoreDamage() {
  const price = CORE_DAMAGE_LEVELS[lvlCoreDamage];
  if (price === undefined || elementalCores < price) return;
  elementalCores -= price;
  lvlCoreDamage++;
  localStorage.setItem('botShooterElementalCores', elementalCores);
  localStorage.setItem('botShooterLvlCoreDamage', lvlCoreDamage);
  renderCoreShop();
}
window.buyCoreDamage = buyCoreDamage;

function buyCoreShield() {
  const price = CORE_SHIELD_LEVELS[lvlCoreShield];
  if (price === undefined || elementalCores < price) return;
  elementalCores -= price;
  lvlCoreShield++;
  localStorage.setItem('botShooterElementalCores', elementalCores);
  localStorage.setItem('botShooterLvlCoreShield', lvlCoreShield);
  renderCoreShop();
}
window.buyCoreShield = buyCoreShield;

function buyCoreHarvest() {
  if (hasCoreHarvest || elementalCores < CORE_HARVEST_PRICE) return;
  elementalCores -= CORE_HARVEST_PRICE;
  hasCoreHarvest = true;
  localStorage.setItem('botShooterElementalCores', elementalCores);
  localStorage.setItem('botShooterHasCoreHarvest', 'true');
  renderCoreShop();
}
window.buyCoreHarvest = buyCoreHarvest;

function buyCoreSpeed() {
  const price = CORE_SPEED_LEVELS[lvlCoreSpeed];
  if (price === undefined || elementalCores < price) return;
  elementalCores -= price;
  lvlCoreSpeed++;
  localStorage.setItem('botShooterElementalCores', elementalCores);
  localStorage.setItem('botShooterLvlCoreSpeed', lvlCoreSpeed);
  renderCoreShop();
}
window.buyCoreSpeed = buyCoreSpeed;

function buyCoreRegen() {
  const price = CORE_REGEN_LEVELS[lvlCoreRegen];
  if (price === undefined || elementalCores < price) return;
  elementalCores -= price;
  lvlCoreRegen++;
  localStorage.setItem('botShooterElementalCores', elementalCores);
  localStorage.setItem('botShooterLvlCoreRegen', lvlCoreRegen);
  renderCoreShop();
}
window.buyCoreRegen = buyCoreRegen;

function buyCoreVampire() {
  const price = CORE_VAMPIRE_LEVELS[lvlCoreVampire];
  if (price === undefined || elementalCores < price) return;
  elementalCores -= price;
  lvlCoreVampire++;
  localStorage.setItem('botShooterElementalCores', elementalCores);
  localStorage.setItem('botShooterLvlCoreVampire', lvlCoreVampire);
  renderCoreShop();
}
window.buyCoreVampire = buyCoreVampire;

function buyCoreAura() {
  if (hasCoreAura || elementalCores < CORE_AURA_PRICE) return;
  elementalCores -= CORE_AURA_PRICE;
  hasCoreAura = true;
  localStorage.setItem('botShooterElementalCores', elementalCores);
  localStorage.setItem('botShooterHasCoreAura', 'true');
  renderCoreShop();
}
window.buyCoreAura = buyCoreAura;

function buyCoreShock() {
  if (hasCoreShock || elementalCores < CORE_SHOCK_PRICE) return;
  elementalCores -= CORE_SHOCK_PRICE;
  hasCoreShock = true;
  localStorage.setItem('botShooterElementalCores', elementalCores);
  localStorage.setItem('botShooterHasCoreShock', 'true');
  renderCoreShop();
}
window.buyCoreShock = buyCoreShock;

function renderCoreShop() {
  document.getElementById('coreShopCores').textContent = elementalCores;
  const armor = WORLD2_ARMOR.find(x => x.id === 'coreplate');
  const weapon = WORLD2_SPECIAL_WEAPONS.find(x => x.id === 'coreblaster');
  const skin = SKINS.find(x => x.id === 'coreessence');
  const ownedArmorBtn = ownedArmor.includes('coreplate')
    ? (equippedArmor === 'coreplate' ? `<button class="equipped" disabled>Uitgerust</button>` : `<button class="equip" onclick="equipArmor('coreplate')">Uitrusten</button>`)
    : `<button class="buy" onclick="buyCoreArmor()" ${elementalCores < armor.corePrice ? 'disabled' : ''}>Koop · 🔮${armor.corePrice}</button>`;
  const ownedWeaponBtn = ownedWeapons.includes('coreblaster')
    ? (equippedWeapon === 'coreblaster' ? `<button class="equipped" disabled>Uitgerust</button>` : `<button class="equip" onclick="equipWeapon('coreblaster')">Uitrusten</button>`)
    : `<button class="buy" onclick="buyCoreWeapon()" ${elementalCores < weapon.corePrice ? 'disabled' : ''}>Koop · 🔮${weapon.corePrice}</button>`;
  const ownedSkinBtn = ownedSkins.includes('coreessence')
    ? (equippedSkin === 'coreessence' ? `<button class="equipped" disabled>Uitgerust</button>` : `<button class="equip" onclick="equipSkin('coreessence')">Uitrusten</button>`)
    : `<button class="buy" onclick="buyCoreSkin()" ${elementalCores < skin.corePrice ? 'disabled' : ''}>Koop · 🔮${skin.corePrice}</button>`;

  const coreDamageMaxed = lvlCoreDamage >= CORE_DAMAGE_LEVELS.length;
  const coreDamageBtn = coreDamageMaxed
    ? `<button class="equipped" disabled>Max niveau (${CORE_DAMAGE_LEVELS.length})</button>`
    : `<button class="buy" onclick="buyCoreDamage()" ${elementalCores < CORE_DAMAGE_LEVELS[lvlCoreDamage] ? 'disabled' : ''}>Koop niveau ${lvlCoreDamage + 1}/${CORE_DAMAGE_LEVELS.length} · 🔮${CORE_DAMAGE_LEVELS[lvlCoreDamage]}</button>`;
  const coreShieldMaxed = lvlCoreShield >= CORE_SHIELD_LEVELS.length;
  const coreShieldBtn = coreShieldMaxed
    ? `<button class="equipped" disabled>Max niveau (${CORE_SHIELD_LEVELS.length})</button>`
    : `<button class="buy" onclick="buyCoreShield()" ${elementalCores < CORE_SHIELD_LEVELS[lvlCoreShield] ? 'disabled' : ''}>Koop niveau ${lvlCoreShield + 1}/${CORE_SHIELD_LEVELS.length} · 🔮${CORE_SHIELD_LEVELS[lvlCoreShield]}</button>`;
  const coreHarvestBtn = hasCoreHarvest
    ? `<button class="equipped" disabled>Ontgrendeld</button>`
    : `<button class="buy" onclick="buyCoreHarvest()" ${elementalCores < CORE_HARVEST_PRICE ? 'disabled' : ''}>Koop · 🔮${CORE_HARVEST_PRICE}</button>`;
  const coreSpeedMaxed = lvlCoreSpeed >= CORE_SPEED_LEVELS.length;
  const coreSpeedBtn = coreSpeedMaxed
    ? `<button class="equipped" disabled>Max niveau (${CORE_SPEED_LEVELS.length})</button>`
    : `<button class="buy" onclick="buyCoreSpeed()" ${elementalCores < CORE_SPEED_LEVELS[lvlCoreSpeed] ? 'disabled' : ''}>Koop niveau ${lvlCoreSpeed + 1}/${CORE_SPEED_LEVELS.length} · 🔮${CORE_SPEED_LEVELS[lvlCoreSpeed]}</button>`;
  const coreRegenMaxed = lvlCoreRegen >= CORE_REGEN_LEVELS.length;
  const coreRegenBtn = coreRegenMaxed
    ? `<button class="equipped" disabled>Max niveau (${CORE_REGEN_LEVELS.length})</button>`
    : `<button class="buy" onclick="buyCoreRegen()" ${elementalCores < CORE_REGEN_LEVELS[lvlCoreRegen] ? 'disabled' : ''}>Koop niveau ${lvlCoreRegen + 1}/${CORE_REGEN_LEVELS.length} · 🔮${CORE_REGEN_LEVELS[lvlCoreRegen]}</button>`;
  const coreVampireMaxed = lvlCoreVampire >= CORE_VAMPIRE_LEVELS.length;
  const coreVampireBtn = coreVampireMaxed
    ? `<button class="equipped" disabled>Max niveau (${CORE_VAMPIRE_LEVELS.length})</button>`
    : `<button class="buy" onclick="buyCoreVampire()" ${elementalCores < CORE_VAMPIRE_LEVELS[lvlCoreVampire] ? 'disabled' : ''}>Koop niveau ${lvlCoreVampire + 1}/${CORE_VAMPIRE_LEVELS.length} · 🔮${CORE_VAMPIRE_LEVELS[lvlCoreVampire]}</button>`;
  const coreAuraBtn = hasCoreAura
    ? `<button class="equipped" disabled>Ontgrendeld</button>`
    : `<button class="buy" onclick="buyCoreAura()" ${elementalCores < CORE_AURA_PRICE ? 'disabled' : ''}>Koop · 🔮${CORE_AURA_PRICE}</button>`;
  const coreShockBtn = hasCoreShock
    ? `<button class="equipped" disabled>Ontgrendeld</button>`
    : `<button class="buy" onclick="buyCoreShock()" ${elementalCores < CORE_SHOCK_PRICE ? 'disabled' : ''}>Koop · 🔮${CORE_SHOCK_PRICE}</button>`;

  document.getElementById('coreShopList').innerHTML = [
    `<div class="shopItem"><div class="info"><div class="name">${armor.name}</div><div class="desc">${armor.desc}</div></div>${ownedArmorBtn}</div>`,
    `<div class="shopItem"><div class="info"><div class="name">${weapon.name}</div><div class="desc">${weapon.desc}</div></div>${ownedWeaponBtn}</div>`,
    `<div class="shopItem"><div class="info"><div class="name">${skin.name}</div><div class="desc">${skin.desc}</div></div>${ownedSkinBtn}</div>`,
    `<div class="shopItem"><div class="info"><div class="name">Kernkracht (Lv. ${lvlCoreDamage}/${CORE_DAMAGE_LEVELS.length})</div><div class="desc">Verhoogt permanent je schade in Wereld 2 met een percentage, bovenop alle andere schadebonussen. Niveau 1: +${Math.round(CORE_DAMAGE_PER_LEVEL*100)}% schade. Niveau 2: +${Math.round(CORE_DAMAGE_PER_LEVEL*200)}%. Niveau 3: +${Math.round(CORE_DAMAGE_PER_LEVEL*300)}%.</div></div>${coreDamageBtn}</div>`,
    `<div class="shopItem"><div class="info"><div class="name">Kernschild (Lv. ${lvlCoreShield}/${CORE_SHIELD_LEVELS.length})</div><div class="desc">Vermindert permanent alle inkomende schade in Wereld 2 met een vast percentage, bovenop pantser en andere reducties. Niveau 1: -${Math.round(CORE_SHIELD_REDUCTIONS[0]*100)}% schade. Niveau 2: -${Math.round(CORE_SHIELD_REDUCTIONS[1]*100)}%. Niveau 3: -${Math.round(CORE_SHIELD_REDUCTIONS[2]*100)}%.</div></div>${coreShieldBtn}</div>`,
    `<div class="shopItem"><div class="info"><div class="name">Kernoogst</div><div class="desc">Eenmalig te koop: verhoogt permanent hoeveel Elemental Cores je verdient per verslagen boss tijdens Eindbaas Rush in Wereld 2. +${CORE_HARVEST_BONUS} Cores per boss, voor altijd.</div></div>${coreHarvestBtn}</div>`,
    `<div class="shopItem"><div class="info"><div class="name">Kernsnelheid (Lv. ${lvlCoreSpeed}/${CORE_SPEED_LEVELS.length})</div><div class="desc">Verhoogt permanent je bewegingssnelheid in Wereld 2. Niveau 1: +${Math.round(CORE_SPEED_PER_LEVEL*100)}% snelheid. Niveau 2: +${Math.round(CORE_SPEED_PER_LEVEL*200)}%. Niveau 3: +${Math.round(CORE_SPEED_PER_LEVEL*300)}%.</div></div>${coreSpeedBtn}</div>`,
    `<div class="shopItem"><div class="info"><div class="name">Kernregeneratie (Lv. ${lvlCoreRegen}/${CORE_REGEN_LEVELS.length})</div><div class="desc">Geneest je passief elke seconde in Wereld 2, bovenop regeneratie van je pantser. Niveau 1: +${CORE_REGEN_PER_LEVEL} HP/sec. Niveau 2: +${CORE_REGEN_PER_LEVEL*2} HP/sec. Niveau 3: +${CORE_REGEN_PER_LEVEL*3} HP/sec.</div></div>${coreRegenBtn}</div>`,
    `<div class="shopItem"><div class="info"><div class="name">Kernvampier (Lv. ${lvlCoreVampire}/${CORE_VAMPIRE_LEVELS.length})</div><div class="desc">Geneest je extra bij elke gedode bot in Wereld 2, bovenop vampier-effecten van je pantser. Niveau 1: +${CORE_VAMPIRE_PER_LEVEL} HP per kill. Niveau 2: +${CORE_VAMPIRE_PER_LEVEL*2} HP per kill. Niveau 3: +${CORE_VAMPIRE_PER_LEVEL*3} HP per kill.</div></div>${coreVampireBtn}</div>`,
    `<div class="shopItem"><div class="info"><div class="name">Kernaura</div><div class="desc">Eenmalig te koop: zolang je in Wereld 2 speelt, heb je een permanente, zwakke schade-aura om je heen (radius ${CORE_AURA_RADIUS}px, ${CORE_AURA_DMG} schade per tik) die alle bots dichtbij voortdurend raakt.</div></div>${coreAuraBtn}</div>`,
    `<div class="shopItem"><div class="info"><div class="name">Kernschok</div><div class="desc">Eenmalig te koop: elke kogel die je in Wereld 2 afvuurt heeft ${Math.round(CORE_SHOCK_CHANCE*100)}% kans om over te springen naar een nabije bot, ongeacht welk wapen je gebruikt.</div></div>${coreShockBtn}</div>`
  ].join('');
}
window.renderCoreShop = renderCoreShop;

function openCoreShop() {
  if (currentWorld !== 2) return;
  document.getElementById(menuScreenId()).style.display = 'none';
  document.getElementById('coreShopScreen').style.display = 'flex';
  renderCoreShop();
}
window.openCoreShop = openCoreShop;

function closeCoreShop() {
  document.getElementById('coreShopScreen').style.display = 'none';
  document.getElementById(menuScreenId()).style.display = 'flex';
}
window.closeCoreShop = closeCoreShop;

function saveWeaponSkinsState() {
  localStorage.setItem('botShooterOwnedWeaponSkins', JSON.stringify(ownedWeaponSkins));
  localStorage.setItem('botShooterEquippedWeaponSkins', JSON.stringify(equippedWeaponSkins));
}

function buyWeaponSkin(id) {
  const ws = WEAPON_SKINS.find(w => w.id === id);
  if (!ws || ownedWeaponSkins.includes(id) || coins < ws.price) return;
  coins -= ws.price;
  ownedWeaponSkins.push(id);
  saveShopState();
  saveWeaponSkinsState();
  renderWeaponSkinsShop();
}
window.buyWeaponSkin = buyWeaponSkin;

function equipWeaponSkin(weaponId, skinId) {
  if (skinId !== 'default' && !ownedWeaponSkins.includes(skinId)) return;
  if (skinId === 'default') delete equippedWeaponSkins[weaponId];
  else equippedWeaponSkins[weaponId] = skinId;
  saveWeaponSkinsState();
  renderWeaponSkinsShop();
}
window.equipWeaponSkin = equipWeaponSkin;

function renderWeaponSkinsGroup(weapons) {
  return weapons.map(w => {
    const skins = WEAPON_SKINS.filter(ws => ws.weaponId === w.id);
    const equipped = equippedWeaponSkins[w.id] || 'default';
    const rows = skins.map(ws => {
      const owned = ownedWeaponSkins.includes(ws.id);
      const btn = owned
        ? `<button class="${equipped === ws.id ? 'equipped' : 'equip'}" ${equipped === ws.id ? 'disabled' : ''} onclick="equipWeaponSkin('${w.id}', '${ws.id}')" style="border-color:${ws.color}; color:${ws.color};">${equipped === ws.id ? 'Uitgerust' : 'Uitrusten'}</button>`
        : `<button class="buy" onclick="buyWeaponSkin('${ws.id}')" ${coins < ws.price ? 'disabled' : ''} style="border-color:${ws.color}; color:${ws.color};">Koop · 🪙${ws.price}</button>`;
      return `<div class="shopItem">
        <canvas id="wsPreview_${ws.id}" width="70" height="40" style="background:#0a0a14; border-radius:8px; margin-right:10px; flex-shrink:0;"></canvas>
        <div class="info"><div class="name" style="color:${ws.color};">${ws.name}</div></div>
        <div style="display:flex; flex-direction:column; gap:6px; align-items:stretch;">${btn}<button class="equip" onclick="previewWeaponSkin('${ws.id}')">👁 Bekijk</button></div>
      </div>`;
    }).join('');
    return `<div class="shopItem" style="flex-direction:column; align-items:stretch;">
      <div class="info"><div class="name">${w.name}</div><div class="desc">Kies een kogelkleur voor dit wapen.</div></div>
      <button class="${equipped === 'default' ? 'equipped' : 'equip'}" ${equipped === 'default' ? 'disabled' : ''} onclick="equipWeaponSkin('${w.id}', 'default')" style="margin-bottom:8px;">Standaard uitrusten</button>
      ${rows}
    </div>`;
  }).join('');
}

function renderWeaponSkinsShop() {
  document.getElementById('weaponSkinsCoins').textContent = coins;
  document.getElementById('weaponSkinsListW1').innerHTML = renderWeaponSkinsGroup(SPECIAL_WEAPONS);
  document.getElementById('weaponSkinsListW2').innerHTML = renderWeaponSkinsGroup(WORLD2_SPECIAL_WEAPONS);
}
window.renderWeaponSkinsShop = renderWeaponSkinsShop;

let weaponSkinPreviewRAF = null;
function previewWeaponSkin(id) {
  if (weaponSkinPreviewRAF) cancelAnimationFrame(weaponSkinPreviewRAF);
  const ws = WEAPON_SKINS.find(w => w.id === id);
  const canvasEl = document.getElementById(`wsPreview_${id}`);
  if (!ws || !canvasEl) return;
  const c = canvasEl.getContext('2d');
  const w = canvasEl.width, h = canvasEl.height;
  function frame() {
    c.clearRect(0, 0, w, h);
    const x = ((performance.now() / 600) % 1) * (w + 20) - 10;
    c.fillStyle = ws.color;
    c.beginPath(); c.arc(x, h / 2, 7, 0, Math.PI * 2); c.fill();
    c.fillStyle = ws.coreColor;
    c.beginPath(); c.arc(x, h / 2, 3.5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = ws.coreColor;
    c.lineWidth = 1;
    c.beginPath(); c.arc(x, h / 2, 9, 0, Math.PI * 2); c.stroke();
    weaponSkinPreviewRAF = requestAnimationFrame(frame);
  }
  frame();
}
window.previewWeaponSkin = previewWeaponSkin;

function openCosmeticsHub() {
  document.getElementById(menuScreenId()).style.display = 'none';
  document.getElementById('cosmeticsScreen').style.display = 'flex';
}
window.openCosmeticsHub = openCosmeticsHub;

function closeCosmeticsHub() {
  document.getElementById('cosmeticsScreen').style.display = 'none';
  document.getElementById(menuScreenId()).style.display = 'flex';
}
window.closeCosmeticsHub = closeCosmeticsHub;

function openWeaponSkinsShop() {
  document.getElementById('cosmeticsScreen').style.display = 'none';
  document.getElementById('weaponSkinsScreen').style.display = 'flex';
  renderWeaponSkinsShop();
}
window.openWeaponSkinsShop = openWeaponSkinsShop;

function closeWeaponSkinsShop() {
  if (weaponSkinPreviewRAF) { cancelAnimationFrame(weaponSkinPreviewRAF); weaponSkinPreviewRAF = null; }
  document.getElementById('weaponSkinsScreen').style.display = 'none';
  document.getElementById('cosmeticsScreen').style.display = 'flex';
}
window.closeWeaponSkinsShop = closeWeaponSkinsShop;

function buyDeathAnimation(id) {
  const d = DEATH_ANIMATIONS.find(x => x.id === id);
  if (!d || ownedDeathAnimations.includes(id) || coins < d.price) return;
  coins -= d.price;
  ownedDeathAnimations.push(id);
  saveShopState();
  localStorage.setItem('botShooterOwnedDeathAnimations', JSON.stringify(ownedDeathAnimations));
  renderDeathAnimShop();
}
window.buyDeathAnimation = buyDeathAnimation;

function equipDeathAnimation(id) {
  if (!ownedDeathAnimations.includes(id)) return;
  equippedDeathAnimation = id;
  localStorage.setItem('botShooterEquippedDeathAnimation', equippedDeathAnimation);
  renderDeathAnimShop();
}
window.equipDeathAnimation = equipDeathAnimation;

function renderDeathAnimShop() {
  document.getElementById('deathAnimCoins').textContent = coins;
  document.getElementById('deathAnimList').innerHTML = DEATH_ANIMATIONS.map(d => {
    const owned = ownedDeathAnimations.includes(d.id);
    const equipped = equippedDeathAnimation === d.id;
    const btn = equipped
      ? `<button class="equipped" disabled>Uitgerust</button>`
      : owned
        ? `<button class="equip" onclick="equipDeathAnimation('${d.id}')">Uitrusten</button>`
        : `<button class="buy" onclick="buyDeathAnimation('${d.id}')" ${coins < d.price ? 'disabled' : ''}>Koop · 🪙${d.price}</button>`;
    return `<div class="shopItem"><canvas id="deathAnimPreview_${d.id}" width="60" height="60" style="background:#0a0a14; border-radius:8px; margin-right:10px; flex-shrink:0;"></canvas><div class="info"><div class="name">${d.name}</div><div class="desc">${d.desc}</div></div>
      <div style="display:flex; flex-direction:column; gap:6px; align-items:stretch;">${btn}<button class="equip" onclick="previewDeathAnimation('${d.id}')">👁 Bekijk</button></div></div>`;
  }).join('');
  DEATH_ANIMATIONS.forEach(d => {
    const canvasEl = document.getElementById(`deathAnimPreview_${d.id}`);
    if (!canvasEl) return;
    const c = canvasEl.getContext('2d');
    c.clearRect(0, 0, canvasEl.width, canvasEl.height);
    c.save();
    c.translate(canvasEl.width / 2, canvasEl.height / 2);
    drawPlayerSkin(c, getSkin(), 16);
    c.restore();
  });
}
window.renderDeathAnimShop = renderDeathAnimShop;

let deathAnimPreviewRAF = null;
function previewDeathAnimation(id) {
  if (deathAnimPreviewRAF) cancelAnimationFrame(deathAnimPreviewRAF);
  const canvasEl = document.getElementById(`deathAnimPreview_${id}`);
  if (!canvasEl) return;
  const c = canvasEl.getContext('2d');
  const w = canvasEl.width, h = canvasEl.height;
  const start = performance.now();
  const loopDur = DEATH_ANIM_DURATION + 600; // korte pauze tussen elke herhaling
  function frame() {
    const elapsed = (performance.now() - start) % loopDur;
    c.clearRect(0, 0, w, h);
    c.save();
    c.translate(w / 2, h / 2);
    if (elapsed < DEATH_ANIM_DURATION) {
      drawDeathAnimation(c, id, elapsed, 16);
    } else {
      drawPlayerSkin(c, getSkin(), 16);
    }
    c.restore();
    deathAnimPreviewRAF = requestAnimationFrame(frame);
  }
  frame();
}
window.previewDeathAnimation = previewDeathAnimation;

function openDeathAnimShop() {
  document.getElementById('cosmeticsScreen').style.display = 'none';
  document.getElementById('deathAnimScreen').style.display = 'flex';
  renderDeathAnimShop();
}
window.openDeathAnimShop = openDeathAnimShop;

function closeDeathAnimShop() {
  if (deathAnimPreviewRAF) { cancelAnimationFrame(deathAnimPreviewRAF); deathAnimPreviewRAF = null; }
  document.getElementById('deathAnimScreen').style.display = 'none';
  document.getElementById('cosmeticsScreen').style.display = 'flex';
}
window.closeDeathAnimShop = closeDeathAnimShop;

function drawBotKillEffectIdle(c, r) {
  c.fillStyle = '#e05c5c';
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#8a2f2f';
  c.lineWidth = 2;
  c.stroke();
}

function buyBotKillEffect(id) {
  const d = BOT_KILL_EFFECTS.find(x => x.id === id);
  if (!d || ownedBotKillEffects.includes(id) || coins < d.price) return;
  coins -= d.price;
  ownedBotKillEffects.push(id);
  saveShopState();
  localStorage.setItem('botShooterOwnedBotKillEffects', JSON.stringify(ownedBotKillEffects));
  renderBotKillEffectShop();
}
window.buyBotKillEffect = buyBotKillEffect;

function equipBotKillEffect(id) {
  if (!ownedBotKillEffects.includes(id)) return;
  equippedBotKillEffect = id;
  localStorage.setItem('botShooterEquippedBotKillEffect', equippedBotKillEffect);
  renderBotKillEffectShop();
}
window.equipBotKillEffect = equipBotKillEffect;

function renderBotKillEffectShop() {
  document.getElementById('botKillEffectCoins').textContent = coins;
  document.getElementById('botKillEffectList').innerHTML = BOT_KILL_EFFECTS.map(d => {
    const owned = ownedBotKillEffects.includes(d.id);
    const equipped = equippedBotKillEffect === d.id;
    const btn = equipped
      ? `<button class="equipped" disabled>Uitgerust</button>`
      : owned
        ? `<button class="equip" onclick="equipBotKillEffect('${d.id}')">Uitrusten</button>`
        : `<button class="buy" onclick="buyBotKillEffect('${d.id}')" ${coins < d.price ? 'disabled' : ''}>Koop · 🪙${d.price}</button>`;
    return `<div class="shopItem"><canvas id="botKillEffectPreview_${d.id}" width="60" height="60" style="background:#0a0a14; border-radius:8px; margin-right:10px; flex-shrink:0;"></canvas><div class="info"><div class="name">${d.name}</div><div class="desc">${d.desc}</div></div>
      <div style="display:flex; flex-direction:column; gap:6px; align-items:stretch;">${btn}<button class="equip" onclick="previewBotKillEffect('${d.id}')">👁 Bekijk</button></div></div>`;
  }).join('');
  BOT_KILL_EFFECTS.forEach(d => {
    const canvasEl = document.getElementById(`botKillEffectPreview_${d.id}`);
    if (!canvasEl) return;
    const c = canvasEl.getContext('2d');
    c.clearRect(0, 0, canvasEl.width, canvasEl.height);
    c.save();
    c.translate(canvasEl.width / 2, canvasEl.height / 2);
    drawBotKillEffectIdle(c, 16);
    c.restore();
  });
}
window.renderBotKillEffectShop = renderBotKillEffectShop;

let botKillEffectPreviewRAF = null;
function previewBotKillEffect(id) {
  if (botKillEffectPreviewRAF) cancelAnimationFrame(botKillEffectPreviewRAF);
  const canvasEl = document.getElementById(`botKillEffectPreview_${id}`);
  if (!canvasEl) return;
  const c = canvasEl.getContext('2d');
  const w = canvasEl.width, h = canvasEl.height;
  const effect = BOT_KILL_EFFECTS.find(x => x.id === id);
  const effDur = (effect && effect.duration) || 500;
  const start = performance.now();
  const loopDur = effDur + 500;
  function frame() {
    const elapsed = (performance.now() - start) % loopDur;
    c.clearRect(0, 0, w, h);
    c.save();
    c.translate(w / 2, h / 2);
    if (elapsed < effDur) {
      drawBotKillEffect(c, id, elapsed, 16);
    } else {
      drawBotKillEffectIdle(c, 16);
    }
    c.restore();
    botKillEffectPreviewRAF = requestAnimationFrame(frame);
  }
  frame();
}
window.previewBotKillEffect = previewBotKillEffect;

function openBotKillEffectShop() {
  document.getElementById('cosmeticsScreen').style.display = 'none';
  document.getElementById('botKillEffectScreen').style.display = 'flex';
  renderBotKillEffectShop();
}
window.openBotKillEffectShop = openBotKillEffectShop;

function closeBotKillEffectShop() {
  if (botKillEffectPreviewRAF) { cancelAnimationFrame(botKillEffectPreviewRAF); botKillEffectPreviewRAF = null; }
  document.getElementById('botKillEffectScreen').style.display = 'none';
  document.getElementById('cosmeticsScreen').style.display = 'flex';
}
window.closeBotKillEffectShop = closeBotKillEffectShop;

function buyIntroAnimation(id) {
  const d = INTRO_ANIMATIONS.find(x => x.id === id);
  if (!d || ownedIntroAnimations.includes(id) || coins < d.price) return;
  coins -= d.price;
  ownedIntroAnimations.push(id);
  saveShopState();
  localStorage.setItem('botShooterOwnedIntroAnimations', JSON.stringify(ownedIntroAnimations));
  renderIntroAnimShop();
}
window.buyIntroAnimation = buyIntroAnimation;

function equipIntroAnimation(id) {
  if (!ownedIntroAnimations.includes(id)) return;
  equippedIntroAnimation = id;
  localStorage.setItem('botShooterEquippedIntroAnimation', equippedIntroAnimation);
  renderIntroAnimShop();
}
window.equipIntroAnimation = equipIntroAnimation;

function renderIntroAnimShop() {
  document.getElementById('introAnimCoins').textContent = coins;
  document.getElementById('introAnimList').innerHTML = INTRO_ANIMATIONS.map(d => {
    const owned = ownedIntroAnimations.includes(d.id);
    const equipped = equippedIntroAnimation === d.id;
    const btn = equipped
      ? `<button class="equipped" disabled>Uitgerust</button>`
      : owned
        ? `<button class="equip" onclick="equipIntroAnimation('${d.id}')">Uitrusten</button>`
        : `<button class="buy" onclick="buyIntroAnimation('${d.id}')" ${coins < d.price ? 'disabled' : ''}>Koop · 🪙${d.price}</button>`;
    return `<div class="shopItem"><canvas id="introAnimPreview_${d.id}" width="60" height="60" style="background:#0a0a14; border-radius:8px; margin-right:10px; flex-shrink:0;"></canvas><div class="info"><div class="name">${d.name}</div><div class="desc">${d.desc}</div></div>
      <div style="display:flex; flex-direction:column; gap:6px; align-items:stretch;">${btn}<button class="equip" onclick="previewIntroAnimation('${d.id}')">👁 Bekijk</button></div></div>`;
  }).join('');
  INTRO_ANIMATIONS.forEach(d => {
    const canvasEl = document.getElementById(`introAnimPreview_${d.id}`);
    if (!canvasEl) return;
    const c = canvasEl.getContext('2d');
    c.clearRect(0, 0, canvasEl.width, canvasEl.height);
    c.save();
    c.translate(canvasEl.width / 2, canvasEl.height / 2);
    drawPlayerSkin(c, getSkin(), 16);
    c.restore();
  });
}
window.renderIntroAnimShop = renderIntroAnimShop;

let introAnimPreviewRAF = null;
function previewIntroAnimation(id) {
  if (introAnimPreviewRAF) cancelAnimationFrame(introAnimPreviewRAF);
  const canvasEl = document.getElementById(`introAnimPreview_${id}`);
  if (!canvasEl) return;
  const c = canvasEl.getContext('2d');
  const w = canvasEl.width, h = canvasEl.height;
  const start = performance.now();
  const loopDur = INTRO_ANIM_DURATION + 600;
  function frame() {
    const elapsed = (performance.now() - start) % loopDur;
    c.clearRect(0, 0, w, h);
    c.save();
    c.translate(w / 2, h / 2);
    if (elapsed < INTRO_ANIM_DURATION) {
      drawIntroAnimation(c, id, elapsed, 16);
    } else {
      drawPlayerSkin(c, getSkin(), 16);
    }
    c.restore();
    introAnimPreviewRAF = requestAnimationFrame(frame);
  }
  frame();
}
window.previewIntroAnimation = previewIntroAnimation;

function openIntroAnimShop() {
  document.getElementById('cosmeticsScreen').style.display = 'none';
  document.getElementById('introAnimScreen').style.display = 'flex';
  renderIntroAnimShop();
}
window.openIntroAnimShop = openIntroAnimShop;

function closeIntroAnimShop() {
  if (introAnimPreviewRAF) { cancelAnimationFrame(introAnimPreviewRAF); introAnimPreviewRAF = null; }
  document.getElementById('introAnimScreen').style.display = 'none';
  document.getElementById('cosmeticsScreen').style.display = 'flex';
}
window.closeIntroAnimShop = closeIntroAnimShop;

function formatCooldown(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

let mysteryBoxLastResult = null;
function openMysteryBox() {
  if (!mysteryBoxReady() || coins < MYSTERY_BOX_PRICE) return;
  coins -= MYSTERY_BOX_PRICE;
  lastMysteryBoxOpen = Date.now();
  localStorage.setItem('botShooterLastMysteryBoxOpen', lastMysteryBoxOpen);
  const amount = rollMysteryBoxReward();
  coins += amount;
  mysteryBoxLastResult = `🪙 Je wint ${amount} munten!`;
  saveShopState();
  renderMysteryBoxScreen();
}
window.openMysteryBox = openMysteryBox;

function renderMysteryBoxScreen() {
  document.getElementById('mysteryBoxCoins').textContent = coins;
  const ready = mysteryBoxReady();
  const btn = ready
    ? `<button class="buy" onclick="openMysteryBox()" ${coins < MYSTERY_BOX_PRICE ? 'disabled' : ''}>🎁 Open · 🪙${MYSTERY_BOX_PRICE}</button>`
    : `<button class="buy" disabled>⏳ Weer beschikbaar over ${formatCooldown(mysteryBoxTimeLeft())}</button>`;
  const resultHtml = mysteryBoxLastResult ? `<div class="statsRow"><span class="statsValue">${mysteryBoxLastResult}</span></div>` : '';
  const oddsRows = MYSTERY_BOX_TABLE.map(e => `<tr><td>${Math.round(e.chance * 100)}%</td><td>🪙 ${e.amount}</td></tr>`).join('');
  document.getElementById('mysteryBoxContent').innerHTML = `
    <div class="shopItem"><div class="info"><div class="name">Mysterie-doos</div><div class="desc">Munten volgens onderstaande kanstabel. Eén keer per half uur te openen.</div></div>${btn}</div>
    ${resultHtml}
    <table class="mysteryOddsTable">
      <tr><th>Kans</th><th>Munten</th></tr>
      ${oddsRows}
    </table>
  `;
}
window.renderMysteryBoxScreen = renderMysteryBoxScreen;

let mysteryBoxTickInterval = null;
function openMysteryBoxScreen() {
  document.getElementById(menuScreenId()).style.display = 'none';
  document.getElementById('mysteryBoxScreen').style.display = 'flex';
  renderMysteryBoxScreen();
  if (mysteryBoxTickInterval) clearInterval(mysteryBoxTickInterval);
  mysteryBoxTickInterval = setInterval(renderMysteryBoxScreen, 1000);
}
window.openMysteryBoxScreen = openMysteryBoxScreen;

function closeMysteryBoxScreen() {
  if (mysteryBoxTickInterval) { clearInterval(mysteryBoxTickInterval); mysteryBoxTickInterval = null; }
  document.getElementById('mysteryBoxScreen').style.display = 'none';
  document.getElementById(menuScreenId()).style.display = 'flex';
}
window.closeMysteryBoxScreen = closeMysteryBoxScreen;

function renderStatsScreen() {
  const rows = [
    ['Totaal aantal kills', totalLifetimeKills.toLocaleString('nl-NL')],
    ['Favoriete wapen', favoriteWeaponName()],
    ['Hoogste killstreak', highestComboStreak.toLocaleString('nl-NL')]
  ];
  document.getElementById('statsList').innerHTML = rows.map(([label, value]) =>
    `<div class="statsRow"><span class="statsLabel">${label}</span><span class="statsValue">${value}</span></div>`
  ).join('');
}

function openStatsScreen() {
  document.getElementById(menuScreenId()).style.display = 'none';
  document.getElementById('statsScreen').style.display = 'flex';
  renderStatsScreen();
}
window.openStatsScreen = openStatsScreen;

function closeStatsScreen() {
  document.getElementById('statsScreen').style.display = 'none';
  document.getElementById(menuScreenId()).style.display = 'flex';
}
window.closeStatsScreen = closeStatsScreen;

function openKeybindsScreen() {
  // Nu ook bereikbaar via de vaste knop linksboven, dus mogelijk tijdens een lopend potje — laat het menuscherm dan met rust
  if (!(loopRunning && !gameOver)) document.getElementById(menuScreenId()).style.display = 'none';
  document.getElementById('keybindsScreen').style.display = 'flex';
}
window.openKeybindsScreen = openKeybindsScreen;

function closeKeybindsScreen() {
  document.getElementById('keybindsScreen').style.display = 'none';
  if (!(loopRunning && !gameOver)) document.getElementById(menuScreenId()).style.display = 'flex';
}
window.closeKeybindsScreen = closeKeybindsScreen;

function buyDroneUpgrade() {
  const price = DRONE_UPGRADE_PRICES[lvlDroneUpgrade];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvlDroneUpgrade++;
  saveShopState();
  renderDroneInfoList();
}
window.buyDroneUpgrade = buyDroneUpgrade;

let droneShowNextLevelPreview = false;
function toggleDroneNextLevelPreview() {
  droneShowNextLevelPreview = !droneShowNextLevelPreview;
  renderDroneInfoList();
}
window.toggleDroneNextLevelPreview = toggleDroneNextLevelPreview;

function drawDroneCanvasPreview(canvasId, lvl) {
  const canvasEl = document.getElementById(canvasId);
  if (!canvasEl) return;
  const c = canvasEl.getContext('2d');
  c.clearRect(0, 0, canvasEl.width, canvasEl.height);
  c.save();
  c.translate(canvasEl.width / 2, canvasEl.height / 2);
  drawDroneShape(c, droneScale(lvl), droneColor(lvl));
  c.restore();
}

function renderDroneInfoList() {
  const maxLevel = DRONE_UPGRADE_PRICES.length;
  const maxed = lvlDroneUpgrade >= maxLevel;
  const nextLevel = Math.min(lvlDroneUpgrade + 1, maxLevel);
  const canPreviewNext = !maxed;
  const previewLevel = (droneShowNextLevelPreview && canPreviewNext) ? nextLevel : lvlDroneUpgrade;
  const upgradeBtn = maxed
    ? `<button class="equipped" disabled>Max niveau (${maxLevel})</button>`
    : `<button class="buy" onclick="buyDroneUpgrade()" ${coins < DRONE_UPGRADE_PRICES[lvlDroneUpgrade] ? 'disabled' : ''}>Koop niveau ${lvlDroneUpgrade + 1}/${maxLevel} · 🪙${DRONE_UPGRADE_PRICES[lvlDroneUpgrade]}</button>`;
  const previewBtn = canPreviewNext
    ? `<button class="equip" onclick="toggleDroneNextLevelPreview()">${droneShowNextLevelPreview ? '👁 Toon huidig niveau' : '👁 Bekijk volgend niveau'}</button>`
    : '';
  const statsForLevel = lvl => `${droneDmg(lvl)} schade, elke ${(droneCooldown(lvl) / 1000).toFixed(2)}s`;
  const upgradeDesc = maxed
    ? `Max niveau bereikt: ${statsForLevel(lvlDroneUpgrade)}.`
    : `Huidig niveau ${lvlDroneUpgrade} (${statsForLevel(lvlDroneUpgrade)}). Volgend niveau ${nextLevel}: ${statsForLevel(nextLevel)} — ook groter en feller van kleur.`;
  document.getElementById('droneInfoList').innerHTML =
    `<div class="shopItem"><canvas id="droneUpgradePreview" width="70" height="70" style="background:#0a0a14; border-radius:8px; margin-right:10px; flex-shrink:0;"></canvas>
      <div class="info"><div class="name">Drone Upgrade (Lv. ${lvlDroneUpgrade}/${maxLevel})</div><div class="desc">${upgradeDesc}</div></div>
      <div style="display:flex; flex-direction:column; gap:6px; align-items:stretch;">${upgradeBtn}${previewBtn}</div>
    </div>` +
    KILLSTREAK_DRONES.map((drone, i) =>
      `<div class="shopItem"><canvas id="droneInfoPreview_${i}" width="60" height="60" style="background:#0a0a14; border-radius:8px; margin-right:10px; flex-shrink:0;"></canvas><div class="info"><div class="name">Drone ${i + 1}</div><div class="desc">Verschijnt vanaf killstreak ${drone.threshold}, verdwijnt zodra je streak weer onder de ${drone.threshold} zakt. Vuurt automatisch op de dichtstbijzijnde bot.</div></div></div>`
    ).join('');
  drawDroneCanvasPreview('droneUpgradePreview', previewLevel);
  KILLSTREAK_DRONES.forEach((drone, i) => drawDroneCanvasPreview(`droneInfoPreview_${i}`, lvlDroneUpgrade));
}

function openDroneInfoScreen() {
  document.getElementById(menuScreenId()).style.display = 'none';
  document.getElementById('droneInfoScreen').style.display = 'flex';
  renderDroneInfoList();
}
window.openDroneInfoScreen = openDroneInfoScreen;

function closeDroneInfoScreen() {
  droneShowNextLevelPreview = false;
  document.getElementById('droneInfoScreen').style.display = 'none';
  document.getElementById(menuScreenId()).style.display = 'flex';
}
window.closeDroneInfoScreen = closeDroneInfoScreen;

function buyTrail(id) {
  const t = TRAILS.find(x => x.id === id);
  if (!t || ownedTrails.includes(id) || coins < t.price) return;
  coins -= t.price;
  ownedTrails.push(id);
  saveShopState();
  localStorage.setItem('botShooterOwnedTrails', JSON.stringify(ownedTrails));
  renderTrailShop();
}
window.buyTrail = buyTrail;

function equipTrail(id) {
  if (!ownedTrails.includes(id)) return;
  equippedTrail = id;
  localStorage.setItem('botShooterEquippedTrail', equippedTrail);
  renderTrailShop();
}
window.equipTrail = equipTrail;

function renderTrailShop() {
  document.getElementById('trailShopCoins').textContent = coins;
  document.getElementById('trailShopList').innerHTML = TRAILS.map(t => {
    const owned = ownedTrails.includes(t.id);
    const equipped = equippedTrail === t.id;
    const btn = equipped
      ? `<button class="equipped" disabled>Uitgerust</button>`
      : owned
        ? `<button class="equip" onclick="equipTrail('${t.id}')">Uitrusten</button>`
        : `<button class="buy" onclick="buyTrail('${t.id}')" ${coins < t.price ? 'disabled' : ''}>Koop · 🪙${t.price}</button>`;
    return `<div class="shopItem">
      <div style="width:60px; height:60px; border-radius:8px; margin-right:10px; flex-shrink:0; background:#0a0a14; display:flex; align-items:center; justify-content:center;">
        <div style="width:22px; height:22px; border-radius:50%; background:${t.color}; box-shadow:0 0 12px ${t.color};"></div>
      </div>
      <div class="info"><div class="name">${t.name}</div><div class="desc">${t.desc}</div></div>
      ${btn}
    </div>`;
  }).join('');
}
window.renderTrailShop = renderTrailShop;

function openTrailShop() {
  document.getElementById('cosmeticsScreen').style.display = 'none';
  document.getElementById('trailShopScreen').style.display = 'flex';
  renderTrailShop();
}
window.openTrailShop = openTrailShop;

function closeTrailShop() {
  document.getElementById('trailShopScreen').style.display = 'none';
  document.getElementById('cosmeticsScreen').style.display = 'flex';
}
window.closeTrailShop = closeTrailShop;

function buyMenuBackground(id) {
  const b = MENU_BACKGROUNDS.find(x => x.id === id);
  if (!b || ownedMenuBackgrounds.includes(id) || coins < b.price) return;
  coins -= b.price;
  ownedMenuBackgrounds.push(id);
  saveShopState();
  localStorage.setItem('botShooterOwnedMenuBackgrounds', JSON.stringify(ownedMenuBackgrounds));
  renderMenuBgShop();
}
window.buyMenuBackground = buyMenuBackground;

function applyMenuBgBodyClass() {
  document.body.classList.toggle('has-menu-bg', equippedMenuBackground !== 'none');
}

function equipMenuBackground(id) {
  if (!ownedMenuBackgrounds.includes(id)) return;
  equippedMenuBackground = id;
  localStorage.setItem('botShooterEquippedMenuBackground', equippedMenuBackground);
  applyMenuBgBodyClass();
  renderMenuBgShop();
}
window.equipMenuBackground = equipMenuBackground;

function renderMenuBgShop() {
  document.getElementById('menuBgShopCoins').textContent = coins;
  document.getElementById('menuBgShopList').innerHTML = MENU_BACKGROUNDS.map(b => {
    const owned = ownedMenuBackgrounds.includes(b.id);
    const equipped = equippedMenuBackground === b.id;
    const btn = equipped
      ? `<button class="equipped" disabled>Uitgerust</button>`
      : owned
        ? `<button class="equip" onclick="equipMenuBackground('${b.id}')">Uitrusten</button>`
        : `<button class="buy" onclick="buyMenuBackground('${b.id}')" ${coins < b.price ? 'disabled' : ''}>Koop · 🪙${b.price}</button>`;
    return `<div class="shopItem">
      <canvas id="menuBgPreview_${b.id}" width="90" height="60" style="background:#0a0a14; border-radius:8px; margin-right:10px; flex-shrink:0;"></canvas>
      <div class="info"><div class="name">${b.name}</div><div class="desc">${b.desc}</div></div>
      <div style="display:flex; flex-direction:column; gap:6px; align-items:stretch;">${btn}<button class="equip" onclick="previewMenuBackground('${b.id}')">👁 Bekijk</button></div>
    </div>`;
  }).join('');
}
window.renderMenuBgShop = renderMenuBgShop;

let menuBgPreviewRAF = null;
function previewMenuBackground(id) {
  if (menuBgPreviewRAF) cancelAnimationFrame(menuBgPreviewRAF);
  const canvasEl = document.getElementById(`menuBgPreview_${id}`);
  if (!canvasEl) return;
  const c = canvasEl.getContext('2d');
  function frame() {
    drawMenuBackground(canvasEl, c, id, 'preview');
    menuBgPreviewRAF = requestAnimationFrame(frame);
  }
  frame();
}
window.previewMenuBackground = previewMenuBackground;

function openMenuBgShop() {
  document.getElementById('cosmeticsScreen').style.display = 'none';
  document.getElementById('menuBgShopScreen').style.display = 'flex';
  renderMenuBgShop();
}
window.openMenuBgShop = openMenuBgShop;

function closeMenuBgShop() {
  if (menuBgPreviewRAF) { cancelAnimationFrame(menuBgPreviewRAF); menuBgPreviewRAF = null; }
  document.getElementById('menuBgShopScreen').style.display = 'none';
  document.getElementById('cosmeticsScreen').style.display = 'flex';
}
window.closeMenuBgShop = closeMenuBgShop;

function openKillCam() {
  if (!bestMomentSnapshot) return;
  document.getElementById('killCamLabel').textContent = bestMomentLabel;
  const video = document.getElementById('killCamVideo');
  video.src = bestMomentSnapshot;
  document.getElementById('killCamScreen').style.display = 'flex';
  video.currentTime = 0;
  video.play();
}
window.openKillCam = openKillCam;

function closeKillCam() {
  const video = document.getElementById('killCamVideo');
  video.pause();
  document.getElementById('killCamScreen').style.display = 'none';
}
window.closeKillCam = closeKillCam;

function startPractice(botName) {
  const type = [...BOT_TYPES, ...SPECIAL_BOT_TYPES, ...BOSS_TYPES, ...WORLD2_BOT_TYPES, ...WORLD2_SPECIAL_BOT_TYPES, ...WORLD2_BOSS_TYPES].find(t => t.name === botName);
  if (!type) return;

  gameMode = 'practice';
  practiceWeaponId = null;
  weaponPracticeActive = false;
  transformPracticeActive = false;
  disasterPracticeActive = false;
  disasterPracticeType = null;
  exitSkinPractice();
  document.getElementById('botsInfoScreen').style.display = 'none';
  document.getElementById('levelHud').style.display = 'none';
  document.getElementById('sprintHud').style.display = 'none';

  resetPlayer();
  bots = [];
  bullets = [];
  particles = [];
  powerups = [];
  coinPickups = [];
  explosions = [];
  botDeathAnimations = [];
  trailParticles = [];
  telegraphs = [];
  lightningBolts = [];
  fallingMeteors = [];
  treeGrabs = [];
  shockRings = [];
  lavaPools = [];
  iceLances = [];
  tornadoShots = [];
  rootDrags = [];
  fireRings = [];
  chasingCracks = [];
  staticShockUntil = 0;
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
    specialDLastUsed: performance.now() + 6000,
    specialDCooldown: type.specialDCooldown,
    specialELastUsed: performance.now() + 3000,
    specialECooldown: type.specialECooldown,
    specialFLastUsed: performance.now() + 5000,
    specialFCooldown: type.specialFCooldown,
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

let weaponPracticeActive = false;
let transformPracticeActive = false;
let transformPracticeId = 'none';
let disasterPracticeActive = false;
let disasterPracticeType = null;
let skinPracticeActive = false;
let skinPracticeId = null;
let previousEquippedSkin = null;
let powerupPreviewActive = false;
let powerupPreviewId = null;
const POWERUP_PREVIEW_DURATION = 6000;
// Powerups die maar één keer meteen iets doen met de bots die er op dat moment staan (bom, boomwortels, ...):
// die laten we iets later spawnen zodat de bots eerst het beeld in kunnen lopen. Powerups die een tijdje
// duren (aura, verwarring, snelvuur, ...) blijven toch actief terwijl de bots binnenkomen, dus die spawnen meteen.
const POWERUP_PREVIEW_DELAY_IDS = ['freeze', 'nuke', 'elementstorm', 'wortelgreep', 'vuurnova', 'ijsbries', 'strike', 'lightningbarrage'];
const POWERUP_PREVIEW_DELAY = 2000;

function exitSkinPractice() {
  if (skinPracticeActive) equippedSkin = previousEquippedSkin;
  skinPracticeActive = false;
  skinPracticeId = null;
}

function startWeaponPractice(weaponId) {
  practiceWeaponId = weaponId;
  weaponPracticeActive = true;
  transformPracticeActive = false;
  disasterPracticeActive = false;
  disasterPracticeType = null;
  exitSkinPractice();
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
  disasterPracticeActive = false;
  disasterPracticeType = null;
  exitSkinPractice();
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

function startSkinPractice(skinId) {
  practiceWeaponId = null;
  weaponPracticeActive = false;
  transformPracticeActive = false;
  disasterPracticeActive = false;
  disasterPracticeType = null;
  skinPracticeActive = true;
  skinPracticeId = skinId;
  previousEquippedSkin = equippedSkin;
  equippedSkin = skinId;
  gameMode = 'endless';
  document.getElementById('skinsShopScreen').style.display = 'none';
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
window.startSkinPractice = startSkinPractice;

function startDisasterPractice(disasterId) {
  practiceWeaponId = null;
  weaponPracticeActive = false;
  transformPracticeActive = false;
  disasterPracticeActive = true;
  disasterPracticeType = disasterId;
  exitSkinPractice();
  gameMode = 'endless';
  document.getElementById('disastersInfoScreen').style.display = 'none';
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
window.startDisasterPractice = startDisasterPractice;

function speedLabel(type) {
  const [min, max] = type.speed;
  if (max === 0) return 'Staat helemaal stil';
  const avg = (min + max) / 2;
  return `${avg.toFixed(1)} (bereik ${min.toFixed(1)}–${max.toFixed(1)})`;
}

function botCardHtml(type) {
  const name = BOT_DISPLAY_NAMES[type.name] || type.name;
  let patternDesc = (BOT_PATTERN_INFO[type.pattern] || '') + (type.splits ? ' Splitst bij dood in 2 zwakke minions.' : '')
    + (type.swapOnHit ? ' Schiet 2x per sec — als een kogel je raakt wissel je altijd van plek met deze bot en word je 3 sec vertraagd.' : '')
    + (type.splitsSelf ? ` Splitst 3 sec na zijn dood in ${type.splitsSelf} kleinere versies van zichzelf. Overleven die 8 sec, dan groeien ze weer terug tot een volwaardige Splitter die zelf ook weer kan splitsen.` : '');
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

function world2BotCardHtml(type) {
  const name = BOT_DISPLAY_NAMES[type.name] || type.name;
  const maxAvgSpeed = 3.6; // snelste bot in het spel (chaser), gebruikt als vaste referentie
  const avgSpeed = (type.speed[0] + type.speed[1]) / 2;
  const speedPct = Math.max(3, Math.round((avgSpeed / maxAvgSpeed) * 100));
  return `<div class="shopItem" style="align-items:flex-start;">
    <canvas class="botPreview" id="botPreview_${type.name}" width="60" height="60"></canvas>
    <div class="info">
      <div class="name">${name}</div>
      <div class="desc">HP: ${type.hp} &nbsp;·&nbsp; ${botDamageText(type)}</div>
      <div class="desc">Snelheid: ${speedLabel(type)}</div>
      <div class="speedBar"><div class="speedBarFill" style="width:${speedPct}%"></div></div>
      <div class="desc">${BOT_PATTERN_INFO[type.pattern] || ''}</div>
      <div class="desc" style="color:#777;">Verschijnt altijd in Wereld 2</div>
    </div>
    <button class="equip" onclick="startPractice('${type.name}')">🎯 Oefen</button>
  </div>`;
}

function renderBotsInfo() {
  if (currentWorld === 2) {
    document.getElementById('botsInfoList').innerHTML = WORLD2_BOT_TYPES.map(world2BotCardHtml).join('');
    document.getElementById('specialBotsInfoList').innerHTML = WORLD2_SPECIAL_BOT_TYPES.map(world2BotCardHtml).join('');
    document.getElementById('bossInfoList').innerHTML = WORLD2_BOSS_TYPES.map(botCardHtml).join('');
    [...WORLD2_BOT_TYPES, ...WORLD2_SPECIAL_BOT_TYPES, ...WORLD2_BOSS_TYPES].forEach(type => {
      const canvasEl = document.getElementById(`botPreview_${type.name}`);
      if (canvasEl) drawBotPreview(canvasEl, type);
    });
    return;
  }
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
  const w = WEAPONS.find(x => x.id === id) || SPECIAL_WEAPONS.find(x => x.id === id) || WORLD2_WEAPONS.find(x => x.id === id) || WORLD2_SPECIAL_WEAPONS.find(x => x.id === id);
  if (!w || w.coreOnly || ownedWeapons.includes(id) || coins < w.price) return;
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
  const a = ARMOR.find(x => x.id === id) || WORLD2_ARMOR.find(x => x.id === id);
  if (!a || a.coreOnly || ownedArmor.includes(id) || coins < a.price) return;
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
  const dualArmorOwned = currentWorld === 2 ? hasDualArmor2 : hasDualArmor;
  if (!dualArmorOwned || !ownedArmor.includes(id)) return;
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

function buyDualArmorSlot2() {
  if (hasDualArmor2 || coins < DUAL_ARMOR2_PRICE) return;
  coins -= DUAL_ARMOR2_PRICE;
  hasDualArmor2 = true;
  saveShopState();
  renderShop();
}
window.buyDualArmorSlot2 = buyDualArmorSlot2;

function buySkin(id) {
  const skin = SKINS.find(s => s.id === id);
  if (!skin || skin.coreOnly || ownedSkins.includes(id) || coins < skin.price) return;
  if (skin.achievementOnly && !unlockedAchievements.includes(skin.requiredAchievement)) return;
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
  document.getElementById('cosmeticsScreen').style.display = 'none';
  document.getElementById('skinsShopScreen').style.display = 'flex';
  renderSkinsShop();
}
window.openSkinsShop = openSkinsShop;

function closeSkinsShop() {
  document.getElementById('skinsShopScreen').style.display = 'none';
  document.getElementById('cosmeticsScreen').style.display = 'flex';
  document.getElementById(menuCoinsId()).textContent = coins;
}
window.closeSkinsShop = closeSkinsShop;

function renderSkinsShop() {
  document.getElementById('skinsShopCoins').textContent = coins;
  const renderSkinItem = (s, idSuffix = '') => {
    const owned = ownedSkins.includes(s.id);
    const equipped = equippedSkin === s.id;
    let btn;
    if (equipped) btn = `<button class="equipped" disabled>Uitgerust</button>`;
    else if (owned) btn = `<button class="equip" onclick="equipSkin('${s.id}')">Uitrusten</button>`;
    else if (s.achievementOnly && !unlockedAchievements.includes(s.requiredAchievement)) btn = `<button class="buy" disabled>🔒 Quest nodig</button>`;
    else btn = `<button class="buy" onclick="buySkin('${s.id}')" ${coins < s.price ? 'disabled' : ''}>Koop · 🪙${s.price}</button>`;
    const fav = isFavorite(`skin:${s.id}`);
    return `<div class="shopItem">
      <button class="favStar${fav ? ' active' : ''}" onclick="toggleFavorite('skin:${s.id}'); renderSkinsShop();" title="Favoriet">${fav ? '⭐' : '☆'}</button>
      <canvas class="botPreview" id="skinPreview_${s.id}${idSuffix}" width="60" height="60"></canvas>
      <div class="info">
        <div class="name">${s.name}</div>
        <div class="desc">${s.desc}</div>
      </div>
      <div style="display:flex; flex-direction:column; gap:6px; align-items:stretch;">
        ${btn}
        <button class="equip" onclick="startSkinPractice('${s.id}')">🎯 Oefen</button>
      </div>
    </div>`;
  };
  const killstreakSkins = sortFavoritesFirst(SKINS.filter(s => s.killstreak && !s.element && !s.coreOnly && !s.achievementOnly), 'skin');
  const elementSkins = sortFavoritesFirst(SKINS.filter(s => s.element && !s.killstreak && !s.coreOnly && !s.achievementOnly), 'skin');
  const elementKillstreakSkins = sortFavoritesFirst(SKINS.filter(s => s.element && s.killstreak && !s.coreOnly && !s.achievementOnly), 'skin');
  const normalSkins = sortFavoritesFirst(SKINS.filter(s => !s.killstreak && !s.element && !s.coreOnly && !s.achievementOnly), 'skin');
  const exclusiveSkins = sortFavoritesFirst(SKINS.filter(s => s.achievementOnly), 'skin');
  const elementSections = currentWorld === 2
    ? `<div class="shopSection"><h3>🔥🌍 Elementen Kill Streak</h3>${elementKillstreakSkins.map(s => renderSkinItem(s)).join('')}</div>` +
      `<div class="shopSection"><h3>🌍 Elementen Skins</h3>${elementSkins.map(s => renderSkinItem(s)).join('')}</div>`
    : '';
  const allShownSkins = [...killstreakSkins, ...(currentWorld === 2 ? [...elementKillstreakSkins, ...elementSkins] : []), ...normalSkins, ...exclusiveSkins];
  const favoriteSkins = allShownSkins.filter(s => isFavorite(`skin:${s.id}`));
  const favoriteSection = favoriteSkins.length > 0
    ? `<div class="shopSection"><h3>⭐ Favorieten</h3>${favoriteSkins.map(s => renderSkinItem(s, '_fav')).join('')}</div>`
    : '';
  document.getElementById('skinsShopList').innerHTML =
    favoriteSection +
    `<div class="shopSection"><h3>🔥 Kill Streak</h3>${killstreakSkins.map(s => renderSkinItem(s)).join('')}</div>` +
    elementSections +
    normalSkins.map(s => renderSkinItem(s)).join('') +
    `<div class="shopSection"><h3>🏆 Exclusieve Skins</h3>${exclusiveSkins.map(s => renderSkinItem(s)).join('')}</div>`;
  SKINS.forEach(s => {
    const canvasEl = document.getElementById(`skinPreview_${s.id}`);
    if (canvasEl) drawSkinPreview(canvasEl, s.id);
  });
  favoriteSkins.forEach(s => {
    const canvasEl = document.getElementById(`skinPreview_${s.id}_fav`);
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
  const t = TRANSFORMS.find(x => x.id === id) || WORLD2_TRANSFORMS.find(x => x.id === id);
  if (!t || ownedTransforms.includes(id) || coins < t.price) return;
  coins -= t.price;
  ownedTransforms.push(id);
  saveShopState();
  checkAchievements();
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
  document.getElementById(menuScreenId()).style.display = 'none';
  document.getElementById('transformShopScreen').style.display = 'flex';
  renderTransformShop();
}
window.openTransformShop = openTransformShop;

function closeTransformShop() {
  document.getElementById('transformShopScreen').style.display = 'none';
  document.getElementById(menuScreenId()).style.display = 'flex';
  document.getElementById(menuCoinsId()).textContent = coins;
}
window.closeTransformShop = closeTransformShop;

function transformCardHtml(t) {
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
}

function renderTransformShop() {
  document.getElementById('transformShopCoins').textContent = coins;
  if (currentWorld === 2) {
    document.getElementById('transformShopList').innerHTML = WORLD2_TRANSFORMS.map(transformCardHtml).join('');
    WORLD2_TRANSFORMS.forEach(t => {
      const canvasEl = document.getElementById(`transformPreview_${t.id}`);
      if (canvasEl) drawTransformPreview(canvasEl, t.id);
    });
    return;
  }
  document.getElementById('transformShopList').innerHTML = TRANSFORMS.map(transformCardHtml).join('');
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
  else if (transformId === 'fireform') drawPlayerFireForm(c, 20);
  else if (transformId === 'iceform') drawPlayerIceForm(c, 20);
  else if (transformId === 'earthform') drawPlayerEarthForm(c, 20);
  else if (transformId === 'windform') drawPlayerWindForm(c, 20);
  else if (transformId === 'waterform') drawPlayerWaterForm(c, 20);
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

function buyFireCore() {
  const price = FIRECORE_LEVELS[lvl2FireCore];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvl2FireCore++;
  saveShopState();
  renderShop();
}
window.buyFireCore = buyFireCore;

function buyFrostBlood() {
  const price = FROSTBLOOD_LEVELS[lvl2FrostBlood];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvl2FrostBlood++;
  saveShopState();
  renderShop();
}
window.buyFrostBlood = buyFrostBlood;

function buySteadfast() {
  const price = STEADFAST_LEVELS[lvl2Steadfast];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvl2Steadfast++;
  saveShopState();
  renderShop();
}
window.buySteadfast = buySteadfast;

function buyFastReload2() {
  const price = FASTRELOAD2_LEVELS[lvl2FastReload];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvl2FastReload++;
  saveShopState();
  renderShop();
}
window.buyFastReload2 = buyFastReload2;

function buyLongBoosts2() {
  const price = LONGBOOSTS2_LEVELS[lvl2LongBoosts];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvl2LongBoosts++;
  saveShopState();
  renderShop();
}
window.buyLongBoosts2 = buyLongBoosts2;

function buyMagnet2() {
  const price = MAGNET2_LEVELS[lvl2Magnet];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvl2Magnet++;
  saveShopState();
  renderShop();
}
window.buyMagnet2 = buyMagnet2;

function buyRevive2() {
  if (hasRevive2 || coins < REVIVE2_PRICE) return;
  coins -= REVIVE2_PRICE;
  hasRevive2 = true;
  saveShopState();
  renderShop();
}
window.buyRevive2 = buyRevive2;

function buyVengeance() {
  const price = VENGEANCE_LEVELS[lvl2Vengeance];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvl2Vengeance++;
  saveShopState();
  renderShop();
}
window.buyVengeance = buyVengeance;

function buyIronSkin2() {
  const price = IRONSKIN2_LEVELS[lvl2IronSkin];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvl2IronSkin++;
  saveShopState();
  renderShop();
}
window.buyIronSkin2 = buyIronSkin2;

function buyExtraHp2() {
  const price = EXTRAHP2_LEVELS[lvl2ExtraHp];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvl2ExtraHp++;
  saveShopState();
  renderShop();
}
window.buyExtraHp2 = buyExtraHp2;

function buyLuckyDrop2() {
  const price = LUCKYDROP2_LEVELS[lvl2LuckyDrop];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvl2LuckyDrop++;
  saveShopState();
  renderShop();
}
window.buyLuckyDrop2 = buyLuckyDrop2;

function buyPiercingRounds2() {
  const price = PIERCINGROUNDS2_LEVELS[lvl2PiercingRounds];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvl2PiercingRounds++;
  saveShopState();
  renderShop();
}
window.buyPiercingRounds2 = buyPiercingRounds2;

function buyCoinRain2() {
  const price = COINRAIN2_LEVELS[lvl2CoinRain];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvl2CoinRain++;
  saveShopState();
  renderShop();
}
window.buyCoinRain2 = buyCoinRain2;

function buySecondWind2() {
  const price = SECONDWIND2_LEVELS[lvl2SecondWind];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvl2SecondWind++;
  saveShopState();
  renderShop();
}
window.buySecondWind2 = buySecondWind2;

function buySharpshooter2() {
  const price = SHARPSHOOTER2_LEVELS[lvl2Sharpshooter];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvl2Sharpshooter++;
  saveShopState();
  renderShop();
}
window.buySharpshooter2 = buySharpshooter2;

function buyFlyingStart2() {
  const price = FLYINGSTART2_LEVELS[lvl2FlyingStart];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvl2FlyingStart++;
  saveShopState();
  renderShop();
}
window.buyFlyingStart2 = buyFlyingStart2;

function buyCriticalHit2() {
  const price = CRITICALHIT2_LEVELS[lvl2CriticalHit];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvl2CriticalHit++;
  saveShopState();
  renderShop();
}
window.buyCriticalHit2 = buyCriticalHit2;

function buySplinterShot2() {
  const price = SPLINTERSHOT2_LEVELS[lvl2SplinterShot];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvl2SplinterShot++;
  saveShopState();
  renderShop();
}
window.buySplinterShot2 = buySplinterShot2;

function buyMultiShield2() {
  const price = MULTISHIELD2_LEVELS[lvl2MultiShield];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvl2MultiShield++;
  saveShopState();
  renderShop();
}
window.buyMultiShield2 = buyMultiShield2;

function buyOverkill2() {
  const price = OVERKILL2_LEVELS[lvl2Overkill];
  if (price === undefined || coins < price) return;
  coins -= price;
  lvl2Overkill++;
  saveShopState();
  renderShop();
}
window.buyOverkill2 = buyOverkill2;

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
  const fav = isFavorite(`weapon:${item.id}`);
  return `<div class="shopItem"><button class="favStar${fav ? ' active' : ''}" onclick="toggleFavorite('weapon:${item.id}'); renderShop();" title="Favoriet">${fav ? '⭐' : '☆'}</button><div class="info"><div class="name">${item.name}</div><div class="desc">${weaponStatsLine(item)}</div><div class="desc">${item.desc}</div></div><div style="display:flex; flex-direction:column; gap:6px; align-items:stretch;">${btn}<button class="equip" onclick="startWeaponPractice('${item.id}')">🎯 Oefen</button></div></div>`;
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
  if (currentWorld === 2) {
    document.getElementById('shopWeapons').innerHTML = sortFavoritesFirst(WEAPONS, 'weapon').map(w =>
      weaponItemHtml(w, ownedWeapons.includes(w.id), equippedWeapon === w.id, 'buyWeapon', 'equipWeapon')
    ).join('');
    document.getElementById('shopSpecialWeapons').innerHTML = sortFavoritesFirst([...WORLD2_WEAPONS, ...WORLD2_SPECIAL_WEAPONS].filter(w => !w.coreOnly), 'weapon').map(w =>
      weaponItemHtml(w, ownedWeapons.includes(w.id), equippedWeapon === w.id, 'buyWeapon', 'equipWeapon')
    ).join('');
    document.getElementById('shopArmor').innerHTML = WORLD2_ARMOR.filter(a => !a.coreOnly).map(a =>
      shopItemHtml(a, ownedArmor.includes(a.id), equippedArmor === a.id, 'buyArmor', 'equipArmor')
    ).join('');
    document.getElementById('shopUpgrades').innerHTML = [
      upgradeItemHtml('2e Elementaal Pantser Slot', 'Wereld 2-only, werkt hetzelfde als 2e Armor Slot in Wereld 1. Ontgrendelt een tweede elementaal pantser-slot: je draagt dan twee elementale pantsers tegelijk en de bonussen van allebei tellen samen mee.', DUAL_ARMOR2_PRICE, hasDualArmor2, 'buyDualArmorSlot2'),
      leveledUpgradeItemHtml('Vuurkern', `Wereld 2-only. Verkort hoe lang brandwonden van vuur-bots en vuurwapens duren en vermindert de schade ervan, bovenop wat je pantser al biedt. Niveau 1: +${Math.round(FIRECORE_RESIST_PER_LEVEL*100)}% vuurweerstand. Niveau 2: +${Math.round(FIRECORE_RESIST_PER_LEVEL*200)}%. Niveau 3: +${Math.round(FIRECORE_RESIST_PER_LEVEL*300)}%.`, FIRECORE_LEVELS, lvl2FireCore, 'buyFireCore'),
      leveledUpgradeItemHtml('Vriesbloed', `Wereld 2-only. Verkort hoe lang bevriezing en vertraging door ijs-bots en ijswapens duren, bovenop wat je pantser al biedt. Niveau 1: +${Math.round(FROSTBLOOD_RESIST_PER_LEVEL*100)}% ijsweerstand. Niveau 2: +${Math.round(FROSTBLOOD_RESIST_PER_LEVEL*200)}%. Niveau 3: +${Math.round(FROSTBLOOD_RESIST_PER_LEVEL*300)}%.`, FROSTBLOOD_LEVELS, lvl2FrostBlood, 'buyFrostBlood'),
      leveledUpgradeItemHtml('Aardvastheid', `Wereld 2-only. Vermindert hoe ver je wordt weggeblazen door wegstoot-effecten (Windloper, Windgeweer-terugslag, Orkaanstaf, etc.), bovenop wat je pantser al biedt. Niveau 1: +${Math.round(STEADFAST_RESIST_PER_LEVEL*100)}% wegblaas-weerstand. Niveau 2: +${Math.round(STEADFAST_RESIST_PER_LEVEL*200)}%. Niveau 3: +${Math.round(STEADFAST_RESIST_PER_LEVEL*300)}%.`, STEADFAST_LEVELS, lvl2Steadfast, 'buySteadfast'),
      leveledUpgradeItemHtml('Elementherlaad', `Wereld 2-only, werkt hetzelfde als Snelle Herlaad in Wereld 1. Verkort de cooldown tussen schoten van elk wapen dat je in Wereld 2 gebruikt. Niveau 1: -${Math.round(FASTRELOAD2_PER_LEVEL*100)}% cooldown. Niveau 2: -${Math.round(FASTRELOAD2_PER_LEVEL*200)}% cooldown. Niveau 3: -${Math.round(FASTRELOAD2_PER_LEVEL*300)}% cooldown.`, FASTRELOAD2_LEVELS, lvl2FastReload, 'buyFastReload2'),
      leveledUpgradeItemHtml('Krachtaanvoer', `Wereld 2-only, werkt hetzelfde als Verlengde Boosts in Wereld 1. Verlengt hoe lang tijdelijke Wereld 2-powerup-effecten actief blijven (Vuurspoor, IJsbries, Aardaura, Tornado-schot, etc.). Niveau 1: +${Math.round(LONGBOOSTS2_MULT_PER_LEVEL*100)}% boost-duur. Niveau 2: +${Math.round(LONGBOOSTS2_MULT_PER_LEVEL*200)}%. Niveau 3: +${Math.round(LONGBOOSTS2_MULT_PER_LEVEL*300)}%.`, LONGBOOSTS2_LEVELS, lvl2LongBoosts, 'buyLongBoosts2'),
      leveledUpgradeItemHtml('Elementmagneet', `Wereld 2-only, werkt hetzelfde als Magneet in Wereld 1. Vergroot de afstand waarop je powerups en munten automatisch oppakt in Wereld 2. Niveau 1: +${MAGNET2_RADIUS_PER_LEVEL} oprapafstand. Niveau 2: +${MAGNET2_RADIUS_PER_LEVEL*2}. Niveau 3: +${MAGNET2_RADIUS_PER_LEVEL*3}.`, MAGNET2_LEVELS, lvl2Magnet, 'buyMagnet2'),
      upgradeItemHtml('Elementreanimatie', `Wereld 2-only, werkt hetzelfde als Reanimatie in Wereld 1. Eenmalig te koop: de eerste keer dat je in Wereld 2 dodelijke schade zou oplopen, kom je direct terug tot leven met een deel van je HP, in plaats van dat het potje eindigt. Overleef één keer per leven en kom terug met ${Math.round(REVIVE2_HEAL_PCT*100)}% van je max HP.`, REVIVE2_PRICE, hasRevive2, 'buyRevive2'),
      leveledUpgradeItemHtml('Elementaire Wraak', `Wereld 2-only, werkt hetzelfde als Schokgolf in Wereld 1. Bij elke bot die je doodt in Wereld 2 ontstaat er een elementale schokgolf die extra schade doet aan andere bots binnen een bepaalde straal. Niveau 1: radius ${VENGEANCE_RADII[0]}px, ${VENGEANCE_DMGS[0]} schade. Niveau 2: radius ${VENGEANCE_RADII[1]}px, ${VENGEANCE_DMGS[1]} schade. Niveau 3: radius ${VENGEANCE_RADII[2]}px, ${VENGEANCE_DMGS[2]} schade.`, VENGEANCE_LEVELS, lvl2Vengeance, 'buyVengeance'),
      leveledUpgradeItemHtml('IJzeren Elementhuid', `Wereld 2-only, werkt hetzelfde als IJzeren Huid in Wereld 1. Vermindert permanent alle inkomende schade in Wereld 2 met een vast percentage, bovenop de schadevermindering van je pantser. Niveau 1: -${Math.round(IRONSKIN2_REDUCTIONS[0]*100)}% schade. Niveau 2: -${Math.round(IRONSKIN2_REDUCTIONS[1]*100)}% schade. Niveau 3: -${Math.round(IRONSKIN2_REDUCTIONS[2]*100)}% schade.`, IRONSKIN2_LEVELS, lvl2IronSkin, 'buyIronSkin2'),
      leveledUpgradeItemHtml('Elementaire Conditie', `Wereld 2-only, werkt hetzelfde als Extra Conditie in Wereld 1. Verhoogt permanent je maximale HP in Wereld 2, boven op wat je pantser al geeft. Niveau 1: +${EXTRAHP2_PER_LEVEL} max HP. Niveau 2: +${EXTRAHP2_PER_LEVEL*2}. Niveau 3: +${EXTRAHP2_PER_LEVEL*3}. Niveau 4: +${EXTRAHP2_PER_LEVEL*4}. Niveau 5: +${EXTRAHP2_PER_LEVEL*5}.`, EXTRAHP2_LEVELS, lvl2ExtraHp, 'buyExtraHp2'),
      leveledUpgradeItemHtml('Elementgeluk', `Wereld 2-only, werkt hetzelfde als Geluksvinder in Wereld 1. Verkort het interval waarop nieuwe powerups op het veld verschijnen in Wereld 2. Basis interval: 6s. Niveau 1: interval ${(LUCKYDROP2_INTERVALS[0]/1000).toFixed(1)}s. Niveau 2: interval ${(LUCKYDROP2_INTERVALS[1]/1000).toFixed(1)}s. Niveau 3: interval ${(LUCKYDROP2_INTERVALS[2]/1000).toFixed(1)}s.`, LUCKYDROP2_LEVELS, lvl2LuckyDrop, 'buyLuckyDrop2'),
      leveledUpgradeItemHtml('Element-doorboring', 'Wereld 2-only, werkt hetzelfde als Doorborende Kogels in Wereld 1. Laat je kogels in Wereld 2 dwars door extra bots heen vliegen in plaats van te stoppen bij de eerste treffer. Niveau 1: +1 extra bot doorboord. Niveau 2: +2 extra bots doorboord. Niveau 3: +3 extra bots doorboord.', PIERCINGROUNDS2_LEVELS, lvl2PiercingRounds, 'buyPiercingRounds2'),
      leveledUpgradeItemHtml('Elementregen', `Wereld 2-only, werkt hetzelfde als Muntenregen in Wereld 1. Geeft telkens als je in Wereld 2 een muntje oppakt extra bonus-munten bovenop de normale waarde. Niveau 1: +${COINRAIN2_BONUSES[0]} munten. Niveau 2: +${COINRAIN2_BONUSES[1]} munten. Niveau 3: +${COINRAIN2_BONUSES[2]} munten. Niveau 4: +${COINRAIN2_BONUSES[3]} munten.`, COINRAIN2_LEVELS, lvl2CoinRain, 'buyCoinRain2'),
      leveledUpgradeItemHtml('Elementwil', `Wereld 2-only, werkt hetzelfde als IJzeren Wil in Wereld 1. Eenmalig per leven: zodra je HP in Wereld 2 voor het eerst onder de 50% zakt, geneest je automatisch een vaste hoeveelheid HP. Niveau 1: geneest ${SECONDWIND2_HEALS[0]} HP. Niveau 2: geneest ${SECONDWIND2_HEALS[1]} HP. Niveau 3: geneest ${SECONDWIND2_HEALS[2]} HP.`, SECONDWIND2_LEVELS, lvl2SecondWind, 'buySecondWind2'),
      leveledUpgradeItemHtml('Elementscherpschutter', `Wereld 2-only, werkt hetzelfde als Scherpschutter in Wereld 1. Verhoogt de vliegsnelheid van je kogels in Wereld 2. Niveau 1: +${Math.round(SHARPSHOOTER2_BONUSES[0]*100)}% kogelsnelheid. Niveau 2: +${Math.round(SHARPSHOOTER2_BONUSES[1]*100)}% kogelsnelheid. Niveau 3: +${Math.round(SHARPSHOOTER2_BONUSES[2]*100)}% kogelsnelheid.`, SHARPSHOOTER2_LEVELS, lvl2Sharpshooter, 'buySharpshooter2'),
      leveledUpgradeItemHtml('Elementaire Start', `Wereld 2-only, werkt hetzelfde als Vliegende Start in Wereld 1. Je begint elk potje in Wereld 2 automatisch met een tijdelijk schild dat alle inkomende schade blokkeert. Niveau 1: ${FLYINGSTART2_DURATIONS[0]/1000}s schild. Niveau 2: ${FLYINGSTART2_DURATIONS[1]/1000}s schild. Niveau 3: ${FLYINGSTART2_DURATIONS[2]/1000}s schild.`, FLYINGSTART2_LEVELS, lvl2FlyingStart, 'buyFlyingStart2'),
      leveledUpgradeItemHtml('Elementaire Kritiek', `Wereld 2-only, werkt hetzelfde als Kritieke Hit in Wereld 1. Geeft elk schot in Wereld 2 een kans om dubbele schade te doen. Niveau 1: ${Math.round(CRITICALHIT2_CHANCES[0]*100)}% kans op 2x schade. Niveau 2: ${Math.round(CRITICALHIT2_CHANCES[1]*100)}% kans. Niveau 3: ${Math.round(CRITICALHIT2_CHANCES[2]*100)}% kans.`, CRITICALHIT2_LEVELS, lvl2CriticalHit, 'buyCriticalHit2'),
      leveledUpgradeItemHtml('Elementsplinters', 'Wereld 2-only, werkt hetzelfde als Splinter-schoten in Wereld 1. Bij elke bot die je doodt in Wereld 2 schieten er automatisch extra splinter-kogels in alle richtingen om die bot heen. Niveau 1: Bij elke kill schieten 3 splinters. Niveau 2: 5 splinters. Niveau 3: 7 splinters.', SPLINTERSHOT2_LEVELS, lvl2SplinterShot, 'buySplinterShot2'),
      leveledUpgradeItemHtml('Elementveelvoud', 'Wereld 2-only, werkt hetzelfde als Multi-schild in Wereld 1. Laat Schild-powerups in Wereld 2 stapelen in plaats van elkaar te overschrijven. Niveau 1: Schilden stapelen (2 tegelijk). Niveau 2: 3 tegelijk. Niveau 3: 4 tegelijk.', MULTISHIELD2_LEVELS, lvl2MultiShield, 'buyMultiShield2'),
      leveledUpgradeItemHtml('Elementoverkill', 'Wereld 2-only, werkt hetzelfde als Overkill in Wereld 1. Als een schot in Wereld 2 veel meer schade doet dan nodig was om een bot te doden, ontstaat er een kleine explosie die het overschot doorgeeft aan bots in de buurt. Niveau 1: Overkill-schade veroorzaakt mini-explosies. Niveau 2: Groter + meer schade. Niveau 3: Nog groter radius.', OVERKILL2_LEVELS, lvl2Overkill, 'buyOverkill2')
    ].join('');
    const section2 = document.getElementById('shopArmor2Section');
    const navArmor2Btn = document.getElementById('navArmor2Btn');
    if (hasDualArmor2) {
      section2.style.display = 'block';
      if (navArmor2Btn) navArmor2Btn.style.display = 'inline-block';
      const equippedSlot1 = WORLD2_ARMOR.find(a => a.id === equippedArmor) || ARMOR[0];
      document.getElementById('shopArmor1Equipped').textContent = `Slot 1: ${equippedSlot1.name} uitgerust`;
      document.getElementById('shopArmor2').innerHTML = WORLD2_ARMOR.filter(a => !a.coreOnly).map(a =>
        shopItemHtml(a, ownedArmor.includes(a.id), equippedArmor2 === a.id, 'buyArmor', 'equipArmor2')
      ).join('');
    } else {
      section2.style.display = 'none';
      if (navArmor2Btn) navArmor2Btn.style.display = 'none';
    }
    return;
  }
  document.getElementById('shopWeapons').innerHTML = sortFavoritesFirst(WEAPONS, 'weapon').map(w =>
    weaponItemHtml(w, ownedWeapons.includes(w.id), equippedWeapon === w.id, 'buyWeapon', 'equipWeapon')
  ).join('');
  document.getElementById('shopSpecialWeapons').innerHTML = sortFavoritesFirst(SPECIAL_WEAPONS, 'weapon').map(w =>
    weaponItemHtml(w, ownedWeapons.includes(w.id), equippedWeapon === w.id, 'buyWeapon', 'equipWeapon')
  ).join('');
  document.getElementById('shopArmor').innerHTML = ARMOR.map(a =>
    shopItemHtml(a, ownedArmor.includes(a.id), equippedArmor === a.id, 'buyArmor', 'equipArmor')
  ).join('');

  // Upgrades
  document.getElementById('shopUpgrades').innerHTML = [
    upgradeItemHtml('2e Armor Slot', 'Ontgrendelt een tweede pantser-slot: je draagt dan twee pantsers tegelijk en de bonussen van allebei (extra HP, schadevermindering, regeneratie, thorns, etc.) tellen samen mee. Draag twee pantsers tegelijk — de effecten van beide stapelen.', DUAL_ARMOR_PRICE, hasDualArmor, 'buyDualArmorSlot'),
    leveledUpgradeItemHtml('Extra Conditie', `Verhoogt permanent je maximale HP, boven op wat je pantser al geeft, zodat je meer klappen kunt opvangen voordat je doodgaat. Niveau 1: +${EXTRA_HP_PER_LEVEL} max HP. Niveau 2: +${EXTRA_HP_PER_LEVEL*2} max HP. Niveau 3: +${EXTRA_HP_PER_LEVEL*3} max HP. Niveau 4: +${EXTRA_HP_PER_LEVEL*4} max HP. Niveau 5: +${EXTRA_HP_PER_LEVEL*5} max HP.`, EXTRA_HP_LEVELS, lvlExtraHp, 'buyExtraHp'),
    leveledUpgradeItemHtml('Sprint', `Verhoogt permanent je basissnelheid, zodat je makkelijker bots en kogels ontwijkt en sneller bij powerups en munten bent. Niveau 1: +${Math.round(SPRINT_PER_LEVEL*100)}% snelheid. Niveau 2: +${Math.round(SPRINT_PER_LEVEL*200)}% snelheid. Niveau 3: +${Math.round(SPRINT_PER_LEVEL*300)}% snelheid.`, SPRINT_LEVELS, lvlSprint, 'buySprint'),
    leveledUpgradeItemHtml('Magneet', `Vergroot de afstand waarop je powerups en munten automatisch oppakt, zonder er precies overheen te hoeven lopen. Niveau 1: +${MAGNET_RADIUS_PER_LEVEL} oprapafstand. Niveau 2: +${MAGNET_RADIUS_PER_LEVEL*2} oprapafstand. Niveau 3: +${MAGNET_RADIUS_PER_LEVEL*3} oprapafstand.`, MAGNET_LEVELS, lvlMagnet, 'buyMagnet'),
    leveledUpgradeItemHtml('Verlengde Boosts', `Verlengt hoe lang tijdelijke powerup-effecten actief blijven (Speed, Snelvuur, Schild, Damage, Multishot, Freeze, en meer) nadat je ze hebt opgepakt. Niveau 1: +${Math.round(LONG_BOOSTS_MULT_PER_LEVEL*100)}% boost-duur. Niveau 2: +${Math.round(LONG_BOOSTS_MULT_PER_LEVEL*200)}% boost-duur. Niveau 3: +${Math.round(LONG_BOOSTS_MULT_PER_LEVEL*300)}% boost-duur.`, LONG_BOOSTS_LEVELS, lvlLongBoosts, 'buyLongBoosts'),
    upgradeItemHtml('Reanimatie', `Eenmalig te koop: de eerste keer dat je in een potje dodelijke schade zou oplopen, kom je in plaats daarvan direct terug met een deel van je HP en een korte onkwetsbaarheid, in plaats van dat het potje eindigt. Overleef één keer per leven een dodelijke klap en kom terug met ${Math.round(REVIVE_HEAL_PCT*100)}% van je max HP.`, REVIVE_PRICE, hasRevive, 'buyRevive'),
    leveledUpgradeItemHtml('Snelle Herlaad', `Verkort de cooldown tussen schoten van elk wapen dat je gebruikt, zodat je sneller achter elkaar kunt vuren. Niveau 1: -${Math.round(FAST_RELOAD_PER_LEVEL*100)}% cooldown. Niveau 2: -${Math.round(FAST_RELOAD_PER_LEVEL*200)}% cooldown. Niveau 3: -${Math.round(FAST_RELOAD_PER_LEVEL*300)}% cooldown.`, FAST_RELOAD_LEVELS, lvlFastReload, 'buyFastReload'),
    leveledUpgradeItemHtml('IJzeren Huid', `Vermindert permanent alle inkomende schade met een vast percentage, bovenop de schadevermindering van je pantser. Niveau 1: -${Math.round(IRON_SKIN_REDUCTIONS[0]*100)}% schade. Niveau 2: -${Math.round(IRON_SKIN_REDUCTIONS[1]*100)}% schade. Niveau 3: -${Math.round(IRON_SKIN_REDUCTIONS[2]*100)}% schade.`, IRON_SKIN_LEVELS, lvlIronSkin, 'buyIronSkin'),
    leveledUpgradeItemHtml('Geluksvinder', `Verkort het interval waarop nieuwe powerups op het veld verschijnen, zodat er vaker eentje ligt om op te pakken. Basis interval: 6s. Niveau 1: interval ${(LUCKY_DROP_INTERVALS[0]/1000).toFixed(1)}s. Niveau 2: interval ${(LUCKY_DROP_INTERVALS[1]/1000).toFixed(1)}s. Niveau 3: interval ${(LUCKY_DROP_INTERVALS[2]/1000).toFixed(1)}s.`, LUCKY_DROP_LEVELS, lvlLuckyDrop, 'buyLuckyDrop'),
    leveledUpgradeItemHtml('Doorborende Kogels', 'Laat je kogels dwars door extra bots heen vliegen in plaats van te stoppen bij de eerste treffer — sterk tegen bots die op een rij staan. Niveau 1: +1 extra bot doorboord. Niveau 2: +2 extra bots doorboord. Niveau 3: +3 extra bots doorboord.', PIERCING_ROUNDS_LEVELS, lvlPiercingRounds, 'buyPiercingRounds'),
    leveledUpgradeItemHtml('Muntenregen', `Geeft telkens als je een muntje oppakt extra bonus-munten bovenop de normale waarde. Niveau 1: +${COIN_RAIN_BONUSES[0]} munten. Niveau 2: +${COIN_RAIN_BONUSES[1]} munten. Niveau 3: +${COIN_RAIN_BONUSES[2]} munten. Niveau 4: +${COIN_RAIN_BONUSES[3]} munten.`, COIN_RAIN_LEVELS, lvlCoinRain, 'buyCoinRain'),
    leveledUpgradeItemHtml('IJzeren Wil', `Eenmalig per leven: zodra je HP voor het eerst onder de 50% zakt, geneest je automatisch een vaste hoeveelheid HP — een gratis noodverband. Activeert onder 50% HP. Niveau 1: geneest ${SECOND_WIND_HEALS[0]} HP. Niveau 2: geneest ${SECOND_WIND_HEALS[1]} HP. Niveau 3: geneest ${SECOND_WIND_HEALS[2]} HP.`, SECOND_WIND_LEVELS, lvlSecondWind, 'buySecondWind'),
    leveledUpgradeItemHtml('Scherpschutter', `Verhoogt de vliegsnelheid van je kogels, zodat ze sneller aankomen en moeilijker te ontwijken zijn voor bots. Niveau 1: +${Math.round(SHARPSHOOTER_BONUSES[0]*100)}% kogelsnelheid. Niveau 2: +${Math.round(SHARPSHOOTER_BONUSES[1]*100)}% kogelsnelheid. Niveau 3: +${Math.round(SHARPSHOOTER_BONUSES[2]*100)}% kogelsnelheid.`, SHARPSHOOTER_LEVELS, lvlSharpshooter, 'buySharpshooter'),
    leveledUpgradeItemHtml('Vliegende Start', `Je begint elk potje automatisch met een tijdelijk schild dat alle inkomende schade blokkeert, zodat je veilig kunt opstarten. Niveau 1: ${FLYING_START_DURATIONS[0]/1000}s schild. Niveau 2: ${FLYING_START_DURATIONS[1]/1000}s schild. Niveau 3: ${FLYING_START_DURATIONS[2]/1000}s schild.`, FLYING_START_LEVELS, lvlFlyingStart, 'buyFlyingStart'),
    leveledUpgradeItemHtml('Kritieke Hit', `Geeft elk schot een kans om een kritieke treffer te zijn die dubbele schade doet. Niveau 1: ${Math.round(CRITICAL_HIT_CHANCES[0]*100)}% kans op 2x schade. Niveau 2: ${Math.round(CRITICAL_HIT_CHANCES[1]*100)}% kans. Niveau 3: ${Math.round(CRITICAL_HIT_CHANCES[2]*100)}% kans.`, CRITICAL_HIT_LEVELS, lvlCriticalHit, 'buyCriticalHit'),
    leveledUpgradeItemHtml('Splinter-schoten', 'Bij elke bot die je doodt, schieten er automatisch extra splinter-kogels in alle richtingen om die bot heen, die andere bots in de buurt kunnen raken. Niveau 1: Bij elke kill schieten 3 splinters. Niveau 2: 5 splinters. Niveau 3: 7 splinters.', SPLINTER_SHOT_LEVELS, lvlSplinterShot, 'buySplinterShot'),
    leveledUpgradeItemHtml('Schokgolf', `Bij elke bot die je doodt ontstaat er een schokgolf die extra schade doet aan alle andere bots binnen een bepaalde straal om die bot heen. Niveau 1: radius ${SHOCKWAVE_RADII[0]}px. Niveau 2: ${SHOCKWAVE_RADII[1]}px. Niveau 3: ${SHOCKWAVE_RADII[2]}px.`, SHOCKWAVE_LEVELS, lvlShockwave, 'buyShockwave'),
    leveledUpgradeItemHtml('Multi-schild', 'Laat Schild-powerups stapelen in plaats van elkaar te overschrijven, zodat je meerdere schilden achter elkaar actief kunt hebben. Niveau 1: Schilden stapelen (2 tegelijk). Niveau 2: 3 tegelijk. Niveau 3: 4 tegelijk.', MULTI_SHIELD_LEVELS, lvlMultiShield, 'buyMultiShield'),
    leveledUpgradeItemHtml('Goudtrek', `Vergroot specifiek de afstand waarop munten automatisch naar je toe worden getrokken (los van de Magneet-upgrade, die powerups én munten raakt). Niveau 1: Munten trekken van ${GOLD_RUSH_RADIUS[0]}px. Niveau 2: ${GOLD_RUSH_RADIUS[1]}px. Niveau 3: ${GOLD_RUSH_RADIUS[2]}px.`, GOLD_RUSH_LEVELS, lvlGoldRush, 'buyGoldRush'),
    leveledUpgradeItemHtml('Overkill', 'Als een schot veel meer schade doet dan nodig was om een bot te doden, ontstaat er op die plek een kleine explosie die het overschot aan schade doorgeeft aan bots in de buurt. Niveau 1: Overkill-schade veroorzaakt mini-explosies. Niveau 2: Groter + meer schade. Niveau 3: Nog groter radius.', OVERKILL_LEVELS, lvlOverkill, 'buyOverkill'),
    leveledUpgradeItemHtml('Bloedlust', `Verhoogt je schade naarmate je killstreak oploopt — hoe meer bots je snel achter elkaar doodt, hoe harder je volgende schoten raken. Niveau 1: +${Math.round(BLOODLUST_BONUSES[0]*100)}% schade per actieve kill-streak. Niveau 2: +${Math.round(BLOODLUST_BONUSES[1]*100)}%. Niveau 3: +${Math.round(BLOODLUST_BONUSES[2]*100)}%.`, BLOODLUST_LEVELS, lvlBloodlust, 'buyBloodlust')
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

