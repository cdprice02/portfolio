---
date: 2026-10-18
project: nix-atelier
title: v4.0.0 moves Rust toolchains into rustup
href: https://github.com/cdprice02/nix-atelier/releases/tag/v4.0.0
---

A project's `rust-toolchain.toml` used to be ignored, and a machine could hold
only one floating nightly. Now rustup owns the toolchains, so a project pinned
to a nightly builds on exactly that one. The cost is that toolchains are no
longer reproducible from the flake alone.
