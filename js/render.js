function lerpColor(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16), b = parseInt(hexB.slice(1), 16);
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t), g = Math.round(ag + (bg - ag) * t), bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function drawIceFloorOverlay() {
  // Natuurramp IJsvloer: de hele vloer is bevroren en glad
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#bfeeff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  const seed = Math.floor(performance.now() / 4000);
  const rng = n => { const x = Math.sin(n * 12.9898 + seed) * 43758.5453; return x - Math.floor(x); };
  for (let i = 0; i < 22; i++) {
    const cx = rng(i) * canvas.width, cy = rng(i + 100) * canvas.height;
    const len = 18 + rng(i + 200) * 22;
    const ang = rng(i + 300) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
    ctx.lineTo(cx + Math.cos(ang + 1) * len * 0.5, cy + Math.sin(ang + 1) * len * 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSandstormOverlay() {
  // Natuurramp Zandstorm: je ziet alleen een klein rondje om jezelf heen, de rest is volledig onzichtbaar
  ctx.save();
  const visionR = 250;
  const grad = ctx.createRadialGradient(player.x, player.y, visionR * 0.5, player.x, player.y, visionR);
  grad.addColorStop(0, 'rgba(60, 48, 28, 0)');
  grad.addColorStop(1, 'rgba(30, 24, 14, 1)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function drawPowerup(p) {
  const pulse = 1 + Math.sin(performance.now() / 150) * 0.1;
  const colors = {
    speed: '#4cc9f0',
    heal: '#4cd964',
    fire: '#ffd60a',
    shield: '#c77dff',
    damage: '#ff3838',
    multishot: '#38ffb0',
    freeze: '#9be3ff',
    nuke: '#ff8800',
    invisible: '#aaaaaa',
    timewarp: '#66ccff',
    ricochet: '#ff8c00',
    homing: '#ff1493',
    stun: '#ffff00',
    aura: '#7fff00',
    overload: '#ff6347',
    chaos: '#c026d3',
    elementstorm: '#ff8800'
  };
  const icons = {
    speed: '⚡',
    heal: '+',
    fire: '🔥',
    shield: '🛡',
    damage: '💥',
    multishot: '✦',
    freeze: '❄',
    nuke: '💣',
    invisible: '👻',
    timewarp: '⏳',
    ricochet: '🔄',
    homing: '🎯',
    stun: '⊗',
    aura: '💫',
    overload: '⚡',
    chaos: '🌀',
    elementstorm: '🔥'
  };
  const col = colors[p.type];
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = col + '40';
  ctx.beginPath(); ctx.arc(0, 0, p.r + 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill();
  if (p.type === 'elementstorm') {
    // gekruiste vuur- en ijsstraal i.p.v. een enkel emoji-icoontje
    const s = p.r * 0.75;
    ctx.lineCap = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ff8800';
    ctx.beginPath();
    ctx.moveTo(-s, -s);
    ctx.lineTo(s, s);
    ctx.stroke();
    ctx.strokeStyle = '#66d9ff';
    ctx.beginPath();
    ctx.moveTo(-s, s);
    ctx.lineTo(s, -s);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icons[p.type], 0, 1);
  }
  ctx.restore();
}

function drawCoinPickup(c) {
  const pulse = 1 + Math.sin(performance.now() / 130) * 0.12;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = 'rgba(255, 214, 10, 0.3)';
  ctx.beginPath(); ctx.arc(0, 0, c.r + 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd60a';
  ctx.beginPath(); ctx.arc(0, 0, c.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#16213e';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', 0, 1);
  ctx.restore();
}

function drawExplosion(e) {
  const age = performance.now() - e.born;
  const t = Math.min(1, age / 400); // 0 -> 1 over 400ms
  const r = e.maxR * t;
  const alpha = 1 - t;
  ctx.save();
  ctx.globalAlpha = alpha;
  const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
  grad.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
  grad.addColorStop(0.4, 'rgba(255, 136, 0, 0.7)');
  grad.addColorStop(1, 'rgba(255, 56, 56, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 200, 80, 0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawFallingMeteor(m) {
  // Natuurramp Meteorenregen: een echte meteoor die uit de lucht valt, even gloeiend blijft liggen en dan langzaam wegtrekt
  const age = performance.now() - m.born;
  ctx.save();
  if (age < m.fallDelay) {
    const t = age / m.fallDelay;
    const startX = m.x - 200;
    const startY = m.y - 420;
    const curX = startX + (m.x - startX) * t;
    const curY = startY + (m.y - startY) * t;
    const tailX = startX + (m.x - startX) * Math.max(0, t - 0.18);
    const tailY = startY + (m.y - startY) * Math.max(0, t - 0.18);
    const grad = ctx.createLinearGradient(tailX, tailY, curX, curY);
    grad.addColorStop(0, 'rgba(255, 136, 0, 0)');
    grad.addColorStop(1, 'rgba(255, 220, 120, 0.9)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(curX, curY);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 136, 0, 0.6)';
    ctx.beginPath();
    ctx.arc(curX, curY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(curX, curY, 9, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const landAge = age - m.fallDelay;
    let alpha = 1;
    let r = m.radius;
    if (landAge > m.lingerDuration) {
      const fadeT = Math.min(1, (landAge - m.lingerDuration) / m.fadeDuration);
      alpha = 1 - fadeT;
      r = m.radius * (1 - fadeT * 0.4);
    }
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(40, 20, 10, 0.5)';
    ctx.beginPath();
    ctx.arc(m.x, m.y, r * 1.8, 0, Math.PI * 2);
    ctx.fill();
    const rockGrad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, r);
    rockGrad.addColorStop(0, '#ffdca0');
    rockGrad.addColorStop(0.5, '#ff8800');
    rockGrad.addColorStop(1, '#3a1d0a');
    ctx.fillStyle = rockGrad;
    ctx.beginPath();
    ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 150, 50, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawIceGrenade(g) {
  // Cryo Rifle special: ijsgranaat die richting het doelwit vliegt
  const age = performance.now() - g.born;
  const t = Math.min(1, age / g.duration);
  const tx = g.target.dead ? g.target.x : g.target.x;
  const ty = g.target.y;
  const x = g.startX + (tx - g.startX) * t;
  const arc = Math.sin(t * Math.PI) * 30; // boogbeweging
  const y = g.startY + (ty - g.startY) * t - arc;
  ctx.save();
  ctx.fillStyle = 'rgba(155, 227, 255, 0.35)';
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9be3ff';
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 1.5, y - 1.5, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawVampBolt(g) {
  // Vamp Cannon special: levenzuigende bloedbolt die richting het doelwit vliegt
  const age = performance.now() - g.born;
  const t = Math.min(1, age / g.duration);
  const tx = g.target.x;
  const ty = g.target.y;
  const x = g.startX + (tx - g.startX) * t;
  const arc = Math.sin(t * Math.PI) * 24; // boogbeweging
  const y = g.startY + (ty - g.startY) * t - arc;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 45, 111, 0.35)';
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff2d6f';
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff6b81';
  ctx.beginPath();
  ctx.arc(x - 1.5, y - 1.5, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStickyThrow(g) {
  // Kleefbom Werper special: kleefbom die richting het doelwit vliegt
  const age = performance.now() - g.born;
  const t = Math.min(1, age / g.duration);
  const tx = g.target.x;
  const ty = g.target.y;
  const x = g.startX + (tx - g.startX) * t;
  const arc = Math.sin(t * Math.PI) * 26; // boogbeweging
  const y = g.startY + (ty - g.startY) * t - arc;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 136, 0, 0.35)';
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff8800';
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.arc(x - 1.5, y - 1.5, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFireballThrow(g) {
  // Pyromancer-transformatie: vuurbal die naar de inslagplek vliegt
  const age = performance.now() - g.born;
  const t = Math.min(1, age / g.duration);
  const x = g.startX + (g.tx - g.startX) * t;
  const arc = Math.sin(t * Math.PI) * 30; // boogbeweging
  const y = g.startY + (g.ty - g.startY) * t - arc;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 136, 0, 0.35)';
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff5500';
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe066';
  ctx.beginPath();
  ctx.arc(x - 1.5, y - 1.5, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFireZone(zone) {
  // Pyromancer-transformatie: brandende grond die bots gedurende een tijdje schade doet
  const pulse = 1 + Math.sin(performance.now() / 100) * 0.08;
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#ff5500';
  ctx.beginPath();
  ctx.arc(zone.x, zone.y, zone.radius * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = '#ffcc00';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(zone.x, zone.y, zone.radius * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawGasCloud(cloud) {
  // Miasma special bot: gifwolk die de speler schade-over-tijd doet
  const age = performance.now() - cloud.born;
  const fade = Math.max(0, 1 - age / cloud.duration);
  const pulse = 1 + Math.sin(performance.now() / 150) * 0.06;
  ctx.save();
  ctx.globalAlpha = 0.3 * fade;
  ctx.fillStyle = '#7ed957';
  ctx.beginPath();
  ctx.arc(cloud.x, cloud.y, cloud.radius * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.5 * fade;
  ctx.strokeStyle = '#c3ff5c';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.arc(cloud.x, cloud.y, cloud.radius * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawBladeTrail(t) {
  // Momentum Blade special: gloeiend spoor van de dash
  const age = performance.now() - t.born;
  const fade = Math.max(0, 1 - age / 250);
  if (fade <= 0) return;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.strokeStyle = '#e0e0ff';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(t.x1, t.y1);
  ctx.lineTo(t.x2, t.y2);
  ctx.stroke();
  ctx.restore();
}

function drawChargeTrail(t) {
  // Juggernaut: dik, uitdovend spoor van de beuk-charge
  const age = performance.now() - t.born;
  const fade = Math.max(0, 1 - age / 300);
  if (fade <= 0) return;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.strokeStyle = '#ff8800';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(t.x1, t.y1);
  ctx.lineTo(t.x2, t.y2);
  ctx.stroke();
  ctx.restore();
}

function drawTurret(turret) {
  // Field Engineer: neergezette geschutskoepel, dooft langzaam uit vlak voor het verdwijnt
  const age = performance.now() - turret.deployedAt;
  const remaining = ENGINEER_TURRET_DURATION - age;
  const alpha = remaining < 800 ? Math.max(0.25, remaining / 800) : 1;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(turret.x, turret.y);
  ctx.fillStyle = 'rgba(76, 201, 240, 0.15)';
  ctx.beginPath();
  ctx.arc(0, 0, ENGINEER_TURRET_RANGE, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(0, 0, ENGINEER_TURRET_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4cc9f0';
  ctx.lineWidth = 2;
  ctx.stroke();
  const spin = performance.now() / 250;
  ctx.save();
  ctx.rotate(spin);
  ctx.fillStyle = '#4cc9f0';
  ctx.fillRect(0, -2.5, 16, 5);
  ctx.restore();
  // HP-balk
  const barW = ENGINEER_TURRET_R * 2;
  const barX = -barW / 2, barY = -ENGINEER_TURRET_R - 10;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(barX, barY, barW, 4);
  ctx.fillStyle = turret.hp / turret.maxHp > 0.5 ? '#4cd964' : turret.hp / turret.maxHp > 0.25 ? '#ffd60a' : '#ff5c5c';
  ctx.fillRect(barX, barY, barW * Math.max(0, turret.hp / turret.maxHp), 4);
  ctx.restore();
}

function drawTelegraph(t) {
  // waarschuwingscirkel van artillery vóór een mortier-inslag
  const pulse = 1 + Math.sin(performance.now() / 60) * 0.06;
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = '#ff3838';
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.arc(t.x, t.y, t.radius * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPlayerBullet(b) {
  const angle = Math.atan2(b.vy, b.vx);
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(angle);
  if (b.isGrenade) {
    // tank: grote handgranaat i.p.v. het uiterlijk van een normaal wapen
    ctx.fillStyle = '#4a5d23';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2e3b16';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#8fae4a';
    ctx.fillRect(-2, -11, 4, 5);
    ctx.restore();
    return;
  }
  if (b.isSniperRound) {
    // sniper mech: lange, felle railgun-streep i.p.v. het uiterlijk van een normaal wapen
    const grad = ctx.createLinearGradient(-16, 0, 8, 0);
    grad.addColorStop(0, 'rgba(255, 224, 102, 0)');
    grad.addColorStop(1, '#ffe066');
    ctx.fillStyle = grad;
    ctx.fillRect(-16, -1.5, 24, 3);
    ctx.restore();
    return;
  }
  if (b.isDrone) {
    // drone hive: klein zelfsturend energiebolletje i.p.v. het uiterlijk van een normaal wapen
    ctx.fillStyle = '#7ee8c1';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#155c46';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    return;
  }
  switch (equippedSkin) {
    case 'muncher': {
      // knabbelpelletje: geel bolletje met hapje eruit
      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0.5, Math.PI * 2 - 0.5);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'ninja': {
      // klein zwaardje
      ctx.fillStyle = '#e8e8e8';
      ctx.beginPath();
      ctx.moveTo(-6, -1.5);
      ctx.lineTo(7, 0);
      ctx.lineTo(-6, 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#4cf5ff';
      ctx.fillRect(-9, -1.5, 3, 3);
      break;
    }
    case 'astronaut': {
      // laserbolt
      ctx.fillStyle = '#8ecbff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
      break;
    }
    case 'robo': {
      // plasma-orb met ring
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffb3b3';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'viking': {
      // kleine bijl
      ctx.fillStyle = '#c0c0c0';
      ctx.beginPath();
      ctx.moveTo(-2, -5); ctx.lineTo(6, -4); ctx.lineTo(6, 4); ctx.lineTo(-2, 5);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5a3418';
      ctx.fillRect(-9, -1.5, 8, 3);
      break;
    }
    case 'pirate': {
      // kanonskogel met vonk
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffb703';
      ctx.beginPath(); ctx.arc(-4, 0, 1.3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'wizard': {
      // magische ster
      const s = 4.5;
      ctx.fillStyle = '#9ef7ff';
      ctx.beginPath();
      ctx.moveTo(0, -s); ctx.lineTo(s * 0.3, -s * 0.3); ctx.lineTo(s, 0); ctx.lineTo(s * 0.3, s * 0.3);
      ctx.lineTo(0, s); ctx.lineTo(-s * 0.3, s * 0.3); ctx.lineTo(-s, 0); ctx.lineTo(-s * 0.3, -s * 0.3);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'dragon': {
      // vuurbal
      const dgrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 5.5);
      dgrad.addColorStop(0, '#fff275'); dgrad.addColorStop(0.6, '#ff8c42'); dgrad.addColorStop(1, '#c8102e');
      ctx.fillStyle = dgrad;
      ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'skeleton': {
      // botje
      ctx.fillStyle = '#eee';
      ctx.fillRect(-6, -1.5, 12, 3);
      ctx.beginPath(); ctx.arc(-6, -2.2, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-6, 2.2, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(6, -2.2, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(6, 2.2, 1.8, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'alien': {
      // groene plasmastraal
      ctx.fillStyle = '#8fd94f';
      ctx.beginPath(); ctx.ellipse(0, 0, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'knight': {
      // zilveren zwaard/lans
      ctx.fillStyle = '#d9d9d9';
      ctx.beginPath();
      ctx.moveTo(-5, -1.3); ctx.lineTo(7, 0); ctx.lineTo(-5, 1.3);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e63946';
      ctx.fillRect(-8, -1.3, 4, 2.6);
      break;
    }
    case 'phoenix': {
      // flikkerende vuurbal
      const flick = 0.85 + Math.sin(performance.now() / 60) * 0.15;
      const pgrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 5.5 * flick);
      pgrad.addColorStop(0, '#fff275'); pgrad.addColorStop(0.5, '#ff8c42'); pgrad.addColorStop(1, '#c8102e');
      ctx.fillStyle = pgrad;
      ctx.beginPath(); ctx.arc(0, 0, 5.5 * flick, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'cosmic': {
      // komeetje met sterren-staart
      ctx.strokeStyle = 'rgba(155,109,255,0.6)';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-11, 0); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, 3.2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'samurai': {
      // rode bladschijf
      ctx.fillStyle = '#c41e3a';
      ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(-1, -6, 2, 12);
      break;
    }
    case 'cyborg': {
      // elektrische puls
      ctx.fillStyle = '#ff00ff';
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'vampire': {
      // bloeddruppel
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(0, -2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-3, 2); ctx.lineTo(0, 5); ctx.lineTo(3, 2); ctx.closePath(); ctx.fill();
      break;
    }
    case 'ghost': {
      // witte spookbol
      ctx.fillStyle = '#f5f5f5';
      ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      break;
    }
    case 'neon': {
      // gloeiende neon-bol
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0ff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'clown': {
      // gekleurde pompoen-bol
      ctx.fillStyle = '#ff6b9d';
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(-2, -4, 4, 2);
      ctx.fillRect(-2, 2, 4, 2);
      break;
    }
    case 'monster': {
      // groen monster-bolletje met bobbels
      ctx.fillStyle = '#228b22';
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#32cd32';
      ctx.beginPath(); ctx.arc(-3, -2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(3, 2, 2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'angel': {
      // gouden ster
      const s = 4;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(0, -s); ctx.lineTo(s * 0.3, -s * 0.3); ctx.lineTo(s, 0); ctx.lineTo(s * 0.3, s * 0.3);
      ctx.lineTo(0, s); ctx.lineTo(-s * 0.3, s * 0.3); ctx.lineTo(-s, 0); ctx.lineTo(-s * 0.3, -s * 0.3);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'demon': {
      // rood vuur-bolletje
      const dgrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 5);
      dgrad.addColorStop(0, '#ff6347');
      dgrad.addColorStop(1, '#8b0000');
      ctx.fillStyle = dgrad;
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'robot_simple': {
      // zilver blokkig bolletje
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(-3, -3, 6, 6);
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.strokeRect(-3, -3, 6, 6);
      break;
    }
    case 'gemstone': {
      // diamant-achtige kristal
      const ggrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 5);
      ggrad.addColorStop(0, '#fff');
      ggrad.addColorStop(1, '#4169e1');
      ctx.fillStyle = ggrad;
      ctx.beginPath();
      ctx.moveTo(0, -5); ctx.lineTo(3.5, 0); ctx.lineTo(0, 5); ctx.lineTo(-3.5, 0); ctx.closePath();
      ctx.fill();
      break;
    }
    case 'mushroom': {
      // rood paddestoel-hoofd
      ctx.fillStyle = '#c41e3a';
      ctx.beginPath(); ctx.arc(0, -2, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#daa520';
      ctx.fillRect(-2, 2, 4, 3);
      break;
    }
    case 'pumpkin': {
      // oranje pompoen-bolletje
      ctx.fillStyle = '#ff8c00';
      ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#228b22';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, -8); ctx.stroke();
      break;
    }
    case 'mummy': {
      // gewikkeld linnen
      ctx.fillStyle = '#d2b48c';
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8b7355';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.arc(0, 0, 2 + i * 1.5, 0, Math.PI * 2); ctx.stroke();
      }
      break;
    }
    case 'werewolf': {
      // bruin haar-bolletje
      ctx.fillStyle = '#4a3728';
      ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8b7355';
      ctx.beginPath(); ctx.arc(-2, -3, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(2, -3, 1.5, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'panda': {
      // zwart-wit pootafdruk
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.arc(-2.5, -2.5, 1.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(2.5, -2.5, 1.3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'unicorn': {
      // regenboog sterretje
      const hueB = (performance.now() / 4) % 360;
      ctx.fillStyle = `hsl(${hueB}, 90%, 65%)`;
      const s = 4;
      ctx.beginPath();
      ctx.moveTo(0, -s); ctx.lineTo(s * 0.3, -s * 0.3); ctx.lineTo(s, 0); ctx.lineTo(s * 0.3, s * 0.3);
      ctx.lineTo(0, s); ctx.lineTo(-s * 0.3, s * 0.3); ctx.lineTo(-s, 0); ctx.lineTo(-s * 0.3, -s * 0.3);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'shark': {
      // vinvormige kogel
      ctx.fillStyle = '#6e8ca0';
      ctx.beginPath();
      ctx.moveTo(5, 0); ctx.lineTo(-4, -3); ctx.lineTo(-2, 0); ctx.lineTo(-4, 3);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'frankenstein': {
      // groene bout-kogel
      ctx.fillStyle = '#6ba05a';
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(-5, -1.2, 3, 2.4);
      ctx.fillRect(2, -1.2, 3, 2.4);
      break;
    }
    case 'cactus': {
      // groene stekelbal
      ctx.fillStyle = '#3fa34d';
      ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 / 6) * i;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 3.5, Math.sin(a) * 3.5);
        ctx.lineTo(Math.cos(a) * 6, Math.sin(a) * 6);
        ctx.stroke();
      }
      break;
    }
    case 'snowman': {
      // sneeuwbal
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c9e6ff';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'discoball': {
      // kleurwisselend discobolletje
      const hueD = (performance.now() / 3) % 360;
      ctx.fillStyle = `hsl(${hueD}, 90%, 70%)`;
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.stroke();
      break;
    }
    case 'turtle': {
      // groen schild-kogeltje
      ctx.fillStyle = '#4a8c3f';
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2e5c28';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 / 6) * i;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 4, Math.sin(a) * 4); ctx.stroke();
      }
      break;
    }
    case 'jester': {
      // paars-gouden ruit
      ctx.fillStyle = '#5b2c8f';
      ctx.beginPath();
      ctx.moveTo(0, -4.5); ctx.lineTo(3.5, 0); ctx.lineTo(0, 4.5); ctx.lineTo(-3.5, 0);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd700';
      ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'cyclops': {
      // gloeiend paars oog
      const glowB = 0.6 + Math.sin(performance.now() / 100) * 0.4;
      ctx.fillStyle = '#7d3cff';
      ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255, 60, 60, ${glowB})`;
      ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'combofire': {
      // vurige kogel die feller gloeit naarmate de killstreak oploopt
      const tF = Math.min(1, player.comboStreak / 10);
      ctx.fillStyle = lerpColor('#3a3a3a', '#ff6a00', tF);
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = lerpColor('#4a4a4a', '#ffe066', tF);
      ctx.beginPath(); ctx.arc(0, 0, 1.8, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'combofrost': {
      // ijzige kogel die feller gloeit naarmate de killstreak oploopt
      const tI = Math.min(1, player.comboStreak / 10);
      ctx.fillStyle = lerpColor('#3a4a55', '#1c6fd6', tI);
      ctx.beginPath();
      ctx.moveTo(0, -4.5); ctx.lineTo(3, 0); ctx.lineTo(0, 4.5); ctx.lineTo(-3, 0);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = lerpColor('#5a6a75', '#dffcff', tI);
      ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'combovolt': {
      // elektrische kogel die feller gloeit naarmate de killstreak oploopt
      const tV = Math.min(1, player.comboStreak / 10);
      ctx.strokeStyle = lerpColor('#555', '#c9a3ff', tV);
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-1, -2); ctx.lineTo(1, 2); ctx.lineTo(5, 0); ctx.stroke();
      ctx.fillStyle = lerpColor('#555', '#fff066', tV);
      ctx.beginPath(); ctx.arc(0, 0, 2.4, 0, Math.PI * 2); ctx.fill();
      break;
    }
    default: {
      ctx.fillStyle = '#ffd60a';
      ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawLightningBolt(l) {
  // Volt Caster: bliksemboog tussen de geraakte bot en de bot waar hij naar oversprong
  const age = performance.now() - l.born;
  const alpha = Math.max(0, 1 - age / 150);
  const dx = l.x2 - l.x1;
  const dy = l.y2 - l.y1;
  const dist = Math.hypot(dx, dy) || 1;
  const segments = 5;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#9be8ff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(l.x1, l.y1);
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const jitter = (Math.random() - 0.5) * 10;
    const nx = -dy / dist;
    const ny = dx / dist;
    ctx.lineTo(l.x1 + dx * t + nx * jitter, l.y1 + dy * t + ny * jitter);
  }
  ctx.lineTo(l.x2, l.y2);
  ctx.stroke();
  ctx.restore();
}

function drawBlackHole(bh) {
  // Singularity Gun: kolkend zwart gat tijdens de aanzuigfase
  const age = performance.now() - bh.born;
  if (age >= bh.duration) return; // implosie wordt via de explosions-array getekend
  const spin = performance.now() / 150;
  ctx.save();
  ctx.globalAlpha = 0.8;
  const grad = ctx.createRadialGradient(bh.x, bh.y, 0, bh.x, bh.y, bh.radius * 0.5);
  grad.addColorStop(0, '#1a0d2e');
  grad.addColorStop(0.6, 'rgba(155,93,229,0.5)');
  grad.addColorStop(1, 'rgba(155,93,229,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(bh.x, bh.y, bh.radius * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c77dff';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = 0.4 - i * 0.1;
    ctx.beginPath();
    ctx.arc(bh.x, bh.y, bh.radius * (0.3 + i * 0.15), spin + i, spin + i + Math.PI * 1.3);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLaserTelegraph(lt) {
  // Behemoth: waarschuwingslijn vóór de laserstraal afgaat
  const dx = Math.cos(lt.angle) * 900;
  const dy = Math.sin(lt.angle) * 900;
  ctx.save();
  ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 60) * 0.15;
  ctx.strokeStyle = '#ff3838';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(lt.bot.x, lt.bot.y);
  ctx.lineTo(lt.bot.x + dx, lt.bot.y + dy);
  ctx.stroke();
  ctx.restore();
}

function drawActiveLaser(beam) {
  // Behemoth: de daadwerkelijke, doorlopende laserstraal
  const age = performance.now() - beam.born;
  const alpha = Math.max(0, 1 - age / beam.duration);
  const dx = Math.cos(beam.angle) * 900;
  const dy = Math.sin(beam.angle) * 900;
  ctx.save();
  ctx.globalAlpha = alpha;
  const grad = ctx.createLinearGradient(beam.x1, beam.y1, beam.x1 + dx, beam.y1 + dy);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.15, '#c77dff');
  grad.addColorStop(1, 'rgba(199,125,255,0)');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(beam.x1, beam.y1);
  ctx.lineTo(beam.x1 + dx, beam.y1 + dy);
  ctx.stroke();
  ctx.restore();
}

function drawBarrageTelegraph(lt) {
  // Elementenstorm-powerup: stippellijn die exact toont waar de vuur- of ijsstraal zo dood gaat
  const col = lt.elementType === 'ice' ? '#66d9ff' : '#ff8800';
  ctx.save();
  ctx.globalAlpha = 0.55 + Math.sin(performance.now() / 60) * 0.2;
  ctx.strokeStyle = col;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(lt.x1, lt.y1);
  ctx.lineTo(lt.x2, lt.y2);
  ctx.stroke();
  ctx.restore();
}

function drawBarrageLaser(beam) {
  // Elementenstorm-powerup: rechte vuur- of ijsstraal die het hele veld doorkruist, alleen bots raakt
  const age = performance.now() - beam.born;
  const alpha = Math.max(0, 1 - age / beam.duration);
  const isIce = beam.elementType === 'ice';
  ctx.save();
  ctx.globalAlpha = alpha;
  const grad = ctx.createLinearGradient(beam.x1, beam.y1, beam.x2, beam.y2);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.15, isIce ? '#66d9ff' : '#ff8800');
  grad.addColorStop(1, isIce ? '#0d6efd' : '#ff3838');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(beam.x1, beam.y1);
  ctx.lineTo(beam.x2, beam.y2);
  ctx.stroke();
  ctx.restore();
}

function drawPlayerSkin(c, skinId, r) {
  if (skinId === 'muncher') {
    // origineel, happend arcade-monstertje — geen kopie van bestaande personages
    const mouthAngle = 0.25 + Math.abs(Math.sin(performance.now() / 160)) * 0.35;
    c.fillStyle = '#7ed957';
    c.beginPath();
    c.moveTo(0, 0);
    c.arc(0, 0, r, mouthAngle, Math.PI * 2 - mouthAngle);
    c.closePath();
    c.fill();
    c.fillStyle = '#fff';
    c.beginPath();
    c.moveTo(r * 0.15, -r * 0.18);
    c.lineTo(r * 0.7, 0);
    c.lineTo(r * 0.15, r * 0.02);
    c.closePath();
    c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(-r * 0.1, -r * 0.65, r * 0.28, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(-r * 0.35, -r * 0.15, r * 0.22, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#222';
    c.beginPath(); c.arc(-r * 0.05, -r * 0.65, r * 0.12, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(-r * 0.3, -r * 0.15, r * 0.1, 0, Math.PI * 2); c.fill();
  } else if (skinId === 'ninja') {
    c.fillStyle = '#1b1f3b';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#4cf5ff';
    c.fillRect(-r * 0.3, -r * 0.35, r * 1.1, r * 0.32);
    c.fillStyle = '#e63946';
    c.fillRect(-r * 0.9, -r * 0.5, r * 1.8, r * 0.14);
    c.fillStyle = '#333';
    c.fillRect(0, -4, 22, 8);
  } else if (skinId === 'astronaut') {
    c.fillStyle = '#f1f1f1';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#7d9dc9';
    c.lineWidth = 3;
    c.beginPath(); c.arc(0, 0, r - 2, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#8ecbff';
    c.beginPath(); c.ellipse(r * 0.15, 0, r * 0.55, r * 0.4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ccc';
    c.fillRect(-r * 0.1, -r - 6, 3, 8);
    c.beginPath(); c.arc(-r * 0.1 + 1.5, -r - 8, 3, 0, Math.PI * 2); c.fill();
  } else if (skinId === 'robo') {
    c.fillStyle = '#8a8f98';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#555';
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(-r * 0.6, -r * 0.6); c.lineTo(r * 0.6, -r * 0.6); c.stroke();
    c.beginPath(); c.moveTo(-r * 0.6, r * 0.6); c.lineTo(r * 0.6, r * 0.6); c.stroke();
    const blink = Math.sin(performance.now() / 300) > 0;
    c.fillStyle = blink ? '#ff3838' : '#a30000';
    c.beginPath(); c.arc(r * 0.25, 0, r * 0.22, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#555';
    c.fillRect(0, -4, 22, 8);
  } else if (skinId === 'viking') {
    c.fillStyle = '#8b5a2b';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e8dcc0';
    c.beginPath(); c.ellipse(0, -r * 0.1, r * 0.8, r * 0.55, 0, Math.PI, Math.PI * 2); c.fill();
    c.fillStyle = '#d9d9d9';
    c.beginPath(); c.moveTo(-r * 0.5, -r * 0.5); c.quadraticCurveTo(-r * 0.9, -r * 1.3, -r * 0.3, -r * 0.9); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(r * 0.5, -r * 0.5); c.quadraticCurveTo(r * 0.9, -r * 1.3, r * 0.3, -r * 0.9); c.closePath(); c.fill();
    c.fillStyle = '#333';
    c.fillRect(0, -4, 22, 8);
  } else if (skinId === 'pirate') {
    c.fillStyle = '#7a1f1f';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1a1a1a';
    c.beginPath(); c.moveTo(-r, -r * 0.2); c.lineTo(r, -r * 0.2); c.lineTo(r * 0.3, -r * 0.9); c.lineTo(-r * 0.3, -r * 0.9); c.closePath(); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(-r * 0.15, -r * 0.05, r * 0.34, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#222';
    c.beginPath(); c.arc(-r * 0.15, -r * 0.05, r * 0.18, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#000';
    c.beginPath(); c.arc(r * 0.3, -r * 0.05, r * 0.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#333';
    c.fillRect(0, -4, 22, 8);
  } else if (skinId === 'wizard') {
    c.fillStyle = '#5b2c8f';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#7d3cc9';
    c.beginPath();
    c.moveTo(0, -r * 1.6); c.lineTo(-r * 0.6, -r * 0.5); c.lineTo(r * 0.6, -r * 0.5); c.closePath(); c.fill();
    c.fillStyle = '#ffd60a';
    c.beginPath(); c.arc(0, -r * 1.6, r * 0.14, 0, Math.PI * 2); c.fill();
    const wizGlow = 0.5 + Math.abs(Math.sin(performance.now() / 300)) * 0.5;
    c.globalAlpha = wizGlow;
    c.fillStyle = '#9ef7ff';
    c.beginPath(); c.arc(r * 0.9, 0, r * 0.2, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1;
    c.fillStyle = '#4b2e1e';
    c.fillRect(0, -3, r * 1.1, 6);
  } else if (skinId === 'dragon') {
    c.fillStyle = '#2f7d3c';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1f5a2a';
    for (let i = -2; i <= 2; i++) {
      c.beginPath();
      c.moveTo(i * r * 0.25, -r * 0.9);
      c.lineTo(i * r * 0.25 - r * 0.1, -r * 0.6);
      c.lineTo(i * r * 0.25 + r * 0.1, -r * 0.6);
      c.closePath(); c.fill();
    }
    c.fillStyle = '#ffb703';
    c.beginPath(); c.arc(r * 0.85, 0, r * 0.16, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#222';
    c.fillRect(0, -4, 20, 8);
  } else if (skinId === 'skeleton') {
    c.fillStyle = '#2b2b2b';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#eee';
    c.lineWidth = 2;
    c.beginPath(); c.arc(0, 0, r * 0.7, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(-r * 0.5, 0); c.lineTo(r * 0.5, 0); c.stroke();
    c.fillStyle = '#7CFC9A';
    c.beginPath(); c.arc(-r * 0.3, -r * 0.2, r * 0.14, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.1, -r * 0.2, r * 0.14, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#333';
    c.fillRect(0, -4, 22, 8);
  } else if (skinId === 'alien') {
    c.fillStyle = '#8fd94f';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#111';
    c.beginPath(); c.ellipse(-r * 0.15, -r * 0.1, r * 0.32, r * 0.2, -0.3, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(r * 0.25, -r * 0.1, r * 0.28, r * 0.18, 0.3, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#8fd94f';
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, -r); c.lineTo(r * 0.15, -r * 1.4); c.stroke();
    c.fillStyle = '#c8ffb0';
    c.beginPath(); c.arc(r * 0.15, -r * 1.4, r * 0.1, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#333';
    c.fillRect(0, -4, 22, 8);
  } else if (skinId === 'knight') {
    c.fillStyle = '#c7ccd1';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#8a929b';
    c.fillRect(-r * 0.7, -r * 0.15, r * 1.4, r * 0.28);
    c.fillStyle = '#e63946';
    c.beginPath();
    c.moveTo(0, -r); c.lineTo(-r * 0.15, -r * 1.5); c.lineTo(r * 0.15, -r * 1.5); c.closePath(); c.fill();
    c.fillStyle = '#333';
    c.fillRect(0, -4, 24, 8);
  } else if (skinId === 'phoenix') {
    const grad = c.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0, '#fff275');
    grad.addColorStop(0.5, '#ff8c42');
    grad.addColorStop(1, '#c8102e');
    c.fillStyle = grad;
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    const flick = Math.sin(performance.now() / 150) * 0.15;
    c.fillStyle = '#ffb703';
    c.beginPath();
    c.moveTo(-r * 0.6, -r * 0.8);
    c.quadraticCurveTo(-r * 1.3, -r * 0.3 + flick * r, -r * 0.9, r * 0.4);
    c.quadraticCurveTo(-r * 0.7, -r * 0.1, -r * 0.6, -r * 0.8);
    c.fill();
    c.fillStyle = '#333';
    c.fillRect(0, -4, 22, 8);
  } else if (skinId === 'cosmic') {
    c.fillStyle = '#1a1a3d';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    const grad2 = c.createRadialGradient(-r * 0.2, -r * 0.2, 0, -r * 0.2, -r * 0.2, r * 0.9);
    grad2.addColorStop(0, 'rgba(155,109,255,0.5)');
    grad2.addColorStop(1, 'rgba(155,109,255,0)');
    c.fillStyle = grad2;
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff';
    const stars = [[-0.3, -0.4], [0.2, -0.5], [0.4, 0.1], [-0.4, 0.3], [0.05, 0.4]];
    stars.forEach(([sx, sy]) => {
      c.beginPath(); c.arc(sx * r, sy * r, r * 0.06, 0, Math.PI * 2); c.fill();
    });
    c.fillStyle = '#333';
    c.fillRect(0, -4, 22, 8);
  } else if (skinId === 'samurai') {
    c.fillStyle = '#8b0000';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#daa520';
    c.fillRect(-r * 0.7, -r * 0.4, r * 1.4, r * 0.6);
    c.fillStyle = '#ffff00';
    c.beginPath();
    c.moveTo(r + 8, -2); c.lineTo(r + 20, 0); c.lineTo(r + 8, 2); c.closePath(); c.fill();
    c.fillStyle = '#333';
    c.fillRect(0, -4, 22, 8);
  } else if (skinId === 'cyborg') {
    c.fillStyle = '#555';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ff00ff';
    c.fillRect(-r * 0.6, -r * 0.6, r * 0.5, r * 0.5);
    c.fillRect(r * 0.1, r * 0.1, r * 0.5, r * 0.5);
    c.fillStyle = '#0ff';
    c.beginPath(); c.arc(r * 0.3, -r * 0.3, r * 0.15, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#333';
    c.fillRect(0, -4, 22, 8);
  } else if (skinId === 'vampire') {
    c.fillStyle = '#1a0a1a';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#8b0000';
    c.beginPath(); c.moveTo(-r, -r * 0.3); c.lineTo(-r, r * 0.8); c.lineTo(0, r * 1); c.lineTo(r, r * 0.8); c.lineTo(r, -r * 0.3); c.closePath(); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(-r * 0.2, -r * 0.2, r * 0.18, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.2, -r * 0.2, r * 0.18, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ff0000';
    c.beginPath(); c.arc(-r * 0.2, -r * 0.2, r * 0.08, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.2, -r * 0.2, r * 0.08, 0, Math.PI * 2); c.fill();
  } else if (skinId === 'ghost') {
    c.fillStyle = '#f5f5f5';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 0.6;
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(0, 0, r * 0.8, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1;
    c.fillStyle = '#333';
    c.beginPath(); c.arc(-r * 0.2, -r * 0.2, r * 0.15, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.2, -r * 0.2, r * 0.15, 0, Math.PI * 2); c.fill();
    c.fillRect(-r * 0.3, r * 0.1, r * 0.15, r * 0.25);
    c.fillRect(r * 0.15, r * 0.1, r * 0.15, r * 0.25);
  } else if (skinId === 'neon') {
    c.fillStyle = '#000';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#0ff';
    c.lineWidth = 2;
    c.strokeRect(-r * 0.6, -r * 0.6, r * 1.2, r * 1.2);
    c.fillStyle = '#ff00ff';
    c.fillRect(-r * 0.3, -r * 0.3, r * 0.2, r * 0.2);
    c.fillRect(r * 0.1, r * 0.1, r * 0.2, r * 0.2);
    c.fillStyle = '#00ff00';
    c.fillRect(r * 0.2, -r * 0.4, r * 0.15, r * 0.15);
  } else if (skinId === 'clown') {
    c.fillStyle = '#ff6b9d';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffff00';
    c.fillRect(-r * 0.7, -r * 0.3, r * 1.4, r * 0.6);
    c.fillStyle = '#ff0000';
    c.beginPath(); c.arc(0, r * 0.4, r * 0.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(-r * 0.25, -r * 0.25, r * 0.2, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.25, -r * 0.25, r * 0.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#333';
    c.fillRect(0, -4, 22, 8);
  } else if (skinId === 'monster') {
    c.fillStyle = '#228b22';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 / 6) * i;
      c.fillStyle = '#32cd32';
      c.beginPath(); c.arc(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, r * 0.25, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#ffff00';
    c.beginPath(); c.arc(-r * 0.2, -r * 0.2, r * 0.15, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.2, -r * 0.2, r * 0.15, 0, Math.PI * 2); c.fill();
  } else if (skinId === 'angel') {
    c.fillStyle = '#fffacd';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#ffd700';
    c.lineWidth = 2;
    c.beginPath(); c.arc(0, -r * 1.2, r * 0.2, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#fff';
    c.beginPath();
    c.moveTo(-r * 0.7, 0); c.quadraticCurveTo(-r * 1.2, -r * 0.5, -r * 0.8, -r * 1); c.quadraticCurveTo(-r * 0.6, -r * 0.3, -r * 0.7, 0); c.fill();
    c.beginPath();
    c.moveTo(r * 0.7, 0); c.quadraticCurveTo(r * 1.2, -r * 0.5, r * 0.8, -r * 1); c.quadraticCurveTo(r * 0.6, -r * 0.3, r * 0.7, 0); c.fill();
  } else if (skinId === 'demon') {
    c.fillStyle = '#8b0000';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ff6347';
    c.beginPath(); c.moveTo(-r * 0.3, -r * 0.8); c.lineTo(-r * 0.6, -r * 1.2); c.lineTo(-r * 0.1, -r * 0.6); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(r * 0.3, -r * 0.8); c.lineTo(r * 0.6, -r * 1.2); c.lineTo(r * 0.1, -r * 0.6); c.closePath(); c.fill();
    c.fillStyle = '#ffff00';
    c.beginPath(); c.arc(-r * 0.25, -r * 0.2, r * 0.15, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.25, -r * 0.2, r * 0.15, 0, Math.PI * 2); c.fill();
  } else if (skinId === 'robot_simple') {
    c.fillStyle = '#c0c0c0';
    c.fillRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6);
    c.strokeStyle = '#888';
    c.lineWidth = 2;
    c.strokeRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6);
    c.fillStyle = '#ff0000';
    c.beginPath(); c.arc(0, 0, r * 0.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffff00';
    for (let i = 0; i < 3; i++) {
      const y = -r * 0.6 + i * r * 0.6;
      c.beginPath(); c.arc(-r * 0.5, y, r * 0.12, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(r * 0.5, y, r * 0.12, 0, Math.PI * 2); c.fill();
    }
  } else if (skinId === 'gemstone') {
    const ggemGrad = c.createRadialGradient(0, 0, 0, 0, 0, r);
    ggemGrad.addColorStop(0, '#fff');
    ggemGrad.addColorStop(0.5, '#87ceeb');
    ggemGrad.addColorStop(1, '#4169e1');
    c.fillStyle = ggemGrad;
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#fff';
    c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(0, -r); c.lineTo(r, 0); c.lineTo(0, r); c.lineTo(-r, 0); c.closePath(); c.stroke();
  } else if (skinId === 'mushroom') {
    c.fillStyle = '#c41e3a';
    c.beginPath(); c.arc(0, -r * 0.2, r * 0.9, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff';
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 / 5) * i;
      c.beginPath(); c.arc(Math.cos(a) * r * 0.6, -r * 0.2 + Math.sin(a) * r * 0.4, r * 0.15, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#daa520';
    c.fillRect(-r * 0.3, r * 0.3, r * 0.6, r * 0.5);
  } else if (skinId === 'pumpkin') {
    c.fillStyle = '#ff8c00';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < 4; i++) {
      c.fillStyle = '#ffa500';
      c.beginPath();
      const a = (Math.PI * 2 / 4) * i;
      c.arc(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.25, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#228b22';
    c.beginPath(); c.moveTo(0, -r); c.lineTo(-r * 0.1, -r * 1.3); c.lineTo(r * 0.1, -r); c.closePath(); c.fill();
    c.fillStyle = '#000';
    c.beginPath(); c.arc(-r * 0.2, -r * 0.2, r * 0.15, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.2, -r * 0.2, r * 0.15, 0, Math.PI * 2); c.fill();
    c.fillRect(-r * 0.2, r * 0.2, r * 0.4, r * 0.1);
  } else if (skinId === 'mummy') {
    c.fillStyle = '#8b7355';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#d2b48c';
    c.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const y = -r * 0.7 + i * r * 0.35;
      c.beginPath(); c.moveTo(-r * 0.8, y); c.lineTo(r * 0.8, y); c.stroke();
    }
    c.fillStyle = '#ffff00';
    c.beginPath(); c.arc(-r * 0.2, -r * 0.3, r * 0.15, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.2, -r * 0.3, r * 0.15, 0, Math.PI * 2); c.fill();
  } else if (skinId === 'werewolf') {
    c.fillStyle = '#4a3728';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#8b7355';
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 / 8) * i;
      c.beginPath(); c.arc(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, r * 0.2, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#ffff00';
    c.beginPath(); c.arc(-r * 0.25, -r * 0.25, r * 0.2, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.25, -r * 0.25, r * 0.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#000';
    c.beginPath(); c.arc(-r * 0.25, -r * 0.25, r * 0.08, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.25, -r * 0.25, r * 0.08, 0, Math.PI * 2); c.fill();
  } else if (skinId === 'panda') {
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1a1a1a';
    c.beginPath(); c.arc(-r * 0.75, -r * 0.75, r * 0.35, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.75, -r * 0.75, r * 0.35, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(-r * 0.3, -r * 0.1, r * 0.28, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.3, -r * 0.1, r * 0.28, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(-r * 0.3, -r * 0.1, r * 0.16, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.3, -r * 0.1, r * 0.16, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1a1a1a';
    c.beginPath(); c.arc(-r * 0.25, -r * 0.06, r * 0.08, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.25, -r * 0.06, r * 0.08, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(0, r * 0.25, r * 0.1, 0, Math.PI * 2); c.fill();
  } else if (skinId === 'unicorn') {
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    const hue = (performance.now() / 8) % 360;
    c.fillStyle = `hsl(${hue}, 90%, 65%)`;
    c.beginPath();
    c.moveTo(r * 0.1, -r * 0.2);
    c.lineTo(r * 1.1, -r * 1.1);
    c.lineTo(r * 0.35, -r * 0.35);
    c.closePath();
    c.fill();
    for (let i = 0; i < 4; i++) {
      c.fillStyle = `hsl(${(hue + i * 40) % 360}, 90%, 65%)`;
      c.beginPath();
      c.ellipse(-r * 0.3 - i * 4, -r * 0.6 + i * 6, r * 0.35, r * 0.14, -0.4, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = '#222';
    c.beginPath(); c.arc(r * 0.3, -r * 0.1, r * 0.1, 0, Math.PI * 2); c.fill();
  } else if (skinId === 'shark') {
    c.fillStyle = '#6e8ca0';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e8f1f5';
    c.beginPath(); c.ellipse(r * 0.1, r * 0.3, r * 0.75, r * 0.4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#6e8ca0';
    c.beginPath();
    c.moveTo(-r * 0.1, -r * 0.9);
    c.lineTo(r * 0.35, -r * 1.6);
    c.lineTo(r * 0.5, -r * 0.7);
    c.closePath();
    c.fill();
    c.fillStyle = '#fff';
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(r * 0.2 + i * 6, r * 0.15);
      c.lineTo(r * 0.25 + i * 6, r * 0.35);
      c.lineTo(r * 0.3 + i * 6, r * 0.15);
      c.closePath();
      c.fill();
    }
    c.fillStyle = '#111';
    c.beginPath(); c.arc(-r * 0.3, -r * 0.2, r * 0.12, 0, Math.PI * 2); c.fill();
  } else if (skinId === 'frankenstein') {
    c.fillStyle = '#6ba05a';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#333';
    c.fillRect(-r * 0.9, -r * 0.15, r * 1.8, r * 0.2);
    c.fillStyle = '#c0c0c0';
    c.beginPath(); c.arc(-r * 0.85, 0, r * 0.16, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.85, 0, r * 0.16, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#333';
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(-r * 0.3, -r * 0.6); c.lineTo(r * 0.1, -r * 0.55); c.stroke();
    c.fillStyle = '#ffe066';
    c.beginPath(); c.arc(-r * 0.25, -r * 0.15, r * 0.16, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.25, -r * 0.15, r * 0.16, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#111';
    c.beginPath(); c.arc(-r * 0.25, -r * 0.15, r * 0.06, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.25, -r * 0.15, r * 0.06, 0, Math.PI * 2); c.fill();
  } else if (skinId === 'cactus') {
    c.fillStyle = '#3fa34d';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2e7d3a';
    c.beginPath(); c.ellipse(-r * 0.7, -r * 0.1, r * 0.35, r * 0.6, 0.3, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(r * 0.7, -r * 0.2, r * 0.32, r * 0.55, -0.3, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#fff';
    c.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 / 6) * i;
      c.beginPath();
      c.moveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
      c.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
      c.stroke();
    }
    c.fillStyle = '#ff6fa5';
    c.beginPath(); c.arc(-r * 0.2, -r * 0.7, r * 0.18, 0, Math.PI * 2); c.fill();
  } else if (skinId === 'snowman') {
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(0, r * 0.25, r * 0.85, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(0, -r * 0.35, r * 0.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ff8c00';
    c.beginPath();
    c.moveTo(r * 0.1, -r * 0.35);
    c.lineTo(r * 0.7, -r * 0.25);
    c.lineTo(r * 0.1, -r * 0.15);
    c.closePath();
    c.fill();
    c.fillStyle = '#222';
    c.beginPath(); c.arc(-r * 0.2, -r * 0.5, r * 0.08, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(0, -r * 0.55, r * 0.08, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(0.15, -r * 0.6, r * 0.08, 0, Math.PI * 2); c.fill();
  } else if (skinId === 'discoball') {
    const t = performance.now() / 400;
    c.fillStyle = '#c9c9c9';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    for (let ring = -2; ring <= 2; ring++) {
      const ry = ring * r * 0.35;
      const rw = Math.sqrt(Math.max(0, r * r - ry * ry));
      c.strokeStyle = 'rgba(80,80,80,0.6)';
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(-rw, ry); c.lineTo(rw, ry); c.stroke();
    }
    for (let i = 0; i < 5; i++) {
      const hue = (t * 60 + i * 70) % 360;
      const a = (Math.PI * 2 / 5) * i + t;
      c.fillStyle = `hsl(${hue}, 90%, 70%)`;
      c.beginPath(); c.arc(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.1, 0, Math.PI * 2); c.fill();
    }
  } else if (skinId === 'turtle') {
    c.fillStyle = '#4a8c3f';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2e5c28';
    c.beginPath(); c.arc(0, 0, r * 0.75, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#7fc76a';
    c.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 / 6) * i;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75);
      c.stroke();
    }
    c.fillStyle = '#8fce7a';
    c.beginPath(); c.ellipse(r * 0.85, 0, r * 0.3, r * 0.22, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#111';
    c.beginPath(); c.arc(r * 0.95, -r * 0.05, r * 0.06, 0, Math.PI * 2); c.fill();
  } else if (skinId === 'jester') {
    c.fillStyle = '#5b2c8f';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffd700';
    c.beginPath(); c.moveTo(-r, -r * 0.3); c.quadraticCurveTo(-r * 0.6, -r * 1.5, -r * 0.2, -r * 0.5); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(r, -r * 0.3); c.quadraticCurveTo(r * 0.6, -r * 1.5, r * 0.2, -r * 0.5); c.closePath(); c.fill();
    c.beginPath(); c.arc(-r * 0.6, -r * 1.35, r * 0.13, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.6, -r * 1.35, r * 0.13, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(-r * 0.25, -r * 0.1, r * 0.2, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.25, -r * 0.1, r * 0.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#111';
    c.beginPath(); c.arc(-r * 0.25, -r * 0.1, r * 0.09, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.25, -r * 0.1, r * 0.09, 0, Math.PI * 2); c.fill();
  } else if (skinId === 'cyclops') {
    c.fillStyle = '#7d3cff';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    const glow = 0.7 + Math.sin(performance.now() / 250) * 0.3;
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(0, 0, r * 0.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = `rgba(255, 60, 60, ${glow})`;
    c.beginPath(); c.arc(0, 0, r * 0.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#111';
    c.beginPath(); c.arc(0, 0, r * 0.13, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#5c1fbf';
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI * 0.7 + (Math.PI * 0.9 / 4) * i;
      c.beginPath(); c.arc(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, r * 0.1, 0, Math.PI * 2); c.fill();
    }
  } else if (skinId === 'combofire') {
    // dovende ember die feller ontbrandt en een groeiende vuuraura krijgt naarmate de killstreak oploopt
    const t = Math.min(1, player.comboStreak / 10);
    const flicker = 1 + Math.sin(performance.now() / 90) * 0.08 * t;
    if (t > 0.05) {
      c.save();
      c.globalAlpha = 0.25 + t * 0.35;
      c.fillStyle = lerpColor('#552200', '#ff5500', t);
      c.beginPath(); c.arc(0, 0, (r + 6 + t * 10) * flicker, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    c.fillStyle = lerpColor('#3a3a3a', '#ff8800', t);
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = lerpColor('#4a4a4a', '#ffe066', t);
    c.beginPath(); c.arc(0, 0, r * 0.45, 0, Math.PI * 2); c.fill();
    const flames = Math.round(t * 8);
    c.fillStyle = lerpColor('#3a3a3a', '#ff3838', t);
    for (let i = 0; i < flames; i++) {
      const a = (Math.PI * 2 / 8) * i;
      c.beginPath();
      c.arc(Math.cos(a) * r * (0.95 + t * 0.25), Math.sin(a) * r * (0.95 + t * 0.25), r * 0.14 * t, 0, Math.PI * 2);
      c.fill();
    }
  } else if (skinId === 'combofrost') {
    // dof ijskristal dat feller gaat gloeien en scherpere punten krijgt bij een oplopende killstreak
    const t = Math.min(1, player.comboStreak / 10);
    const spikes = 5 + Math.round(t * 4);
    if (t > 0.05) {
      c.save();
      c.globalAlpha = 0.2 + t * 0.35;
      c.strokeStyle = lerpColor('#3a4a55', '#8ff0ff', t);
      c.lineWidth = 2;
      c.beginPath(); c.arc(0, 0, r + 6 + t * 9, 0, Math.PI * 2); c.stroke();
      c.restore();
    }
    c.fillStyle = lerpColor('#3a4a55', '#1c6fd6', t);
    c.beginPath();
    for (let i = 0; i < spikes; i++) {
      const a = (Math.PI * 2 / spikes) * i;
      const rad = i % 2 === 0 ? r * (0.7 + t * 0.4) : r * 0.5;
      const px = Math.cos(a) * rad, py = Math.sin(a) * rad;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath();
    c.fill();
    c.fillStyle = lerpColor('#5a6a75', '#dffcff', t);
    c.beginPath(); c.arc(0, 0, r * 0.3, 0, Math.PI * 2); c.fill();
  } else if (skinId === 'combovolt') {
    // gedimde energiekern die steeds meer knetterende bliksemboogjes krijgt bij een oplopende killstreak
    const t = Math.min(1, player.comboStreak / 10);
    c.fillStyle = lerpColor('#3a3a3a', '#241a4d', t);
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = lerpColor('#555', '#fff066', t);
    c.beginPath(); c.arc(0, 0, r * 0.4, 0, Math.PI * 2); c.fill();
    const bolts = Math.round(t * 6);
    c.strokeStyle = lerpColor('#555', '#c9a3ff', t);
    c.lineWidth = 1.5;
    for (let i = 0; i < bolts; i++) {
      const a = (Math.PI * 2 / 6) * i + performance.now() / 200;
      const x1 = Math.cos(a) * r * 0.5, y1 = Math.sin(a) * r * 0.5;
      const x2 = Math.cos(a) * r * (1.15 + t * 0.3), y2 = Math.sin(a) * r * (1.15 + t * 0.3);
      const midA = a + 0.3;
      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(Math.cos(midA) * r * 0.85, Math.sin(midA) * r * 0.85);
      c.lineTo(x2, y2);
      c.stroke();
    }
  } else {
    // standaard
    c.fillStyle = '#4cc9f0';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#333';
    c.fillRect(0, -4, 26, 8);
  }
}

function drawPlayerTank(c, r) {
  // tank-lichaam: blokkig rupsvoertuig met een lange loop
  c.fillStyle = '#222';
  c.fillRect(-r * 0.95, -r * 0.95, r * 1.9, r * 0.35);
  c.fillRect(-r * 0.95, r * 0.6, r * 1.9, r * 0.35);
  c.fillStyle = '#4a5d23';
  c.fillRect(-r * 0.9, -r * 0.75, r * 1.8, r * 1.5);
  c.strokeStyle = '#2e3b16';
  c.lineWidth = 2;
  c.strokeRect(-r * 0.9, -r * 0.75, r * 1.8, r * 1.5);
  c.fillStyle = '#5c7331';
  c.beginPath();
  c.arc(0, 0, r * 0.55, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#333';
  c.fillRect(0, -r * 0.15, r + 14, r * 0.3);
}

function drawPlayerBerserker(c, r) {
  // berserker: gedrongen rood lijf met een grote mes-klauw naar voren
  c.fillStyle = '#7a1f1f';
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#ffb020';
  c.lineWidth = 2;
  c.stroke();
  c.fillStyle = '#e8e8e8';
  c.beginPath();
  c.moveTo(r - 2, -6);
  c.lineTo(r + 24, 0);
  c.lineTo(r - 2, 6);
  c.closePath();
  c.fill();
}

function drawPlayerSniperMech(c, r) {
  // sniper mech: blokkige, zware romp met een lange loop
  c.fillStyle = '#333d4d';
  c.fillRect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7);
  c.strokeStyle = '#1c222b';
  c.lineWidth = 2;
  c.strokeRect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7);
  c.fillStyle = '#5c7cbf';
  c.beginPath();
  c.arc(0, 0, r * 0.5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#222';
  c.fillRect(0, -3, r + 26, 6);
}

function drawPlayerDroneHive(c, r) {
  // drone-commandant: gewoon poppetje met ronddraaiende mini-drones
  c.fillStyle = '#2c8c6e';
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#155c46';
  c.lineWidth = 2;
  c.stroke();
  const t = performance.now() / 300;
  for (let i = 0; i < 3; i++) {
    const a = t + (Math.PI * 2 / 3) * i;
    c.fillStyle = '#7ee8c1';
    c.beginPath();
    c.arc(Math.cos(a) * (r + 12), Math.sin(a) * (r + 12), 3.5, 0, Math.PI * 2);
    c.fill();
  }
}

function drawPlayerPyro(c, r) {
  // pyromaniac: donkerrood gewaad met een flakkerende vlam op de rug
  c.fillStyle = '#5c1a1a';
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#ff8800';
  c.lineWidth = 2;
  c.stroke();
  const flicker = 1 + Math.sin(performance.now() / 90) * 0.15;
  c.fillStyle = '#ff8800';
  c.beginPath();
  c.moveTo(-r * 0.5, -r * 0.6);
  c.quadraticCurveTo(-r * 1.1 * flicker, 0, -r * 0.5, r * 0.6);
  c.quadraticCurveTo(-r * 0.8, 0, -r * 0.5, -r * 0.6);
  c.fill();
  c.fillStyle = '#ffcc00';
  c.beginPath();
  c.arc(-r * 0.6, 0, r * 0.22 * flicker, 0, Math.PI * 2);
  c.fill();
}

function drawPlayerVampireLord(c, r) {
  // vampier: bleek gewaad met een donkere cape en spitse hoektanden
  c.fillStyle = '#2a0f2e';
  c.beginPath();
  c.arc(0, 0, r * 1.15, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#e8d5e0';
  c.beginPath();
  c.arc(0, 0, r * 0.8, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#fff';
  c.beginPath();
  c.moveTo(r * 0.3, -3); c.lineTo(r * 0.65, 0); c.lineTo(r * 0.3, 3); c.closePath(); c.fill();
  c.strokeStyle = '#7a1f4a';
  c.lineWidth = 2;
  c.stroke();
}

function drawPlayerAssassin(c, r) {
  // schaduwmoordenaar: slank, donker silhouet met een dolk
  c.fillStyle = '#1a1a2e';
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#c77dff';
  c.lineWidth = 2;
  c.stroke();
  c.fillStyle = '#e8e8e8';
  c.beginPath();
  c.moveTo(r - 2, -3);
  c.lineTo(r + 18, 0);
  c.lineTo(r - 2, 3);
  c.closePath();
  c.fill();
}

function drawPlayerNecromancer(c, r) {
  // soul reaper: spookachtig grijsgroen gewaad met gloeiende oogkassen
  c.fillStyle = '#2b3a2f';
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#7ee8c1';
  c.lineWidth = 2;
  c.stroke();
  c.fillStyle = '#7ee8c1';
  c.beginPath();
  c.arc(r * 0.3, -r * 0.3, 2.5, 0, Math.PI * 2);
  c.arc(r * 0.3, r * 0.3, 2.5, 0, Math.PI * 2);
  c.fill();
}

function drawPlayerStormCaller(c, r) {
  // storm caller: elektrisch blauw gewaad met knetterende vonken
  c.fillStyle = '#1c2b4a';
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#7df9ff';
  c.lineWidth = 2;
  c.stroke();
  const t = performance.now() / 120;
  for (let i = 0; i < 3; i++) {
    const a = t + (Math.PI * 2 / 3) * i;
    c.strokeStyle = '#7df9ff';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
    c.lineTo(Math.cos(a) * (r + 8), Math.sin(a) * (r + 8));
    c.stroke();
  }
}

function drawPlayerJuggernaut(c, r) {
  // juggernaut: enorme gepantserde bulk met spikes vooraan
  c.fillStyle = '#4a3520';
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#241a10';
  c.lineWidth = 3;
  c.stroke();
  c.fillStyle = '#8a7050';
  for (let i = -1; i <= 1; i++) {
    c.beginPath();
    c.moveTo(r * 0.6, i * r * 0.4 - 5);
    c.lineTo(r + 14, i * r * 0.4);
    c.lineTo(r * 0.6, i * r * 0.4 + 5);
    c.closePath();
    c.fill();
  }
}

function drawPlayerEngineer(c, r) {
  // field engineer: gewoon poppetje met een gereedschapsriem en helm
  c.fillStyle = '#4c6b8a';
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#2c3f52';
  c.lineWidth = 2;
  c.stroke();
  c.fillStyle = '#ffd60a';
  c.beginPath();
  c.arc(0, 0, r * 0.55, Math.PI, Math.PI * 2);
  c.fill();
  c.fillStyle = '#333';
  c.fillRect(-4, r * 0.3, 8, 5);
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  if (player.activeTransform === 'tank') drawPlayerTank(ctx, player.r);
  else if (player.activeTransform === 'berserker') drawPlayerBerserker(ctx, player.r);
  else if (player.activeTransform === 'sniper') drawPlayerSniperMech(ctx, player.r);
  else if (player.activeTransform === 'swarm') drawPlayerDroneHive(ctx, player.r);
  else if (player.activeTransform === 'pyro') drawPlayerPyro(ctx, player.r);
  else if (player.activeTransform === 'vampire') drawPlayerVampireLord(ctx, player.r);
  else if (player.activeTransform === 'assassin') drawPlayerAssassin(ctx, player.r);
  else if (player.activeTransform === 'necromancer') drawPlayerNecromancer(ctx, player.r);
  else if (player.activeTransform === 'stormcaller') drawPlayerStormCaller(ctx, player.r);
  else if (player.activeTransform === 'juggernaut') drawPlayerJuggernaut(ctx, player.r);
  else if (player.activeTransform === 'engineer') drawPlayerEngineer(ctx, player.r);
  else drawPlayerSkin(ctx, equippedSkin, player.r);
  ctx.restore();
}

function drawBot(bot) {
  const now = performance.now();
  const frozen = now < bot.frozenUntil;
  const slashing = now < (bot.slashUntil || 0);
  const isMelee = bot.pattern === 'melee';
  const isGhost = bot.pattern === 'teleport';
  const isTurret = bot.pattern === 'turret';
  const isBomber = bot.pattern === 'suicide';
  const isBoss = !!bot.isBoss;
  const isSwapper = bot.type === 'swapper';
  const isWarden = bot.type === 'warden';
  const isArclight = bot.type === 'arclight';
  const isMiasma = bot.type === 'miasma';
  const isBulwark = bot.type === 'bulwark';
  const isBroodmother = bot.type === 'broodmother';
  const isBroodling = bot.type === 'broodling';
  const isGravitas = bot.type === 'gravitas';
  const isCryostasis = bot.type === 'cryostasis';
  const isRailgunner = bot.type === 'railgunner';
  const isVexer = bot.type === 'vexer';
  const isBombardier = bot.type === 'bombardier';
  const isSplitter = bot.type === 'splitter';
  ctx.save();
  ctx.translate(bot.x, bot.y);
  const angle = Math.atan2(player.y - bot.y, player.x - bot.x);
  ctx.rotate(angle);
  if (isGhost) ctx.globalAlpha = 0.65;
  ctx.fillStyle = frozen ? '#9be3ff' : (slashing ? '#fff' : bot.color);
  ctx.beginPath();
  if (isSwapper) {
    // ruitvormig lichaam met dubbele contour, duidelijk anders dan gewone bots
    ctx.moveTo(bot.r * 1.15, 0);
    ctx.lineTo(0, bot.r * 0.85);
    ctx.lineTo(-bot.r * 1.15, 0);
    ctx.lineTo(0, -bot.r * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#faf0ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, bot.r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#faf0ff';
    ctx.fill();
  } else if (isWarden) {
    // zeshoekig gepantserd lichaam
    ctx.moveTo(bot.r, 0);
    for (let i = 1; i <= 6; i++) {
      const a = (Math.PI * 2 / 6) * i;
      ctx.lineTo(Math.cos(a) * bot.r, Math.sin(a) * bot.r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffcf8c';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (isArclight) {
    // bliksemschicht-vormig lichaam
    ctx.moveTo(bot.r * 0.7, -bot.r);
    ctx.lineTo(-bot.r * 0.3, -bot.r * 0.15);
    ctx.lineTo(bot.r * 0.15, -bot.r * 0.15);
    ctx.lineTo(-bot.r * 0.7, bot.r);
    ctx.lineTo(bot.r * 0.3, bot.r * 0.15);
    ctx.lineTo(-bot.r * 0.15, bot.r * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fffbd6';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (isMiasma) {
    // druppelvormig, wolkerig lichaam met belletjes
    ctx.arc(0, 0, bot.r * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c3ff5c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#c3ff5c';
    ctx.beginPath(); ctx.arc(bot.r * 0.35, -bot.r * 0.3, bot.r * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-bot.r * 0.2, bot.r * 0.35, bot.r * 0.14, 0, Math.PI * 2); ctx.fill();
  } else if (isBulwark) {
    // brede, plompe rechthoekige schildvorm
    ctx.rect(-bot.r * 0.9, -bot.r * 1.1, bot.r * 1.8, bot.r * 2.2);
    ctx.fill();
    ctx.strokeStyle = '#dfefff';
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (isBroodmother || isBroodling) {
    // spinachtig lichaam met korte pootjes
    ctx.arc(0, 0, bot.r * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d9c2ff';
    ctx.lineWidth = isBroodling ? 1 : 1.5;
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(i * 0.5) * bot.r * 1.4, Math.sin(i * 0.5) * bot.r * 1.4);
      ctx.stroke();
    }
  } else if (isGravitas) {
    // donker lichaam met kolkende paarse ringen
    ctx.arc(0, 0, bot.r * 0.8, 0, Math.PI * 2);
    ctx.fill();
    const spin = (now / 250) % (Math.PI * 2);
    ctx.strokeStyle = '#c9a3ff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, bot.r * 1.05, spin, spin + Math.PI * 1.2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, bot.r * 1.05, spin + Math.PI, spin + Math.PI * 2.2); ctx.stroke();
  } else if (isCryostasis) {
    // ijskristal-vormig lichaam
    ctx.moveTo(0, -bot.r * 1.15);
    ctx.lineTo(bot.r * 0.6, -bot.r * 0.2);
    ctx.lineTo(bot.r * 0.75, bot.r * 0.65);
    ctx.lineTo(0, bot.r * 1.1);
    ctx.lineTo(-bot.r * 0.75, bot.r * 0.65);
    ctx.lineTo(-bot.r * 0.6, -bot.r * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#eaffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (isRailgunner) {
    // langwerpig, streamlined lichaam met een lange loop
    ctx.ellipse(0, 0, bot.r * 0.85, bot.r * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffb199';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffb199';
    ctx.fillRect(bot.r * 0.5, -3, bot.r * 1.1, 6);
  } else if (isVexer) {
    // spitse, hoekige heksvorm
    ctx.moveTo(bot.r, 0);
    ctx.lineTo(-bot.r * 0.5, -bot.r * 0.85);
    ctx.lineTo(-bot.r * 0.2, 0);
    ctx.lineTo(-bot.r * 0.5, bot.r * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffb3ec';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (isBombardier) {
    // ronde, gepantserde mortier-vorm met een koepel
    ctx.arc(0, 0, bot.r * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffdca0';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffdca0';
    ctx.beginPath(); ctx.arc(-bot.r * 0.3, -bot.r * 0.3, bot.r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(bot.r * 0.3, -bot.r * 0.3, bot.r * 0.22, 0, Math.PI * 2); ctx.fill();
  } else if (isSplitter) {
    // bolvormig lichaam met zichtbare scheuren die de split-gimmick tonen
    ctx.arc(0, 0, bot.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -bot.r * 0.9); ctx.lineTo(-bot.r * 0.15, -bot.r * 0.1); ctx.lineTo(bot.r * 0.2, bot.r * 0.15); ctx.lineTo(0, bot.r * 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-bot.r * 0.85, bot.r * 0.35); ctx.lineTo(-bot.r * 0.1, bot.r * 0.05); ctx.lineTo(bot.r * 0.85, bot.r * 0.4);
    ctx.stroke();
  } else {
    ctx.arc(0, 0, bot.r, 0, Math.PI * 2);
    ctx.fill();
  }
  if (isMelee) {
    // mes i.p.v. geweer
    const lunge = slashing ? 6 : 0;
    ctx.fillStyle = '#e8e8e8';
    ctx.beginPath();
    ctx.moveTo(bot.r - 2, -3);
    ctx.lineTo(bot.r + 16 + lunge, 0);
    ctx.lineTo(bot.r - 2, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#555';
    ctx.fillRect(bot.r - 6, -2, 6, 4);
  } else if (isTurret) {
    // blokkig kanon i.p.v. rond geweer
    ctx.fillStyle = '#111';
    ctx.fillRect(-bot.r * 0.6, -bot.r * 0.6, bot.r * 1.2, bot.r * 1.2);
    ctx.fillStyle = '#444';
    ctx.fillRect(0, -4, bot.r + 12, 8);
  } else {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, -3, bot.r + 8, 6);
  }
  ctx.restore();

  if (isBoss) {
    // colossus: constante dreigende pulserende gloed, altijd zichtbaar
    const pulse = 1 + Math.sin(now / 220) * 0.08;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = '#ff3838';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(bot.x, bot.y, (bot.r + 12) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bot.x, bot.y, (bot.r + 20) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (isBomber) {
    // dreigende gloed die feller wordt naarmate hij dichterbij komt
    const dist = Math.hypot(player.x - bot.x, player.y - bot.y);
    const proximity = Math.max(0, Math.min(1, 1 - dist / 250));
    if (proximity > 0) {
      ctx.save();
      ctx.globalAlpha = 0.3 + proximity * 0.5;
      ctx.strokeStyle = '#ff3838';
      ctx.lineWidth = 2 + proximity * 3;
      ctx.beginPath();
      ctx.arc(bot.x, bot.y, bot.r + 5 + proximity * 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  if (bot.invulnUntil && now < bot.invulnUntil) {
    // lichtblauwe schild-ring: bot is tijdelijk onkwetsbaar (bv. net gespawnde Splitter-kinderen)
    const pulse = 1 + Math.sin(now / 90) * 0.08;
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#8ecbff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(bot.x, bot.y, (bot.r + 5) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (isSwapper) {
    // draaiende paarse swirl-ring rond de swapper, waarschuwt voor het plek-wissel-effect
    const spin = (now / 300) % (Math.PI * 2);
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = '#e100ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bot.x, bot.y, bot.r + 8, spin, spin + Math.PI * 1.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(bot.x, bot.y, bot.r + 8, spin + Math.PI, spin + Math.PI * 2.3);
    ctx.stroke();
    ctx.restore();
  }

  if (frozen) {
    ctx.save();
    ctx.strokeStyle = 'rgba(155, 227, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bot.x, bot.y, bot.r + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // HP bar for tougher bots (niet nodig voor onsterfelijke oefen-bots)
  if (bot.maxHp > 2 && !bot.immortal) {
    const barW = bot.r * 2;
    const barX = bot.x - bot.r;
    const barY = bot.y - bot.r - 10;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX, barY, barW, 5);
    ctx.fillStyle = bot.hp / bot.maxHp > 0.5 ? '#4cd964' : bot.hp / bot.maxHp > 0.25 ? '#ffd60a' : '#ff5c5c';
    ctx.fillRect(barX, barY, barW * (bot.hp / bot.maxHp), 5);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const nowShake = performance.now();
  ctx.save();
  if (nowShake < earthquakeShakeUntil) {
    const shakeT = (earthquakeShakeUntil - nowShake) / 3500;
    const mag = 26 * shakeT;
    ctx.translate((Math.random() - 0.5) * mag * 2, (Math.random() - 0.5) * mag * 2);
  }

  // grid background
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  const gridSize = 50;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  if (nowShake < iceFloorUntil) drawIceFloorOverlay();

  // bullets
  bullets.forEach(b => {
    if (b.owner === 'player') {
      drawPlayerBullet(b);
    } else {
      ctx.fillStyle = '#ff5c5c';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // particles
  particles.forEach(p => {
    ctx.globalAlpha = p.life / 30;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  bots.forEach(drawBot);
  powerups.forEach(drawPowerup);
  coinPickups.forEach(drawCoinPickup);
  telegraphs.forEach(drawTelegraph);
  laserTelegraphs.forEach(drawLaserTelegraph);
  blackHoles.forEach(drawBlackHole);
  explosions.forEach(drawExplosion);
  lightningBolts.forEach(drawLightningBolt);
  fallingMeteors.forEach(drawFallingMeteor);
  activeLasers.forEach(drawActiveLaser);
  barrageTelegraphs.forEach(drawBarrageTelegraph);
  barrageLasers.forEach(drawBarrageLaser);
  iceGrenades.forEach(drawIceGrenade);
  vampBolts.forEach(drawVampBolt);
  stickyThrows.forEach(drawStickyThrow);
  bladeTrails.forEach(drawBladeTrail);
  fireZones.forEach(drawFireZone);
  gasClouds.forEach(drawGasCloud);
  fireballThrows.forEach(drawFireballThrow);
  chargeTrails.forEach(drawChargeTrail);
  deployedTurrets.forEach(drawTurret);

  // boost glow rond speler
  const nowDraw = performance.now();
  if (nowDraw < player.shieldUntil) {
    ctx.save();
    ctx.strokeStyle = 'rgba(199, 125, 255, 0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (nowDraw < player.boostUntil) {
    ctx.save();
    ctx.strokeStyle = 'rgba(76, 201, 240, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (nowDraw < player.fireBoostUntil) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 214, 10, 0.6)';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (nowDraw < player.damageBoostUntil) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 56, 56, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (nowDraw < player.multiShotUntil) {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 255, 176, 0.7)';
    ctx.lineWidth = 3;
    ctx.setLineDash([2, 6]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (nowDraw < player.invisibleUntil) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = 'rgba(170, 170, 170, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (nowDraw < player.timewarpUntil) {
    ctx.save();
    ctx.strokeStyle = 'rgba(102, 204, 255, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (nowDraw < player.ricochetUntil) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = 'rgba(255, 140, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (nowDraw < player.homingUntil) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = 'rgba(255, 20, 147, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (nowDraw < player.stunUntil) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 38, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (nowDraw < player.auraUntil) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = 'rgba(127, 255, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 190, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = 'rgba(127, 255, 0, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 190, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (nowDraw < player.overloadUntil) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = 'rgba(255, 99, 71, 0.9)';
    ctx.lineWidth = 3;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawPlayer();
  ctx.restore();

  if (nowShake < sandstormUntil) drawSandstormOverlay();
}

