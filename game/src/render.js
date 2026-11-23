// render.js — the frame. One job: decide which screen to draw and draw it.
// The table, the cards and the screens live in their own files; this file
// only routes. Effects (confetti, damage pops) are drawn on top.
//
// The label beside Mara's life bar carries her title now, not the generic
// "RIVAL" — the life bar itself says MARA, and the title sits next to it.

import { CANVAS_W, CANVAS_H, RIVAL_TITLE } from './config.js';
import { drawTable, drawHud, drawClashArea, handX } from './table.js';
import { drawCard } from './cards.js';
import { drawTitle, drawEndScreen } from './screens.js';
import { drawConfetti, drawDamagePops } from './animate.js';
import { FOE_HAND_Y, PLAYER_HAND_Y } from './config.js';

export function drawGame(ctx, state, now) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  if (state.screen === 'title') { drawTitle(ctx, state); return; }
  if (state.screen === 'win') { drawEndScreen(ctx, state, true); return; }
  if (state.screen === 'loss') { drawEndScreen(ctx, state, false); return; }

  drawTable(ctx);
  drawHud(ctx, state);

  // Rival hand: face-down backs, so the player cannot see the rival's cards.
  // Her title sits right of her life bar, never on top of it.
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(RIVAL_TITLE, 336, FOE_HAND_Y - 21);
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

  // Effects on top: damage pops from the last clash, confetti if any.
  drawDamagePops(ctx, state, now || Date.now());
  drawConfetti(ctx, state);
}
