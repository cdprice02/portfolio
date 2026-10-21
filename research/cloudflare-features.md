# Cloudflare developer-platform features vs this site (issue #54)

Researched 2026-10-20 from developers.cloudflare.com (fetched pages, summarized by a fetch tool, so figures are as the docs stated them that day). This records evidence and trade-offs; it does not pick. Builds on `research/cloudflare-hosting.md` (issue #8): Workers static assets, free plan, domain on Cloudflare DNS, Web Analytics and Email Routing already known.

## Short answer

The site's data is small, static, and public: a Profile, a handful of Projects, a Public resume, possibly Posts and Changelog entries. Nearly every storage, queue, and state feature has no job to do on that data, because the build already bakes it into static assets (which are free and unlimited). Features that fit are the ones that act on traffic or on the delivery of the existing content: Web Analytics (already planned), the analytics read-back, Cron Triggers plus a sync (for GitHub data), and AI Crawl Control visibility. Visitor-facing AI and agent surfaces (AI Search, remote MCP, NLWeb) are technically cheap on the free plan but have thin evidence of value for this content; that is for the AI ticket to decide. Two things in the brief's list are not available on the Free plan at all: Markdown for Agents (Pro and up) and pay-per-crawl (closed beta).

Surprising findings that may affect other tickets:

- Workers free CPU limit is 10 ms per request; any on-demand route doing real work (SSR with a query, an AI call) must fit that or the site moves to Workers Paid. Time spent awaiting a subrequest is not CPU time, but rendering is.
- An on-demand or `run_worker_first` route counts against the 100,000 requests/day free cap, and past it those routes return 429 rather than falling back to static assets. Static assets stay free and unlimited.
- AI Search (formerly AutoRAG) bills from 2026-11-01; the free allowance is 1,000 semantic queries per month, a hard ceiling for any public "ask my site" box.
- AI Gateway accounts created on or after 2026-09-24 use Workers Logs rather than legacy gateway logs.
- Workers Logs moves to Cloudflare Observability pricing on 2026-12-01; free-plan terms after that were not verified. `wrangler.jsonc` already enables logs and traces, but static asset hits do not invoke the Worker, so there is little to log today.
- Email Sending (outbound) is Beta and needs Workers Paid to reach arbitrary recipients; Free can send only to verified destination addresses.
- The existing `Content-Signal` line in `public/robots.txt` and the generated `llms.txt` already cover most of what AI Crawl Control's policy side would do; its remaining value is visibility (which crawlers visit).
- The Astro Cloudflare adapter auto-adds a `SESSION` KV binding unless `session: false` is set, so adopting on-demand rendering silently introduces KV.

## Table

Plan limits are Workers Free unless noted. "Paid tip" is what pushes you to Workers Paid ($5/month base) or another paid plan.

| Feature | What it does | Free limits / paid tip | Fit for this site's data |
| --- | --- | --- | --- |
| D1 | Serverless SQLite | 5M rows read/day, 100k written/day, 5 GB. Paid: much higher, metered | Misfit: Profile and Projects live in content files; no writes. Fits only if a feature needs visitor-written rows (guestbook, reactions), which no ticket proposes. |
| KV | Eventually consistent key-value | 100k reads/day, 1k writes/day, 1 GB. Paid at 10M reads/month | Misfit for content. See the adapter `SESSION` note above. |
| R2 | Object storage, no egress fee | 10 GB-month, 1M Class A, 10M Class B per month | Marginal: Public resume PDF and images already ship as static assets. Fits only for large media or a build cache; no evidence of need. |
| Durable Objects | Stateful single-instance compute | Free plan: SQLite-backed only; 100k requests/day, 13k GB-s/day | Misfit: nothing on the site is stateful. Needed only for the legacy `McpAgent` MCP path or live counters. |
| Queues | Async message queue | 10,000 ops/day, 24 h retention | Misfit: no async workload. |
| Cron Triggers | Scheduled Worker invocations | 5 per account; 10 ms CPU per run. Paid: 30 s or 15 min | Plausible: scheduled GitHub sync or rebuild hook for Project data. Needs a `scheduled()` handler, hence a Worker `main` script (docs did not say whether static-assets-only Workers can have crons). 10 ms CPU is tight beyond a fetch and a write. |
| Workers AI | Hosted inference | 10,000 Neurons/day free on both plans; Paid $0.011 per 1,000 Neurons. Some larger models need Paid or prepaid credits | Only as the engine for a visitor-facing feature (see AI Search, MCP). Nothing in the site's data needs inference at request time. |
| AI Gateway | Proxy, cache, rate-limit, log AI calls | Core features free on all plans; legacy logs capped at 100k total on Free | Fits only if the site makes AI calls from a public endpoint (rate limiting and spend control are the value). Otherwise irrelevant. |
| Vectorize | Vector database | 30M queried and 5M stored dimensions per month free | Misfit standalone: a few pages of corpus fit in a prompt. AI Search covers the managed case. |
| AI Search (AutoRAG) | Managed index and natural-language query over a site or bucket; built-in MCP endpoint | 100 instances, 1,000 semantic and 1,000 full-text queries/month, 500 crawl pages/day; billing begins 2026-11-01; paid $0.75 per 1,000 semantic queries | Plausible for search over Posts if Posts exist. Weak for a Landing page plus a handful of Projects (the whole corpus is shorter than most prompts). 1,000 queries/month is a hard ceiling, so abuse protection (Turnstile or rate limit) would be needed. |
| Agents SDK | Framework for stateful agents on Durable Objects | Bounded by Workers plan; limits page lists no separate pricing | Misfit: no agent task exists for this site. |
| Remote MCP server | Expose tools to AI clients over Streamable HTTP | Runs as a Worker; the stateless `createMcpHandler` path avoids Durable Objects; `McpAgent` (DO-based) is labelled deprecated in the guide | Plausible and cheap: read-only tools over the same Profile and Project data that `llms.txt` already serves (get_profile, list_projects). Value is for engineers using MCP clients. Personal-site precedents exist (davidloor.com standalone Worker with a lead-capture tool, a Duyet profile server, an EmDash/Astro portfolio with 46 tools), unvetted. Needs an on-demand route or a second Worker. |
| Browser Rendering | Headless Chrome via Workers | 10 minutes/day, 3 concurrent browsers; Paid 10 h/month included | Misfit at runtime. Build-time use (Project screenshots, resume PDF) can be done in CI for free. |
| Images / transformations | Resize, format-convert, optimize | 5,000 unique transformations/month free; storing images in Images needs Paid | Marginal: Astro's build-time `compile` image service already optimizes a few images. The runtime binding only matters for on-demand pages. |
| Turnstile | Free CAPTCHA alternative | 20 widgets, unlimited verifications, 7-day analytics | Fits only if a form or public AI endpoint exists. No form today (email is a mailto). |
| Email Routing / Email Workers | Forward `@cdprice.dev` mail; `email()` handler for custom logic | Routing free (per #8); handler is a normal Worker | Routing: evaluated in #8 (inbound forwarding for the Public resume's contact address). Email Workers: misfit unless filtering or auto-reply is wanted. |
| Email Sending | Outbound mail from Workers | Beta; arbitrary recipients need Paid; Free: verified destinations only | Out of scope per the map except a contact form notifying the owner; free verified-destination sending is the only plausible path (not verified in detail). |
| Zaraz | Server-side third-party tag manager | 1M events/month free, then disabled (or $5 per extra 1M) | Misfit: no third-party tools; strict CSP and little-JS goals favor none. |
| Web Analytics | Cookieless, free page-view and Core Web Vitals analytics | Free; 10-site soft limit; unsampled data 7 days, then aggregated; dashboard 6 months. URL-level HTTP traffic breakdowns are Pro and up | Fit: planned in v1; matches the data (visits to the Landing page, Projects). Auto-injection vs manual snippet on Workers static assets still unverified (see #8). CSP must allow the beacon origins. |
| GraphQL Analytics API | Query analytics programmatically | Single endpoint with an API token; the Web Analytics FAQ confirms it is queryable | Plausible for the parked "reading analytics back" item (a private view for the owner or a build-time stat). Dataset names and token scope not verified; needs a follow-up read if that ticket proceeds. |
| AI Crawl Control | See which AI crawlers visit; allow or block per crawler; robots.txt compliance | Listed as available on all plans, zero config | Plausible: visibility only, no code, no runtime cost; aligns with the existing `Content-Signal` stance (search, ai-input, ai-train all yes). |
| Pay per crawl | Charge AI crawlers per request | Closed beta (signup or Enterprise) | Misfit: not generally available, and the content is deliberately open. |
| Markdown for Agents | Convert HTML to Markdown on `Accept: text/markdown` | Pro, Business, Enterprise (and SSL for SaaS); not Free. 6 MiB HTML limit | Misfit on Free. The site can already emit `llms.txt` from the same data for no cost; a static `.md` per page is the free equivalent if wanted. |
| NLWeb | Microsoft protocol for natural-language site queries (`/ask` plus MCP); Cloudflare published a recipe with AutoRAG and a Worker | Inherits AI Search and Workers AI limits | Misfit for the data size; announced Aug 2025 as a recipe. No personal-site example found. |
| Workers Logs / observability | Persisted logs and traces for Worker invocations | Free: 200k events/day, 3-day retention; Paid 20M/month, 7 days; pricing moves to Observability on 2026-12-01 | Fits only once an on-demand route exists; already enabled in `wrangler.jsonc`. |
| Workers static assets | The current hosting | Static requests free and unlimited; Worker-invoking requests billed | Already adopted; the baseline everything above is judged against. |

## Shortlist of plausible fits (evidence, not a pick)

1. **Web Analytics.** Already planned; free; cookieless; fits the existing constraints. Open items: auto-injection vs manual snippet on Workers static assets, and the CSP allowance for the beacon.
2. **GraphQL Analytics API read-back.** For the owner only; depends on the analytics read-back ticket and on confirming the Web Analytics dataset and token scope.
3. **Cron Triggers (with a Worker `main`).** A way to refresh GitHub data on Project pages without a rebuild. The competing option is a build-time pull in CI, which needs no runtime at all. 10 ms CPU is the constraint.
4. **Remote MCP server (stateless).** Cheapest agent-facing surface: read-only tools over the Profile and Projects, matching `llms.txt`. Precedents exist but are few and low-signal. Needs one on-demand route or a second Worker, which ties into the ADR 0001 on-demand question.
5. **AI Search.** Only with Posts: search over written content has real utility once there is a body of writing; without Posts the corpus is too small. The free quota (1,000 queries/month) plus Turnstile would be the guardrail.
6. **AI Crawl Control (visibility only).** Zero code, all plans; the one AI-adjacent feature that serves the owner's stated crawl policy.
7. **Turnstile and Email Routing.** Conditional: only if another ticket adds a contact form (Turnstile) or an `@cdprice.dev` address (Email Routing, per #8).

Not shortlisted because they fail the standing rule on this data: D1, KV, R2, Durable Objects, Queues, Vectorize, Agents SDK, Browser Rendering, Zaraz, Images transformations (build-time Astro images suffice), Workers AI and AI Gateway without a runtime AI feature, Markdown for Agents (needs Pro), pay-per-crawl (closed beta), NLWeb.

## Not verified

- Whether Cron Triggers work on a static-assets Worker with no `main` script.
- Whether Web Analytics auto-injection applies to Workers static assets on a custom domain (carried from #8).
- GraphQL dataset names, token permissions, and retention for Web Analytics.
- Workers Logs free-plan terms after 2026-12-01.
- Whether `createMcpHandler` runs on the Free plan without Durable Objects (the guide calls it stateless; no code or pricing read).
- The zone's current plan is assumed Free; Markdown for Agents and URL-level analytics depend on that.
- Personal-site examples came from one web search each and are unvetted listings, not confirmed live sites.

## Sources

- Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Static assets billing: https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
- D1: https://developers.cloudflare.com/d1/platform/pricing/
- KV: https://developers.cloudflare.com/kv/platform/pricing/
- R2: https://developers.cloudflare.com/r2/pricing/
- Durable Objects: https://developers.cloudflare.com/durable-objects/platform/pricing/
- Queues: https://developers.cloudflare.com/queues/platform/pricing/
- Cron Triggers: https://developers.cloudflare.com/workers/configuration/cron-triggers/
- Workers AI: https://developers.cloudflare.com/workers-ai/platform/pricing/
- AI Gateway: https://developers.cloudflare.com/ai-gateway/reference/pricing/
- Vectorize: https://developers.cloudflare.com/vectorize/platform/pricing/
- AI Search: https://developers.cloudflare.com/ai-search/ and https://developers.cloudflare.com/ai-search/platform/limits-pricing/
- Agents limits: https://developers.cloudflare.com/agents/platform/limits/
- Remote MCP: https://developers.cloudflare.com/agents/model-context-protocol/ and https://developers.cloudflare.com/agents/guides/remote-mcp-server/
- Browser Rendering: https://developers.cloudflare.com/browser-rendering/platform/pricing/
- Images: https://developers.cloudflare.com/images/pricing/ and https://developers.cloudflare.com/images/transform-images/
- Turnstile: https://developers.cloudflare.com/turnstile/plans/
- Email Workers: https://developers.cloudflare.com/email-routing/email-workers/
- Email Service: https://developers.cloudflare.com/email-service/
- Zaraz: https://developers.cloudflare.com/zaraz/pricing-info/
- Web Analytics: https://developers.cloudflare.com/web-analytics/faq/ and https://developers.cloudflare.com/web-analytics/get-started/
- GraphQL Analytics API: https://developers.cloudflare.com/analytics/graphql-api/
- AI Crawl Control: https://developers.cloudflare.com/ai-crawl-control/
- Pay per crawl: https://developers.cloudflare.com/ai-crawl-control/features/pay-per-crawl/what-is-pay-per-crawl/
- Markdown for Agents: https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/
- Workers Logs: https://developers.cloudflare.com/workers/observability/logs/workers-logs/
- Astro Cloudflare adapter: https://docs.astro.build/en/guides/integrations-guide/cloudflare/
- NLWeb with AutoRAG (AI Week 2025): https://cloudflare.tv/shows/ai-week/make-your-website-conversational-for-people-and-agents-with-nlweb-and-autorag/xvmElLvm
- Personal-site MCP examples: https://davidloor.com/en/blog/how-to-turn-a-website-into-an-mcp-server and https://mcpmarket.com/server/modern-emdash-portfolio
