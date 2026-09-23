# Architecture

## Startup and versions

`index.html` declares ordered scripts as inert `data-app-src` entries. Deferred `assets/js/boot.js` loads config with a freshness nonce, stamps marked stylesheet/install links with `config.identity.version`, then loads scripts in order. This works on static hosts and direct file URLs. A load failure produces a visible alert.

The sole release literal is `VERSION` in config. Identity version/buildId and the newest release derive from it. Older release entries keep their own numbers. There are no current-version literals in HTML, manifests, workflow names, or documentation.

`core/pwa.js` registers `sw.js?v=<buildId>` with `updateViaCache: none`. The worker derives its cache name from that URL, caches the shell, and serves network-first with revalidation. Boot's config nonce is stripped from its cache key. Offline asset lookup ignores query strings within the active worker's cache, so unversioned manifest icons and fresh config nonces resolve. Navigation falls back to cached index. GitHub requests remain network-only.

The toolbar Update control saves local changes before checking/installing and refreshing. A waiting worker changes its symbol/accessible label. Offline or failed saves prevent refresh. Appearance swaps manifest, touch, and app icons. Deployment is plain static GitHub Pages; its workflow name is stable and the run title comes from the commit message.

## Code map

All runtime modules attach to `window.LocalApp`.
- `config.js`: identity, flags, help, releases, Roadmap, fixed sync target.
- `icons.js`: shared interface SVGs, including cloud state symbols.
- Catalog parts + assembler: committed artwork; see [Icons](ICONS.md).
- `core/utils.js`: sanitization, URLs, dates, hashing, search utilities.
- `core/state.js`: defaults, migrations, normalization, backup/cloud formats.
- `core/storage.js`: local autosave, separate credentials, recovery.
- `core/components.js`: dialogs, menus, toasts, focus.
- `core/portability.js`: validated JSON import/export.
- `core/sync.js`: cloud comparisons, choices, upload/download/merge.
- `app.js`: rendering, event handlers, search, keyboard commands.

## Persistence

Local state/full backups use schema v4. Notes use stable `app-notes` in the legacy documents collection; editing is plain text escaped into the legacy html field. Migration preserves earlier note content and titles. Legacy records remain readable without restoring a Records UI.

Startup migrates/normalizes current or legacy state and can recover from a snapshot. Imports validate before replacing. Preserve storage keys across normal releases. New state shapes require migration tests. Preferences, UI, category collapse, rail width, and name-only search stay device-local. Reset Preferences preserves content; Erase All requires confirmation.

## Cloud contract

The `local-first-app-data` v1 envelope declares schema v5 (older builds reject it safely). Its data allowlist is Notes, pending icon metadata overrides, and nonempty legacy records. Empty fields are omitted; absence clears that content when downloaded. Built-in SVGs, preferences/UI, timestamps, mutation IDs, and credentials are excluded. Full backups transfer preferences.

`syncPayload`, `syncHash`, `prepareSync`, and `applySync` centralize this contract. Hashes use `data-v1:`. Baked overrides are pruned during normalization. Downloads keep local settings/credentials. Legacy full-state cloud files remain readable and compact on explicit Sync Now; background checks do not write.

Target owner/repo/branch/path always come from config. Tokens use separate local/session storage and never enter state, backups, diagnostics, or sync JSON. Save and successful Test keep a masked value and visible storage label; background renders preserve dirty fields.

Baseline target/SHA/hash distinguishes equal, local, remote, first-sync, and conflict states. Matching content establishes a baseline. Differing content is never resolved from general save timestamps. Merge combines compatible/separate content only. Download/merge/Restore require recovery; Restore also confirms replacement. Requests and pending decisions suppress stale or overlapping work.

Data Sync displays the exact local upload payload via textContent in a collapsible preview. Fourteen centralized cloud states are shared by Settings and the toolbar; only the active arrow modifier rotates, respecting reduced motion.
