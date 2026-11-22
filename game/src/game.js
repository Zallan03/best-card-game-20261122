// game.js — bootstrap for Ember Tide.
// One job: start the canvas, run the frame loop, and stage fixed states for
// screenshots with ?shot=title|play|win|loss (frozen, so the frame is stable).

import { CANVAS_W, CANVAS_H } from './config.js';
import { createMatch } from './state.js';
import { drawGame } from './render.js';
import { attachInput } from './input.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
const ctx = canvas.getContext('2d');

export const Game = createMatch();
window.Game = Game; // exposed for play-testing and screenshots.

attachInput(canvas, Game);

function stageShot(shot) {
  // Deterministic staged states, built from the game's own code paths.
  if (shot === 'title') {
    Game.screen = 'title';
  } else if (shot === 'play') {
    Game.screen = 'play';
    // A lively mid-duel table: fixed hands, a fresh clash on show.
    Game.playerHand = [
      { id: 101, suit: 'ember', power: 8, cost: 3 },
      { id: 102, suit: 'tide', power: 5, cost: 2 },
      { id: 103, suit: 'gale', power: 3, cost: 1 },
      { id: 104, suit: 'stone', power: 6, cost: 2 },
      { id: 105, suit: 'ember', power: 2, cost: 1 },
    ];
    Game.foeHand = [
      { id: 201, suit: 'gale', power: 4, cost: 2 },
      { id: 202, suit: 'stone', power: 7, cost: 3 },
      { id: 203, suit: 'tide', power: 1, cost: 1 },
      { id: 204, suit: 'ember', power: 5, cost: 2 },
      { id: 205, suit: 'gale', power: 9, cost: 3 },
    ];
    Game.playerLife = 14;
    Game.foeLife = 11;
    Game.round = 4;
    Game.playerEnergy = 2;
    Game.clash = {
      playerCard: { id: 106, suit: 'ember', power: 7, cost: 3 },
      foeCard: { id: 206, suit: 'gale', power: 4, cost: 2 },
      playerTotal: 10, foeTotal: 4, playerAdvantage: true, foeAdvantage: false,
      winner: 'player', damage: 6,
    };
    Game.log = [
      'You win the clash — 10 vs 4, 6 damage.',
      'Rival wins the clash — 3 vs 8, 5 damage.',
      'A tied clash — 6 vs 6.',
    ];
  } else if (shot === 'win') {
    Game.screen = 'win';
    Game.playerLife = 9;
    Game.foeLife = 0;
    Game.round = 7;
  } else if (shot === 'loss') {
    Game.screen = 'loss';
    Game.playerLife = 0;
    Game.foeLife = 6;
    Game.round = 6;
  }
  Game.frozen = true;
}

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) stageShot(shot);

function frame() {
  drawGame(ctx, Game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
