import { expect, test, type Page } from "@playwright/test";
import { pagePaths, projectIds } from "../built-paths";

// Runs once per project in playwright.config.ts: reduced motion emulated as
// no-preference ("motion") and as reduce ("instant").
const reduce = (): boolean =>
  test.info().project.use.reducedMotion === "reduce";

const revealSelector = ".reveal, .prose > h2, .prose > .diagram";

// The 404 and short pages cannot scroll, so give every page room to.
async function makeScrollable(page: Page) {
  await page.evaluate(() => {
    document.body.append(
      Object.assign(document.createElement("div"), {
        style: "height: 3000px",
      }),
    );
  });
}

for (const path of pagePaths) {
  test.describe(path, () => {
    test("scroll behavior is smooth only when motion is allowed", async ({
      page,
    }) => {
      await page.goto(path);
      const behavior = await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior,
      );
      expect(behavior).toBe(reduce() ? "auto" : "smooth");
    });

    test("scroll reveal animates only when motion is allowed", async ({
      page,
    }) => {
      await page.goto(path);
      const result = await page.evaluate((selector) => {
        const targets = [...document.querySelectorAll(selector)];
        const animated = targets.filter((element) =>
          element
            .getAnimations()
            .some((animation) => animation.timeline instanceof ViewTimeline),
        );
        return { targets: targets.length, animated: animated.length };
      }, revealSelector);
      if (path === "/" || path.startsWith("/projects/")) {
        expect(result.targets).toBeGreaterThan(0);
      }
      expect(result.animated).toBe(reduce() ? 0 : result.targets);
    });

    test("content stays fully visible", async ({ page }) => {
      await page.goto(path);
      const hidden = await page.evaluate(async (selector) => {
        const failures: string[] = [];
        for (const element of document.querySelectorAll(selector)) {
          element.scrollIntoView({ block: "center", behavior: "instant" });
          await new Promise((resolve) => requestAnimationFrame(resolve));
          await new Promise((resolve) => requestAnimationFrame(resolve));
          const style = getComputedStyle(element);
          if (style.opacity !== "1" || style.visibility !== "visible") {
            failures.push(`${element.tagName}.${element.className}`);
          }
        }
        return failures;
      }, revealSelector);
      expect(hidden).toEqual([]);
    });

    test("back-to-top fades in only when motion is allowed", async ({
      page,
    }) => {
      await page.goto(path);
      await makeScrollable(page);
      const fades = await page.evaluate(async () => {
        const link = document.getElementById("to-top")!;
        window.scrollTo({ top: 600, behavior: "instant" });
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        return {
          hidden: link.hidden,
          fade: link
            .getAnimations()
            .some(
              (animation) =>
                animation instanceof CSSTransition &&
                animation.transitionProperty === "opacity",
            ),
        };
      });
      expect(fades.hidden).toBe(false);
      expect(fades.fade).toBe(!reduce());
    });

    test("scrolling causes no layout shift", async ({ page }) => {
      await page.addInitScript(() => {
        const shifts: number[] = [];
        (window as unknown as { __shifts: number[] }).__shifts = shifts;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & {
              value: number;
              hadRecentInput: boolean;
            };
            if (!shift.hadRecentInput) shifts.push(shift.value);
          }
        }).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto(path, { waitUntil: "networkidle" });
      await makeScrollable(page);
      // Loading shifts belong to Lighthouse; this test is about scrolling.
      await page.evaluate(async () => {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        (window as unknown as { __shifts: number[] }).__shifts.length = 0;
      });
      const shifts = await page.evaluate(async () => {
        const max = document.documentElement.scrollHeight - innerHeight;
        for (let top = 0; top <= max; top += 200) {
          window.scrollTo({ top, behavior: "instant" });
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        window.scrollTo({ top: 0, behavior: "instant" });
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => setTimeout(resolve, 300));
        return (window as unknown as { __shifts: number[] }).__shifts;
      });
      expect(shifts).toEqual([]);
    });
  });
}

test.describe("Project view transition", () => {
  const nameOf = (page: Page, id: string) =>
    page
      .locator(`[data-project="${id}"]`)
      .evaluate((element) => getComputedStyle(element).viewTransitionName);

  // A Project listed only in the also-line has no card, so its page heading
  // is checked alone.
  for (const id of projectIds) {
    test(`${id}: card title and page heading share one name`, async ({
      page,
    }) => {
      await page.goto("/");
      const hasCard =
        (await page.locator(`[data-project="${id}"]`).count()) > 0;
      const card = hasCard ? await nameOf(page, id) : null;
      await page.goto(`/projects/${id}/`);
      const heading = await nameOf(page, id);
      if (reduce()) {
        expect([card ?? "none", heading]).toEqual(["none", "none"]);
      } else {
        expect(heading).not.toBe("none");
        if (hasCard) expect(card).toBe(heading);
      }
    });
  }

  test("navigating from a card starts a view transition only when motion is allowed", async ({
    page,
  }) => {
    const id = projectIds[0];
    await page.addInitScript(() => {
      addEventListener("pageswap", (event) => {
        sessionStorage.setItem(
          "swap",
          String(
            (event as Event & { viewTransition: unknown }).viewTransition !==
              null,
          ),
        );
      });
    });
    await page.goto("/");
    await page.locator(`a[href="/projects/${id}/"]`).first().click();
    await page.waitForURL(`**/projects/${id}/`);
    const swapped = await page.evaluate(() => sessionStorage.getItem("swap"));
    expect(swapped).toBe(String(!reduce()));
  });
});
