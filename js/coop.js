// ---- 2-Speler Co-op: lobby aanmaken/joinen via een code, via Firestore ----
// Dit is fase 1: lobby aanmaken, joinen met een code, live spelerslijst zien, en de host kan de lobby
// op "gestart" zetten. De daadwerkelijk gedeelde gameplay (bots/kogels/schade synchroniseren tussen
// spelers tijdens een potje) is een aparte, latere uitbreiding — voor nu bewijst deze fase dat de
// lobby-infrastructuur (code aanmaken/joinen, realtime spelerslijst, host/gast-rollen) werkt.

const COOP_MAX_PLAYERS = 3;
const COOP_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // geen O/0/I/1, voorkomt verwarring bij het overtypen

let coopLobbyCode = null;
let coopIsHost = false;
let coopPlayersUnsub = null;
let coopLobbyUnsub = null;

function generateCoopCode() {
  let code = '';
  for (let i = 0; i < 5; i++) code += COOP_CODE_CHARS[Math.floor(Math.random() * COOP_CODE_CHARS.length)];
  return code;
}

function openCoopHub() {
  document.getElementById(menuScreenId()).style.display = 'none';
  document.getElementById('coopHubScreen').style.display = 'flex';
  document.getElementById('coopJoinCodeInput').value = '';
  document.getElementById('coopJoinStatus').textContent = '';
}
window.openCoopHub = openCoopHub;

function closeCoopHub() {
  document.getElementById('coopHubScreen').style.display = 'none';
  document.getElementById(menuScreenId()).style.display = 'flex';
}
window.closeCoopHub = closeCoopHub;

async function createCoopLobby() {
  if (!currentUid || !currentAccount) return;
  let code = generateCoopCode();
  try {
    // Kans op een botsende code is klein (5 tekens uit 33 mogelijke) maar niet nul — een paar keer
    // proberen met een verse code als de eerste toevallig al bezet blijkt.
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await db.collection('lobbies').doc(code).get();
      if (!existing.exists) break;
      code = generateCoopCode();
    }
    await db.collection('lobbies').doc(code).set({
      hostUid: currentUid,
      hostName: currentAccount,
      status: 'waiting',
      createdAt: Date.now()
    });
    await db.collection('lobbies').doc(code).collection('players').doc(currentUid).set({
      name: currentAccount,
      joinedAt: Date.now()
    });
    enterCoopLobby(code, true);
  } catch (e) {
    alert('Kon geen lobby aanmaken, probeer het opnieuw.');
  }
}
window.createCoopLobby = createCoopLobby;

async function joinCoopLobby() {
  const statusEl = document.getElementById('coopJoinStatus');
  const code = document.getElementById('coopJoinCodeInput').value.trim().toUpperCase();
  if (!code) { statusEl.textContent = 'Vul een lobbycode in.'; return; }
  if (!currentUid || !currentAccount) return;
  statusEl.textContent = 'Bezig...';
  try {
    const lobbyDoc = await db.collection('lobbies').doc(code).get();
    if (!lobbyDoc.exists) { statusEl.textContent = 'Lobby niet gevonden.'; return; }
    const data = lobbyDoc.data();
    if (data.status !== 'waiting') { statusEl.textContent = 'Deze lobby is al gestart of gesloten.'; return; }
    const playersSnap = await db.collection('lobbies').doc(code).collection('players').get();
    if (playersSnap.size >= COOP_MAX_PLAYERS) { statusEl.textContent = 'Deze lobby zit al vol.'; return; }
    await db.collection('lobbies').doc(code).collection('players').doc(currentUid).set({
      name: currentAccount,
      joinedAt: Date.now()
    });
    enterCoopLobby(code, data.hostUid === currentUid);
  } catch (e) {
    statusEl.textContent = 'Er ging iets mis, probeer het opnieuw.';
  }
}
window.joinCoopLobby = joinCoopLobby;

function enterCoopLobby(code, isHost) {
  coopLobbyCode = code;
  coopIsHost = isHost;
  document.getElementById('coopHubScreen').style.display = 'none';
  document.getElementById('coopLobbyScreen').style.display = 'flex';
  document.getElementById('coopLobbyCode').textContent = code;
  document.getElementById('coopStartBtn').style.display = isHost ? 'block' : 'none';
  document.getElementById('coopLobbyStatus').textContent = isHost
    ? 'Wacht tot je vrienden joinen met de code hierboven, klik daarna op Start.'
    : 'Wacht tot de host het potje start...';
  listenToCoopLobby(code);
}

function listenToCoopLobby(code) {
  stopCoopListeners();
  coopPlayersUnsub = db.collection('lobbies').doc(code).collection('players')
    .onSnapshot(snap => {
      const players = [];
      snap.forEach(doc => players.push(doc.data()));
      players.sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
      const listEl = document.getElementById('coopPlayersList');
      if (listEl) {
        listEl.innerHTML = players.length
          ? players.map(p => `<div class="coopPlayerRow"><span>${escapeHtml(String(p.name || '?'))}</span><span>✅</span></div>`).join('')
          : '<div class="coopPlayerRow"><span>Nog niemand...</span></div>';
      }
    }, () => { /* stil negeren bij een tijdelijke verbindingsstoring */ });
  coopLobbyUnsub = db.collection('lobbies').doc(code)
    .onSnapshot(doc => {
      const statusEl = document.getElementById('coopLobbyStatus');
      if (!doc.exists) {
        if (statusEl) statusEl.textContent = 'De lobby is gesloten door de host.';
        return;
      }
      const data = doc.data();
      if (data.status === 'playing' && !coopIsHost && statusEl) {
        statusEl.textContent = 'De host is gestart! (het gedeelde potje zelf volgt in een latere update)';
      }
    }, () => { /* stil negeren bij een tijdelijke verbindingsstoring */ });
}

function stopCoopListeners() {
  if (coopPlayersUnsub) { coopPlayersUnsub(); coopPlayersUnsub = null; }
  if (coopLobbyUnsub) { coopLobbyUnsub(); coopLobbyUnsub = null; }
}

async function leaveCoopLobby() {
  if (coopLobbyCode && currentUid) {
    try {
      await db.collection('lobbies').doc(coopLobbyCode).collection('players').doc(currentUid).delete();
      if (coopIsHost) {
        await db.collection('lobbies').doc(coopLobbyCode).delete();
      }
    } catch (e) { /* stil negeren, we gaan hoe dan ook terug naar het menu */ }
  }
  stopCoopListeners();
  coopLobbyCode = null;
  coopIsHost = false;
  document.getElementById('coopLobbyScreen').style.display = 'none';
  document.getElementById(menuScreenId()).style.display = 'flex';
}
window.leaveCoopLobby = leaveCoopLobby;

async function startCoopMatch() {
  if (!coopIsHost || !coopLobbyCode) return;
  const statusEl = document.getElementById('coopLobbyStatus');
  try {
    await db.collection('lobbies').doc(coopLobbyCode).update({ status: 'playing' });
    if (statusEl) statusEl.textContent = 'Lobby gestart! Het gedeelde potje zelf (samen bots doden) volgt in een latere update — deze lobby-basis werkt al.';
  } catch (e) {
    if (statusEl) statusEl.textContent = 'Kon niet starten, probeer het opnieuw.';
  }
}
window.startCoopMatch = startCoopMatch;
