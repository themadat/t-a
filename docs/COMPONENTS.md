# Shared UI

Use labelled semantic controls and `assets/js/icons.js` for standard symbols. State needs text or an accessible name as well as color/artwork.

- `components.openDialog`: remember trigger, open native modal, move focus; closing restores focus. Use confirm for destructive actions and choose for explicit sync decisions.
- `components.openMenu`: viewport-clamped popover with keyboard navigation and Escape.
- `components.toast` and `setLoading`: shared announcements and busy UI.
- Notes: one plain-text, autosaving modal; fullscreen on mobile.
- Settings: vertical icon-led tabs, separate Data Sync, Help, What's New, Roadmap, Shortcuts, and optional Developer panel. One mobile scroll surface with sticky close control.
- Appearance: system/light/dark, icons/text/both buttons, app-wide text scale, hints default off. Reduced motion follows the OS.
- App icon: click/T changes theme; hold or D/pipe toggles Developer Mode. Keep Beta separate from the version label.

## Search and catalog

Search matches names, aliases, tags, kinds, and categories, excluding provenance. Quoted words/phrases require whole matches; unquoted terms match partially, all terms required. Apostrophe enables displayed-name-only mode; slash focuses/selects the query and disables it. Clear resets filters and this mode. Suggestions and highlights use the same matching rules.

Cards render in batches of 500, preview click copies SVG, name click edits metadata, and info shows provenance. Right-click selected-category removal offers Undo. Type/Source share a row; weights affect previews/details/copied SF Symbols only. The desktop rail resizes and persists; mobile uses horizontal categories. Collapsing a selected branch moves selection to its parent. Keep category CSS isolated from SVG artwork.

## Keyboard

Register commands in `SHORTCUTS`, declare `data-shortcut` for hints, and provide a visible action. Shift–Control–Option reveals eligible badges; hover explains them. Respect editable fields, IME, browser shortcuts, and modal focus. Chorded Clear/Update may work inside search; plain C/R must not consume typing. Use arrows for tabs, categories, and cards; Escape closes temporary UI and restores focus.

The toolbar Update symbol changes when an update waits. What's New dismisses after a device-configured 1–300 seconds (default 20); contextual V/X open/dismiss it. Do not restore the removed update pop-up.
