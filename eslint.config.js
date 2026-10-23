import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import astro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y-x";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["dist/", ".astro/", "node_modules/", ".claude/"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["**/*.{jsx,tsx}"],
    ...jsxA11y.configs.recommended,
  },
  astro.configs.recommended,
  astro.configs["jsx-a11y-recommended"],
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
);
