// config.js — every tunable number, the four original suits, the keyword
// abilities, and the rival's identity in Ember Tide.
// One job: hold the game's constants so no other file hard-codes a value.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const START_LIFE = 20;
export const HAND_SIZE = 5;
export const ENERGY_PER_TURN = 3;
export const MAX_ENERGY = 5;
export const ADVANTAGE_BONUS = 3;
export const SURGE_BONUS = 2;

// The Tide Gauge: win a clash with suit advantage and the gauge rises by 1.
// At 3 the gauge empties and the next card you play gains +3 power
// (a Tide Surge). Both sides track their own gauge.
export const TIDE_MAX = 3;
export const TIDE_SURGE_BONUS = 3;

// Discard: once a round, throw away a selected card to gain +1 energy.
export const DISCARD_ENERGY = 1;

// The rival has a name and a title now. A named opponent reads as a
// character with a personality, not a faceless "RIVAL" — the one originality
// lift this iteration adds. (The ember-duel theme is crowded; the duel
// itself, and the rival in it, is what must stand out.) She never folds,
// and she never forgets a card you played.
export const RIVAL_NAME = 'Mara';
export const RIVAL_TITLE = 'the Ember Duchess';

// The four suits. Each has a colour AND a shape, never text alone:
// Ember = flame triangle, Tide = wave, Gale = wind swirl, Stone = mountain.
// The advantage cycle runs Ember > Gale > Tide > Stone > Ember.
export const SUITS = {
  ember: { name: 'Ember', color: '#ff6b35', dark: '#a83208', light: '#ffb08a', beats: 'gale', glyph: 'flame' },
  gale: { name: 'Gale', color: '#3fae5a', dark: '#1d6b32', light: '#9be3a8', beats: 'tide', glyph: 'swirl' },
  tide: { name: 'Tide', color: '#2f7fe0', dark: '#144a8f', light: '#8fc2f7', beats: 'stone', glyph: 'wave' },
  stone: { name: 'Stone', color: '#8a8f98', dark: '#4c5158', light: '#c9cdd4', beats: 'ember', glyph: 'peak' },
};
export const SUIT_KEYS = ['ember', 'gale', 'tide', 'stone'];

// One keyword ability per suit, printed on every card of that suit.
// Ignite: a winning Ember card deals +2 damage.
// Gust: a played Gale card leaves the rival with -1 energy next round (min 1).
// Flow: a played Tide card draws +1 card at the next round.
// Bulwark: a losing Stone card takes 2 less damage (min 0).
export const ABILITIES = {
  ember: { keyword: 'IGNITE', text: 'Win: +2 damage' },
  gale: { keyword: 'GUST', text: 'Rival -1 energy next round' },
  tide: { keyword: 'FLOW', text: 'Draw +1 card next round' },
  stone: { keyword: 'BULWARK', text: 'Lose: take 2 less damage' },
};
export const IGNITE_BONUS = 2;
export const GUST_PENALTY = 1;
export const FLOW_DRAW = 1;
export const BULWARK_REDUCE = 2;
export const MIN_ROUND_ENERGY = 1;

// Card layout on the 1280x720 table.
export const CARD_W = 118;
export const CARD_H = 168;
export const CARD_GAP = 16;

// Opponent hand sits at the top, player hand at the bottom.
export const FOE_HAND_Y = 96;
export const PLAYER_HAND_Y = 492;
export const CLASH_Y = 292;

// Power 1..9, cost grows with power: 1-3 cost 1, 4-6 cost 2, 7-9 cost 3.
export function costOfPower(power) {
  return power <= 3 ? 1 : power <= 6 ? 2 : 3;
}

export function suitBeats(a, b) {
  return SUITS[a].beats === b;
}
