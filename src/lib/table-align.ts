import type { SatteriProcessorOptions } from "@astrojs/markdown-satteri";

type HastPlugin = NonNullable<SatteriProcessorOptions["hastPlugins"]>[number];

const ALIGN = /^text-align:\s*(left|center|right)\s*;?$/;

/**
 * A table column's alignment is emitted as an inline `style` attribute, which
 * the strict CSP blocks. It becomes `data-align`, which `global.css` styles.
 */
export const tableAlign: HastPlugin = {
  name: "table-align",
  element: {
    filter: ["th", "td"],
    visit(node, ctx) {
      const style = node.properties["style"];
      if (typeof style !== "string") return;
      const align = ALIGN.exec(style.trim())?.[1];
      if (align === undefined) return;
      ctx.setProperty(node, "style", undefined);
      ctx.setProperty(node, "dataAlign", align);
    },
  },
};
