import { defineConfig, type Project } from "@playwright/test";

const port = 8788;

// Specs run against the built site, so run `pnpm build` first.
//
// Chrome is the installed stable channel, as in Lighthouse CI and the CSP
// runtime check, so CI needs no browser download. The motion specs rely on
// scroll-driven animations (Chrome 115), @starting-style and allow-discrete
// transitions (117), the pageswap event (124) and @view-transition (126).
//
// A spec set is one directory under e2e/ plus the projects that run it.
//
// The visual set compares full-page screenshots against baselines rendered on
// ubuntu-latest, so its projects exist only on Linux: Mac font rendering would
// fail every comparison. Regenerate baselines with the "Update visual
// baselines" workflow.
const widths = [360, 768, 1280];
const schemes = ["light", "dark"] as const;
const visualProjects: Project[] =
  process.platform === "linux"
    ? widths.flatMap((width) =>
        schemes.map((colorScheme) => ({
          name: `visual-${width}-${colorScheme}`,
          testDir: "e2e/visual",
          use: {
            viewport: { width, height: 800 },
            colorScheme,
            // Settles scroll reveal and view transitions before capture.
            reducedMotion: "reduce" as const,
          },
        })),
      )
    : [];

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    channel: "chrome",
    viewport: { width: 1280, height: 800 },
  },
  // No {platform} or {projectName}-suffix noise: one baseline per project and
  // page, identical on every runner.
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}{ext}",
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.001 } },
  webServer: {
    command: "pnpm serve",
    url: `http://localhost:${port}`,
    // A leftover server would answer the readiness probe and hide a failed
    // start, so an occupied port fails the run.
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [
    ...["no-preference", "reduce"].map((reducedMotion) => ({
      name: `motion-${reducedMotion}`,
      testDir: "e2e/motion",
      use: { reducedMotion: reducedMotion as "no-preference" | "reduce" },
    })),
    ...visualProjects,
  ],
});
