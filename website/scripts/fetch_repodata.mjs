#!/usr/bin/env node
// Build-time data fetcher.
//
// Produces two JSON files consumed by the static site:
//   src/scripts/packages.json     -> { bioconda: [{name, version}], conda-forge: [...] }
//   src/scripts/combinations.json -> [{ targets, base_image, image_build, file }]
//
// The conda channel repodata files are large; we keep only name + latest version
// per package to keep the static bundle small.
//
// Usage:  node scripts/fetch_repodata.mjs [--arch linux-64] [--out src/scripts]
//
// Set MCB_SKIP_FETCH=1 to skip network fetches (useful for offline/dev) and only
// regenerate combinations.json from the local combinations/ directory.

import { mkdir, writeFile, readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DEFAULT_OUT = resolve(ROOT, "public", "data");

const arch = process.argv.includes("--arch")
  ? process.argv[process.argv.indexOf("--arch") + 1]
  : "linux-64";
const outArgIdx = process.argv.indexOf("--out");
const OUT = outArgIdx !== -1 ? resolve(outArgIdx === process.argv.length - 1 ? DEFAULT_OUT : process.argv[outArgIdx + 1]) : DEFAULT_OUT;

const CHANNELS = ["bioconda", "conda-forge"];
const skipFetch = process.env.MCB_SKIP_FETCH === "1";

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

async function fetchChannel(channel) {
  const url = `https://conda.anaconda.org/${channel}/${arch}/repodata.json`;
  console.log(`fetching ${url}`);
  const data = await fetchJson(url);
  const packages = data.packages ?? {};
  const byName = new Map();
  for (const fn of Object.keys(packages)) {
    const pkg = packages[fn];
    if (pkg.subdir && pkg.subdir !== arch) continue;
    const name = pkg.name;
    if (!name) continue;
    let entry = byName.get(name);
    if (!entry) {
      entry = { name, versions: new Set() };
      byName.set(name, entry);
    }
    entry.versions.add(pkg.version);
  }
  const list = [...byName.values()]
    .map(({ name, versions }) => ({ name, versions: [...versions] }))
    .sort((a, b) => a.name.localeCompare(b.name));
  console.log(`  ${channel}: ${list.length} packages`);
  return list;
}

async function readExistingCombinations() {
  const dir = join(ROOT, "..", "combinations");
  const absDir = existsSync(dir) ? dir : join(ROOT, "combinations");
  const dirToRead = existsSync(absDir) ? absDir : null;
  if (!dirToRead) {
    console.log("combinations/ not found, skipping existing combinations");
    return [];
  }
  const files = await readdir(dirToRead);
  const out = [];
  for (const file of files) {
    if (!file.endsWith(".tsv")) continue;
    const text = await readFile(join(dirToRead, file), "utf8");
    const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
    for (const line of lines) {
      const [targets, base_image = "", image_build = ""] = line.split("\t");
      out.push({ targets, base_image, image_build, file });
    }
  }
  console.log(`existing combinations: ${out.length} entries`);
  return out;
}

function usedNamesFromCombinations(combinations) {
  const names = new Set();
  for (const c of combinations) {
    for (const part of c.targets.split(",")) {
      const name = part.split("=")[0];
      if (name) names.add(name);
    }
  }
  return [...names].sort();
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const packages = {};
  if (skipFetch) {
    console.log("MCB_SKIP_FETCH=1 -> writing empty packages.json");
    for (const c of CHANNELS) packages[c] = [];
  } else {
    for (const c of CHANNELS) {
      packages[c] = await fetchChannel(c);
    }
  }
  await writeFile(
    join(OUT, "packages.json"),
    JSON.stringify(packages),
  );
  console.log(`wrote ${join(OUT, "packages.json")}`);

  const combinations = await readExistingCombinations();
  await writeFile(join(OUT, "combinations.json"), JSON.stringify(combinations));
  console.log(`wrote ${join(OUT, "combinations.json")}`);

  const usedNames = usedNamesFromCombinations(combinations);
  await writeFile(join(OUT, "used-names.json"), JSON.stringify(usedNames));
  console.log(`wrote ${join(OUT, "used-names.json")} (${usedNames.length} names)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
