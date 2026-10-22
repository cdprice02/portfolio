---
title: nix-atelier
tagline: One flake input, a full dev environment.
summary: A Nix framework for reproducible development environments. Pin it as a flake input, call one function, and get the same tools and shell on macOS, Linux (including WSL2), or NixOS.
repo: https://github.com/cdprice02/nix-atelier
links:
  - label: Quick start
    href: https://github.com/cdprice02/nix-atelier#quick-start
figures:
  - value: "4"
    label: systems built in CI
    section: evidence
  - value: "3"
    label: config kinds from one call
    section: how-it-works
  - value: "~15"
    label: lines in your flake
    section: how-it-works
updated: 2026-10-22
tags: [Nix, macOS, Linux, WSL2]
status: maintained
featured: card
order: 3
---

## Why it exists

A development environment spread across a Mac, a few Linux machines, and WSL2
drifts: a fix made on one machine has to be remembered and repeated on the
others. Nix solves the reproducibility, but the usual starting points are
templates you fork, and a fork stops receiving fixes the day it is made.

nix-atelier is consumed, not forked. You pin it as a flake input and bump it,
so framework fixes and new tools arrive the way a library update does.
Anything private (a work identity, real secrets) stays in your own flake and
never has to live in a copy of this one.

## How it works

Your flake calls one function, `lib.mkConfigs`, with your identity and a list
of configs; the scaffolded flake is about 15 lines once the comments are gone.
Each config becomes one of three kinds: Home Manager for Linux and WSL2,
nix-darwin for macOS, or NixOS.

Every config starts from the same always-on base: shell setup, git identity,
SSH, a policy for where Nix-managed runtimes may write, optional encrypted
secrets, and the [caret](https://github.com/cdprice02/caret) prompt. A tier then
picks features from a registry: `minimal` takes none, and `full` takes every
one, so a new feature joins `full` without a second list to keep in sync. There
are 14 feature modules today, from language toolchains to Kubernetes tools,
with every tool catalogued in the docs. GUI modules layer on top where wanted.

Every switch goes through `nh`, which prints the package and closure-size diff
before anything activates.

```d2
flake: your flake.nix
mk: lib.mkConfigs
profile: mkProfile {
  base: always-on base
  tier: tier features
  gui: GUI modules
}
hm: Home Manager
darwin: nix-darwin
nixos: NixOS
flake -> mk: identity · configs
mk -> profile
profile -> hm
profile -> darwin
profile -> nixos
```

## Evidence

CI checks the flake on all four systems it supports and builds real configs:

| Target                | Checked in CI                      |
| --------------------- | ---------------------------------- |
| Linux, x86_64 and ARM | flake check and Home Manager build |
| NixOS, x86_64 and ARM | flake check and system build       |
| macOS, Apple Silicon  | flake check and nix-darwin build   |
| macOS, Intel          | flake check under Rosetta          |

A separate smoke test runs the documented Linux bootstrap commands in a fresh
Ubuntu container, so the quick start cannot quietly rot.

The limits are stated rather than hidden. NixOS configs are proven to build,
not to boot, since no NixOS hardware is in the CI loop. WSL2 runs the Linux
path and has no runner of its own. Intel Macs are frozen on an older nixpkgs
release (see below).

## Key decisions

- **[Not a flake-parts module](https://github.com/cdprice02/nix-atelier/discussions/74).**
  Libraries like snowfall-lib generate configs from where files sit in your
  tree. `mkConfigs` is one plain, typed function you call explicitly, and it
  ships an opinionated, curated toolset rather than a scaffold with no opinion
  on what you install.
- **[rustup manages Rust toolchains](https://github.com/cdprice02/nix-atelier/blob/main/docs/adr/0001-rustup-manages-rust-toolchains.md).**
  Only rustup honors a project's `rust-toolchain.toml` and keeps stable, beta,
  and nightly side by side. The cost is that toolchains are no longer
  reproducible from this flake; each project's own pin and CI carry that.
- **[Intel Macs are frozen best-effort](https://github.com/cdprice02/nix-atelier/blob/main/docs/adr/0002-x86_64-darwin-is-frozen-best-effort.md).**
  Newer nixpkgs releases have dropped Intel Macs or need a macOS they cannot
  run, so they stay on nixpkgs 25.05 without security fixes. A change that
  would hold the other systems back for them is not made.

## Status and what's next

nix-atelier is maintained, with 16 releases since June 2026; the latest is
[v4.2.1](https://github.com/cdprice02/nix-atelier/releases). Planned work is
tracked in GitHub milestones. Intel Mac support ends in v5.
