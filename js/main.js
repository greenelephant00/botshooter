function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Toon coins op het startscherm bij laden
document.getElementById('startCoins').textContent = coins;
updateWorld2Button();

// Wacht tot de speler een modus kiest via het startscherm (selectMode)
