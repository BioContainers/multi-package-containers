// Client-side port of Galaxy's mulled v2 hash algorithm.
// Source: galaxy.tool_util.deps.mulled.util.v2_image_name
//
// For a single package, the image name is simply "name:version".
// For multiple packages, it's "mulled-v2-{package_hash}:{version_hash}{build_suffix}"
// where:
//   - package_hash = sha1 of package names (sorted, newline-joined)
//   - version_hash = sha1 of versions (sorted-by-name, "null" for missing, newline-joined)
//     (only included if at least one package has a version)
//   - build_suffix = "-{image_build}" if version_hash exists and image_build is set,
//                    or ":{image_build}" if no version_hash but image_build is set,
//                    or "" if image_build is empty/undefined
//
// Build strings (e.g. "=h9071d68_10") are stripped — they don't affect the hash.

export type CondaTarget = { package: string; version: string };

function parseTargets(targetsStr: string): CondaTarget[] {
  if (!targetsStr.trim()) return [];
  return targetsStr.split(",").map((s) => {
    const part = s.trim();
    if (part.includes("=")) {
      const [package_name, rest] = part.split("=", 2);
      let version = rest;
      if (version.includes("=")) {
        version = version.split("=")[0];
      } else if (version.includes("--")) {
        version = version.split("--")[0];
      }
      return { package: package_name, version };
    }
    return { package: part, version: "" };
  });
}

async function sha1Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-1", data);
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function mulledV2ImageName(
  targetsStr: string,
  imageBuild?: string,
): Promise<string> {
  const targets = parseTargets(targetsStr);
  if (targets.length === 0) return "";

  if (targets.length === 1) {
    const t = targets[0];
    return t.version ? `${t.package}:${t.version}` : t.package;
  }

  // Sort by package name
  const ordered = targets.slice().sort((a, b) => a.package.localeCompare(b.package));

  // Package hash: sha1 of package names, newline-joined
  const packageBuffer = ordered.map((t) => t.package).join("\n");
  const packageHash = await sha1Hex(packageBuffer);

  // Version hash: only if at least one package has a version
  const hasAnyVersion = ordered.some((t) => t.version);
  let versionHashStr = "";
  if (hasAnyVersion) {
    const versionBuffer = ordered.map((t) => t.version || "null").join("\n");
    versionHashStr = await sha1Hex(versionBuffer);
  }

  // Build suffix
  let buildSuffix = "";
  if (imageBuild) {
    if (versionHashStr) {
      buildSuffix = `-${imageBuild}`;
    } else {
      buildSuffix = imageBuild;
    }
  }

  let suffix = "";
  if (versionHashStr || buildSuffix) {
    suffix = `:${versionHashStr}${buildSuffix}`;
  }

  return `mulled-v2-${packageHash}${suffix}`;
}
