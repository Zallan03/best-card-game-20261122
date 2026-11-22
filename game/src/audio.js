// audio.js — every sound in Ember Tide, synthesised with WebAudio.
// One job: make noise. No audio files, no network, nothing to load.

let ctx = null;
let muted = false;

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }

function audioContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// A short tone with a pitch slide and a fade. `when` delays it in seconds.
function tone(freq, dur, type, vol, slideTo = null, when = 0) {
  if (muted) return;
  const ac = audioContext();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playCardSound() {
  tone(520, 0.09, 'triangle', 0.18, 780);
  tone(1040, 0.07, 'sine', 0.08, 1240, 0.03);
}

export function clashSound(winner) {
  if (winner === 'player') {
    tone(392, 0.12, 'square', 0.12, 523);
    tone(523, 0.14, 'square', 0.12, 659, 0.08);
    tone(784, 0.22, 'triangle', 0.16, null, 0.16);
  } else if (winner === 'foe') {
    tone(330, 0.16, 'sawtooth', 0.12, 196);
    tone(196, 0.22, 'sawtooth', 0.10, 131, 0.1);
  } else {
    tone(440, 0.1, 'triangle', 0.12, 440);
    tone(440, 0.1, 'triangle', 0.10, 440, 0.12);
  }
}

export function winSound() {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.28, 'triangle', 0.16, null, i * 0.13));
}

export function loseSound() {
  [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'sine', 0.14, null, i * 0.15));
}

export function drawSound() {
  tone(660, 0.06, 'sine', 0.08, 880);
}
