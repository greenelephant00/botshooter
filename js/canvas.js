const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menuBgCanvas = document.getElementById('menuBgCanvas');
const menuBgCtx = menuBgCanvas.getContext('2d');
const coopCanvas = document.getElementById('coopCanvas');
const coopCtx = coopCanvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  menuBgCanvas.width = window.innerWidth;
  menuBgCanvas.height = window.innerHeight;
  coopCanvas.width = window.innerWidth;
  coopCanvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);
