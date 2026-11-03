import type { APIRoute } from "astro";
import { fullText, getAgentProjects } from "../lib/agent-files";
import { getProfile } from "../lib/profile";

// The same assembler as the Markdown twins, so the two cannot drift.
export const GET: APIRoute = async ({ site }) =>
  new Response(fullText(await getProfile(), await getAgentProjects(), site!));
