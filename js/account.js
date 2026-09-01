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
  'botShooterLvlCriticalHit', 'botShooterLvlSplinterShot', 'botShooterLvlShockwave',
  'botShooterLvlMultiShield', 'botShooterLvlGoldRush', 'botShooterLvlOverkill', 'botShooterLvlBloodlust',
  'botShooterOwnedSkins', 'botShooterEquippedSkin',
  'botShooterOwnedTransforms', 'botShooterEquippedTransform',
  'botShooterHighScore', 'botShooterHighScoreHardcore', 'botShooterHighScoreWorld2', 'botShooterHighLevel',
  'botShooterWorld2Unlocked',
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
  'botShooterHighestComboStreak',
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
  'botShooterCoreDoubleOrNothingStake',
  'botShooterDoubleOrNothingWindowStart', 'botShooterDoubleOrNothingUsesThisWindow',
  'botShooterCoreDoubleOrNothingWindowStart', 'botShooterCoreDoubleOrNothingUsesThisWindow'
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
  snap['botShooterHighestComboStreak'] = '0';
  snap['botShooterTotalLifetimeKills'] = '0';
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

async function hydrateFromCloud(uid) {
  const userDoc = await db.collection('users').doc(uid).get();
  if (userDoc.exists && userDoc.data().save) hydrateFromSnapshot(userDoc.data().save);
  return userDoc;
}

// Berichten die een admin via Admin Commands voor deze speler heeft klaargezet, worden bij het
// inloggen opgehaald, getoond en daarna verwijderd uit de wachtrij.
async function applyPendingMessages(uid) {
  try {
    const snap = await db.collection('users').doc(uid).collection('pendingMessages').get();
    if (snap.empty) return;
    const texts = snap.docs.map(doc => doc.data().text).filter(Boolean);
    await Promise.all(snap.docs.map(doc => doc.ref.delete()));
    if (texts.length) {
      setTimeout(() => showAdminMessageScreen(texts.join('\n\n')), 300); // even wachten tot het menu zichtbaar is
    }
  } catch (e) {
    // Stil negeren — zie toelichting bij applyPendingGrants() hieronder.
  }
}

// Munten/Elemental Cores die een admin via Admin Commands voor deze speler heeft klaargezet, worden
// hier opgehaald en toegevoegd bij het inloggen — zo overschrijft de eigen periodieke save-sync
// (die anders een cadeau van een ander apparaat gewoon weer teniet zou doen) het nooit.
async function checkIfBanned(uid) {
  try {
    const banDoc = await db.collection('bannedPlayers').doc(uid).get();
    if (banDoc.exists) {
      const reason = banDoc.data().reason;
      document.getElementById('bannedReasonText').textContent = reason ? `Reden: ${reason}` : '';
      document.getElementById('startScreen').style.display = 'none';
      document.getElementById('world2Screen').style.display = 'none';
      document.getElementById('bannedScreen').style.display = 'flex';
      return true;
    }
  } catch (e) {
    // Kon niet checken of dit account geblokkeerd is (bv. even geen verbinding) — dan gewoon door laten
    // gaan (fail-open), zodat een tijdelijke storing niet per ongeluk iedereen blokkeert.
  }
  return false;
}
window.checkIfBanned = checkIfBanned;

async function applyPendingGrants(uid) {
  // Mag NOOIT een fout naar buiten gooien: dit is een extraatje bovenop het inloggen, geen vereiste
  // stap — als de wachtrij-check faalt (bv. security rules nog niet ingesteld, even geen verbinding),
  // mag dat het inloggen zelf niet laten crashen (dat gaf eerder een verdwenen hoofdmenu).
  try {
    const snap = await db.collection('users').doc(uid).collection('pendingGrants').get();
    if (snap.empty) return;
    let coinsGranted = 0, coresGranted = 0;
    snap.forEach(doc => {
      const data = doc.data();
      coinsGranted += Number(data.coins) || 0;
      coresGranted += Number(data.cores) || 0;
    });
    // Zowel de actieve spelvariabelen (coins/elementalCores, voor wat er nu op het scherm staat) als
    // localStorage bijwerken — deze functie wordt niet meer alleen bij het inloggen aangeroepen (waarna
    // altijd een reload volgt), maar ook bv. bij het terugkeren naar het hoofdmenu, zonder reload.
    if (coinsGranted !== 0) {
      coins = Math.max(0, coins + coinsGranted);
      localStorage.setItem('botShooterCoins', coins);
    }
    if (coresGranted !== 0) {
      elementalCores = Math.max(0, elementalCores + coresGranted);
      localStorage.setItem('botShooterElementalCores', elementalCores);
    }
    // Meteen ook de VOLLEDIGE save terugschrijven naar de cloud (dezelfde functie als de periodieke
    // sync), niet wachten op het volgende interval — anders kan een tussentijdse page-reload de net
    // toegepaste aanpassing weer overschrijven met de oude cloud-stand. Bewust de bestaande, geteste
    // syncCurrentAccountSave() hergebruikt in plaats van zelf maar 2 velden terug te schrijven: een
    // eerdere versie deed dat via een geneste merge-write, die per ongeluk de rest van de save
    // (wapens, skins, enz.) leegmaakte.
    if (coinsGranted !== 0 || coresGranted !== 0) {
      await syncCurrentAccountSave();
      refreshCurrencyDisplays();
      updateHUD();
    }
    await Promise.all(snap.docs.map(doc => doc.ref.delete()));
  } catch (e) {
    // Stil negeren — zie toelichting hierboven.
  }
}

async function applyPendingWeaponRemovals(uid) {
  // Mag net als applyPendingGrants nooit een fout naar buiten gooien.
  try {
    const snap = await db.collection('users').doc(uid).collection('pendingWeaponRemovals').get();
    if (snap.empty) return;
    let changed = false;
    snap.forEach(doc => {
      const weaponId = doc.data().weaponId;
      const idx = ownedWeapons.indexOf(weaponId);
      if (idx !== -1) {
        ownedWeapons.splice(idx, 1);
        changed = true;
        // Als het weggehaalde wapen ook uitgerust stond, terugvallen op het pistool zodat er altijd
        // een geldig, bezeten wapen actief blijft.
        if (equippedWeapon === weaponId) {
          equippedWeapon = 'pistol';
          localStorage.setItem('botShooterEquippedWeapon', equippedWeapon);
        }
      }
    });
    if (changed) {
      localStorage.setItem('botShooterOwnedWeapons', JSON.stringify(ownedWeapons));
      await syncCurrentAccountSave();
    }
    await Promise.all(snap.docs.map(doc => doc.ref.delete()));
  } catch (e) {
    // Stil negeren — zie toelichting hierboven.
  }
}

async function applyPendingWeaponGrants(uid) {
  // Mag net als applyPendingGrants nooit een fout naar buiten gooien.
  try {
    const snap = await db.collection('users').doc(uid).collection('pendingWeaponGrants').get();
    if (snap.empty) return;
    let changed = false;
    snap.forEach(doc => {
      const weaponId = doc.data().weaponId;
      if (weaponId && !ownedWeapons.includes(weaponId)) {
        ownedWeapons.push(weaponId);
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem('botShooterOwnedWeapons', JSON.stringify(ownedWeapons));
      await syncCurrentAccountSave();
    }
    await Promise.all(snap.docs.map(doc => doc.ref.delete()));
  } catch (e) {
    // Stil negeren — zie toelichting hierboven.
  }
}

async function applyPendingSkinGrants(uid) {
  // Mag net als applyPendingGrants nooit een fout naar buiten gooien.
  try {
    const snap = await db.collection('users').doc(uid).collection('pendingSkinGrants').get();
    if (snap.empty) return;
    let changed = false;
    snap.forEach(doc => {
      const skinId = doc.data().skinId;
      if (skinId && !ownedSkins.includes(skinId)) {
        ownedSkins.push(skinId);
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem('botShooterOwnedSkins', JSON.stringify(ownedSkins));
      await syncCurrentAccountSave();
    }
    await Promise.all(snap.docs.map(doc => doc.ref.delete()));
  } catch (e) {
    // Stil negeren — zie toelichting hierboven.
  }
}

async function applyPendingSkinRemovals(uid) {
  // Mag net als applyPendingGrants nooit een fout naar buiten gooien.
  try {
    const snap = await db.collection('users').doc(uid).collection('pendingSkinRemovals').get();
    if (snap.empty) return;
    let changed = false;
    snap.forEach(doc => {
      const skinId = doc.data().skinId;
      const idx = ownedSkins.indexOf(skinId);
      if (idx !== -1) {
        ownedSkins.splice(idx, 1);
        changed = true;
        // Als de weggehaalde skin ook uitgerust stond, terugvallen op de standaardskin zodat er altijd
        // een geldige, bezeten skin actief blijft.
        if (equippedSkin === skinId) {
          equippedSkin = 'default';
          localStorage.setItem('botShooterEquippedSkin', equippedSkin);
        }
      }
    });
    if (changed) {
      localStorage.setItem('botShooterOwnedSkins', JSON.stringify(ownedSkins));
      await syncCurrentAccountSave();
    }
    await Promise.all(snap.docs.map(doc => doc.ref.delete()));
  } catch (e) {
    // Stil negeren — zie toelichting hierboven.
  }
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
    // Bewust hier al (en niet pas via onAuthStateChanged) opgehaald en afgewacht, zodat dit gegarandeerd
    // klaar is vóórdat we hieronder herladen — een eerdere versie liet dit alleen aan onAuthStateChanged
    // over, maar die kon soms racen met de reload zelf, waardoor er af en toe niks werd opgehaald en je
    // met 0 munten begon terwijl de cloud wel gewoon klopte.
    await hydrateFromCloud(cred.user.uid);
    currentAccount = username;
    currentUid = cred.user.uid;
    localStorage.setItem('botShooterActiveAccount', username);
    localStorage.setItem('botShooterActiveUid', cred.user.uid);
    // Zie toelichting bij SESSION_SYNCED_FLAG hieronder: dit voorkomt dat onAuthStateChanged na de
    // reload hieronder nog eens onnodig een extra reload doet.
    sessionStorage.setItem(SESSION_SYNCED_FLAG, 'true');
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
    sessionStorage.setItem(SESSION_SYNCED_FLAG, 'true');
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

// hydrateFromSnapshot() alleen bijwerkt localStorage, niet de allang-geïnitialiseerde spelvariabelen
// (coins, elementalCores, ownedWeapons, enz. — die staan al vast sinds het begin van deze paginalaad-
// beurt). Dat is onschadelijk vlak na attemptLogin()/attemptCreateAccount(), want die herladen daarna
// altijd meteen de pagina. Maar bij een sessie die al eerder was ingelogd (bv. je opent een tabblad
// dat nog van eerder openstond, of een ander apparaat), haalt onAuthStateChanged hieronder wél verse
// cloud-data op zonder te herladen — waardoor de spelvariabelen stiekem achterlopen op wat er nu in
// localStorage staat. Een volgende aankoop zou dan die verouderde waarde teruggeschreven hebben naar
// de cloud, en zo bijvoorbeeld voortgang van een ander apparaat weer ongedaan maken. Daarom: precies
// één keer per browsersessie (bijgehouden via sessionStorage, dat overleeft een reload maar niet het
// sluiten van het tabblad) herladen we na de eerste keer ophalen, zodat alle spelvariabelen sowieso
// een keer vers geïnitialiseerd worden vanuit de zojuist bijgewerkte localStorage.
const SESSION_SYNCED_FLAG = 'botShooterSessionSynced';

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
  if (await checkIfBanned(user.uid)) {
    document.getElementById('authScreen').style.display = 'none';
    return;
  }
  let resolvedAccount = localStorage.getItem('botShooterActiveAccount');
  // Altijd de save ophalen en toepassen (niet alleen bij een expliciete login) — nodig voor
  // cross-device sync, en veilig zolang syncCurrentAccountSave() de cloud betrouwbaar bijhoudt
  // (een eerdere, kwetsbaardere versie probeerde dit te beperken tot "echte" logins via een
  // sessionStorage-vlag, maar die kon racen met de page-reload zelf en soms met 0 munten eindigen).
  try {
    const userDoc = await hydrateFromCloud(user.uid);
    if (userDoc.exists && userDoc.data().username) resolvedAccount = userDoc.data().username;
  } catch (e) {
    // Kon de save niet bij Firestore ophalen (bv. even geen verbinding) — val terug op wat er al
    // lokaal staat. Belangrijk: hierna gaan we altijd door, anders blijft het hoofdmenu verborgen
    // omdat de rest van deze functie nooit bereikt wordt.
  }
  if (sessionStorage.getItem(SESSION_SYNCED_FLAG) !== 'true') {
    // Zie toelichting bij SESSION_SYNCED_FLAG hierboven — eenmalige herlading zodat alle spelvariabelen
    // gegarandeerd vers zijn, niet alleen localStorage.
    sessionStorage.setItem(SESSION_SYNCED_FLAG, 'true');
    location.reload();
    return;
  }
  currentAccount = resolvedAccount;
  localStorage.setItem('botShooterActiveAccount', currentAccount);
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById(currentWorld === 2 ? 'world2Screen' : 'startScreen').style.display = 'flex';
  updateLoginSessionTimer();
  try {
    await applyPendingGrants(user.uid);
  } catch (e) {
    // Idem: een mislukte wachtrij-check mag de rest van het inloggen niet blokkeren.
  }
  try {
    await applyPendingMessages(user.uid);
  } catch (e) {
    // Idem.
  }
  try {
    await applyPendingWeaponRemovals(user.uid);
  } catch (e) {
    // Idem.
  }
  try {
    await applyPendingWeaponGrants(user.uid);
  } catch (e) {
    // Idem.
  }
  try {
    await applyPendingSkinGrants(user.uid);
  } catch (e) {
    // Idem.
  }
  try {
    await applyPendingSkinRemovals(user.uid);
  } catch (e) {
    // Idem.
  }
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
