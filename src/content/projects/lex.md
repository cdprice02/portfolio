---
title: lex
tagline: A Wordle solver that looks ahead, judged in six languages.
summary: A Wordle solver in Rust. It picks guesses by how much they narrow the field, looks ahead with rollout search in the middle game, and solves the last few candidates exactly, with a precomputed opening book for the slow first moves. Every change is judged by mean guesses on committed benchmark snapshots across six languages.
repo: https://github.com/cdprice02/lex
links:
  - label: Benchmarks
    href: https://github.com/cdprice02/lex/blob/main/benchmarks/README.md
figures:
  - value: "3.47"
    label: mean guesses on the 2,315 Wordle answers
    section: evidence
  - value: "6"
    label: languages, one solver
    section: how-it-works
  - value: "11"
    label: benchmark Tracks, each with a committed snapshot
    section: evidence
updated: 2026-11-14
tags: [Rust]
status: maintained
featured: card
order: 4
---

## Why it exists

Most Wordle solvers stop at "pick the guess that splits the word list best".
lex started there, then asked how far the rest of the game could be solved
exactly, and how to tell whether a change to the solver made it better rather
than merely different. The second question shaped the project more than the
first: the solver is built around being measured.

It is also language agnostic. Words come from the Google Books Ngrams corpus,
filtered against Wiktionary so only real dictionary words remain, and
frequency gives each word a prior chance of being the answer. Nothing in the
solver knows which game's word list is loaded; the official Wordle lists enter
as data, so the published optima for them can serve as a yardstick.

## How it works

Each position in a game is handled by whichever method fits its size:

- **Opening book.** The first levels of the game tree are too slow to search
  per move, so they are built once and looked up. The book only stores
  guesses the online search would have made, so a game plays identically with
  or without it.
- **Entropy scoring.** With many candidates left, each guess is scored by how
  evenly it splits them, weighted by word frequency, plus a bonus for being a
  possible answer.
- **Rollout.** From about 300 candidates down to 11, the ten best-scoring
  guesses are each played out to the end and the one with the fewest expected
  guesses wins.
- **Endgame.** At 10 candidates or fewer, the solver searches the game tree
  exactly to minimize expected guesses.

Tunable values are derived from the corpus or set once for all languages;
a table of per-language settings is ruled out, which is why one solver covers
English, French, German, Spanish, Italian, and Russian.

```mermaid alt="A position's candidate count picks the method: a stored opening-book entry is looked up; otherwise 10 or fewer candidates get an exact Endgame search, 11 to 300 get Rollout over the top 10 guesses, and more than 300 get entropy scoring."
graph TD
  pos[position and candidate set] --> book{in the opening book?}
  book -->|yes| lookup[look up the stored guess]
  book -->|no| size{candidates left}
  size -->|10 or fewer| endgame[exact Endgame search]
  size -->|11 to 300| rollout[Rollout over the top 10 guesses]
  size -->|more than 300| entropy[entropy scoring]
```

## Evidence

Every solver change is judged by one rule, written down before the numbers
exist: [mean guesses first, failure rate second, pooled across every language
and length](https://github.com/cdprice02/lex/blob/main/docs/adr/0007-benchmark-objective.md).
Each of the 11 headline Tracks has a committed snapshot, and CI fails when the
[generated results table](https://github.com/cdprice02/lex/blob/main/benchmarks/README.md#current-results)
is stale, so the numbers on this page cannot drift from the code unnoticed.
The [methodology](https://github.com/cdprice02/lex/blob/main/benchmarks/README.md)
covers how Tracks, targets, and verdicts work.

As of the date above, on the 2,315 Wordle answers lex averages 3.47 guesses
(3.4721) and has no game over six guesses (0.00%). The other five languages at
word length 5 average between 3.65 (Italian) and 4.44 (Russian), weighting each word by
how likely it is to be the answer.

Choices that changed the solver are backed by written experiments, including
rejections:
[strategy](https://github.com/cdprice02/lex/blob/main/benchmarks/experiments/strategy.md),
[endgame](https://github.com/cdprice02/lex/blob/main/benchmarks/experiments/endgame.md),
[rollout cap](https://github.com/cdprice02/lex/blob/main/benchmarks/experiments/rollout-cap.md),
[opening-book floor](https://github.com/cdprice02/lex/blob/main/benchmarks/experiments/book-floor.md),
and the
[answer-prior shape](https://github.com/cdprice02/lex/blob/main/benchmarks/experiments/prior-shape.md),
where a plausible alternative lost to the plain power law.

Hard mode is a gap, not a win. Under the official hard-mode rule, lex
averages 3.5758 on the same 2,315 answers (the `wordle-hard` Track), against
Alex Selby's published optimum of 3.5084: about 0.07 guesses behind. It is
reported, never judged. No optimum is published for the stricter ultrahard
variant, so there is nothing to compare it with.

## Key decisions

- **[One benchmark objective](https://github.com/cdprice02/lex/blob/main/docs/adr/0007-benchmark-objective.md).**
  Failure rate used to come first; it was demoted after it rejected an Endgame
  search that lowered the mean. A change now lands only if the pooled mean
  improves and no Track regresses beyond a fixed bound.
- **[The committed snapshot is the base](https://github.com/cdprice02/lex/blob/main/docs/adr/0012-snapshot-benchmark-record.md).**
  Changes are checked against a stored record, not a rerun of the old commit,
  so a behavior-preserving change must show no diff at all.
- **[The opening book caches the policy](https://github.com/cdprice02/lex/blob/main/docs/adr/0011-opening-book-caches-the-policy.md).**
  It never plays a stronger game than the online solver would, so it can be
  deleted or rebuilt without changing a single result.
- **[Wordle lists are data](https://github.com/cdprice02/lex/blob/main/docs/adr/0004-generic-answer-model-with-profiles.md).**
  A Profile pairs an answer list with a guess pool; nothing in the solver may
  branch on which one is loaded.

## Status and what's next

lex is maintained and still moving: solver and benchmark changes land through
pull requests judged by the rule above. Its binary has no tagged release yet.
The open gap is hard mode.
