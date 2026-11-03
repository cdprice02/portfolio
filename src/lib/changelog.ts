import { getCollection, type CollectionEntry } from "astro:content";
import { hasPage } from "./projects.ts";

export type ChangelogEntry = CollectionEntry<"changelog">;

/**
 * Changelog entries by Project id, newest first (ties by entry id). An entry
 * for a Project without a page has nowhere to show, so it fails the build.
 */
export async function getChangelog(): Promise<Map<string, ChangelogEntry[]>> {
  const withPage = new Set(
    (await getCollection("projects")).filter(hasPage).map(({ id }) => id),
  );
  const entries = await getCollection("changelog");

  const stray = entries.filter(({ data }) => !withPage.has(data.project.id));
  if (stray.length > 0) {
    const lines = stray.map(
      ({ id, data }) => `${id}: ${data.project.id} has no Project page`,
    );
    throw new Error(`Invalid Changelog entries:\n${lines.join("\n")}`);
  }

  const byProject = new Map<string, ChangelogEntry[]>();
  const newestFirst = entries.sort(
    (a, b) =>
      b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id),
  );
  for (const entry of newestFirst) {
    const list = byProject.get(entry.data.project.id) ?? [];
    list.push(entry);
    byProject.set(entry.data.project.id, list);
  }
  return byProject;
}
