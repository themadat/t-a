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

- Fresh token-less visit: only the 80% token dialog is visible; Escape/backdrop cannot dismiss it, errors permit retry, and the app appears only after assigned-token connection and sync. A stored token opens the app directly.
- Personal layouts: Adam defaults Compact, others Expanded; Settings > Appearance > Layout follows Button Style and persists locally per person through reload/sync. Compact shows a colored name pill below the version; Expanded hides it and places Force update between Appearance and recovery in Settings. Check that the same update action returns to the Compact toolbar and still saves before refreshing. Expanded includes rounds, linked Golf Winnings and payments with Round/Money tags; financial totals still count each Money entry once. Tags have a separate column, Money results are empty, and Amount/Balance share amount-plus-direction styling. Layout switching keeps DOM IDs unique.
- Entry controls: one Add button beside year offers Money Entry/Golf Round, with its label below the icon. Search, year, and Add share a height. Sticky quick actions remain below the header during scrolling; category chips combine with search/year and Golf includes Wins. Quick adds and saves clear conflicting filters.
- Inline/mobile: clicking a data cell or its keyboard-accessible disclosure reveals details within that entry; close restores focus and edit opens the existing form. Mobile shows full names, the Search... placeholder and the count on the right, and hides the search period hint. Money forms label Payer/Payee above the names. Check 320px and 390px in both layouts/themes.
- Date order: all tables show newest dates first; year-only entries remain below exact dates in their year. Backdated adds and date edits appear in their chronological position. Final totals stay unchanged, and running balances follow date order.
- Ledger boundary/categories: exact dates on/after May 1, 2025 affect the balance; earlier/year-only entries show no running balance but remain in Wins/Bets breakdowns. Verify the centered double-line Ledger Begins marker. Categories persist after save/reload/sync and linked category edits survive subsequent round changes.
- Domain tests cover cents, repayments, newest-date ordering, date-edit repositioning, chronological running balances and same-date ties, linked winnings/payment updates, deletion/Undo, year-only dates, ties, migration, and malformed data.
- Import tests use synthetic fixtures and cover repeated rows, stable IDs, historical mismatches, exact links, appendix retention, and edited-source duplicate review. Never add the actual private note as a repository fixture.
- Sync tests use independent clients and a mocked GitHub file store: stale-SHA retry, concurrent additions, in-flight edits, targeted conflicts, opt-in Auto Sync, authorization/network failures, and recovery guards. Storage tests cover simultaneous browser tabs, transactional mutations, conflicting drafts across reload, and failed disk writes.
- Deployment testing stages only the worker's runtime allowlist. Inspect `/t-a/` in a local staged preview and reload after stopping the server to check the offline shell.
- For a real release, complete the two-browser token/setup checklist in README. Mocked tests cannot establish real token permissions or GitHub availability. Also test on an actual phone, including the on-screen keyboard; desktop viewport emulation does not exercise the device keyboard.

Implementation verification: automated tests and JavaScript syntax/diff checks passed. Browser checks covered source-note import, reconciled totals, annual summaries, synthetic add/delete/Undo, linked winnings, repayment preview, global search, Escape, focus, desktop/390px layouts in both themes, JSON backup restoration, save-before-update, and cached reload/entry forms under `/t-a/` with the server stopped. Live shared-token synchronization and a hosted deployment require external setup and remain pending.

Token-identity regression coverage includes two-token owner setup, fresh/additional friend devices without name prompts, automatic sync enablement, duplicate/unassigned rejection, offline recognition, association conflicts, and absence of raw tokens from exports. Browser setup uses synthetic invalid values only; real tokens must be entered by the user.

Info-tab coverage uses synthetic Notes to verify numbered-rule parsing, contact parsing, phone links, invalid-row rejection, and that the real private contact values are absent from public runtime source. Browser acceptance verifies the Info tab sits between Data Sync and Help, renders the imported private reference, exposes call/email links, and fits the mobile Settings layout.
