import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";

// The configs hold the assertions; the URLs come from here so every built
// Project page is audited without editing a config.
const origin = "http://localhost:8788";
const paths = [
  "/",
  "/404",
  ...readdirSync("dist/projects").map((slug) => `/projects/${slug}/`),
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
