# No runtime on the site Worker: freshness by daily rebuild

The site Worker serves only static assets, with no fetch handler and no
adapter. Live Project data (last commit, latest release, turox's Lichess
rating) reaches the site through a rebuild: a separate Cron Worker POSTs a
Workers Builds deploy hook once a day, and the build fetches GitHub and Lichess,
falling back to a committed snapshot when a fetch fails. Static was chosen
because `_headers` (HSTS, CSP) does not apply to Worker-generated responses, the
`@astrojs/cloudflare` adapter splits `dist/` and breaks the CSP build check, and
on-demand routes share the Free plan's 100k requests a day and 10 ms CPU cap.
The files for agents (`llms.txt`, `llms-full.txt`, Markdown twins) are
generated at build for the same reason.

## Considered Options

- **On-demand routes via the adapter, a separate Worker, or
  `run_worker_first`:** each needs header and CSP parity for dynamic responses
  and a lower `compatibility_date`, for data that changes at most daily.
- **Client-side fetches from GitHub and Lichess:** widen the CSP `connect-src`,
  add client JS, and put third-party rate limits on every page view.
- **A remote MCP server or an "ask about Carson" chat:** serve the same data as
  the static agent files, with runtime upkeep and, for a chat, the risk of
  misstating the owner's experience to a hiring manager.

## Consequences

- Live data is up to a day old, and pages show the fetched "as of" date.
- An outage at GitHub or Lichess never fails a deploy; the snapshot is shown
  instead, so it must stay committed and refreshable by hand.
- The daily rebuild costs about 60 builds a month against the free 3,000 build
  minutes.
- A future runtime feature reopens this ADR; response-header Transform Rules
  are the likely fix for header parity, untested against Workers responses.
