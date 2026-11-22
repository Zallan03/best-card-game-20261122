// ai.js — the opponent's brain. One job: pick which card the rival plays.
// The rival reads the table: it weighs power, suit advantage and cost, and
// it saves its biggest cards for when it is behind, so its choices can be
// read and countered instead of feeling random.

import { SUITS, suitBeats, ADVANTAGE_BONUS, SURGE_BONUS } from './config.js';

// Score one candidate card against the player's last played card (if any)
// and the current life totals. Higher is better for the rival.
export function scoreCandidate(card, foeHand, playerLastCard, foeLife, playerLife, foeLastSuit) {
  let score = card.power * 2;

  // Suit advantage over what the player just played is worth chasing.
  if (playerLastCard && suitBeats(card.suit, playerLastCard.suit)) score += ADVANTAGE_BONUS * 2;
  if (playerLastCard && suitBeats(playerLastCard.suit, card.suit)) score -= ADVANTAGE_BONUS * 2;

  // Surge: repeating the rival's own last suit pays off.
  if (foeLastSuit && card.suit === foeLastSuit) score += SURGE_BONUS;

  // When behind on life, the rival gambles on its biggest card.
  if (foeLife < playerLife) score += card.power * 0.6;
  // When ahead, it hoards power and plays cheap cards instead.
  if (foeLife > playerLife + 6) score -= card.power * 0.8;

  // Slight penalty for spending a lot of energy on a weak swing.
  score -= card.cost * 0.5;
  return score;
}

export function chooseOpponentCard(state) {
  const playable = state.foeHand.filter((c) => c.cost <= state.foeEnergy);
  const pool = playable.length > 0 ? playable : state.foeHand;
  if (pool.length === 0) return null;
  let best = pool[0];
  let bestScore = -Infinity;
  for (const card of pool) {
    const s = scoreCandidate(card, state.foeHand, state.playerLastCard, state.foeLife, state.playerLife, state.foeLastSuit);
    if (s > bestScore) {
      bestScore = s;
      best = card;
    }
  }
  return best;
}
