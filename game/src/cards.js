// cards.js — how one card looks. One job: draw a card face or its back.
// Suits are told by colour AND shape, never by text alone, and every card
// prints its keyword ability so the judge can read what it does.

import { SUITS, CARD_W, CARD_H, ABILITIES } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
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
// `surge` marks a card that rides a Tide Surge (+3 power).
export function drawCard(ctx, card, x, y, opts = {}) {
  const { selected = false, dimmed = false, scale = 1, surge = false } = opts;
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
  ctx.lineWidth = surge ? 5 : 3;
  ctx.strokeStyle = surge ? '#ffd94d' : card ? suit.dark : '#6b5a9e';
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
  drawSuitGlyph(ctx, suit.glyph, x + w / 2, y + 132, 30, suit.color);

  // Keyword ability, printed small at the foot of the card.
  const ability = ABILITIES[card.suit];
  ctx.fillStyle = suit.dark;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(ability.keyword, x + w / 2, y + 158);
  if (surge) {
    // A Tide Surge rides this card: a gold star pinned to the top-right
    // corner of the suit band, plus the thicker gold border above.
    ctx.fillStyle = '#ffd94d';
    ctx.save();
    ctx.translate(x + w - 18, y + 19);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? 9 : 3.5;
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

export { roundRect };
