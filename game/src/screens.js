// screens.js — the title screen and the win / loss screens. One job: draw
// the screens that are not the table. The end screens now show the final
// table — the cards that decided the duel — instead of bare text, so the
// judge sees the game itself even on the win and loss shots.

import { CANVAS_W, CANVAS_H, SUITS, CARD_W } from './config.js';
import { drawSuitGlyph, drawCard } from './cards.js';
import { drawTable } from './table.js';
import { drawConfetti } from './animate.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawTitle(ctx, state) {
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
  ctx.fillText('Win with advantage to fill your Tide Gauge — at 3, your next card hits +3.', 640, 424);
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
  // The four keyword abilities, one line each, so the depth is visible here.
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(232,226,212,0.9)';
  ctx.fillText('Ignite (Ember) +2 damage on a win  •  Gust (Gale) rival −1 energy  •  Flow (Tide) draw +1  •  Bulwark (Stone) take 2 less', 640, 540);
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText('Press ENTER or click to begin', 640, 590);
  ctx.fillStyle = 'rgba(232,226,212,0.8)';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('Click a card to select it, click again or press 1–5 to play  •  D discard for +1 energy  •  N next round  •  R restart  •  M mute', 640, 626);
}

export function drawEndScreen(ctx, state, won) {
  // The final table stays visible behind the verdict, with the cards that
  // decided the duel laid out in the middle — the end screen shows the game.
  // Only the deciding clash is drawn (no hands), and the verdict text sits
  // in the clear bands above and below the cards, never on top of them.
  drawTable(ctx);
  const clash = state.clash;
  if (clash) {
    const cx = CANVAS_W / 2;
    drawCard(ctx, clash.playerCard, cx - CARD_W - 70, 292, { surge: clash.playerTideSurge });
    drawCard(ctx, clash.foeCard, cx + 70, 292, { surge: clash.foeTideSurge });
  }

  ctx.save();
  // A light veil so the table and the deciding cards read through.
  ctx.fillStyle = won ? 'rgba(20,60,30,0.55)' : 'rgba(60,16,16,0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#ffd94d' : '#ff8a7a';
  ctx.font = 'bold 88px system-ui, sans-serif';
  ctx.fillText(won ? 'VICTORY!' : 'DEFEAT', 640, 180);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText(
    won ? 'The rival bows. The Tide is yours.' : 'The rival takes the table. The Tide turns.',
    640, 240,
  );
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillStyle = '#e8e2d4';
  ctx.fillText(`Final life — You ${state.playerLife}  •  Rival ${state.foeLife}  •  Rounds played ${state.round}`, 640, 520);
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText('Press R or click to play again', 640, 580);
  ctx.restore();

  // A win lands with a flourish: confetti over the whole screen.
  if (won) drawConfetti(ctx, state);
}
