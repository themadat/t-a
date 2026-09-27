# Shared UI

Use labelled semantic controls and `assets/js/icons.js` for standard symbols. State needs text or an accessible name as well as color/artwork.

- `components.openDialog`: remember trigger, open native modal, move focus; closing restores focus. Use confirm for destructive actions and choose for explicit sync decisions.
- `components.openMenu`: viewport-clamped popover with keyboard navigation and Escape.
- `components.toast` and `setLoading`: shared announcements and busy UI.
- Notes: one plain-text, autosaving modal; fullscreen on mobile.
- Settings: vertical icon-led tabs, separate Data Sync, Help, What's New, Roadmap, Shortcuts, and optional Developer panel. One mobile scroll surface with sticky close control.
- Appearance: system/light/dark, icons/text/both buttons, app-wide text scale, hints default off. Reduced motion follows the OS.
- App icon: click/T changes theme; hold or D/pipe toggles Developer Mode. Keep Beta separate from the version label.

## Search

Search finds the single Notes document, Help, releases, and Roadmap entries. Slash focuses and selects the query; Clear resets it. Arrow Down moves to suggestions, Enter opens the first match, and Escape closes suggestions. Render user text with escaping.

## Keyboard

Register commands in `SHORTCUTS`, declare `data-shortcut` for hints, and provide a visible action. Shift–Control–Option reveals eligible badges; hover explains them. Respect editable fields, IME, browser shortcuts, and modal focus. Chorded Clear/Update may work inside search; plain C/R must not consume typing. Use arrows for tabs and search suggestions; Escape closes temporary UI and restores focus.

The toolbar Update symbol changes when an update waits. What's New dismisses after a device-configured 1–300 seconds (default 20); contextual V/X open/dismiss it. Do not restore the removed update pop-up.
