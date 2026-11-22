// config.js — every tunable number and the four original suits of Ember Tide.
// One job: hold the game's constants so no other file hard-codes a value.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const START_LIFE = 20;
export const HAND_SIZE = 5;
export const ENERGY_PER_TURN = 3;
export const ADVANTAGE_BONUS = 3;
export const SURGE_BONUS = 2;

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
