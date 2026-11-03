import type { CollectionEntry } from "astro:content";
import type { ChangelogEntry } from "./changelog.ts";
import { getChangelog } from "./changelog.ts";
import type { getProfile } from "./profile.ts";
import {
  getAlso,
  getCards,
  getPages,
  isoDate,
  type ProjectPage,
} from "./projects.ts";

type Project = CollectionEntry<"projects">;
type Profile = Awaited<ReturnType<typeof getProfile>>;

export const pagePath = (id: string) => `/projects/${id}/`;
export const twinPath = (id: string) => `/projects/${id}.md`;

const absolute = (site: URL, path: string) => new URL(path, site).href;

const FENCE = /^\s*(`{3,}|~{3,})/;

/**
 * Calls `visit` with each line and whether it sits outside a code fence. A
 * fence closes on the same character at least as long as its opener.
 */
function mapLines(
  markdown: string,
  visit: (line: string, outside: boolean) => string,
): string {
  let open: string | undefined;
  return markdown
    .split("\n")
    .map((line) => {
      const marker = FENCE.exec(line)?.[1];
      if (open === undefined) {
        if (marker !== undefined) {
          open = marker;
          return visit(line, false);
        }
        return visit(line, true);
      }
      if (
        marker !== undefined &&
        marker[0] === open[0] &&
        marker.length >= open.length
      ) {
        open = undefined;
      }
      return visit(line, false);
    })
    .join("\n");
}

/** Pushes every heading one level down; `######` stays, as no h7 exists. */
export function demoteHeadings(markdown: string): string {
  return mapLines(markdown, (line, outside) =>
    outside ? line.replace(/^(#{1,5})(?=\s)/, "$1#") : line,
  );
}

/**
 * A twin at `/projects/<slug>.md` and `llms-full.txt` at the root resolve a
 * relative link differently, so any link that is not absolute fails the build.
 */
function assertAbsoluteLinks(source: string, markdown: string): void {
  const prose: string[] = [];
  mapLines(markdown, (line, outside) => {
    if (outside) prose.push(line);
    return line;
  });
  const text = prose.join("\n");
  const targets = [
    ...[...text.matchAll(/\]\(\s*<?([^)\s>]+)/g)].map((match) => match[1]),
    ...[...text.matchAll(/^\s*\[[^\]]+\]:\s*<?(\S+)/gm)].map(
      (match) => match[1],
    ),
  ];
  const relative = targets.filter(
    (target) => !/^(https?:\/\/|mailto:)/.test(target ?? ""),
  );
  if (relative.length > 0) {
    throw new Error(
      `${source}: relative link(s) ${relative.join(", ")}; use absolute URLs so Markdown twins resolve them`,
    );
  }
}

/** The Markdown twin of one Project page (see GLOSSARY.md). */
export function twinMarkdown(
  { project, updated, live, sections }: ProjectPage,
  entries: ChangelogEntry[],
  site: URL,
): string {
  const { title, tagline, summary, repo, links = [] } = project.data;
  const { figures = [], caveat, status } = project.data;
  const body = (project.body ?? "").trim();
  assertAbsoluteLinks(`projects/${project.id}`, body);

  const sectionText = new Map(sections.map(({ slug, text }) => [slug, text]));
  const out: string[] = [
    `# ${title}`,
    "",
    `> ${tagline}`,
    "",
    summary,
    "",
    `- Status: ${status}`,
    `- Updated: ${isoDate(updated)}`,
    `- Last commit: ${isoDate(new Date(live.lastCommit))} (as of ${live.asOf})`,
    `- Page: ${absolute(site, pagePath(project.id))}`,
    ...links.map(({ label, href }) => `- ${label}: ${href}`),
    `- Source on GitHub: ${repo}`,
  ];
  if (caveat !== undefined) out.push("", caveat);
  if (figures.length > 0) {
    out.push("", "## Key figures", "");
    for (const { value, label, section } of figures) {
      const url = `${absolute(site, pagePath(project.id))}#${section}`;
      out.push(
        `- **${value}** ${label}: [${sectionText.get(section)}](${url})`,
      );
    }
  }
  out.push("", body);
  if (live.release) {
    out.push("", `Latest release: [${live.release.tag}](${live.release.url})`);
  }
  if (entries.length > 0) {
    out.push("", "## Recent changes");
    for (const { id, data, body: entryBody } of entries) {
      const text = (entryBody ?? "").trim();
      assertAbsoluteLinks(`changelog/${id}`, text);
      const heading = data.href ? `[${data.title}](${data.href})` : data.title;
      out.push("", `### ${isoDate(data.date)}: ${heading}`, "", text);
    }
  }
  return `${out.join("\n")}\n`;
}

export interface AgentProject {
  project: Project;
  /** Present exactly when the Project has a Project page. */
  page?: ProjectPage;
  entries: ChangelogEntry[];
}

/** Landing page order: Project cards, then the Also line. */
export async function getAgentProjects(): Promise<AgentProject[]> {
  const [cards, also, pages, changelog] = await Promise.all([
    getCards(),
    getAlso(),
    getPages(),
    getChangelog(),
  ]);
  const pageById = new Map(pages.map((page) => [page.project.id, page]));
  return [...cards, ...also].map((project) => ({
    project,
    page: pageById.get(project.id),
    entries: changelog.get(project.id) ?? [],
  }));
}

/** `llms-full.txt`: the Profile, then every twin, then Projects without a page. */
export function fullText(
  profile: Profile,
  projects: AgentProject[],
  site: URL,
): string {
  const where = profile.location ? `, ${profile.location}` : "";
  const out: string[] = [
    `# ${profile.name}`,
    "",
    `> ${profile.role}${where}. ${profile.intro}`,
    "",
    "## Contact",
    "",
    `- [Resume](${absolute(site, profile.resume)})`,
    `- [Email](mailto:${profile.email})`,
    `- [GitHub](${profile.github})`,
    `- [LinkedIn](${profile.linkedin})`,
  ];
  const bare: string[] = [];
  for (const { project, page, entries } of projects) {
    if (page === undefined) {
      const { title, repo, tagline, summary } = project.data;
      bare.push(`- [${title}](${repo}): ${tagline} ${summary}`);
      continue;
    }
    out.push("", demoteHeadings(twinMarkdown(page, entries, site)).trimEnd());
  }
  if (bare.length > 0) out.push("", "## Other projects", "", ...bare);
  return `${out.join("\n")}\n`;
}
