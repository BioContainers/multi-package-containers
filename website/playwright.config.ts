import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:4789",
    headless: true,
    trace: "on-first-retry",
    launchOptions: {
      executablePath: "/snap/bin/chromium",
    },
  },
  webServer: {
    command: "npx astro preview --port 4789 --host",
    port: 4789,
    cwd: __dirname,
    reuseExistingServer: true,
    timeout: 20_000,
  },
});
