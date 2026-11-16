import { existsSync, readdirSync } from "node:fs";

// Derived from dist/ so a new Project page is covered without editing a list.
export const projectIds = readdirSync("dist/projects", {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

export const pagePaths = [
  "/",
  "/404",
  ...projectIds.map((id) => `/projects/${id}/`),
  // Built only outside production, so it is covered when it is there.
  ...(existsSync("dist/style-sample/index.html") ? ["/style-sample/"] : []),
];
