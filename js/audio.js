// ---- Audio: procedurele spanningsmuziek ----
let audioCtx = null;
let masterGain = null;
let musicPlaying = false;
let musicTimer = null;
let musicStep = 0;
let muted = localStorage.getItem('botShooterMuted') === 'true';
let noiseBuffer = null;
let currentTrackIndex = Number(localStorage.getItem('botShooterMusicTrack')) || 0;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = muted ? 0 : 0.18;
  masterGain.connect(audioCtx.destination);
}

function playSynthNote(freq, time, duration, type, gainVal) {
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(gainVal, time + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, time + duration);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(time);
  osc.stop(time + duration + 0.05);
}

function playKick(time) {
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(130, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);
  g.gain.setValueAtTime(0.5, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(time);
  osc.stop(time + 0.2);
}

function playTom(time, freqStart, freqEnd, gainVal) {
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freqStart, time);
  osc.frequency.exponentialRampToValueAtTime(freqEnd, time + 0.18);
  g.gain.setValueAtTime(gainVal, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(time);
  osc.stop(time + 0.25);
}

function getNoiseBuffer() {
  if (!noiseBuffer) {
    const size = audioCtx.sampleRate * 0.3;
    noiseBuffer = audioCtx.createBuffer(1, size, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function playHat(time, gainVal, duration) {
  duration = duration || 0.05;
  const src = audioCtx.createBufferSource();
  src.buffer = getNoiseBuffer();
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 6000;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(gainVal, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + duration);
  src.connect(filter);
  filter.connect(g);
  g.connect(masterGain);
  src.start(time);
  src.stop(time + duration + 0.02);
}

// ---- Originele, zelf gecomponeerde tracks (elk met eigen sfeer) ----
const stabNotes = [329.63, 392.00, 349.23]; // E4, G4, F4

function pulseStep(i, t) {
  // "Pulse" - dreigende bas in mineur met kick en spanningsvolle stabs
  const bassPattern = [82.41, 82.41, 98.00, 82.41, 87.31, 82.41, 98.00, 92.50];
  const idx = i % bassPattern.length;
  playSynthNote(bassPattern[idx], t, 0.2, 'sawtooth', 0.11);
  if (i % 4 === 0) playKick(t);
  if (i % 8 === 4) playSynthNote(stabNotes[Math.floor(Math.random() * stabNotes.length)], t, 0.3, 'square', 0.045);
}

function driftwaveStep(i, t) {
  // "Driftwave" - synthwave arpeggio over een zwevend pad-akkoord
  const arp = [220.00, 261.63, 329.63, 440.00, 329.63, 261.63];
  playSynthNote(arp[i % arp.length], t, 0.13, 'square', 0.06);
  if (i % 4 === 0) playSynthNote(110.00, t, 0.5, 'triangle', 0.08);
  if (i % 2 === 0) playHat(t, 0.035);
  if (i % 8 === 0) playKick(t);
}

function wardrumsStep(i, t) {
  // "War Drums" - militaristische toms met een dreigende drone
  const dronePattern = [55.00, 55.00, 58.27, 55.00];
  if (i % 4 === 0) playSynthNote(dronePattern[Math.floor(i / 4) % dronePattern.length], t, 1.0, 'sawtooth', 0.09);
  if (i % 2 === 0) playTom(t, 150, 60, 0.32);
  else playHat(t, 0.05);
  if (i % 16 === 8) playSynthNote(233.08, t, 0.4, 'square', 0.05);
}

function neonchaseStep(i, t) {
  // "Neon Chase" - snelle achtervolgings-riff, hoog tempo
  const pattern = [146.83, 174.61, 196.00, 174.61];
  playSynthNote(pattern[i % pattern.length], t, 0.11, 'sawtooth', 0.09);
  if (i % 3 === 0) playKick(t);
  if (i % 6 === 3) playHat(t, 0.05);
  if (i % 12 === 9) playSynthNote(587.33, t, 0.15, 'square', 0.035);
}

const MUSIC_TRACKS = [
  { id: 'pulse',      name: 'Pulse',      stepDur: 0.22, step: pulseStep },
  { id: 'driftwave',  name: 'Driftwave',  stepDur: 0.15, step: driftwaveStep },
  { id: 'wardrums',   name: 'War Drums',  stepDur: 0.25, step: wardrumsStep },
  { id: 'neonchase',  name: 'Neon Chase', stepDur: 0.13, step: neonchaseStep }
];

function scheduleMusicLoop() {
  if (!musicPlaying || !audioCtx) return;
  // Een ongeldige opgeslagen index (bv. door devtools-geknoei of een oudere versie met meer nummers)
  // zou hier anders een onopgevangen crash geven die de muziek voorgoed stil laat vallen.
  if (!MUSIC_TRACKS[currentTrackIndex]) currentTrackIndex = 0;
  const track = MUSIC_TRACKS[currentTrackIndex];
  const now = audioCtx.currentTime;
  const stepDur = track.stepDur;
  const lookahead = 8;
  for (let i = 0; i < lookahead; i++) {
    const t = now + i * stepDur;
    track.step(musicStep + i, t);
  }
  musicStep += lookahead;
  musicTimer = setTimeout(scheduleMusicLoop, lookahead * stepDur * 1000 * 0.9);
}

function startMusic() {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (musicPlaying) return;
  musicPlaying = true;
  musicStep = 0;
  scheduleMusicLoop();
}

function stopMusic() {
  musicPlaying = false;
  if (musicTimer) clearTimeout(musicTimer);
}

function selectMusicTrack(idx) {
  currentTrackIndex = idx;
  localStorage.setItem('botShooterMusicTrack', idx);
  musicStep = 0;
  if (musicTimer) clearTimeout(musicTimer);
  if (musicPlaying) scheduleMusicLoop();
  updateMusicTrackUI();
  document.getElementById('musicPanel').style.display = 'none';
}
window.selectMusicTrack = selectMusicTrack;

function toggleMusicPanel() {
  const panel = document.getElementById('musicPanel');
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}
window.toggleMusicPanel = toggleMusicPanel;

function updateMusicTrackUI() {
  document.querySelectorAll('.musicOption').forEach(el => {
    el.classList.toggle('active', Number(el.dataset.idx) === currentTrackIndex);
  });
}

function updateMuteButton() {
  const btn = document.getElementById('muteBtn');
  if (btn) btn.textContent = muted ? '🔇' : '🔊';
}

function toggleMute() {
  initAudio();
  muted = !muted;
  localStorage.setItem('botShooterMuted', muted);
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.18;
  updateMuteButton();
}
window.toggleMute = toggleMute;
updateMuteButton();
updateMusicTrackUI();

// Muziek moet continu spelen, ook buiten een potje om — browsers vereisen
// een gebruikersinteractie voordat audio mag starten, dus we haken in op
// de eerste klik/toetsaanslag op de pagina.
function firstInteractionStartMusic() {
  startMusic();
  document.removeEventListener('click', firstInteractionStartMusic);
  document.removeEventListener('keydown', firstInteractionStartMusic);
}
document.addEventListener('click', firstInteractionStartMusic);
document.addEventListener('keydown', firstInteractionStartMusic);

