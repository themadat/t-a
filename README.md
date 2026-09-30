# T&A

[Money, bets, and golf for Tristen and Adam](https://themadat.github.io/t-a/). Saves locally, works offline, and optionally syncs through GitHub. Settings controls layout, appearance, backups, and sync.

## Run

Static HTML/CSS/JavaScript; no installation or build step. Run `python3 -m http.server 8000`, open localhost:8000, and stop the server afterward. See [Testing](docs/TESTING.md).

## Shared Data

Sync uses private `themadat/data-t-a`, branch `main`, file `data/t-a.json`. Initialize the branch and create two fine-grained tokens with Contents read/write access to that repository. In Data Sync, Adam labels both tokens and syncs once; each person then connects with their assigned token. Test additions/removals from both devices before relying on shared editing.

Tokens and appearance stay local; Money, Golf, Notes, and deletion markers sync. Conflicts require review. Keep backups and personal data outside this public repository. Import a running note through Settings and review its preview first.

## Maintain

Configuration and releases: `assets/js/config.js`. Domain/storage contracts: [Architecture](docs/ARCHITECTURE.md). GitHub Actions tests and deploys runtime assets to Pages on pushes to `main`; `node scripts/stage-site.mjs /tmp/t-a-site` previews the deployment allowlist.
