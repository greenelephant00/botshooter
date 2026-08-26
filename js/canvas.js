const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menuBgCanvas1 = document.getElementById('menuBgCanvas1');
const menuBgCtx1 = menuBgCanvas1.getContext('2d');
const menuBgCanvas2 = document.getElementById('menuBgCanvas2');
const menuBgCtx2 = menuBgCanvas2.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  menuBgCanvas1.width = window.innerWidth;
  menuBgCanvas1.height = window.innerHeight;
  menuBgCanvas2.width = window.innerWidth;
  menuBgCanvas2.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);
