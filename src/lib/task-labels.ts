import type { SatteriProcessorOptions } from "@astrojs/markdown-satteri";

type HastPlugin = NonNullable<SatteriProcessorOptions["hastPlugins"]>[number];

/**
 * A task list item renders a bare disabled checkbox, which fails the
 * accessibility audit for lacking a label. The state is the label.
 */
export const taskLabels: HastPlugin = {
  name: "task-labels",
  element: {
    filter: ["input"],
    visit(node, ctx) {
      if (node.properties["type"] !== "checkbox") return;
      const checked = node.properties["checked"];
      const done = checked !== undefined && checked !== false;
      ctx.setProperty(node, "ariaLabel", done ? "Done" : "Not done");
    },
  },
};
