# T&A

Tristen's and Adam's Running Note for Bets, Golf, and Other Shenanigans.

Track amounts owed, repayments, and golf rounds, sorted by newest date. Adam defaults to Compact with separate Money and Golf lists; everyone else defaults to Expanded with one combined table. Change the layout in Settings → Appearance. Expanded keeps each round result and Golf Winnings in one Wins row, with a separate Bets row above it for nonzero Bet Winnings. Either winnings amount can be zero, and unknown scores stay blank without counting as ties. Editing or deleting a round updates its linked entries together. Year-filtered summaries show Money Wins/Bets and recorded-round results. Dollar Bet quick actions credit $1 to the selected winner, with editable What and optional Notes. Quick Tags separate Golf payments, Wins, Bets, Food, and Other. New rounds default to Hancock; their names show the course, holes, and result. Missing scores display UNK for each person. Mobile rows scroll below the sticky header and filters when opened; tapping empty header space returns to the top. Expanded gives more table space to Entry; mobile titles wrap across the full card. Open a round for scores, Winnings, Notes, and attribution, with one Edit action. Compact Golf aligns Results and Winnings without repeated Wins tags. Desktop Money forms put Date, Amount, and Payer/Pays/Payee on the first line; mobile centers direction and Tags. Quick-action labels are bold with regular-weight names. Desktop detail Edit sits beside the facts. Compact counts Money entries separately; Expanded replaces linked Golf Winnings with rounds and adds zero-winnings/unlinked rounds to its row count, without changing money totals. A single private Notes editor holds the extra details.

Settings includes an Info tab between Data Sync and Help. It turns the golf-rules and contacts sections of private shared Notes into a readable reference with call and email links. Those personal values stay in the private data repository and browser storage; they are not embedded in this public app repository or its deployment artifact.

The app works on desktop and mobile and saves locally, including offline. It has no runtime dependencies or required build step. Serve with `python3 -m http.server 8000`; stop afterward. Run checks with Node.js 18 or later: `node --test tests/*.test.mjs`.

## Import the running note

In Settings → Data, choose **Import running note (.txt)**. Review totals, unknown dates, discrepancies, and exact historical matches before importing. The import preserves existing content and saves recovery first. Reimporting the same note skips existing rows, including deleted rows. An edited note requires an explicit duplicate review.

Historical winnings remain separate when they disagree with Money. Review those rounds and either keep them separate, link a matching existing entry, or explicitly post winnings. The appendix is appended to Notes. Personal source files and populated backups must stay outside this public repository.

## Shared editing

The fixed destination is the private `themadat/data-t-a` repository, `main` branch, `data/t-a.json`. Money, Golf, Notes, and deletion markers sync; display preferences and credentials stay local.

1. Initialize `main` in the private data repository if it is empty. Do not put personal data in the public app repository.
2. Create two separate fine-grained tokens limited to `data-t-a`, with **Contents: Read and write**. Both may belong to Adam’s GitHub account. See [GitHub's token guide](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).
3. Adam imports the running note, then opens **Settings → Data Sync → Adam: label both tokens once**. Paste each token in its named field and choose **Save labels and sync as Adam**. Complete the first-sync review. Wait for **Both labels are shared** before sending Tristen the app link. If the upload fails, labels remain saved locally; use Sync Now after fixing the connection.
4. Tristen opens **Settings → Data Sync**, pastes only his token, and presses **Connect**. A fresh browser downloads the shared ledger, identifies him as Tristen, and enables Auto Sync automatically. No name selection, import, or separate sync setup is needed.
5. On additional devices, either person enters their assigned token and presses Connect. Remembered credentials identify the person after reload and during offline edits. While visible, Auto Sync shares changes and checks about every 30 seconds; offline changes reconcile on reconnect.
6. Verify a disposable entry added by each person appears on the other browser, then delete those entries and verify their removal. Test this before relying on live shared editing.

Only domain-separated SHA-256 fingerprints and the two names are shared. Tristen’s raw token is cleared from the owner’s setup fields and is never saved on Adam’s device. Adam’s token is retained according to the visible device/tab-storage choice. The main-page name is derived from the current token, not an editable preference. Token labels provide attribution; GitHub repository permissions still determine access. Replacing a token requires Adam to update the two labels and sync them again. Unknown tokens cannot save attributed Money/Golf entries.

Separate changes merge automatically. Competing changes to the same entry ask which version to keep; a round and its linked money are reviewed together. Notes conflicts compare the full note. No automatic decision replaces a conflicting version. Keep backups; browser storage can be cleared by the browser or device.

Never paste tokens into chat or commit them. Tokens are excluded from exports, cloud payloads, and diagnostics. The upload JSON can be inspected in Sync settings.

## Deployment

GitHub Pages uses **GitHub Actions**. The stable **Deploy App Template** workflow runs on pushes to `main` and can be run manually. It tests the app and stages only files referenced by the offline shell before deploying to [T&A](https://themadat.github.io/t-a/). Tests, docs, private data, and unreferenced artwork are excluded from the Pages artifact.

A local staging check is `node scripts/stage-site.mjs /tmp/t-a-site`. Source changes do not deploy until committed and pushed. The private data repository is independent of app deployment.

## Development

Identity, configuration, the sole current version, and releases live in `assets/js/config.js`. Preserve storage namespaces and the computer-independent SSH origin. See [Architecture](docs/ARCHITECTURE.md), [Testing](docs/TESTING.md), and [Git setup](docs/GIT-SETUP.md).
