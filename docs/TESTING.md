# Verification

## Automated

```sh
node --test tests/*.test.mjs
for file in assets/js/*.js assets/js/core/*.js sw.js; do node --check "$file" || exit 1; done
node -e "for (const f of ['manifest.webmanifest','manifest-dark.webmanifest']) JSON.parse(require('fs').readFileSync(f,'utf8'))"
git diff --check
```

Check referenced assets exist. App/catalog scripts should parse, IDs remain unique, and source changes preserve unrelated records. No runtime packages are required. Compiler tests use temporary catalogs; sync tests cover content isolation and conflicts.

## Manual (focus on changed behavior)

Serve with `python3 -m http.server 8000`; stop afterward.

- Desktop and 390px/mobile: no horizontal overflow, reachable controls, visible focus, labelled icons, Escape/focus return, touch-sized controls, theme and reduced motion.
- Catalog: search/quoted terms/name-only mode, suggestions/highlights, category collapse/resize, Type/Source, all native weights and shortcuts, copy SVG, metadata edit/export, category removal/Undo. Check SVG CSS cannot affect controls.
- Notes: plain text, autosave/reload, selection contrast. Settings: tabs, one mobile scroller, appearance, Roadmap, release notes, developer filters and hints.
- Data: backup/export/import, legacy fixtures, recovery, malformed input rejection; Reset Preferences retains content; Erase All confirms.
- Sync: fixed target links, masked token after Test/Save/reload, dirty fields preserved, tab/device storage, failed storage handling; JSON preview contains only upload data.
- Sync states: toolbar/Settings agree; offline is neutral; only active arrows animate. Fresh/first/local/remote/equal/conflict/auth/error states work. Downloads/merges preserve device settings and require recovery; checks do not write. `tests/sync-preview.html` shows all states.
- Startup/PWA: fresh visit loads config and ordered scripts without errors; version labels/asset queries/cache agree; offline reload loads catalog/Notes/Settings; Update saves then refreshes; failed save/offline prevents refresh. Test upgrading from a prior worker, both themes' install assets, and a subdirectory host.
- Release change: edit only VERSION and release notes in config; no other file should need a version bump.

For a copied-app reset, also complete [Reset acceptance](RESET.md#verify).
