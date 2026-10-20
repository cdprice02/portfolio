import { getEntry } from "astro:content";

export async function getProfile() {
  const entry = await getEntry("profile", "carson");
  if (!entry) throw new Error("src/data/profile.json has no `carson` entry");
  return entry.data;
}
