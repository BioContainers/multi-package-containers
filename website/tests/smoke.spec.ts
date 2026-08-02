import { test } from "@playwright/test";

test("page loads", async ({ page }) => {
  const resp = await page.goto("/multi-package-containers/");
  console.log("status:", resp?.status());
  console.log("url:", page.url());
  const title = await page.title();
  console.log("title:", title);
  const html = await page.content();
  console.log("html length:", html.length);
  console.log("has mcb-search:", html.includes("mcb-search"));
  // Take screenshot for debugging
  await page.screenshot({ path: "test-results/debug-load.png" });
});
