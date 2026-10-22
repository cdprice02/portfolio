import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { chromium } from "playwright";

// Loads each page in both themes against the Worker that serves the real
// _headers, and fails on any CSP violation or console error. It also asserts
// that the inline scripts ran, since a blocked script raises no error of its own.
// Installed Chrome, as in Lighthouse CI, so CI needs no browser download.
const port = 8788;
const origin = `http://localhost:${port}`;
// Every built Project page, so a new page is covered without editing this list.
const projectPaths = readdirSync("dist/projects").map(
  (slug) => `/projects/${slug}/`,
);
const paths = ["/", "/404", ...projectPaths];
const nodeFills = new Map();
const themes = ["light", "dark"];

// A leftover server would answer the readiness probe and hide a failed start.
const occupied = await fetch(origin).then(
  () => true,
  () => false,
);
if (occupied) throw new Error(`${origin} is already in use`);

const server = spawn(process.execPath, [process.env.npm_execpath, "serve"], {
  stdio: "ignore",
  detached: true,
});
const stop = () => {
  try {
    process.kill(-server.pid);
  } catch {
    // The server already exited.
  }
};

async function ready() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if ((await fetch(origin)).ok) return;
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`${origin} did not start`);
}

const problems = [];
let browser;
try {
  await ready();
  browser = await chromium.launch({ channel: "chrome" });
  for (const colorScheme of themes) {
    for (const path of paths) {
      const label = `${path} (${colorScheme})`;
      const context = await browser.newContext({
        colorScheme,
        viewport: { width: 375, height: 667 },
      });
      const page = await context.newPage();
      await page.addInitScript(() => {
        window.__violations = [];
        document.addEventListener("securitypolicyviolation", (event) => {
          window.__violations.push(
            `${event.violatedDirective}: ${event.blockedURI || "inline"}`,
          );
        });
      });
      page.on("console", (message) => {
        if (message.type() === "error") {
          problems.push(`${label}: console error: ${message.text()}`);
        }
      });
      page.on("pageerror", (error) => {
        problems.push(`${label}: page error: ${error.message}`);
      });

      await page.goto(origin + path, { waitUntil: "networkidle" });
      const theme = await page.evaluate(
        () => document.documentElement.dataset.theme,
      );
      if (theme !== colorScheme) {
        problems.push(`${label}: theme script left data-theme=${theme}`);
      }
      await page
        .waitForSelector("astro-island:not([ssr])", { timeout: 5000 })
        .catch(() => {
          problems.push(`${label}: ThemeToggle island did not hydrate`);
        });
      // The 404 page is shorter than the scroll threshold, so make it scrollable.
      await page.evaluate(() => {
        document.body.append(
          Object.assign(document.createElement("div"), {
            style: "height: 2000px",
          }),
        );
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page
        .waitForFunction(
          () => !document.getElementById("to-top").hidden,
          null,
          {
            timeout: 5000,
          },
        )
        .catch(() => {
          problems.push(`${label}: back-to-top script did not run`);
        });
      if (projectPaths.includes(path)) {
        // The renderer's own colours are stripped, so an unstyled node would
        // fall back to the SVG default (black) and pass every other check.
        const fill = await page
          .locator(".diagram g.node rect")
          .first()
          .evaluate((rect) => getComputedStyle(rect).fill)
          .catch(() => null);
        if (fill === null || fill === "none" || fill === "rgb(0, 0, 0)") {
          problems.push(`${label}: diagram node fill is ${fill}`);
        }
        const other = nodeFills.get(path);
        if (other === undefined) nodeFills.set(path, fill);
        else if (other === fill) {
          problems.push(`${label}: diagram does not change with the theme`);
        }
      }
      const violations = await page.evaluate(() => window.__violations);
      for (const violation of violations) {
        problems.push(`${label}: CSP violation: ${violation}`);
      }
      await context.close();
    }
  }
} finally {
  await browser?.close();
  stop();
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(
  `No CSP violations: ${paths.length} pages x ${themes.length} themes`,
);
