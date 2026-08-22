function shoot() {
  if (gameOver || isPaused) return;
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
  const now = performance.now();
  const weapon = getWeapon();
  const fireRateMult = now < player.fireBoostUntil ? 0.4 : 1;
  const reloadMult = 1 - lvlFastReload * FAST_RELOAD_PER_LEVEL;
  const activeCooldown = shootCooldown * weapon.cooldownMult * fireRateMult * reloadMult;
  if (now - lastShot < activeCooldown) return;
  lastShot = now;
  const dx = mouse.x - player.x;
  const dy = mouse.y - player.y;
  const baseAngle = Math.atan2(dy, dx);
  const streakMult = (weapon.effect === 'killstreak') ? 1 + Math.min(player.killStreak, 10) * 0.15 : 1;
  const dmg = weapon.dmg * (now < player.damageBoostUntil ? 2 : 1) * streakMult;
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
    bullets.push({
      x: player.x + Math.cos(angle) * (player.r + 5),
      y: player.y + Math.sin(angle) * (player.r + 5),
      vx: Math.cos(angle) * 9 * speedMult,
      vy: Math.sin(angle) * 9 * speedMult,
      r: 4,
      owner: 'player',
      dmg,
      pierce: (weapon.pierce || 0) + extraPierce,
      hitBots: ((weapon.pierce || 0) + extraPierce) ? [] : null,
      splashRadius: weapon.splashRadius || 0,
      splashDmg: weapon.splashDmg || 0,
      effect: weapon.effect || null
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

function fireBotBullet(bot, angle, speedMult = 1) {
  const hcMult = gameMode === 'hardcore' ? HARDCORE_MULT : 1;
  bullets.push({
    x: bot.x + Math.cos(angle) * (bot.r + 5),
    y: bot.y + Math.sin(angle) * (bot.r + 5),
    vx: Math.cos(angle) * bot.bulletSpeed * speedMult,
    vy: Math.sin(angle) * bot.bulletSpeed * speedMult,
    r: bot.pattern === 'fast' ? 3 : 4,
    dmg: (bot.pattern === 'fast' ? 15 : 8) * hcMult,
    owner: 'bot'
  });
}

function applyDamageToPlayer(amount) {
  if (performance.now() < player.shieldUntil) return false;
  const totalReduction = 1 - (1 - getArmorStats().reduction) * (1 - (lvlIronSkin > 0 ? IRON_SKIN_REDUCTIONS[lvlIronSkin - 1] : 0));
  player.hp -= amount * (1 - totalReduction);
  return true;
}

// Gedeelde helper: schade toebrengen aan een bot + score/kill-boekhouding, gebruikt door
// effecten die buiten de normale kogel-botsing om schade doen (gif, zwart gat, enz.)
function damageBotSimple(bot, dmg, color) {
  if (bot.dead) return;
  bot.hp -= dmg;
  spawnParticles(bot.x, bot.y, color || bot.color);
  if (bot.hp <= 0 && !bot.immortal) {
    bot.dead = true;
    score += bot.isBoss ? 500 : (bot.maxHp >= 10 ? 40 : bot.maxHp >= 6 ? 25 : bot.maxHp >= 3 ? 15 : 10);
    if (gameMode === 'levels') levelKills++;
    if (getArmorStats().vampireHeal) player.hp = Math.min(player.maxHp, player.hp + getArmorStats().vampireHeal);
    if (bot.isBoss) bossAlive = false;
    if (bot.poisonSpread) spreadPoison(bot);
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
  const notBlocked = applyDamageToPlayer(bot.meleeDamage || 15);
  spawnParticles(player.x, player.y, notBlocked ? '#ff5c5c' : '#c77dff');
  bot.slashUntil = performance.now() + 200;

  const thorns = getArmorStats().thorns;
  if (thorns && notBlocked && !bot.dead) {
    bot.hp -= thorns;
    spawnParticles(bot.x, bot.y, '#ffbb33');
    if (bot.hp <= 0 && !bot.immortal) {
      bot.dead = true;
      score += bot.maxHp >= 10 ? 40 : bot.maxHp >= 6 ? 25 : bot.maxHp >= 3 ? 15 : 10;
      if (gameMode === 'levels') levelKills++;
      if (getArmorStats().vampireHeal) player.hp = Math.min(player.maxHp, player.hp + getArmorStats().vampireHeal);
    }
  }
}

function mortarStrike(bot) {
  // artillery: telegrafeert een inslagpunt, en beschadigt de speler pas na een korte waarschuwing
  const targetX = player.x;
  const targetY = player.y;
  const radius = 55;
  const delay = 700;
  telegraphs.push({ x: targetX, y: targetY, radius, warnUntil: performance.now() + delay });
  setTimeout(() => {
    if (gameOver || levelTransition) return;
    explosions.push({ x: targetX, y: targetY, born: performance.now(), maxR: radius });
    spawnParticles(targetX, targetY, '#ff3838');
    const dd = Math.hypot(player.x - targetX, player.y - targetY);
    if (dd < radius + player.r) {
      applyDamageToPlayer(bot.meleeDamage || 40);
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

function botShoot(bot) {
  // Field Engineer: als er een koepel dichterbij staat dan de speler, richten bots daarop
  let target = player;
  let nearestTurretDist = Math.hypot(player.x - bot.x, player.y - bot.y);
  deployedTurrets.forEach(turret => {
    const dd = Math.hypot(turret.x - bot.x, turret.y - bot.y);
    if (dd < nearestTurretDist) { target = turret; nearestTurretDist = dd; }
  });

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
  }
}

function spawnParticles(x, y, color) {
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
  const types = ['speed', 'heal', 'fire', 'shield', 'damage', 'multishot', 'freeze', 'nuke', 'invisible', 'timewarp'];
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

