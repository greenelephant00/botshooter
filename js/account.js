// ---- Account-systeem (lokaal, browser-only — geen echte server-beveiliging) ----
// Sleutels die per account worden opgeslagen/hersteld. Instellingen als geluid/muziektrack
// blijven bewust apart (device-voorkeur, geen spelvoortgang).
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
  'botShooterCoinGrant_200', 'botShooterCoinGrant_10000', 'botShooterCoinGrant_2000_ben',
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
  'botShooterHasCoreAura', 'botShooterHasCoreShock', 'botShooterClaimedAchievementRewards'
];

let currentAccount = null;

function loadAccounts() {
  return JSON.parse(localStorage.getItem('botShooterAccounts') || '{}');
}
function saveAccounts(accounts) {
  localStorage.setItem('botShooterAccounts', JSON.stringify(accounts));
}

// Eerste keer dat deze versie draait: bestaat er nog geen account-systeem,
// dan wordt de huidige (bestaande) voortgang in deze browser bewaard onder het account BEN.
(function seedInitialAccount() {
  const accounts = loadAccounts();
  if (Object.keys(accounts).length > 0) return; // account-systeem bestaat al
  const snapshot = {};
  ACCOUNT_KEYS.forEach(k => { snapshot[k] = localStorage.getItem(k); });
  localStorage.setItem('botShooterAccount_ben', JSON.stringify(snapshot));
  accounts['ben'] = '123';
  saveAccounts(accounts);
})();

// Eenmalige wachtwoord-migratie voor account ben
(function migrateBenPassword() {
  const accounts = loadAccounts();
  if (accounts['ben'] === '123') {
    accounts['ben'] = '123';
    saveAccounts(accounts);
  }
})();

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
  snap['botShooterCoinGrant_2000_ben'] = 'true';
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

function syncCurrentAccountSave() {
  if (!currentAccount) return;
  const snapshot = {};
  ACCOUNT_KEYS.forEach(k => { snapshot[k] = localStorage.getItem(k); });
  localStorage.setItem('botShooterAccount_' + currentAccount, JSON.stringify(snapshot));
}

function showAuthView(view) {
  document.getElementById('authGateView').style.display = view === 'gate' ? 'block' : 'none';
  document.getElementById('authLoginView').style.display = view === 'login' ? 'block' : 'none';
  document.getElementById('authCreateView').style.display = view === 'create' ? 'block' : 'none';
  document.getElementById('authLoginError').textContent = '';
  document.getElementById('authCreateError').textContent = '';
}
window.showAuthView = showAuthView;

function attemptLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('authLoginError');
  if (!username || !password) {
    errEl.textContent = 'Vul een naam en wachtwoord in.';
    return;
  }
  const accounts = loadAccounts();
  if (!accounts[username] || accounts[username] !== password) {
    errEl.textContent = 'Onjuiste naam of wachtwoord.';
    return;
  }
  const raw = localStorage.getItem('botShooterAccount_' + username);
  const snapshot = raw ? JSON.parse(raw) : defaultAccountSnapshot();
  hydrateFromSnapshot(snapshot);
  currentAccount = username;
  localStorage.setItem('botShooterActiveAccount', username);
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('startScreen').style.display = 'flex';
  location.reload();
}
window.attemptLogin = attemptLogin;

function attemptCreateAccount() {
  const username = document.getElementById('createUsername').value.trim();
  const password = document.getElementById('createPassword').value;
  const errEl = document.getElementById('authCreateError');
  if (!username || !password) {
    errEl.textContent = 'Vul een naam en wachtwoord in.';
    return;
  }
  const accounts = loadAccounts();
  if (accounts[username]) {
    errEl.textContent = 'Deze naam bestaat al.';
    return;
  }
  accounts[username] = password;
  saveAccounts(accounts);
  const snapshot = defaultAccountSnapshot();
  localStorage.setItem('botShooterAccount_' + username, JSON.stringify(snapshot));
  hydrateFromSnapshot(snapshot);
  currentAccount = username;
  localStorage.setItem('botShooterActiveAccount', username);
  document.getElementById('authScreen').style.display = 'none';
  location.reload();
}
window.attemptCreateAccount = attemptCreateAccount;

// Blijf ingelogd: het laatst gebruikte account wordt onthouden, dus je hoeft niet
// elke keer opnieuw in te loggen wanneer het spel (opnieuw) geladen wordt.
const rememberedAccount = localStorage.getItem('botShooterActiveAccount');
if (rememberedAccount) {
  currentAccount = rememberedAccount;
  document.getElementById('authScreen').style.display = 'none';
} else {
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('authScreen').style.display = 'flex';
}
setInterval(syncCurrentAccountSave, 3000);
window.addEventListener('beforeunload', syncCurrentAccountSave);

