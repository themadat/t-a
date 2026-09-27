# T&A

Tristan's and Adam's Running Note for Bets, Golf, and Other Shenanigans

A local-first app with a blank main workspace, one plain-text Notes editor, search, Settings, appearance controls, backups, recovery, and offline support. No build step or runtime dependencies.

Serve this folder with `python3 -m http.server 8000` and open http://localhost:8000. Stop the server when finished. Run automated checks with Node.js 18 or later using `node --test tests/*.test.mjs`.

## GitHub Sync

The fixed target is `themadat/data-t-a`, branch `main`, file `data/t-a.json`. Initialize that file with `{}` if it does not exist. Only Notes are uploaded; preferences remain on each device.

Create a fine-grained GitHub token limited to `data-t-a`, with Contents read/write permission. Enter it directly in Settings → Data Sync, choose device or tab storage, then Test and Save. Do this separately in each browser. Never commit the token or paste it into chat. Verify an upload and download before relying on Sync.

The repository and live Sync round trip have not yet been verified: the current CLI account received HTTP 404 for the data repository.

## Development

Identity, feature configuration, Sync target, and release history live in `assets/js/config.js`. Keep its VERSION as the sole current version literal. Editable app artwork is `assets/icons/t-a.svg`; derived light/dark install and splash assets live alongside it.

- [Architecture](docs/ARCHITECTURE.md)
- [Shared UI](docs/COMPONENTS.md)
- [Customization](docs/CUSTOMIZATION.md)
- [Verification](docs/TESTING.md)
- [Git setup](docs/GIT-SETUP.md)

Source repository: https://github.com/themadat/t-a
