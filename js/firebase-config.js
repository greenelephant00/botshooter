// ---- Firebase: cloud-opslag voor accounts, zodat je op elk apparaat met dezelfde
// zelfverzonnen gebruikersnaam + wachtwoord kunt inloggen op hetzelfde account ----
const firebaseConfig = {
  apiKey: "AIzaSyCmPUlkHd5kvZ5V6flWwf77tlh6tbnat1E",
  authDomain: "bot-shooter-57124.firebaseapp.com",
  projectId: "bot-shooter-57124",
  storageBucket: "bot-shooter-57124.firebasestorage.app",
  messagingSenderId: "148144934134",
  appId: "1:148144934134:web:79db2ee689fa724da7f0d7",
  measurementId: "G-3GJXQF3HLV"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Zorgt dat een laatste save die niet meer op tijd naar de server kon (bv. tabblad dicht
// terwijl je nog offline was) alsnog verstuurd wordt zodra er weer verbinding is.
db.enablePersistence().catch(() => {
  // Kan mislukken bij meerdere open tabbladen tegelijk — dan werkt alles nog gewoon,
  // alleen zonder offline-cache.
});
