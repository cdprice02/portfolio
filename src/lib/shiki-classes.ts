import type { AstroUserConfig } from "astro";

type ShikiTransformer = NonNullable<
  NonNullable<
    NonNullable<AstroUserConfig["markdown"]>["shikiConfig"]
  >["transformers"]
>[number];

// The css-variables theme styles every token with an inline style attribute,
// which the CSP forbids. Each colour becomes a class, and the block's own
// colours and overflow come from global.css.
const TOKEN_COLOR = /color:\s*var\(--astro-code-token-([a-z-]+)\)/;

export const tokenClasses: ShikiTransformer = {
  name: "token-classes",
  pre(node) {
    delete node.properties.style;
    // Astro's own line hook wraps a diff line's +/- marker in a span with an
    // inline style after the span hook has run, so strip it here.
    const strip = (child: (typeof node.children)[number]) => {
      if (child.type !== "element") return;
      delete child.properties.style;
      child.children.forEach(strip);
    };
    node.children.forEach(strip);
  },
  span(node) {
    const style = node.properties.style;
    if (typeof style !== "string") return;
    const token = TOKEN_COLOR.exec(style)?.[1];
    delete node.properties.style;
    if (token) this.addClassToHast(node, `tok-${token}`);
  },
};
