# Agent handoff

Read this and WISHES at session start; use the linked docs only for the task in scope. Current behavior and release history live in code, not repeated prose here.

## Product invariants

- This checkout is an SVG library with a reusable static app shell. Resetting a copy removes the library and leaves a blank workspace; normal work preserves it.
- Keep Notes as one plain-text modal, vertical Settings, separate What's New/Roadmap sections, top-bar Sync/Update, recovery, and optional cloud sync.
- Native All 1/3/5/7/9 artwork is canonical for SF Symbol weights. Custom artwork does not change weight. Preserve IDs, provenance, scoped SVG styles, paint-first attributes, and the approved aliases in `tests/fixtures/sf-symbol-merges.json`.
- Search uses names/aliases/tags/kinds/categories, not repository or source metadata. Quoted terms match whole words; apostrophe enables displayed-name-only matching. Slash and Clear reset that mode.
- Cloud data includes only user content; full backups also include device settings. Never export tokens, redirect the configured sync target from imported state, or replace data without the required recovery/confirmation.
- Keep storage namespaces and migrations stable during normal releases. Version changes must not reset user data.
- `VERSION` in config is the only release number to edit. Boot stamps assets; service-worker registration supplies the cache version. Deployment workflow name is stable; its run title uses the commit subject.
- Keep Git account/key routing machine-local; shared origin stays `git@github.com:themadat/app-template.git`.

## Read on demand

| Task | Reference |
| --- | --- |
| State, storage, sync, startup/offline | [Architecture](../docs/ARCHITECTURE.md) |
| SVG sources, compiler, metadata | [Icons](../docs/ICONS.md) |
| Dialogs, search, shortcuts | [Components](../docs/COMPONENTS.md) |
| Identity, features, releases | [Customization](../docs/CUSTOMIZATION.md) |
| Checks and manual verification | [Testing](../docs/TESTING.md) |
| New app from a copy | [Reset](../docs/RESET.md) |
| Personal/work laptop SSH | [Git setup](../docs/GIT-SETUP.md) |

No unfinished implementation is recorded here. For future in-flight work, leave a short Resume section in its existing plan or this file; remove it when complete.
