import { readdirSync, readFileSync } from "node:fs";

// Each built Project page must have its committed Social preview at
// public/og/<id>.png, 1200x630. It does not detect stale text: rerun
// `pnpm brand` after changing a title or tagline.
const problems = [];
for (const slug of readdirSync("dist/projects")) {
  const file = `public/og/${slug}.png`;
  let png;
  try {
    png = readFileSync(file);
  } catch {
    problems.push(`${slug}: missing ${file} (run pnpm brand)`);
    continue;
  }
  // The IHDR chunk holds width and height at bytes 16 and 20.
  const [width, height] = [png.readUInt32BE(16), png.readUInt32BE(20)];
  if (width !== 1200 || height !== 630) {
    problems.push(`${slug}: ${file} is ${width}x${height}, not 1200x630`);
  }
}
if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("Every Project page has a 1200x630 Social preview");
