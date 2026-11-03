---
date: 2026-09-24
project: turox
title: Late move reductions pass the SPRT gate
href: https://github.com/cdprice02/turox/pull/273
---

Quiet moves that move ordering puts late are searched shallower, and
re-searched at full depth only if the shallow result looks good. The SPRT
accepted it after 294 games at 10+0.1, an estimated 88 Elo (plus or minus 31),
and the effective branching factor fell from 3.84 to 2.77.
