# T&A

Tristan's and Adam's Running Note for Bets, Golf, and Other Shenanigans.

Track amounts owed, repayments, and golf rounds in two lists with the latest additions at the top. Golf winnings automatically create a linked Money entry. Editing or deleting the round updates its linked entries together. Annual summaries show scores, wins, ties, and betting results. A single private Notes editor holds the extra details.

The app works on desktop and mobile and saves locally, including offline. It has no runtime dependencies or required build step. Serve with `python3 -m http.server 8000`; stop afterward. Run checks with Node.js 18 or later: `node --test tests/*.test.mjs`.

## Import the running note

In Settings → Data, choose **Import running note (.txt)**. Review totals, unknown dates, discrepancies, and exact historical matches before importing. The import preserves existing content and saves recovery first. Reimporting the same note skips existing rows, including deleted rows. An edited note requires an explicit duplicate review.

Historical winnings remain separate when they disagree with Money. Review those rounds and either keep them separate, link a matching existing entry, or explicitly post winnings. The appendix is appended to Notes. Personal source files and populated backups must stay outside this public repository.

## Shared editing

The fixed destination is the private `themadat/data-t-a` repository, `main` branch, `data/t-a.json`. Money, Golf, Notes, and deletion markers sync; display preferences and credentials stay local.

1. Initialize `main` in the private data repository if it is empty. Do not put personal data in the public app repository.
2. Create two separate fine-grained tokens limited to `data-t-a`, with **Contents: Read and write**. Adam plans to issue both under his account; GitHub writes use that account, while the app's **Adding as** selection records Adam or Tristan. See [GitHub's token guide](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).
3. On the first browser, select your name and import the note. In Settings → Data Sync enter one token, choose tab or device storage, Test and Save. Use **Sync Now**, review, then create the shared file.
4. On the other browser, select the other name, enter the second token, and use **Sync Now** to combine with the shared ledger. It is unnecessary to import the note a second time.
5. Enable **Auto Sync** on each browser after the first successful sync. While visible, the app shares saved changes and checks about every 30 seconds. Offline changes queue locally and reconcile on reconnect.
6. Verify a disposable entry added by each person appears on the other browser, then delete those entries and verify their removal. Test this before relying on live shared editing.

Separate changes merge automatically. Competing changes to the same entry ask which version to keep; a round and its linked money are reviewed together. Notes conflicts compare the full note. No automatic decision replaces a conflicting version. Keep backups; browser storage can be cleared by the browser or device.

Never paste tokens into chat or commit them. Tokens are excluded from exports, cloud payloads, and diagnostics. The upload JSON can be inspected in Sync settings.

## Deployment

GitHub Pages uses **GitHub Actions**. The stable **Deploy App Template** workflow runs on pushes to `main` and can be run manually. It tests the app and stages only files referenced by the offline shell before deploying to [T&A](https://themadat.github.io/t-a/). Tests, docs, private data, and unreferenced artwork are excluded from the Pages artifact.

A local staging check is `node scripts/stage-site.mjs /tmp/t-a-site`. Source changes do not deploy until committed and pushed. The private data repository is independent of app deployment.

## Development

Identity, configuration, the sole current version, and releases live in `assets/js/config.js`. Preserve storage namespaces and the computer-independent SSH origin. See [Architecture](docs/ARCHITECTURE.md), [Testing](docs/TESTING.md), and [Git setup](docs/GIT-SETUP.md).
