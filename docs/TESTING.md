# Verification

## Automated

```sh
node --test tests/*.test.mjs
for file in assets/js/*.js assets/js/core/*.js sw.js; do node --check "$file" || exit 1; done
node -e "for (const f of ['manifest.webmanifest','manifest-dark.webmanifest']) JSON.parse(require('fs').readFileSync(f,'utf8'))"
git diff --check
```

Check referenced assets exist. App scripts should parse, IDs remain unique, and source changes preserve unrelated records. No runtime packages are required. Sync tests cover content isolation, recovery, and concurrent edits.

Use Node.js 18 or later for the test runner.

## Manual (focus on changed behavior)

Serve with `python3 -m http.server 8000`; stop afterward.

- Desktop and 390px/mobile: no horizontal overflow, reachable controls, visible focus, labelled icons, Escape/focus return, touch-sized controls, theme and reduced motion.
- Notes: plain text, autosave/reload, selection contrast. Settings: tabs, one mobile scroller, appearance, Roadmap, release notes, developer diagnostics and hints.
- Data: backup/export/import, recovery, malformed input rejection; Reset Preferences retains content; Erase All confirms.
- Sync: fixed target links, masked token after Test/Save/reload, dirty fields preserved, tab/device storage, failed storage handling; JSON preview contains only upload data.
- Sync states: toolbar/Settings agree; offline is neutral; only active arrows animate. Fresh/first/local/remote/equal/conflict/auth/error states work. Downloads/merges preserve device settings and require recovery; checks do not write. `tests/sync-preview.html` shows all states.
- Startup/PWA: fresh visit loads config and ordered scripts without errors; version labels/asset queries/cache agree; offline reload loads Notes/Settings; Update saves then refreshes; failed save/offline prevents refresh. Test upgrading from a prior worker, both themes' install assets, and a subdirectory host.
- Release change: edit only VERSION and release notes in config; no other file should need a version bump.

For a copied-app reset, also complete [Reset acceptance](RESET.md#verify).

## Money and Golf acceptance

- Domain tests cover cents, repayments, newest-addition ordering, linked winnings/payment updates, deletion/Undo, year-only dates, ties, migration, and malformed data.
- Import tests use synthetic fixtures and cover repeated rows, stable IDs, historical mismatches, exact links, appendix retention, and edited-source duplicate review. Never add the actual private note as a repository fixture.
- Sync tests use independent clients and a mocked GitHub file store: stale-SHA retry, concurrent additions, in-flight edits, targeted conflicts, opt-in Auto Sync, authorization/network failures, and recovery guards. Storage tests cover simultaneous browser tabs, transactional mutations, conflicting drafts across reload, and failed disk writes.
- Deployment testing stages only the worker's runtime allowlist. Inspect `/t-a/` in a local staged preview and reload after stopping the server to check the offline shell.
- For a real release, complete the two-browser token/setup checklist in README. Mocked tests cannot establish real token permissions or GitHub availability. Also test on an actual phone, including the on-screen keyboard; desktop viewport emulation does not exercise the device keyboard.

Implementation verification: automated tests and JavaScript syntax/diff checks passed. Browser checks covered source-note import, reconciled totals, annual summaries, synthetic add/delete/Undo, linked winnings, repayment preview, global search, Escape, focus, desktop/390px layouts in both themes, JSON backup restoration, save-before-update, and cached reload/entry forms under `/t-a/` with the server stopped. Live shared-token synchronization and a hosted deployment require external setup and remain pending.

Token-identity regression coverage includes two-token owner setup, fresh/additional friend devices without name prompts, automatic sync enablement, duplicate/unassigned rejection, offline recognition, association conflicts, and absence of raw tokens from exports. Browser setup uses synthetic invalid values only; real tokens must be entered by the user.
