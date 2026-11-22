// game.js — bootstrap for Ember Tide.
// One job: start the canvas, run the frame loop, and stage fixed states for
// screenshots with ?shot=title|play|win|loss (frozen, so the frame is stable).
// The staged states show the new systems — the Tide Gauge, a keyword ability
// firing, and the final table on the win and loss shots.

import { CANVAS_W, CANVAS_H } from './config.js';
import { createMatch } from './state.js';
import { drawGame } from './render.js';
import { attachInput } from './input.js';
import { updateEffects, stageWinConfetti } from './animate.js';

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
    // A lively mid-duel table: fixed hands, a fresh clash on show, and the
    // new systems visible — a Tide Gauge at 2 and an Ignite card winning.
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
    Game.playerTide = 2;
    Game.foeTide = 1;
    Game.selectedIndex = 0;
    Game.clash = {
      playerCard: { id: 106, suit: 'ember', power: 7, cost: 3 },
      foeCard: { id: 206, suit: 'gale', power: 4, cost: 2 },
      playerTotal: 10, foeTotal: 4, playerAdvantage: true, foeAdvantage: false,
      winner: 'player', damage: 8, playerTideSurge: false, foeTideSurge: false,
      igniteBonus: 2, bulwarkSave: 0,
    };
    Game.log = [
      'You win the clash — 10 vs 4, 8 damage. Ignite! +2 damage.',
      'Rival wins the clash — 3 vs 8, 5 damage.',
      'A tied clash — 6 vs 6.',
    ];
    // The verdict line already carries the damage; no time-based pop is
    // staged here, because a frozen frame cannot age one reliably.
  } else if (shot === 'win') {
    Game.screen = 'win';
    Game.playerLife = 9;
    Game.foeLife = 0;
    Game.round = 7;
    Game.playerTide = 3;
    Game.foeTide = 1;
    Game.clash = {
      playerCard: { id: 106, suit: 'ember', power: 9, cost: 3 },
      foeCard: { id: 206, suit: 'gale', power: 4, cost: 2 },
      playerTotal: 14, foeTotal: 4, playerAdvantage: true, foeAdvantage: false,
      winner: 'player', damage: 10, playerTideSurge: true, foeTideSurge: false,
      igniteBonus: 2, bulwarkSave: 0,
    };
    stageWinConfetti(Game, CANVAS_W, CANVAS_H);
  } else if (shot === 'loss') {
    Game.screen = 'loss';
    Game.playerLife = 0;
    Game.foeLife = 6;
    Game.round = 6;
    Game.playerTide = 1;
    Game.foeTide = 2;
    Game.clash = {
      playerCard: { id: 106, suit: 'stone', power: 5, cost: 2 },
      foeCard: { id: 206, suit: 'tide', power: 8, cost: 3 },
      playerTotal: 5, foeTotal: 11, playerAdvantage: false, foeAdvantage: true,
      winner: 'foe', damage: 6, playerTideSurge: false, foeTideSurge: false,
      igniteBonus: 0, bulwarkSave: 2,
    };
  }
  Game.frozen = true;
}

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) stageShot(shot);

let lastNow = Date.now();
function frame(now) {
  const dt = Math.min(50, now - lastNow);
  lastNow = now;
  if (!Game.frozen) updateEffects(Game, now, dt);
  drawGame(ctx, Game, now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
