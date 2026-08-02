import { test, expect } from "@playwright/test";
import { mulledV2ImageName } from "../src/scripts/mulled-hash";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const combinationsDir = resolve(__dirname, "..", "..", "combinations");

type Entry = { targets: string; file: string; image_build: string };

// Read only the first N entries from individual .tsv files (not hash.tsv, not v1)
function readSampleFiles(maxFiles: number): Entry[] {
  const files = readdirSync(combinationsDir)
    .filter((f) => f.endsWith(".tsv") && f !== "hash.tsv" && !f.startsWith("mulled-v1-"))
    .slice(0, maxFiles);
  const entries: Entry[] = [];
  for (const file of files) {
    const text = readFileSync(resolve(combinationsDir, file), "utf8");
    const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
    for (const line of lines) {
      const [targets, , image_build = "0"] = line.split("\t");
      entries.push({ targets, file, image_build });
    }
  }
  return entries;
}

// Read a small sample of multi-package entries from hash.tsv
function readHashTsvSample(maxMulti: number): Entry[] {
  const text = readFileSync(resolve(combinationsDir, "hash.tsv"), "utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
  const multi: Entry[] = [];
  for (const line of lines) {
    const [targets, , image_build = "0"] = line.split("\t");
    if (targets.includes(",")) {
      multi.push({ targets, file: "hash.tsv", image_build });
      if (multi.length >= maxMulti) break;
    }
  }
  return multi;
}

// Extract the expected image name from a combination filename.
//   "samtools:1.20-0.tsv"                  → "samtools:1.20"
//   "mulled-v2-{hash}:{hash}-0.tsv"        → "mulled-v2-{hash}:{hash}-0"
//   "apptainer-0.tsv"                       → "apptainer"
// Strips ".tsv" then the trailing "-{build_number}" suffix for single-pkg only.
function imageNameFromFilename(filename: string, isMultiPkg: boolean): string {
  const noExt = filename.replace(/\.tsv$/, "");
  if (isMultiPkg) {
    // Multi-pkg filenames include the build suffix as part of the image name
    return noExt;
  }
  // Single-pkg: strip the "-{build}" suffix
  return noExt.replace(/^(.*)-\d+$/, "$1");
}

// ---------------------------------------------------------------------------
// Unit tests: mulled hash matches Python mulled-hash reference values
// ---------------------------------------------------------------------------

test.describe("mulled-hash: reference values (Python doctests)", () => {
  test("samtools=1.3.1,bedtools=2.26.0 (no image_build)", async () => {
    expect(await mulledV2ImageName("samtools=1.3.1,bedtools=2.26.0")).toBe(
      "mulled-v2-8186960447c5cb2faa697666dc1e6d919ad23f3e:a6419f25efff953fc505dbd5ee734856180bb619",
    );
  });

  test("build strings are stripped: samtools=1.3.1=h9071d68_10,bedtools=2.26.0=0", async () => {
    expect(await mulledV2ImageName("samtools=1.3.1=h9071d68_10,bedtools=2.26.0=0")).toBe(
      "mulled-v2-8186960447c5cb2faa697666dc1e6d919ad23f3e:a6419f25efff953fc505dbd5ee734856180bb619",
    );
  });

  test("samtools=1.3.1,bwa=0.7.13 (no image_build)", async () => {
    expect(await mulledV2ImageName("samtools=1.3.1,bwa=0.7.13")).toBe(
      "mulled-v2-fe8faa35dbf6dc65a0f7f5d4ea12e31a79f73e40:4d0535c94ef45be8459f429561f0894c3fe0ebcf",
    );
  });

  test("samtools=1.3.1,bwa=0.7.13 with image_build=0", async () => {
    expect(await mulledV2ImageName("samtools=1.3.1,bwa=0.7.13", "0")).toBe(
      "mulled-v2-fe8faa35dbf6dc65a0f7f5d4ea12e31a79f73e40:4d0535c94ef45be8459f429561f0894c3fe0ebcf-0",
    );
  });

  test("samtools=1.3.1,bwa=0.7.13 with image_build=1", async () => {
    expect(await mulledV2ImageName("samtools=1.3.1,bwa=0.7.13", "1")).toBe(
      "mulled-v2-fe8faa35dbf6dc65a0f7f5d4ea12e31a79f73e40:4d0535c94ef45be8459f429561f0894c3fe0ebcf-1",
    );
  });

  test("versionless second package: samtools=1.3.1,bwa (no image_build)", async () => {
    expect(await mulledV2ImageName("samtools=1.3.1,bwa")).toBe(
      "mulled-v2-fe8faa35dbf6dc65a0f7f5d4ea12e31a79f73e40:b0c847e4fb89c343b04036e33b2daa19c4152cf5",
    );
  });

  test("all versionless: samtools,bwa (no image_build)", async () => {
    expect(await mulledV2ImageName("samtools,bwa")).toBe(
      "mulled-v2-fe8faa35dbf6dc65a0f7f5d4ea12e31a79f73e40",
    );
  });

  test("all versionless with image_build=0: samtools,bwa", async () => {
    expect(await mulledV2ImageName("samtools,bwa", "0")).toBe(
      "mulled-v2-fe8faa35dbf6dc65a0f7f5d4ea12e31a79f73e40:0",
    );
  });

  test("single package: samtools=1.3.1", async () => {
    expect(await mulledV2ImageName("samtools=1.3.1")).toBe("samtools:1.3.1");
  });

  test("single package with image_build=0: samtools=1.3.1 (no suffix for single)", async () => {
    expect(await mulledV2ImageName("samtools=1.3.1", "0")).toBe("samtools:1.3.1");
  });

  test("single package with build string: samtools=1.3.1=h9071d68_10", async () => {
    expect(await mulledV2ImageName("samtools=1.3.1=h9071d68_10")).toBe("samtools:1.3.1");
  });

  test("single versionless package: samtools", async () => {
    expect(await mulledV2ImageName("samtools")).toBe("samtools");
  });

  test("empty string returns empty", async () => {
    expect(await mulledV2ImageName("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Unit tests: hash matches filename for a sample of combination files
// ---------------------------------------------------------------------------

const singlePkgSample = readSampleFiles(40).filter((e) => !e.targets.includes(",")).slice(0, 20);
const multiPkgSample = readSampleFiles(40).filter((e) => e.targets.includes(",")).slice(0, 20);
const hashTsvSample = readHashTsvSample(10);

test.describe("mulled-hash: matches combination filenames", () => {
  for (const entry of singlePkgSample) {
    test(`single-pkg: ${entry.file}`, async () => {
      const expected = imageNameFromFilename(entry.file, false);
      const actual = await mulledV2ImageName(entry.targets, entry.image_build);
      if (expected.includes("=")) {
        // Filename has a build string — image name is the part before the first "="
        expect(actual).toBe(expected.split("=")[0]);
      } else {
        expect(actual).toBe(expected);
      }
    });
  }

  for (const entry of multiPkgSample) {
    test(`multi-pkg: ${entry.file}`, async () => {
      const expected = imageNameFromFilename(entry.file, true);
      const actual = await mulledV2ImageName(entry.targets, entry.image_build);
      expect(actual).toBe(expected);
    });
  }

  for (const entry of hashTsvSample) {
    test(`hash.tsv: ${entry.targets}`, async () => {
      const actual = await mulledV2ImageName(entry.targets, entry.image_build);
      // With image_build, multi-pkg always has a suffix after the version hash
      expect(actual).toMatch(/^mulled-v2-[0-9a-f]{40}:[0-9a-f]{40}(-\d+)?$/);
      // Determinism
      expect(await mulledV2ImageName(entry.targets, entry.image_build)).toBe(actual);
    });
  }
});
