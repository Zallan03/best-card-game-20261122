// table.js — the felt table, the HUD and the clash area. One job: draw the
// table the duel is played on. It never changes game state; it only reads it.

import {
  CANVAS_W, CANVAS_H, SUITS, CARD_W, CARD_H, CARD_GAP,
  FOE_HAND_Y, PLAYER_HAND_Y, CLASH_Y, ENERGY_PER_TURN,
  TIDE_MAX,
} from './config.js';
import { drawCard } from './cards.js';
import { roundRect } from './cards.js';

function handX(handSize, index) {
  const total = handSize * CARD_W + (handSize - 1) * CARD_GAP;
  return (CANVAS_W - total) / 2 + index * (CARD_W + CARD_GAP);
}

function drawLifeBar(ctx, x, y, w, life, max, color, label) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(ctx, x - 4, y - 4, w + 8, 34, 10);
  ctx.fill();
  ctx.fillStyle = '#2a2118';
  roundRect(ctx, x, y, w, 26, 8);
  ctx.fill();
  const frac = Math.max(0, life / max);
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, color);
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  if (frac > 0) {
    roundRect(ctx, x, y, Math.max(10, w * frac), 26, 8);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${label}  ${life} / ${max}`, x + 10, y + 14);
  ctx.restore();
}

// The Tide Gauge: three drops that fill as the side wins clashes with suit
// advantage. A full gauge spends itself on the next card (+3 power).
function drawTideGauge(ctx, x, y, level, label) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(ctx, x - 4, y - 4, 148, 30, 9);
  ctx.fill();
  ctx.fillStyle = '#e8e2d4';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + 8, y + 11);
  for (let i = 0; i < TIDE_MAX; i++) {
    const cx = x + 62 + i * 26;
    ctx.beginPath();
    ctx.arc(cx, y + 11, 9, 0, Math.PI * 2);
    ctx.fillStyle = i < level ? '#2f7fe0' : 'rgba(255,255,255,0.18)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = i < level ? '#8fc2f7' : 'rgba(255,255,255,0.35)';
    ctx.stroke();
  }
  ctx.restore();
}

export function drawTable(ctx) {
  // Deep green felt with a vignette and a gold oval inlay.
  const felt = ctx.createRadialGradient(640, 330, 80, 640, 360, 760);
  felt.addColorStop(0, '#2e6b4a');
  felt.addColorStop(0.7, '#1e4d33');
  felt.addColorStop(1, '#123626');
  ctx.fillStyle = felt;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.strokeStyle = 'rgba(245,197,66,0.55)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(640, 360, 560, 300, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(245,197,66,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(640, 360, 520, 268, 0, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawHud(ctx, state) {
  // Top bar: title, round, energy.
  ctx.fillStyle = 'rgba(10,20,14,0.72)';
  ctx.fillRect(0, 0, CANVAS_W, 52);
  ctx.fillStyle = '#f5c542';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('EMBER TIDE', 20, 27);
  ctx.fillStyle = '#e8e2d4';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`ROUND ${state.round}`, 640, 27);
  ctx.textAlign = 'right';
  ctx.fillText(`ENERGY ${state.playerEnergy} / ${ENERGY_PER_TURN}  •  M mute`, 1260, 27);

  // Life bars: rival top-left, player bottom-left.
  drawLifeBar(ctx, 20, 62, 300, state.foeLife, 20, '#e05252', 'RIVAL');
  drawLifeBar(ctx, 20, 668, 300, state.playerLife, 20, '#3fae5a', 'YOU');

  // Tide Gauges: rival's top-right, yours bottom-right.
  drawTideGauge(ctx, 1112, 62, state.foeTide, 'RIVAL TIDE');
  drawTideGauge(ctx, 1112, 668, state.playerTide, 'YOUR TIDE');

  // Battle log, bottom-right, kept above your tide gauge so the two never
  // overlap: four lines ending at y=650, the gauge starting at y=668.
  ctx.textAlign = 'right';
  ctx.font = '15px system-ui, sans-serif';
  state.log.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? '#ffffff' : 'rgba(232,226,212,0.65)';
    ctx.fillText(line, 1260, 596 + i * 18);
  });
}

export function drawClashArea(ctx, state) {
  const clash = state.clash;
  const cx = CANVAS_W / 2;
  if (!clash) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Play a card — click it, or press 1–5', cx, CLASH_Y + 84);
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('Ember beats Gale  •  Gale beats Tide  •  Tide beats Stone  •  Stone beats Ember', cx, CLASH_Y + 112);
    ctx.fillText('Same suit twice in a row: +2 Surge  •  Win with advantage: fill your Tide Gauge', cx, CLASH_Y + 134);
    return;
  }
  // The two played cards face each other.
  drawCard(ctx, clash.playerCard, cx - CARD_W - 70, CLASH_Y, { surge: clash.playerTideSurge });
  drawCard(ctx, clash.foeCard, cx + 70, CLASH_Y, { surge: clash.foeTideSurge });
  // One verdict line in the clear gap between the rival hand and the clash
  // cards: who won, the totals and the damage — never drawn over a card.
  const verdict = clash.winner === 'player' ? 'YOU WIN THE CLASH' : clash.winner === 'foe' ? 'RIVAL WINS THE CLASH' : 'TIED CLASH';
  ctx.textAlign = 'center';
  ctx.fillStyle = clash.winner === 'player' ? '#ffd94d' : clash.winner === 'foe' ? '#ff8a7a' : '#d8d2c4';
  ctx.font = 'bold 24px system-ui, sans-serif';
  let damageText = clash.damage > 0 ? `  •  ${clash.damage} damage` : '';
  if (clash.igniteBonus > 0) damageText += '  •  Ignite +2';
  if (clash.bulwarkSave > 0) damageText += `  •  Bulwark −${clash.bulwarkSave}`;
  if (clash.playerTideSurge || clash.foeTideSurge) damageText += '  •  Tide Surge +3';
  ctx.fillText(`${verdict}  •  ${clash.playerTotal} vs ${clash.foeTotal}${damageText}`, cx, CLASH_Y - 14);
  // Next-round hint at the clear bottom centre, away from both hands.
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('Press N for the next round  •  D discards a selected card for +1 energy', cx, 706);
}

export { handX };
