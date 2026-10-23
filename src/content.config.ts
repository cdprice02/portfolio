import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";

const projects = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      tagline: z.string(),
      summary: z.string(),
      repo: z.url(),
      links: z.array(z.object({ label: z.string(), href: z.url() })).optional(),
      // The first tag is the primary programming language (the Project page's
      // programmingLanguage); the rest are topics.
      tags: z.array(z.string()),
      status: z.enum(["active", "maintained", "archived"]),
      updated: z.coerce.date().optional(),
      figures: z
        .array(
          z.object({
            value: z.string(),
            label: z.string(),
            section: z.string(),
          }),
        )
        .max(3)
        .optional(),
      caveat: z.string().optional(),
      image: image().optional(),
      featured: z.union([z.enum(["card", "also"]), z.literal(false)]),
      order: z.number(),
    }),
});

const profile = defineCollection({
  loader: file("src/data/profile.json"),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string(),
      location: z.string().optional(),
      intro: z.string(),
      email: z.email(),
      resume: z.string().startsWith("/"),
      github: z.url(),
      linkedin: z.url(),
      analyticsToken: z.string().optional(),
      headshot: image(),
    }),
});

export const collections = { projects, profile };
