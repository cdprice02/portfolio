---
title: turox
tagline: A chess engine, forged in Rust.
summary: A bitboard chess engine built for measured performance work. Its move generation, checked against perft, runs at about 18 million positions a second, and search at about 700,000 nodes a second. Changes to playing strength are tested with SPRT self-play. It plays as a bot on Lichess, rated about 2000 in bullet and blitz.
repo: https://github.com/cdprice02/turox
links:
  - label: Challenge on Lichess
    href: https://lichess.org/@/turox-bot
caveat: turox-bot runs from a laptop at home, so it is online most days but not always.
figures:
  - value: "~2000"
    label: Lichess rating (bullet, blitz)
    section: evidence
  - value: 18M
    label: perft positions / second
    section: evidence
  - value: 700k
    label: search nodes / second
    section: evidence
updated: 2026-10-22
tags: [Rust, search, SPRT]
status: active
featured: card
order: 2
---

## Why it exists

turox is practice in performance work where the result is measured, not argued.
Chess suits that well: move generation has an exact answer to check against,
speed is a number, and playing strength can be settled by a statistical test
instead of a hunch. Chess is the vehicle, not the point; the point is profiling,
`target-feature` tuning, and changing code because a measurement said to.

The target that gives the work something to aim at is a real rating. The engine
speaks UCI well enough to play on Lichess, where it meets thousands of human and
engine opponents it was never tuned against.

## How it works

The board is a set of 64-bit bitboards. Sliding-piece attacks come from magic
bitboard tables whose multipliers are found by search, written out by a
generator, and checked on every push against a naive ray walk. Search is
negamax with alpha-beta over iterative deepening, with quiescence, a
transposition table, killer moves, and time management. Evaluation is tapered
between midgame and endgame.

The code is split into crates with a one-way dependency that the compiler
enforces: `turox-chess` holds the rules of chess, `turox-engine` holds the part
that plays, and `turox-notation` holds how a game is written down. Neither the
rules nor the engine takes a runtime dependency.

```d2
lichess: Lichess
runner: bot runner
sprt: SPRT harness
engine: turox engine {
  uci: UCI
  search: search · eval
  movegen: movegen (bitboards)
  uci -> search -> movegen
}
lichess -> runner: games
runner -> engine.uci: UCI
sprt -> engine.uci: matches
```

## Evidence

Speed was measured on a 2017 dual-core laptop (Intel Core i5-7267U), with
`cargo bench -p turox-engine` and the perft driver:

| Measure               | Result                  | How                                |
| --------------------- | ----------------------- | ---------------------------------- |
| Perft                 | 18 to 19M positions / s | start position, depth 5, best of 7 |
| Search                | 650k to 736k nodes / s  | same build                         |
| Legal move generation | 46.9 ns per move        | median of three best-of-15 runs    |

The gap between the first two rows is not a contradiction. Perft counts the
last ply without playing it, so a perft node is far cheaper than a search node
that also evaluates, probes the transposition table, and sorts. The more useful
finding is what a search node costs: one legal move generation call takes about
1.6 microseconds, and a node at 700k nodes a second has about 1.4 microseconds
in total. To a first approximation, move generation _is_ the node cost, which
is where the [board representation
research](https://github.com/cdprice02/turox/blob/main/docs/research/board-representation.md)
goes next.

CI checks only that the benchmarks compile; shared runners vary too much run to
run for the numbers to mean anything on a pull request. A weekly job runs them
for the record.

Benchmarks say whether a change made the engine faster, not whether it plays
better. For that, `tools/selfplay/sprt.sh` builds two versions and plays them
against each other over a 2,494-position opening suite under a sequential
probability ratio test (bounds 0 and 10 Elo, 5% error each way), so an
evaluation or search change gets a pass or fail from games. A refactor that
claims to change nothing is checked more cheaply: the same node counts and
principal variations across a fixed set of positions, at the same speed, mean
playing strength is unchanged by construction.

On Lichess, turox-bot is rated 2019 in bullet over 868 rated games and 1954 in
blitz over 1,040, taken from its public profile and charted from the bot's own
game records.

## Key decisions

The repository keeps [eight ADRs](https://github.com/cdprice02/turox/tree/main/docs/adr).
Three show how choices get made here:

- **[Accept bounded path-dependence in the transposition table](https://github.com/cdprice02/turox/blob/main/docs/adr/0002-accept-bounded-path-dependence-in-the-transposition-table.md).**
  The table ignores how a position was reached, so a repetition draw can leak
  into an ancestor's score. The published fixes exist, but they cost more than
  they return at this strength: the error shows up as half points in specific
  endgames, while the engine still loses games by whole pawns.
- **[Own opening book format, not Polyglot](https://github.com/cdprice02/turox/blob/main/docs/adr/0006-own-zobrist-keyed-opening-book-format-not-polyglot.md).**
  Polyglot needs no engine code under the Lichess runner, but works only there,
  and brings a second hashing scheme and a castling encoding that had already
  caused bugs. The engine's own format reuses its existing hash and serves every
  host from one file.
- **[Chess primitives in their own crate](https://github.com/cdprice02/turox/blob/main/docs/adr/0008-chess-primitives-split-into-their-own-crate.md).**
  The build-time case was thin (about 11 seconds saved on a build nobody waits
  on). The split was made for legibility: a crate graph states the layering in a
  way a module tree cannot.

## Status and what's next

turox plays. It speaks UCI end to end and runs on Lichess under a supervisor
script that restarts it after a crash or stall and keeps the laptop awake. The
current version is 0.1.0, with no tagged release yet; planned work lives on the
[issue tracker](https://github.com/cdprice02/turox/issues).

Next, the bot and its SPRT matches move off the laptop: the bot to an always-on
cloud host, and the matches to on-demand cloud machines that contributors can
run in their own accounts.
