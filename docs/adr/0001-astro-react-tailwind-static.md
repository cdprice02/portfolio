# Astro, React, and Tailwind as a static site on Cloudflare

The site is built with Astro (static output, no adapter) and served as
Cloudflare Workers static assets, with Tailwind v4 for styling and React islands
for interactivity, replacing an earlier Deno Fresh scaffold and a planned Lume
site. Astro won on typed content collections (Zod-validated frontmatter for
Projects now, Posts and Changelog entries later), first-party Cloudflare fit,
and zero client JS by default; React was chosen over Preact for its ecosystem
(charts and visualizations on future Project pages) at the cost of a heavier
island runtime.

## Considered Options

- **Lume (Deno):** healthy, but a single-maintainer project with no typed
  frontmatter. Deno itself was judged sound, so this was not a "Deno is dying"
  call.
- **Hugo, Zola:** mature single binaries with strong built-ins, but no
  frontmatter validation.
- **Eleventy:** in an ownership and naming transition, v4 long in alpha.

## Consequences

- Cloudflare owns Astro and also hosts the site. Accepted because Astro is MIT
  licensed and the output is plain static files: changing hosts is a file copy,
  and changing generators means porting templates while the markdown content
  stays.
- Astro majors move fast, so upgrades are a recurring cost.
- Server rendering, if ever needed, is an additive change
  (`@astrojs/cloudflare`), not a rewrite.
