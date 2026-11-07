import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";

// The configs hold the assertions; the URLs come from here so every built
// Project page is audited without editing a config.
const origin = "http://localhost:8788";
const paths = [
  "/",
  "/404",
  ...readdirSync("dist/projects", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `/projects/${entry.name}/`),
  // Built only outside production, so audit it when it is there.
  ...(existsSync("dist/style-sample/index.html") ? ["/style-sample/"] : []),
];

for (const config of ["lighthouserc.json", "lighthouserc.dark.json"]) {
  const { status } = spawnSync(
    "pnpm",
    [
      "exec",
      "lhci",
      "autorun",
      `--config=${config}`,
      ...paths.map((path) => `--collect.url=${origin}${path}`),
    ],
    { stdio: "inherit" },
  );
  if (status !== 0) process.exit(status ?? 1);
}
