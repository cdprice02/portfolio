// Regenerates the committed brand images: public/og.png, one public/og/<id>.png
// per Project page, public/apple-touch-icon.png, and public/favicon.ico. Run with
// `pnpm brand` after changing a template, the favicon SVG, the headshot, the role,
// or a Project page's title or tagline.
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { parse } from "yaml";

const root = new URL("../../", import.meta.url);
const at = (path) => new URL(path, root);

/** The title and tagline of every Project that has a body, which is a Project page. */
async function projectPages() {
  const dir = at("src/content/projects/");
  const pages = [];
  for (const file of (await readdir(dir)).filter((f) => f.endsWith(".md"))) {
    const [, frontmatter, body] = (
      await readFile(new URL(file, dir), "utf8")
    ).split(/^---$/m);
    if (body.trim() === "") continue;
    const { title, tagline } = parse(frontmatter);
    pages.push({ id: file.replace(/\.md$/, ""), title, tagline });
  }
  return pages;
}

/** An ICO holding a single PNG image, which every current browser accepts. */
function pngToIco(png, size) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(size, 6);
  header.writeUInt8(size, 7);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  return Buffer.concat([header, png]);
}

// The installed Google Chrome, because Playwright's bundled Chromium skips older macOS releases.
const browser = await chromium.launch({ channel: "chrome" });
try {
  const og = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    colorScheme: "light",
  });
  await og.goto(at("scripts/brand/og.html").href, { waitUntil: "networkidle" });
  await og.evaluate(() => document.fonts.ready);
  await og.screenshot({ path: fileURLToPath(at("public/og.png")) });

  await mkdir(at("public/og/"), { recursive: true });
  for (const { id, title, tagline } of await projectPages()) {
    await og.goto(at("scripts/brand/og-project.html").href, {
      waitUntil: "networkidle",
    });
    await og.evaluate(
      ([t, l]) => {
        document.getElementById("title").textContent = t;
        document.getElementById("tagline").textContent = l;
        return document.fonts.ready;
      },
      [title, tagline],
    );
    await og.screenshot({ path: fileURLToPath(at(`public/og/${id}.png`)) });
  }

  const svg = await readFile(at("public/favicon.svg"), "utf8");
  const icon = async (size, background) => {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      colorScheme: "light",
    });
    await page.setContent(
      `<body style="margin:0;background:${background}">` +
        `<img style="display:block;width:${size}px;height:${size}px" ` +
        `src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}">`,
    );
    return page.screenshot({ omitBackground: background === "transparent" });
  };

  // iOS masks the touch icon itself, so it gets a full-bleed tile instead of rounded corners.
  await writeFile(
    at("public/apple-touch-icon.png"),
    await icon(180, "#3b497a"),
  );
  await writeFile(
    at("public/favicon.ico"),
    pngToIco(await icon(32, "transparent"), 32),
  );
} finally {
  await browser.close();
}
