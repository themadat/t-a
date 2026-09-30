# Wish ledger

Next id: `WISH-002`

## WISH-001 — Money ledger and golf rounds

- Status: Active; implemented and locally verified. Release, actual-phone keyboard verification, and live shared-sync acceptance pending.
- Behavior/rationale: Turn the supplied note into easy-to-add Money and Golf lists, with new entries at the top, accurate running/annual totals, and shared editing for Adam and Tristen.
- Confirmed decisions: New golf winnings create linked Money entries; retain GitHub Sync. Adam labels both tokens once; Tristen only enters his token and connects. Fingerprints provide automatic attribution.
- Follow-up: Settings provides a private Info tab sourced from synced Notes for the golf rules and Adam's contacts.
- Follow-up implemented: personal Compact/Expanded views, combined Round-tagged table/details, token startup screen, desktop header placement, category save fixes, and the May 2025 ledger boundary with year-only category history.
- Scope/constraints: Static app, desktop/mobile, offline support, migration/import/recovery, no lost or duplicate edits. Preserve existing shell/Notes. Personal source data stays out of the public app repository.
- Acceptance: Exact historical import/reconciliation; correct money and golf calculations; safe linked updates; two-account concurrent/offline synchronization; responsive accessible entry flows.
- Priority/effort: Core product / High.
- Files/tests/open questions: See [implementation plan](PLAN-001-money-and-golf.md), including its Resume block and source discrepancy review.

For each wish, record: ID/title, status (Proposed/Planned/Active/Shipped/Parked), behavior and rationale, scope/constraints, acceptance criteria, priority/effort, affected files, open questions, and plan link. Add release/date when shipped. Wishes do not authorize implementation; detailed release history belongs in config.
