// ---- Touch-besturing: virtuele joystick (bewegen) + sleep-om-te-richten zone (rechts) ----
// Je kiest per potje (via het scherm dat verschijnt bij Levels/Endless/Hardcore/Golfsprint) of je
// met PC (muis) of Touchscreen (joysticks) speelt — zie chooseControlScheme() in player.js.
// Bij Touchscreen wordt er de hele tijd automatisch geschoten; je hoeft dan alleen te richten.

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

// Laatst aangegeven richtrichting (eenheidsvector) — blijft staan nadat je loslaat,
// zodat het automatisch vuren gewoon in die richting doorgaat.
let aimDX = 1;
let aimDY = 0;
const AIM_JOYSTICK_MAX_RADIUS = 50;
const AIM_DISTANCE = 3000; // ver genoeg zodat alleen de richting telt, niet de exacte afstand

function setupTouchAim() {
  const zone = document.getElementById('touchAimZone');
  const stick = document.getElementById('touchAimStick');
  if (!zone || !stick) return;
  let activeTouchId = null;

  function updateStick(touch) {
    const rect = zone.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    let dx = touch.clientX - originX;
    let dy = touch.clientY - originY;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return; // te dicht bij het midden om een betrouwbare richting te bepalen
    aimDX = dx / dist;
    aimDY = dy / dist;
    const clampedDist = Math.min(dist, AIM_JOYSTICK_MAX_RADIUS);
    stick.style.transform = `translate(${aimDX * clampedDist}px, ${aimDY * clampedDist}px)`;
  }
  function resetStick() {
    activeTouchId = null;
    stick.style.transform = 'translate(0px, 0px)'; // de knop veert terug, maar de richting (aimDX/aimDY) blijft staan
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

// De luisteraars staan altijd klaar; de zones zijn alleen zichtbaar/aanklikbaar (CSS) als
// activeControlScheme === 'touch', dus er komt sowieso nooit een touch op deze zones binnen
// zolang er met PC/muis wordt gespeeld.
setupTouchJoystick();
setupTouchAim();
