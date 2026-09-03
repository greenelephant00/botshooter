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
// Aan window gekoppeld (niet canvas): als je tijdens het schieten loslaat boven een HUD-knop die los
// over het canvas heen ligt (bv. pauze/stop), vuurt mouseup daar en niet op het canvas — zonder deze
// listener op window zou keys['mouse'] dan voor altijd op true blijven staan.
window.addEventListener('mouseup', () => keys['mouse'] = false);

// Verliest het venster de focus (alt-tab, een browser-prompt die de aandacht steelt, enz.) terwijl een
// toets of de muisknop nog ingedrukt is, dan komt de bijbehorende keyup/mouseup nooit binnen — zonder
// deze reset zou je personage dan voor altijd blijven bewegen/schieten in die richting.
window.addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
});
window.addEventListener('keydown', e => {
  const typingInField = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
  if (e.key === ' ' && !typingInField) e.preventDefault(); // voorkom scrollen, maar niet in tekstvelden
  if (e.key.toLowerCase() === 'e' && !typingInField && player.activeTransform === 'none') {
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

