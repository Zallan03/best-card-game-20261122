// animate.js — motion for Ember Tide: card slides, damage pops and the
// victory confetti. One job: move pixels over time. It never changes game
// state; it only reads the match and draws on top of it.

export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function easeOutBack(t) {
  const c = 1.70158;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}

// A tween moves one numeric value from `from` to `to` over `durMs`.
// `onDone` runs once, when the tween finishes.
export function createTween(from, to, durMs, ease, onDone) {
  return { from, to, start: 0, durMs, ease, onDone, done: false, value: from };
}

export function startTween(tween, now) {
  tween.start = now;
  tween.done = false;
  tween.value = tween.from;
  return tween;
}

export function updateTween(tween, now) {
  if (tween.done) return tween.value;
  const t = Math.min(1, Math.max(0, (now - tween.start) / tween.durMs));
  tween.value = tween.from + (tween.to - tween.from) * tween.ease(t);
  if (t >= 1) {
    tween.done = true;
    if (tween.onDone) tween.onDone();
  }
  return tween.value;
}

// Slide a card from the hand to the clash area: returns the card's current
// offset (x, y) and scale for this frame. `progress` is 0..1.
export function slideCardToClash(progress, fromX, fromY, toX, toY) {
  const e = easeOutCubic(progress);
  return {
    x: fromX + (toX - fromX) * e,
    y: fromY + (toY - fromY) * e - Math.sin(progress * Math.PI) * 46,
    scale: 1 + Math.sin(progress * Math.PI) * 0.06,
  };
}

// Flip a clash card in: the card scales up from flat, like turning over.
export function flipClashCard(progress) {
  const e = easeOutBack(progress);
  return { scaleX: Math.max(0.05, e), scale: 1 };
}

// A damage number that pops up from the clash and fades.
export function spawnDamagePop(state, x, y, text, color) {
  if (!state.fx) state.fx = { confetti: [], pops: [], tweens: [] };
  state.fx.pops.push({ x, y, text, color, born: Date.now(), lifeMs: 900 });
}

export function updateDamagePops(state, now) {
  if (!state.fx) return;
  state.fx.pops = state.fx.pops.filter((p) => now - p.born < p.lifeMs);
}

export function drawDamagePops(ctx, state, now) {
  if (!state.fx) return;
  for (const p of state.fx.pops) {
    const age = (now - p.born) / p.lifeMs;
    ctx.save();
    ctx.globalAlpha = 1 - age;
    ctx.fillStyle = p.color;
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.text, p.x, p.y - age * 44);
    ctx.restore();
  }
}

// Victory confetti: coloured paper that bursts from the top and drifts down.
const CONFETTI_COLORS = ['#ffd94d', '#ff6b35', '#3fae5a', '#2f7fe0', '#ff8a7a', '#ffffff'];

export function spawnWinConfetti(state, count, width) {
  if (!state.fx) state.fx = { confetti: [], pops: [], tweens: [] };
  for (let i = 0; i < count; i++) {
    state.fx.confetti.push({
      x: Math.random() * width,
      y: -20 - Math.random() * 120,
      vx: (Math.random() - 0.5) * 60,
      vy: 90 + Math.random() * 160,
      size: 6 + Math.random() * 8,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    });
  }
}

export function stageWinConfetti(state, width, height) {
  // A fixed, frozen burst for screenshots: confetti scattered mid-fall.
  if (!state.fx) state.fx = { confetti: [], pops: [], tweens: [] };
  state.fx.confetti = [];
  for (let i = 0; i < 90; i++) {
    state.fx.confetti.push({
      x: (i * 137.5) % width,
      y: (i * 89.3) % (height * 0.62),
      vx: 0,
      vy: 0,
      size: 6 + (i % 5) * 2,
      rot: (i * 0.7) % (Math.PI * 2),
      vr: 0,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    });
  }
}

export function updateConfetti(state, dtMs) {
  if (!state.fx) return;
  const dt = dtMs / 1000;
  for (const c of state.fx.confetti) {
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.rot += c.vr * dt;
    if (c.y > 740) {
      c.y = -20;
      c.x = Math.random() * 1280;
    }
  }
}

export function drawConfetti(ctx, state) {
  if (!state.fx) return;
  for (const c of state.fx.confetti) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.fillStyle = c.color;
    ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
    ctx.restore();
  }
}

// One place that advances every effect for a frame. `now` is a timestamp.
export function updateEffects(state, now, dtMs) {
  if (!state.fx) return;
  updateConfetti(state, dtMs);
  updateDamagePops(state, now);
  for (const t of state.fx.tweens) updateTween(t, now);
  state.fx.tweens = state.fx.tweens.filter((t) => !t.done);
}
