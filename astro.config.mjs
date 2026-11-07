// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";
import { isProduction } from "./src/lib/build.ts";
import { diagram } from "./src/lib/diagram.ts";
import { tableAlign } from "./src/lib/table-align.ts";
import { taskLabels } from "./src/lib/task-labels.ts";
import { tokenClasses } from "./src/lib/shiki-classes.ts";
import cspHeaders from "./scripts/csp-headers.mjs";

export default defineConfig({
  site: "https://cdprice.dev",
  output: "static",
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        // Only production renders the Web Analytics beacon.
        ...(isProduction
          ? /** @type {const} */ ([
              "connect-src 'self' https://cloudflareinsights.com",
            ])
          : []),
      ],
      scriptDirective: {
        resources: [
          "'self'",
          ...(isProduction ? ["https://static.cloudflareinsights.com"] : []),
        ],
      },
    },
  },
  markdown: {
    shikiConfig: { theme: "css-variables", transformers: [tokenClasses] },
    processor: satteri({
      mdastPlugins: [diagram],
      hastPlugins: [tableAlign, taskLabels],
    }),
  },
  integrations: [
    react(),
    icon(),
    sitemap({ filter: (page) => !page.endsWith("/style-sample/") }),
    cspHeaders(),
  ],
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Inter",
      cssVariable: "--font-inter",
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Fira Code",
      cssVariable: "--font-fira-code",
      weights: [400, 500, 600],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-monospace", "Menlo", "monospace"],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
