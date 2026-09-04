// ---- 2-Speler Co-op: het daadwerkelijke gedeelde potje (fase 2, bouwt voort op de lobby uit coop.js) ----
// Architectuur: host-gezaghebbend. De host draait de hele simulatie (spelers bewegen, bots spawnen en
// vallen aan, botsingen, schade) lokaal, exact zoals het enkele-speler-spel dat al deed — maar dan met
// meerdere spelers. Gasten sturen alleen hun invoer (bewegingsrichting, mikhoek, schiet-ja/nee) naar de
// host via Firestore, en tekenen op hun eigen scherm simpelweg wat de host terugstuurt. Dit is bewust
// een eigen, simpele simulatie los van combat.js/update.js/render.js (die gaan overal nog uit van
// precies 1 speler) — een volledige omzetting van het hele enkele-speler-spel naar N spelers zou een
// veel grotere en risicovollere herschrijving zijn.
//
// Bekende beperkingen van deze eerste versie (kunnen later uitgebreid worden):
// - Iedereen vecht met hetzelfde simpele standaardwapen, niet je eigen uitgeruste wapen/upgrades.
// - Alleen toetsenbord+muis, geen touch-besturing.
// - Geen client-side prediction: je eigen bewegingen op een gast-scherm voelen iets vertraagd
//   (moeten heen-en-weer via Firestore naar de host en terug).

const COOP_ARENA_MARGIN = 20;
const COOP_TICK_MS = 1000 / 30; // host-simulatie draait op 30 ticks/sec (lichter dan de 60 van singleplayer)
const COOP_STATE_PUSH_MS = 120; // hoe vaak de host een snapshot naar Firestore schrijft
const COOP_INPUT_PUSH_MS = 100; // hoe vaak een gast zijn invoer naar Firestore schrijft
const COOP_PLAYER_R = 18;
const COOP_PLAYER_SPEED = 4.2;
const COOP_PLAYER_MAX_HP = 100;
const COOP_WEAPON = { dmg: 2, cooldownMs: 220, bulletSpeed: 10, bulletR: 4 }; // iedereen deelt dit simpele standaardwapen
const COOP_MAX_BOTS_SENT = 40;
const COOP_MAX_BULLETS_SENT = 60;
const COOP_PLAYER_COLORS = ['#4cc9f0', '#ff5cf1', '#c3e600'];

const COOP_BOT_TYPES = [
  { type: 'chaser', hp: 14, speed: 1.7, r: 15, color: '#ff5c5c', meleeDmg: 8, meleeCooldown: 700, scoreValue: 10 },
  { type: 'shooter', hp: 10, speed: 1.0, r: 13, color: '#ffb703', dmg: 5, shootCooldown: 1500, keepDist: 260, bulletSpeed: 5, scoreValue: 15 }
];

// ---- Gedeelde toestand ----
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
        y: coopCanvas.height / 2,
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
    p.x += p.inputMoveX * COOP_PLAYER_SPEED * (dt / 16.67);
    p.y += p.inputMoveY * COOP_PLAYER_SPEED * (dt / 16.67);
    p.x = Math.max(COOP_ARENA_MARGIN + COOP_PLAYER_R, Math.min(coopCanvas.width - COOP_ARENA_MARGIN - COOP_PLAYER_R, p.x));
    p.y = Math.max(COOP_ARENA_MARGIN + COOP_PLAYER_R, Math.min(coopCanvas.height - COOP_ARENA_MARGIN - COOP_PLAYER_R, p.y));
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

  // Bots spawnen
  const spawnInterval = Math.max(500, 1100 - coopSim.score * 2);
  if (now - coopSim.lastBotSpawn > spawnInterval && coopSim.bots.length < 25) {
    coopSim.lastBotSpawn = now;
    coopSpawnBot();
  }

  // Bots bewegen/aanvallen
  coopSim.bots.forEach(bot => {
    if (alivePlayers.length === 0) return;
    let nearest = alivePlayers[0], nd = Math.hypot(alivePlayers[0].x - bot.x, alivePlayers[0].y - bot.y);
    alivePlayers.forEach(p => {
      const d = Math.hypot(p.x - bot.x, p.y - bot.y);
      if (d < nd) { nd = d; nearest = p; }
    });
    const dx = nearest.x - bot.x, dy = nearest.y - bot.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (bot.type === 'chaser') {
      if (dist > bot.r + COOP_PLAYER_R - 4) {
        bot.x += (dx / dist) * bot.speed * (dt / 16.67);
        bot.y += (dy / dist) * bot.speed * (dt / 16.67);
      } else if (now - (bot.lastAttack || 0) > bot.meleeCooldown) {
        bot.lastAttack = now;
        coopDamagePlayer(nearest, bot.meleeDmg);
      }
    } else if (bot.type === 'shooter') {
      if (dist > bot.keepDist + 20) {
        bot.x += (dx / dist) * bot.speed * (dt / 16.67);
        bot.y += (dy / dist) * bot.speed * (dt / 16.67);
      } else if (dist < bot.keepDist - 20) {
        bot.x -= (dx / dist) * bot.speed * (dt / 16.67);
        bot.y -= (dy / dist) * bot.speed * (dt / 16.67);
      }
      if (now - (bot.lastAttack || 0) > bot.shootCooldown) {
        bot.lastAttack = now;
        coopSim.bullets.push({
          id: coopSim.nextId++, owner: 'bot',
          x: bot.x, y: bot.y,
          vx: (dx / dist) * bot.bulletSpeed, vy: (dy / dist) * bot.bulletSpeed,
          r: 5, dmg: bot.dmg, color: bot.color
        });
      }
    }
  });

  // Kogels bewegen + botsingen
  const stepMult = dt / 16.67;
  coopSim.bullets.forEach(b => { b.x += b.vx * stepMult; b.y += b.vy * stepMult; });
  coopSim.bullets = coopSim.bullets.filter(b => b.x > -20 && b.x < coopCanvas.width + 20 && b.y > -20 && b.y < coopCanvas.height + 20);

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
  const def = COOP_BOT_TYPES[Math.floor(Math.random() * COOP_BOT_TYPES.length)];
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  if (edge === 0) { x = Math.random() * coopCanvas.width; y = -20; }
  else if (edge === 1) { x = coopCanvas.width + 20; y = Math.random() * coopCanvas.height; }
  else if (edge === 2) { x = Math.random() * coopCanvas.width; y = coopCanvas.height + 20; }
  else { x = -20; y = Math.random() * coopCanvas.height; }
  coopSim.bots.push({ id: coopSim.nextId++, ...def, x, y, maxHp: def.hp, lastAttack: 0 });
}

function coopPushHostState() {
  if (!coopLobbyCode) return;
  const players = {};
  Object.keys(coopSim.players).forEach(uid => {
    const p = coopSim.players[uid];
    players[uid] = { x: Math.round(p.x), y: Math.round(p.y), angle: p.angle, hp: p.hp, maxHp: p.maxHp, name: p.name, color: p.color, alive: p.alive };
  });
  const bots = coopSim.bots.slice(0, COOP_MAX_BOTS_SENT).map(b => ({ x: Math.round(b.x), y: Math.round(b.y), hp: b.hp, maxHp: b.maxHp, r: b.r, color: b.color }));
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

// ---- Gedeelde rendering (host tekent zijn eigen coopSim, gast tekent de laatste ontvangen snapshot) ----
function coopRenderFrame(state) {
  coopCtx.clearRect(0, 0, coopCanvas.width, coopCanvas.height);
  coopCtx.fillStyle = '#16213e';
  coopCtx.fillRect(0, 0, coopCanvas.width, coopCanvas.height);

  const bots = state.bots || [];
  bots.forEach(bot => {
    coopCtx.beginPath();
    coopCtx.fillStyle = bot.color || '#ff5c5c';
    coopCtx.arc(bot.x, bot.y, bot.r || 14, 0, Math.PI * 2);
    coopCtx.fill();
    if (bot.maxHp) {
      const w = (bot.r || 14) * 2;
      coopCtx.fillStyle = '#333';
      coopCtx.fillRect(bot.x - w / 2, bot.y - (bot.r || 14) - 10, w, 4);
      coopCtx.fillStyle = '#4cd964';
      coopCtx.fillRect(bot.x - w / 2, bot.y - (bot.r || 14) - 10, w * Math.max(0, bot.hp / bot.maxHp), 4);
    }
  });

  const bullets = state.bullets || [];
  bullets.forEach(b => {
    coopCtx.beginPath();
    coopCtx.fillStyle = b.color || '#fff';
    coopCtx.arc(b.x, b.y, b.r || 4, 0, Math.PI * 2);
    coopCtx.fill();
  });

  const players = state.players || {};
  Object.values(players).forEach(p => {
    if (!p.alive) return;
    coopCtx.save();
    coopCtx.translate(p.x, p.y);
    coopCtx.rotate(p.angle || 0);
    coopCtx.fillStyle = p.color || '#4cc9f0';
    coopCtx.beginPath();
    coopCtx.arc(0, 0, COOP_PLAYER_R, 0, Math.PI * 2);
    coopCtx.fill();
    coopCtx.fillStyle = '#fff';
    coopCtx.fillRect(COOP_PLAYER_R - 6, -3, 14, 6); // richting-'loop'
    coopCtx.restore();
    coopCtx.fillStyle = '#fff';
    coopCtx.font = '13px Segoe UI';
    coopCtx.textAlign = 'center';
    coopCtx.fillText(p.name || '?', p.x, p.y - COOP_PLAYER_R - 22);
    const w = COOP_PLAYER_R * 2.2;
    coopCtx.fillStyle = '#333';
    coopCtx.fillRect(p.x - w / 2, p.y - COOP_PLAYER_R - 16, w, 5);
    coopCtx.fillStyle = p.hp / p.maxHp > 0.3 ? '#4cd964' : '#ff5c5c';
    coopCtx.fillRect(p.x - w / 2, p.y - COOP_PLAYER_R - 16, w * Math.max(0, p.hp / p.maxHp), 5);
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
  document.getElementById('coopMatchScreen').style.display = 'none';
  document.getElementById('coopMatchOverlay').style.display = 'none';
  document.getElementById(menuScreenId()).style.display = 'flex';
  // De lobby zelf (en de speler-/inputdocumenten) definitief opruimen
  await leaveCoopLobby();
}
window.leaveCoopMatch = leaveCoopMatch;
