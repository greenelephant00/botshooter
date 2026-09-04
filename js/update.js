// Stun-powerup: elke bot die op het punt staat te vuren/aan te vallen terwijl de speler gestund heeft,
// wordt zelf 1,5 sec verlamd in plaats van de aanval uit te voeren. Alle aanval-patronen hieronder
// moeten hun daadwerkelijke aanval-aanroep hierdoorheen laten lopen, niet alleen de paar patronen die
// dat oorspronkelijk deden — anders werkt Stun alleen tegen een klein deel van de bots.
function tryBotAttack(bot, now, attackFn) {
  if (now < player.stunUntil) {
    bot.stunUntil = Math.max(bot.stunUntil || 0, now + 1500);
  } else {
    attackFn();
  }
}

function update() {
  // Stop/Pauze-knoppen linksboven horen alleen tijdens een lopend potje te staan (ook tijdens pauze zelf),
  // niet in de menu's/shops — dus los van de 'gameplay-active'-check hieronder (die pauze juist uitsluit).
  document.body.classList.toggle('match-active', loopRunning && !gameOver);
  if (typeof coopMatchActive !== 'undefined' && coopMatchActive) return; // Co-op draait zijn eigen, aparte simulatie
  if (gameOver || levelTransition || isPaused) {
    document.body.classList.remove('gameplay-active');
    return;
  }
  document.body.classList.add('gameplay-active');

  // Player movement
  const now0 = performance.now();

  if (gameMode === 'sprint' && now0 >= sprintEndTime) {
    endGame(true);
    return;
  }
  player.speed = now0 < player.boostUntil ? player.baseSpeed * 1.8 : player.baseSpeed;
  if (now0 < player.slowUntil) player.speed *= 0.5;
  if (now0 < sandstormUntil) player.speed *= 0.7;
  if (now0 < tsunamiUntil) player.speed *= 0.8;

  // Passieve armor-effecten
  const armorNow = getArmorStats();
  if (armorNow.regen) {
    player.hp = Math.min(player.maxHp, player.hp + armorNow.regen / 60);
  }
  if (armorNow.adrenaline && !player.adrenalineUsed && player.hp > 0 && player.hp / player.maxHp < 0.25) {
    player.adrenalineUsed = true;
    player.shieldUntil = now0 + 3000;
    player.boostUntil = now0 + 3000;
    spawnParticles(player.x, player.y, '#ffe066');
  }

  let dx = 0, dy = 0;
  if (now0 >= player.rootedUntil && now0 >= player.mireUntil) {
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;
    dx += joystickDX;
    dy += joystickDY;
  }
  const len = Math.hypot(dx, dy) || 1;
  const desiredVX = (dx / len) * player.speed;
  const desiredVY = (dy / len) * player.speed;
  const onIce = now0 < iceFloorUntil;
  if (onIce) {
    // IJsvloer: traag reagerende, glijdende beweging i.p.v. direct bijsturen
    player.slideVX = player.slideVX * 0.94 + desiredVX * 0.06;
    player.slideVY = player.slideVY * 0.94 + desiredVY * 0.06;
  } else {
    player.slideVX = desiredVX;
    player.slideVY = desiredVY;
  }
  player.x += player.slideVX;
  player.y += player.slideVY;
  player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
  player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));

  // Vuurtitaan-vuurring: een vurige kooi rond de speler — je kunt er niet uit, en tegen de vlammen aan duwen zet je in brand
  if (now0 < player.fireCageUntil) {
    const cageDist = Math.hypot(player.x - player.fireCageX, player.y - player.fireCageY);
    if (cageDist > player.fireCageRadius) {
      const cageAng = Math.atan2(player.y - player.fireCageY, player.x - player.fireCageX);
      player.x = player.fireCageX + Math.cos(cageAng) * player.fireCageRadius;
      player.y = player.fireCageY + Math.sin(cageAng) * player.fireCageRadius;
      player.burnUntil = now0 + 5000 * (1 - getArmorStats().fireResist);
    }
  }

  if (activeControlScheme === 'touch') {
    // Sleep-om-te-richten geeft een richting aan (net als de bewegingsknop), geen exacte schermlocatie —
    // dus elke frame opnieuw een virtueel mikpunt ver weg in die richting, relatief aan de huidige spelerpositie.
    mouse.x = player.x + aimDX * AIM_DISTANCE;
    mouse.y = player.y + aimDY * AIM_DISTANCE;
  }
  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  if (keys[' '] || keys['mouse']) shoot();

  // Bots move toward player + shoot occasionally
  const now = performance.now();
  bots.forEach(bot => {
    if (now < bot.frozenUntil || now < bot.rootedUntil) return; // bevroren of vastgeworteld, geen actie
    if (bot.tornadoCaptured) return; // meegesleurd door een Tornado-schot, geen eigen actie
    // Elementale Wereld 2-bots: periodiek een sprankje van hun element
    const ambientColors = WORLD2_AMBIENT_FX[bot.type];
    if (ambientColors && (!bot.lastAmbientFx || now - bot.lastAmbientFx > 700)) {
      bot.lastAmbientFx = now;
      spawnParticles(bot.x, bot.y, ambientColors[Math.floor(Math.random() * ambientColors.length)]);
    }
    if (bot.igniteUntil && now < bot.igniteUntil) {
      // Vlammenwerper: apart van gif, brandwond-schade-over-tijd
      if (!bot.lastIgniteTick || now - bot.lastIgniteTick > 400) {
        bot.lastIgniteTick = now;
        damageBotSimple(bot, 2, '#ff8c42');
        if (bot.dead) return;
      }
    }
    if (bot.poisonUntil && now < bot.poisonUntil) {
      if (!bot.lastPoisonTick || now - bot.lastPoisonTick > 400) {
        bot.lastPoisonTick = now;
        damageBotSimple(bot, 1, '#7ed957');
        if (bot.dead) return;
      }
    }
    // Splitter-kinderen groeien na 8 sec weer terug tot een volwaardige Splitter
    if (bot.isSplitChild && bot.type === 'splitter' && bot.bornAt && now - bot.bornAt > 8000) {
      const base = BOT_TYPES.find(t => t.name === 'splitter');
      if (base) {
        const hcMult = gameMode === 'hardcore' ? HARDCORE_MULT : 1;
        bot.r = base.r;
        bot.maxHp = base.hp * hcMult;
        bot.hp = bot.maxHp;
        bot.speed = base.speed[0] + Math.random() * (base.speed[1] - base.speed[0]);
        bot.splitsSelf = base.splitsSelf;
        bot.isSplitChild = false;
        spawnParticles(bot.x, bot.y, bot.color);
      }
    }

    if (now < player.invisibleUntil) return; // bots merken de speler niet op
    let bdx = player.x - bot.x;
    let bdy = player.y - bot.y;
    if (now < player.confuseUntil) {
      // Verwarring: bots bewegen naar en jagen op elkaar in plaats van op de speler
      const confuseOthers = bots.filter(b => b !== bot && !b.dead);
      if (confuseOthers.length > 0) {
        const nearestOther = confuseOthers.reduce((a, b) =>
          Math.hypot(b.x - bot.x, b.y - bot.y) < Math.hypot(a.x - bot.x, a.y - bot.y) ? b : a);
        bdx = nearestOther.x - bot.x;
        bdy = nearestOther.y - bot.y;
      }
    }
    const bdist = Math.hypot(bdx, bdy) || 1;
    const timewarped = now < player.timewarpUntil;
    const speedMult = timewarped ? 0.4 : 1;
    const cooldownMult = timewarped ? 2.2 : 1;

    if (bot.pattern === 'teleport') {
      // ghost: teleporteert vlak bij de speler en schiet meteen
      if (now - bot.lastShot > bot.shootCooldown * cooldownMult && bdist < 700) {
        bot.lastShot = now;
        const ang = Math.random() * Math.PI * 2;
        const dist = 150 + Math.random() * 100;
        bot.x = Math.max(bot.r, Math.min(canvas.width - bot.r, player.x + Math.cos(ang) * dist));
        bot.y = Math.max(bot.r, Math.min(canvas.height - bot.r, player.y + Math.sin(ang) * dist));
        spawnParticles(bot.x, bot.y, bot.color);
        tryBotAttack(bot, now, () => botShoot(bot));
      }
      return;
    }

    if (bot.pattern === 'suicide') {
      // bomber: rent op de speler af en ontploft van dichtbij
      const standoffS = bot.r + player.r - 4;
      if (bdist > standoffS) {
        bot.x += (bdx/bdist) * bot.speed * speedMult;
        bot.y += (bdy/bdist) * bot.speed * speedMult;
      }
      if (bdist < bot.r + player.r + 10) {
        applyDamageToPlayer(bot.meleeDamage || 35);
        explosions.push({ x: bot.x, y: bot.y, born: performance.now(), maxR: 65 });
        spawnParticles(bot.x, bot.y, '#ff8800');
        spawnParticles(bot.x, bot.y, '#ffcc00');
        bot.dead = true;
      }
      return;
    }

    if (bot.pattern === 'mortar') {
      // artillery: houdt afstand en vuurt een zware, langzame granaat met waarschuwing vooraf
      if (bdist > 140) {
        bot.x += (bdx/bdist) * bot.speed * speedMult;
        bot.y += (bdy/bdist) * bot.speed * speedMult;
      }
      if (now - bot.lastShot > bot.shootCooldown * cooldownMult && bdist < 650) {
        bot.lastShot = now;
        tryBotAttack(bot, now, () => mortarStrike(bot));
      }
      return;
    }

    if (bot.pattern === 'mine') {
      // warden: legt elke seconde een mijn neer op de plek van de speler, die alleen na een fuse afgaat
      if (bot.mines && bot.mines.length) {
        bot.mines.forEach(mine => {
          if (!mine.exploded && now - mine.armedAt > mine.fuse) detonateMine(bot, mine);
        });
        bot.mines = bot.mines.filter(mine => !mine.exploded);
      }
      if (bdist > 160) {
        bot.x += (bdx/bdist) * bot.speed * speedMult;
        bot.y += (bdy/bdist) * bot.speed * speedMult;
      }
      if (now - bot.lastShot > bot.shootCooldown * cooldownMult && bdist < 500) {
        bot.lastShot = now;
        tryBotAttack(bot, now, () => mineDrop(bot));
      }
      return;
    }

    if (bot.pattern === 'shockbolt') {
      // arclight: blijft dichtbij en zapt de speler met een instant bliksemschicht
      if (bdist > 200) {
        bot.x += (bdx/bdist) * bot.speed * speedMult;
        bot.y += (bdy/bdist) * bot.speed * speedMult;
      }
      if (now - bot.lastShot > bot.shootCooldown * cooldownMult && bdist < 550) {
        bot.lastShot = now;
        tryBotAttack(bot, now, () => shockBolt(bot));
      }
      return;
    }

    if (bot.pattern === 'gascloud') {
      // miasma: blijft in de buurt en laat regelmatig een gifwolk achter die schade-over-tijd doet
      if (bdist > 100) {
        bot.x += (bdx/bdist) * bot.speed * speedMult;
        bot.y += (bdy/bdist) * bot.speed * speedMult;
      }
      if (now - bot.lastShot > bot.shootCooldown * cooldownMult && bdist < 500) {
        bot.lastShot = now;
        tryBotAttack(bot, now, () => gasCloudDrop(bot));
      }
      return;
    }

    if (bot.pattern === 'shieldbash') {
      // bulwark: beukt continu op de speler af en stoot bij impact weg met schade en terugstoot
      if (bdist > bot.r + player.r - 4) {
        bot.x += (bdx/bdist) * bot.speed * speedMult;
        bot.y += (bdy/bdist) * bot.speed * speedMult;
      }
      if (bdist < bot.r + player.r + 8 && now - bot.lastShot > bot.shootCooldown * cooldownMult) {
        bot.lastShot = now;
        tryBotAttack(bot, now, () => shieldBash(bot));
      }
      return;
    }

    if (bot.pattern === 'summon') {
      // broodmother: houdt afstand en roept periodiek zwakke broodlings op
      if (bdist > 220) {
        bot.x += (bdx/bdist) * bot.speed * speedMult;
        bot.y += (bdy/bdist) * bot.speed * speedMult;
      }
      if (now - bot.lastShot > bot.shootCooldown * cooldownMult && bdist < 600) {
        bot.lastShot = now;
        tryBotAttack(bot, now, () => broodSummon(bot));
      }
      return;
    }

    if (bot.pattern === 'gravitywell') {
      // gravitas: opent periodiek een zwaartekrachtveld dat de speler naar binnen trekt en dan een burst laat afgaan
      if (bot.gravityWell) {
        const well = bot.gravityWell;
        if (now < well.until) {
          const wd = Math.hypot(player.x - well.x, player.y - well.y);
          if (wd < well.radius && wd > 4) {
            player.x += ((well.x - player.x) / wd) * 5;
            player.y += ((well.y - player.y) / wd) * 5;
          }
        } else {
          explosions.push({ x: well.x, y: well.y, born: performance.now(), maxR: well.radius });
          spawnParticles(well.x, well.y, '#9b5de5');
          const wd = Math.hypot(player.x - well.x, player.y - well.y);
          if (wd < well.radius) applyDamageToPlayer(bot.specialDmg || 24);
          bot.gravityWell = null;
        }
      }
      if (bdist > 200) {
        bot.x += (bdx/bdist) * bot.speed * speedMult;
        bot.y += (bdy/bdist) * bot.speed * speedMult;
      }
      if (!bot.gravityWell && now - bot.lastShot > bot.shootCooldown * cooldownMult && bdist < 600) {
        bot.lastShot = now;
        tryBotAttack(bot, now, () => gravityWellCast(bot));
      }
      return;
    }

    if (bot.pattern === 'freezetrap') {
      // cryostasis: houdt afstand en telegrafeert een ijsval die de speler tijdelijk verlamt
      if (bdist > 180) {
        bot.x += (bdx/bdist) * bot.speed * speedMult;
        bot.y += (bdy/bdist) * bot.speed * speedMult;
      }
      if (now - bot.lastShot > bot.shootCooldown * cooldownMult && bdist < 550) {
        bot.lastShot = now;
        tryBotAttack(bot, now, () => freezeTrap(bot));
      }
      return;
    }

    if (bot.pattern === 'lavarain') {
      // vulkaanheer (Wereld 2, special): houdt afstand, laat continu een spoor van lava achter zich en laat af en toe lava rond de speler neerkomen
      if (bdist > 220) {
        bot.x += (bdx/bdist) * bot.speed * speedMult;
        bot.y += (bdy/bdist) * bot.speed * speedMult;
      }
      if (!bot.lastLavaTrail || now - bot.lastLavaTrail > 450) {
        bot.lastLavaTrail = now;
        dropLavaTrail(bot);
      }
      if (now - bot.lastShot > bot.shootCooldown * cooldownMult && bdist < 650) {
        bot.lastShot = now;
        tryBotAttack(bot, now, () => lavaRainAttack(bot));
      }
      return;
    }

    if (bot.pattern === 'frostnova') {
      // vriesvorst (Wereld 2, special): houdt gematigde afstand en laat een ijsring uitdijen
      if (bdist > 160) {
        bot.x += (bdx/bdist) * bot.speed * speedMult;
        bot.y += (bdy/bdist) * bot.speed * speedMult;
      }
      if (now - bot.lastShot > bot.shootCooldown * cooldownMult && bdist < 500) {
        bot.lastShot = now;
        tryBotAttack(bot, now, () => frostNovaAttack(bot));
      }
      return;
    }

    if (bot.pattern === 'chainbolt') {
      // stormwever (Wereld 2, special): blijft ver weg en zapt met bliksemschichten
      if (bdist > 280) {
        bot.x += (bdx/bdist) * bot.speed * speedMult;
        bot.y += (bdy/bdist) * bot.speed * speedMult;
      }
      if (now - bot.lastShot > bot.shootCooldown * cooldownMult && bdist < 550) {
        bot.lastShot = now;
        tryBotAttack(bot, now, () => stormChainBolt(bot));
      }
      return;
    }

    if (bot.pattern === 'rootsnare') {
      // wortelheer (Wereld 2, special): komt dichterbij en laat een boom je vastgrijpen
      if (bdist > 60) {
        bot.x += (bdx/bdist) * bot.speed * speedMult;
        bot.y += (bdy/bdist) * bot.speed * speedMult;
      }
      if (now - bot.lastShot > bot.shootCooldown * cooldownMult && bdist < 600) {
        bot.lastShot = now;
        tryBotAttack(bot, now, () => rootSnareAttack(bot));
      }
      return;
    }

    if (bot.pattern === 'snipebeam') {
      // railgunner: houdt veel afstand en vuurt na een lange telegraaf een verwoestende precisiestraal
      if (bdist > 350) {
        bot.x += (bdx/bdist) * bot.speed * speedMult;
        bot.y += (bdy/bdist) * bot.speed * speedMult;
      }
      if (now - bot.lastShot > bot.shootCooldown * cooldownMult && bdist < 750) {
        bot.lastShot = now;
        tryBotAttack(bot, now, () => railgunSnipe(bot));
      }
      return;
    }

    if (bot.pattern === 'curse') {
      // vexer: blijft op afstand en vervloekt de speler periodiek zodat die minder schade doet
      if (bdist > 220) {
        bot.x += (bdx/bdist) * bot.speed * speedMult;
        bot.y += (bdy/bdist) * bot.speed * speedMult;
      }
      if (now - bot.lastShot > bot.shootCooldown * cooldownMult && bdist < 600) {
        bot.lastShot = now;
        tryBotAttack(bot, now, () => curseBolt(bot));
      }
      return;
    }

    if (bot.pattern === 'clusterbomb') {
      // bombardier: houdt afstand en bestookt de speler met meerdere gelijktijdige inslagen
      if (bdist > 220) {
        bot.x += (bdx/bdist) * bot.speed * speedMult;
        bot.y += (bdy/bdist) * bot.speed * speedMult;
      }
      if (now - bot.lastShot > bot.shootCooldown * cooldownMult && bdist < 600) {
        bot.lastShot = now;
        tryBotAttack(bot, now, () => clusterBombardment(bot));
      }
      return;
    }

    if (bot.pattern === 'boss') {
      // boss: enorm, traag, schiet regelmatig een salvo en heeft 2 unieke special attacks
      const standoffB = 170;
      if (bdist > standoffB) {
        bot.x += (bdx/bdist) * bot.speed * speedMult;
        bot.y += (bdy/bdist) * bot.speed * speedMult;
      }
      if (now - bot.lastShot > bot.shootCooldown * cooldownMult && bdist < 700) {
        bot.lastShot = now;
        tryBotAttack(bot, now, () => botShoot(bot));
      }
      // Special 1 - Schokgolf: alle bosses hebben deze, geschaald via specialDmg
      if (now - (bot.specialALastUsed || 0) > (bot.specialACooldown || 7000)) {
        bot.specialALastUsed = now;
        tryBotAttack(bot, now, () => bossSlam(bot));
      }
      // Special 2 - uniek per boss-type
      if (now - (bot.specialBLastUsed || 0) > (bot.specialBCooldown || 9000)) {
        bot.specialBLastUsed = now;
        tryBotAttack(bot, now, () => {
          if (bot.type === 'colossus') bossBulletStorm(bot);
          else if (bot.type === 'titan') bossMeteorShower(bot);
          else if (bot.type === 'behemoth') bossLaserSweep(bot);
          else if (bot.type === 'nemesis') bossDoomSpiral(bot);
          else if (bot.type === 'leviathan') bossWaterStrike(bot);
          else if (bot.type === 'abomination') bossChaosBurst(bot);
          else if (bot.type === 'vuurtitaan') lavaRainAttack(bot);
          else if (bot.type === 'vriesreus') frostNovaAttack(bot);
          else if (bot.type === 'aardkoning') bossRootSnare(bot);
          else if (bot.type === 'stormvorst') bossLightningStrike(bot);
          else if (bot.type === 'oerelementaal') [lavaRainAttack, frostNovaAttack, bossRootSnare, bossLightningStrike][Math.floor(Math.random() * 4)](bot);
        });
      }
      // Special 3 - Nemesis, Leviathan, Abomination, en alle Wereld 2-bosses
      if (bot.specialCCooldown && now - (bot.specialCLastUsed || 0) > bot.specialCCooldown) {
        bot.specialCLastUsed = now;
        tryBotAttack(bot, now, () => {
          if (bot.type === 'nemesis') bossCrossLaser(bot);
          else if (bot.type === 'leviathan') bossWaterStrike(bot);
          else if (bot.type === 'abomination') bossSpawnMinions(bot);
          else if (bot.type === 'vuurtitaan') bossFireNova(bot);
          else if (bot.type === 'vriesreus') bossFrostLance(bot);
          else if (bot.type === 'aardkoning') bossEarthSlam(bot);
          else if (bot.type === 'stormvorst') bossHurricane(bot);
          else if (bot.type === 'oerelementaal') [bossFireNova, bossFrostLance, bossEarthSlam, bossHurricane][Math.floor(Math.random() * 4)](bot);
        });
      }
      // Special 4 - alleen Vuurtitaan (en de Wereldbaas): vuurring
      if (bot.specialDCooldown && now - (bot.specialDLastUsed || 0) > bot.specialDCooldown) {
        bot.specialDLastUsed = now;
        tryBotAttack(bot, now, () => {
          if (bot.type === 'vuurtitaan' || bot.type === 'oerelementaal') bossFireRing(bot);
        });
      }
      // Special 5 - unieke 2e extra aanval per Wereld 2-boss
      if (bot.specialECooldown && now - (bot.specialELastUsed || 0) > bot.specialECooldown) {
        bot.specialELastUsed = now;
        tryBotAttack(bot, now, () => {
          if (bot.type === 'vuurtitaan') bossFireLine(bot);
          else if (bot.type === 'vriesreus') bossIceFan(bot);
          else if (bot.type === 'aardkoning') bossGroundSpike(bot);
          else if (bot.type === 'stormvorst') bossLightningCluster(bot);
          else if (bot.type === 'oerelementaal') [bossFireLine, bossIceFan, bossGroundSpike, bossLightningCluster][Math.floor(Math.random() * 4)](bot);
        });
      }
      // Special 6 - unieke 3e extra aanval per Wereld 2-boss
      if (bot.specialFCooldown && now - (bot.specialFLastUsed || 0) > bot.specialFCooldown) {
        bot.specialFLastUsed = now;
        tryBotAttack(bot, now, () => {
          if (bot.type === 'vuurtitaan') bossPhoenixDive(bot);
          else if (bot.type === 'vriesreus') bossIceField(bot);
          else if (bot.type === 'aardkoning') bossChasingCrack(bot);
          else if (bot.type === 'stormvorst') bossEmpJam(bot);
          else if (bot.type === 'oerelementaal') [bossPhoenixDive, bossIceField, bossChasingCrack, bossEmpJam][Math.floor(Math.random() * 4)](bot);
        });
      }
      return;
    }

    const isMelee = bot.pattern === 'melee';
    const standoff = isMelee ? bot.r + player.r - 4 : 140;
    if (bdist > standoff) {
      bot.x += (bdx/bdist) * bot.speed * speedMult;
      bot.y += (bdy/bdist) * bot.speed * speedMult;
    }
    if (isMelee) {
      if (bdist < bot.r + player.r + 14 && now - bot.lastShot > bot.shootCooldown * cooldownMult) {
        bot.lastShot = now;
        tryBotAttack(bot, now, () => meleeAttack(bot));
      }
    } else if (now - bot.lastShot > bot.shootCooldown * cooldownMult && bdist < 600) {
      bot.lastShot = now;
      tryBotAttack(bot, now, () => botShoot(bot));
    }
  });

  // Bullets
  bullets.forEach(b => {
    if (b.homingTarget && !b.homingTarget.dead) {
      // Drone Hive: kogel buigt geleidelijk af richting zijn doelwit
      const speed = Math.hypot(b.vx, b.vy);
      const desiredAngle = Math.atan2(b.homingTarget.y - b.y, b.homingTarget.x - b.x);
      const currentAngle = Math.atan2(b.vy, b.vx);
      let diff = desiredAngle - currentAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const turn = Math.max(-SWARM_HOMING_TURN, Math.min(SWARM_HOMING_TURN, diff));
      const newAngle = currentAngle + turn;
      b.vx = Math.cos(newAngle) * speed;
      b.vy = Math.sin(newAngle) * speed;
    }
    b.x += b.vx;
    b.y += b.vy;
  });
  bullets = bullets.filter(b =>
    b.x > -20 && b.x < canvas.width + 20 &&
    b.y > -20 && b.y < canvas.height + 20 &&
    (!b.maxRange || Math.hypot(b.x - b.bornX, b.y - b.bornY) < b.maxRange)
  );

  // Bullet-bot collisions
  bullets.forEach(b => {
    if (b.owner !== 'player') return;
    bots.forEach(bot => {
      if (b.hit) return; // deze kogel heeft z'n treffer(s) al verbruikt (geen doorboring meer over) — niet nóg een bot in dezelfde tick raken
      if (bot.dead) return;
      if (bot.invulnUntil && performance.now() < bot.invulnUntil) return; // tijdelijk onsterfelijk (bv. net gespawnde Splitter-kinderen)
      if (b.hitBots && b.hitBots.includes(bot)) return; // al geraakt door deze doorborende kogel
      const d = Math.hypot(b.x - bot.x, b.y - bot.y);
      if (d < bot.r + b.r) {
        bot.hp -= (b.dmg || 1);
        spawnParticles(b.x, b.y, bot.color);

        // Toxic Cannon: vergiftigt de bot in plaats van (alleen) directe schade
        if (b.effect === 'poison') {
          bot.poisonUntil = Math.max(bot.poisonUntil || 0, performance.now() + 3000);
          bot.poisonSpread = true;
        }

        // Vlammenwerper: zet de bot in brand voor schade-over-tijd
        if (b.effect === 'igniteHit') {
          bot.igniteUntil = Math.max(bot.igniteUntil || 0, performance.now() + 2500);
        }

        // Aardstamper: stampt de bot een flink stuk naar achteren
        if (b.effect === 'knockbackHit') {
          const kAng = Math.atan2(bot.y - player.y, bot.x - player.x);
          bot.x = Math.max(bot.r, Math.min(canvas.width - bot.r, bot.x + Math.cos(kAng) * 45));
          bot.y = Math.max(bot.r, Math.min(canvas.height - bot.r, bot.y + Math.sin(kAng) * 45));
          spawnParticles(bot.x, bot.y, '#8a6a3a');
        }

        // Kristalgeweer: spat uiteen in ijsscherven die bots dichtbij ook raken en even bevriezen
        if (b.effect === 'shatterHit') {
          bots.forEach(other => {
            if (other === bot || other.dead) return;
            if (other.invulnUntil && performance.now() < other.invulnUntil) return; // net gesplitste bot, nog onsterfelijk
            const dd = Math.hypot(bot.x - other.x, bot.y - other.y);
            if (dd < 70) {
              damageBotSimple(other, Math.max(1, Math.round((b.dmg || 1) * 0.5)), '#9ef7ff');
              other.frozenUntil = Math.max(other.frozenUntil || 0, performance.now() + 400);
            }
          });
          spawnParticles(bot.x, bot.y, '#9ef7ff');
        }

        // Windgeweer: blaast de geraakte bot en iedereen dichtbij een flink stuk weg
        if (b.effect === 'gustPush') {
          const gustAng = Math.atan2(b.vy, b.vx);
          bots.forEach(other => {
            if (other.dead) return;
            const dd = Math.hypot(bot.x - other.x, bot.y - other.y);
            if (other === bot || dd < 90) {
              other.x = Math.max(other.r, Math.min(canvas.width - other.r, other.x + Math.cos(gustAng) * 55));
              other.y = Math.max(other.r, Math.min(canvas.height - other.r, other.y + Math.sin(gustAng) * 55));
            }
          });
          spawnParticles(bot.x, bot.y, '#eaffff');
        }

        // Executioner Rifle: maakt verzwakte bots altijd direct af
        if (b.effect === 'execute' && !bot.immortal && bot.hp > 0 && bot.hp / bot.maxHp < 0.25) {
          bot.hp = 0;
          spawnParticles(bot.x, bot.y, '#fff');
          spawnParticles(bot.x, bot.y, '#ff3838');
        }

        // Kleefbom Werper: kogel blijft kleven en ontploft na een korte vertraging
        if (b.effect === 'stickyBomb' && !b.stuckTriggered) {
          b.stuckTriggered = true;
          const bx = bot.x, by = bot.y;
          telegraphs.push({ x: bx, y: by, radius: 90, warnUntil: performance.now() + 800 });
          pausableTimeout(() => {
            if (gameOver || levelTransition) return;
            explosions.push({ x: bx, y: by, born: performance.now(), maxR: 90 });
            spawnParticles(bx, by, '#ff8800');
            spawnParticles(bx, by, '#ffcc00');
            bots.forEach(other => {
              const dd = Math.hypot(bx - other.x, by - other.y);
              if (dd < 90) damageBotSimple(other, 5, '#ff8800');
            });
          }, 800);
        }

        // Volt Caster: kogel slaat over naar een nabije bot. Kernschok geeft elke kogel in Wereld 2 een kans op hetzelfde effect.
        if (b.effect === 'chainLightning' || (currentWorld === 2 && hasCoreShock && Math.random() < CORE_SHOCK_CHANCE)) {
          let nearest = null, nearestDist = 140;
          bots.forEach(other => {
            if (other === bot || other.dead) return;
            const dd = Math.hypot(bot.x - other.x, bot.y - other.y);
            if (dd < nearestDist) { nearest = other; nearestDist = dd; }
          });
          if (nearest && !(nearest.invulnUntil && performance.now() < nearest.invulnUntil)) {
            const chainDmg = Math.max(1, Math.round((b.dmg || 1) * 0.6));
            nearest.hp -= chainDmg;
            lightningBolts.push({ x1: bot.x, y1: bot.y, x2: nearest.x, y2: nearest.y, born: performance.now() });
            spawnParticles(nearest.x, nearest.y, '#7df9ff');
            if (nearest.hp <= 0 && !nearest.dead && !nearest.immortal) {
              nearest.dead = true;
              handleBotDeath(nearest, chainDmg);
            }
          }
        }

        if (bot.hp <= 0 && !bot.immortal) {
          bot.dead = true;
          handleBotDeath(bot, b.dmg || 1);

          // Cryo Rifle: ijsgolf bevriest bots in de buurt
          if (b.effect === 'freezeKill') {
            const freezeRadius = 100;
            bots.forEach(other => {
              if (other === bot || other.dead) return;
              if (other.invulnUntil && performance.now() < other.invulnUntil) return; // net gesplitste bot, nog onsterfelijk
              const dd = Math.hypot(bot.x - other.x, bot.y - other.y);
              if (dd < freezeRadius) other.frozenUntil = Math.max(other.frozenUntil || 0, performance.now() + 2000);
            });
            spawnParticles(bot.x, bot.y, '#9be3ff');
            spawnParticles(bot.x, bot.y, '#ffffff');
          }

          // Vamp Cannon: geneest de speler bij een kill
          if (b.effect === 'lifestealKill') {
            player.hp = Math.min(player.maxHp, player.hp + 3);
            spawnParticles(player.x, player.y, '#ff6b81');
          }

          // Singularity Gun: opent een zwart gat op de plek van de kill
          if (b.effect === 'blackholeKill') {
            blackHoles.push({ x: bot.x, y: bot.y, born: performance.now(), duration: 1200, radius: 130, exploded: false });
          }

          // Wortelgeweer: sleurt bij een kill de dichtstbijzijnde bot (geen boss) de grond in
          if (b.effect === 'rootDragKill') {
            rootDragNearest(bot.x, bot.y, ROOT_DRAG_RANGE);
          }

          // Momentum Blade: killstreak opbouwen voor een schademultiplier
          if (b.effect === 'killstreak') {
            player.killStreak = Math.min(10, player.killStreak + 1);
            player.killStreakLastKill = performance.now();
          }
        }

        // Splash damage voor explosieve wapens
        if (b.splashRadius) {
          explosions.push({ x: b.x, y: b.y, born: performance.now(), maxR: b.splashRadius });
          spawnParticles(b.x, b.y, '#ff8800');
          spawnParticles(b.x, b.y, '#ffcc00');
          bots.forEach(other => {
            if (other === bot || other.dead) return;
            if (other.invulnUntil && performance.now() < other.invulnUntil) return;
            const dd = Math.hypot(b.x - other.x, b.y - other.y);
            if (dd < b.splashRadius) {
              other.hp -= b.splashDmg;
              spawnParticles(other.x, other.y, other.color);
              if (other.hp <= 0 && !other.immortal) {
                other.dead = true;
                handleBotDeath(other, b.splashDmg);
              }
            }
          });
        }

        if (b.pierce && b.pierce > 0) {
          b.hitBots.push(bot);
          b.pierce -= 1;
        } else {
          b.hit = true;
        }
      }
    });
  });

  // Bullet-turret collisions: bots vuren ook op neergezette Field Engineer-koepels
  bullets.forEach(b => {
    if (b.owner !== 'bot' || b.hit) return;
    for (const turret of deployedTurrets) {
      const d = Math.hypot(b.x - turret.x, b.y - turret.y);
      if (d < ENGINEER_TURRET_R + b.r) {
        b.hit = true;
        turret.hp -= (b.dmg || 8);
        spawnParticles(b.x, b.y, '#ff5c5c');
        if (turret.hp <= 0) {
          turret.destroyed = true;
          spawnParticles(turret.x, turret.y, '#4cc9f0');
          spawnParticles(turret.x, turret.y, '#333');
        }
        break;
      }
    }
  });
  deployedTurrets = deployedTurrets.filter(t => !t.destroyed);

  // Bullet-bot collisions (Verwarring powerup: bots schieten op elkaar in plaats van op de speler)
  if (now0 < player.confuseUntil) {
    bullets.forEach(b => {
      if (b.owner !== 'bot' || b.hit) return;
      for (const otherBot of bots) {
        if (otherBot.dead || otherBot === b.sourceBot) continue;
        const d = Math.hypot(b.x - otherBot.x, b.y - otherBot.y);
        if (d < otherBot.r + b.r) {
          b.hit = true;
          damageBotSimple(otherBot, b.dmg || 8, '#ff5c5c');
          break;
        }
      }
    });
  }

  // Bullet-player collisions
  bullets.forEach(b => {
    if (b.owner !== 'bot' || b.hit) return;
    const d = Math.hypot(b.x - player.x, b.y - player.y);
    if (d < player.r + b.r) {
      if (now0 < player.ricochetUntil) {
        // Ricochet-schild: kogel kaatst terug naar de bot die hem afvuurde
        const source = b.sourceBot;
        let angle;
        if (source && !source.dead) {
          angle = Math.atan2(source.y - b.y, source.x - b.x);
        } else {
          angle = Math.atan2(player.y - b.y, player.x - b.x) + Math.PI;
        }
        b.vx = Math.cos(angle) * 9;
        b.vy = Math.sin(angle) * 9;
        b.owner = 'player';
        b.dmg = 6;
        b.homingTarget = (source && !source.dead) ? source : null;
        spawnParticles(b.x, b.y, '#ff8c00');
      } else {
        b.hit = true;
        if (b.swapOnHit && b.sourceBot) {
          // Swapper: wissel altijd van plek met de bot zodra zijn kogel raakt, ook als hij inmiddels dood is
          const bot = b.sourceBot;
          const px = player.x, py = player.y;
          player.x = Math.max(player.r, Math.min(canvas.width - player.r, bot.x));
          player.y = Math.max(player.r, Math.min(canvas.height - player.r, bot.y));
          bot.x = px;
          bot.y = py;
          player.slowUntil = now0 + 3000;
          spawnParticles(player.x, player.y, '#e100ff');
          spawnParticles(bot.x, bot.y, '#e100ff');
        }
        const armor = getArmorStats();
        if (now0 < player.shieldUntil) {
          spawnParticles(b.x, b.y, '#c77dff');
        } else {
          const dmg = b.dmg || 8;
          applyDamageToPlayer(dmg);
          spawnParticles(b.x, b.y, '#ff5c5c');

          // Elementale Wereld 2-bots: elk een eigen extra effect bovenop de schade
          const srcType = b.sourceBot && b.sourceBot.type;
          if (srcType === 'windwicht') {
            // Windloper: blaast je een stuk naar achteren (minder ver met knockbackResist-pantser)
            const kAng = Math.atan2(player.y - b.sourceBot.y, player.x - b.sourceBot.x);
            const kbDist = 70 * (1 - getArmorStats().knockbackResist);
            player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x + Math.cos(kAng) * kbDist));
            player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y + Math.sin(kAng) * kbDist));
            spawnParticles(player.x, player.y, '#eaffff');
          } else if (srcType === 'bliksemwicht') {
            // Donderknaap: korte schok-jolt van het scherm en een lichtflits
            staticShockUntil = now0 + 150;
            spawnParticles(player.x, player.y, '#fff066');
            spawnParticles(player.x, player.y, '#f5e642');
          } else if (srcType === 'stormwicht') {
            // Onweersgeest: een echte bliksemboog van de bot naar jou
            lightningBolts.push({ x1: b.sourceBot.x, y1: b.sourceBot.y, x2: player.x, y2: player.y, born: now0 });
            spawnParticles(player.x, player.y, '#8ecbff');
          } else if (srcType === 'kristalwicht') {
            // Kristalreus: een bevriezende vertraging (korter met iceResist-pantser)
            player.slowUntil = Math.max(player.slowUntil, now0 + 1700 * (1 - getArmorStats().iceResist));
            spawnParticles(player.x, player.y, '#9ef7ff');
            spawnParticles(player.x, player.y, '#ffffff');
          } else if (srcType === 'zandworm') {
            // Zandworm: zuigt je heel even vast in het zand
            player.mireUntil = now0 + 700;
            spawnParticles(player.x, player.y, '#c9a96a');
            spawnParticles(player.x, player.y, '#8a6a3a');
          } else if (srcType === 'doornrank') {
            // Doornrank: doornen laten je een tijdje bloeden
            player.bleedUntil = now0 + 4000;
            spawnParticles(player.x, player.y, '#2f7d3c');
          } else if (srcType === 'getijgeest') {
            // Getijgeest: doorweekt je wapen, tijdelijk minder schade
            player.curseUntil = now0 + 4000;
            spawnParticles(player.x, player.y, '#2a7fba');
            spawnParticles(player.x, player.y, '#8ecbff');
          } else if (srcType === 'aswervelaar') {
            // Aswervelaar: een askolk verblindt je kort
            player.ashBlindUntil = now0 + 2600;
            spawnParticles(player.x, player.y, '#6b6b6b');
            spawnParticles(player.x, player.y, '#c9c9c9');
          } else if (srcType === 'sneeuwjager') {
            // Sneeuwjager: een korte, harde bevriezing (korter met iceResist-pantser)
            player.rootedUntil = Math.max(player.rootedUntil, now0 + 500 * (1 - getArmorStats().iceResist));
            spawnParticles(player.x, player.y, '#eaffff');
            spawnParticles(player.x, player.y, '#bdf3ff');
          }

          // Reflection: kaats schade terug
          if (armor.reflection > 0) {
            const botsAtLocation = bots.filter(bot => !bot.dead && Math.hypot(bot.x - b.x, bot.y - b.y) < 60);
            botsAtLocation.forEach(bot => {
              const reflectDmg = Math.ceil(dmg * armor.reflection);
              damageBotSimple(bot, reflectDmg, '#ffff00');
            });
          }

          // Poison Reflect: vergiftigt aanvallers
          if (armor.poisonReflect) {
            const botsAtLocation = bots.filter(bot => !bot.dead && Math.hypot(bot.x - b.x, bot.y - b.y) < 80);
            botsAtLocation.forEach(bot => {
              bot.poisonUntil = Math.max(bot.poisonUntil || 0, now0 + 4000);
              bot.poisonSpread = true;
            });
          }

          // Freeze Reflect: bevriest aanvallers
          if (armor.freezeReflect) {
            const botsAtLocation = bots.filter(bot => !bot.dead && Math.hypot(bot.x - b.x, bot.y - b.y) < 80);
            botsAtLocation.forEach(bot => {
              bot.frozenUntil = Math.max(bot.frozenUntil || 0, now0 + 3000);
            });
          }
        }
      }
    }
  });

  bullets = bullets.filter(b => !b.hit);
  bots = bots.filter(bot => !bot.dead);

  // Particles
  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 1; });
  particles = particles.filter(p => p.life > 0);

  // Bewegingsspoor (Trails-shop): laat achter de speler een spoor van deeltjes vallen terwijl die beweegt
  if (equippedTrail !== 'none' && !gameOver && (Math.abs(player.slideVX) > 0.3 || Math.abs(player.slideVY) > 0.3) && trailParticles.length < 200) {
    trailParticles.push({
      x: player.x, y: player.y,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      life: 26, maxLife: 26,
      type: equippedTrail
    });
  }
  trailParticles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 1; });
  trailParticles = trailParticles.filter(p => p.life > 0);

  // Explosies (bomber): korte uitdijende schokgolf
  explosions = explosions.filter(e => now0 - e.born < 400);
  botDeathAnimations = botDeathAnimations.filter(e => now0 - e.born < (e.duration || DEATH_ANIM_DURATION));
  telegraphs = telegraphs.filter(t => now0 < t.warnUntil);
  lightningBolts = lightningBolts.filter(l => now0 - l.born < 150);
  fallingMeteors = fallingMeteors.filter(m => now0 - m.born < m.totalLife);
  tsunamiWaves = tsunamiWaves.filter(w => now0 - w.born < w.totalLife);
  treeGrabs = treeGrabs.filter(t => now0 - t.born < t.duration);
  rootDrags = rootDrags.filter(r => now0 - r.born < r.duration);
  fireRings = fireRings.filter(r => now0 - r.born < r.duration);
  shockRings = shockRings.filter(r => now0 - r.born < r.duration);
  iceLances = iceLances.filter(l => now0 - l.born < 250);
  iceGrenades = iceGrenades.filter(g => now0 - g.born < g.duration);
  vampBolts = vampBolts.filter(g => now0 - g.born < g.duration);
  stickyThrows = stickyThrows.filter(g => now0 - g.born < g.duration);
  bladeTrails = bladeTrails.filter(t => now0 - t.born < 250);
  fireballThrows = fireballThrows.filter(g => now0 - g.born < g.duration);
  chargeTrails = chargeTrails.filter(t => now0 - t.born < 300);

  // Field Engineer: neergezette koepels zoeken zelfstandig een doelwit en vuren erop
  const turretDmgMult = now0 < player.damageBoostUntil ? 2 : 1;
  deployedTurrets.forEach(turret => {
    if (now0 - turret.lastShot < ENGINEER_TURRET_FIRE_COOLDOWN) return;
    let nearest = null, nearestDist = ENGINEER_TURRET_RANGE;
    bots.forEach(bot => {
      if (bot.dead) return;
      const dd = Math.hypot(bot.x - turret.x, bot.y - turret.y);
      if (dd < nearestDist) { nearest = bot; nearestDist = dd; }
    });
    if (!nearest) return;
    turret.lastShot = now0;
    const angle = Math.atan2(nearest.y - turret.y, nearest.x - turret.x);
    bullets.push({
      x: turret.x + Math.cos(angle) * 10,
      y: turret.y + Math.sin(angle) * 10,
      vx: Math.cos(angle) * 8,
      vy: Math.sin(angle) * 8,
      r: 3,
      owner: 'player',
      dmg: ENGINEER_TURRET_DMG * turretDmgMult,
      pierce: 0,
      hitBots: null,
      splashRadius: 0,
      splashDmg: 0,
      effect: null
    });
  });
  deployedTurrets = deployedTurrets.filter(t => now0 - t.deployedAt < ENGINEER_TURRET_DURATION);

  // Pyromancer: brandende zones doen periodiek schade aan bots die er in staan
  fireZones.forEach(zone => {
    if (now0 - zone.lastTick < PYRO_ZONE_TICK_INTERVAL) return;
    zone.lastTick = now0;
    bots.forEach(bot => {
      if (bot.dead) return;
      const dd = Math.hypot(zone.x - bot.x, zone.y - bot.y);
      if (dd < zone.radius + bot.r) damageBotSimple(bot, zone.tickDmg, '#ff8800');
    });
  });
  fireZones = fireZones.filter(zone => now0 < zone.until);

  // Miasma: gifwolken doen periodiek schade aan de speler zolang die erin staat
  gasClouds.forEach(cloud => {
    if (now0 - cloud.lastTick < 500) return;
    cloud.lastTick = now0;
    const dd = Math.hypot(cloud.x - player.x, cloud.y - player.y);
    if (dd < cloud.radius + player.r) applyDamageToPlayer(cloud.tickDmg);
  });
  gasClouds = gasClouds.filter(cloud => now0 - cloud.born < cloud.duration);

  // Singularity Gun: zwarte gaten zuigen bots naar binnen en imploderen daarna
  blackHoles.forEach(bh => {
    const age = now0 - bh.born;
    if (age < bh.duration) {
      bots.forEach(other => {
        if (other.dead) return;
        const dx = bh.x - other.x, dy = bh.y - other.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < bh.radius) {
          other.x += (dx / dist) * 1.6;
          other.y += (dy / dist) * 1.6;
          if (Math.random() < 0.05) damageBotSimple(other, 1, '#9b5de5');
        }
      });
    } else if (!bh.exploded) {
      bh.exploded = true;
      explosions.push({ x: bh.x, y: bh.y, born: performance.now(), maxR: bh.radius });
      spawnParticles(bh.x, bh.y, '#9b5de5');
      bots.forEach(other => {
        if (other.dead) return;
        const dd = Math.hypot(bh.x - other.x, bh.y - other.y);
        if (dd < bh.radius * 0.7) damageBotSimple(other, 6, '#9b5de5');
      });
    }
  });
  blackHoles = blackHoles.filter(bh => now0 - bh.born < bh.duration + 300);
  laserTelegraphs = laserTelegraphs.filter(lt => now0 < lt.warnUntil);
  activeLasers = activeLasers.filter(beam => now0 - beam.born < beam.duration);
  barrageLasers = barrageLasers.filter(beam => now0 - beam.born < beam.duration);
  barrageTelegraphs = barrageTelegraphs.filter(lt => now0 < lt.warnUntil);

  // Momentum Blade: killstreak vervalt als je te lang niet raakt
  if (player.killStreak > 0 && now0 - player.killStreakLastKill > 2500) {
    player.killStreak = 0;
  }

  // Combo-killstreak (voor combo-skins): telt elke kill, ongeacht wapen, vervalt na 3 sec zonder kill
  if (player.comboStreak > 0 && now0 - player.comboLastKill > 3000) {
    player.comboStreak = 0;
  }

  // Killstreak-drones: elke drone verschijnt vanaf zijn eigen killstreak-drempel en helpt bots doden, verdwijnt eronder weer
  if (dronePracticeActive) {
    updateOneDrone(dronePracticeDrone, dronePracticeLevel, now0);
  } else {
    KILLSTREAK_DRONES.forEach((drone, i) => {
      if (player.comboStreak < drone.threshold) return;
      updateOneDrone(drone, droneLevels[i], now0);
    });
  }

  // In brand (Lavagolem): 3 sec lang elke sec 4 schade
  if (now0 < player.burnUntil) {
    if (!player.burnLastTick || now0 - player.burnLastTick > 1000) {
      player.burnLastTick = now0;
      applyDamageToPlayer(4);
      spawnParticles(player.x, player.y, '#ff5a1f');
    }
  }

  // Bloedend (Doornrank): periodiek wat schade zolang de wond bloedt
  if (now0 < player.bleedUntil) {
    if (!player.bleedLastTick || now0 - player.bleedLastTick > 1000) {
      player.bleedLastTick = now0;
      applyDamageToPlayer(2);
      spawnParticles(player.x, player.y, '#8b0000');
    }
  }

  // Tornado-schot powerup: het projectiel sleurt bots mee en slingert ze van de kaart af bij het bereiken van de rand
  tornadoShots.forEach(t => {
    const age = now0 - t.born;
    t.x += t.vx;
    t.y += t.vy;
    bots.forEach(bot => {
      if (bot.dead || bot.isBoss || bot.tornadoCaptured) return;
      const dd = Math.hypot(bot.x - t.x, bot.y - t.y);
      if (dd < t.r + bot.r) {
        bot.tornadoCaptured = true;
        t.captured.push(bot);
        spawnParticles(bot.x, bot.y, '#cfe8ee');
      }
    });
    t.captured.forEach((bot, i) => {
      if (bot.dead) return;
      const orbitA = now0 / 150 + i * (Math.PI * 2 / Math.max(1, t.captured.length));
      bot.x = Math.max(bot.r, Math.min(canvas.width - bot.r, t.x + Math.cos(orbitA) * 20));
      bot.y = Math.max(bot.r, Math.min(canvas.height - bot.r, t.y + Math.sin(orbitA) * 20));
    });
    const outOfBounds = t.x < -10 || t.x > canvas.width + 10 || t.y < -10 || t.y > canvas.height + 10;
    if (outOfBounds || age > 6000) {
      if (outOfBounds) {
        t.captured.forEach(bot => {
          if (bot.dead) return;
          if (bot.invulnUntil && now0 < bot.invulnUntil) { bot.tornadoCaptured = false; return; }
          bot.dead = true;
          handleBotDeath(bot, bot.maxHp);
          spawnParticles(bot.x, bot.y, '#cfe8ee');
        });
      } else {
        t.captured.forEach(bot => { if (!bot.dead) bot.tornadoCaptured = false; });
      }
      t.expired = true;
    }
  });
  tornadoShots = tornadoShots.filter(t => !t.expired);

  // Vuurspoor-powerup: laat continu een klein brandend plekje achter zolang het actief is
  if (now0 < player.fireTrailUntil) {
    if (!player.lastFireTrailDrop || now0 - player.lastFireTrailDrop > 200) {
      player.lastFireTrailDrop = now0;
      fireZones.push({ x: player.x, y: player.y, radius: 36, until: now0 + 1500, tickDmg: 4, lastTick: 0 });
    }
  }

  // Lavagolem: lopen door de nog liggende lavaplas zet je opnieuw in brand
  lavaPools.forEach(pool => {
    const age = now0 - pool.born;
    if (age < pool.fallDelay || age >= pool.fallDelay + pool.lingerDuration) return;
    const dd = Math.hypot(pool.x - player.x, pool.y - player.y);
    if (dd < pool.radius + player.r && (!pool.lastIgniteTick || now0 - pool.lastIgniteTick > 600)) {
      pool.lastIgniteTick = now0;
      player.burnUntil = Math.max(player.burnUntil, now0 + 3000 * (1 - getArmorStats().fireResist));
      spawnParticles(player.x, player.y, '#ff5a1f');
    }
  });
  lavaPools = lavaPools.filter(pool => now0 - pool.born < pool.totalLife);

  // Aardkoning: achtervolgende scheur die de speler blijft opjagen tot hij dooft
  chasingCracks.forEach(c => {
    const age = now0 - c.born;
    if (age >= c.duration) return;
    const cdx = player.x - c.x, cdy = player.y - c.y;
    const clen = Math.hypot(cdx, cdy) || 1;
    c.x += (cdx / clen) * c.speed;
    c.y += (cdy / clen) * c.speed;
    const cdd = Math.hypot(player.x - c.x, player.y - c.y);
    if (cdd < 30 + player.r && now0 - c.lastHit > 500) {
      c.lastHit = now0;
      applyDamageToPlayer(c.dmg);
      player.rootedUntil = Math.max(player.rootedUntil, now0 + 500);
      spawnParticles(player.x, player.y, '#5c3a1e');
    }
  });
  chasingCracks = chasingCracks.filter(c => now0 - c.born < c.duration);

  // Aura: periodic damage rond speler
  if (now0 < player.auraUntil) {
    if (!player.auraLastTick || now0 - player.auraLastTick > 400) {
      player.auraLastTick = now0;
      if (currentWorld === 2) shockRings.push({ x: player.x, y: player.y, born: now0, maxR: 190, duration: 350, color: '#7fff00' });
      bots.forEach(bot => {
        if (bot.dead) return;
        const d = Math.hypot(bot.x - player.x, bot.y - player.y);
        if (d < 190) damageBotSimple(bot, 3, '#7fff00');
      });
    }
  }
  // Kernaura: permanente, zwakkere versie van de Aura-powerup zolang je Kernaura bezit en in Wereld 2 speelt
  if (currentWorld === 2 && hasCoreAura) {
    if (!player.coreAuraLastTick || now0 - player.coreAuraLastTick > 500) {
      player.coreAuraLastTick = now0;
      shockRings.push({ x: player.x, y: player.y, born: now0, maxR: CORE_AURA_RADIUS, duration: 350, color: '#9be3ff' });
      bots.forEach(bot => {
        if (bot.dead) return;
        const d = Math.hypot(bot.x - player.x, bot.y - player.y);
        if (d < CORE_AURA_RADIUS) damageBotSimple(bot, CORE_AURA_DMG, '#9be3ff');
      });
    }
  }

  // Powerups: spawn periodically (niet tijdens oefenen, niet tijdens Eindbaas Rush)
  const effLuckyDrop = w1Lvl(lvlLuckyDrop);
  const effLuckyDrop2 = w2Lvl(lvl2LuckyDrop);
  const powerupInterval = effLuckyDrop > 0 ? LUCKY_DROP_INTERVALS[effLuckyDrop - 1] : (effLuckyDrop2 > 0 ? LUCKYDROP2_INTERVALS[effLuckyDrop2 - 1] : 6000);
  if (gameMode !== 'practice' && !weaponPracticeActive && !transformPracticeActive && !disasterPracticeActive && !skinPracticeActive && !bossRushActive && !dronePracticeActive && now - lastPowerupSpawn > powerupInterval && powerups.length < 2) {
    lastPowerupSpawn = now;
    if (Math.random() < 0.7) spawnPowerup();
  }
  // Powerups: expire after their lifetime
  powerups = powerups.filter(p => now - p.bornAt < p.life);
  // Powerups: pickup by player
  const boostDurMult = 1 + w1Lvl(lvlLongBoosts) * LONG_BOOSTS_MULT_PER_LEVEL + w2Lvl(lvl2LongBoosts) * LONGBOOSTS2_MULT_PER_LEVEL;
  const effGoldRush = w1Lvl(lvlGoldRush);
  const pickupBonus = w1Lvl(lvlMagnet) * MAGNET_RADIUS_PER_LEVEL + w2Lvl(lvl2Magnet) * MAGNET2_RADIUS_PER_LEVEL + (effGoldRush > 0 ? GOLD_RUSH_RADIUS[effGoldRush - 1] : 0);
  powerups.forEach(p => {
    const d = Math.hypot(player.x - p.x, player.y - p.y);
    if (d < player.r + p.r + pickupBonus) {
      p.collected = true;
      // Powerups van de verkeerde wereld doen niks, net als speciale wapens/pantsers die niet in de andere wereld werken
      const belongsToWorld2 = WORLD2_POWERUP_IDS.includes(p.type);
      if ((currentWorld === 2) !== belongsToWorld2) return;
      const lvl = getPuLevel(p.type);
      const info = POWERUP_LEVELS[p.type];
      if (p.type === 'speed') {
        player.boostUntil = now + info.durations[lvl] * boostDurMult;
        spawnParticles(p.x, p.y, '#4cc9f0');
      } else if (p.type === 'heal') {
        player.hp = Math.min(player.maxHp, player.hp + info.heals[lvl]);
        spawnParticles(p.x, p.y, '#4cd964');
      } else if (p.type === 'fire') {
        player.fireBoostUntil = now + info.durations[lvl] * boostDurMult;
        spawnParticles(p.x, p.y, '#ffd60a');
      } else if (p.type === 'shield') {
        const effMultiShield = w1Lvl(lvlMultiShield);
        const effMultiShield2 = w2Lvl(lvl2MultiShield);
        const maxShields = effMultiShield > 0 ? [2, 3, 4][effMultiShield - 1] : (effMultiShield2 > 0 ? [2, 3, 4][effMultiShield2 - 1] : 1);
        const newShieldUntil = now + info.durations[lvl] * boostDurMult;
        if (now < player.shieldUntil && maxShields > 1) {
          player.shieldUntil = Math.max(player.shieldUntil, newShieldUntil);
        } else {
          player.shieldUntil = newShieldUntil;
        }
        spawnParticles(p.x, p.y, '#c77dff');
      } else if (p.type === 'damage') {
        player.damageBoostUntil = now + info.durations[lvl] * boostDurMult;
        spawnParticles(p.x, p.y, '#ff3838');
      } else if (p.type === 'multishot') {
        player.multiShotUntil = now + info.durations[lvl] * boostDurMult;
        spawnParticles(p.x, p.y, '#38ffb0');
      } else if (p.type === 'freeze') {
        bots.forEach(b => { b.frozenUntil = now + info.durations[lvl] * boostDurMult; });
        spawnParticles(p.x, p.y, '#9be3ff');
      } else if (p.type === 'nuke') {
        const nukeDmg = info.dmgs[lvl];
        bots.forEach(bot => {
          if (bot.dead) return;
          if (bot.invulnUntil && now < bot.invulnUntil) return;
          bot.hp -= nukeDmg;
          spawnParticles(bot.x, bot.y, '#ff8800');
          if (bot.hp <= 0 && !bot.immortal) {
            bot.dead = true;
            handleBotDeath(bot, nukeDmg);
          }
        });
        spawnParticles(player.x, player.y, '#ff8800');
      } else if (p.type === 'invisible') {
        player.invisibleUntil = now + info.durations[lvl] * boostDurMult;
        spawnParticles(p.x, p.y, '#aaaaaa');
      } else if (p.type === 'timewarp') {
        player.timewarpUntil = now + info.durations[lvl] * boostDurMult;
        spawnParticles(p.x, p.y, '#66ccff');
      } else if (p.type === 'ricochet') {
        player.ricochetUntil = now + info.durations[lvl] * boostDurMult;
        spawnParticles(p.x, p.y, '#ff8c00');
      } else if (p.type === 'homing') {
        player.homingUntil = now + info.durations[lvl] * boostDurMult;
        spawnParticles(p.x, p.y, '#ff1493');
      } else if (p.type === 'stun') {
        player.stunUntil = now + info.durations[lvl] * boostDurMult;
        spawnParticles(p.x, p.y, '#ffff00');
      } else if (p.type === 'aura') {
        player.auraUntil = now + info.durations[lvl] * boostDurMult;
        spawnParticles(p.x, p.y, '#7fff00');
      } else if (p.type === 'overload') {
        player.overloadUntil = now + info.durations[lvl] * boostDurMult;
        spawnParticles(p.x, p.y, '#ffff00');
        spawnParticles(p.x, p.y, '#ff6347');
      } else if (p.type === 'chaos') {
        player.confuseUntil = now + info.durations[lvl] * boostDurMult;
        spawnParticles(p.x, p.y, '#c026d3');
      } else if (p.type === 'elementstorm') {
        elementStorm(info.dmgs[lvl], info.counts[lvl]);
        spawnParticles(p.x, p.y, '#ff8800');
        spawnParticles(p.x, p.y, '#9be3ff');
      } else if (p.type === 'wortelgreep') {
        rootGrabAttack(info.counts[lvl]);
        spawnParticles(p.x, p.y, '#5c3a1e');
        spawnParticles(p.x, p.y, '#3fa34d');
      } else if (p.type === 'aardhuid') {
        player.stoneskinUntil = now + info.durations[lvl] * boostDurMult;
        player.stoneskinReduction = info.reductions[lvl];
        shockRings.push({ x: player.x, y: player.y, born: now, maxR: 70, duration: 400, color: '#8a6a3a' });
        spawnParticles(player.x, player.y, '#8a6a3a');
        spawnParticles(player.x, player.y, '#5c4526');
        spawnParticles(player.x, player.y, '#c9a96a');
      } else if (p.type === 'vuurnova') {
        fireNovaAttack(info.dmgs[lvl], info.radii[lvl]);
      } else if (p.type === 'aardaura') {
        player.auraUntil = now + info.durations[lvl] * boostDurMult;
        shockRings.push({ x: player.x, y: player.y, born: now, maxR: 90, duration: 450, color: '#7fff00' });
        spawnParticles(player.x, player.y, '#7fff00');
        spawnParticles(player.x, player.y, '#3fa34d');
      } else if (p.type === 'ijsbries') {
        bots.forEach(b => { b.frozenUntil = now + info.durations[lvl] * boostDurMult; });
        shockRings.push({ x: player.x, y: player.y, born: now, maxR: Math.max(canvas.width, canvas.height), duration: 700, color: '#9be3ff' });
        for (let i = 0; i < 10; i++) {
          spawnParticles(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() < 0.5 ? '#9be3ff' : '#ffffff');
        }
        spawnParticles(player.x, player.y, '#9be3ff');
      } else if (p.type === 'firetrail') {
        player.fireTrailUntil = now + info.durations[lvl] * boostDurMult;
        spawnParticles(p.x, p.y, '#ff5a1f');
      } else if (p.type === 'strike') {
        triggerCenterLightningStrike(info.dmgs[lvl]);
        spawnParticles(p.x, p.y, '#fff066');
      } else if (p.type === 'tornadoshot') {
        player.nextShotTornado = info.radii[lvl];
        spawnParticles(p.x, p.y, '#cfe8ee');
      } else if (p.type === 'lightningbarrage') {
        triggerTopHpLightningBarrage(info.dmgs[lvl]);
        spawnParticles(p.x, p.y, '#fff066');
      }
    }
  });
  powerups = powerups.filter(p => !p.collected);

  // Coins: spawn periodically (niet tijdens oefenen, niet tijdens Eindbaas Rush, en niet in Levels
  // zodra er dit level geen nieuwe bots meer spawnen — voorkomt dat je de laatste bot bewust in leven
  // laat om oneindig munten te blijven verzamelen zonder het level af te maken)
  const levelStalling = gameMode === 'levels' && levelKills + bots.length >= levelTarget;
  if (gameMode !== 'practice' && !weaponPracticeActive && !transformPracticeActive && !disasterPracticeActive && !skinPracticeActive && !bossRushActive && !dronePracticeActive && !levelStalling && now - lastCoinSpawn > 4000 && coinPickups.length < 2) {
    lastCoinSpawn = now;
    spawnCoinPickup();
  }
  coinPickups = coinPickups.filter(c => now - c.bornAt < c.life);
  coinPickups.forEach(c => {
    const d = Math.hypot(player.x - c.x, player.y - c.y);
    if (d < player.r + c.r + pickupBonus) {
      c.collected = true;
      const effCoinRain = w1Lvl(lvlCoinRain);
      const effCoinRain2 = w2Lvl(lvl2CoinRain);
      coins += Math.round(c.value * (getArmorStats().coinMult || 1)) + (effCoinRain > 0 ? COIN_RAIN_BONUSES[effCoinRain - 1] : 0) + (effCoinRain2 > 0 ? COINRAIN2_BONUSES[effCoinRain2 - 1] : 0);
      saveShopState();
      spawnParticles(c.x, c.y, '#ffd60a');
    }
  });
  coinPickups = coinPickups.filter(c => !c.collected);

  // Natuurrampen: af en toe een willekeurige ramp (niet tijdens oefenen)
  if (disasterPracticeActive) {
    sustainDisasterPractice();
  } else if (gameMode !== 'practice' && !weaponPracticeActive && !transformPracticeActive && !dronePracticeActive) {
    if (!activeDisasterType && nextDisasterAt && now > nextDisasterAt) {
      startRandomDisaster();
    }
    if (activeDisasterType && now >= disasterEndAt) {
      activeDisasterType = null;
      nextDisasterAt = now + 30000 + Math.random() * 25000;
    }
  }
  if (activeDisasterType === 'lightningStorm' && now - lastLightningStrike > 350) {
    lastLightningStrike = now;
    triggerLightningStrike();
  }
  if (activeDisasterType === 'meteorShower' && now - lastMeteorImpact > 500) {
    lastMeteorImpact = now;
    triggerMeteorImpact();
  }
  if (activeDisasterType === 'tsunami' && now - lastTsunamiWave > 3000) {
    lastTsunamiWave = now;
    triggerTsunamiWave();
  }

  // Tsunami: actieve vloedgolven doen geen schade, maar sleuren je een flink stuk mee
  tsunamiWaves.forEach(w => {
    const age = now - w.born;
    const t = Math.min(1, age / w.sweepDuration);
    let bandPos, axisIsX, knockDX = 0, knockDY = 0;
    if (w.dir === 'left') { bandPos = -80 + t * (canvas.width + 160); axisIsX = true; knockDX = 1; }
    else if (w.dir === 'right') { bandPos = canvas.width + 80 - t * (canvas.width + 160); axisIsX = true; knockDX = -1; }
    else if (w.dir === 'top') { bandPos = -80 + t * (canvas.height + 160); axisIsX = false; knockDY = 1; }
    else { bandPos = canvas.height + 80 - t * (canvas.height + 160); axisIsX = false; knockDY = -1; }
    const bandHalfWidth = 45;
    if (!w.hitPlayer) {
      const playerPos = axisIsX ? player.x : player.y;
      if (Math.abs(playerPos - bandPos) < bandHalfWidth) {
        w.hitPlayer = true;
        player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x + knockDX * 260));
        player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y + knockDY * 260));
        spawnParticles(player.x, player.y, '#6ec6ff');
      }
    }
    bots.forEach(bot => {
      if (bot.dead || w.hitBots.has(bot)) return;
      const botPos = axisIsX ? bot.x : bot.y;
      if (Math.abs(botPos - bandPos) < bandHalfWidth) {
        w.hitBots.add(bot);
        spawnParticles(bot.x, bot.y, '#6ec6ff');
        bot.x = Math.max(bot.r, Math.min(canvas.width - bot.r, bot.x + knockDX * 260));
        bot.y = Math.max(bot.r, Math.min(canvas.height - bot.r, bot.y + knockDY * 260));
      }
    });
  });

  // Tornado: ronddwalende wervelwind die zuigt en dichtbij wegslingert
  if (now < tornadoUntil) {
    tornadoX += tornadoVX;
    tornadoY += tornadoVY;
    if (tornadoX < 60 || tornadoX > canvas.width - 60) tornadoVX *= -1;
    if (tornadoY < 60 || tornadoY > canvas.height - 60) tornadoVY *= -1;
    tornadoX = Math.max(60, Math.min(canvas.width - 60, tornadoX));
    tornadoY = Math.max(60, Math.min(canvas.height - 60, tornadoY));
    tornadoVX += (Math.random() - 0.5) * 0.08;
    tornadoVY += (Math.random() - 0.5) * 0.08;
    const tSpd = Math.hypot(tornadoVX, tornadoVY) || 1;
    tornadoVX = (tornadoVX / tSpd) * 1.3;
    tornadoVY = (tornadoVY / tSpd) * 1.3;

    const pullRadius = 200, coreRadius = 34;
    const pdx = tornadoX - player.x, pdy = tornadoY - player.y;
    const pdist = Math.hypot(pdx, pdy) || 1;
    if (pdist < coreRadius) {
      applyDamageToPlayer(1);
      const ang = Math.random() * Math.PI * 2;
      player.x = Math.max(player.r, Math.min(canvas.width - player.r, tornadoX + Math.cos(ang) * pullRadius));
      player.y = Math.max(player.r, Math.min(canvas.height - player.r, tornadoY + Math.sin(ang) * pullRadius));
      spawnParticles(player.x, player.y, '#cfe8ee');
    } else if (pdist < pullRadius) {
      const pull = (1 - pdist / pullRadius) * 5;
      player.x += (pdx / pdist) * pull;
      player.y += (pdy / pdist) * pull;
    }
    bots.forEach(bot => {
      if (bot.dead) return;
      const bdx = tornadoX - bot.x, bdy = tornadoY - bot.y;
      const bdist = Math.hypot(bdx, bdy) || 1;
      if (bdist < coreRadius) {
        const ang = Math.random() * Math.PI * 2;
        damageBotSimple(bot, 1, '#cfe8ee');
        if (bot.dead) return;
        bot.x = Math.max(bot.r, Math.min(canvas.width - bot.r, tornadoX + Math.cos(ang) * pullRadius));
        bot.y = Math.max(bot.r, Math.min(canvas.height - bot.r, tornadoY + Math.sin(ang) * pullRadius));
      } else if (bdist < pullRadius) {
        const pull = (1 - bdist / pullRadius) * 5;
        bot.x += (bdx / bdist) * pull;
        bot.y += (bdy / bdist) * pull;
      }
    });
  }
  // Spawn new bots gradually (niet tijdens oefenen — daar is maar 1 bot)
  if (gameMode === 'levels') {
    const cfg = levelConfig(currentLevel);
    const spawnedSoFar = levelKills + bots.length;
    if (spawnedSoFar < cfg.target && bots.length < cfg.maxBots && now - lastLevelSpawn > cfg.spawnInterval) {
      lastLevelSpawn = now;
      spawnBot();
    }
    if (levelKills >= levelTarget && bots.length === 0 && !bossWarningActive) {
      // De !bossWarningActive-check voorkomt dat het level compleet wordt verklaard terwijl een boss
      // al wel getriggerd is maar nog niet daadwerkelijk gespawnd (dat gebeurt pas na de 2,5 sec
      // waarschuwing) — anders zou die boss bij het afgaan van zijn timer stilletjes worden overgeslagen.
      levelComplete();
      return;
    }
  } else if (gameMode === 'endless' || gameMode === 'hardcore' || gameMode === 'sprint') {
    if (bots.length < 3 + Math.floor(score / 50)) {
      if (Math.random() < 0.015) spawnBot();
    }
  }

  // Bosses: verschijnen elk precies één keer per potje, in endless via score en in levels via level (niet tijdens oefenen, niet in Golfsprint)
  if (gameMode !== 'practice' && gameMode !== 'sprint' && !weaponPracticeActive && !transformPracticeActive && !disasterPracticeActive && !skinPracticeActive && !dronePracticeActive && !bossAlive && !bossWarningActive) {
    if (bossRushActive) {
      // Eindbaas Rush: geen score/level-drempel, gewoon de bosses van de gekozen wereld na elkaar
      const rushPool = bossRushWorld === 2 ? WORLD2_BOSS_TYPES : BOSS_TYPES;
      if (bossRushIndex < rushPool.length) {
        triggerBossWarning(rushPool[bossRushIndex]);
      } else if (!gameOver) {
        endGame(true);
      }
    } else {
      const bossPool = currentWorld === 2 ? WORLD2_BOSS_TYPES : BOSS_TYPES;
      const nextBoss = bossPool.find(b => !bossesSpawned[b.name] &&
        (gameMode === 'levels' ? currentLevel >= b.minLevel : score >= b.minScore));
      if (nextBoss) triggerBossWarning(nextBoss);
      // Wereldbaas (Wereld 2-only): een zeldzame megaboss die verschijnt bij een hoge score/level-drempel
      else if (currentWorld === 2 && !bossesSpawned[WORLD_BOSS_TYPE.name] &&
        (gameMode === 'levels' ? currentLevel >= WORLD_BOSS_TYPE.minLevel : score >= WORLD_BOSS_TYPE.minScore)) {
        triggerBossWarning(WORLD_BOSS_TYPE);
      }
    }
  }

  const effSecondWind = w1Lvl(lvlSecondWind);
  const effSecondWind2 = w2Lvl(lvl2SecondWind);
  if ((effSecondWind > 0 || effSecondWind2 > 0) && !player.secondWindUsed && player.hp > 0 && player.hp / player.maxHp < 0.5) {
    player.secondWindUsed = true;
    const healAmount = effSecondWind > 0 ? SECOND_WIND_HEALS[effSecondWind - 1] : SECONDWIND2_HEALS[effSecondWind2 - 1];
    player.hp = Math.min(player.maxHp, player.hp + healAmount);
    spawnParticles(player.x, player.y, '#4cd964');
    spawnParticles(player.x, player.y, '#ffffff');
  }

  if (player.hp <= 0) {
    if (gameMode === 'practice') {
      player.hp = player.maxHp;
      player.shieldUntil = now0 + 1000;
      spawnParticles(player.x, player.y, '#4cd964');
    } else if (player.activeTransform !== 'none') {
      // Transformatie sterft: word één keer teruggevormd tot normaal poppetje met vast HP en je uitgeruste wapen
      player.activeTransform = 'none';
      player.r = PLAYER_BASE_R;
      player.baseSpeed = 4 * (1 + w1Lvl(lvlSprint) * SPRINT_PER_LEVEL) * (1 + getArmorStats().speedBonus);
      player.maxHp = 100 + getArmorStats().hpBonus + w1Lvl(lvlExtraHp) * EXTRA_HP_PER_LEVEL + w2Lvl(lvl2ExtraHp) * EXTRAHP2_PER_LEVEL;
      player.hp = Math.min(player.maxHp, TRANSFORM_REVIVE_HP);
      player.shieldUntil = now0 + 1500; // korte adempauze na de transformatie
      spawnParticles(player.x, player.y, '#4cd964');
      spawnParticles(player.x, player.y, '#ffffff');
    } else if (w1Flag(hasRevive) && !player.reviveUsed) {
      player.reviveUsed = true;
      player.hp = player.maxHp * REVIVE_HEAL_PCT;
      player.shieldUntil = now0 + 1500; // korte adempauze na reanimatie
      spawnParticles(player.x, player.y, '#4cd964');
    } else if (w2Flag(hasRevive2) && !player.reviveUsed) {
      player.reviveUsed = true;
      player.hp = player.maxHp * REVIVE2_HEAL_PCT;
      player.shieldUntil = now0 + 1500; // korte adempauze na elementaire reanimatie
      spawnParticles(player.x, player.y, '#9be3ff');
    } else {
      player.deathAnimStart = now0;
      endGame(false);
    }
  }

  updateHUD();
}

function endGame(won) {
  gameOver = true;
  const msgBtn = document.getElementById('msgBtn');
  const killCamBtn = document.getElementById('msgKillCamBtn');
  if (killCamBtn) killCamBtn.style.display = bestMomentSnapshot ? 'inline-block' : 'none';
  if (bossRushActive) {
    bossRushActive = false;
    const bossPool = bossRushWorld === 2 ? WORLD2_BOSS_TYPES : BOSS_TYPES;
    const totalBosses = bossPool.length;
    if (won) {
      if (bossRushWorld === 2 && !hasBossRushW2) { hasBossRushW2 = true; localStorage.setItem('botShooterHasBossRushW2', 'true'); }
      if (bossRushWorld === 1 && !hasBossRushW1) { hasBossRushW1 = true; localStorage.setItem('botShooterHasBossRushW1', 'true'); }
      checkAchievements();
      document.getElementById('msgText').innerHTML =
        `👑 Eindbaas Rush voltooid! Alle ${totalBosses} bosses van Wereld ${bossRushWorld} verslagen.`;
    } else {
      document.getElementById('msgText').innerHTML =
        `Eindbaas Rush mislukt — ${bossRushIndex}/${totalBosses} bosses van Wereld ${bossRushWorld} verslagen voordat je stierf.`;
    }
    updateHUD();
    msgBtn.textContent = 'Opnieuw proberen';
    msgBtn.onclick = () => { startBossRush(); };
  } else if (dronePracticeActive) {
    document.getElementById('msgText').innerHTML =
      `Drone-testpotje beëindigd<br><span style="font-size:18px; color:#aaa;">Geen score, geen bosses, geen munten — puur de drone bekijken.</span>`;
    msgBtn.textContent = 'Opnieuw testen';
    msgBtn.onclick = () => { startDronePractice(dronePracticeLevel); };
  } else if (weaponPracticeActive) {
    document.getElementById('msgText').innerHTML =
      `Oefensessie beëindigd<br><span style="font-size:18px; color:#aaa;">Geen score, geen bosses, geen munten — puur oefenen.</span>`;
    msgBtn.textContent = 'Opnieuw oefenen';
    msgBtn.onclick = () => { startWeaponPractice(practiceWeaponId); };
  } else if (transformPracticeActive) {
    document.getElementById('msgText').innerHTML =
      `Oefensessie beëindigd<br><span style="font-size:18px; color:#aaa;">Geen score, geen bosses, geen munten — puur oefenen.</span>`;
    msgBtn.textContent = 'Opnieuw oefenen';
    msgBtn.onclick = () => { startTransformPractice(transformPracticeId); };
  } else if (disasterPracticeActive) {
    document.getElementById('msgText').innerHTML =
      `Oefensessie beëindigd<br><span style="font-size:18px; color:#aaa;">Geen score, geen bosses, geen munten — puur oefenen tegen de natuurramp.</span>`;
    msgBtn.textContent = 'Opnieuw oefenen';
    msgBtn.onclick = () => { startDisasterPractice(disasterPracticeType); };
  } else if (skinPracticeActive) {
    document.getElementById('msgText').innerHTML =
      `Oefensessie beëindigd<br><span style="font-size:18px; color:#aaa;">Geen score, geen bosses, geen munten — puur oefenen met deze skin.</span>`;
    msgBtn.textContent = 'Opnieuw oefenen';
    msgBtn.onclick = () => { equippedSkin = previousEquippedSkin; startSkinPractice(skinPracticeId); };
  } else if (gameMode === 'sprint') {
    const isNewHigh = score > highScoreSprint;
    if (isNewHigh) {
      highScoreSprint = score;
      localStorage.setItem('botShooterHighScoreSprint', highScoreSprint);
    }
    document.getElementById('msgText').innerHTML =
      `⏱ Tijd is om! Golfsprint-score: ${score}` +
      (isNewHigh ? `<br><span style="color:#ffd60a; font-size:22px;">Nieuwe highscore!</span>` : `<br><span style="font-size:18px; color:#aaa;">Highscore: ${highScoreSprint}</span>`);
    checkAchievements();
    updateHUD();
    msgBtn.textContent = 'Opnieuw sprinten';
    msgBtn.onclick = restartGame;
  } else if (gameMode === 'endless' || gameMode === 'hardcore') {
    const isHardcore = gameMode === 'hardcore';
    let currentHigh = currentWorld === 2 ? highScoreWorld2 : (isHardcore ? highScoreHardcore : highScore);
    if (score > currentHigh) {
      currentHigh = score;
      if (currentWorld === 2) {
        highScoreWorld2 = score;
        localStorage.setItem('botShooterHighScoreWorld2', highScoreWorld2);
      } else if (isHardcore) {
        highScoreHardcore = score;
        localStorage.setItem('botShooterHighScoreHardcore', highScoreHardcore);
      } else {
        highScore = score;
        localStorage.setItem('botShooterHighScore', highScore);
      }
    }
    checkAchievements();
    updateHUD();
    const isNewHigh = score >= currentHigh && score > 0;
    const modeLabel = isHardcore ? '☠️ Hardcore' : 'Endless';
    document.getElementById('msgText').innerHTML =
      `Game over (${modeLabel})! Score: ${score}` +
      (isNewHigh ? `<br><span style="color:#ffd60a; font-size:22px;">Nieuwe highscore!</span>` : `<br><span style="font-size:18px; color:#aaa;">Highscore: ${currentHigh}</span>`);
    msgBtn.textContent = 'Opnieuw spelen';
    msgBtn.onclick = restartGame;
  } else {
    if (currentLevel > highLevel) {
      highLevel = currentLevel;
      localStorage.setItem('botShooterHighLevel', highLevel);
    }
    document.getElementById('msgText').innerHTML =
      `Game over op level ${currentLevel}<br><span style="font-size:18px; color:#aaa;">Beste level: ${highLevel}</span>`;
    msgBtn.textContent = 'Opnieuw vanaf level 1';
    msgBtn.onclick = () => { initGame(); };
  }
  document.getElementById('msgMenuBtn').style.display = 'block';
  document.getElementById('msg').style.display = 'flex';
}

function levelComplete() {
  levelTransition = true;
  if (currentLevel > highLevel) {
    highLevel = currentLevel;
    localStorage.setItem('botShooterHighLevel', highLevel);
  }
  const msgBtn = document.getElementById('msgBtn');
  document.getElementById('msgText').innerHTML =
    `Level ${currentLevel} voltooid!<br><span style="font-size:18px; color:#aaa;">Volgende: level ${currentLevel + 1}</span>`;
  msgBtn.textContent = 'Volgende level';
  msgBtn.onclick = () => {
    currentLevel++;
    player.hp = player.maxHp; // volle HP bij start nieuw level
    setupNextLevel();
  };
  document.getElementById('msgMenuBtn').style.display = 'none';
  document.getElementById('msg').style.display = 'flex';
}

function restartGame() {
  initGame();
}
window.restartGame = restartGame;

function goToMenu() {
  gameOver = true;
  isPaused = false;
  practiceWeaponId = null;
  weaponPracticeActive = false;
  transformPracticeActive = false;
  disasterPracticeActive = false;
  disasterPracticeType = null;
  dronePracticeActive = false;
  powerupPreviewActive = false;
  powerupPreviewId = null;
  bossRushActive = false;
  exitSkinPractice();
  syncCurrentAccountSave();
  document.getElementById('pauseOverlay').style.display = 'none';
  cancelPendingBossWarning();
  const alertEl = document.getElementById('bossAlert');
  if (alertEl) alertEl.style.display = 'none';
  document.getElementById('msg').style.display = 'none';
  if (currentWorld === 2) {
    document.getElementById('world2Coins').textContent = coins;
    document.getElementById('world2Cores').textContent = elementalCores;
    document.getElementById('world2Screen').style.display = 'flex';
  } else {
    document.getElementById('startCoins').textContent = coins;
    document.getElementById('startScreen').style.display = 'flex';
  }
  // Een bericht, een munten/cores-cadeau of een blokkade van een admin hoeft niet te wachten tot de
  // volgende keer inloggen — check ze ook elke keer dat je terugkeert naar het hoofdmenu. Eerst de
  // blokkade-check afwachten en de rest pas daarna starten: anders kan een berichtoverlay nog even
  // boven het blokkade-scherm verschijnen als applyPendingMessages() net iets sneller klaar is.
  if (currentUid) {
    const uidAtMenuReturn = currentUid; // vastleggen op dit moment, niet pas na de (asynchrone) blokkade-check
    checkIfBanned(uidAtMenuReturn).then(banned => {
      if (banned) return;
      applyPendingMessages(uidAtMenuReturn);
      applyPendingGrants(uidAtMenuReturn);
      applyPendingWeaponRemovals(uidAtMenuReturn);
      applyPendingWeaponGrants(uidAtMenuReturn);
      applyPendingSkinGrants(uidAtMenuReturn);
      applyPendingSkinRemovals(uidAtMenuReturn);
    });
  }
}
window.goToMenu = goToMenu;

function togglePause() {
  if (gameOver) return;
  isPaused = !isPaused;
  const overlay = document.getElementById('pauseOverlay');
  const btn = document.getElementById('pauseBtn');
  if (isPaused) {
    overlay.style.display = 'flex';
    if (btn) btn.textContent = '▶ Hervat';
    renderPauseWeaponSwitchBtn();
  } else {
    overlay.style.display = 'none';
    if (btn) btn.textContent = '⏸ Pauze';
  }
}
window.togglePause = togglePause;

