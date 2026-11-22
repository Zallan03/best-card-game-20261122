// state.js — the rules of Ember Tide, as pure state transitions.
// One job: hold the match state and resolve turns. Nothing here draws pixels.
// New in this version: the Tide Gauge, one keyword ability per suit, and
// discard-for-energy. Each is resolved here, in one place, so the clash
// record always tells the whole story of what happened.

import {
  START_LIFE, HAND_SIZE, ENERGY_PER_TURN, MAX_ENERGY,
  ADVANTAGE_BONUS, SURGE_BONUS, TIDE_MAX, TIDE_SURGE_BONUS,
  DISCARD_ENERGY, IGNITE_BONUS, GUST_PENALTY, FLOW_DRAW,
  BULWARK_REDUCE, MIN_ROUND_ENERGY, suitBeats,
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
    clash: null, // {playerCard, foeCard, playerTotal, foeTotal, winner, damage, ...}
    log: ['Welcome to Ember Tide. Play a card to begin the duel.'],
    frozen: false,
    selectedIndex: -1,
    lastPlayedAt: 0,
    // Tide Gauge, one per side: 0..TIDE_MAX. At TIDE_MAX the next card
    // played by that side gains TIDE_SURGE_BONUS power and the gauge resets.
    playerTide: 0,
    foeTide: 0,
    // Pending round modifiers, set by Gale (Gust) and Tide (Flow) cards.
    playerEnergyNext: ENERGY_PER_TURN,
    foeEnergyNext: ENERGY_PER_TURN,
    playerDrawNext: 1,
    foeDrawNext: 1,
    discardedThisRound: false,
    // Animation/effects state (read by animate.js, never by the rules).
    fx: null,
  };
}

export function clashTotals(playerCard, foeCard, playerLastSuit, foeLastSuit, playerTideSurge, foeTideSurge) {
  let playerTotal = playerCard.power + (playerTideSurge ? TIDE_SURGE_BONUS : 0);
  let foeTotal = foeCard.power + (foeTideSurge ? TIDE_SURGE_BONUS : 0);
  let playerAdvantage = false;
  let foeAdvantage = false;
  if (suitBeats(playerCard.suit, foeCard.suit)) { playerTotal += ADVANTAGE_BONUS; playerAdvantage = true; }
  if (suitBeats(foeCard.suit, playerCard.suit)) { foeTotal += ADVANTAGE_BONUS; foeAdvantage = true; }
  if (playerLastSuit && playerCard.suit === playerLastSuit) playerTotal += SURGE_BONUS;
  if (foeLastSuit && foeCard.suit === foeLastSuit) foeTotal += SURGE_BONUS;
  return { playerTotal, foeTotal, playerAdvantage, foeAdvantage };
}

// Resolve one played card's keyword ability. `side` is 'player' or 'foe'.
// Returns short log lines describing what the ability did.
function resolveAbility(state, side, card) {
  const lines = [];
  if (card.suit === 'gale') {
    // Gust: the other side starts the next round with less energy.
    if (side === 'player') {
      state.foeEnergyNext = Math.max(MIN_ROUND_ENERGY, ENERGY_PER_TURN - GUST_PENALTY);
      lines.push(`Gust — the rival starts next round with ${state.foeEnergyNext} energy.`);
    } else {
      state.playerEnergyNext = Math.max(MIN_ROUND_ENERGY, ENERGY_PER_TURN - GUST_PENALTY);
      lines.push(`Gust — you start next round with ${state.playerEnergyNext} energy.`);
    }
  }
  if (card.suit === 'tide') {
    // Flow: this side draws an extra card at the next round.
    if (side === 'player') {
      state.playerDrawNext = 1 + FLOW_DRAW;
      lines.push('Flow — you draw an extra card next round.');
    } else {
      state.foeDrawNext = 1 + FLOW_DRAW;
      lines.push('Flow — the rival draws an extra card next round.');
    }
  }
  return lines;
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

  // Tide Surge: a full gauge spends itself on this card, +3 power.
  const playerTideSurge = state.playerTide >= TIDE_MAX;
  const foeTideSurge = state.foeTide >= TIDE_MAX;
  if (playerTideSurge) state.playerTide = 0;
  if (foeTideSurge) state.foeTide = 0;

  state.playerHand.splice(index, 1);
  state.foeHand.splice(state.foeHand.indexOf(foeCard), 1);
  state.playerEnergy -= card.cost;
  state.foeEnergy -= foeCard.cost;

  const totals = clashTotals(card, foeCard, state.playerLastSuit, state.foeLastSuit, playerTideSurge, foeTideSurge);
  let winner = 'tie';
  let damage = 0;
  if (totals.playerTotal > totals.foeTotal) {
    winner = 'player';
    damage = totals.playerTotal - totals.foeTotal;
  } else if (totals.foeTotal > totals.playerTotal) {
    winner = 'foe';
    damage = totals.foeTotal - totals.playerTotal;
  }

  // Keyword abilities, applied after the totals are known.
  const abilityLines = [];
  let igniteBonus = 0;
  let bulwarkSave = 0;
  if (winner === 'player' && card.suit === 'ember') {
    igniteBonus = IGNITE_BONUS;
    damage += igniteBonus;
    abilityLines.push('Ignite! +2 damage.');
  }
  if (winner === 'foe' && foeCard.suit === 'ember') {
    igniteBonus = IGNITE_BONUS;
    damage += igniteBonus;
    abilityLines.push('Ignite! The rival burns you for +2 damage.');
  }
  if (winner === 'player' && foeCard.suit === 'stone') {
    bulwarkSave = Math.min(BULWARK_REDUCE, damage);
    damage -= bulwarkSave;
    abilityLines.push(`Bulwark absorbs ${bulwarkSave} damage.`);
  }
  if (winner === 'foe' && card.suit === 'stone') {
    bulwarkSave = Math.min(BULWARK_REDUCE, damage);
    damage -= bulwarkSave;
    abilityLines.push(`Your Bulwark absorbs ${bulwarkSave} damage.`);
  }
  abilityLines.push(...resolveAbility(state, 'player', card));
  abilityLines.push(...resolveAbility(state, 'foe', foeCard));

  if (winner === 'player') state.foeLife = Math.max(0, state.foeLife - damage);
  else if (winner === 'foe') state.playerLife = Math.max(0, state.playerLife - damage);

  // The Tide Gauge rises only on a win WITH suit advantage.
  if (winner === 'player' && totals.playerAdvantage) state.playerTide = Math.min(TIDE_MAX, state.playerTide + 1);
  if (winner === 'foe' && totals.foeAdvantage) state.foeTide = Math.min(TIDE_MAX, state.foeTide + 1);

  state.clash = {
    playerCard: card, foeCard, ...totals, winner, damage,
    playerTideSurge, foeTideSurge, igniteBonus, bulwarkSave,
  };
  state.playerLastCard = card;
  state.foeLastCard = foeCard;
  state.playerLastSuit = card.suit;
  state.foeLastSuit = foeCard.suit;
  state.discard.push(card, foeCard);
  state.selectedIndex = -1;
  state.lastPlayedAt = Date.now();

  const verb = winner === 'player' ? 'You win the clash' : winner === 'foe' ? 'Rival wins the clash' : 'A tied clash';
  const surgeNote = playerTideSurge ? ' Tide Surge +3!' : foeTideSurge ? ' Rival Tide Surge +3!' : '';
  state.log.unshift(`${verb} — ${totals.playerTotal} vs ${totals.foeTotal}${damage ? `, ${damage} damage` : ''}.${surgeNote}`);
  for (const line of abilityLines) state.log.unshift(line);
  state.log = state.log.slice(0, 4);

  if (state.foeLife <= 0) state.screen = 'win';
  else if (state.playerLife <= 0) state.screen = 'loss';
  return state.clash;
}

// Discard a selected card for +1 energy, once a round. Returns true when
// a card was discarded. The last card in hand cannot be discarded.
export function discardPlayerCard(state, index) {
  if (state.screen !== 'play' || state.frozen) return false;
  if (state.discardedThisRound) return false;
  if (index < 0 || index >= state.playerHand.length) return false;
  if (state.playerHand.length <= 1) return false;
  const card = state.playerHand.splice(index, 1)[0];
  state.discard.push(card);
  state.playerEnergy = Math.min(MAX_ENERGY, state.playerEnergy + DISCARD_ENERGY);
  state.discardedThisRound = true;
  state.selectedIndex = -1;
  state.log.unshift(`Discarded a ${card.suit} ${card.power} for +1 energy.`);
  state.log = state.log.slice(0, 4);
  return true;
}

// End the round: energy refreshes (with any Gust penalty), both sides draw
// (with any Flow bonus), and the discard allowance resets.
export function nextRound(state) {
  if (state.screen !== 'play') return;
  state.round += 1;
  state.playerEnergy = state.playerEnergyNext;
  state.foeEnergy = state.foeEnergyNext;
  state.playerEnergyNext = ENERGY_PER_TURN;
  state.foeEnergyNext = ENERGY_PER_TURN;
  state.selectedIndex = -1;
  state.discardedThisRound = false;
  for (let i = 0; i < state.playerDrawNext; i++) {
    const p = drawCard(state.deck, state.discard);
    if (p) state.playerHand.push(p);
  }
  for (let i = 0; i < state.foeDrawNext; i++) {
    const f = drawCard(state.deck, state.discard);
    if (f) state.foeHand.push(f);
  }
  state.playerDrawNext = 1;
  state.foeDrawNext = 1;
}

export function startMatch(state) {
  const fresh = createMatch();
  Object.assign(state, fresh, { screen: 'play' });
  state.log = ['The duel begins. Ember beats Gale, Gale beats Tide, Tide beats Stone, Stone beats Ember.'];
}
