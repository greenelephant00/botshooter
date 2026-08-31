// Vast tijdstap-loop: update() gaat overal impliciet uit van precies 60 logica-ticks per seconde
// (zie bv. `regen / 60` in update.js). Bij een korte hapering (garbage collection, even een zwaar
// achtergrondtaakje, tabblad kort niet actief) liep voorheen gewoon dezelfde ene update() per frame,
// waardoor alles in slow motion leek te gaan. Nu wordt update() zo vaak ingehaald als nodig is om
// gelijke tred te houden met de echt verstreken tijd, ongeacht hoeveel renderframes er zijn geweest.
const FIXED_UPDATE_MS = 1000 / 60;
const MAX_FRAME_MS = 250; // voorkomt een inhaal-spiraal als het tabblad heel even helemaal stilstond
let lastFrameTime = null;
let updateAccumulator = 0;

function loop(now) {
  now = now || performance.now(); // de allereerste aanroep gebeurt direct, niet via requestAnimationFrame
  if (lastFrameTime === null) lastFrameTime = now;
  const frameMs = Math.min(now - lastFrameTime, MAX_FRAME_MS);
  lastFrameTime = now;
  updateAccumulator += frameMs;
  while (updateAccumulator >= FIXED_UPDATE_MS) {
    update();
    updateAccumulator -= FIXED_UPDATE_MS;
  }
  draw();
  requestAnimationFrame(loop);
}

menuBgLoop();
applyMenuBgBodyClass();

// Toon coins op het startscherm bij laden
document.getElementById('startCoins').textContent = coins;
updateWorld2Button();

// Keer eventuele nog niet-uitgekeerde prestatie-beloningen meteen uit bij het laden (ook voor al eerder behaalde prestaties)
checkAchievements();
document.getElementById('startCoins').textContent = coins;

// Wacht tot de speler een modus kiest via het startscherm (selectMode)
