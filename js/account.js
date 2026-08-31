// ---- Account-systeem ----
// Accounts (gebruikersnaam + wachtwoord) en spelvoortgang staan in de cloud (Firebase Auth + Firestore,
// zie firebase-config.js), zodat je op elk apparaat met dezelfde zelfverzonnen gebruikersnaam kunt inloggen.
// Firebase Auth werkt intern met e-mailadressen, dus elke gebruikersnaam wordt hieronder omgezet naar een
// verzonnen "e-mailadres" (nooit getoond, puur intern) — je logt zelf gewoon in met een eigen bedachte naam.
// Instellingen als geluid/muziektrack blijven bewust apart (device-voorkeur, geen spelvoortgang).
const ACCOUNT_KEYS = [
  'botShooterCoins', 'botShooterOwnedWeapons', 'botShooterOwnedArmor',
  'botShooterEquippedWeapon', 'botShooterEquippedArmor', 'botShooterEquippedArmor2',
  'botShooterHasDualArmor', 'botShooterLvlExtraHp', 'botShooterLvlSprint',
  'botShooterLvlMagnet', 'botShooterLvlLongBoosts', 'botShooterHasRevive',
  'botShooterLvlFastReload', 'botShooterLvlIronSkin', 'botShooterLvlLuckyDrop',
  'botShooterLvlPiercingRounds', 'botShooterLvlCoinRain', 'botShooterLvlSecondWind',
  'botShooterLvlSharpshooter', 'botShooterLvlFlyingStart', 'botShooterPowerupLevels',
  'botShooterOwnedSkins', 'botShooterEquippedSkin',
  'botShooterOwnedTransforms', 'botShooterEquippedTransform',
  'botShooterHighScore', 'botShooterHighScoreHardcore', 'botShooterHighScoreWorld2', 'botShooterHighLevel',
  'botShooterCoinGrant_3500', 'botShooterCoinGrant_500', 'botShooterCoinGrant_600',
  'botShooterCoinGrant_1000', 'botShooterCoinGrant_1000b', 'botShooterCoinGrant_2500',
  'botShooterCoinGrant_200', 'botShooterCoinGrant_10000',
  'botShooterCoinGrant_2000b', 'botShooterCoinGrant_15000', 'botShooterWorld2Unlocked',
  'botShooterLvl2FireCore', 'botShooterLvl2FrostBlood', 'botShooterLvl2Steadfast',
  'botShooterLvl2FastReload', 'botShooterLvl2LongBoosts', 'botShooterLvl2Magnet',
  'botShooterHasRevive2', 'botShooterLvl2Vengeance', 'botShooterLvl2IronSkin', 'botShooterLvl2ExtraHp',
  'botShooterLvl2LuckyDrop', 'botShooterLvl2PiercingRounds', 'botShooterLvl2CoinRain',
  'botShooterLvl2SecondWind', 'botShooterLvl2Sharpshooter', 'botShooterLvl2FlyingStart',
  'botShooterLvl2CriticalHit', 'botShooterLvl2SplinterShot', 'botShooterLvl2MultiShield', 'botShooterLvl2Overkill',
  'botShooterElementalCores', 'botShooterHasFirstBoss', 'botShooterHasWorldBoss',
  'botShooterHasBossRushW1', 'botShooterHasBossRushW2', 'botShooterUnlockedAchievements',
  'botShooterLvlCoreDamage', 'botShooterLvlCoreShield', 'botShooterHasCoreHarvest',
  'botShooterLvlCoreSpeed', 'botShooterLvlCoreRegen', 'botShooterLvlCoreVampire',
  'botShooterHasCoreAura', 'botShooterHasCoreShock', 'botShooterClaimedAchievementRewards',
  'botShooterOwnedWeaponSkins', 'botShooterEquippedWeaponSkins',
  'botShooterOwnedDeathAnimations', 'botShooterEquippedDeathAnimation',
  'botShooterTotalLifetimeKills', 'botShooterWeaponKillCounts', 'botShooterHighScoreSprint',
  'botShooterOwnedTrails', 'botShooterEquippedTrail',
  'botShooterBotKillCounts',
  'botShooterOwnedMenuBackgrounds', 'botShooterEquippedMenuBackground',
  'botShooterHasDualArmor2',
  'botShooterOwnedBotKillEffects', 'botShooterEquippedBotKillEffect',
  'botShooterFavoriteItems',
  'botShooterOwnedIntroAnimations', 'botShooterEquippedIntroAnimation',
  'botShooterLastMysteryBoxOpen',
  'botShooterDroneLevels',
  'botShooterLastWorld2MysteryBoxOpen',
  'botShooterLastRiskBoxOpen',
  'botShooterDoubleOrNothingStake',
  'botShooterCoreDoubleOrNothingStake'
];

let currentAccount = null;
let currentUid = null;

function usernameToFakeEmail(username) {
  return username.trim().toLowerCase() + '@botshooter.local';
}
function isValidUsername(username) {
  return /^[a-zA-Z0-9_-]{3,20}$/.test(username);
}

function defaultAccountSnapshot() {
  const snap = {};
  ACCOUNT_KEYS.forEach(k => { snap[k] = null; });
  snap['botShooterCoins'] = '0';
  snap['botShooterOwnedWeapons'] = '["pistol"]';
  snap['botShooterOwnedArmor'] = '["none"]';
  snap['botShooterEquippedWeapon'] = 'pistol';
  snap['botShooterEquippedArmor'] = 'none';
  snap['botShooterEquippedArmor2'] = 'none';
  snap['botShooterOwnedSkins'] = '["default"]';
  snap['botShooterEquippedSkin'] = 'default';
  snap['botShooterOwnedTransforms'] = '["none"]';
  snap['botShooterEquippedTransform'] = 'none';
  snap['botShooterHighScore'] = '0';
  snap['botShooterHighScoreHardcore'] = '0';
  snap['botShooterHighScoreWorld2'] = '0';
  snap['botShooterHighLevel'] = '1';
  snap['botShooterPowerupLevels'] = '{}';
  // munten-bonussen tellen als al opgehaald, zodat nieuwe accounts echt bij 0 beginnen
  snap['botShooterCoinGrant_3500'] = 'true';
  snap['botShooterCoinGrant_500'] = 'true';
  snap['botShooterCoinGrant_600'] = 'true';
  snap['botShooterCoinGrant_1000'] = 'true';
  snap['botShooterCoinGrant_1000b'] = 'true';
  snap['botShooterCoinGrant_2500'] = 'true';
  snap['botShooterCoinGrant_200'] = 'true';
  snap['botShooterCoinGrant_10000'] = 'true';
  snap['botShooterCoinGrant_2000b'] = 'true';
  snap['botShooterCoinGrant_15000'] = 'true';
  return snap;
}

function hydrateFromSnapshot(snapshot) {
  ACCOUNT_KEYS.forEach(k => {
    const v = snapshot[k];
    if (v === null || v === undefined) {
      localStorage.removeItem(k);
    } else {
      localStorage.setItem(k, v);
    }
  });
}

async function loadAccountFromCloud(uid) {
  const doc = await db.collection('users').doc(uid).get();
  const snapshot = (doc.exists && doc.data().save) ? doc.data().save : defaultAccountSnapshot();
  hydrateFromSnapshot(snapshot);
}

// Munten/Elemental Cores die een admin via Admin Commands voor deze speler heeft klaargezet, worden
// hier opgehaald en toegevoegd bij het inloggen — zo overschrijft de eigen periodieke save-sync
// (die anders een cadeau van een ander apparaat gewoon weer teniet zou doen) het nooit.
async function applyPendingGrants(uid) {
  const snap = await db.collection('users').doc(uid).collection('pendingGrants').get();
  if (snap.empty) return;
  let coinsGranted = 0, coresGranted = 0;
  snap.forEach(doc => {
    const data = doc.data();
    coinsGranted += Number(data.coins) || 0;
    coresGranted += Number(data.cores) || 0;
  });
  if (coinsGranted > 0) {
    const currentCoins = Number(localStorage.getItem('botShooterCoins')) || 0;
    localStorage.setItem('botShooterCoins', currentCoins + coinsGranted);
  }
  if (coresGranted > 0) {
    const currentCores = Number(localStorage.getItem('botShooterElementalCores')) || 0;
    localStorage.setItem('botShooterElementalCores', currentCores + coresGranted);
  }
  await Promise.all(snap.docs.map(doc => doc.ref.delete()));
}

async function syncCurrentAccountSave() {
  if (!currentAccount || !currentUid) return;
  const snapshot = {};
  ACCOUNT_KEYS.forEach(k => { snapshot[k] = localStorage.getItem(k); });
  try {
    await db.collection('users').doc(currentUid).set({ username: currentAccount, save: snapshot }, { merge: true });
  } catch (e) {
    // Netwerkfout of offline: geen probleem, de eerstvolgende poging probeert het gewoon opnieuw.
    // Met enablePersistence() (firebase-config.js) staat de laatste save ook al lokaal in de wachtrij.
  }
}

function setAuthMessage(el, text, isError) {
  el.textContent = text;
  el.style.color = isError ? '#ff5c5c' : '#aaa';
}

function showAuthView(view) {
  document.getElementById('authGateView').style.display = view === 'gate' ? 'block' : 'none';
  document.getElementById('authLoginView').style.display = view === 'login' ? 'block' : 'none';
  document.getElementById('authCreateView').style.display = view === 'create' ? 'block' : 'none';
  document.getElementById('authLoginError').textContent = '';
  document.getElementById('authCreateError').textContent = '';
}
window.showAuthView = showAuthView;

async function attemptLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('authLoginError');
  if (!username || !password) {
    setAuthMessage(errEl, 'Vul een naam en wachtwoord in.', true);
    return;
  }
  if (!isValidUsername(username)) {
    setAuthMessage(errEl, 'Gebruikersnaam: 3-20 tekens, alleen letters, cijfers, _ of -.', true);
    return;
  }
  setAuthMessage(errEl, 'Bezig met inloggen...', false);
  // Vóór de Firebase-call gezet: zodra signIn slaagt, vuurt onAuthStateChanged bijna meteen af en
  // checkt deze timestamp — stond hij nog op oud/leeg, dan werd de net ingelogde gebruiker weer
  // direct uitgelogd (race condition). Mislukt het inloggen alsnog, dan zetten we 'm in de catch terug.
  localStorage.setItem('botShooterLoginTimestamp', Date.now());
  try {
    const cred = await auth.signInWithEmailAndPassword(usernameToFakeEmail(username), password);
    await loadAccountFromCloud(cred.user.uid);
    await applyPendingGrants(cred.user.uid);
    currentAccount = username;
    currentUid = cred.user.uid;
    localStorage.setItem('botShooterActiveAccount', username);
    localStorage.setItem('botShooterActiveUid', cred.user.uid);
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
    location.reload();
  } catch (e) {
    localStorage.removeItem('botShooterLoginTimestamp');
    setAuthMessage(errEl, 'Onjuiste naam of wachtwoord.', true);
  }
}
window.attemptLogin = attemptLogin;

async function attemptCreateAccount() {
  const username = document.getElementById('createUsername').value.trim();
  const password = document.getElementById('createPassword').value;
  const errEl = document.getElementById('authCreateError');
  if (!username || !password) {
    setAuthMessage(errEl, 'Vul een naam en wachtwoord in.', true);
    return;
  }
  if (!isValidUsername(username)) {
    setAuthMessage(errEl, 'Gebruikersnaam: 3-20 tekens, alleen letters, cijfers, _ of -.', true);
    return;
  }
  if (password.length < 6) {
    setAuthMessage(errEl, 'Wachtwoord moet minstens 6 tekens zijn.', true);
    return;
  }
  setAuthMessage(errEl, 'Bezig met aanmaken...', false);
  // Zie attemptLogin() hierboven voor waarom dit vóór de Firebase-call moet gebeuren.
  localStorage.setItem('botShooterLoginTimestamp', Date.now());
  try {
    const cred = await auth.createUserWithEmailAndPassword(usernameToFakeEmail(username), password);
    const snapshot = defaultAccountSnapshot();
    await db.collection('users').doc(cred.user.uid).set({ username, save: snapshot });
    hydrateFromSnapshot(snapshot);
    currentAccount = username;
    currentUid = cred.user.uid;
    localStorage.setItem('botShooterActiveAccount', username);
    localStorage.setItem('botShooterActiveUid', cred.user.uid);
    document.getElementById('authScreen').style.display = 'none';
    location.reload();
  } catch (e) {
    localStorage.removeItem('botShooterLoginTimestamp');
    if (e.code === 'auth/email-already-in-use') {
      setAuthMessage(errEl, 'Deze naam bestaat al.', true);
    } else if (e.code === 'auth/weak-password') {
      setAuthMessage(errEl, 'Wachtwoord moet minstens 6 tekens zijn.', true);
    } else {
      setAuthMessage(errEl, 'Er ging iets mis, probeer het opnieuw.', true);
    }
  }
}
window.attemptCreateAccount = attemptCreateAccount;

// Blijf ingelogd: Firebase Auth onthoudt je sessie zelf, dus je hoeft niet elke keer opnieuw in te
// loggen wanneer het spel (opnieuw) geladen wordt — maar wel opnieuw na 24 uur, dan moet je je naam
// en wachtwoord weer invullen (wij dwingen dat zelf af, los van Firebase's eigen sessie-duur).
const LOGIN_SESSION_DURATION = 24 * 60 * 60 * 1000;
let lastLoginTimestamp = Number(localStorage.getItem('botShooterLoginTimestamp')) || 0;

auth.onAuthStateChanged(async user => {
  if (!user) {
    currentAccount = null;
    currentUid = null;
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('authScreen').style.display = 'flex';
    updateLoginSessionTimer();
    return;
  }
  lastLoginTimestamp = Number(localStorage.getItem('botShooterLoginTimestamp')) || 0;
  if (Date.now() - lastLoginTimestamp >= LOGIN_SESSION_DURATION) {
    await auth.signOut(); // dwingt na 24 uur een nieuwe login af, triggert deze functie opnieuw met user=null
    return;
  }
  // Gebruikersnaam altijd uit Firestore halen (gekoppeld aan het echte, actief ingelogde uid) in
  // plaats van uit een losse localStorage-vlag — die kon door een race met deze functie soms nog de
  // naam van een vorig account bevatten, waardoor je in het verkeerde account leek te belanden.
  currentUid = user.uid;
  const userDoc = await db.collection('users').doc(user.uid).get();
  currentAccount = userDoc.exists ? userDoc.data().username : localStorage.getItem('botShooterActiveAccount');
  localStorage.setItem('botShooterActiveAccount', currentAccount);
  document.getElementById('authScreen').style.display = 'none';
  updateLoginSessionTimer();
  await applyPendingGrants(user.uid);
  refreshCurrencyDisplays();
  updateHUD();
});

setInterval(syncCurrentAccountSave, 8000);
window.addEventListener('beforeunload', syncCurrentAccountSave);

function formatLoginSessionTimeLeft(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateLoginSessionTimer() {
  const el = document.getElementById('loginSessionTimer');
  const switchBtn = document.getElementById('switchAccountBtn');
  if (!currentAccount) {
    if (el) el.style.display = 'none';
    if (switchBtn) switchBtn.style.display = 'none';
    return;
  }
  if (switchBtn) switchBtn.style.display = 'block';
  if (!el) return;
  const timeLeft = LOGIN_SESSION_DURATION - (Date.now() - lastLoginTimestamp);
  el.style.display = 'block';
  el.textContent = `Opnieuw inloggen in ${formatLoginSessionTimeLeft(timeLeft)}`;
}
updateLoginSessionTimer();
setInterval(updateLoginSessionTimer, 1000);

async function switchAccount() {
  goToMenu();
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('world2Screen').style.display = 'none';
  await syncCurrentAccountSave(); // laatste stand nog even wegschrijven voordat we uitloggen
  localStorage.removeItem('botShooterActiveAccount');
  localStorage.removeItem('botShooterActiveUid');
  localStorage.removeItem('botShooterLoginTimestamp');
  ACCOUNT_KEYS.forEach(k => localStorage.removeItem(k)); // geen restjes spelvoortgang van dit account laten hangen
  await auth.signOut();
  location.reload(); // volledig verse pagina, net als na inloggen/aanmaken — voorkomt dat oude sessiestatus blijft hangen
}
window.switchAccount = switchAccount;
