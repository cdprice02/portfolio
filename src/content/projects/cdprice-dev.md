---
title: cdprice.dev
tagline: This site, static Astro on Cloudflare, rebuilt daily and gated on Lighthouse and a strict CSP.
summary: "The site you are reading: Astro compiled to static files and served as Cloudflare Workers static assets, with no runtime of its own. A separate Cron Worker triggers a rebuild each day to refresh live Project data. Every deploy must pass Lighthouse in both themes, a hash-based Content Security Policy check, and link checks."
repo: https://github.com/cdprice02/portfolio
links:
  - label: llms.txt
    href: https://cdprice.dev/llms.txt
figures:
  - value: 95/100/100/100
    label: Lighthouse floor, in both themes
    section: evidence
  - value: Daily
    label: rebuild, so live data is at most a day old
    section: how-it-works
  - value: Strict
    label: hash-based CSP, checked on every deploy
    section: evidence
updated: 2026-11-14
tags: [TypeScript, Astro, Cloudflare, CSP]
status: active
featured: also
order: 1
---

## Why it exists

The site is a marketing page for one person that has to be quick to read,
cheap to run, and hard to break. It is also a small system I can hold to the
same standard as the rest of my work: decisions written down, checks that fail
the build, and nothing running that does not need to.

Most of the design is subtraction. There is no server to patch, no database,
and almost no client JavaScript, so there is little that can go wrong between
a push and a reader.

## How it works

Astro compiles the content, a few React islands, and Tailwind styles into plain
static files. Cloudflare serves them as Workers static assets, with no fetch
handler and no adapter ([ADR 0001](https://github.com/cdprice02/portfolio/blob/main/docs/adr/0001-astro-react-tailwind-static.md)).

The data that changes, such as the last commit, the latest release, and a
chess rating, reaches the site through a rebuild rather than a runtime. A
separate Cron Worker posts to a Workers Builds deploy hook once a day. The
build fetches GitHub and Lichess, and falls back to a committed snapshot if a
fetch fails, so an outage upstream never fails a deploy
([ADR 0002](https://github.com/cdprice02/portfolio/blob/main/docs/adr/0002-no-runtime-freshness-by-daily-rebuild.md)).

Agents get the same content as files generated at build: `llms.txt`,
`llms-full.txt`, a Markdown twin beside every Project page, and a
`Content-Signal` policy in `robots.txt`. DNSSEC signs the domain.

```mermaid alt="A push to GitHub triggers a Workers Builds build, whose output is served as Workers static assets to readers and agents. Each day a Cron Worker posts to the deploy hook, which starts the same build; the build fetches GitHub and Lichess data, falling back to a committed snapshot."
graph TD
  push[push to main] --> build[Workers Builds]
  cron[Cron Worker, daily] -->|deploy hook| build
  gh[GitHub and Lichess] -->|live data, else snapshot| build
  build -->|static files| assets[Workers static assets]
  assets --> readers[readers]
  assets --> agents[agents: llms.txt, Markdown twins]
```

## Evidence

Every deploy must pass these, and the build fails otherwise:

- **Lighthouse CI** audits the built site in both the light and dark themes. The
  floor is 95 for performance and 100 for accessibility, best practices, and
  SEO.
- **A hash-based Content Security Policy.** One check confirms every inline
  script and style the build emits is covered by a hash in the policy, and a
  second loads the pages in a browser and confirms nothing is blocked.
- **Link checks.** Internal links are checked offline on every build; external
  links are checked weekly, and a failure opens an issue.
- **Formatting, lint, and type checks** run first, so style never reaches review.

## Key decisions

Both decisions are recorded as ADRs in the repository, and the
[v1](https://github.com/cdprice02/portfolio/issues/6) and
[v2](https://github.com/cdprice02/portfolio/issues/53) maps hold the rest of
the reasoning.

- **[Astro, React, and Tailwind as a static site](https://github.com/cdprice02/portfolio/blob/main/docs/adr/0001-astro-react-tailwind-static.md).**
  Astro won on typed content collections and zero client JavaScript by default.
  The cost is that Cloudflare owns both the generator and the host; the output
  is plain files, so moving hosts is a copy.
- **[No runtime: freshness by daily rebuild](https://github.com/cdprice02/portfolio/blob/main/docs/adr/0002-no-runtime-freshness-by-daily-rebuild.md).**
  Headers such as the CSP do not apply to Worker-generated responses, and
  on-demand routes spend a free-plan budget on data that changes at most daily.
  The cost is data up to a day old, shown with its "as of" date.
- **[Diagrams are Mermaid, rendered at build](https://github.com/cdprice02/portfolio/blob/main/docs/adr/0003-diagrams-rendered-by-beautiful-mermaid-inline.md).**
  The one diagram above is inline SVG that follows the theme with no client
  JavaScript, after a spike showed D2's layout and build cost were worse.

## Status and what's next

The site is live and rebuilds daily. Posts will arrive once there are three
worth publishing. Browser-driven tests for motion and visual regression tests
for every page are not in place yet, so those parts rely on Lighthouse and the
CSP checks alone.
