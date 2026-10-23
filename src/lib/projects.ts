import type { MarkdownHeading } from "astro";
import { getCollection, render, type CollectionEntry } from "astro:content";

type Project = CollectionEntry<"projects">;

async function placed(featured: "card" | "also"): Promise<Project[]> {
  const projects = await getCollection(
    "projects",
    (project) => project.data.featured === featured,
  );
  return projects.sort((a, b) => a.data.order - b.data.order);
}

export const getCards = () => placed("card");
export const getAlso = () => placed("also");

/** `https://github.com/cdprice02/colony` becomes `cdprice02/colony`. */
export function repoLabel(repo: string): string {
  return new URL(repo).pathname.replace(/^\/|\/$/g, "");
}

/** The Also line reads "lex, an entropy-based ...", so the tagline loses its capital. */
export function alsoPhrase(project: Project): string {
  const { tagline } = project.data;
  return tagline.charAt(0).toLowerCase() + tagline.slice(1);
}

/** A Project has a page exactly when its markdown body has text. */
export function hasPage(project: Project): boolean {
  return (project.body ?? "").trim() !== "";
}

export interface ProjectPage {
  project: Project;
  updated: Date;
  sections: MarkdownHeading[];
}

/**
 * Every Project with a page, with its h2s. Zod sees only frontmatter, so the
 * rules that depend on the body are checked here and fail the build.
 */
export async function getPages(): Promise<ProjectPage[]> {
  const problems: string[] = [];
  const pages: ProjectPage[] = [];
  for (const project of await getCollection("projects")) {
    const { updated, figures, caveat, tags } = project.data;
    if (!hasPage(project)) {
      const stray = Object.entries({ updated, figures, caveat })
        .filter(([, value]) => value !== undefined)
        .map(([field]) => field);
      if (stray.length > 0) {
        problems.push(`${project.id}: ${stray.join(", ")} set but no body`);
      }
      continue;
    }
    const { headings } = await render(project);
    const sections = headings.filter((heading) => heading.depth === 2);
    const ids = new Set(sections.map((heading) => heading.slug));
    for (const { section } of figures ?? []) {
      if (!ids.has(section)) {
        problems.push(`${project.id}: figure section "${section}" is no h2`);
      }
    }
    if (tags.length === 0) {
      problems.push(
        `${project.id}: has a body but no tags (first is the language)`,
      );
    }
    if (updated === undefined) {
      problems.push(`${project.id}: has a body but no updated date`);
      continue;
    }
    pages.push({ project, updated, sections });
  }
  if (problems.length > 0) {
    throw new Error(`Invalid Project pages:\n${problems.join("\n")}`);
  }
  return pages;
}

/** The date part of an ISO timestamp: `2026-10-22`. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
