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
- `core/utils.js`: sanitization, URLs, dates, hashing, search utilities.
- `core/ledger.js`: cents, running balances, annual golf results, linked mutations and grouped merge.
- `core/note-import.js`: local reviewed source import with stable occurrence IDs.
- `ledger-ui.js`: responsive Money/Golf lists, entry forms, import review.
- `core/state.js`: defaults, normalization, backup/cloud formats.
- `core/storage.js`: local autosave, separate credentials, recovery.
- `core/components.js`: dialogs, menus, toasts, focus.
- `core/portability.js`: validated JSON import/export.
- `core/identity.js`: owner token labeling, SHA-256 fingerprints, credential-derived attribution and one-step connection.
- `core/info.js`: extracts the golf-rules and contacts sections from private Notes for the Settings Info tab.
- `core/sync.js`: cloud comparisons, choices, upload/download/merge.
- `app.js`: rendering, event handlers, search, keyboard commands.

## Persistence

Local state/full backups use schema v5; migration from v4 preserves Notes and preferences and adds empty Money/Golf collections. Notes use stable `app-notes` in a single-item documents collection; editing is plain text escaped into the internal html field. Old template records and catalog state are not part of T&A.

Startup normalizes T&A state and can recover from a snapshot. Imports validate before replacing. Preserve storage keys across normal releases. New state shapes require migration tests. Preferences and UI stay device-local. Reset Preferences preserves content; Erase All requires confirmation.

## Cloud contract

The `local-first-app-data` v2 envelope declares schema v6 so older builds reject it safely. Its allowlist contains plain-text Notes, money entries, and golf rounds. Entry IDs, addition order, revisions, attribution, import provenance, and deletion markers travel with content. Empty collections may be omitted. Local preferences/UI and credentials are excluded. Full backups include device preferences.

`syncPayload`, `syncHash`, `prepareSync`, and `applySync` centralize this contract. Hashes use `data-v2:`. Old Notes-only cloud envelopes remain readable without clearing new collections; Sync Now upgrades them. All amounts use integer cents; balances are derived in addition order. Four-digit dates preserve unknown historical days. A round and linked winnings/payment rows form an atomic conflict group.

Target owner/repo/branch/path always come from config. Tokens use separate local/session storage and never enter state, backups, diagnostics, or sync JSON. Save and successful Test keep a masked value and visible storage label; background renders preserve dirty fields.

Baseline target/SHA/hash and the exact common content snapshot enable a three-way merge. Each sync fetches the latest file, merges independent groups, requires review for same-group conflicts, and writes against the fetched SHA. A 409/422 refetches and retries at most three times. The baseline acknowledges only the actual uploaded snapshot, so edits made during a request remain pending. Recovery is required before applying remote content. First connection and file creation require interactive review. Explicit Restore confirms replacement.

Auto Sync is off until opted in and requires an established baseline. It debounces edits, checks while visible, retries on reconnect with bounded backoff, and never resolves conflicts automatically. A browser lock serializes cooperating tabs when available; SHA checks protect remote writes regardless. Local storage merges tab content against a common snapshot and retains conflicting drafts in session storage across reload. Mutations are transactional; failed validation does not partially change the live state.

Data Sync displays the exact local upload payload via textContent in a collapsible preview. Fourteen centralized cloud states are shared by Settings and the toolbar; only the active arrow modifier rotates, respecting reduced motion.

## Token attribution

`workspace.tokenLabels` contains exactly two distinct SHA-256 fingerprints keyed by Adam and Tristen, or is empty before setup. The hash input is domain-separated by `t-a:token-identity:v1:`. Raw tokens never enter the state; only the current device credential uses the separate secret store. Association changes are one atomic three-way-merge group, included in backups and cloud content. Earlier builds reject the new cloud key safely.

The owner labels both tokens once and publishes. Connect validates remote access and matches the supplied token against shared labels before saving the credential. Fresh empty browsers initialize without a merge-choice prompt, then enable Auto Sync. Browsers with existing content still retain merge/conflict review. Money/Golf attribution derives from the current secret and current labels; stored person preferences are no longer trusted. Cached labels support offline identity. These labels are not a security boundary against repository writers.
