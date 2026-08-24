function update() {
  if (gameOver || levelTransition || isPaused) return;

  // Player movement
  const now0 = performance.now();
  player.speed = now0 < player.boostUntil ? player.baseSpeed * 1.8 : player.baseSpeed;
  if (now0 < player.slowUntil) player.speed *= 0.5;

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
  if (now0 >= player.rootedUntil) {
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;
  }
  const len = Math.hypot(dx, dy) || 1;
  player.x += (dx/len) * player.speed;
  player.y += (dy/len) * player.speed;
  player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
  player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));
  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  if (keys[' '] || keys['mouse']) shoot();

  // Bots move toward player + shoot occasionally
  const now = performance.now();
  bots.forEach(bot => {
    if (now < bot.frozenUntil) return; // bevroren, geen actie
    if (bot.poisonUntil && now < bot.poisonUntil) {
      if (!bot.lastPoisonTick || now - bot.lastPoisonTick > 400) {
        bot.lastPoisonTick = now;
        damageBotSimple(bot, 1, '#7ed957');
        if (bot.dead) return;
      }
    }
    if (now < player.invisibleUntil) return; // bots merken de speler niet op
    const bdx = player.x - bot.x;
    const bdy = player.y - bot.y;
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
        botShoot(bot);
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

    if (bot.pattern === 'phantom') {
      // phantom: teleporteert vlak naast de speler en valt aan met een mes
      if (now - bot.lastShot > bot.shootCooldown * cooldownMult && bdist < 700) {
        bot.lastShot = now;
        const ang = Math.random() * Math.PI * 2;
        const dist = bot.r + player.r + 6;
        bot.x = Math.max(bot.r, Math.min(canvas.width - bot.r, player.x + Math.cos(ang) * dist));
        bot.y = Math.max(bot.r, Math.min(canvas.height - bot.r, player.y + Math.sin(ang) * dist));
        spawnParticles(bot.x, bot.y, bot.color);
        meleeAttack(bot);
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
        mortarStrike(bot);
      }
      return;
    }

    if (bot.pattern === 'sentinellaser') {
      // sentinel: houdt afstand en vuurt periodiek een dodelijke, getelegrafeerde laserstraal
      if (bdist > 220) {
        bot.x += (bdx/bdist) * bot.speed * speedMult;
        bot.y += (bdy/bdist) * bot.speed * speedMult;
      }
      if (now - bot.lastShot > bot.shootCooldown * cooldownMult && bdist < 650) {
        bot.lastShot = now;
        bossLaserSweep(bot);
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
        mineDrop(bot);
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
        shockBolt(bot);
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
        gasCloudDrop(bot);
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
        if (now < player.stunUntil) {
          bot.stunUntil = Math.max(bot.stunUntil || 0, now + 1500);
        } else {
          shieldBash(bot);
        }
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
        broodSummon(bot);
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
        gravityWellCast(bot);
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
        freezeTrap(bot);
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
        railgunSnipe(bot);
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
        curseBolt(bot);
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
        clusterBombardment(bot);
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
        botShoot(bot);
      }
      // Special 1 - Schokgolf: alle bosses hebben deze, geschaald via specialDmg
      if (now - (bot.specialALastUsed || 0) > (bot.specialACooldown || 7000)) {
        bot.specialALastUsed = now;
        bossSlam(bot);
      }
      // Special 2 - uniek per boss-type
      if (now - (bot.specialBLastUsed || 0) > (bot.specialBCooldown || 9000)) {
        bot.specialBLastUsed = now;
        if (bot.type === 'colossus') bossBulletStorm(bot);
        else if (bot.type === 'titan') bossMeteorShower(bot);
        else if (bot.type === 'behemoth') bossLaserSweep(bot);
        else if (bot.type === 'nemesis') bossDoomSpiral(bot);
        else if (bot.type === 'leviathan') bossWaterStrike(bot);
        else if (bot.type === 'abomination') bossChaosBurst(bot);
      }
      // Special 3 - Nemesis, Leviathan, Abomination
      if (bot.specialCCooldown && now - (bot.specialCLastUsed || 0) > bot.specialCCooldown) {
        bot.specialCLastUsed = now;
        if (bot.type === 'nemesis') bossCrossLaser(bot);
        else if (bot.type === 'leviathan') bossWaterStrike(bot);
        else if (bot.type === 'abomination') bossSpawnMinions(bot);
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
        if (now < player.stunUntil) {
          bot.stunUntil = Math.max(bot.stunUntil || 0, now + 1500);
        } else {
          meleeAttack(bot);
        }
      }
    } else if (now - bot.lastShot > bot.shootCooldown * cooldownMult && bdist < 600) {
      bot.lastShot = now;
      if (now < player.stunUntil) {
        bot.stunUntil = Math.max(bot.stunUntil || 0, now + 1500);
      } else {
        botShoot(bot);
      }
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
    b.y > -20 && b.y < canvas.height + 20
  );

  // Bullet-bot collisions
  bullets.forEach(b => {
    if (b.owner !== 'player') return;
    bots.forEach(bot => {
      if (bot.dead) return;
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
          setTimeout(() => {
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

        // Volt Caster: kogel slaat over naar een nabije bot
        if (b.effect === 'chainLightning') {
          let nearest = null, nearestDist = 140;
          bots.forEach(other => {
            if (other === bot || other.dead) return;
            const dd = Math.hypot(bot.x - other.x, bot.y - other.y);
            if (dd < nearestDist) { nearest = other; nearestDist = dd; }
          });
          if (nearest) {
            const chainDmg = Math.max(1, Math.round((b.dmg || 1) * 0.6));
            nearest.hp -= chainDmg;
            lightningBolts.push({ x1: bot.x, y1: bot.y, x2: nearest.x, y2: nearest.y, born: performance.now() });
            spawnParticles(nearest.x, nearest.y, '#7df9ff');
            if (nearest.hp <= 0 && !nearest.dead && !nearest.immortal) {
              nearest.dead = true;
              score += nearest.isBoss ? 500 : (nearest.maxHp >= 10 ? 40 : nearest.maxHp >= 6 ? 25 : nearest.maxHp >= 3 ? 15 : 10);
              if (gameMode === 'levels') levelKills++;
              if (getArmorStats().vampireHeal) player.hp = Math.min(player.maxHp, player.hp + getArmorStats().vampireHeal);
              if (nearest.isBoss) bossAlive = false;
            }
          }
        }

        if (bot.hp <= 0 && !bot.immortal) {
          bot.dead = true;
          score += bot.isBoss ? 500 : (bot.maxHp >= 10 ? 40 : bot.maxHp >= 6 ? 25 : bot.maxHp >= 3 ? 15 : 10);
          spawnParticles(bot.x, bot.y, bot.color);
          if (gameMode === 'levels') levelKills++;
          if (getArmorStats().vampireHeal) player.hp = Math.min(player.maxHp, player.hp + getArmorStats().vampireHeal);
          if (bot.isBoss) {
            bossAlive = false;
            spawnParticles(bot.x, bot.y, '#ffaa00');
            spawnParticles(bot.x, bot.y, '#ff3838');
          }
          if (bot.poisonSpread) spreadPoison(bot);

          // Cryo Rifle: ijsgolf bevriest bots in de buurt
          if (b.effect === 'freezeKill') {
            const freezeRadius = 100;
            bots.forEach(other => {
              if (other === bot || other.dead) return;
              const dd = Math.hypot(bot.x - other.x, bot.y - other.y);
              if (dd < freezeRadius) other.frozenUntil = performance.now() + 2000;
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

          // Momentum Blade: killstreak opbouwen voor een schademultiplier
          if (b.effect === 'killstreak') {
            player.killStreak = Math.min(10, player.killStreak + 1);
            player.killStreakLastKill = performance.now();
          }

          // Bomber ontploft ook als je hem doodschiet: schade aan bots eromheen
          if (bot.pattern === 'suicide') {
            const boomRadius = 65;
            const boomDmg = 4;
            explosions.push({ x: bot.x, y: bot.y, born: performance.now(), maxR: boomRadius });
            spawnParticles(bot.x, bot.y, '#ff8800');
            spawnParticles(bot.x, bot.y, '#ffcc00');
            bots.forEach(other => {
              if (other === bot || other.dead) return;
              const dd = Math.hypot(bot.x - other.x, bot.y - other.y);
              if (dd < boomRadius) {
                other.hp -= boomDmg;
                spawnParticles(other.x, other.y, other.color);
                if (other.hp <= 0) {
                  other.dead = true;
                  score += other.isBoss ? 500 : (other.maxHp >= 10 ? 40 : other.maxHp >= 6 ? 25 : other.maxHp >= 3 ? 15 : 10);
                  if (gameMode === 'levels') levelKills++;
                  if (getArmorStats().vampireHeal) player.hp = Math.min(player.maxHp, player.hp + getArmorStats().vampireHeal);
                  if (other.isBoss) bossAlive = false;
                }
              }
            });
          }

          // Swarmqueen splitst bij dood in 2 zwakke minions
          if (bot.splits) {
            for (let i = 0; i < 2; i++) {
              const ang = Math.random() * Math.PI * 2;
              const dist = 20 + Math.random() * 15;
              bots.push({
                x: Math.max(10, Math.min(canvas.width - 10, bot.x + Math.cos(ang) * dist)),
                y: Math.max(10, Math.min(canvas.height - 10, bot.y + Math.sin(ang) * dist)),
                r: 10, speed: 2.2, hp: 1, maxHp: 1, lastShot: 0, shootCooldown: 1400,
                color: bot.color, type: 'swarmling', pattern: 'single', bulletSpeed: 5,
                meleeDamage: 0, splits: false, spiralAngle: 0, frozenUntil: 0, slashUntil: 0
              });
            }
            spawnParticles(bot.x, bot.y, bot.color);
          }
        }

        // Splash damage voor explosieve wapens
        if (b.splashRadius) {
          explosions.push({ x: b.x, y: b.y, born: performance.now(), maxR: b.splashRadius });
          spawnParticles(b.x, b.y, '#ff8800');
          spawnParticles(b.x, b.y, '#ffcc00');
          bots.forEach(other => {
            if (other === bot || other.dead) return;
            const dd = Math.hypot(b.x - other.x, b.y - other.y);
            if (dd < b.splashRadius) {
              other.hp -= b.splashDmg;
              spawnParticles(other.x, other.y, other.color);
              if (other.hp <= 0) {
                other.dead = true;
                score += other.isBoss ? 500 : (other.maxHp >= 10 ? 40 : other.maxHp >= 6 ? 25 : other.maxHp >= 3 ? 15 : 10);
                if (gameMode === 'levels') levelKills++;
                if (getArmorStats().vampireHeal) player.hp = Math.min(player.maxHp, player.hp + getArmorStats().vampireHeal);
                if (other.isBoss) bossAlive = false;
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

  // Explosies (bomber): korte uitdijende schokgolf
  explosions = explosions.filter(e => now0 - e.born < 400);
  telegraphs = telegraphs.filter(t => now0 < t.warnUntil);
  lightningBolts = lightningBolts.filter(l => now0 - l.born < 150);
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

  // Momentum Blade: killstreak vervalt als je te lang niet raakt
  if (player.killStreak > 0 && now0 - player.killStreakLastKill > 2500) {
    player.killStreak = 0;
  }

  // Aura: periodic damage rond speler
  if (now0 < player.auraUntil) {
    if (!player.auraLastTick || now0 - player.auraLastTick > 400) {
      player.auraLastTick = now0;
      bots.forEach(bot => {
        if (bot.dead) return;
        const d = Math.hypot(bot.x - player.x, bot.y - player.y);
        if (d < 190) damageBotSimple(bot, 3, '#7fff00');
      });
    }
  }

  // Powerups: spawn periodically (niet tijdens oefenen)
  const powerupInterval = lvlLuckyDrop > 0 ? LUCKY_DROP_INTERVALS[lvlLuckyDrop - 1] : 6000;
  if (gameMode !== 'practice' && !weaponPracticeActive && !transformPracticeActive && now - lastPowerupSpawn > powerupInterval && powerups.length < 2) {
    lastPowerupSpawn = now;
    if (Math.random() < 0.7) spawnPowerup();
  }
  // Powerups: expire after their lifetime
  powerups = powerups.filter(p => now - p.bornAt < p.life);
  // Powerups: pickup by player
  const boostDurMult = 1 + lvlLongBoosts * LONG_BOOSTS_MULT_PER_LEVEL;
  const pickupBonus = lvlMagnet * MAGNET_RADIUS_PER_LEVEL + (lvlGoldRush > 0 ? GOLD_RUSH_RADIUS[lvlGoldRush - 1] : 0);
  powerups.forEach(p => {
    const d = Math.hypot(player.x - p.x, player.y - p.y);
    if (d < player.r + p.r + pickupBonus) {
      p.collected = true;
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
        const maxShields = lvlMultiShield > 0 ? [2, 3, 4][lvlMultiShield - 1] : 1;
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
          bot.hp -= nukeDmg;
          spawnParticles(bot.x, bot.y, '#ff8800');
          if (bot.hp <= 0 && !bot.immortal) {
            bot.dead = true;
            score += bot.maxHp >= 10 ? 40 : bot.maxHp >= 6 ? 25 : bot.maxHp >= 3 ? 15 : 10;
            if (gameMode === 'levels') levelKills++;
            if (getArmorStats().vampireHeal) player.hp = Math.min(player.maxHp, player.hp + getArmorStats().vampireHeal);
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
      }
    }
  });
  powerups = powerups.filter(p => !p.collected);

  // Coins: spawn periodically (niet tijdens oefenen)
  if (gameMode !== 'practice' && !weaponPracticeActive && !transformPracticeActive && now - lastCoinSpawn > 4000 && coinPickups.length < 2) {
    lastCoinSpawn = now;
    spawnCoinPickup();
  }
  coinPickups = coinPickups.filter(c => now - c.bornAt < c.life);
  coinPickups.forEach(c => {
    const d = Math.hypot(player.x - c.x, player.y - c.y);
    if (d < player.r + c.r + pickupBonus) {
      c.collected = true;
      coins += Math.round(c.value * (getArmorStats().coinMult || 1)) + (lvlCoinRain > 0 ? COIN_RAIN_BONUSES[lvlCoinRain - 1] : 0);
      saveShopState();
      spawnParticles(c.x, c.y, '#ffd60a');
    }
  });
  coinPickups = coinPickups.filter(c => !c.collected);

  // Spawn new bots gradually (niet tijdens oefenen — daar is maar 1 bot)
  if (gameMode === 'levels') {
    const cfg = levelConfig(currentLevel);
    const spawnedSoFar = levelKills + bots.length;
    if (spawnedSoFar < cfg.target && bots.length < cfg.maxBots && now - lastLevelSpawn > cfg.spawnInterval) {
      lastLevelSpawn = now;
      spawnBot();
    }
    if (levelKills >= levelTarget && bots.length === 0) {
      levelComplete();
      return;
    }
  } else if (gameMode === 'endless' || gameMode === 'hardcore') {
    if (bots.length < 3 + Math.floor(score / 50)) {
      if (Math.random() < 0.015) spawnBot();
    }
  }

  // Bosses: verschijnen elk precies één keer per potje, in endless via score en in levels via level (niet tijdens oefenen)
  if (gameMode !== 'practice' && !weaponPracticeActive && !transformPracticeActive && !bossAlive && !bossWarningActive) {
    const nextBoss = BOSS_TYPES.find(b => !bossesSpawned[b.name] &&
      (gameMode === 'levels' ? currentLevel >= b.minLevel : score >= b.minScore));
    if (nextBoss) triggerBossWarning(nextBoss);
  }

  if (lvlSecondWind > 0 && !player.secondWindUsed && player.hp > 0 && player.hp / player.maxHp < 0.5) {
    player.secondWindUsed = true;
    player.hp = Math.min(player.maxHp, player.hp + SECOND_WIND_HEALS[lvlSecondWind - 1]);
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
      player.baseSpeed = 3.5 * (1 + lvlSprint * SPRINT_PER_LEVEL);
      player.maxHp = 100 + getArmorStats().hpBonus + lvlExtraHp * EXTRA_HP_PER_LEVEL;
      player.hp = Math.min(player.maxHp, TRANSFORM_REVIVE_HP);
      player.shieldUntil = now0 + 1500; // korte adempauze na de transformatie
      spawnParticles(player.x, player.y, '#4cd964');
      spawnParticles(player.x, player.y, '#ffffff');
    } else if (hasRevive && !player.reviveUsed) {
      player.reviveUsed = true;
      player.hp = player.maxHp * REVIVE_HEAL_PCT;
      player.shieldUntil = now0 + 1500; // korte adempauze na reanimatie
      spawnParticles(player.x, player.y, '#4cd964');
    } else {
      endGame(false);
    }
  }

  updateHUD();
}

function endGame(won) {
  gameOver = true;
  const msgBtn = document.getElementById('msgBtn');
  if (weaponPracticeActive) {
    document.getElementById('msgText').innerHTML =
      `Oefensessie beëindigd<br><span style="font-size:18px; color:#aaa;">Geen score, geen bosses, geen munten — puur oefenen.</span>`;
    msgBtn.textContent = 'Opnieuw oefenen';
    msgBtn.onclick = () => { startWeaponPractice(practiceWeaponId); };
  } else if (transformPracticeActive) {
    document.getElementById('msgText').innerHTML =
      `Oefensessie beëindigd<br><span style="font-size:18px; color:#aaa;">Geen score, geen bosses, geen munten — puur oefenen.</span>`;
    msgBtn.textContent = 'Opnieuw oefenen';
    msgBtn.onclick = () => { startTransformPractice(transformPracticeId); };
  } else if (gameMode === 'endless' || gameMode === 'hardcore') {
    const isHardcore = gameMode === 'hardcore';
    let currentHigh = isHardcore ? highScoreHardcore : highScore;
    if (score > currentHigh) {
      currentHigh = score;
      if (isHardcore) {
        highScoreHardcore = score;
        localStorage.setItem('botShooterHighScoreHardcore', highScoreHardcore);
      } else {
        highScore = score;
        localStorage.setItem('botShooterHighScore', highScore);
      }
    }
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
  syncCurrentAccountSave();
  document.getElementById('pauseOverlay').style.display = 'none';
  bossWarningActive = false;
  const alertEl = document.getElementById('bossAlert');
  if (alertEl) alertEl.style.display = 'none';
  document.getElementById('msg').style.display = 'none';
  document.getElementById('startCoins').textContent = coins;
  document.getElementById('startScreen').style.display = 'flex';
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
  } else {
    overlay.style.display = 'none';
    if (btn) btn.textContent = '⏸ Pauze';
  }
}
window.togglePause = togglePause;

