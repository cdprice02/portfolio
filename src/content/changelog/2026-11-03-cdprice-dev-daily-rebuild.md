---
date: 2026-11-03
project: cdprice-dev
title: A daily Cron Worker rebuilds the site
href: https://github.com/cdprice02/portfolio/pull/112
---

A separate Cron Worker posts to the deploy hook each day, so live Project data stays within a day of its source while the site Worker serves only static files.
