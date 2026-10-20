import type { APIRoute } from "astro";
import { getProfile } from "../lib/profile";
import { getAlso, getCards } from "../lib/projects";

// Generated from the same data as the Landing page, so the two cannot drift.
export const GET: APIRoute = async ({ site }) => {
  const profile = await getProfile();
  const projects = [...(await getCards()), ...(await getAlso())];
  const url = (path: string) => new URL(path, site).href;

  const body = [
    `# ${profile.name}`,
    "",
    `> ${profile.role}${profile.location ? `, ${profile.location}` : ""}. ${profile.intro}`,
    "",
    "## Projects",
    "",
    ...projects.map(
      ({ data }) =>
        `- [${data.title}](${data.repo}): ${data.tagline} ${data.summary}`,
    ),
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
