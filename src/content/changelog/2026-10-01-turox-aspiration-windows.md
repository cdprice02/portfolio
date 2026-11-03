---
date: 2026-10-01
project: turox
title: Aspiration windows cut search nodes by 3.2%
href: https://github.com/cdprice02/turox/pull/293
---

From depth 5, each iteration searches a narrow window around the previous
score and reopens it if the result escapes. Over the tree-shape suite that
took 3.2% fewer nodes at depth 9. The change landed as four commits, the
first of them provably move-identical.
