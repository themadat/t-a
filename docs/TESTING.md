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
- Personal layouts: Adam defaults Compact, others Expanded; Settings > Appearance > Layout follows Button Style and persists locally per person through reload/sync. Compact shows a colored name pill below the version; Expanded hides it and places Force update between Appearance and recovery in Settings. Check that the same update action returns to the Compact toolbar and still saves before refreshing. Expanded combines each Round and its linked Golf Winnings into one Wins row, preserves separate round payments, and places nonzero Bet Winnings in a Bets row above the Round; financial totals still count each Money entry once. Expanded summary cards have no active highlight border. Tags have a separate column, Money results are empty, and Amount/Balance share amount-plus-direction styling. Layout switching keeps DOM IDs unique.
- Entry controls: one Add button beside year offers Money Entry/Golf Round, with its label below the icon. Search, year, and Add share a height. Desktop quick actions remain below the header during scrolling. On mobile, quick action buttons scroll away and only filter chips stick below the header. Golf/Wins/Bets/Food/Other Tags combine with search/year and remain distinct; Round/Golf Winnings defaults to Wins and Round Payment to Golf. Linked tag edits remain authoritative. Both mobile quick-action groups fit on one line. Labels split as Round Paid / by ($20) and Dollar / Bet. Dollar Bet selects the $1 winner, opens editable What and Notes, and supports adding with or without Notes. Quick adds and saves clear conflicting filters.
- Inline/mobile: clicking a data cell or its keyboard-accessible disclosure reveals details within that entry; the disclosure collapses details and restores focus; Edit opens the existing form. Details omit Date/What/Type/Payer/Payee/Amount/Balance, have no Close button, and place Edit on the right. Mobile opening scrolls the row below the sticky header/filters, including the last row. Tapping empty mobile header space returns to the top without intercepting controls. Mobile shows full names, the Search... placeholder and the count on the right, and hides the search period hint. Mobile header buttons stay together on the right. Money forms label Payer/Payee above the names and Pays above the switch. Tags sit on the date line at the right in both mobile views. Payer/Payee columns have equal fixed widths, and swapping names keeps their size/position. Built-in labels use Title Case, except the requested lowercase owes/is up/for/in/to/won by; user text stays intact. Check 320px and 390px in both layouts/themes.
- Date order: all tables show newest dates first; year-only entries remain below exact dates in their year. Backdated adds and date edits appear in their chronological position. Final totals stay unchanged, and running balances follow date order.
- Ledger boundary/categories: exact dates on/after May 1, 2025 affect the balance; earlier/year-only entries show no running balance but remain in Wins/Bets breakdowns. Verify the centered double-line Ledger Begins marker. Categories persist after save/reload/sync and linked category edits survive subsequent round changes.
- Golf entry: New courses default to Hancock, and row names show Course (Holes): Person won by # strokes. Results show scores per person, using UNK when missing. Scores follow the date row; either score may be blank/unknown. Golf and Bet winners/amounts are independent and may both be zero. A zero round creates no zero-dollar Money row; Bet-only rounds still sort below their Bet. Edits, delete/Undo, and category changes preserve links and stable IDs. Unknown scores do not fabricate ties or stroke margins.
- Summary periods: Books/Course display (All Time) or the selected year. Books uses the filtered period’s exact-date ledger balance and Wins/Bets totals (including year-only history); running row balances retain the complete chronological ledger. Course shows who Is Up in strokes/Golf winnings, and round wins list the signed-in person first. Unknown rounds remain in the count and are explained in the summary tooltip.
- Domain tests cover cents, repayments, newest-date ordering, date-edit repositioning, chronological running balances and same-date ties, linked Golf/Bet/payment updates, deletion/Undo, year-only dates, unknown scores, ties, local v4/v5 migration, previous cloud v6 migration, and malformed data. Current local/cloud schemas preserve null scores and both winnings amounts.
- Import tests use synthetic fixtures and cover repeated rows, stable IDs, historical mismatches, exact links, appendix retention, and edited-source duplicate review. Never add the actual private note as a repository fixture.
- Sync tests use independent clients and a mocked GitHub file store: stale-SHA retry, concurrent additions, in-flight edits, targeted conflicts, opt-in Auto Sync, authorization/network failures, and recovery guards. Storage tests cover simultaneous browser tabs, transactional mutations, conflicting drafts across reload, and failed disk writes.
- Deployment testing stages only the worker's runtime allowlist. Inspect `/t-a/` in a local staged preview and reload after stopping the server to check the offline shell.
- For a real release, complete the two-browser token/setup checklist in README. Mocked tests cannot establish real token permissions or GitHub availability. Also test on an actual phone, including the on-screen keyboard; desktop viewport emulation does not exercise the device keyboard.

Implementation verification: automated tests and JavaScript syntax/diff checks passed. Browser checks covered source-note import, reconciled totals, annual summaries, synthetic add/delete/Undo, linked winnings, repayment preview, global search, Escape, focus, desktop/390px layouts in both themes, JSON backup restoration, save-before-update, and cached reload/entry forms under `/t-a/` with the server stopped. Live shared-token synchronization and a hosted deployment require external setup and remain pending.

Token-identity regression coverage includes two-token owner setup, fresh/additional friend devices without name prompts, automatic sync enablement, duplicate/unassigned rejection, offline recognition, association conflicts, and absence of raw tokens from exports. Browser setup uses synthetic invalid values only; real tokens must be entered by the user.

Info-tab coverage uses synthetic Notes to verify numbered-rule parsing, contact parsing, phone links, invalid-row rejection, and that the real private contact values are absent from public runtime source. Browser acceptance verifies the Info tab sits between Data Sync and Help, renders the imported private reference, exposes call/email links, and fits the mobile Settings layout.

Latest verification: 86 automated tests pass, including independent Golf/Bet links, unknown-score totals, atomic conflict resolution, backup/cloud migrations, year-filtered category totals, Dollar Bet directions/notes, combined Round balances, and escaped inline details. Synthetic browser checks cover zero winnings, Round/Bets ordering, both Dollar Bet save modes, yearly summaries, sync/reload persistence, Pays/Payer/Payee, cell and keyboard disclosure, grouped mobile buttons, mobile filter-only stickiness, and 320px/390px/820px/1280px containment. JavaScript syntax, manifests, and diff checks pass. A Title Case cleanup regression in inline details was repaired and reverified. Live shared sync and a physical phone remain unverified.

Latest Tags/mobile verification: 87 automated tests pass, including separate Golf/Wins/Bets filters, legacy filter normalization, authoritative linked tag changes without balance changes, UNK details, escaped Notes, and omitted repeated fields. Synthetic browser checks verify exact two-line quick-action labels fitting at 320px, stable equal 90px payer/payee columns before/after swapping, Hancock defaults, partial UNK results, right-aligned date-line tags, last-row and Compact/Expanded opening scroll, sticky header/filters, empty-header return to top, and 320px/390px/820px/1280px containment in light/dark themes. A Compact Golf CSS overlap was corrected and rechecked. JavaScript syntax, manifests, and diff checks pass. Live shared sync and a physical phone remain unverified.
