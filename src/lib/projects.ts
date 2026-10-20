import { getCollection, type CollectionEntry } from "astro:content";

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
