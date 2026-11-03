import type { APIRoute } from "astro";
import { twinMarkdown } from "../../lib/agent-files";
import { getChangelog, type ChangelogEntry } from "../../lib/changelog";
import { getPages, type ProjectPage } from "../../lib/projects";

export async function getStaticPaths() {
  const [pages, changelog] = await Promise.all([getPages(), getChangelog()]);
  return pages.map((page) => ({
    params: { slug: page.project.id },
    props: { page, entries: changelog.get(page.project.id) ?? [] },
  }));
}

export const GET: APIRoute<{
  page: ProjectPage;
  entries: ChangelogEntry[];
}> = ({ props, site }) =>
  new Response(twinMarkdown(props.page, props.entries, site!));
