# Diagrams are Mermaid, rendered at build to inline SVG coloured by site tokens

A Project page's Diagram is a `mermaid` fence in the body, rendered at build by
`beautiful-mermaid` (pure TypeScript, about 2 MB, no browser) and inlined as
SVG. The renderer's `<style>` block and `style` attribute are stripped because
the strict CSP blocks them; `global.css` defines the colour variables its shapes
use from the site tokens, so the Diagram follows `data-theme` with no client JS.
This replaces the D2 choice in #57. A spike on the colony diagram gave D2 a
layout with edges through group titles, small text at its width, and about 60 MB
of WASM per build; Mermaid gave a clean layout at a phone-sized width.

## Considered Options

- **D2 via `astro-d2`:** emits `<img>` SVGs that cannot read `data-theme`, so
  light and dark would be two files swapped by CSS, in D2's own palette rather
  than the site's.
- **D2 rendered inline and recoloured:** workable, but keeps the 60 MB WASM
  dependency and the weaker layout.
- **`rehype-mermaid` or client-side Mermaid:** one needs Playwright at build,
  the other ships JS and inline styles the CSP blocks.
- **Graphviz WASM:** plain SVG attributes make recolouring easy, but the layout
  is plainer and the syntax is not one readers know.

## Consequences

- The renderer's output shape (its `var(--_*)` attributes) is a contract:
  `renderDiagram` fails the build if a `<style>`, `style=`, `@import`, or script
  survives, and `check:csp:runtime` fails if a node has no theme-dependent fill.
- Mermaid has no nested containers beyond subgraphs; a much richer Diagram may
  need another tool, which reopens this ADR.
- A Project page has at most one Diagram, and its fence needs `alt="..."`; both
  fail the build otherwise.
