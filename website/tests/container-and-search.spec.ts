import { test, expect } from "@playwright/test";

// Helper: load the page and wait for package data to be available
async function loadPage(page: import("@playwright/test").Page) {
  await page.goto("/multi-package-containers/");
  await Promise.all([
    page.waitForResponse("**/data/packages.json"),
    page.waitForResponse("**/data/used-names.json"),
    page.locator("#mcb-search").focus(),
  ]);
}

// Helper: load page with a clean localStorage (no leftover container items)
async function cleanLoadPage(page: import("@playwright/test").Page) {
  await page.goto("/multi-package-containers/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await loadPage(page);
}

// Helper: scroll to the existing combinations section and wait for it to load
async function loadExisting(page: import("@playwright/test").Page) {
  await page.goto("/multi-package-containers/");
  await page.locator("#mcb-existing-loading").scrollIntoViewIfNeeded();
  await expect(page.locator("#mcb-existing-body tr")).toHaveCount(10, { timeout: 10_000 });
}

// Helper: add a package to the container by name (assumes conda-forge channel for non-bioconda pkgs)
async function addPackage(page: import("@playwright/test").Page, name: string, channel?: string) {
  if (channel) {
    await page.locator("#mcb-channel").selectOption(channel);
  }
  await page.locator("#mcb-search").fill(name);
  await expect(page.locator(`[data-pkg-name='${name}']`)).toBeVisible({ timeout: 5_000 });
  await page.locator(`[data-pkg-name='${name}'] .mcb-add-btn`).click();
}

// ---------------------------------------------------------------------------
// Container functionality
// ---------------------------------------------------------------------------

test.describe("Container", () => {
  test("add a package from search", async ({ page }) => {
    await cleanLoadPage(page);
    await addPackage(page, "openssl", "conda-forge");

    await expect(page.locator("#mcb-container-count")).toHaveText("1");
    await expect(page.locator("#mcb-container-list li")).toHaveCount(1);
    await expect(page.locator("#mcb-container-targets")).toContainText("openssl=");
  });

  test("add multiple packages (sorted by name in targets)", async ({ page }) => {
    await cleanLoadPage(page);
    await addPackage(page, "openssl", "conda-forge");
    await addPackage(page, "curl");

    await expect(page.locator("#mcb-container-count")).toHaveText("2");
    await expect(page.locator("#mcb-container-list li")).toHaveCount(2);
    const targets = await page.locator("#mcb-container-targets").textContent();
    expect(targets).toMatch(/curl.*openssl=/);
  });

  test("remove a package", async ({ page }) => {
    await cleanLoadPage(page);
    await addPackage(page, "openssl", "conda-forge");
    await expect(page.locator("#mcb-container-count")).toHaveText("1");

    await page.locator(".mcb-container-remove").first().click();
    await expect(page.locator("#mcb-container-count")).toHaveText("0");
    await expect(page.locator("#mcb-container-list li")).toHaveCount(0);
    await expect(page.locator("#mcb-container-empty")).toBeVisible();
  });

  test("clear container", async ({ page }) => {
    await cleanLoadPage(page);
    await addPackage(page, "openssl", "conda-forge");
    await addPackage(page, "curl");
    await expect(page.locator("#mcb-container-count")).toHaveText("2");

    page.on("dialog", (dialog) => dialog.accept());
    await page.locator("#mcb-container-clear").click();

    await expect(page.locator("#mcb-container-count")).toHaveText("0");
    await expect(page.locator("#mcb-container-empty")).toBeVisible();
  });

  test("container persists across reload (localStorage)", async ({ page }) => {
    await cleanLoadPage(page);
    await addPackage(page, "openssl", "conda-forge");
    await expect(page.locator("#mcb-container-count")).toHaveText("1");

    await page.reload();
    await loadPage(page);
    await expect(page.locator("#mcb-container-count")).toHaveText("1");
  });

  test("adding same package with different version updates it", async ({ page }) => {
    await cleanLoadPage(page);
    await addPackage(page, "samtools");
    await expect(page.locator("#mcb-container-count")).toHaveText("1");

    await page.locator(".mcb-ver-select").first().selectOption("1.10");
    await page.locator(".mcb-add-btn").first().click();

    await expect(page.locator("#mcb-container-count")).toHaveText("1");
    const targets = await page.locator("#mcb-container-targets").textContent();
    expect(targets).toContain("samtools=1.10");
  });

  test("emptying container hides image name and warnings", async ({ page }) => {
    await cleanLoadPage(page);
    await addPackage(page, "openssl", "conda-forge");
    await expect(page.locator("#mcb-image-name")).toBeVisible();

    await page.locator(".mcb-container-remove").first().click();

    await expect(page.locator("#mcb-image-name")).toBeHidden();
    await expect(page.locator("#mcb-warning-size")).toBeHidden();
    await expect(page.locator("#mcb-warning-exists")).toBeHidden();
  });
});

// ---------------------------------------------------------------------------
// Search functionality
// ---------------------------------------------------------------------------

test.describe("Search", () => {
  test("single word search returns matching packages", async ({ page }) => {
    await loadPage(page);
    await page.locator("#mcb-search").fill("samtools");
    await expect(page.locator(".mcb-add-btn")).toHaveCount(1);
    await expect(page.locator("[data-pkg-name='samtools']")).toBeVisible();
  });

  test("empty query clears results", async ({ page }) => {
    await loadPage(page);
    await page.locator("#mcb-search").fill("samtools");
    await expect(page.locator(".mcb-add-btn")).toHaveCount(1);

    await page.locator("#mcb-search").fill("");
    await expect(page.locator(".mcb-add-btn")).toHaveCount(0);
    await expect(page.locator("#mcb-search-hint")).toBeEmpty();
  });

  test("multi-word search: 'samtools bwa' returns nothing (no single pkg matches both)", async ({ page }) => {
    await loadPage(page);
    await page.locator("#mcb-search").fill("samtools bwa");
    await expect(page.locator(".mcb-add-btn")).toHaveCount(0);
    await expect(page.locator("#mcb-search-hint")).toContainText("0 matches");
  });

  test("multi-word search: 'bwa mem' matches bwa-mem2", async ({ page }) => {
    await loadPage(page);
    await page.locator("#mcb-search").fill("bwa mem");
    await expect(page.locator(".mcb-add-btn")).toHaveCount(1);
    await expect(page.locator("[data-pkg-name='bwa-mem2']")).toBeVisible();
  });

  test("partial name search matches multiple packages", async ({ page }) => {
    await loadPage(page);
    await page.locator("#mcb-search").fill("bwa");
    await expect(page.locator(".mcb-add-btn")).toHaveCount(2);
  });

  test("default channel 'both' searches bioconda and conda-forge", async ({ page }) => {
    await loadPage(page);
    // samtools is bioconda, openssl is conda-forge — both should be findable with default channel
    await page.locator("#mcb-search").fill("samtools");
    await expect(page.locator("[data-pkg-name='samtools']")).toBeVisible();
    await page.locator("#mcb-search").fill("openssl");
    await expect(page.locator("[data-pkg-name='openssl']")).toBeVisible();
  });

  test("channel filter: bioconda only", async ({ page }) => {
    await loadPage(page);
    await page.locator("#mcb-channel").selectOption("bioconda");
    await page.locator("#mcb-search").fill("python");
    await expect(page.locator(".mcb-add-btn")).toHaveCount(0);
  });

  test("channel filter: conda-forge only", async ({ page }) => {
    await loadPage(page);
    await page.locator("#mcb-channel").selectOption("conda-forge");
    await page.locator("#mcb-search").fill("python");
    // "python" matches both "python" and "biopython" in conda-forge
    await expect(page.locator(".mcb-add-btn")).toHaveCount(2);
    await expect(page.locator("[data-pkg-name='python']")).toBeVisible();
  });

  test("'in use' badge for packages in existing combinations", async ({ page }) => {
    await loadPage(page);
    await page.locator("#mcb-search").fill("samtools");
    await expect(page.locator("[data-pkg-name='samtools'] .bg-emerald-100")).toBeVisible();
  });

  test("no 'in use' badge for packages not in existing combinations", async ({ page }) => {
    await loadPage(page);
    await page.locator("#mcb-channel").selectOption("conda-forge");
    await page.locator("#mcb-search").fill("openssl");
    await expect(page.locator("[data-pkg-name='openssl'] .bg-emerald-100")).toHaveCount(0);
  });

  test("Enter key adds first result", async ({ page }) => {
    await cleanLoadPage(page);
    await page.locator("#mcb-channel").selectOption("conda-forge");
    await page.locator("#mcb-search").fill("openssl");
    await expect(page.locator(".mcb-add-btn")).toHaveCount(1);
    await page.locator("#mcb-search").press("Enter");
    await expect(page.locator("#mcb-container-count")).toHaveText("1");
  });

  test("version dropdown shows all versions sorted newest-first", async ({ page }) => {
    await loadPage(page);
    await page.locator("#mcb-search").fill("samtools");
    await expect(page.locator(".mcb-add-btn")).toHaveCount(1);
    const options = await page.locator(".mcb-ver-select option").allTextContents();
    expect(options[0]).toBe("1.20");
    expect(options.length).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// Existing combinations browser
// ---------------------------------------------------------------------------

test.describe("Existing combinations", () => {
  test("loads and displays combinations with count", async ({ page }) => {
    await loadExisting(page);
    await expect(page.locator("#mcb-existing-count")).not.toHaveText("…");
  });

  test("filter by single package name", async ({ page }) => {
    await loadExisting(page);
    await page.locator("#mcb-existing-search").fill("samtools");
    await expect(page.locator("#mcb-existing-body tr")).toHaveCount(6, { timeout: 5_000 });
  });

  test("multi-term filter matches across separate packages", async ({ page }) => {
    await loadExisting(page);
    await page.locator("#mcb-existing-search").fill("samtoo bwa");
    await expect(page.locator("#mcb-existing-body tr")).toHaveCount(2, { timeout: 5_000 });
    const bodyText = await page.locator("#mcb-existing-body").textContent();
    expect(bodyText).toContain("bwa-mem2=2.2.1,samtools=1.20");
    expect(bodyText).toContain("bwa=0.7.17,samtools=1.10,samblaster=0.1.24");
  });

  test("multi-term filter with no match returns empty", async ({ page }) => {
    await loadExisting(page);
    await page.locator("#mcb-existing-search").fill("samtools openssl");
    await expect(page.locator("#mcb-existing-body tr")).toHaveCount(0, { timeout: 5_000 });
  });

  test("includes combinations from hash.tsv", async ({ page }) => {
    await loadExisting(page);
    const bodyText = await page.locator("#mcb-existing-body").textContent();
    expect(bodyText).toContain("hash.tsv");
  });

  test("all rows shown when fewer than page size, load-more disabled", async ({ page }) => {
    await loadExisting(page);
    await expect(page.locator("#mcb-existing-shown")).toContainText("10 of 10");
    await expect(page.locator("#mcb-existing-more")).toBeDisabled();
  });

  test("image name for single-package entry shows name:version", async ({ page }) => {
    await loadExisting(page);
    const row = page.locator("tr", { hasText: "spades=4.0.0" });
    const imgCell = row.locator("[data-img-targets]");
    await expect(imgCell).not.toHaveText("…", { timeout: 10_000 });
    const title = await imgCell.getAttribute("title");
    expect(title).toBe("spades:4.0.0");
  });

  test("image name for multi-package entry shows mulled-v2 hash (truncated in display)", async ({ page }) => {
    await loadExisting(page);
    const multiRow = page.locator("tr", { hasText: "bwa-mem2=2.2.1,samtools=1.20" });
    const imgCell = multiRow.locator("[data-img-targets]");
    await expect(imgCell).not.toHaveText("…", { timeout: 10_000 });
    // Full name in title
    const title = await imgCell.getAttribute("title");
    expect(title).toMatch(/^mulled-v2-[0-9a-f]{40}:[0-9a-f]{40}-0$/);
    // Display is truncated
    const display = await imgCell.textContent();
    expect(display).toContain("…");
    expect(display!.length).toBeLessThan(title!.length);
  });

  test("base image and build info available as row hover tooltip", async ({ page }) => {
    await loadExisting(page);
    const firstRow = page.locator("#mcb-existing-body tr").first();
    const title = await firstRow.getAttribute("title");
    expect(title).toContain("Base image:");
    expect(title).toContain("Build:");
  });

  test("table has only Targets, Image name, Source columns", async ({ page }) => {
    await loadExisting(page);
    const ths = await page.locator("thead th").allTextContents();
    expect(ths).toEqual(["Targets", "Image name", "Source"]);
  });
});

// ---------------------------------------------------------------------------
// Container: image name, warnings, copy button
// ---------------------------------------------------------------------------

test.describe("Container: image name & warnings", () => {
  test("single package shows name:version, Docker and Singularity URLs", async ({ page }) => {
    await cleanLoadPage(page);
    await addPackage(page, "cutadapt");

    await expect(page.locator("#mcb-image-name")).toBeVisible();
    const name = await page.locator("#mcb-image-name-text").textContent();
    expect(name).toContain("cutadapt:");
    expect(page.locator("#mcb-docker-url")).toContainText("docker pull quay.io/biocontainers/cutadapt:");
    expect(page.locator("#mcb-singularity-url")).toContainText("wget https://depot.galaxyproject.org/singularity/cutadapt:");
  });

  test("multiple packages show mulled-v2 hash (CSS-truncated, full in title)", async ({ page }) => {
    await cleanLoadPage(page);
    await addPackage(page, "openssl", "conda-forge");
    await addPackage(page, "curl");

    await expect(page.locator("#mcb-image-name")).toBeVisible();
    // textContent has the full name (CSS truncation is visual only)
    const text = await page.locator("#mcb-image-name-text").textContent();
    const title = await page.locator("#mcb-image-name-text").getAttribute("title");
    expect(title).toMatch(/^mulled-v2-[0-9a-f]{40}:[0-9a-f]{40}-0$/);
    expect(text).toBe(title);
    // Verify CSS truncation is applied
    const overflow = await page.locator("#mcb-image-name-text").evaluate(
      (el) => getComputedStyle(el).textOverflow,
    );
    expect(overflow).toBe("ellipsis");
  });

  test("copy button copies image name, shows check icon, then reverts", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await cleanLoadPage(page);
    await addPackage(page, "cutadapt");

    await expect(page.locator("#mcb-image-name")).toBeVisible();
    await page.locator("#mcb-image-copy").click();

    // Check icon appears (svg with polyline = checkmark)
    await expect(page.locator("#mcb-image-copy polyline")).toBeVisible();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain("cutadapt:");

    // Copy icon reverts after 1.5s (rect = clipboard icon)
    await expect(page.locator("#mcb-image-copy rect")).toBeVisible({ timeout: 3_000 });
  });

  test("size warning appears with more than 4 packages", async ({ page }) => {
    await cleanLoadPage(page);
    await page.locator("#mcb-channel").selectOption("conda-forge");
    for (const name of ["openssl", "curl", "git", "requests", "pyyaml"]) {
      await addPackage(page, name);
    }
    await expect(page.locator("#mcb-warning-size")).toBeVisible();
    await expect(page.locator("#mcb-warning-size")).toContainText("Containers should be as small as possible");
  });

  test("no size warning with exactly 4 packages", async ({ page }) => {
    await cleanLoadPage(page);
    await page.locator("#mcb-channel").selectOption("conda-forge");
    for (const name of ["openssl", "curl", "git", "requests"]) {
      await addPackage(page, name);
    }
    await expect(page.locator("#mcb-warning-size")).toBeHidden();
  });

  test("duplicate warning blocks PR and links to existing image", async ({ page }) => {
    await cleanLoadPage(page);
    // The fixture has "samtools=1.20" as an existing combination
    await addPackage(page, "samtools");

    await expect(page.locator("#mcb-warning-exists")).toBeVisible();
    await expect(page.locator("#mcb-warning-exists")).toContainText("already exists");
    await expect(page.locator("#mcb-build-link")).toHaveClass(/pointer-events-none/);
    await expect(page.locator("#mcb-build-hint")).toContainText("already exists");
    await expect(page.locator("#mcb-existing-quay")).toHaveAttribute("href", /quay\.io/);
    await expect(page.locator("#mcb-existing-depot")).toHaveAttribute("href", /depot\.galaxyproject\.org/);
  });

  test("no duplicate warning for new combination", async ({ page }) => {
    await cleanLoadPage(page);
    await addPackage(page, "openssl", "conda-forge");

    await expect(page.locator("#mcb-warning-exists")).toBeHidden();
    await expect(page.locator("#mcb-build-link")).not.toHaveClass(/pointer-events-none/);
  });
});

// ---------------------------------------------------------------------------
// Build panel (GitHub URL generation only)
// ---------------------------------------------------------------------------

test.describe("Build panel", () => {
  test("build link is disabled when container is empty", async ({ page }) => {
    await cleanLoadPage(page);
    const link = page.locator("#mcb-build-link");
    await expect(link).toHaveAttribute("href", "#");
    await expect(link).toHaveClass(/pointer-events-none/);
    await expect(page.locator("#mcb-build-hint")).toContainText("Add packages to your container first");
  });

  test("build link generates GitHub new-file URL with targets", async ({ page }) => {
    await cleanLoadPage(page);
    await addPackage(page, "openssl", "conda-forge");

    await expect(page.locator("#mcb-build-link")).not.toHaveClass(/pointer-events-none/);
    const href = await page.locator("#mcb-build-link").getAttribute("href");
    expect(href).toContain("github.com/BioContainers/multi-package-containers/new/master");
    expect(href).toContain("filename=combinations%2F");
    expect(href).toContain(".tsv");
    expect(href).toContain("openssl%3D");
  });

  test("build link respects custom owner/repo", async ({ page }) => {
    await cleanLoadPage(page);
    await page.locator("#mcb-owner").fill("myfork");
    await page.locator("#mcb-repo").fill("my-multi-package-containers");

    await addPackage(page, "openssl", "conda-forge");

    await expect(page.locator("#mcb-build-link")).not.toHaveClass(/pointer-events-none/);
    const href = await page.locator("#mcb-build-link").getAttribute("href");
    expect(href).toContain("github.com/myfork/my-multi-package-containers/new/master");
  });
});
