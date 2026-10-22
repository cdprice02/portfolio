import type { SatteriProcessorOptions } from "@astrojs/markdown-satteri";

type MdastPlugin = NonNullable<SatteriProcessorOptions["mdastPlugins"]>[number];

/** Drops D2 fences so they never render as raw code before diagrams ship. */
export const stripD2: MdastPlugin = {
  name: "strip-d2",
  code(node, ctx) {
    if (node.lang === "d2") ctx.removeNode(node);
  },
};
