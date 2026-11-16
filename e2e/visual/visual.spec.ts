import { expect, test } from "@playwright/test";
import { pagePaths } from "../built-paths";

// Runs once per visual-<width>-<scheme> project in playwright.config.ts.
// Baselines live under e2e/visual/__screenshots__/<project>/ and are rendered
// by the "Update visual baselines" workflow on Linux, never on a Mac.
const slug = (path: string): string =>
  path === "/"
    ? "landing"
    : path.replaceAll("/", " ").trim().replace(/ /g, "-");

for (const path of pagePaths) {
  test(`looks unchanged: ${path}`, async ({ page }) => {
    await page.goto(path);
    // Fonts are bundled at build time, but a capture before they decode
    // would shift text.
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${slug(path)}.png`, {
      fullPage: true,
      // The footer year is baked in at build time, so it would fail every
      // baseline on 1 January.
      mask: [page.getByText(/^© \d{4} /)],
    });
  });
}
