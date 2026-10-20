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

## Decisions

- [`GLOSSARY.md`](GLOSSARY.md): the domain language used across the site and
  its issues.
- [`docs/adr/`](docs/adr/): architecture decision records.
