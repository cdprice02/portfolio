import type { CollectionEntry } from "astro:content";
import type { getProfile } from "./profile.ts";

type Project = CollectionEntry<"projects">;
type Profile = Awaited<ReturnType<typeof getProfile>>;
type Status = Project["data"]["status"];

/** Every value of the Project status enum, one Status each. */
export const statuses: Status[] = ["active", "maintained", "archived"];

const base: Project["data"] = {
  title: "sample",
  tagline: "A Project with a page and a body.",
  summary:
    "Fixture text long enough to wrap, so the Project card shows its measure and spacing across more than one line at phone width.",
  repo: "https://github.com/cdprice02/sample",
  tags: ["Rust", "topic", "another-topic"],
  status: "active",
  featured: "card",
  order: 1,
};

function project(id: string, body: string, data: Partial<Project["data"]>) {
  return {
    id,
    collection: "projects",
    body,
    data: { ...base, title: id, ...data },
  } satisfies Project;
}

/**
 * A Project with a page and one without. The id of the first is a real built
 * Project page, so the link checker still resolves the card's href.
 */
export function sampleProjects(pageId: string) {
  return {
    withPage: project(pageId, "Body text.", {}),
    withoutPage: project("without-page", "", {
      status: "archived",
      featured: "also",
      tags: ["Python"],
    }),
  };
}

/** The profile as shipped, plus the two optional fields removed. */
export function profiles(full: Profile): {
  withoutDog: Profile;
  bare: Profile;
} {
  const withoutDog = { ...full, dog: undefined };
  return { withoutDog, bare: { ...withoutDog, location: undefined } };
}

export const metaDates = {
  updated: new Date("2026-10-22"),
  lastCommit: new Date("2026-11-01"),
  asOf: "2026-11-06",
};
