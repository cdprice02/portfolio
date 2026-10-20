import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { htmlFiles, inlineCode, sha256 } from "./csp-headers.mjs";

// Fails when the shipped policy would block an inline script or style that
// the built pages contain.
const dist = process.argv[2] ?? "dist";
const headers = await readFile(join(dist, "_headers"), "utf8");
const policy = /^\s*Content-Security-Policy: (.+)$/m.exec(headers)?.[1];
if (!policy) throw new Error(`${dist}/_headers has no Content-Security-Policy`);
const allowed = (directive) =>
  new Set(
    policy
      .split(";")
      .map((part) => part.trim().split(/\s+/))
      .find(([name]) => name === directive)
      ?.slice(1),
  );
const scriptSrc = allowed("script-src");
const styleSrc = allowed("style-src");

const problems = [];
const pages = await htmlFiles(dist);
for (const page of pages) {
  const html = await readFile(page, "utf8");
  if (/http-equiv="content-security-policy"/i.test(html)) {
    problems.push(`${page}: CSP meta tag left in the page`);
  }
  for (const { kind, body } of inlineCode(html)) {
    const sources = kind === "script" ? scriptSrc : styleSrc;
    if (!sources.has(sha256(body))) {
      problems.push(
        `${page}: inline ${kind} not allowed: ${body.slice(0, 60)}`,
      );
    }
  }
  if (/\sstyle="/.test(html)) problems.push(`${page}: inline style attribute`);
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(
  `CSP covers every inline script and style in ${pages.length} pages`,
);
