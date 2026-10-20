import type { APIRoute } from "astro";
import { getProfile } from "../../lib/profile";

// RFC 9116 recommends an Expires date under a year out; stamping it at build
// time keeps the file valid as long as the site deploys at least that often.
const EXPIRES_MS = 360 * 24 * 60 * 60 * 1000;

export const GET: APIRoute = async ({ site }) => {
  const profile = await getProfile();
  const expires = new Date(Date.now() + EXPIRES_MS).toISOString();

  const body = [
    `Contact: mailto:${profile.email}`,
    `Expires: ${expires}`,
    "Preferred-Languages: en",
    `Canonical: ${new URL("/.well-known/security.txt", site).href}`,
    "",
  ].join("\n");

  return new Response(body);
};
