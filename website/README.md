# Mulled Container Builder Website

This static website lets users browse bioconda and conda-forge packages,
assemble a basket of `name=version` pairs, and open a pull request against
`combinations/hash.tsv` with a single click.

It is built with [Astro](https://astro.build/) + Tailwind CSS and deployed to
the `gh-pages` branch by CI. A daily cron rebuild keeps the package index up to
date with the latest conda repodata.

## Local development

```bash
just install    # install npm dependencies
just dev        # local dev server with hot reload
just build      # fetch conda repodata + build the static site
just build-offline  # build without network (empty package index)
just test       # build with test fixtures + run Playwright tests
```

## How it works

1. **Build time:** `website/scripts/fetch_repodata.mjs` fetches `repodata.json`
   from conda.anaconda.org for both bioconda and conda-forge, extracts
   package names + all versions, and writes compact JSON to
   `website/public/data/`. It also reads all `combinations/*.tsv` files
   (including `hash.tsv`) to produce `combinations.json` and `used-names.json`.

2. **Runtime:** The static site fetches these JSON files lazily. Search,
   basket, and existing-combinations browser are client-side islands. The
   "Build container" button generates a GitHub web editor URL that pre-fills
   a new combination file — no token or backend needed.

3. **Deployment:** The `.github/workflows/website.yml` workflow builds the site
   and pushes `website/dist/` to the `gh-pages` branch. It runs on every push
   to `master` and on a daily cron schedule.

## Data API

The following JSON files are generated at build time and served as static
assets from the website. They are accessible at:

| File | Description |
|------|-------------|
| `/data/packages.json` | All bioconda and conda-forge packages with all versions: `{"bioconda": [{"name": "samtools", "versions": ["1.20", ...]}], "conda-forge": [...]}` |
| `/data/combinations.json` | All existing combinations from `combinations/*.tsv` (including `hash.tsv`): `[{"targets": "samtools=1.20", "base_image": "", "image_build": "0", "file": "hash.tsv"}]` |
| `/data/used-names.json` | Sorted array of package names that already appear in at least one existing combination: `["samtools", "bwa", ...]` |

## How PRs are created

No GitHub token or backend API is needed. The website builds a URL to GitHub's
web editor:

```
https://github.com/{owner}/{repo}/new/master
  ?filename=combinations/{slug}.tsv
  &value={url-encoded TSV content}
```

When the user clicks "Build container", this URL opens in a new tab with:
- The **filename** pre-filled as `combinations/{targets-slug}.tsv`
- The **content** pre-filled as a TSV with the header and the selected
  `name=version` targets

The user clicks **"Propose changes"** in GitHub's UI, which creates a branch
and opens a pull request. The existing CI then builds and publishes the
container once the PR is merged.

### Using your own fork

To open PRs against your own fork, change the **Owner** and **Repository**
fields in the "Build container" panel on the website.
