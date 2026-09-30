# Wish ledger

Next id: `WISH-002`

## WISH-001 — Money ledger and golf rounds

- Status: Active; implemented and locally verified. Release, actual-phone keyboard verification, and live shared-sync acceptance pending.
- Behavior/rationale: Turn the supplied note into easy-to-add Money and Golf lists, with new entries at the top, accurate running/annual totals, and shared editing for Adam and Tristen.
- Confirmed decisions: New golf winnings create linked Money entries; retain GitHub Sync. Adam labels both tokens once; Tristen only enters his token and connects. Fingerprints provide automatic attribution.
- Follow-up: Settings provides a private Info tab sourced from synced Notes for the golf rules and Adam's contacts.
- Follow-up implemented: personal Compact/Expanded views, combined Round-tagged table/details, token startup screen, desktop header placement, category save fixes, and the May 2025 ledger boundary with year-only category history.
- Follow-up implemented: Appearance layout choice, single Add, sticky quick actions/category chips, full mobile names, linked Golf Winnings in Expanded, inline cell details, and Payer/Payee labels.
- Follow-up implemented: newest-date tables and chronological running balances, Compact identity below version, Expanded update in Settings, mobile search counts, separate Tags, and matching Amount/Balance styling.
- Follow-up implemented: unknown scores, independent Golf/Bet winnings, combined Round/Golf rows with Bets above, Dollar Bet selected-winner actions, year-aware personalized summaries, grouped mobile toolbar, filter-only mobile stickiness, Pays label, and Title Case controls.
- Follow-up implemented: distinct Golf/Wins/Bets/Food/Other Tags, no Rounds tag, per-person UNK and Course/Holes/result names, Hancock default, stable direction swap sizing, shorter inline details/right Edit, one-line mobile quick actions, date-line tags, row-opening scroll and empty-header return to top.
- Follow-up implemented: centered quick actions with wider mobile names, reordered Money direction controls, more Entry space without Expanded Result, full-width mobile titles, focused Golf details with one Edit, and aligned Compact Results/Winnings without Wins pills.
- Follow-up implemented: bold/spaced quick-action labels with regular-weight names, one desktop Money first row, centered mobile direction/Tags, desktop Edit beside facts, and explicit Money versus combined-row counts.
- Follow-up implemented: derived $0 Golf Winnings in Compact, larger quick-action labels, sticky desktop table headers with aligned horizontal scrolling, and Add moving into pinned controls on scroll with narrower mobile filters.
- Follow-up implemented: default Masters Golf skin with a device-local Masters/Basic selector beneath Theme, supplied icons, coordinated light/dark surfaces, green/yellow branding, floral tags, browser chrome, and offline skin switching; Basic restores the original saved appearance.
- Follow-up implemented: Add stays at the far right after joining the pinned controls in both layouts and device sizes.
- Follow-up implemented: Round Paid quick actions require confirmation of payer and $20 owed before adding the Golf entry.
- Scope/constraints: Static app, desktop/mobile, offline support, migration/import/recovery, no lost or duplicate edits. Preserve existing shell/Notes. Personal source data stays out of the public app repository.
- Acceptance: Exact historical import/reconciliation; correct money and golf calculations; safe linked updates; two-account concurrent/offline synchronization; responsive accessible entry flows.
- Priority/effort: Core product / High.
- Files/tests/open questions: See [implementation plan](PLAN-001-money-and-golf.md), including its Resume block and source discrepancy review.

For each wish, record: ID/title, status (Proposed/Planned/Active/Shipped/Parked), behavior and rationale, scope/constraints, acceptance criteria, priority/effort, affected files, open questions, and plan link. Add release/date when shipped. Wishes do not authorize implementation; detailed release history belongs in config.
