function shoot() {
  if (gameOver || isPaused) return;
  if (performance.now() < player.rootedUntil || performance.now() < player.mireUntil) return; // bevroren of vastgezogen, kan niet schieten
  if (performance.now() < player.jammedUntil) return; // Stormvorst EMP: wapen tijdelijk uitgeschakeld
  if (player.activeTransform === 'tank') { shootTankGrenade(); return; }
  if (player.activeTransform === 'berserker') { berserkerSlash(); return; }
  if (player.activeTransform === 'sniper') { sniperMechShot(); return; }
  if (player.activeTransform === 'swarm') { droneHiveVolley(); return; }
  if (player.activeTransform === 'pyro') { pyroFireball(); return; }
  if (player.activeTransform === 'vampire') { vampireBite(); return; }
  if (player.activeTransform === 'assassin') { assassinBlinkStrike(); return; }
  if (player.activeTransform === 'necromancer') { soulReap(); return; }
  if (player.activeTransform === 'stormcaller') { stormCallerBolt(); return; }
  if (player.activeTransform === 'juggernaut') { juggernautCharge(); return; }
  if (player.activeTransform === 'engineer') { engineerDeployTurret(); return; }
  if (player.activeTransform === 'fireform') { fireFormSlash(); return; }
  if (player.activeTransform === 'iceform') { iceFormBeam(); return; }
  if (player.activeTransform === 'earthform') { earthFormSpikeWallAttack(); return; }
  if (player.activeTransform === 'windform') { windFormDash(); return; }
  if (player.activeTransform === 'waterform') { waterFormWave(); return; }
  const now = performance.now();
  const weapon = getWeapon();
  const fireRateMult = (now < player.fireBoostUntil || now < player.overloadUntil) ? 0.4 : 1;
  const reloadMult = 1 - lvlFastReload * FAST_RELOAD_PER_LEVEL;
  const activeCooldown = shootCooldown * weapon.cooldownMult * fireRateMult * reloadMult;
  if (now - lastShot < activeCooldown) return;
  lastShot = now;
  const dx = mouse.x - player.x;
  const dy = mouse.y - player.y;
  const baseAngle = Math.atan2(dy, dx);
  if (player.nextShotTornado) {
    // Tornado-schot powerup: dit schot is geen kogel maar een kleine, ronddwalende tornado
    const tornadoR = player.nextShotTornado;
    player.nextShotTornado = false;
    tornadoShots.push({ x: player.x, y: player.y, vx: Math.cos(baseAngle) * 6, vy: Math.sin(baseAngle) * 6, r: tornadoR, captured: [], born: now });
    spawnParticles(player.x, player.y, '#cfe8ee');
    return;
  }
  const streakMult = (weapon.effect === 'killstreak') ? 1 + Math.min(player.killStreak, 10) * 0.15 : 1;
  const bloodlustBonus = lvlBloodlust > 0 && player.killStreak > 0 ? 1 + BLOODLUST_BONUSES[lvlBloodlust - 1] * player.killStreak : 1;
  const critChance = lvlCriticalHit > 0 ? CRITICAL_HIT_CHANCES[lvlCriticalHit - 1] : 0;
  const isCrit = Math.random() < critChance;
  const critMult = isCrit ? 2 : 1;
  const curseMult = now < player.curseUntil ? 0.5 : 1;
  const elementalMult = weapon.effect === 'igniteHit' ? getArmorStats().fireDmgMult : weapon.effect === 'shatterHit' ? getArmorStats().iceDmgMult : 1;
  const dmg = weapon.dmg * (now < player.damageBoostUntil || now < player.overloadUntil ? 2 : 1) * streakMult * bloodlustBonus * critMult * curseMult * elementalMult;
  const speedMult = (weapon.bulletSpeedMult || 1) * (1 + (lvlSharpshooter > 0 ? SHARPSHOOTER_BONUSES[lvlSharpshooter - 1] : 0));
  const extraPierce = lvlPiercingRounds;

  let pellets = weapon.pellets;
  let spread = weapon.spread || 0.18;
  if (now < player.multiShotUntil) {
    pellets = Math.max(pellets, POWERUP_LEVELS.multishot.pellets[getPuLevel('multishot')]);
    spread = Math.max(spread, 0.18);
  }

  const angles = [];
  if (pellets <= 1) {
    let angle = baseAngle;
    if (weapon.inaccuracy) angle += (Math.random() - 0.5) * weapon.inaccuracy;
    angles.push(angle);
  } else {
    const start = baseAngle - (spread * (pellets - 1)) / 2;
    for (let i = 0; i < pellets; i++) angles.push(start + spread * i);
  }

  angles.forEach(angle => {
    let target = null;
    if (now < player.homingUntil) {
      const aliveBots = bots.filter(b => !b.dead);
      if (aliveBots.length > 0) {
        target = aliveBots.reduce((a, b) =>
          Math.hypot(b.x - player.x, b.y - player.y) < Math.hypot(a.x - player.x, a.y - player.y) ? b : a);
      }
    }
    const spawnX = player.x + Math.cos(angle) * (player.r + 5);
    const spawnY = player.y + Math.sin(angle) * (player.r + 5);
    bullets.push({
      x: spawnX,
      y: spawnY,
      bornX: spawnX,
      bornY: spawnY,
      vx: Math.cos(angle) * 9 * speedMult,
      vy: Math.sin(angle) * 9 * speedMult,
      r: weapon.bulletR || 4,
      owner: 'player',
      dmg,
      pierce: (weapon.pierce || 0) + extraPierce,
      hitBots: ((weapon.pierce || 0) + extraPierce) ? [] : null,
      splashRadius: weapon.splashRadius || 0,
      splashDmg: weapon.splashDmg || 0,
      effect: weapon.effect || null,
      homingTarget: target,
      maxRange: weapon.maxRange || 0,
      isFlame: weapon.id === 'flamethrower',
      isGust: weapon.id === 'windrifle',
      isCrystal: weapon.id === 'crystalgun',
      isMagmaOrb: weapon.id === 'magmacannon',
      isWindVortex: weapon.id === 'hurricanestaff',
      isIceLanceBolt: weapon.id === 'frostlance',
      isRockChunk: weapon.id === 'earthhammer'
    });
  });
}

function shootTankGrenade() {
  // Tank-transformatie: geen wapens, alleen zware handgranaten met splash-schade
  const now = performance.now();
  const fireRateMult = now < player.fireBoostUntil ? 0.4 : 1;
  const reloadMult = 1 - lvlFastReload * FAST_RELOAD_PER_LEVEL;
  const activeCooldown = TANK_GRENADE_COOLDOWN * fireRateMult * reloadMult;
  if (now - lastShot < activeCooldown) return;
  lastShot = now;
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  const dmgMult = now < player.damageBoostUntil ? 2 : 1;
  bullets.push({
    x: player.x + Math.cos(angle) * (player.r + 8),
    y: player.y + Math.sin(angle) * (player.r + 8),
    vx: Math.cos(angle) * TANK_GRENADE_SPEED,
    vy: Math.sin(angle) * TANK_GRENADE_SPEED,
    r: 8,
    owner: 'player',
    dmg: TANK_GRENADE_DMG * dmgMult,
    pierce: 0,
    hitBots: null,
    splashRadius: TANK_GRENADE_SPLASH_RADIUS,
    splashDmg: TANK_GRENADE_SPLASH_DMG * dmgMult,
    effect: null,
    isGrenade: true
  });
}

function berserkerSlash() {
  // Berserker-transformatie: geen vuurwapens, alleen een snelle mes-waaier vlak voor je
  const now = performance.now();
  const fireRateMult = now < player.fireBoostUntil ? 0.4 : 1;
  const reloadMult = 1 - lvlFastReload * FAST_RELOAD_PER_LEVEL;
  const activeCooldown = BERSERKER_SLASH_COOLDOWN * fireRateMult * reloadMult;
  if (now - lastShot < activeCooldown) return;
  lastShot = now;
  const dmgMult = now < player.damageBoostUntil ? 2 : 1;
  const facing = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  player.angle = facing;
  spawnParticles(player.x + Math.cos(facing) * player.r, player.y + Math.sin(facing) * player.r, '#e0e0ff');
  bots.forEach(bot => {
    if (bot.dead) return;
    const dx = bot.x - player.x, dy = bot.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > BERSERKER_SLASH_RANGE + bot.r) return;
    let diff = Math.atan2(dy, dx) - facing;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > BERSERKER_SLASH_ARC / 2) return;
    damageBotSimple(bot, BERSERKER_SLASH_DMG * dmgMult, '#e0e0ff');
  });
}

function sniperMechShot() {
  // Sniper Mech-transformatie: geen normale wapens, alleen een trage, doorborende railgun-kogel
  const now = performance.now();
  const fireRateMult = now < player.fireBoostUntil ? 0.4 : 1;
  const reloadMult = 1 - lvlFastReload * FAST_RELOAD_PER_LEVEL;
  const activeCooldown = SNIPER_COOLDOWN * fireRateMult * reloadMult;
  if (now - lastShot < activeCooldown) return;
  lastShot = now;
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  const dmgMult = now < player.damageBoostUntil ? 2 : 1;
  bullets.push({
    x: player.x + Math.cos(angle) * (player.r + 10),
    y: player.y + Math.sin(angle) * (player.r + 10),
    vx: Math.cos(angle) * SNIPER_BULLET_SPEED,
    vy: Math.sin(angle) * SNIPER_BULLET_SPEED,
    r: 4,
    owner: 'player',
    dmg: SNIPER_DMG * dmgMult,
    pierce: SNIPER_PIERCE,
    hitBots: [],
    splashRadius: 0,
    splashDmg: 0,
    effect: null,
    isSniperRound: true
  });
  spawnParticles(player.x, player.y, '#ffe066');
}

function droneHiveVolley() {
  // Drone Hive-transformatie: geen eigen wapen, lanceert bij elk schot zelfsturende mini-drones
  const now = performance.now();
  const fireRateMult = now < player.fireBoostUntil ? 0.4 : 1;
  const reloadMult = 1 - lvlFastReload * FAST_RELOAD_PER_LEVEL;
  const activeCooldown = SWARM_VOLLEY_COOLDOWN * fireRateMult * reloadMult;
  if (now - lastShot < activeCooldown) return;
  const alive = bots.filter(b => !b.dead);
  if (alive.length === 0) return; // drones hebben een doelwit nodig om op af te vliegen
  lastShot = now;
  const dmgMult = now < player.damageBoostUntil ? 2 : 1;
  const targets = alive
    .map(b => ({ b, d: Math.hypot(b.x - player.x, b.y - player.y) }))
    .sort((a, c) => a.d - c.d)
    .slice(0, SWARM_DRONE_COUNT)
    .map(t => t.b);
  targets.forEach((target, i) => {
    const spawnAngle = (Math.PI * 2 / SWARM_DRONE_COUNT) * i;
    const angle = Math.atan2(target.y - player.y, target.x - player.x);
    bullets.push({
      x: player.x + Math.cos(spawnAngle) * (player.r + 6),
      y: player.y + Math.sin(spawnAngle) * (player.r + 6),
      vx: Math.cos(angle) * SWARM_DRONE_SPEED,
      vy: Math.sin(angle) * SWARM_DRONE_SPEED,
      r: 5,
      owner: 'player',
      dmg: SWARM_DRONE_DMG * dmgMult,
      pierce: 0,
      hitBots: null,
      splashRadius: SWARM_DRONE_SPLASH_RADIUS,
      splashDmg: dmgMult,
      effect: null,
      isDrone: true,
      homingTarget: target
    });
  });
}

function pyroFireball() {
  // Pyromancer-transformatie: geen wapens, lobt vuurballen die een brandende zone achterlaten
  const now = performance.now();
  const fireRateMult = now < player.fireBoostUntil ? 0.4 : 1;
  const reloadMult = 1 - lvlFastReload * FAST_RELOAD_PER_LEVEL;
  const activeCooldown = PYRO_FIREBALL_COOLDOWN * fireRateMult * reloadMult;
  if (now - lastShot < activeCooldown) return;
  lastShot = now;
  const dmgMult = now < player.damageBoostUntil ? 2 : 1;
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  const tx = Math.max(20, Math.min(canvas.width - 20, player.x + Math.cos(angle) * PYRO_FIREBALL_RANGE));
  const ty = Math.max(20, Math.min(canvas.height - 20, player.y + Math.sin(angle) * PYRO_FIREBALL_RANGE));
  fireballThrows.push({ startX: player.x, startY: player.y, tx, ty, born: now, duration: PYRO_FIREBALL_TRAVEL_TIME });
  setTimeout(() => {
    if (gameOver || levelTransition) return;
    explosions.push({ x: tx, y: ty, born: performance.now(), maxR: PYRO_ZONE_RADIUS });
    spawnParticles(tx, ty, '#ff8800');
    spawnParticles(tx, ty, '#ffcc00');
    bots.forEach(other => {
      if (other.dead) return;
      const dd = Math.hypot(tx - other.x, ty - other.y);
      if (dd < PYRO_ZONE_RADIUS) damageBotSimple(other, PYRO_IMPACT_DMG * dmgMult, '#ff8800');
    });
    fireZones.push({ x: tx, y: ty, radius: PYRO_ZONE_RADIUS, until: performance.now() + PYRO_ZONE_DURATION, tickDmg: PYRO_ZONE_TICK_DMG * dmgMult, lastTick: 0 });
  }, PYRO_FIREBALL_TRAVEL_TIME);
}

function vampireBite() {
  // Vampire Lord-transformatie: geen wapens, bijt de dichtstbijzijnde bot van dichtbij en geneest zichzelf
  const now = performance.now();
  const fireRateMult = now < player.fireBoostUntil ? 0.4 : 1;
  const reloadMult = 1 - lvlFastReload * FAST_RELOAD_PER_LEVEL;
  const activeCooldown = VAMPIRE_BITE_COOLDOWN * fireRateMult * reloadMult;
  if (now - lastShot < activeCooldown) return;
  lastShot = now;
  const dmgMult = now < player.damageBoostUntil ? 2 : 1;
  let nearest = null, nearestDist = VAMPIRE_BITE_RANGE;
  bots.forEach(bot => {
    if (bot.dead) return;
    const dd = Math.hypot(bot.x - player.x, bot.y - player.y) - bot.r;
    if (dd < nearestDist) { nearest = bot; nearestDist = dd; }
  });
  if (nearest) {
    player.angle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
    damageBotSimple(nearest, VAMPIRE_BITE_DMG * dmgMult, '#ff2d6f');
    player.hp = Math.min(player.maxHp, player.hp + VAMPIRE_BITE_HEAL);
    spawnParticles(nearest.x, nearest.y, '#ff2d6f');
    spawnParticles(player.x, player.y, '#ff6b81');
  }
}

function assassinBlinkStrike() {
  // Shadow Assassin-transformatie: geen wapens, blinkt naar de muispositie en snijdt bots op de route neer
  const now = performance.now();
  const fireRateMult = now < player.fireBoostUntil ? 0.4 : 1;
  const reloadMult = 1 - lvlFastReload * FAST_RELOAD_PER_LEVEL;
  const activeCooldown = ASSASSIN_BLINK_COOLDOWN * fireRateMult * reloadMult;
  if (now - lastShot < activeCooldown) return;
  lastShot = now;
  const dmgMult = now < player.damageBoostUntil ? 2 : 1;
  const ang = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  const startX = player.x, startY = player.y;
  const endX = Math.max(player.r, Math.min(canvas.width - player.r, startX + Math.cos(ang) * ASSASSIN_BLINK_DIST));
  const endY = Math.max(player.r, Math.min(canvas.height - player.r, startY + Math.sin(ang) * ASSASSIN_BLINK_DIST));
  bladeTrails.push({ x1: startX, y1: startY, x2: endX, y2: endY, born: now });
  player.x = endX;
  player.y = endY;
  spawnParticles(startX, startY, '#c77dff');
  spawnParticles(endX, endY, '#c77dff');
  bots.forEach(bot => {
    if (bot.dead) return;
    if (pointSegmentDist(bot.x, bot.y, startX, startY, endX, endY) < bot.r + 40) {
      damageBotSimple(bot, ASSASSIN_BLINK_DMG * dmgMult, '#c77dff');
    }
  });
}

function soulReap() {
  // Soul Reaper-transformatie: geen wapens, maait op afstand zielen en springt door bij een kill
  const now = performance.now();
  const fireRateMult = now < player.fireBoostUntil ? 0.4 : 1;
  const reloadMult = 1 - lvlFastReload * FAST_RELOAD_PER_LEVEL;
  const activeCooldown = SOUL_REAP_COOLDOWN * fireRateMult * reloadMult;
  if (now - lastShot < activeCooldown) return;
  const inRange = bots.filter(b => !b.dead && Math.hypot(b.x - player.x, b.y - player.y) < SOUL_REAP_RANGE);
  if (inRange.length === 0) return;
  lastShot = now;
  const dmgMult = now < player.damageBoostUntil ? 2 : 1;
  let dmg = SOUL_REAP_DMG * dmgMult;
  let target = inRange.reduce((a, b) => Math.hypot(b.x - player.x, b.y - player.y) < Math.hypot(a.x - player.x, a.y - player.y) ? b : a);
  let chain = 0;
  while (target) {
    spawnParticles(target.x, target.y, '#7ee8c1');
    spawnParticles(target.x, target.y, '#2a0f2e');
    const wasAlive = !target.dead;
    const prevX = target.x, prevY = target.y;
    damageBotSimple(target, dmg, '#7ee8c1');
    if (!(wasAlive && target.dead) || chain >= SOUL_REAP_MAX_CHAIN) break;
    chain++;
    dmg *= SOUL_REAP_CHAIN_DMG_MULT;
    target = bots
      .filter(b => !b.dead && Math.hypot(b.x - prevX, b.y - prevY) < SOUL_REAP_RANGE)
      .reduce((a, b) => (!a || Math.hypot(b.x - prevX, b.y - prevY) < Math.hypot(a.x - prevX, a.y - prevY)) ? b : a, null);
  }
}

function stormCallerBolt() {
  // Storm Caller-transformatie: geen wapens, slingert een bliksemschicht die overspringt tussen nabije bots
  const now = performance.now();
  const fireRateMult = now < player.fireBoostUntil ? 0.4 : 1;
  const reloadMult = 1 - lvlFastReload * FAST_RELOAD_PER_LEVEL;
  const activeCooldown = STORM_COOLDOWN * fireRateMult * reloadMult;
  if (now - lastShot < activeCooldown) return;
  const inRange = bots.filter(b => !b.dead && Math.hypot(b.x - player.x, b.y - player.y) < STORM_CHAIN_RANGE);
  if (inRange.length === 0) return;
  lastShot = now;
  const dmgMult = now < player.damageBoostUntil ? 2 : 1;
  const hitSet = new Set();
  let fromX = player.x, fromY = player.y;
  let current = inRange.reduce((a, b) => Math.hypot(b.x - player.x, b.y - player.y) < Math.hypot(a.x - player.x, a.y - player.y) ? b : a);
  let jumps = 0;
  while (current && jumps < STORM_MAX_JUMPS) {
    lightningBolts.push({ x1: fromX, y1: fromY, x2: current.x, y2: current.y, born: now });
    damageBotSimple(current, STORM_DMG * dmgMult, '#7df9ff');
    spawnParticles(current.x, current.y, '#7df9ff');
    hitSet.add(current);
    fromX = current.x; fromY = current.y;
    jumps++;
    current = bots
      .filter(b => !b.dead && !hitSet.has(b) && Math.hypot(b.x - fromX, b.y - fromY) < STORM_CHAIN_RANGE)
      .reduce((a, b) => (!a || Math.hypot(b.x - fromX, b.y - fromY) < Math.hypot(a.x - fromX, a.y - fromY)) ? b : a, null);
  }
}

function juggernautCharge() {
  // Juggernaut-transformatie: geen wapens, beukt naar voren en ramt bots op het pad omver
  const now = performance.now();
  const fireRateMult = now < player.fireBoostUntil ? 0.4 : 1;
  const reloadMult = 1 - lvlFastReload * FAST_RELOAD_PER_LEVEL;
  const activeCooldown = JUGGERNAUT_CHARGE_COOLDOWN * fireRateMult * reloadMult;
  if (now - lastShot < activeCooldown) return;
  lastShot = now;
  const dmgMult = now < player.damageBoostUntil ? 2 : 1;
  const ang = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  const startX = player.x, startY = player.y;
  const endX = Math.max(player.r, Math.min(canvas.width - player.r, startX + Math.cos(ang) * JUGGERNAUT_CHARGE_DIST));
  const endY = Math.max(player.r, Math.min(canvas.height - player.r, startY + Math.sin(ang) * JUGGERNAUT_CHARGE_DIST));
  chargeTrails.push({ x1: startX, y1: startY, x2: endX, y2: endY, born: now });
  player.x = endX;
  player.y = endY;
  spawnParticles(startX, startY, '#ff8800');
  spawnParticles(endX, endY, '#ff8800');
  bots.forEach(bot => {
    if (bot.dead) return;
    if (pointSegmentDist(bot.x, bot.y, startX, startY, endX, endY) < bot.r + 50) {
      damageBotSimple(bot, JUGGERNAUT_CHARGE_DMG * dmgMult, '#ff8800');
      if (!bot.dead) {
        const dx = bot.x - endX, dy = bot.y - endY;
        const dist = Math.hypot(dx, dy) || 1;
        bot.x = Math.max(bot.r, Math.min(canvas.width - bot.r, bot.x + (dx / dist) * JUGGERNAUT_KNOCKBACK));
        bot.y = Math.max(bot.r, Math.min(canvas.height - bot.r, bot.y + (dy / dist) * JUGGERNAUT_KNOCKBACK));
      }
    }
  });
}

function engineerDeployTurret() {
  // Field Engineer-transformatie: geen wapens, zet een automatische geschutskoepel neer
  const now = performance.now();
  const fireRateMult = now < player.fireBoostUntil ? 0.4 : 1;
  const reloadMult = 1 - lvlFastReload * FAST_RELOAD_PER_LEVEL;
  const activeCooldown = ENGINEER_DEPLOY_COOLDOWN * fireRateMult * reloadMult;
  if (now - lastShot < activeCooldown) return;
  lastShot = now;
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  const tx = Math.max(20, Math.min(canvas.width - 20, player.x + Math.cos(angle) * ENGINEER_DEPLOY_RANGE));
  const ty = Math.max(20, Math.min(canvas.height - 20, player.y + Math.sin(angle) * ENGINEER_DEPLOY_RANGE));
  if (deployedTurrets.length >= ENGINEER_MAX_TURRETS) deployedTurrets.shift(); // oudste koepel maakt plaats voor de nieuwe
  deployedTurrets.push({ x: tx, y: ty, deployedAt: now, lastShot: 0, hp: ENGINEER_TURRET_HP, maxHp: ENGINEER_TURRET_HP });
  spawnParticles(tx, ty, '#4cc9f0');
}

function fireFormSlash() {
  // Vuurgestalte (Wereld 2-transformatie): geen wapens, slaat een brandende vlammenboog vlak voor je uit die bots ontsteekt
  const now = performance.now();
  const fireRateMult = now < player.fireBoostUntil ? 0.4 : 1;
  const reloadMult = 1 - lvlFastReload * FAST_RELOAD_PER_LEVEL;
  const activeCooldown = FIREFORM_COOLDOWN * fireRateMult * reloadMult;
  if (now - lastShot < activeCooldown) return;
  lastShot = now;
  const dmgMult = now < player.damageBoostUntil ? 2 : 1;
  const facing = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  player.angle = facing;
  spawnParticles(player.x + Math.cos(facing) * player.r, player.y + Math.sin(facing) * player.r, '#ff5a1f');
  spawnParticles(player.x + Math.cos(facing) * player.r, player.y + Math.sin(facing) * player.r, '#fff275');
  bots.forEach(bot => {
    if (bot.dead) return;
    const dx = bot.x - player.x, dy = bot.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > FIREFORM_RANGE + bot.r) return;
    let diff = Math.atan2(dy, dx) - facing;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > FIREFORM_ARC / 2) return;
    damageBotSimple(bot, FIREFORM_DMG * dmgMult, '#ff5a1f');
    if (!bot.dead) fireZones.push({ x: bot.x, y: bot.y, radius: FIREFORM_IGNITE_RADIUS, until: now + FIREFORM_IGNITE_DURATION, tickDmg: FIREFORM_IGNITE_TICK * dmgMult, lastTick: 0 });
  });
}

function iceFormBeam() {
  // IJsgestalte (Wereld 2-transformatie): geen wapens, schiet een doorborende vriesstraal die alle bots op de lijn bevriest
  const now = performance.now();
  const fireRateMult = now < player.fireBoostUntil ? 0.4 : 1;
  const reloadMult = 1 - lvlFastReload * FAST_RELOAD_PER_LEVEL;
  const activeCooldown = ICEFORM_COOLDOWN * fireRateMult * reloadMult;
  if (now - lastShot < activeCooldown) return;
  lastShot = now;
  const dmgMult = now < player.damageBoostUntil ? 2 : 1;
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  player.angle = angle;
  const endX = player.x + Math.cos(angle) * ICEFORM_RANGE;
  const endY = player.y + Math.sin(angle) * ICEFORM_RANGE;
  iceLances.push({ x1: player.x, y1: player.y, x2: endX, y2: endY, born: now });
  spawnParticles(player.x, player.y, '#9ef7ff');
  const dx = endX - player.x, dy = endY - player.y;
  const len2 = dx * dx + dy * dy;
  bots.forEach(bot => {
    if (bot.dead) return;
    let t = ((bot.x - player.x) * dx + (bot.y - player.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = player.x + dx * t, py = player.y + dy * t;
    const dd = Math.hypot(bot.x - px, bot.y - py);
    if (dd < bot.r + 14) {
      damageBotSimple(bot, ICEFORM_DMG * dmgMult, '#9ef7ff');
      if (!bot.dead) bot.frozenUntil = Math.max(bot.frozenUntil || 0, now + ICEFORM_FREEZE_DURATION);
    }
  });
}

function earthFormSpikeWallAttack() {
  // Aardgestalte (Wereld 2-transformatie): geen wapens, laat een muur van rotspieken vlak voor je uit de grond schieten
  const now = performance.now();
  const fireRateMult = now < player.fireBoostUntil ? 0.4 : 1;
  const reloadMult = 1 - lvlFastReload * FAST_RELOAD_PER_LEVEL;
  const activeCooldown = EARTHFORM_COOLDOWN * fireRateMult * reloadMult;
  if (now - lastShot < activeCooldown) return;
  lastShot = now;
  const dmgMult = now < player.damageBoostUntil ? 2 : 1;
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  player.angle = angle;
  const baseX = player.x + Math.cos(angle) * EARTHFORM_WALL_DIST;
  const baseY = player.y + Math.sin(angle) * EARTHFORM_WALL_DIST;
  const perpX = -Math.sin(angle), perpY = Math.cos(angle);
  const mid = (EARTHFORM_WALL_COUNT - 1) / 2;
  for (let i = 0; i < EARTHFORM_WALL_COUNT; i++) {
    const offset = (i - mid) * EARTHFORM_WALL_SPACING;
    const sx = Math.max(20, Math.min(canvas.width - 20, baseX + perpX * offset));
    const sy = Math.max(20, Math.min(canvas.height - 20, baseY + perpY * offset));
    explosions.push({ x: sx, y: sy, born: now, maxR: EARTHFORM_SPIKE_RADIUS });
    spawnParticles(sx, sy, '#8a6a3a');
    spawnParticles(sx, sy, '#5c3a1e');
    bots.forEach(target => {
      if (target.dead) return;
      const dd = Math.hypot(sx - target.x, sy - target.y);
      if (dd < EARTHFORM_SPIKE_RADIUS + target.r) {
        damageBotSimple(target, EARTHFORM_DMG * dmgMult, '#8a6a3a');
        if (!target.dead) target.rootedUntil = Math.max(target.rootedUntil || 0, now + EARTHFORM_ROOT_DURATION);
      }
    });
  }
}

function windFormDash() {
  // Windgestalte (Wereld 2-transformatie): geen wapens, schiet als een vlaag naar de muispositie en blaast bots op de route weg
  const now = performance.now();
  const fireRateMult = now < player.fireBoostUntil ? 0.4 : 1;
  const reloadMult = 1 - lvlFastReload * FAST_RELOAD_PER_LEVEL;
  const activeCooldown = WINDFORM_COOLDOWN * fireRateMult * reloadMult;
  if (now - lastShot < activeCooldown) return;
  lastShot = now;
  const dmgMult = now < player.damageBoostUntil ? 2 : 1;
  const ang = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  const startX = player.x, startY = player.y;
  const endX = Math.max(player.r, Math.min(canvas.width - player.r, startX + Math.cos(ang) * WINDFORM_DASH_DIST));
  const endY = Math.max(player.r, Math.min(canvas.height - player.r, startY + Math.sin(ang) * WINDFORM_DASH_DIST));
  bladeTrails.push({ x1: startX, y1: startY, x2: endX, y2: endY, born: now });
  player.x = endX;
  player.y = endY;
  spawnParticles(startX, startY, '#eaffff');
  spawnParticles(endX, endY, '#eaffff');
  bots.forEach(bot => {
    if (bot.dead) return;
    if (pointSegmentDist(bot.x, bot.y, startX, startY, endX, endY) < bot.r + 40) {
      damageBotSimple(bot, WINDFORM_DMG * dmgMult, '#eaffff');
      if (!bot.dead) {
        const kdx = bot.x - endX, kdy = bot.y - endY;
        const klen = Math.hypot(kdx, kdy) || 1;
        bot.x = Math.max(bot.r, Math.min(canvas.width - bot.r, bot.x + (kdx / klen) * WINDFORM_KNOCKBACK));
        bot.y = Math.max(bot.r, Math.min(canvas.height - bot.r, bot.y + (kdy / klen) * WINDFORM_KNOCKBACK));
      }
    }
  });
}

function waterFormWave() {
  // Watergestalte (Wereld 2-transformatie): geen wapens, laat een vloedgolf om je heen losbarsten die bots wegstoot en jezelf een kort schild geeft
  const now = performance.now();
  const fireRateMult = now < player.fireBoostUntil ? 0.4 : 1;
  const reloadMult = 1 - lvlFastReload * FAST_RELOAD_PER_LEVEL;
  const activeCooldown = WATERFORM_COOLDOWN * fireRateMult * reloadMult;
  if (now - lastShot < activeCooldown) return;
  lastShot = now;
  const dmgMult = now < player.damageBoostUntil ? 2 : 1;
  shockRings.push({ x: player.x, y: player.y, born: now, maxR: WATERFORM_RADIUS, duration: 450, color: '#2a7fba' });
  explosions.push({ x: player.x, y: player.y, born: now, maxR: WATERFORM_RADIUS * 0.6 });
  spawnParticles(player.x, player.y, '#2a7fba');
  spawnParticles(player.x, player.y, '#eaffff');
  player.shieldUntil = Math.max(player.shieldUntil, now + WATERFORM_SHIELD_DURATION);
  bots.forEach(bot => {
    if (bot.dead) return;
    const dd = Math.hypot(bot.x - player.x, bot.y - player.y);
    if (dd < WATERFORM_RADIUS + bot.r) {
      damageBotSimple(bot, WATERFORM_DMG * dmgMult, '#2a7fba');
      if (!bot.dead) {
        const ang2 = Math.atan2(bot.y - player.y, bot.x - player.x);
        bot.x = Math.max(bot.r, Math.min(canvas.width - bot.r, bot.x + Math.cos(ang2) * 70));
        bot.y = Math.max(bot.r, Math.min(canvas.height - bot.r, bot.y + Math.sin(ang2) * 70));
      }
    }
  });
}

function fireBotBullet(bot, angle, speedMult = 1) {
  const hcMult = gameMode === 'hardcore' ? HARDCORE_MULT : 1;
  bullets.push({
    x: bot.x + Math.cos(angle) * (bot.r + 5),
    y: bot.y + Math.sin(angle) * (bot.r + 5),
    vx: Math.cos(angle) * bot.bulletSpeed * speedMult,
    vy: Math.sin(angle) * bot.bulletSpeed * speedMult,
    r: bot.pattern === 'fast' ? 3 : 4,
    dmg: (bot.bulletDmg || (bot.pattern === 'fast' ? 15 : 8)) * hcMult,
    owner: 'bot',
    sourceBot: bot,
    swapOnHit: bot.swapOnHit || false
  });
}

function applyDamageToPlayer(amount) {
  if (performance.now() < player.shieldUntil) return false;
  const stoneskinReduction = performance.now() < player.stoneskinUntil ? player.stoneskinReduction : 0;
  if (stoneskinReduction > 0) spawnParticles(player.x, player.y, '#a08050'); // rotsscherven vliegen af als de aardhuid een klap opvangt
  const totalReduction = 1 - (1 - getArmorStats().reduction) * (1 - (lvlIronSkin > 0 ? IRON_SKIN_REDUCTIONS[lvlIronSkin - 1] : 0)) * (1 - stoneskinReduction);
  player.hp -= amount * (1 - totalReduction);
  return true;
}

// Gedeelde helper: schade toebrengen aan een bot + score/kill-boekhouding, gebruikt door
// effecten die buiten de normale kogel-botsing om schade doen (gif, zwart gat, enz.)
function damageBotSimple(bot, dmg, color) {
  if (bot.dead) return;
  if (bot.invulnUntil && performance.now() < bot.invulnUntil) {
    spawnParticles(bot.x, bot.y, '#8ecbff');
    return;
  }
  bot.hp -= dmg;
  spawnParticles(bot.x, bot.y, color || bot.color);
  if (bot.hp <= 0 && !bot.immortal) {
    bot.dead = true;
    player.comboStreak = Math.min(20, player.comboStreak + 1);
    player.comboLastKill = performance.now();
    score += bot.isBoss ? 500 : (bot.maxHp >= 10 ? 40 : bot.maxHp >= 6 ? 25 : bot.maxHp >= 3 ? 15 : 10);
    if (gameMode === 'levels') levelKills++;
    if (getArmorStats().vampireHeal) player.hp = Math.min(player.maxHp, player.hp + getArmorStats().vampireHeal);
    if (bot.isBoss) bossAlive = false;
    if (bot.poisonSpread) spreadPoison(bot);

    // Shockwave bij kills
    if (lvlShockwave > 0) {
      const radius = SHOCKWAVE_RADII[lvlShockwave - 1];
      const shockDmg = 5 + lvlShockwave * 2;
      bots.forEach(other => {
        if (other === bot || other.dead) return;
        const dd = Math.hypot(bot.x - other.x, bot.y - other.y);
        if (dd < radius) damageBotSimple(other, shockDmg, '#ff8800');
      });
      explosions.push({ x: bot.x, y: bot.y, born: performance.now(), maxR: radius });
    }

    // Splinter-schoten bij kills
    if (lvlSplinterShot > 0) {
      const splinterCount = [3, 5, 7][lvlSplinterShot - 1];
      for (let i = 0; i < splinterCount; i++) {
        const angle = (Math.PI * 2 / splinterCount) * i;
        bullets.push({
          x: bot.x + Math.cos(angle) * 10,
          y: bot.y + Math.sin(angle) * 10,
          vx: Math.cos(angle) * 6,
          vy: Math.sin(angle) * 6,
          r: 3,
          owner: 'player',
          dmg: 3,
          pierce: 0,
          hitBots: null,
          splashRadius: 0,
          splashDmg: 0,
          effect: null
        });
      }
    }

    // Overkill-explosies
    if (lvlOverkill > 0 && dmg > bot.maxHp * 0.2) {
      const overkillDmg = dmg - bot.maxHp;
      const radius = 60 + lvlOverkill * 30;
      bots.forEach(other => {
        if (other === bot || other.dead) return;
        const dd = Math.hypot(bot.x - other.x, bot.y - other.y);
        if (dd < radius) damageBotSimple(other, Math.max(3, Math.round(overkillDmg * 0.3)), '#ff3838');
      });
      explosions.push({ x: bot.x, y: bot.y, born: performance.now(), maxR: radius });
    }

    // Splitter: splitst 3 sec na zijn dood in kleinere versies van zichzelf
    if (bot.splitsSelf && !bot.isSplitChild) {
      const count = bot.splitsSelf;
      const deathX = bot.x, deathY = bot.y, deathR = bot.r, deathSpeed = bot.speed, deathMaxHp = bot.maxHp,
        deathCooldown = bot.shootCooldown, deathColor = bot.color, deathType = bot.type, deathPattern = bot.pattern,
        deathBulletSpeed = bot.bulletSpeed, deathBulletDmg = bot.bulletDmg || 0;
      setTimeout(() => {
        if (gameOver || levelTransition) return;
        const aliveSplitters = bots.filter(b => !b.dead && b.type === 'splitter').length;
        const spawnCount = Math.min(count, Math.max(0, MAX_SPLITTERS_ALIVE - aliveSplitters));
        for (let i = 0; i < spawnCount; i++) {
          const ang = (Math.PI * 2 / count) * i + Math.random() * 0.4;
          const dist = 130 + Math.random() * 60;
          bots.push({
            x: Math.max(9, Math.min(canvas.width - 9, deathX + Math.cos(ang) * dist)),
            y: Math.max(9, Math.min(canvas.height - 9, deathY + Math.sin(ang) * dist)),
            r: Math.max(9, Math.round(deathR * 0.55)),
            speed: deathSpeed * 1.25,
            hp: Math.max(2, Math.round(deathMaxHp * 0.35)),
            maxHp: Math.max(2, Math.round(deathMaxHp * 0.35)),
            lastShot: 0,
            shootCooldown: deathCooldown,
            color: deathColor,
            type: deathType,
            pattern: deathPattern,
            bulletSpeed: deathBulletSpeed,
            bulletDmg: deathBulletDmg,
            swapOnHit: false,
            meleeDamage: 0,
            specialDmg: 0,
            specialLastUsed: 0,
            splits: false,
            splitsSelf: 0,
            isSplitChild: true,
            bornAt: performance.now(),
            invulnUntil: performance.now() + 2000,
            spiralAngle: 0,
            frozenUntil: 0,
            slashUntil: 0
          });
        }
        spawnParticles(deathX, deathY, deathColor);
      }, 3000);
    }
  }
}

function triggerCryoGrenade() {
  if (gameOver || isPaused) return;
  const weapon = getWeapon();
  if (weapon.id !== 'cryorifle') return;
  const now = performance.now();
  if (now - cryoGrenadeLastUsed < CRYO_GRENADE_COOLDOWN) return;

  const alive = bots.filter(b => !b.dead);
  if (alive.length === 0) return;

  const targets = alive
    .map(b => ({ b, d: Math.hypot(b.x - player.x, b.y - player.y) }))
    .sort((a, c) => a.d - c.d)
    .slice(0, 3)
    .map(t => t.b);

  cryoGrenadeLastUsed = now;

  targets.forEach((target, i) => {
    const travelTime = 420 + i * 70;
    iceGrenades.push({
      startX: player.x,
      startY: player.y,
      target,
      born: now,
      duration: travelTime
    });
    setTimeout(() => {
      if (gameOver || levelTransition) return;
      const ix = target.x, iy = target.y; // laatst bekende positie van het doelwit
      explosions.push({ x: ix, y: iy, born: performance.now(), maxR: 45 });
      spawnParticles(ix, iy, '#9be3ff');
      spawnParticles(ix, iy, '#ffffff');
      bots.forEach(other => {
        if (other.dead) return;
        const dd = Math.hypot(ix - other.x, iy - other.y);
        if (dd < 40) {
          damageBotSimple(other, CRYO_GRENADE_DMG, '#9be3ff');
          if (!other.dead) other.frozenUntil = Math.max(other.frozenUntil || 0, performance.now() + 5000);
        }
      });
    }, travelTime);
  });
}
window.triggerCryoGrenade = triggerCryoGrenade;

function triggerVampBolt() {
  if (gameOver || isPaused) return;
  const weapon = getWeapon();
  if (weapon.id !== 'vampcannon') return;
  const now = performance.now();
  if (now - vampBoltLastUsed < VAMP_BOLT_COOLDOWN) return;

  const alive = bots.filter(b => !b.dead);
  if (alive.length === 0) return;

  const targets = alive
    .map(b => ({ b, d: Math.hypot(b.x - player.x, b.y - player.y) }))
    .sort((a, c) => a.d - c.d)
    .slice(0, 3)
    .map(t => t.b);

  vampBoltLastUsed = now;

  targets.forEach((target, i) => {
    const travelTime = 380 + i * 60;
    vampBolts.push({
      startX: player.x,
      startY: player.y,
      target,
      born: now,
      duration: travelTime
    });
    setTimeout(() => {
      if (gameOver || levelTransition) return;
      const ix = target.x, iy = target.y; // laatst bekende positie van het doelwit
      explosions.push({ x: ix, y: iy, born: performance.now(), maxR: 40 });
      spawnParticles(ix, iy, '#ff2d6f');
      spawnParticles(ix, iy, '#ff6b81');
      bots.forEach(other => {
        if (other.dead) return;
        const dd = Math.hypot(ix - other.x, iy - other.y);
        if (dd < 40) {
          damageBotSimple(other, VAMP_BOLT_DMG, '#ff2d6f');
          player.hp = Math.min(player.maxHp, player.hp + VAMP_BOLT_HEAL);
          spawnParticles(player.x, player.y, '#ff6b81');
        }
      });
    }, travelTime);
  });
}
window.triggerVampBolt = triggerVampBolt;

function triggerVoltNova() {
  // Volt Caster special: onmiddellijke bliksemontlading rond de speler
  if (gameOver || isPaused) return;
  const weapon = getWeapon();
  if (weapon.id !== 'voltcaster') return;
  const now = performance.now();
  if (now - voltNovaLastUsed < VOLT_NOVA_COOLDOWN) return;

  const targets = bots.filter(b => !b.dead && Math.hypot(b.x - player.x, b.y - player.y) < VOLT_NOVA_RADIUS);
  if (targets.length === 0) return;

  voltNovaLastUsed = now;
  spawnParticles(player.x, player.y, '#7df9ff');
  spawnParticles(player.x, player.y, '#ffffff');
  targets.forEach(bot => {
    lightningBolts.push({ x1: player.x, y1: player.y, x2: bot.x, y2: bot.y, born: now });
    damageBotSimple(bot, VOLT_NOVA_DMG, '#7df9ff');
  });
}
window.triggerVoltNova = triggerVoltNova;

function triggerRiftPulse() {
  // Singularity Gun special: opent op eigen commando een zwart gat bij de dichtstbijzijnde bot
  if (gameOver || isPaused) return;
  const weapon = getWeapon();
  if (weapon.id !== 'singularity') return;
  const now = performance.now();
  if (now - riftPulseLastUsed < RIFT_PULSE_COOLDOWN) return;

  const alive = bots.filter(b => !b.dead);
  if (alive.length === 0) return;
  const nearest = alive.reduce((a, b) =>
    Math.hypot(b.x - player.x, b.y - player.y) < Math.hypot(a.x - player.x, a.y - player.y) ? b : a
  );

  riftPulseLastUsed = now;
  blackHoles.push({ x: nearest.x, y: nearest.y, born: now, duration: 1200, radius: 130, exploded: false });
  spawnParticles(nearest.x, nearest.y, '#9b5de5');
}
window.triggerRiftPulse = triggerRiftPulse;

function triggerLavaField() {
  // Magma Kanon special (Wereld 2): legt een brandend lavaveld neer op het richtpunt
  if (gameOver || isPaused) return;
  const weapon = getWeapon();
  if (weapon.id !== 'magmacannon') return;
  const now = performance.now();
  if (now - lavaFieldLastUsed < LAVA_FIELD_COOLDOWN) return;
  lavaFieldLastUsed = now;
  fireZones.push({ x: mouse.x, y: mouse.y, radius: LAVA_FIELD_RADIUS, until: now + LAVA_FIELD_DURATION, tickDmg: LAVA_FIELD_TICK_DMG, lastTick: 0 });
  spawnParticles(mouse.x, mouse.y, '#ff8c00');
  spawnParticles(mouse.x, mouse.y, '#3a1f12');
}
window.triggerLavaField = triggerLavaField;

function triggerHurricaneBlast() {
  // Orkaanstaf special (Wereld 2): windvlaag om de speler heen die bots beschadigt en wegblaast
  if (gameOver || isPaused) return;
  const weapon = getWeapon();
  if (weapon.id !== 'hurricanestaff') return;
  const now = performance.now();
  if (now - hurricaneBlastLastUsed < HURRICANE_BLAST_COOLDOWN) return;
  const targets = bots.filter(b => !b.dead && Math.hypot(b.x - player.x, b.y - player.y) < HURRICANE_BLAST_RADIUS);
  hurricaneBlastLastUsed = now;
  shockRings.push({ x: player.x, y: player.y, born: now, maxR: HURRICANE_BLAST_RADIUS, duration: 450, color: '#eaffff' });
  spawnParticles(player.x, player.y, '#eaffff');
  spawnParticles(player.x, player.y, '#cfe8ee');
  targets.forEach(bot => {
    damageBotSimple(bot, HURRICANE_BLAST_DMG, '#eaffff');
    if (bot.dead) return;
    const ang = Math.atan2(bot.y - player.y, bot.x - player.x);
    bot.x = Math.max(bot.r, Math.min(canvas.width - bot.r, bot.x + Math.cos(ang) * 90));
    bot.y = Math.max(bot.r, Math.min(canvas.height - bot.r, bot.y + Math.sin(ang) * 90));
  });
}
window.triggerHurricaneBlast = triggerHurricaneBlast;

function triggerFrostLance() {
  // Rijmlans special (Wereld 2): doorborende vriesstraal in de richting van de muis
  if (gameOver || isPaused) return;
  const weapon = getWeapon();
  if (weapon.id !== 'frostlance') return;
  const now = performance.now();
  if (now - frostLanceLastUsed < FROST_LANCE_COOLDOWN) return;
  frostLanceLastUsed = now;
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  const endX = player.x + Math.cos(angle) * FROST_LANCE_RANGE;
  const endY = player.y + Math.sin(angle) * FROST_LANCE_RANGE;
  iceLances.push({ x1: player.x, y1: player.y, x2: endX, y2: endY, born: now });
  spawnParticles(player.x, player.y, '#9ef7ff');
  const dx = endX - player.x, dy = endY - player.y;
  const len2 = dx * dx + dy * dy;
  bots.forEach(bot => {
    if (bot.dead) return;
    let t = ((bot.x - player.x) * dx + (bot.y - player.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = player.x + dx * t, py = player.y + dy * t;
    const dd = Math.hypot(bot.x - px, bot.y - py);
    if (dd < bot.r + 14) {
      damageBotSimple(bot, FROST_LANCE_DMG, '#9ef7ff');
      if (!bot.dead) bot.frozenUntil = Math.max(bot.frozenUntil || 0, now + 2000);
    }
  });
}
window.triggerFrostLance = triggerFrostLance;

function triggerEarthSlam() {
  // Aardhamer special (Wereld 2): aardschok om de speler heen die beschadigt, wegstoot en heel even verlamt
  if (gameOver || isPaused) return;
  const weapon = getWeapon();
  if (weapon.id !== 'earthhammer') return;
  const now = performance.now();
  if (now - earthSlamLastUsed < EARTH_SLAM_COOLDOWN) return;
  const targets = bots.filter(b => !b.dead && Math.hypot(b.x - player.x, b.y - player.y) < EARTH_SLAM_RADIUS);
  earthSlamLastUsed = now;
  explosions.push({ x: player.x, y: player.y, born: now, maxR: EARTH_SLAM_RADIUS });
  spawnParticles(player.x, player.y, '#8a6a3a');
  spawnParticles(player.x, player.y, '#5c3a1e');
  targets.forEach(bot => {
    damageBotSimple(bot, EARTH_SLAM_DMG, '#8a6a3a');
    if (bot.dead) return;
    const ang = Math.atan2(bot.y - player.y, bot.x - player.x);
    bot.x = Math.max(bot.r, Math.min(canvas.width - bot.r, bot.x + Math.cos(ang) * 70));
    bot.y = Math.max(bot.r, Math.min(canvas.height - bot.r, bot.y + Math.sin(ang) * 70));
    bot.rootedUntil = Math.max(bot.rootedUntil || 0, now + 500);
  });
}
window.triggerEarthSlam = triggerEarthSlam;

function triggerStickyBarrage() {
  // Kleefbom Werper special: gooit in één keer 3 kleefbommen naar de dichtstbijzijnde bots
  if (gameOver || isPaused) return;
  const weapon = getWeapon();
  if (weapon.id !== 'stickybomb') return;
  const now = performance.now();
  if (now - stickyBarrageLastUsed < STICKY_BARRAGE_COOLDOWN) return;

  const alive = bots.filter(b => !b.dead);
  if (alive.length === 0) return;

  const targets = alive
    .map(b => ({ b, d: Math.hypot(b.x - player.x, b.y - player.y) }))
    .sort((a, c) => a.d - c.d)
    .slice(0, 3)
    .map(t => t.b);

  stickyBarrageLastUsed = now;

  targets.forEach((target, i) => {
    const travelTime = 400 + i * 70;
    stickyThrows.push({
      startX: player.x,
      startY: player.y,
      target,
      born: now,
      duration: travelTime
    });
    setTimeout(() => {
      if (gameOver || levelTransition) return;
      const bx = target.x, by = target.y; // laatst bekende positie van het doelwit
      telegraphs.push({ x: bx, y: by, radius: 90, warnUntil: performance.now() + 800 });
      setTimeout(() => {
        if (gameOver || levelTransition) return;
        explosions.push({ x: bx, y: by, born: performance.now(), maxR: 90 });
        spawnParticles(bx, by, '#ff8800');
        spawnParticles(bx, by, '#ffcc00');
        bots.forEach(other => {
          const dd = Math.hypot(bx - other.x, by - other.y);
          if (dd < 90) damageBotSimple(other, STICKY_BARRAGE_DMG, '#ff8800');
        });
      }, 800);
    }, travelTime);
  });
}
window.triggerStickyBarrage = triggerStickyBarrage;

function triggerToxicCloud() {
  // Toxic Cannon special: laat rond de speler een gifwolk los die alle bots in de buurt vergiftigt
  if (gameOver || isPaused) return;
  const weapon = getWeapon();
  if (weapon.id !== 'toxiccannon') return;
  const now = performance.now();
  if (now - toxicCloudLastUsed < TOXIC_CLOUD_COOLDOWN) return;

  const targets = bots.filter(b => !b.dead && Math.hypot(b.x - player.x, b.y - player.y) < TOXIC_CLOUD_RADIUS);
  if (targets.length === 0) return;

  toxicCloudLastUsed = now;
  explosions.push({ x: player.x, y: player.y, born: now, maxR: TOXIC_CLOUD_RADIUS });
  spawnParticles(player.x, player.y, '#7ed957');
  spawnParticles(player.x, player.y, '#ffffff');
  targets.forEach(bot => {
    bot.poisonUntil = Math.max(bot.poisonUntil || 0, now + 4000);
    bot.poisonSpread = true;
  });
}
window.triggerToxicCloud = triggerToxicCloud;

function triggerExecutionOrder() {
  // Executioner Rifle special: rondt direct alle verzwakte bots in de buurt af, ongeacht hun resterende HP
  if (gameOver || isPaused) return;
  const weapon = getWeapon();
  if (weapon.id !== 'executioner') return;
  const now = performance.now();
  if (now - executionOrderLastUsed < EXECUTION_ORDER_COOLDOWN) return;

  const targets = bots.filter(b =>
    !b.dead && !b.immortal &&
    b.hp / b.maxHp < EXECUTION_ORDER_HP_PCT &&
    Math.hypot(b.x - player.x, b.y - player.y) < EXECUTION_ORDER_RADIUS
  );
  if (targets.length === 0) return;

  executionOrderLastUsed = now;
  targets.forEach(bot => {
    spawnParticles(bot.x, bot.y, '#ffffff');
    spawnParticles(bot.x, bot.y, '#ff3838');
    damageBotSimple(bot, bot.hp, '#ff3838');
  });
}
window.triggerExecutionOrder = triggerExecutionOrder;

function pointSegmentDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq ? ((px - x1) * dx + (py - y1) * dy) / lenSq : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
}

function triggerBladeDash() {
  // Momentum Blade special: dasht naar de muispositie en haalt alle bots op de route neer
  if (gameOver || isPaused) return;
  const weapon = getWeapon();
  if (weapon.id !== 'momentum') return;
  const now = performance.now();
  if (now - bladeDashLastUsed < BLADE_DASH_COOLDOWN) return;

  bladeDashLastUsed = now;
  const ang = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  const startX = player.x, startY = player.y;
  const endX = Math.max(player.r, Math.min(canvas.width - player.r, startX + Math.cos(ang) * BLADE_DASH_DIST));
  const endY = Math.max(player.r, Math.min(canvas.height - player.r, startY + Math.sin(ang) * BLADE_DASH_DIST));

  bladeTrails.push({ x1: startX, y1: startY, x2: endX, y2: endY, born: now });
  player.x = endX;
  player.y = endY;
  spawnParticles(startX, startY, '#e0e0ff');
  spawnParticles(endX, endY, '#e0e0ff');

  bots.forEach(bot => {
    if (bot.dead) return;
    if (pointSegmentDist(bot.x, bot.y, startX, startY, endX, endY) < bot.r + 40) {
      damageBotSimple(bot, BLADE_DASH_DMG, '#e0e0ff');
      if (bot.dead) {
        player.killStreak = Math.min(10, player.killStreak + 1);
        player.killStreakLastKill = now;
      }
    }
  });
}
window.triggerBladeDash = triggerBladeDash;

function spreadPoison(bot) {
  bots.forEach(other => {
    if (other === bot || other.dead) return;
    const dd = Math.hypot(bot.x - other.x, bot.y - other.y);
    if (dd < 80) {
      other.poisonUntil = Math.max(other.poisonUntil || 0, performance.now() + 3000);
      other.poisonSpread = true;
      spawnParticles(other.x, other.y, '#7ed957');
    }
  });
}

function meleeAttack(bot) {
  const now = performance.now();
  const dmg = bot.meleeDamage || 15;
  const notBlocked = applyDamageToPlayer(dmg);
  spawnParticles(player.x, player.y, notBlocked ? '#ff5c5c' : '#c77dff');
  bot.slashUntil = now + 200;

  const armor = getArmorStats();
  const thorns = armor.thorns;

  if (notBlocked && !bot.dead) {
    // Thorns
    if (thorns) {
      bot.hp -= thorns;
      spawnParticles(bot.x, bot.y, '#ffbb33');
    }

    // Reflection
    if (armor.reflection > 0) {
      const reflectDmg = Math.ceil(dmg * armor.reflection);
      bot.hp -= reflectDmg;
      spawnParticles(bot.x, bot.y, '#ffff00');
    }

    // Poison Reflect
    if (armor.poisonReflect) {
      bot.poisonUntil = Math.max(bot.poisonUntil || 0, now + 4000);
      bot.poisonSpread = true;
    }

    // Freeze Reflect
    if (armor.freezeReflect) {
      bot.frozenUntil = Math.max(bot.frozenUntil || 0, now + 3000);
    }

    if (bot.hp <= 0 && !bot.immortal) {
      bot.dead = true;
      score += bot.maxHp >= 10 ? 40 : bot.maxHp >= 6 ? 25 : bot.maxHp >= 3 ? 15 : 10;
      if (gameMode === 'levels') levelKills++;
      if (armor.vampireHeal) player.hp = Math.min(player.maxHp, player.hp + armor.vampireHeal);
    }
  }
}

function mineDrop(bot) {
  // warden: legt een mijn neer op de plek waar de speler op dat moment staat, gaat alleen af na een fuse
  const mx = player.x, my = player.y;
  const radius = 60;
  const fuse = 3500;
  const armedAt = performance.now();
  if (!bot.mines) bot.mines = [];
  bot.mines.push({ x: mx, y: my, radius, armedAt, fuse, exploded: false });
  telegraphs.push({ x: mx, y: my, radius, warnUntil: armedAt + fuse });
}

function detonateMine(bot, mine) {
  if (mine.exploded) return;
  mine.exploded = true;
  explosions.push({ x: mine.x, y: mine.y, born: performance.now(), maxR: mine.radius });
  spawnParticles(mine.x, mine.y, '#ff8800');
  const dd = Math.hypot(player.x - mine.x, player.y - mine.y);
  if (dd < mine.radius + player.r) {
    applyDamageToPlayer(bot.specialDmg || 26);
  }
}

function shockBolt(bot) {
  // arclight: telegrafeert 3 inslagpunten rond de speler, en zapt daarna elk met een instant bliksemschicht
  const radius = 45;
  const delay = 550;
  const spreadDist = 55;
  const targets = [{ x: player.x, y: player.y }];
  for (let i = 0; i < 2; i++) {
    const a = Math.random() * Math.PI * 2;
    targets.push({ x: player.x + Math.cos(a) * spreadDist, y: player.y + Math.sin(a) * spreadDist });
  }
  targets.forEach(t => telegraphs.push({ x: t.x, y: t.y, radius, warnUntil: performance.now() + delay }));
  setTimeout(() => {
    if (gameOver || levelTransition || bot.dead) return;
    targets.forEach(t => {
      lightningBolts.push({ x1: bot.x, y1: bot.y, x2: t.x, y2: t.y, born: performance.now() });
      spawnParticles(t.x, t.y, '#fff066');
      const dd = Math.hypot(player.x - t.x, player.y - t.y);
      if (dd < radius + player.r) {
        applyDamageToPlayer(bot.specialDmg || 18);
      }
    });
  }, delay);
}

function gasCloudDrop(bot) {
  // miasma: laat een gifwolk achter op zijn huidige positie die schade-over-tijd doet aan de speler
  gasClouds.push({ x: bot.x, y: bot.y, radius: 140, born: performance.now(), duration: 4500, lastTick: 0, tickDmg: bot.specialDmg || 9 });
  spawnParticles(bot.x, bot.y, '#7ed957');
}

function shieldBash(bot) {
  // bulwark: beukt naar voren en stoot de speler met veel schade en een flinke terugstoot weg
  const angle = Math.atan2(player.y - bot.y, player.x - bot.x);
  applyDamageToPlayer(bot.specialDmg || 22);
  const pushDist = 130;
  player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x + Math.cos(angle) * pushDist));
  player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y + Math.sin(angle) * pushDist));
  spawnParticles(player.x, player.y, '#ffcf3f');
  explosions.push({ x: bot.x, y: bot.y, born: performance.now(), maxR: 50 });
}

function broodSummon(bot) {
  // broodmother: roept 7 kleine, zwakke broodlings op in een ruime cirkel om zichzelf
  const count = 7;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
    const dist = 150 + Math.random() * 70;
    bots.push({
      x: Math.max(15, Math.min(canvas.width - 15, bot.x + Math.cos(angle) * dist)),
      y: Math.max(15, Math.min(canvas.height - 15, bot.y + Math.sin(angle) * dist)),
      r: 11,
      speed: 2.1,
      hp: 2,
      maxHp: 2,
      lastShot: 0,
      shootCooldown: 1300,
      color: '#8a5cf6',
      type: 'broodling',
      pattern: 'single',
      bulletSpeed: 5,
      bulletDmg: 0,
      swapOnHit: false,
      meleeDamage: 0,
      specialDmg: 0,
      specialLastUsed: 0,
      splits: false,
      spiralAngle: 0,
      frozenUntil: 0,
      slashUntil: 0
    });
  }
  spawnParticles(bot.x, bot.y, '#8a5cf6');
}

function gravityWellCast(bot) {
  // gravitas: opent een zwaartekrachtveld dat de speler naar het middelpunt trekt en dan een burst laat afgaan
  const wx = bot.x, wy = bot.y;
  const radius = 140;
  const duration = 1500;
  telegraphs.push({ x: wx, y: wy, radius, warnUntil: performance.now() + duration });
  bot.gravityWell = { x: wx, y: wy, radius, until: performance.now() + duration };
}

function freezeTrap(bot) {
  // cryostasis: telegrafeert een ijsval op de speler die hem tijdelijk verlamt als hij er nog in staat
  const targetX = player.x;
  const targetY = player.y;
  const radius = 95;
  const delay = 1100;
  telegraphs.push({ x: targetX, y: targetY, radius, warnUntil: performance.now() + delay });
  setTimeout(() => {
    if (gameOver || levelTransition || bot.dead) return;
    const dd = Math.hypot(player.x - targetX, player.y - targetY);
    if (dd < radius + player.r) {
      player.rootedUntil = performance.now() + 2200;
      applyDamageToPlayer(bot.specialDmg || 8);
      spawnParticles(targetX, targetY, '#9be3ff');
    }
  }, delay);
}

function railgunSnipe(bot) {
  // railgunner: lange telegraaf, daarna een instant maar verwoestende precisiestraal die exact langs de getelegrafeerde lijn schiet
  const angle0 = Math.atan2(player.y - bot.y, player.x - bot.x);
  laserTelegraphs.push({ bot, angle: angle0, warnUntil: performance.now() + 1400 });
  setTimeout(() => {
    if (gameOver || levelTransition || bot.dead) return;
    const beam = { x1: bot.x, y1: bot.y, angle: angle0, born: performance.now(), duration: 180 };
    activeLasers.push(beam);
    if (isPlayerInBeam(beam)) applyDamageToPlayer(bot.specialDmg || 42);
  }, 1400);
}

function curseBolt(bot) {
  // vexer: zapt de speler met een vloek die zijn schade tijdelijk halveert, geen directe schade
  const targetX = player.x;
  const targetY = player.y;
  const radius = 45;
  const delay = 500;
  setTimeout(() => {
    if (gameOver || levelTransition || bot.dead) return;
    lightningBolts.push({ x1: bot.x, y1: bot.y, x2: targetX, y2: targetY, born: performance.now() });
    const dd = Math.hypot(player.x - targetX, player.y - targetY);
    if (dd < radius + player.r) {
      player.curseUntil = performance.now() + 7000;
      spawnParticles(targetX, targetY, '#a020f0');
    }
  }, delay);
}

function clusterBombardment(bot) {
  // bombardier: telegrafeert 4 inslagpunten verspreid rond de speler en laat ze gelijktijdig ontploffen
  const n = 4;
  const radius = 45;
  const delay = 750;
  const impacts = [];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.random() * 90;
    impacts.push({ x: player.x + Math.cos(a) * d, y: player.y + Math.sin(a) * d });
  }
  impacts.forEach(p => telegraphs.push({ x: p.x, y: p.y, radius, warnUntil: performance.now() + delay }));
  setTimeout(() => {
    if (gameOver || levelTransition || bot.dead) return;
    impacts.forEach(p => {
      explosions.push({ x: p.x, y: p.y, born: performance.now(), maxR: radius });
      spawnParticles(p.x, p.y, '#ff8800');
      const dd = Math.hypot(player.x - p.x, player.y - p.y);
      if (dd < radius + player.r) applyDamageToPlayer(bot.specialDmg || 14);
    });
  }, delay);
}

function elementStorm(dmg, count) {
  // Elementenstorm-powerup: afwisselend vuur- en ijsstralen, 8 per seconde, elk met een stippellijntje als waarschuwing vooraf
  const interval = 125; // 8 per sec
  const warnDelay = 500;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      if (gameOver || levelTransition) return;
      const edge = Math.floor(Math.random() * 4);
      let x1, y1, x2, y2;
      if (edge === 0) { x1 = Math.random() * canvas.width; y1 = 0; x2 = Math.random() * canvas.width; y2 = canvas.height; }
      else if (edge === 1) { x1 = Math.random() * canvas.width; y1 = canvas.height; x2 = Math.random() * canvas.width; y2 = 0; }
      else if (edge === 2) { x1 = 0; y1 = Math.random() * canvas.height; x2 = canvas.width; y2 = Math.random() * canvas.height; }
      else { x1 = canvas.width; y1 = Math.random() * canvas.height; x2 = 0; y2 = Math.random() * canvas.height; }
      const elementType = Math.random() < 0.5 ? 'fire' : 'ice';

      barrageTelegraphs.push({ x1, y1, x2, y2, elementType, warnUntil: performance.now() + warnDelay });

      setTimeout(() => {
        if (gameOver || levelTransition) return;
        barrageLasers.push({ x1, y1, x2, y2, elementType, born: performance.now(), duration: 250 });

        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        bots.forEach(bot => {
          if (bot.dead) return;
          const px = bot.x - x1, py = bot.y - y1;
          const proj = Math.max(0, Math.min(len, (px * dx + py * dy) / len));
          const closestX = x1 + (dx / len) * proj;
          const closestY = y1 + (dy / len) * proj;
          const dist = Math.hypot(bot.x - closestX, bot.y - closestY);
          if (dist < bot.r + 6) {
            damageBotSimple(bot, dmg, elementType === 'fire' ? '#ff8800' : '#9be3ff');
            if (elementType === 'ice' && !bot.dead) bot.frozenUntil = Math.max(bot.frozenUntil || 0, performance.now() + 1000);
          }
        });
      }, warnDelay);
    }, i * interval);
  }
}

function showDisasterAlert(text) {
  const el = document.getElementById('bossAlert');
  if (!el) return;
  el.textContent = text;
  el.style.display = 'flex';
  setTimeout(() => { el.style.display = 'none'; }, 2500);
}

function startRandomDisaster() {
  const types = ['iceFloor', 'sandstorm', 'lightningStorm', 'earthquake', 'meteorShower', 'tornado', 'tsunami'];
  const type = types[Math.floor(Math.random() * types.length)];
  activeDisasterType = type;
  const now = performance.now();

  if (type === 'iceFloor') {
    disasterEndAt = now + 20000;
    iceFloorUntil = disasterEndAt;
    showDisasterAlert('🧊 IJSVLOER — de hele vloer is spekglad!');
  } else if (type === 'sandstorm') {
    disasterEndAt = now + 14000;
    sandstormUntil = disasterEndAt;
    showDisasterAlert('🌪 ZANDSTORM — minder zicht en snelheid!');
  } else if (type === 'lightningStorm') {
    disasterEndAt = now + 12000;
    lightningStormUntil = disasterEndAt;
    lastLightningStrike = now;
    showDisasterAlert('⛈ BLIKSEMSTORM — blijf in beweging!');
  } else if (type === 'earthquake') {
    disasterEndAt = now + 3500;
    earthquakeShakeUntil = disasterEndAt;
    bots.forEach(bot => {
      if (bot.dead) return;
      const ang = Math.random() * Math.PI * 2;
      const dist = 150 + Math.random() * 150;
      bot.x = Math.max(bot.r, Math.min(canvas.width - bot.r, bot.x + Math.cos(ang) * dist));
      bot.y = Math.max(bot.r, Math.min(canvas.height - bot.r, bot.y + Math.sin(ang) * dist));
    });
    showDisasterAlert('🌋 AARDBEVING!');
  } else if (type === 'meteorShower') {
    disasterEndAt = now + 10000;
    meteorShowerUntil = disasterEndAt;
    lastMeteorImpact = now;
    showDisasterAlert('☄ METEORENREGEN — zoek dekking!');
  } else if (type === 'tornado') {
    disasterEndAt = now + 12000;
    tornadoUntil = disasterEndAt;
    tornadoX = 100 + Math.random() * (canvas.width - 200);
    tornadoY = 100 + Math.random() * (canvas.height - 200);
    const ang = Math.random() * Math.PI * 2;
    tornadoVX = Math.cos(ang) * 1.3;
    tornadoVY = Math.sin(ang) * 1.3;
    showDisasterAlert('🌀 TORNADO — blijf uit de buurt van de wervelwind!');
  } else if (type === 'tsunami') {
    disasterEndAt = now + 15000;
    tsunamiUntil = disasterEndAt;
    lastTsunamiWave = now;
    showDisasterAlert('🌊 TSUNAMI — de vloer overstroomt, zoek dekking voor de golven!');
  }
}

function sustainDisasterPractice() {
  // Natuurramp-oefensessie: houdt de gekozen ramp voortdurend actief
  const now = performance.now();
  activeDisasterType = disasterPracticeType;
  if (disasterPracticeType === 'sandstorm') {
    sandstormUntil = now + 2000;
  } else if (disasterPracticeType === 'lightningStorm') {
    lightningStormUntil = now + 2000;
  } else if (disasterPracticeType === 'meteorShower') {
    meteorShowerUntil = now + 2000;
  } else if (disasterPracticeType === 'iceFloor') {
    iceFloorUntil = now + 2000;
  } else if (disasterPracticeType === 'earthquake') {
    if (now - lastEarthquakeShake > 6000) {
      lastEarthquakeShake = now;
      earthquakeShakeUntil = now + 3500;
      bots.forEach(bot => {
        if (bot.dead) return;
        const ang = Math.random() * Math.PI * 2;
        const dist = 150 + Math.random() * 150;
        bot.x = Math.max(bot.r, Math.min(canvas.width - bot.r, bot.x + Math.cos(ang) * dist));
        bot.y = Math.max(bot.r, Math.min(canvas.height - bot.r, bot.y + Math.sin(ang) * dist));
      });
    }
  } else if (disasterPracticeType === 'tornado') {
    if (tornadoUntil === 0) {
      tornadoX = canvas.width / 2;
      tornadoY = canvas.height / 2;
      const ang = Math.random() * Math.PI * 2;
      tornadoVX = Math.cos(ang) * 1.3;
      tornadoVY = Math.sin(ang) * 1.3;
    }
    tornadoUntil = now + 2000;
  } else if (disasterPracticeType === 'tsunami') {
    tsunamiUntil = now + 2000;
  }
}

function triggerTsunamiWave() {
  const dirs = ['left', 'right', 'top', 'bottom'];
  const dir = dirs[Math.floor(Math.random() * dirs.length)];
  showDisasterAlert('🌊 VLOEDGOLF!');
  tsunamiWaves.push({ dir, born: performance.now(), sweepDuration: 1400, totalLife: 1400, hitPlayer: false, hitBots: new Set() });
}

function triggerLightningStrike() {
  const x = 40 + Math.random() * (canvas.width - 80);
  const y = 40 + Math.random() * (canvas.height - 80);
  const radius = 55;
  const delay = 500;
  telegraphs.push({ x, y, radius, warnUntil: performance.now() + delay });
  setTimeout(() => {
    if (gameOver || levelTransition) return;
    lightningBolts.push({ x1: x + (Math.random() - 0.5) * 30, y1: -40, x2: x, y2: y, born: performance.now() });
    explosions.push({ x, y, born: performance.now(), maxR: radius });
    spawnParticles(x, y, '#fff066');
    spawnParticles(x, y, '#c9a3ff');
    spawnParticles(x, y, '#ffffff');
    const dd = Math.hypot(player.x - x, player.y - y);
    if (dd < radius + player.r) applyDamageToPlayer(10);
    bots.forEach(bot => {
      if (bot.dead) return;
      const bd = Math.hypot(bot.x - x, bot.y - y);
      if (bd < radius + bot.r) damageBotSimple(bot, 10, '#fff066');
    });
  }, delay);
}

function triggerMeteorImpact() {
  const x = 40 + Math.random() * (canvas.width - 80);
  const y = 40 + Math.random() * (canvas.height - 80);
  const radius = 65;
  const delay = 700;
  telegraphs.push({ x, y, radius, warnUntil: performance.now() + delay });
  fallingMeteors.push({ x, y, born: performance.now(), fallDelay: delay, lingerDuration: 1200, fadeDuration: 900, totalLife: delay + 1200 + 900, radius: 22 });
  setTimeout(() => {
    if (gameOver || levelTransition) return;
    explosions.push({ x, y, born: performance.now(), maxR: radius });
    spawnParticles(x, y, '#ff8800');
    spawnParticles(x, y, '#ff3838');
    const dd = Math.hypot(player.x - x, player.y - y);
    if (dd < radius + player.r) applyDamageToPlayer(14);
    bots.forEach(bot => {
      if (bot.dead) return;
      const bd = Math.hypot(bot.x - x, bot.y - y);
      if (bd < radius + bot.r) damageBotSimple(bot, 14, '#ff8800');
    });
  }, delay);
}

function mortarStrike(bot) {
  // artillery: telegrafeert een inslagpunt, en beschadigt de speler pas na een korte waarschuwing
  const targetX = player.x;
  const targetY = player.y;
  const radius = 55;
  const delay = 700;
  telegraphs.push({ x: targetX, y: targetY, radius, warnUntil: performance.now() + delay });
  if (bot.type === 'magmawicht') {
    // Lavagolem: er valt echt lava naar beneden, die daarna nog even als brandende plas blijft liggen
    const born = performance.now();
    lavaPools.push({ x: targetX, y: targetY, born, fallDelay: delay, lingerDuration: 3500, fadeDuration: 900, totalLife: delay + 3500 + 900, radius, lastIgniteTick: 0 });
  }
  setTimeout(() => {
    if (gameOver || levelTransition) return;
    explosions.push({ x: targetX, y: targetY, born: performance.now(), maxR: radius });
    if (bot.type === 'magmawicht') {
      // gesmolten lava-inslag i.p.v. de standaard rode explosie
      spawnParticles(targetX, targetY, '#ff8c00');
      spawnParticles(targetX, targetY, '#8a6a3a');
      spawnParticles(targetX, targetY, '#3a1f12');
    } else {
      spawnParticles(targetX, targetY, '#ff3838');
    }
    const dd = Math.hypot(player.x - targetX, player.y - targetY);
    if (dd < radius + player.r) {
      applyDamageToPlayer(bot.meleeDamage || 40);
      if (bot.type === 'magmawicht') {
        // door de lava geraakt: 3 sec lang in brand, elke sec 4 schade (korter met fireResist-pantser)
        player.burnUntil = performance.now() + 3000 * (1 - getArmorStats().fireResist);
        spawnParticles(player.x, player.y, '#ff5a1f');
      }
    }
  }, delay);
}

function bossSlam(bot) {
  // boss special attack: een verwoestende schokgolf rond zichzelf, met duidelijke waarschuwing vooraf
  const targetX = bot.x;
  const targetY = bot.y;
  const radius = 160;
  const delay = 900;
  const dmg = bot.specialDmg || 30;
  telegraphs.push({ x: targetX, y: targetY, radius, warnUntil: performance.now() + delay });
  setTimeout(() => {
    if (gameOver || levelTransition || bot.dead) return;
    explosions.push({ x: targetX, y: targetY, born: performance.now(), maxR: radius });
    spawnParticles(targetX, targetY, '#ff3838');
    spawnParticles(targetX, targetY, '#ffaa00');
    const dd = Math.hypot(player.x - targetX, player.y - targetY);
    if (dd < radius + player.r) {
      applyDamageToPlayer(dmg);
    }
  }, delay);
}

function bossBulletStorm(bot) {
  // Colossus special 2 - Spervuur: 3 snelle golven van 12 kogels in alle richtingen
  const n = 12;
  let wave = 0;
  const doWave = () => {
    if (bot.dead || gameOver || levelTransition) return;
    for (let i = 0; i < n; i++) {
      fireBotBullet(bot, (Math.PI * 2 / n) * i + wave * 0.26);
    }
    wave++;
    if (wave < 3) setTimeout(doWave, 260);
  };
  doWave();
}

function bossMeteorShower(bot) {
  // Titan special 2 - Meteorregen: 4 getelegrafeerde inslagpunten rond de speler, kort na elkaar
  const count = 4;
  const dmgEach = Math.round((bot.specialDmg || 38) * 0.6);
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      if (bot.dead || gameOver || levelTransition) return;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 120;
      const tx = Math.max(30, Math.min(canvas.width - 30, player.x + Math.cos(angle) * dist));
      const ty = Math.max(30, Math.min(canvas.height - 30, player.y + Math.sin(angle) * dist));
      const radius = 60;
      telegraphs.push({ x: tx, y: ty, radius, warnUntil: performance.now() + 650 });
      setTimeout(() => {
        if (gameOver || levelTransition) return;
        explosions.push({ x: tx, y: ty, born: performance.now(), maxR: radius });
        spawnParticles(tx, ty, '#ff8800');
        const dd = Math.hypot(player.x - tx, player.y - ty);
        if (dd < radius + player.r) applyDamageToPlayer(dmgEach);
      }, 650);
    }, i * 350);
  }
}

function isPlayerInBeam(beam) {
  const dx = Math.cos(beam.angle);
  const dy = Math.sin(beam.angle);
  const px = player.x - beam.x1;
  const py = player.y - beam.y1;
  const proj = px * dx + py * dy;
  if (proj < 0 || proj > 900) return false;
  const perpDist = Math.abs(px * dy - py * dx);
  return perpDist < 16 + player.r;
}

function bossLaserSweep(bot) {
  // Behemoth special 2 - Laserstraal: telegrafeert een lijn, vuurt daarna een dodelijke, doorlopende straal
  const angle0 = Math.atan2(player.y - bot.y, player.x - bot.x);
  laserTelegraphs.push({ bot, angle: angle0, warnUntil: performance.now() + 900 });
  setTimeout(() => {
    if (bot.dead || gameOver || levelTransition) return;
    const beamAngle = Math.atan2(player.y - bot.y, player.x - bot.x); // laatste moment richten
    const beam = { x1: bot.x, y1: bot.y, angle: beamAngle, born: performance.now(), duration: 900 };
    activeLasers.push(beam);
    const dmgPerTick = Math.round((bot.specialDmg || 45) * 0.18);
    const tickInterval = setInterval(() => {
      if (gameOver || levelTransition || bot.dead || performance.now() - beam.born > beam.duration) {
        clearInterval(tickInterval);
        return;
      }
      if (isPlayerInBeam(beam)) applyDamageToPlayer(dmgPerTick);
    }, 150);
  }, 900);
}

function bossDoomSpiral(bot) {
  // Nemesis special 2 - Doemspiraal: 5 snelle golven van 10 roterende kogels die de hele arena vullen
  const n = 10;
  const totalWaves = 5;
  let wave = 0;
  const doWave = () => {
    if (bot.dead || gameOver || levelTransition) return;
    for (let i = 0; i < n; i++) {
      fireBotBullet(bot, (Math.PI * 2 / n) * i + wave * 0.35);
    }
    wave++;
    if (wave < totalWaves) setTimeout(doWave, 180);
  };
  doWave();
}

function bossCrossLaser(bot) {
  // Nemesis special 3 - Kruislaser: twee gelijktijdige, loodrecht op elkaar staande laserstralen
  const angle0 = Math.atan2(player.y - bot.y, player.x - bot.x);
  laserTelegraphs.push({ bot, angle: angle0, warnUntil: performance.now() + 1000 });
  laserTelegraphs.push({ bot, angle: angle0 + Math.PI / 2, warnUntil: performance.now() + 1000 });
  setTimeout(() => {
    if (bot.dead || gameOver || levelTransition) return;
    const beamAngle = Math.atan2(player.y - bot.y, player.x - bot.x); // laatste moment richten
    const beamA = { x1: bot.x, y1: bot.y, angle: beamAngle, born: performance.now(), duration: 1000 };
    const beamB = { x1: bot.x, y1: bot.y, angle: beamAngle + Math.PI / 2, born: performance.now(), duration: 1000 };
    activeLasers.push(beamA, beamB);
    const dmgPerTick = Math.round((bot.specialDmg || 50) * 0.16);
    const tickInterval = setInterval(() => {
      if (gameOver || levelTransition || bot.dead || performance.now() - beamA.born > beamA.duration) {
        clearInterval(tickInterval);
        return;
      }
      if (isPlayerInBeam(beamA) || isPlayerInBeam(beamB)) applyDamageToPlayer(dmgPerTick);
    }, 150);
  }, 1000);
}

function bossWaterStrike(bot) {
  // Leviathan special 2 - Waterstraal: brede straal die scant over de arena
  const targetY = player.y;
  const startX = -100;
  const endX = canvas.width + 100;
  const duration = 800;
  const dmgPerTick = Math.round((bot.specialDmg || 55) * 0.2);

  const startTime = performance.now();
  const scanInterval = setInterval(() => {
    if (gameOver || levelTransition || bot.dead) {
      clearInterval(scanInterval);
      return;
    }
    const elapsed = performance.now() - startTime;
    if (elapsed > duration) {
      clearInterval(scanInterval);
      return;
    }
    const progress = elapsed / duration;
    const currentX = startX + (endX - startX) * progress;

    // Beschadig speler als hij in de straal staat
    const dx = Math.abs(player.x - currentX);
    if (dx < 80 && Math.abs(player.y - targetY) < 100) {
      applyDamageToPlayer(dmgPerTick);
    }
  }, 100);

  telegraphs.push({ x: player.x, y: targetY, radius: 100, warnUntil: performance.now() + 200 });
}

function bossChaosBurst(bot) {
  // Abomination special 2 - Chaos Burst: willekeurige kogels in alle richtingen
  const n = 20;
  for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 5 + Math.random() * 4;
    fireBotBullet(bot, angle, speed / 5);
  }
}

function bossSpawnMinions(bot) {
  // Abomination special 3 - Spawn Minions: laat mini-bots verschijnen
  const count = 6;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    const dist = 120;
    const spawnType = BOT_TYPES[Math.floor(Math.random() * 4)]; // random grunt-like type
    bots.push({
      x: bot.x + Math.cos(angle) * dist,
      y: bot.y + Math.sin(angle) * dist,
      r: 12,
      speed: 1.8,
      hp: 2,
      maxHp: 2,
      lastShot: 0,
      shootCooldown: 1200,
      color: '#a020f0',
      type: 'abominion',
      pattern: 'single',
      bulletSpeed: 5,
      meleeDamage: 0,
      splits: false,
      spiralAngle: 0,
      frozenUntil: 0,
      slashUntil: 0
    });
  }
}

function bossFireNova(bot) {
  // Vuurtitaan special 3 - Vuurnova: een felle vuurexplosie rond de boss zelf die de speler verbrandt als hij dichtbij is
  const cx = bot.x, cy = bot.y;
  const radius = 190;
  const delay = 700;
  telegraphs.push({ x: cx, y: cy, radius, warnUntil: performance.now() + delay });
  setTimeout(() => {
    if (gameOver || levelTransition || bot.dead) return;
    explosions.push({ x: cx, y: cy, born: performance.now(), maxR: radius });
    shockRings.push({ x: cx, y: cy, born: performance.now(), maxR: radius * 1.3, duration: 500, color: '#ffb703' });
    spawnParticles(cx, cy, '#fff275');
    spawnParticles(cx, cy, '#ff5a1f');
    const dd = Math.hypot(player.x - cx, player.y - cy);
    if (dd < radius + player.r) {
      applyDamageToPlayer(bot.specialDmg || 22);
      player.burnUntil = performance.now() + 3500 * (1 - getArmorStats().fireResist);
    }
  }, delay);
}

function bossFireRing(bot) {
  // Vuurtitaan special 4 - Vuurring: een vurige kooi rond de speler zelf (niet om de boss). De speler kan er 5 sec niet uit —
  // beweging wordt aan de rand tegengehouden (zie update.js) en tegen de vlammen aan duwen zet je in brand.
  const cx = player.x, cy = player.y;
  const radius = 130;
  const duration = 5000;
  const born = performance.now();
  fireRings.push({ x: cx, y: cy, born, duration, radius });
  player.fireCageUntil = born + duration;
  player.fireCageX = cx;
  player.fireCageY = cy;
  player.fireCageRadius = radius;
  spawnParticles(cx, cy, '#ff5a1f');
  spawnParticles(cx, cy, '#fff275');
  // vonken die willekeurig langs de kooiwand opspatten, voor een net iets dreigender vuurkooi-gevoel
  const sparkInterval = setInterval(() => {
    if (gameOver || levelTransition || performance.now() - born > duration) {
      clearInterval(sparkInterval);
      return;
    }
    const a = Math.random() * Math.PI * 2;
    const sx = cx + Math.cos(a) * radius;
    const sy = cy + Math.sin(a) * radius;
    spawnParticles(sx, sy, Math.random() < 0.5 ? '#ff8c42' : '#fff275');
  }, 140);
}

function bossFrostLance(bot) {
  // Vriesreus special 3 - Rijmlans: schiet exact langs het stippellijntje dat 1 sec eerder werd getelegrafeerd (dus ontwijkbaar door weg te stappen van de lijn)
  const now0 = performance.now();
  const delay = 1000;
  const angle = Math.atan2(player.y - bot.y, player.x - bot.x);
  laserTelegraphs.push({ bot, angle, warnUntil: now0 + delay });
  setTimeout(() => {
    if (gameOver || levelTransition || bot.dead) return;
    const endX = bot.x + Math.cos(angle) * 900;
    const endY = bot.y + Math.sin(angle) * 900;
    iceLances.push({ x1: bot.x, y1: bot.y, x2: endX, y2: endY, born: performance.now() });
    spawnParticles(bot.x, bot.y, '#9ef7ff');
    const dx = endX - bot.x, dy = endY - bot.y;
    const len2 = dx * dx + dy * dy;
    let t = ((player.x - bot.x) * dx + (player.y - bot.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = bot.x + dx * t, py = bot.y + dy * t;
    const dd = Math.hypot(player.x - px, player.y - py);
    if (dd < player.r + 16) {
      applyDamageToPlayer(bot.specialDmg || 24);
      player.rootedUntil = Math.max(player.rootedUntil, performance.now() + 1400 * (1 - getArmorStats().iceResist));
    }
  }, delay);
}

function bossEarthSlam(bot) {
  // Aardkoning special 3 - Aardbeving: een verwoestende aardschok rond de boss die wegstoot en verlamt
  const cx = bot.x, cy = bot.y;
  const radius = 210;
  const delay = 800;
  telegraphs.push({ x: cx, y: cy, radius, warnUntil: performance.now() + delay });
  setTimeout(() => {
    if (gameOver || levelTransition || bot.dead) return;
    explosions.push({ x: cx, y: cy, born: performance.now(), maxR: radius });
    spawnParticles(cx, cy, '#8a6a3a');
    spawnParticles(cx, cy, '#5c3a1e');
    const dd = Math.hypot(player.x - cx, player.y - cy);
    if (dd < radius + player.r) {
      applyDamageToPlayer(bot.specialDmg || 26);
      const ang = Math.atan2(player.y - cy, player.x - cx);
      player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x + Math.cos(ang) * 80));
      player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y + Math.sin(ang) * 80));
      player.rootedUntil = Math.max(player.rootedUntil, performance.now() + 800);
    }
  }, delay);
}

function bossHurricane(bot) {
  // Stormvorst special 3 - Orkaan: een kolkende windvlaag die de speler herhaaldelijk raakt en naar de boss toe trekt
  const cx = bot.x, cy = bot.y;
  const duration = 1400;
  const dmgPerTick = Math.round((bot.specialDmg || 28) * 0.35);
  const startTime = performance.now();
  shockRings.push({ x: cx, y: cy, born: startTime, maxR: 260, duration: 700, color: '#c9a3ff' });
  const tickInterval = setInterval(() => {
    if (gameOver || levelTransition || bot.dead || performance.now() - startTime > duration) {
      clearInterval(tickInterval);
      return;
    }
    const dd = Math.hypot(player.x - bot.x, player.y - bot.y);
    if (dd < 260) {
      applyDamageToPlayer(dmgPerTick);
      const ang = Math.atan2(bot.y - player.y, bot.x - player.x);
      player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x + Math.cos(ang) * 10));
      player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y + Math.sin(ang) * 10));
      spawnParticles(player.x, player.y, '#c9a3ff');
    }
  }, 250);
}

function bossFireLine(bot) {
  // Vuurtitaan special 5 - Vuurlijn: een reeks vuurzuilen die na elkaar ontploffen langs een rechte lijn vanaf de boss richting jou
  const angle = Math.atan2(player.y - bot.y, player.x - bot.x);
  const count = 5;
  const spacing = 70;
  const pillarRadius = 42;
  const delay = 750;
  const dmg = Math.round((bot.specialDmg || 22) * 0.6);
  for (let i = 1; i <= count; i++) {
    const px = bot.x + Math.cos(angle) * spacing * i;
    const py = bot.y + Math.sin(angle) * spacing * i;
    if (px < -50 || px > canvas.width + 50 || py < -50 || py > canvas.height + 50) continue;
    const fireDelay = delay + i * 90;
    telegraphs.push({ x: px, y: py, radius: pillarRadius, warnUntil: performance.now() + fireDelay });
    setTimeout(() => {
      if (gameOver || levelTransition) return;
      explosions.push({ x: px, y: py, born: performance.now(), maxR: pillarRadius });
      spawnParticles(px, py, '#ff5a1f');
      spawnParticles(px, py, '#fff275');
      const dd = Math.hypot(player.x - px, player.y - py);
      if (dd < pillarRadius + player.r) {
        applyDamageToPlayer(dmg);
        player.burnUntil = performance.now() + 2000 * (1 - getArmorStats().fireResist);
      }
    }, fireDelay);
  }
}

function bossPhoenixDive(bot) {
  // Vuurtitaan special 6 - Feniksduik: de boss duikt neer op je vastgelegde positie met een zware inslag en laat er blijvend vuur achter
  const tx = player.x, ty = player.y;
  const radius = 100;
  const delay = 1100;
  const dmg = Math.round((bot.specialDmg || 22) * 1.4);
  telegraphs.push({ x: tx, y: ty, radius, warnUntil: performance.now() + delay });
  spawnParticles(bot.x, bot.y, '#ff5a1f');
  setTimeout(() => {
    if (gameOver || levelTransition) return;
    const impactNow = performance.now();
    explosions.push({ x: tx, y: ty, born: impactNow, maxR: radius });
    shockRings.push({ x: tx, y: ty, born: impactNow, maxR: radius * 1.4, duration: 500, color: '#ffb703' });
    spawnParticles(tx, ty, '#fff275');
    spawnParticles(tx, ty, '#ff5a1f');
    lavaPools.push({ x: tx, y: ty, born: impactNow, fallDelay: 0, lingerDuration: 3000, fadeDuration: 600, totalLife: 3600, radius: radius * 0.6, lastIgniteTick: 0 });
    const dd = Math.hypot(player.x - tx, player.y - ty);
    if (dd < radius + player.r) {
      applyDamageToPlayer(dmg);
      player.burnUntil = performance.now() + 3000 * (1 - getArmorStats().fireResist);
    }
  }, delay);
}

function bossIceFan(bot) {
  // Vriesreus special 5 - IJswaaier: 3 gelijktijdige vriesstralen in een waaier, elk apart ontwijkbaar door tussen de lijnen te bewegen
  const now0 = performance.now();
  const delay = 900;
  const baseAngle = Math.atan2(player.y - bot.y, player.x - bot.x);
  const offsets = [-0.4, 0, 0.4];
  offsets.forEach(off => {
    laserTelegraphs.push({ bot, angle: baseAngle + off, warnUntil: now0 + delay });
  });
  setTimeout(() => {
    if (gameOver || levelTransition || bot.dead) return;
    spawnParticles(bot.x, bot.y, '#9ef7ff');
    offsets.forEach(off => {
      const angle = baseAngle + off;
      const endX = bot.x + Math.cos(angle) * 900;
      const endY = bot.y + Math.sin(angle) * 900;
      iceLances.push({ x1: bot.x, y1: bot.y, x2: endX, y2: endY, born: performance.now() });
      const dx = endX - bot.x, dy = endY - bot.y;
      const len2 = dx * dx + dy * dy;
      let t = ((player.x - bot.x) * dx + (player.y - bot.y) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
      const px = bot.x + dx * t, py = bot.y + dy * t;
      const dd = Math.hypot(player.x - px, player.y - py);
      if (dd < player.r + 14) {
        applyDamageToPlayer(Math.round((bot.specialDmg || 24) * 0.7));
        player.rootedUntil = Math.max(player.rootedUntil, performance.now() + 900 * (1 - getArmorStats().iceResist));
      }
    });
  }, delay);
}

function bossIceField(bot) {
  // Vriesreus special 6 - Vriesveld: verspreide ijspieken ontstaan na elkaar willekeurig over de hele arena, los van je eigen positie
  const count = 6;
  const radius = 55;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      if (gameOver || levelTransition || bot.dead) return;
      const tx = 60 + Math.random() * (canvas.width - 120);
      const ty = 60 + Math.random() * (canvas.height - 120);
      telegraphs.push({ x: tx, y: ty, radius, warnUntil: performance.now() + 600 });
      setTimeout(() => {
        if (gameOver || levelTransition) return;
        explosions.push({ x: tx, y: ty, born: performance.now(), maxR: radius });
        spawnParticles(tx, ty, '#9ef7ff');
        spawnParticles(tx, ty, '#eaffff');
        const dd = Math.hypot(player.x - tx, player.y - ty);
        if (dd < radius + player.r) {
          applyDamageToPlayer(Math.round((bot.specialDmg || 24) * 0.5));
          player.rootedUntil = Math.max(player.rootedUntil, performance.now() + 700 * (1 - getArmorStats().iceResist));
        }
      }, 600);
    }, i * 420);
  }
}

function bossGroundSpike(bot) {
  // Aardkoning special 5 - Aardpiek: een zware aardpiek schiet omhoog op je vastgelegde positie
  const tx = player.x, ty = player.y;
  const radius = 95;
  const delay = 750;
  const dmg = Math.round((bot.specialDmg || 26) * 1.1);
  telegraphs.push({ x: tx, y: ty, radius, warnUntil: performance.now() + delay });
  setTimeout(() => {
    if (gameOver || levelTransition) return;
    explosions.push({ x: tx, y: ty, born: performance.now(), maxR: radius });
    spawnParticles(tx, ty, '#8a6a3a');
    spawnParticles(tx, ty, '#5c3a1e');
    const dd = Math.hypot(player.x - tx, player.y - ty);
    if (dd < radius + player.r) {
      applyDamageToPlayer(dmg);
      const ang = dd > 0 ? Math.atan2(player.y - ty, player.x - tx) : Math.random() * Math.PI * 2;
      player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x + Math.cos(ang) * 100));
      player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y + Math.sin(ang) * 100));
    }
  }, delay);
}

function bossChasingCrack(bot) {
  // Aardkoning special 6 - Achtervolgende scheur: een scheur in de grond die je een tijd lang blijft opjagen, iets langzamer dan je basissnelheid
  chasingCracks.push({
    x: bot.x, y: bot.y,
    speed: 2.6,
    born: performance.now(),
    duration: 4000,
    dmg: Math.round((bot.specialDmg || 26) * 0.5),
    lastHit: 0
  });
  spawnParticles(bot.x, bot.y, '#5c3a1e');
}

function bossLightningCluster(bot) {
  // Stormvorst special 5 - Blikseminslag-cluster: 4 bliksems in een kruispatroon rond je vastgelegde positie, kort na elkaar
  const cx = player.x, cy = player.y;
  const offsets = [[0, -70], [70, 0], [0, 70], [-70, 0]];
  const radius = 45;
  const dmg = Math.round((bot.specialDmg || 28) * 0.55);
  offsets.forEach((off, i) => {
    const tx = cx + off[0], ty = cy + off[1];
    const delay = 500 + i * 220;
    telegraphs.push({ x: tx, y: ty, radius, warnUntil: performance.now() + delay });
    setTimeout(() => {
      if (gameOver || levelTransition || bot.dead) return;
      lightningBolts.push({ x1: tx + (Math.random() - 0.5) * 40, y1: -40, x2: tx, y2: ty, born: performance.now() });
      spawnParticles(tx, ty, '#fff066');
      spawnParticles(tx, ty, '#8ecbff');
      const dd = Math.hypot(player.x - tx, player.y - ty);
      if (dd < radius + player.r) applyDamageToPlayer(dmg);
    }, delay);
  });
}

function bossEmpJam(bot) {
  // Stormvorst special 6 - Stroomstoot: een EMP-golf die je wapen 2 sec uitschakelt als je erin staat wanneer hij afgaat
  const tx = player.x, ty = player.y;
  const radius = 90;
  const delay = 700;
  telegraphs.push({ x: tx, y: ty, radius, warnUntil: performance.now() + delay });
  setTimeout(() => {
    if (gameOver || levelTransition) return;
    shockRings.push({ x: tx, y: ty, born: performance.now(), maxR: radius, duration: 400, color: '#c9a3ff' });
    spawnParticles(tx, ty, '#c9a3ff');
    spawnParticles(tx, ty, '#8ecbff');
    const dd = Math.hypot(player.x - tx, player.y - ty);
    if (dd < radius + player.r) {
      player.jammedUntil = performance.now() + 2000;
      staticShockUntil = performance.now() + 250;
    }
  }, delay);
}

function botShoot(bot) {
  // Stun: bots kunnen niet schieten als stunned
  const now = performance.now();
  if (now < (bot.stunUntil || 0)) return;

  // Field Engineer: als er een koepel dichterbij staat dan de speler, richten bots daarop
  let target = player;
  if (now < player.confuseUntil) {
    // Verwarring: bots richten zich op elkaar in plaats van op de speler
    const others = bots.filter(b => b !== bot && !b.dead);
    if (others.length > 0) {
      target = others.reduce((a, b) =>
        Math.hypot(b.x - bot.x, b.y - bot.y) < Math.hypot(a.x - bot.x, a.y - bot.y) ? b : a);
    }
  } else {
    let nearestTurretDist = Math.hypot(player.x - bot.x, player.y - bot.y);
    deployedTurrets.forEach(turret => {
      const dd = Math.hypot(turret.x - bot.x, turret.y - bot.y);
      if (dd < nearestTurretDist) { target = turret; nearestTurretDist = dd; }
    });
  }

  const dx = target.x - bot.x;
  const dy = target.y - bot.y;
  const baseAngle = Math.atan2(dy, dx);

  if (bot.pattern === 'single') {
    fireBotBullet(bot, baseAngle);
  } else if (bot.pattern === 'fast') {
    // sniper: single fast precise shot
    fireBotBullet(bot, baseAngle, 1.4);
  } else if (bot.pattern === 'triple') {
    // 3-way spread
    const spread = 0.22;
    fireBotBullet(bot, baseAngle - spread);
    fireBotBullet(bot, baseAngle);
    fireBotBullet(bot, baseAngle + spread);
  } else if (bot.pattern === 'burst') {
    // tank: quick burst of 3 shots in a row
    let count = 0;
    const burstInterval = setInterval(() => {
      if (bot.dead || gameOver) { clearInterval(burstInterval); return; }
      const dx2 = target.x - bot.x, dy2 = target.y - bot.y;
      fireBotBullet(bot, Math.atan2(dy2, dx2));
      count++;
      if (count >= 3) clearInterval(burstInterval);
    }, 120);
  } else if (bot.pattern === 'circle') {
    // spinner: kogels in alle richtingen tegelijk
    const n = 8;
    for (let i = 0; i < n; i++) {
      fireBotBullet(bot, (Math.PI * 2 / n) * i);
    }
  } else if (bot.pattern === 'double') {
    // chaser: twee snelle schoten vlak na elkaar
    fireBotBullet(bot, baseAngle);
    setTimeout(() => {
      if (bot.dead || gameOver) return;
      const dx2 = target.x - bot.x, dy2 = target.y - bot.y;
      fireBotBullet(bot, Math.atan2(dy2, dx2));
    }, 150);
  } else if (bot.pattern === 'wide') {
    // shielder: brede waaier van 5 kogels
    const spread = 0.16;
    for (let i = -2; i <= 2; i++) {
      fireBotBullet(bot, baseAngle + spread * i);
    }
  } else if (bot.pattern === 'turret') {
    // turret: staat stil, vuurt snel en precies
    fireBotBullet(bot, baseAngle, 1.3);
  } else if (bot.pattern === 'megaburst') {
    // overlord: 3 golven van 8 kogels in alle richtingen, achter elkaar
    const n = 8;
    let wave = 0;
    const doWave = () => {
      if (bot.dead || gameOver) return;
      for (let i = 0; i < n; i++) {
        fireBotBullet(bot, (Math.PI * 2 / n) * i + wave * 0.2);
      }
      wave++;
      if (wave < 3) setTimeout(doWave, 220);
    };
    doWave();
  } else if (bot.pattern === 'spiral') {
    // vortex: continue roterende spiraal van kogels
    bot.spiralAngle = (bot.spiralAngle || 0) + 0.5;
    fireBotBullet(bot, bot.spiralAngle);
  } else if (bot.pattern === 'boss') {
    // colossus: breed salvo van 16 kogels in alle richtingen
    const n = 16;
    for (let i = 0; i < n; i++) {
      fireBotBullet(bot, (Math.PI * 2 / n) * i);
    }
  } else if (bot.pattern === 'teleport') {
    // ghost/zandworm: één gericht schot direct na het teleporteren
    fireBotBullet(bot, baseAngle);
  }
}

function spawnParticles(x, y, color) {
  if (particles.length > 350) return; // veiligheidslimiet: voorkomt vertraging door een opeenstapeling van deeltjes
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 30,
      color
    });
  }
}

function spawnPowerup() {
  const margin = 60;
  const types = currentWorld === 2
    ? WORLD2_POWERUP_IDS
    : ['speed', 'heal', 'fire', 'shield', 'damage', 'multishot', 'freeze', 'nuke', 'invisible', 'timewarp', 'ricochet', 'homing', 'stun', 'aura', 'overload', 'chaos', 'elementstorm'];
  const type = types[Math.floor(Math.random() * types.length)];
  powerups.push({
    x: margin + Math.random() * (canvas.width - margin * 2),
    y: margin + Math.random() * (canvas.height - margin * 2),
    r: 14,
    type,
    bornAt: performance.now(),
    life: 9000 // verdwijnt na 9s als niet opgeraapt
  });
}

function rootGrabAttack(count) {
  // Wortelgreep (Wereld 2): bomen schieten uit de grond, wikkelen hun takken om willekeurige bots en trekken ze de grond in
  const pool = bots.filter(b => !b.dead);
  const picks = [];
  for (let i = 0; i < count && pool.length; i++) {
    picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  picks.forEach(bot => {
    const tx = bot.x, ty = bot.y;
    const duration = 1600;
    const riseDur = duration * 0.35;   // boom breekt uit de grond
    const wrapDur = duration * 0.25;   // takken slaan om de bot heen
    const now0 = performance.now();
    bot.rootedUntil = now0 + duration; // muurvast tot hij de grond in wordt gesleurd (geen ijs-tint zoals freeze)
    treeGrabs.push({ x: tx, y: ty, born: now0, duration, riseDur, wrapDur });
    telegraphs.push({ x: tx, y: ty, radius: 26, warnUntil: now0 + riseDur });
    spawnParticles(tx, ty, '#5c3a1e');
    spawnParticles(tx, ty, '#3fa34d');
    setTimeout(() => {
      if (gameOver || levelTransition) return;
      spawnParticles(tx, ty, '#c9a96a');
      spawnParticles(tx, ty, '#baff5c');
    }, riseDur + wrapDur * 0.3);
    setTimeout(() => {
      if (gameOver || levelTransition || bot.dead) return;
      spawnParticles(tx, ty, '#5c3a1e');
      spawnParticles(tx, ty, '#3fa34d');
      spawnParticles(tx, ty, '#2f7d3c');
      bot.dead = true;
      score += bot.maxHp >= 10 ? 40 : bot.maxHp >= 6 ? 25 : bot.maxHp >= 3 ? 15 : 10;
      if (gameMode === 'levels') levelKills++;
    }, riseDur + wrapDur);
  });
}

function rootDragNearest(x, y, maxRange) {
  // Wortelgeweer (Wereld 2): bij een kill sleurt een boomwortel de dichtstbijzijnde bot (geen boss) de grond in
  const candidates = bots.filter(b => !b.dead && !b.isBoss);
  let nearest = null, nearestDist = maxRange;
  candidates.forEach(b => {
    const dd = Math.hypot(b.x - x, b.y - y);
    if (dd < nearestDist) { nearest = b; nearestDist = dd; }
  });
  if (!nearest) return;
  const bot = nearest;
  const tx = bot.x, ty = bot.y;
  const duration = 1400;
  const riseDur = duration * 0.35;
  const wrapDur = duration * 0.25;
  const now0 = performance.now();
  bot.rootedUntil = now0 + duration;
  rootDrags.push({ x: tx, y: ty, born: now0, duration, riseDur, wrapDur });
  telegraphs.push({ x: tx, y: ty, radius: 26, warnUntil: now0 + riseDur });
  spawnParticles(tx, ty, '#5c3a1e');
  spawnParticles(tx, ty, '#3fa34d');
  setTimeout(() => {
    if (gameOver || levelTransition || bot.dead) return;
    spawnParticles(tx, ty, '#5c3a1e');
    spawnParticles(tx, ty, '#3fa34d');
    spawnParticles(tx, ty, '#2f7d3c');
    bot.dead = true;
    score += bot.maxHp >= 10 ? 40 : bot.maxHp >= 6 ? 25 : bot.maxHp >= 3 ? 15 : 10;
    if (gameMode === 'levels') levelKills++;
  }, riseDur + wrapDur);
}

function dropLavaTrail(bot) {
  // Vulkaanheer (Wereld 2): laat continu een spoor van kleine lavaplasjes achter zich terwijl hij loopt
  const born = performance.now();
  const radius = 24;
  lavaPools.push({ x: bot.x, y: bot.y, born, fallDelay: 0, lingerDuration: 2000, fadeDuration: 500, totalLife: 2500, radius, lastIgniteTick: 0 });
}

function lavaRainAttack(bot) {
  // Vulkaanheer (Wereld 2, special): laat 3 lavaklodders na elkaar rond de speler neerkomen
  const count = 3;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      if (gameOver || levelTransition || bot.dead) return;
      const ang = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 90;
      const tx = Math.max(40, Math.min(canvas.width - 40, player.x + Math.cos(ang) * dist));
      const ty = Math.max(40, Math.min(canvas.height - 40, player.y + Math.sin(ang) * dist));
      const radius = 50;
      const delay = 650;
      telegraphs.push({ x: tx, y: ty, radius, warnUntil: performance.now() + delay });
      const born = performance.now();
      lavaPools.push({ x: tx, y: ty, born, fallDelay: delay, lingerDuration: 3000, fadeDuration: 800, totalLife: delay + 3000 + 800, radius, lastIgniteTick: 0 });
      setTimeout(() => {
        if (gameOver || levelTransition) return;
        explosions.push({ x: tx, y: ty, born: performance.now(), maxR: radius });
        spawnParticles(tx, ty, '#ff8c00');
        spawnParticles(tx, ty, '#3a1f12');
        const dd = Math.hypot(player.x - tx, player.y - ty);
        if (dd < radius + player.r) {
          applyDamageToPlayer(bot.specialDmg || 16);
          player.burnUntil = performance.now() + 3000 * (1 - getArmorStats().fireResist);
        }
      }, delay);
    }, i * 500);
  }
}

function frostNovaAttack(bot) {
  // Vriesvorst (Wereld 2, special): een uitdijende ijsring die je bevriest zodra hij je bereikt
  const cx = bot.x, cy = bot.y;
  const maxR = 260;
  const duration = 900;
  const born = performance.now();
  shockRings.push({ x: cx, y: cy, born, maxR, duration, color: '#9ef7ff' });
  let hit = false;
  const checkInterval = setInterval(() => {
    if (gameOver || levelTransition) { clearInterval(checkInterval); return; }
    const age = performance.now() - born;
    const t = Math.min(1, age / duration);
    const r = maxR * t;
    const dd = Math.hypot(player.x - cx, player.y - cy);
    if (!hit && Math.abs(dd - r) < 24) {
      hit = true;
      applyDamageToPlayer(bot.specialDmg || 14);
      player.rootedUntil = Math.max(player.rootedUntil, performance.now() + 1000 * (1 - getArmorStats().iceResist));
      spawnParticles(player.x, player.y, '#9ef7ff');
      spawnParticles(player.x, player.y, '#ffffff');
    }
    if (t >= 1) clearInterval(checkInterval);
  }, 40);
}

function stormChainBolt(bot) {
  // Stormwever (Wereld 2, special): een felle bliksemschicht rechtstreeks naar de speler
  lightningBolts.push({ x1: bot.x, y1: bot.y, x2: player.x, y2: player.y, born: performance.now() });
  spawnParticles(player.x, player.y, '#fff066');
  spawnParticles(player.x, player.y, '#8ecbff');
  const dd = Math.hypot(player.x - bot.x, player.y - bot.y);
  if (dd < 500) {
    applyDamageToPlayer(bot.specialDmg || 12);
    staticShockUntil = performance.now() + 180;
  }
}

function bossLightningStrike(bot) {
  // Stormvorst special 2: net als stormChainBolt, maar met een getelegrafeerde inslagcirkel op je huidige positie —
  // zo kun je de bliksemschicht ontwijken door weg te lopen voordat hij inslaat
  const tx = player.x, ty = player.y;
  const radius = 55;
  const delay = 650;
  telegraphs.push({ x: tx, y: ty, radius, warnUntil: performance.now() + delay });
  setTimeout(() => {
    if (gameOver || levelTransition || bot.dead) return;
    lightningBolts.push({ x1: bot.x, y1: bot.y, x2: tx, y2: ty, born: performance.now() });
    spawnParticles(tx, ty, '#fff066');
    spawnParticles(tx, ty, '#8ecbff');
    const dd = Math.hypot(player.x - tx, player.y - ty);
    if (dd < radius + player.r) {
      applyDamageToPlayer(bot.specialDmg || 28);
      staticShockUntil = performance.now() + 180;
    }
  }, delay);
}

function rootSnareAttack(bot) {
  // Wortelheer (Wereld 2, special): laat een boom uit de grond komen die de speler vastgrijpt
  const tx = player.x, ty = player.y;
  const duration = 1400;
  const riseDur = duration * 0.35;
  const wrapDur = duration * 0.25;
  const born = performance.now();
  treeGrabs.push({ x: tx, y: ty, born, duration, riseDur, wrapDur });
  telegraphs.push({ x: tx, y: ty, radius: 30, warnUntil: born + riseDur });
  setTimeout(() => {
    if (gameOver || levelTransition) return;
    const dd = Math.hypot(player.x - tx, player.y - ty);
    if (dd < 40) {
      applyDamageToPlayer(bot.specialDmg || 14);
      player.rootedUntil = Math.max(player.rootedUntil, performance.now() + 1200);
      spawnParticles(player.x, player.y, '#5c3a1e');
      spawnParticles(player.x, player.y, '#3fa34d');
    }
  }, riseDur + wrapDur);
}

function bossRootSnare(bot) {
  // Aardkoning special 2: net als rootSnareAttack, maar de boom is fors groter en doet meer schade
  const tx = player.x, ty = player.y;
  const duration = 1500;
  const riseDur = duration * 0.35;
  const wrapDur = duration * 0.25;
  const born = performance.now();
  const scale = 1.7;
  const grabRadius = 62;
  treeGrabs.push({ x: tx, y: ty, born, duration, riseDur, wrapDur, scale });
  telegraphs.push({ x: tx, y: ty, radius: 46, warnUntil: born + riseDur });
  setTimeout(() => {
    if (gameOver || levelTransition) return;
    const dd = Math.hypot(player.x - tx, player.y - ty);
    if (dd < grabRadius) {
      applyDamageToPlayer(Math.round((bot.specialDmg || 26) * 0.7));
      player.rootedUntil = Math.max(player.rootedUntil, performance.now() + 1300);
      spawnParticles(player.x, player.y, '#5c3a1e');
      spawnParticles(player.x, player.y, '#3fa34d');
    }
  }, riseDur + wrapDur);
}

function triggerCenterLightningStrike(dmg) {
  // Inslag-powerup: een enorme blikseminslag treft het midden van het speelveld
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const radius = 150;
  const delay = 500;
  telegraphs.push({ x: cx, y: cy, radius, warnUntil: performance.now() + delay });
  setTimeout(() => {
    if (gameOver || levelTransition) return;
    lightningBolts.push({ x1: cx + (Math.random() - 0.5) * 40, y1: -40, x2: cx, y2: cy, born: performance.now() });
    explosions.push({ x: cx, y: cy, born: performance.now(), maxR: radius });
    spawnParticles(cx, cy, '#fff066');
    spawnParticles(cx, cy, '#9be8ff');
    bots.forEach(bot => {
      if (bot.dead) return;
      const dd = Math.hypot(bot.x - cx, bot.y - cy);
      if (dd < radius + bot.r) damageBotSimple(bot, dmg, '#fff066');
    });
  }, delay);
}

function triggerTopHpLightningBarrage(dmg) {
  // Bliksemschichten-powerup: 4 bliksemschichten treffen de 3 bots met de meeste HP
  const targets = bots.filter(b => !b.dead).sort((a, c) => c.hp - a.hp).slice(0, 3);
  if (targets.length === 0) return;
  for (let i = 0; i < 4; i++) {
    setTimeout(() => {
      if (gameOver || levelTransition) return;
      const target = targets[i % targets.length];
      if (target.dead) return;
      lightningBolts.push({ x1: target.x + (Math.random() - 0.5) * 40, y1: -40, x2: target.x, y2: target.y, born: performance.now() });
      spawnParticles(target.x, target.y, '#fff066');
      spawnParticles(target.x, target.y, '#9be8ff');
      damageBotSimple(target, dmg, '#fff066');
    }, i * 180);
  }
}

function fireNovaAttack(dmg, radius) {
  // Vuurnova (Wereld 2): felle, gelaagde vuurexplosie rond de speler die alle bots dichtbij direct beschadigt
  const now0 = performance.now();
  explosions.push({ x: player.x, y: player.y, born: now0, maxR: radius });
  shockRings.push({ x: player.x, y: player.y, born: now0, maxR: radius * 1.5, duration: 550, color: '#ffb703' });
  shockRings.push({ x: player.x, y: player.y, born: now0 + 90, maxR: radius * 1.1, duration: 400, color: '#fff275' });
  spawnParticles(player.x, player.y, '#fff275');
  spawnParticles(player.x, player.y, '#ffb703');
  spawnParticles(player.x, player.y, '#ff5a1f');
  spawnParticles(player.x, player.y, '#c8102e');
  spawnParticles(player.x, player.y, '#3a2410');
  bots.forEach(bot => {
    if (bot.dead) return;
    const d = Math.hypot(bot.x - player.x, bot.y - player.y);
    if (d < radius + bot.r) {
      damageBotSimple(bot, dmg, '#ff5a1f');
      spawnParticles(bot.x, bot.y, '#ffb703');
    }
  });
}

function spawnCoinPickup() {
  const margin = 60;
  coinPickups.push({
    x: margin + Math.random() * (canvas.width - margin * 2),
    y: margin + Math.random() * (canvas.height - margin * 2),
    r: 11,
    value: 5 + Math.floor(Math.random() * 11), // 5-15 munten
    bornAt: performance.now(),
    life: 8000
  });
}

