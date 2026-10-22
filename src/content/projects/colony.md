---
title: colony
tagline: Self-hosted LLM tooling, gated by evals.
summary: "An MCP server that gives AI assistants semantic search and note editing over a personal knowledge base, behind its own OAuth. Small local models answer only the kinds of question they have earned: 30+ labelled cases, 95% right, no flips across repeats. Runs on a Raspberry Pi running k3s and a home GPU."
repo: https://github.com/cdprice02/colony
links:
  - label: Read the evals
    href: https://github.com/cdprice02/colony/blob/main/scout/README.md
figures:
  - value: "16"
    label: MCP tools
    section: how-it-works
  - value: "197"
    label: eval cases
    section: evidence
  - value: "0"
    label: flips in 432 calls
    section: evidence
updated: 2026-10-22
tags: [Python, MCP, LLM evals, OAuth, k3s]
status: active
featured: card
order: 1
---

## Why it exists

An AI assistant is most useful with your own context, and a personal knowledge
base is where that context lives. colony is the LLM layer of a one-person
homelab: an MCP server that lets assistants search and edit that knowledge
base, and small local models that take on narrow questions for them.

The second half is the interesting one. A 4B model on a home GPU is fast and
free to call, but its mistakes are invisible to the assistant calling it. So
nothing is trusted on the model's say-so: a kind of question goes to a local
model only after that kind has passed an eval, and the bar is written down.

## How it works

The Hive is a Python MCP server over streamable HTTP. It runs its own OAuth 2.1
authorization server: clients register themselves, the owner signs in once per
client, and each client gets its own token, stored hashed and revocable.

It serves 16 tools. Semantic search merges note chunks, PDF page text, and page
images with reciprocal rank fusion. The read and write tools edit notes
atomically and record each write as one line in an audit log; moving a note
repoints its wikilinks the way Obsidian does. `scout_classify` asks Scout, a
small local model, to pick one label for a text. A nightly indexer embeds
notes, PDFs, and pictures into SQLite, incrementally and resumably.

The server runs on a Raspberry Pi 4 under k3s, behind a Tailscale Funnel. The
models run in Ollama on a desktop with an RTX 3070. When that desktop is
asleep, search and Scout fail fast with a useful message and can publish a
wake request for the home automation to answer.

```d2
client: AI assistant
pi: Raspberry Pi 4 (k3s) {
  oauth: OAuth 2.1
  hive: Hive MCP server
  index: SQLite index
  indexer: nightly indexer
  oauth -> hive
  hive -> index
  indexer -> index
}
gpu: GPU desktop {
  ollama: Ollama
}
client -> pi.oauth: Tailscale Funnel
pi.hive -> gpu.ollama: search · Scout
pi.indexer -> gpu.ollama: embeddings
```

## Evidence

Both model-backed tools are gated, over 197 labelled cases between them.

**Scout** has 144 cases in four kinds of question. A kind passes with at least
30 cases, at least 95% right, and no case changing its answer across 3 repeats
at temperature 0; a case counts as right only if every repeat is. The latest
run (`tev1:4b` at temperature 0, on the RTX 3070):

| Kind     | Right | Verdict  |
| -------- | ----- | -------- |
| extract  | 32/32 | pass     |
| category | 31/35 | fail     |
| yes-no   | 30/35 | fail     |
| rung     | 35/42 | evidence |

That is 0 flips in 432 calls, at a median of about 370 ms a call. Only
extraction passes, so the server tells assistants to use Scout for that and
decide the rest themselves. The "rung" kind (which model tier a task needs) is
judged against a larger model's answers checked by hand, so it is reported but
never passed.

**Guard** triages Home Assistant's warnings into "push a notification" or "just
log it", over 53 seeded and real events. Its bar is zero missed must-push
events and at most 1 false push in 10. The latest run missed 0 of 20 and
falsely pushed 1 of 28, at a median of 495 ms.

## Key decisions

Neither tool has ADRs; the reasoning lives in the
[Scout](https://github.com/cdprice02/colony/blob/main/scout/README.md) and
[Guard](https://github.com/cdprice02/colony/blob/main/guard/README.md) READMEs,
next to the saved runs.

- **Gate each kind of question, not the model.** One model passes extraction
  and fails yes-no, so trust is granted per kind, and the server's instructions
  say which kinds those are.
- **Fix the question, not the model's prompt.** Rewording the rung question as
  ordered rules moved it from 18/30 to 25/30, and twelve held-out cases written
  afterwards scored the same rate. A system prompt asking Scout to read
  literally helped nothing and cost two extraction cases, so it was reverted.
- **Never let a shortcut buy a pass.** Guard's fixed pre-filter drops known
  noise before the model sees it, but a filtered must-push event still counts as
  a miss, and filtered noise leaves the denominator.
- **Temperature 0, and fewer hints.** At the default temperature the same event
  flipped between tiers. Telling the model which household systems matter made
  it worse: it matched words instead of weighing them.

## Status and what's next

colony is at 0.1.0. Scout handles extraction only, and the misses in category and yes-no are mostly borderline labels and
durations mistaken for dates. A reworded question gets fresh held-out cases
before its score counts, so the bench, not a roadmap, decides what Scout takes
on next.
