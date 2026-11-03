import type { APIRoute } from "astro";
import { getAgentProjects, twinPath } from "../lib/agent-files";
import { getProfile } from "../lib/profile";

// Generated from the same data as the Landing page, so the two cannot drift.
export const GET: APIRoute = async ({ site }) => {
  const profile = await getProfile();
  const projects = await getAgentProjects();
  const url = (path: string) => new URL(path, site).href;

  const body = [
    `# ${profile.name}`,
    "",
    `> ${profile.role}${profile.location ? `, ${profile.location}` : ""}. ${profile.intro}`,
    "",
    "## Projects",
    "",
    ...projects.map(({ project, page }) => {
      const { id, data } = project;
      const href = page ? url(twinPath(id)) : data.repo;
      return `- [${data.title}](${href}): ${data.tagline} ${data.summary}`;
    }),
    "",
    "## Full text",
    "",
    `- [llms-full.txt](${url("/llms-full.txt")}): the profile and every Project page in one file`,
    "",
    "## Contact",
    "",
    `- [Resume](${url(profile.resume)})`,
    `- [Email](mailto:${profile.email})`,
    `- [GitHub](${profile.github})`,
    `- [LinkedIn](${profile.linkedin})`,
    "",
  ].join("\n");

  return new Response(body);
};
