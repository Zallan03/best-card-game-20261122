// input.js — mouse and keyboard for Ember Tide.
// One job: turn clicks and keys into game actions. It never draws anything.
// Click a card to select it; click it again (or press its number) to play
// it. D discards the selected card for +1 energy, once a round.

import { CARD_W, CARD_H, CARD_GAP, PLAYER_HAND_Y } from './config.js';
import { playPlayerCard, discardPlayerCard, nextRound, startMatch } from './state.js';
import { playCardSound, clashSound, drawSound, toggleMute } from './audio.js';
import { spawnDamagePop, spawnWinConfetti } from './animate.js';

function handX(handSize, index) {
  const total = handSize * CARD_W + (handSize - 1) * CARD_GAP;
  return (1280 - total) / 2 + index * (CARD_W + CARD_GAP);
}

function cardIndexAt(state, x, y) {
  if (y < PLAYER_HAND_Y || y > PLAYER_HAND_Y + CARD_H) return -1;
  for (let i = 0; i < state.playerHand.length; i++) {
    const cx = handX(state.playerHand.length, i);
    if (x >= cx && x <= cx + CARD_W) return i;
  }
  return -1;
}

function playClash(state, index) {
  const clash = playPlayerCard(state, index);
  if (clash) {
    playCardSound();
    clashSound(clash.winner);
    // The damage pops beside the life bar it just hurt, and a win lands
    // with confetti.
    if (clash.damage > 0) {
      const won = clash.winner === 'player';
      spawnDamagePop(state, 170, won ? 75 : 681, `-${clash.damage}`, won ? '#ffd94d' : '#ff8a7a');
    }
    if (state.screen === 'win') spawnWinConfetti(state, 120, 1280);
  }
  return clash;
}

export function attachInput(canvas, state) {
  canvas.addEventListener('click', (event) => {
    if (state.frozen) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    if (state.screen === 'title') { startMatch(state); drawSound(); return; }
    if (state.screen === 'win' || state.screen === 'loss') {
      startMatch(state);
      return;
    }
    const index = cardIndexAt(state, x, y);
    if (index < 0) return;
    // First click selects; a second click on the same card plays it.
    if (state.selectedIndex === index) playClash(state, index);
    else state.selectedIndex = index;
  });

  window.addEventListener('keydown', (event) => {
    if (state.frozen) return;
    const key = event.key.toLowerCase();
    if (state.screen === 'title' && (key === 'enter' || key === ' ')) {
      startMatch(state);
      drawSound();
      return;
    }
    if ((state.screen === 'win' || state.screen === 'loss') && (key === 'r' || key === 'enter')) {
      startMatch(state);
      return;
    }
    if (state.screen !== 'play') return;
    if (key === 'm') { toggleMute(); return; }
    if (key === 'r') { startMatch(state); return; }
    if (key === 'n') { nextRound(state); drawSound(); return; }
    if (key === 'd') {
      // Discard the selected card for +1 energy, once a round.
      if (state.selectedIndex >= 0 && discardPlayerCard(state, state.selectedIndex)) drawSound();
      return;
    }
    const num = parseInt(key, 10);
    if (num >= 1 && num <= state.playerHand.length) {
      playClash(state, num - 1);
    }
  });
}
