import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { existsSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use system chromium when available (local dev), otherwise let Playwright
// use its bundled browser (CI, after `npx playwright install chromium`).
const systemChromium = "/snap/bin/chromium";
const launchOptions = existsSync(systemChromium)
  ? { executablePath: systemChromium }
  : {};

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:4789",
    headless: true,
    trace: "on-first-retry",
    launchOptions,
  },
  webServer: {
    command: "npx astro preview --port 4789 --host",
    port: 4789,
    cwd: __dirname,
    reuseExistingServer: true,
    timeout: 20_000,
  },
});
