import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Astro hashes its inline scripts and styles into a per-page <meta> tag. Meta
// CSP cannot carry frame-ancestors and securityheaders.com only reads response
// headers, so the policy is moved into dist/_headers and the tags are removed.
// Cloudflare drops _headers rules longer than 2000 characters per line.
const META = /<meta http-equiv="content-security-policy" content="([^"]*)">/i;
const MAX_HEADER_LINE = 2000;

export const sha256 = (text) =>
  `'sha256-${createHash("sha256").update(text).digest("base64")}'`;

// Astro hashes only the scripts and styles it processes; `is:inline` scripts
// are emitted verbatim and need their hashes added here.
export function inlineCode(html) {
  const found = [];
  const patterns = [
    ["script", /<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/gi],
    ["style", /<style([^>]*)>([\s\S]*?)<\/style>/gi],
  ];
  for (const [kind, pattern] of patterns) {
    for (const [, attrs, body] of html.matchAll(pattern)) {
      // JSON-LD is data, not executed, so CSP does not apply to it.
      if (/type="application\/ld\+json"/.test(attrs)) continue;
      found.push({ kind, body });
    }
  }
  return found;
}

export async function htmlFiles(dir) {
  const entries = await readdir(dir, { recursive: true });
  return entries.filter((f) => f.endsWith(".html")).map((f) => join(dir, f));
}

function parsePolicy(policy, into) {
  for (const part of policy.split(";")) {
    const [name, ...sources] = part.trim().split(/\s+/);
    if (!name) continue;
    const merged = into.get(name) ?? new Set();
    for (const source of sources) merged.add(source);
    into.set(name, merged);
  }
}

export async function moveCspToHeaders(dir) {
  const directives = new Map();
  const pages = [];
  for (const file of await htmlFiles(dir)) {
    const html = await readFile(file, "utf8");
    const match = META.exec(html);
    if (!match) throw new Error(`${file} has no CSP meta tag`);
    parsePolicy(match[1], directives);
    for (const { kind, body } of inlineCode(html)) {
      if (kind === "script") {
        parsePolicy(`script-src ${sha256(body)}`, directives);
      }
    }
    pages.push([file, html.replace(META, "")]);
  }

  const policy = [...directives]
    .map(([name, sources]) => [name, ...sources].join(" "))
    .join("; ");
  const line = `  Content-Security-Policy: ${policy}`;
  if (line.length > MAX_HEADER_LINE) {
    throw new Error(`CSP header is ${line.length} characters; limit is 2000`);
  }

  const headersPath = join(dir, "_headers");
  const headers = await readFile(headersPath, "utf8");
  if (!headers.includes("\n/*\n")) throw new Error("_headers has no /* rule");
  await writeFile(headersPath, headers.replace("\n/*\n", `\n/*\n${line}\n`));
  await Promise.all(pages.map(([file, html]) => writeFile(file, html)));
}

export default function cspHeaders() {
  return {
    name: "csp-headers",
    hooks: {
      "astro:build:done": ({ dir }) => moveCspToHeaders(fileURLToPath(dir)),
    },
  };
}
