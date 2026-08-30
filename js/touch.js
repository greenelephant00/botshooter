// ---- Touch-besturing voor mobiel: virtuele joystick (bewegen) + sleep-om-te-richten zone (rechts) ----
// Op een touchscreen wordt er de hele tijd automatisch geschoten; je hoeft alleen te richten.
const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
if (isTouchDevice) document.body.classList.add('touch-device');

let joystickDX = 0;
let joystickDY = 0;
const JOYSTICK_MAX_RADIUS = 50;

function setupTouchJoystick() {
  const zone = document.getElementById('touchJoystickZone');
  const stick = document.getElementById('touchJoystickStick');
  if (!zone || !stick) return;
  let activeTouchId = null;

  function updateStick(touch) {
    const rect = zone.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    let dx = touch.clientX - originX;
    let dy = touch.clientY - originY;
    const dist = Math.hypot(dx, dy);
    if (dist > JOYSTICK_MAX_RADIUS) {
      dx = (dx / dist) * JOYSTICK_MAX_RADIUS;
      dy = (dy / dist) * JOYSTICK_MAX_RADIUS;
    }
    stick.style.transform = `translate(${dx}px, ${dy}px)`;
    joystickDX = dx / JOYSTICK_MAX_RADIUS;
    joystickDY = dy / JOYSTICK_MAX_RADIUS;
  }
  function resetStick() {
    activeTouchId = null;
    joystickDX = 0;
    joystickDY = 0;
    stick.style.transform = 'translate(0px, 0px)';
  }

  zone.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    activeTouchId = t.identifier;
    updateStick(t);
  }, { passive: false });
  zone.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === activeTouchId) updateStick(t);
    }
  }, { passive: false });
  zone.addEventListener('touchend', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === activeTouchId) resetStick();
    }
  }, { passive: false });
  zone.addEventListener('touchcancel', resetStick);
}

function setupTouchAim() {
  const zone = document.getElementById('touchAimZone');
  const indicator = document.getElementById('touchAimIndicator');
  if (!zone) return;
  let activeTouchId = null;

  function updateAim(touch) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = touch.clientX - rect.left;
    mouse.y = touch.clientY - rect.top;
    if (indicator) {
      indicator.style.left = `${touch.clientX}px`;
      indicator.style.top = `${touch.clientY}px`;
      indicator.style.display = 'block';
    }
  }
  function hideIndicator() {
    activeTouchId = null;
    if (indicator) indicator.style.display = 'none';
  }

  zone.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    activeTouchId = t.identifier;
    updateAim(t);
  }, { passive: false });
  zone.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === activeTouchId) updateAim(t);
    }
  }, { passive: false });
  zone.addEventListener('touchend', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === activeTouchId) hideIndicator();
    }
  }, { passive: false });
  zone.addEventListener('touchcancel', hideIndicator);
}

if (isTouchDevice) {
  setupTouchJoystick();
  setupTouchAim();
  // Automatisch en continu vuren op touch-apparaten: je hoeft alleen te richten door te slepen
  keys['mouse'] = true;
}
