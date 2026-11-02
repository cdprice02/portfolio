import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { parse } from "yaml";
import { fetchProjectData } from "../src/lib/github.ts";

// Rewrites src/data/project-data.json from the live GitHub API for every
// Project that has a page (a non-empty body).
const dir = "src/content/projects";
const snapshot = {};
for (const file of readdirSync(dir)
  .filter((f) => f.endsWith(".md"))
  .sort()) {
  const [, front, body] = readFileSync(`${dir}/${file}`, "utf8").split(
    /^---$/m,
  );
  if (body.trim() === "") continue;
  const { repo } = parse(front);
  const id = file.replace(/\.md$/, "");
  snapshot[id] = await fetchProjectData(new URL(repo).pathname.slice(1));
  console.log(`${id}: ${JSON.stringify(snapshot[id])}`);
}
writeFileSync(
  "src/data/project-data.json",
  JSON.stringify(snapshot, null, 2) + "\n",
);
