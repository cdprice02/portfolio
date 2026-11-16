# cdprice.dev

Carson Price's personal site: a static [Astro](https://astro.build) build with
Tailwind CSS and React islands, served from Cloudflare.

## Develop

Requires the Node version in `.node-version`. Corepack provides the pnpm
version pinned in `package.json`.

```sh
corepack enable
pnpm install
pnpm dev
```

| Command        | What it does                                   |
| -------------- | ---------------------------------------------- |
| `pnpm dev`     | Dev server at `localhost:4321`                 |
| `pnpm build`   | Static site in `dist/`                         |
| `pnpm preview` | Serve the built `dist/` locally                |
| `pnpm check`   | Type-check with `astro check`                  |
| `pnpm lint`    | ESLint, including accessibility rules          |
| `pnpm format`  | Format with Prettier (`format:check` verifies) |

CI runs `format:check`, `lint`, `check`, and `build` on every pull request.

## Visual regression

`pnpm test:visual` compares a full-page screenshot of every built page, at
360, 768 and 1280px wide in light and dark, against the baselines in
`e2e/visual/__screenshots__`. Build first (`PROJECT_DATA=snapshot pnpm build`).
The baselines are rendered on `ubuntu-latest`, so the visual projects exist
only on Linux and a Mac run of `pnpm test:e2e` skips them.

After an intended visual change, or a Playwright or Chrome bump, run the
"Update visual baselines" workflow on the branch (Actions tab, or
`gh workflow run update-visual-baselines.yml --ref <branch>`). It commits the
new PNGs to that branch; a push by `GITHUB_TOKEN` starts no CI run, so push an
empty commit afterwards. Never commit baselines rendered on a Mac.

## Daily rebuild

Live Project data is fresh because a separate Cron Worker
(`workers/rebuild/`) POSTs a Workers Builds deploy hook at 06:00 UTC each day
([ADR 0002](docs/adr/0002-no-runtime-freshness-by-daily-rebuild.md)). One-time
setup, by the owner:

1. In the Cloudflare dashboard, open the `portfolio` Worker, Settings, Builds,
   and create a deploy hook for the `main` branch.
2. `pnpm exec wrangler secret put DEPLOY_HOOK_URL -c workers/rebuild/wrangler.jsonc`
   and paste the hook URL; it is the credential, so it never enters the repo.
3. `pnpm deploy:rebuild`.

To test locally, put `DEPLOY_HOOK_URL=<a stub URL>` in
`workers/rebuild/.dev.vars`, run
`pnpm exec wrangler dev --test-scheduled -c workers/rebuild/wrangler.jsonc`,
and request `/__scheduled`.

## Decisions

- [`GLOSSARY.md`](GLOSSARY.md): the domain language used across the site and
  its issues.
- [`docs/adr/`](docs/adr/): architecture decision records.
