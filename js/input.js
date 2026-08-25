// ---- Input ----
const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

const mouse = { x: 0, y: 0 };
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', () => keys['mouse'] = true);
canvas.addEventListener('mouseup', () => keys['mouse'] = false);
window.addEventListener('keydown', e => {
  if (e.key === ' ') e.preventDefault(); // voorkom scrollen
  if (e.key.toLowerCase() === 'e' && player.activeTransform === 'none') {
    triggerCryoGrenade();
    triggerVampBolt();
    triggerVoltNova();
    triggerRiftPulse();
    triggerStickyBarrage();
    triggerToxicCloud();
    triggerExecutionOrder();
    triggerBladeDash();
    triggerLavaField();
    triggerHurricaneBlast();
    triggerFrostLance();
    triggerEarthSlam();
  }
});

