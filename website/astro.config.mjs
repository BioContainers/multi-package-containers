import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Site is served from the gh-pages branch at the repository root.
export default defineConfig({
  site: "https://biocontainers.github.io",
  base: "/multi-package-containers",
  output: "static",
  build: {
    format: "directory",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
