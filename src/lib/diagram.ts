import type { SatteriProcessorOptions } from "@astrojs/markdown-satteri";
import { renderMermaidSVG } from "beautiful-mermaid";

type MdastPlugin = NonNullable<SatteriProcessorOptions["mdastPlugins"]>[number];

const escapeHtml = (text: string) =>
  text.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * The renderer styles its output with a `<style>` block (which imports a
 * Google font) and a `style` attribute, and the strict CSP blocks both. The
 * shapes keep their `var(--_*)` colour attributes; `global.css` defines those
 * from the site tokens under `.diagram`, so the SVG follows `data-theme`.
 */
function withoutStyles(svg: string): string {
  const safe = svg
    .replace(/<style>[\s\S]*?<\/style>/, "")
    .replace(/ style="[^"]*"/, "")
    // A blank line would end the raw HTML block in the markdown parser.
    .replace(/>\s+</g, "><");
  if (/<style|\sstyle=|@import|<script|\son\w+=/i.test(safe)) {
    throw new Error("Rendered diagram still carries inline style or script");
  }
  return safe;
}

export function renderDiagram(source: string, alt: string): string {
  // Colours are placeholders: the style block that used them is dropped.
  const svg = withoutStyles(
    renderMermaidSVG(source, { bg: "#ffffff", fg: "#000000" }),
  ).replace("<svg ", '<svg role="img" aria-labelledby="diagram-caption" ');
  return (
    `<figure class="diagram">` +
    `<div class="diagram-scroll" tabindex="0" role="region" aria-labelledby="diagram-caption">${svg}</div>` +
    `<figcaption id="diagram-caption">${escapeHtml(alt)}</figcaption>` +
    `</figure>`
  );
}

/**
 * Replaces the body's one `mermaid` fence with its Diagram. The fence's meta
 * carries the alt text: ```` ```mermaid alt="..." ````.
 */
export const diagram: MdastPlugin = {
  name: "diagram",
  code(node, ctx) {
    if (node.lang !== "mermaid") return;
    const where = ctx.fileURL?.pathname ?? "a Project body";
    const seen = ((ctx.data["diagrams"] as number | undefined) ?? 0) + 1;
    ctx.data["diagrams"] = seen;
    if (seen > 1) {
      throw new Error(`${where}: a Project page has at most one Diagram`);
    }
    const alt = /\balt="([^"]+)"/.exec(node.meta ?? "")?.[1];
    if (alt === undefined) {
      throw new Error(`${where}: the mermaid fence needs alt="..." text`);
    }
    ctx.replaceNode(node, {
      type: "html",
      value: renderDiagram(node.value, alt),
    });
  },
};
