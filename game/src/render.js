// render.js — every pixel of Ember Tide, drawn on one canvas.
// One job: draw the table, the cards, the HUD and the screens. It never
// changes game state; it only reads it.

import {
  CANVAS_W, CANVAS_H, SUITS, CARD_W, CARD_H, CARD_GAP,
  FOE_HAND_Y, PLAYER_HAND_Y, CLASH_Y, ENERGY_PER_TURN,
} from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function handX(handSize, index) {
  const total = handSize * CARD_W + (handSize - 1) * CARD_GAP;
  return (CANVAS_W - total) / 2 + index * (CARD_W + CARD_GAP);
}

// Draw one suit's glyph — colour AND shape, never text alone.
export function drawSuitGlyph(ctx, glyph, cx, cy, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const s = size / 2;
  if (glyph === 'flame') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s);
    ctx.quadraticCurveTo(cx + s * 0.9, cy - s * 0.1, cx + s * 0.55, cy + s * 0.45);
    ctx.quadraticCurveTo(cx + s * 0.2, cy + s * 0.9, cx - s * 0.15, cy + s * 0.55);
    ctx.quadraticCurveTo(cx - s * 0.75, cy + s * 0.2, cx - s * 0.55, cy - s * 0.35);
    ctx.quadraticCurveTo(cx - s * 0.3, cy - s * 0.75, cx, cy - s);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy + s * 0.35, s * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = '#ffe9a8';
    ctx.fill();
  } else if (glyph === 'wave') {
    ctx.beginPath();
    for (let row = 0; row < 3; row++) {
      const y = cy - s * 0.6 + row * s * 0.55;
      ctx.moveTo(cx - s, y);
      ctx.quadraticCurveTo(cx - s * 0.5, y - s * 0.45, cx, y);
      ctx.quadraticCurveTo(cx + s * 0.5, y + s * 0.45, cx + s, y);
    }
    ctx.stroke();
  } else if (glyph === 'swirl') {
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 4.2; a += 0.12) {
      const r = (a / (Math.PI * 4.2)) * s;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  } else { // peak — Stone
    ctx.beginPath();
    ctx.moveTo(cx - s, cy + s * 0.7);
    ctx.lineTo(cx - s * 0.35, cy - s * 0.6);
    ctx.lineTo(cx + s * 0.05, cy + s * 0.1);
    ctx.lineTo(cx + s * 0.45, cy - s * 0.3);
    ctx.lineTo(cx + s, cy + s * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.35, cy - s * 0.6);
    ctx.lineTo(cx - s * 0.1, cy - s * 0.1);
    ctx.lineTo(cx - s * 0.55, cy - s * 0.05);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// One card, face up. `faceDown` draws the patterned back instead.
export function drawCard(ctx, card, x, y, opts = {}) {
  const { selected = false, dimmed = false, scale = 1 } = opts;
  const w = CARD_W * scale;
  const h = CARD_H * scale;
  ctx.save();
  if (selected) ctx.translate(0, -14);
  if (dimmed) ctx.globalAlpha = 0.45;

  // Shadow + body.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, x + 4, y + 6, w, h, 14);
  ctx.fill();
  const suit = card ? SUITS[card.suit] : null;
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  if (card) {
    grad.addColorStop(0, '#fffdf5');
    grad.addColorStop(1, suit.light);
  } else {
    grad.addColorStop(0, '#3a2b5c');
    grad.addColorStop(1, '#1d1433');
  }
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = card ? suit.dark : '#6b5a9e';
  ctx.stroke();

  if (!card) {
    // Card back: a gold four-point star on deep violet.
    ctx.fillStyle = '#f5c542';
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? 34 : 13;
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.restore();
    return;
  }

  // Top colour band with the suit name.
  ctx.fillStyle = suit.color;
  roundRect(ctx, x + 6, y + 6, w - 12, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(suit.name.toUpperCase(), x + w / 2, y + 20);

  // Cost pips (energy dots) top-right, below the band.
  for (let i = 0; i < card.cost; i++) {
    ctx.beginPath();
    ctx.arc(x + w - 16 - i * 18, y + 48, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#f5c542';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#8a6d00';
    ctx.stroke();
  }

  // Big power number in the middle — readable at thumbnail size.
  ctx.fillStyle = '#241a12';
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText(String(card.power), x + w / 2, y + 92);

  // Suit glyph under the number.
  drawSuitGlyph(ctx, suit.glyph, x + w / 2, y + 138, 34, suit.color);

  ctx.restore();
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

function drawTable(ctx) {
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

function drawHud(ctx, state) {
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

  // Battle log, bottom-right.
  ctx.textAlign = 'right';
  ctx.font = '15px system-ui, sans-serif';
  state.log.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? '#ffffff' : 'rgba(232,226,212,0.65)';
    ctx.fillText(line, 1260, 660 + i * 20);
  });
}

function drawClashArea(ctx, state) {
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
    ctx.fillText('Same suit twice in a row: +2 Surge', cx, CLASH_Y + 134);
    return;
  }
  // The two played cards face each other.
  drawCard(ctx, clash.playerCard, cx - CARD_W - 70, CLASH_Y, {});
  drawCard(ctx, clash.foeCard, cx + 70, CLASH_Y, {});
  // One verdict line in the clear gap between the rival hand and the clash
  // cards: who won, the totals and the damage — never drawn over a card.
  const verdict = clash.winner === 'player' ? 'YOU WIN THE CLASH' : clash.winner === 'foe' ? 'RIVAL WINS THE CLASH' : 'TIED CLASH';
  ctx.textAlign = 'center';
  ctx.fillStyle = clash.winner === 'player' ? '#ffd94d' : clash.winner === 'foe' ? '#ff8a7a' : '#d8d2c4';
  ctx.font = 'bold 24px system-ui, sans-serif';
  const damageText = clash.damage > 0 ? `  •  ${clash.damage} damage` : '';
  ctx.fillText(`${verdict}  •  ${clash.playerTotal} vs ${clash.foeTotal}${damageText}`, cx, CLASH_Y - 14);
  // Totals already ride in the verdict line above, so nothing is drawn under
  // the cards where it would collide with the player's hand.
  // Next-round hint at the clear bottom centre, away from both hands.
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('Press N for the next round', cx, 706);
}

function drawTitle(ctx, state) {
  drawTable(ctx);
  // Four suit glyphs as a banner above the title.
  const suits = ['ember', 'gale', 'tide', 'stone'];
  suits.forEach((key, i) => {
    const s = SUITS[key];
    drawSuitGlyph(ctx, s.glyph, 640 - 165 + i * 110, 150, 52, s.color);
  });
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f5c542';
  ctx.font = 'bold 96px system-ui, sans-serif';
  ctx.fillText('EMBER TIDE', 640, 290);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText('Duel of the Four Suits', 640, 340);
  ctx.font = '19px system-ui, sans-serif';
  ctx.fillStyle = '#e8e2d4';
  ctx.fillText('Outwit the rival. Play the right card, ride the suit cycle, chain Surges.', 640, 396);
  ctx.fillText('First to bring the rival to 0 life wins the duel.', 640, 424);
  // Mini rule row: the advantage cycle in four coloured chips.
  const cycle = [['Ember', '#ff6b35'], ['Gale', '#3fae5a'], ['Tide', '#2f7fe0'], ['Stone', '#8a8f98']];
  cycle.forEach(([name, color], i) => {
    const x = 640 - 300 + i * 160;
    ctx.fillStyle = color;
    roundRect(ctx, x, 470, 130, 40, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.fillText(name, x + 65, 491);
    if (i < 3) {
      ctx.fillStyle = '#f5c542';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText('›', x + 142, 491);
    }
  });
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText('Press ENTER or click to begin', 640, 580);
  ctx.fillStyle = 'rgba(232,226,212,0.8)';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('Click a card or press 1–5 to play it  •  N next round  •  R restart  •  M mute', 640, 620);
}

function drawEndScreen(ctx, state, won) {
  drawTable(ctx);
  ctx.save();
  ctx.fillStyle = won ? 'rgba(20,60,30,0.82)' : 'rgba(60,16,16,0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#ffd94d' : '#ff8a7a';
  ctx.font = 'bold 88px system-ui, sans-serif';
  ctx.fillText(won ? 'VICTORY!' : 'DEFEAT', 640, 250);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText(
    won ? 'The rival bows. The Tide is yours.' : 'The rival takes the table. The Tide turns.',
    640, 320,
  );
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillStyle = '#e8e2d4';
  ctx.fillText(`Final life — You ${state.playerLife}  •  Rival ${state.foeLife}  •  Rounds played ${state.round}`, 640, 380);
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText('Press R or click to play again', 640, 470);
  ctx.restore();
}

export function drawGame(ctx, state) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  if (state.screen === 'title') { drawTitle(ctx, state); return; }
  if (state.screen === 'win') { drawEndScreen(ctx, state, true); return; }
  if (state.screen === 'loss') { drawEndScreen(ctx, state, false); return; }

  drawTable(ctx);
  drawHud(ctx, state);

  // Rival hand: face-down backs, so the player cannot see the rival's cards.
  // The label sits right of the rival life bar, never on top of it.
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('RIVAL', 336, FOE_HAND_Y - 21);
  state.foeHand.forEach((_, i) => {
    drawCard(ctx, null, handX(state.foeHand.length, i), FOE_HAND_Y, {});
  });

  drawClashArea(ctx, state);

  // Player hand: face up, clickable, unaffordable cards dimmed.
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('YOUR HAND', 20, PLAYER_HAND_Y - 12);
  state.playerHand.forEach((card, i) => {
    drawCard(ctx, card, handX(state.playerHand.length, i), PLAYER_HAND_Y, {
      selected: state.selectedIndex === i,
      dimmed: card.cost > state.playerEnergy,
    });
  });
}
