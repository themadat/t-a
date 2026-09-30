# Testing

Node.js 18+; no packages required.

```sh
node --test tests/*.test.mjs
for file in assets/js/*.js assets/js/core/*.js sw.js; do node --check "$file" || exit 1; done
node -e "for (const f of ['manifest.webmanifest','manifest-dark.webmanifest']) JSON.parse(require('fs').readFileSync(f,'utf8'))"
node scripts/stage-site.mjs /tmp/t-a-site
git diff --check
```

For UI changes, serve locally and check desktop/mobile, both layouts/skins, keyboard focus/Escape, overflow, and the changed behavior. For persistence changes, verify backup/recovery, migrations, conflicts, and offline reload. Stop preview servers. Mocked sync and desktop viewports do not establish real two-account sync or physical-phone behavior.
