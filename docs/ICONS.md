# Icon library maintenance

The committed four `assets/js/icon-library-part-*.js` files and small assembler contain the complete catalog without a runtime build. Keep each part below GitHub's 50 MB warning threshold.

## Sources and compile

Store supplied custom SVGs in `assets/custom-symbols/`; preserve path geometry and masks. Monochrome custom icons can use currentColor for theme visibility. Native All 1 Ultralight/Ultrathin, All 3 Light, All 5 Medium, All 7 Bold, and All 9 Black are canonical for SF Symbol weights. Never synthesize thickness or prefer unrelated app variants over these folders.

```sh
node build/compile-icon-library.mjs
# Or scan only selected roots, retaining the existing catalog:
node build/compile-icon-library.mjs /path/to/source
```

Default discovery scans nonhidden sibling apps plus configured children of `!backups:data/icons/app-input`. The broad backup parent, generated dist files, and SVG Converter's aggregate !All roll-up are excluded. Explicit roots use their basename as source identity.

The compiler accepts complete SVG template literals, inline sf-symbol SVGs, and standalone SVGs up to 256 KB. It strips XML wrappers, rejects unsafe scripts/references/templates, scopes embedded CSS once, deduplicates artwork, and retains provenance and stable IDs. Paint-first formatting preserves values. Rebuilds must keep existing styles/scopes and approved IDs stable.

Only aliases listed in `SF_SYMBOL_CANONICAL_NAME` merge. The fixture in `tests/fixtures/sf-symbol-merges.json` covers 50 retired source aliases into 49 canonical cards; other distinct native names stay separate even if artwork matches.

## Metadata

Merge exported overrides into `build/icon-library-overrides.json`, then compile. Wrapped or plain-array formats accept iconId, label, categories, optional kind/source, and exactCategories. Wrapped files also support excludedIconIds. Exact category replacement preserves intentional removals; child categories gain required ancestors. Device overrides never erase original provenance and become redundant once baked.

Categories separate semantic What it is from alphabetized How it looks. Use precise semantic placements: People for people/body parts; Geography distinguishes Countries/Regions, Mapping tools, and Places. Prefer existing or nested groups. Every retained icon needs a group; avoid catch-all Other for new artwork.

After import, compare old/new records, supplied paths, weights, names and IDs. Verify search, filters, copied SVGs, light/dark appearance, and metadata editing. Run the compiler regression tests. Counts and exhaustive category names belong in generated data and tests, not duplicated throughout docs.
