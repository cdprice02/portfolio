---
date: 2026-10-28
project: nix-atelier
title: v4.4.0 adds tmux home, scratch and ssh sessions
href: https://github.com/cdprice02/nix-atelier/releases/tag/v4.4.0
---

The session picker reaches places that are not a repo, and ssh hosts from
`~/.ssh/config` become sessions. The release also fixes autosave, which had
silently never saved: the config deleted the hook that does the saving, and a
new check now pins the load order.
