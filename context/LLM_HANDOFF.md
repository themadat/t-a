# Agent handoff

Read this and WISHES at session start. Identity and release history live in `assets/js/config.js`.

## Current work

The approved [Money and Golf plan](PLAN-001-money-and-golf.md) is implemented locally. Read its Resume block for remaining external setup. The prior Money/Golf work was committed by the user. The new token-identity changes are uncommitted. Preserve the unrelated untracked `assets/icons/t-a-wip.svg`.

## Product invariants

- T&A tracks Money and Golf with newest additions first, integer-cent balances, repayments, annual results, and linked round winnings/payment entries. Changing a linked entry opens its round.
- Keep one plain-text Notes modal, vertical Settings, separate What's New/Roadmap, top-bar search/Sync/Update, local backup/recovery, accessibility, and offline support.
- Money, Golf, Notes, revisions, provenance, and deletion markers are cloud content. Preferences and UI remain device-local. Tokens never enter exports, diagnostics, or cloud files.
- Sync is fixed to `themadat/data-t-a`, `main`, `data/t-a.json`. Imports cannot redirect it. Recovery is required before remote replacements. Three-way merges treat each round plus linked money as a group; same-group conflicts require review.
- Token setup: Adam labels both tokens once in Data Sync; only domain-separated SHA-256 fingerprints are shared in workspace.tokenLabels. Tristan enters only his token and presses Connect. The name picker is removed; unknown tokens cannot attribute Money/Golf edits.
- Auto Sync is enabled after successful Connect or owner setup, operates while open/visible, and does not choose conflicting versions. Browser tabs merge independent changes and retain conflicting drafts across reload.
- Local schema v5 migrates old v4 Notes state. Cloud v2/schema v6 safely excludes old clients; old Notes-only payloads are readable without clearing Money/Golf.
- Preserve `t-a` storage namespaces and the sole VERSION in config. Shell SVGs are self-contained in `assets/js/icons.js`.
- Preserve the stored origin `git@github.com:themadat/t-a.git`; this computer's URL rewrite selects personal SSH.
- Private source/seed data stays outside this public repository. Tests contain synthetic fixtures only. The import preserves history and flags discrepancies instead of silently posting historical winnings.
- Settings has an Info tab between Data Sync and Help. It parses golf rules and contacts from private synced Notes, so personal contact values are never embedded in public runtime source.

## External setup pending

The user confirmed `data-t-a` is private and will issue two distinct tokens under the owner account. Display attribution is separate from GitHub identity. Personal SSH read access succeeded; the repository advertised no refs, so `main` needs initialization. Tokens must be entered directly into each app browser. A real two-browser sync round trip remains unverified.

Pages is configured for GitHub Actions at https://themadat.github.io/t-a/ (rechecked). The workflow now verifies and stages only public runtime files, supports manual runs, and retains its stable name. A new hosted deployment requires the user's commit/push. Do not claim live shared setup or deployment complete.

## Verification

63 automated tests cover the existing app plus private Info parsing and source-isolation checks. JavaScript syntax and diff checks passed. Browser checks cover source import/reconciliation, linked winnings, delete/Undo, repayment preview, search, form focus/Escape, desktop/390px light/dark layouts, JSON backup restoration, the staged `/t-a/` path, save-before-update, and cached reload/entry forms with the server stopped. Preview servers are stopped. Device keyboard behavior still needs an actual phone check.

A clean populated backup and cloud JSON were prepared outside the repository under the task's private artifact directory; see the delivery message. Local preview browser data is test-only and does not provision the hosted site.

## Read on demand

Architecture, Components, Customization, Testing, Reset, and Git setup documentation live in `docs/`.
