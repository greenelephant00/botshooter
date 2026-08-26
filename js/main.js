function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

menuBgLoop();

// Toon coins op het startscherm bij laden
document.getElementById('startCoins').textContent = coins;
updateWorld2Button();

// Keer eventuele nog niet-uitgekeerde prestatie-beloningen meteen uit bij het laden (ook voor al eerder behaalde prestaties)
checkAchievements();
document.getElementById('startCoins').textContent = coins;

// Wacht tot de speler een modus kiest via het startscherm (selectMode)
