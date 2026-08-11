# Mulled Container Builder - build targets
# https://github.com/casey/just

default:
    @just --list

# Install website dependencies (including test/dev deps)
install:
    cd website && npm install

# Install Playwright browser (system chromium fallback via config)
install-test: install
    cd website && npx playwright install chromium || true

# Fetch conda repodata + build the static site
build:
    cd website && node scripts/fetch_repodata.mjs && npm run build

# Build without hitting the network (uses empty package index)
build-offline:
    cd website && MCB_SKIP_FETCH=1 node scripts/fetch_repodata.mjs && npm run build

# Build with test fixture data (for Playwright tests)
build-test:
    cd website && MCB_SKIP_FETCH=1 node scripts/fetch_repodata.mjs && cp tests/fixtures/*.json public/data/ && npm run build

# Run Playwright tests (builds with fixtures first)
test: build-test
    cd website && npx playwright test

# Run Playwright tests with UI mode
test-ui: build-test
    cd website && npx playwright test --ui

# Local dev server with hot reload
dev:
    cd website && npm run dev

# Preview the built site locally
preview:
    cd website && npm run preview

# Clean build artifacts
clean:
    rm -rf website/dist website/.astro website/public/data
