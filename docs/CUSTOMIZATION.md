# Customization

For a new product from a copied repository, follow [Reset](RESET.md). For SSH on either laptop, see [Git setup](GIT-SETUP.md).

## Configuration

Edit `assets/js/config.js`: identity, repository/support URLs, fixed cloud target, flags, Help, Roadmap, and releases. Identity changes also require fallback HTML metadata, both manifests, storage namespaces for a new app, and replacement app/favicon/install assets. Ordinary releases do not change storage namespaces.

Theme variables live in CSS with config defaults. Keep system appearance and OS reduced motion. Add only concrete modules: state defaults/normalization/migration, labelled markup, render/events, responsive styles, and content-only sync/export where appropriate.

## Release

Change `VERSION` in config. The format is `major.minor.patch.build`; increment build normally, or use build 1 after changing major/minor/patch. Add a dated entry first in `releases` using `version: VERSION`; replace the previous first entry's VERSION reference with its old number. Identity/buildId, boot asset queries, visible labels, and service-worker cache names follow automatically.

Do not edit versions in HTML, manifests, workflow names, or documentation. The workflow uses a stable name and the commit subject for its run title. Validate using [Testing](TESTING.md), then use commit subject `Version - Text`.

## Assets and modules

Use square SVG artwork for editable app/favicon variants; export 192/512px install icons, 512px maskable icons (important content within central 80%), 180px touch icons, and matching splash assets. Keep light/dark variants and referenced paths aligned.

For catalog changes use [Icons](ICONS.md). When removing a module, remove its inert script declaration and service-worker cache entry as well as UI/events. Keep backward-compatible state for existing apps. A new-app reset can discard template-only compatibility.

GitHub Sync's target is read-only in the UI and reapplied during normalization. Set it in config; follow the file/token checklist in [Reset](RESET.md#provision-sync). Never include credentials in source or shared JSON.
