// deck.js — builds, shuffles and deals the 36-card Ember Tide deck.
// One job: own the deck. Nothing here knows about turns, life or the screen.

import { SUIT_KEYS, costOfPower } from './config.js';

let nextId = 1;

export function buildDeck() {
  const deck = [];
  for (const suit of SUIT_KEYS) {
    for (let power = 1; power <= 9; power++) {
      deck.push({ id: nextId++, suit, power, cost: costOfPower(power) });
    }
  }
  return deck;
}

// Fisher-Yates shuffle. Accepts an optional random source so tests and
// screenshot staging can deal a fixed hand.
export function shuffleDeck(deck, rand = Math.random) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Draw one card, reshuffling the discard pile when the deck runs dry.
export function drawCard(deck, discard) {
  if (deck.length === 0) {
    if (discard.length === 0) return null;
    deck.push(...shuffleDeck(discard.splice(0)));
  }
  return deck.pop();
}

export function drawHand(deck, discard, count) {
  const hand = [];
  for (let i = 0; i < count; i++) {
    const card = drawCard(deck, discard);
    if (card) hand.push(card);
  }
  return hand;
}
