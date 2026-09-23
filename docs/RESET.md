# Reset a copied template

`reset` transforms a copied repository into a new app at `0.0.1.1`. Keep the latest shell improvements; do not revert Git history. This is an agent source transformation, separate from the in-app preference reset.

## Prepare

Create a new repository from the template, configure terminal SSH using [Git setup](GIT-SETUP.md), and clone its standard `git@github.com:themadat/NEW-APP-SLUG.git` URL. Open that checkout and provide:

- Confirmed app name, one-sentence description, source repository URL.
- Square SVG/PNG app icon; separate light/dark variants if desired.
- Sync enabled/disabled; when enabled, owner themadat, repository app-data, branch main, unique path data/NEW-APP-SLUG.json.

Do not include a token in the request.

## Preflight

Inspect cwd, Git status, and origin. Never transform the canonical app-template directory/remote without explicit confirmation of that exact target and new identity. Preserve unrelated changes; require a clean tree unless pending work belongs to the reset. Obtain/confirm the app name and icon source before editing; use already supplied choices and ask only for missing or ambiguous values. List exact deletion targets before removing them. Do not change Git history/remotes, create repositories, commit, push, or deploy without authorization.

## Keep and transform

Keep the static shell, top-bar search/Sync/Update, single Notes modal, vertical Settings, appearance, generic Help/releases/Roadmap/shortcuts, recovery, backup/import, optional Sync, accessibility, and PWA/install infrastructure. The main workspace becomes blank.

Before removing the catalog, inventory every retained data-symbol, icons.markup/set call, component/config symbol, sync state, dialog, and update icon. Bake their exact SVGs into icons.js, remove catalog fallback, and verify they render without catalog scripts.

Remove generated catalog parts/assembler, compiler/overrides and custom product artwork, catalog UI/dialogs, render/filter/edit/copy code, catalog state/search/shortcuts/hints, CSS, cache/script entries, tests/fixtures, obsolete wishes/plans, and product-specific prose. Preserve shell icon assets and utilities. Remove only template-specific compatibility; retained Notes/backup/sync must still function.

## Identity and starter state

- Set config VERSION to 0.0.1.1 and keep one initial release using VERSION. No version literals elsewhere.
- Autofill confirmed name, short name, slug, description, repository/support URLs, HTML/manifest metadata, download names, storage/recovery/secret namespaces, install identity, and unique cloud path.
- Replace favicon, header icons, editable source, install 192/512px, 512px maskable (central 80%), 180px touch, and light/dark splash variants using the supplied artwork.
- Start Notes blank, Roadmap empty with its empty state, Help and shortcuts limited to retained features, WISHES empty at WISH-001.
- Rewrite README and relevant docs around the new product. Keep this reset contract and Git setup useful for later copies. Remove old product samples/references.

## Provision sync

If enabled:
1. Create data/APP-SLUG.json on main in [app-data/data](https://github.com/themadat/app-data/tree/main/data), initially `{}`. Set the config target to that exact file.
2. Create a token in [fine-grained token settings](https://github.com/settings/personal-access-tokens): resource owner themadat, only app-data, **Contents: Read and write**, maintainable expiration. Permission covers the selected repository, not only this JSON path.
3. Enter the token in Settings → Data Sync, choose device/tab storage, Test and Save. Configure each browser separately. Never put it in source, data JSON, backups, diagnostics, logs, or chat.
4. Verify the file, displayed target, successful Test, and first upload/download round trip before marking sync provisioning complete. Report any external setup still pending.

## Verify

Review the deletion list, search for old identity/product references, and confirm namespaces are unique. Every retained symbol must resolve without LocalApp.iconLibrary/catalog fallbacks. The app must load without deleted scripts, show a blank main workspace, and retain Notes, all Settings pages, backup/recovery, sync, appearance, shortcuts, and offline Update behavior.

Run [Testing](TESTING.md), inspect desktop/mobile, check replacement icon variants, confirm one initial release and empty Roadmap/Notes/WISHES, stop the server, and hand off the scoped commit command. Reset alone never authorizes committing or pushing.
