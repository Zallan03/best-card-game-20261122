// state.js — the rules of Ember Tide, as pure state transitions.
// One job: hold the match state and resolve turns. Nothing here draws pixels.

import {
  START_LIFE, HAND_SIZE, ENERGY_PER_TURN,
  ADVANTAGE_BONUS, SURGE_BONUS, suitBeats,
} from './config.js';
import { buildDeck, shuffleDeck, drawHand, drawCard } from './deck.js';
import { chooseOpponentCard } from './ai.js';

export function createMatch() {
  const deck = shuffleDeck(buildDeck());
  const discard = [];
  return {
    screen: 'title', // title | play | win | loss
    round: 1,
    playerLife: START_LIFE,
    foeLife: START_LIFE,
    playerEnergy: ENERGY_PER_TURN,
    foeEnergy: ENERGY_PER_TURN,
    playerHand: drawHand(deck, discard, HAND_SIZE),
    foeHand: drawHand(deck, discard, HAND_SIZE),
    deck,
    discard,
    playerLastCard: null,
    foeLastCard: null,
    playerLastSuit: null,
    foeLastSuit: null,
    clash: null, // {playerCard, foeCard, playerTotal, foeTotal, winner, damage}
    log: ['Welcome to Ember Tide. Play a card to begin the duel.'],
    frozen: false,
    selectedIndex: -1,
    lastPlayedAt: 0,
  };
}

export function clashTotals(playerCard, foeCard, playerLastSuit, foeLastSuit) {
  let playerTotal = playerCard.power;
  let foeTotal = foeCard.power;
  let playerAdvantage = false;
  let foeAdvantage = false;
  if (suitBeats(playerCard.suit, foeCard.suit)) { playerTotal += ADVANTAGE_BONUS; playerAdvantage = true; }
  if (suitBeats(foeCard.suit, playerCard.suit)) { foeTotal += ADVANTAGE_BONUS; foeAdvantage = true; }
  if (playerLastSuit && playerCard.suit === playerLastSuit) playerTotal += SURGE_BONUS;
  if (foeLastSuit && foeCard.suit === foeLastSuit) foeTotal += SURGE_BONUS;
  return { playerTotal, foeTotal, playerAdvantage, foeAdvantage };
}

// The player plays one card; the rival answers; the clash resolves.
// Returns the clash record, or null when the card cannot be played.
export function playPlayerCard(state, index) {
  if (state.screen !== 'play' || state.frozen) return null;
  if (index < 0 || index >= state.playerHand.length) return null;
  const card = state.playerHand[index];
  if (card.cost > state.playerEnergy) return null;

  const foeCard = chooseOpponentCard(state);
  if (!foeCard) return null;

  state.playerHand.splice(index, 1);
  state.foeHand.splice(state.foeHand.indexOf(foeCard), 1);
  state.playerEnergy -= card.cost;
  state.foeEnergy -= foeCard.cost;

  const totals = clashTotals(card, foeCard, state.playerLastSuit, state.foeLastSuit);
  let winner = 'tie';
  let damage = 0;
  if (totals.playerTotal > totals.foeTotal) {
    winner = 'player';
    damage = totals.playerTotal - totals.foeTotal;
    state.foeLife = Math.max(0, state.foeLife - damage);
  } else if (totals.foeTotal > totals.playerTotal) {
    winner = 'foe';
    damage = totals.foeTotal - totals.playerTotal;
    state.playerLife = Math.max(0, state.playerLife - damage);
  }

  state.clash = { playerCard: card, foeCard, ...totals, winner, damage };
  state.playerLastCard = card;
  state.foeLastCard = foeCard;
  state.playerLastSuit = card.suit;
  state.foeLastSuit = foeCard.suit;
  state.discard.push(card, foeCard);
  state.lastPlayedAt = Date.now();

  const verb = winner === 'player' ? 'You win the clash' : winner === 'foe' ? 'Rival wins the clash' : 'A tied clash';
  state.log.unshift(`${verb} — ${totals.playerTotal} vs ${totals.foeTotal}${damage ? `, ${damage} damage` : ''}.`);
  state.log = state.log.slice(0, 4);

  if (state.foeLife <= 0) state.screen = 'win';
  else if (state.playerLife <= 0) state.screen = 'loss';
  return state.clash;
}

// End the round: both sides draw back up and energy refreshes.
export function nextRound(state) {
  if (state.screen !== 'play') return;
  state.round += 1;
  state.playerEnergy = ENERGY_PER_TURN;
  state.foeEnergy = ENERGY_PER_TURN;
  state.selectedIndex = -1;
  const p = drawCard(state.deck, state.discard);
  if (p) state.playerHand.push(p);
  const f = drawCard(state.deck, state.discard);
  if (f) state.foeHand.push(f);
}

export function startMatch(state) {
  const fresh = createMatch();
  Object.assign(state, fresh, { screen: 'play' });
  state.log = ['The duel begins. Ember beats Gale, Gale beats Tide, Tide beats Stone, Stone beats Ember.'];
}
