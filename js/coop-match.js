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
// Overige bekende beperkingen van deze versie:
// - Spelers zelf zijn nog simpele gekleurde bolletjes, nog niet met hun eigen echte skin.
// - Iedereen vecht met hetzelfde simpele standaardwapen, niet je eigen uitgeruste wapen/upgrades.
// - Alleen toetsenbord+muis, geen touch-besturing.
// - Geen client-side prediction: je eigen bewegingen op een gast-scherm voelen iets vertraagd.

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
  document.getElementById('coopLobbyScreen').style.display = 'none';
  document.getElementById('coopMatchScreen').style.display = 'block';
  document.getElementById('coopMatchOverlay').style.display = 'none';
  coopSim = { players: {}, bots: [], bullets: [], score: 0, lastBotSpawn: 0, nextId: 1, status: 'playing' };
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
        inputMoveX: 0, inputMoveY: 0, firing: false
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
  db.collection('lobbies').doc(coopLobbyCode).collection('inputs').doc(currentUid)
    .set({ moveX: input.moveX, moveY: input.moveY, aimAngle, firing: input.firing, ts: Date.now() })
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
  }

  const alivePlayers = Object.values(coopSim.players).filter(p => p.alive);

  // Spelers bewegen + schieten
  Object.values(coopSim.players).forEach(p => {
    if (!p.alive) return;
    p.x += p.inputMoveX * COOP_PLAYER_SPEED * stepMult;
    p.y += p.inputMoveY * COOP_PLAYER_SPEED * stepMult;
    p.x = Math.max(COOP_ARENA_MARGIN + COOP_PLAYER_R, Math.min(canvas.width - COOP_ARENA_MARGIN - COOP_PLAYER_R, p.x));
    p.y = Math.max(COOP_ARENA_MARGIN + COOP_PLAYER_R, Math.min(canvas.height - COOP_ARENA_MARGIN - COOP_PLAYER_R, p.y));
    if (p.firing && now - p.lastShot > COOP_WEAPON.cooldownMs) {
      p.lastShot = now;
      coopSim.bullets.push({
        id: coopSim.nextId++, owner: 'player',
        x: p.x + Math.cos(p.angle) * (COOP_PLAYER_R + 6), y: p.y + Math.sin(p.angle) * (COOP_PLAYER_R + 6),
        vx: Math.cos(p.angle) * COOP_WEAPON.bulletSpeed, vy: Math.sin(p.angle) * COOP_WEAPON.bulletSpeed,
        r: COOP_WEAPON.bulletR, dmg: COOP_WEAPON.dmg, color: p.color
      });
    }
  });

  // Bots spawnen — uit de ECHTE BOT_TYPES-roster (player.js), zodat ze er straks ook echt zo uitzien
  const spawnInterval = Math.max(500, 1100 - coopSim.score * 2);
  if (now - coopSim.lastBotSpawn > spawnInterval && coopSim.bots.length < 25) {
    coopSim.lastBotSpawn = now;
    coopSpawnBot();
  }

  // Bots bewegen/aanvallen — vier simpele gedragsgroepen op basis van het echte pattern-veld
  coopSim.bots.forEach(bot => {
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
        coopDamagePlayer(nearest, bot.meleeDmg);
      }
    } else if (COOP_SUICIDE_PATTERNS.includes(bot.pattern)) {
      if (dist > bot.r + COOP_PLAYER_R + 6) {
        bot.x += (dx / dist) * bot.speed * stepMult;
        bot.y += (dy / dist) * bot.speed * stepMult;
      } else {
        coopDamagePlayer(nearest, bot.meleeDmg || 30);
        bot.dead = true;
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
          if (bot.hp <= 0) { bot.dead = true; coopSim.score += bot.scoreValue; }
        }
      });
    } else {
      alivePlayers.forEach(p => {
        if (b.hit) return;
        if (Math.hypot(b.x - p.x, b.y - p.y) < b.r + COOP_PLAYER_R) {
          b.hit = true;
          coopDamagePlayer(p, b.dmg);
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

function coopDamagePlayer(p, dmg) {
  p.hp -= dmg;
  if (p.hp <= 0) { p.hp = 0; p.alive = false; }
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
    scoreValue: Math.max(5, def.hp)
  });
}

function coopPushHostState() {
  if (!coopLobbyCode) return;
  const players = {};
  Object.keys(coopSim.players).forEach(uid => {
    const p = coopSim.players[uid];
    players[uid] = { x: Math.round(p.x), y: Math.round(p.y), angle: p.angle, hp: p.hp, maxHp: p.maxHp, name: p.name, color: p.color, alive: p.alive };
  });
  const bots = coopSim.bots.slice(0, COOP_MAX_BOTS_SENT).map(b => ({
    x: Math.round(b.x), y: Math.round(b.y), hp: b.hp, maxHp: b.maxHp, r: b.r, color: b.color, type: b.type, pattern: b.pattern,
    frozenUntil: 0, rootedUntil: 0, slashUntil: 0, invulnUntil: 0, immortal: false, isBoss: false
  }));
  const bullets = coopSim.bullets.slice(0, COOP_MAX_BULLETS_SENT).map(b => ({ x: Math.round(b.x), y: Math.round(b.y), r: b.r, color: b.color }));
  db.collection('lobbies').doc(coopLobbyCode).collection('state').doc('live')
    .set({ players, bots, bullets, score: coopSim.score, status: coopSim.status, updatedAt: Date.now() })
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

  // Spelers: nog simpele gekleurde bolletjes (nog geen echte skin — dat is de volgende stap)
  Object.values(players).forEach(p => {
    if (!p.alive) return;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle || 0);
    ctx.fillStyle = p.color || '#4cc9f0';
    ctx.beginPath();
    ctx.arc(0, 0, COOP_PLAYER_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(COOP_PLAYER_R - 6, -3, 14, 6); // richting-'loop'
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
