# App Template

A static, local-first SVG icon library and reusable application foundation. Open `index.html` directly, or serve this folder for clipboard, installation, and offline support:

```sh
python3 -m http.server 8000
```

No build step, runtime packages, backend, or sign-in is required. Node is used only for development tests and optional catalog compilation.

The app includes searchable SVGs, five native SF Symbol weights, metadata editing, a single Notes modal, appearance settings, Help, release notes, Roadmap, JSON backup/recovery, and optional GitHub Sync. The current version and history appear in Settings → What's New.

## Develop and release

Edit `assets/js/config.js` to configure identity, features, cloud target, and help. For a release, change its sole `VERSION` value and add release notes at the front of `releases`. The newest entry uses `VERSION`; keep previous entries pinned to their historical numbers. Versions use `major.minor.patch.build`.

Asset URLs, visible version labels, build IDs, and offline cache names follow automatically. No routine version edits are needed elsewhere. Run:

```sh
node --test tests/*.test.mjs
git diff --check
```

Host the repository as static files over HTTPS. GitHub Pages uses **Settings → Pages → GitHub Actions** and the checked-in workflow. Its stable name is Deploy App Template; the run title uses the versioned commit subject. Do not enable a second branch-based deployment.

## Use as a new-app template

Copy into a new repository, supply the app name and square icon, and request `reset`. It keeps the shell and infrastructure, removes the icon-library product, and starts the new app at `0.0.1.1`. Follow [Reset](docs/RESET.md); do not reset this canonical checkout accidentally.

## Optional GitHub Sync

The app's repository and sync target are separate config values. Settings → Data Sync links both, keeps the target read-only, and accepts a fine-grained token. Save and successful Test retain it according to the device/tab choice.

Create a unique app JSON file in [app-data/data](https://github.com/themadat/app-data/tree/main/data). Create the token in [GitHub settings](https://github.com/settings/personal-access-tokens), selecting only `app-data` with **Contents: Read and write**. Tokens stay outside app data, backups, and diagnostics. SSH for terminal Git is configured separately on each computer.

## Documentation

- [Architecture](docs/ARCHITECTURE.md): runtime, persistence, cloud contract, offline updates.
- [Icons](docs/ICONS.md): sources, weights, compilation, metadata.
- [Customization](docs/CUSTOMIZATION.md): identity, features, release process.
- [Components](docs/COMPONENTS.md): shared UI conventions.
- [Testing](docs/TESTING.md): automated checks and focused manual coverage.
- [Git setup](docs/GIT-SETUP.md): personal/work laptop SSH.
- [Agent instructions](AGENTS.md): workflows and commit handoff.
