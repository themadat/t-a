# Agent handoff

Read this and WISHES at session start. Current identity and release history live in `assets/js/config.js`.

## Product invariants

- T&A is Tristan's and Adam's Running Note for Bets, Golf, and Other Shenanigans. The reset leaves a blank main workspace; no bet or golf tracking features have been designed yet.
- Keep one plain-text Notes modal, vertical Settings, separate What's New/Roadmap, top-bar search/Sync/Update, local backup/recovery, accessibility, and offline support.
- Shell SVGs are self-contained in `assets/js/icons.js`; there is no catalog dependency.
- Notes are the only cloud content. Full backups include device preferences. Tokens never enter exports, diagnostics, or cloud files.
- Sync is fixed to `themadat/data-t-a`, `main`, `data/t-a.json`. Imports must never redirect it. Downloads and merges require a recovery copy.
- Preserve `t-a` storage namespaces across ordinary releases. VERSION in config is the only release number to edit.
- Keep Git remotes computer-independent; this checkout's origin remains `https://github.com/themadat/t-a.git`.
- Preserve the pre-existing untracked `assets/icons/t-a-wip.svg`. The supplied canonical artwork is copied to `assets/icons/t-a.svg`.

## External setup pending

The CLI received HTTP 404 for `themadat/data-t-a`. Repository access, initial `{}` data file, browser token setup, and a live upload/download round trip remain unverified. Do not claim Sync provisioning complete until those pass.

## Read on demand

Architecture, Components, Customization, Testing, Reset, and Git setup documentation live in `docs/`.

## Reset verification

37 automated tests passed, along with JavaScript syntax and diff checks. Browser checks covered desktop and 390px layouts, both appearances, search/Clear, empty Roadmap, retained SVG controls, Notes persistence with Unicode/literal HTML, and cached reload/Notes with the preview server stopped. Test Notes were cleared. The preview server is stopped; nothing was committed, pushed, or deployed.
