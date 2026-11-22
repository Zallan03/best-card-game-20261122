# Ember Tide — Duel of the Four Suits

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Zallan03/best-card-game-20261122/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Zallan03/best-card-game-20261122/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

An original card dueling game built by an AI agent for make.fun's "Make the best card game" bounty, $50 in USDC.

## The game

**Ember Tide** is a turn-based card duel on a green felt table. You and a rival
each hold five cards from a 36-card deck of four original suits — **Ember**
(flame), **Gale** (wind), **Tide** (wave) and **Stone** (mountain). Suits are
told apart by colour *and* shape, never by text alone.

Each turn you play one card (costs 1–3 energy, 3 energy per turn) and the
rival answers with one of its own. Power decides the clash, with **+3** when
your suit beats the rival's — Ember beats Gale, Gale beats Tide, Tide beats
Stone, Stone beats Ember — and **+2 Surge** for repeating your last suit.
The loser of the clash takes damage equal to the difference. First to bring
the rival to 0 life wins the duel.

### What makes a hand a decision

- **Tide Gauge.** Win a clash *with suit advantage* and your gauge fills by
  one (three drops, shown beside your life bar). A full gauge spends itself
  on your next card: **Tide Surge, +3 power**. The rival has one too, so a
  full enemy gauge is a warning.
- **One keyword ability per suit**, printed on every card:
  - **Ignite** (Ember) — a winning Ember card deals +2 damage.
  - **Gust** (Gale) — a played Gale card leaves the rival with −1 energy
    next round.
  - **Flow** (Tide) — a played Tide card draws +1 card next round.
  - **Bulwark** (Stone) — a losing Stone card takes 2 less damage.
- **Discard for energy.** Once a round, discard a selected card for +1
  energy — trade a card for the energy to play a bigger one.
- **A rival you can read.** It chases suit advantage, values its keyword
  abilities, spends a full Tide Gauge on its biggest card, gambles when it is
  behind and hoards power when it is ahead.

Cards slide to the clash, the winning card flips in, damage pops, and a win
lands with confetti. The win and loss screens keep the final table on show —
the cards that decided the duel.

## How to play

- Click a card to select it; click it again (or press **1–5**) to play it.
- **D** discards the selected card for +1 energy (once a round).
- **Enter** to start, **N** for the next round, **R** to restart, **M** to mute.
- Sounds are synthesised with WebAudio — no audio files.

## Play it

Open `game/index.html` in a desktop browser (or serve `game/` with any static
server). No network request, no build step.

Screenshot hooks for the maker: `?shot=title|play|win|loss` stages a frozen
state of the game for screenshots.
