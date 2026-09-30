# Architecture

Modules attach to `window.LocalApp`. `config.js` owns identity/releases; `boot.js` loads ordered scripts and versions assets. `ledger-ui.js` renders Money/Golf; `app.js` owns the shell. `core/` contains domain, state, storage, identity, sync, import/export, and shared controls. The worker caches the static shell; GitHub requests remain network-only.

- Money uses integer cents. Running balances follow date/order; the ledger begins May 2025. Year-only history affects category totals, not balances.
- Golf has independent Golf/Bet winnings and nullable scores. Unknown scores do not imply ties. Rounds and linked Money merge atomically; deletion markers prevent resurrection.
- Expanded combines rounds with Golf Winnings. Compact derives $0 display rows without persisting zero Money.
- Local state/backups use schema v6; cloud uses the `local-first-app-data` v2 envelope, schema v7. Preserve migrations and storage namespaces.
- Notes is one plain-text document. Preferences/UI/credentials stay local; full backups include preferences but never tokens. Token fingerprints provide attribution, not access control.
- Sync performs three-way merges against a common snapshot and fetched SHA. Same-group conflicts require review; SHA races retry. Acknowledge only the uploaded snapshot so in-flight edits survive.
- Use shared dialogs for focus/Escape/confirmation. Update saves before refreshing; failed saves/offline prevent refresh. Deployment stages only referenced runtime files.
