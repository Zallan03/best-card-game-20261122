// ai.js — the opponent's brain. One job: pick which card the rival plays.
// The rival reads the table: it weighs power, suit advantage and cost, the
// Tide Gauge, and each card's keyword ability, and it saves its biggest
// cards for when it is behind, so its choices can be read and countered
// instead of feeling random.

import {
  SUITS, suitBeats, ADVANTAGE_BONUS, SURGE_BONUS,
  TIDE_MAX, TIDE_SURGE_BONUS, IGNITE_BONUS, BULWARK_REDUCE,
} from './config.js';

// Score one candidate card against the player's last played card (if any)
// and the current life totals. Higher is better for the rival.
export function scoreCandidate(card, foeHand, playerLastCard, foeLife, playerLife, foeLastSuit, foeTide, playerTide) {
  let score = card.power * 2;

  // Suit advantage over what the player just played is worth chasing.
  if (playerLastCard && suitBeats(card.suit, playerLastCard.suit)) score += ADVANTAGE_BONUS * 2;
  if (playerLastCard && suitBeats(playerLastCard.suit, card.suit)) score -= ADVANTAGE_BONUS * 2;

  // Surge: repeating the rival's own last suit pays off.
  if (foeLastSuit && card.suit === foeLastSuit) score += SURGE_BONUS;

  // Tide Gauge: a full gauge makes this card hit +3 harder, so spend it
  // on the biggest card in hand; and a win with advantage builds the gauge.
  if (foeTide >= TIDE_MAX) score += card.power * 0.8;
  if (playerLastCard && suitBeats(card.suit, playerLastCard.suit)) score += 1.5;

  // Keyword abilities, valued by the situation they are played into.
  if (card.suit === 'ember') {
    // Ignite only pays when this card is likely to win the clash.
    if (playerLastCard && card.power + ADVANTAGE_BONUS >= playerLastCard.power) score += IGNITE_BONUS * 1.5;
    else score += 0.5;
  }
  if (card.suit === 'gale') {
    // Gust is worth more when the player is short on energy already.
    score += 1.5;
  }
  if (card.suit === 'tide') {
    // Flow draws a card: worth more with a thin hand.
    score += foeHand.length <= 3 ? 2 : 1;
  }
  if (card.suit === 'stone') {
    // Bulwark saves life when behind; worth less when comfortably ahead.
    score += foeLife < playerLife ? BULWARK_REDUCE * 1.2 : 0.4;
  }

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
    const s = scoreCandidate(
      card, state.foeHand, state.playerLastCard, state.foeLife,
      state.playerLife, state.foeLastSuit, state.foeTide, state.playerTide,
    );
    if (s > bestScore) {
      bestScore = s;
      best = card;
    }
  }
  return best;
}
